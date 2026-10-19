import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { resolveCoupleName } from "@/lib/coupleName"
import { PACKAGE_LABELS, normalizePhone } from "@/lib/packages"
import { getPhotoRetentionDays, getClearanceReminderDays } from "@/lib/appSettings"
import {
  lastEventDate,
  addDaysIso,
  addMonthsIso,
  daysUntil,
  todayIso,
  hasGaleri,
  isDigitalPackage,
  isIsoDate,
} from "@/lib/lifecycle"
import { buildClearanceMessage, buildWaMeUrl } from "@/lib/clearanceMessage"

const BASE_COLS =
  "id, bride_name, groom_name, bride_full_name, groom_full_name, slug, whatsapp_number, package_type, galeri_addon, galeri_tier, gallery_end_at, sessions, estimated_wedding_date, is_published, wa_blast_tier, express_service, invitation_disabled_at"

type Profile = {
  id: string
  bride_name: string | null
  groom_name: string | null
  bride_full_name: string | null
  groom_full_name: string | null
  slug: string | null
  whatsapp_number: string | null
  package_type: string | null
  galeri_addon: boolean | null
  galeri_tier: string | null
  gallery_end_at: string | null
  sessions: unknown
  estimated_wedding_date: string | null
  is_published: boolean | null
  wa_blast_tier: number | null
  express_service: boolean | null
  invitation_disabled_at: string | null
}

function addonsFor(p: Profile): string[] {
  const a: string[] = []
  if (p.galeri_addon === true && p.package_type !== "gt") a.push("Galeri Foto Tamu")
  if ((p.wa_blast_tier || 0) > 0) a.push(`WA Blast ${p.wa_blast_tier}`)
  if (p.express_service === true) a.push("Express")
  return a
}

export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const [retentionDays, reminderDays] = await Promise.all([
      getPhotoRetentionDays(),
      getClearanceReminderDays(),
    ])
    const today = todayIso()

    const { data: pkgs } = await supabaseAdmin.from("packages").select("code, active_period_months")
    const monthsByCode: Record<string, number | null> = {}
    for (const p of pkgs || []) {
      monthsByCode[(p as { code: string }).code] = (p as { active_period_months: number | null })
        .active_period_months
    }

    const [{ data: fotoProfiles }, { data: undanganProfiles }] = await Promise.all([
      supabaseAdmin
        .from("wedding_profiles")
        .select(BASE_COLS)
        .eq("payment_status", "FULLY_PAID")
        .or("package_type.eq.gt,galeri_addon.eq.true"),
      supabaseAdmin
        .from("wedding_profiles")
        .select(BASE_COLS)
        .eq("is_published", true)
        .not("package_type", "is", null)
        .neq("package_type", "gt"),
    ])

    const byId = new Map<string, Profile>()
    for (const p of [...(fotoProfiles || []), ...(undanganProfiles || [])] as Profile[]) byId.set(p.id, p)
    const candidateIds = [...byId.keys()]

    const photoCount: Record<string, number> = {}
    const actionByKey: Record<string, { status: string; reminded_at: string | null; executed_at: string | null; last_error: string | null }> = {}
    if (candidateIds.length) {
      const [{ data: photoRows }, { data: acts }] = await Promise.all([
        supabaseAdmin.from("guest_photos").select("wedding_profile_id").in("wedding_profile_id", candidateIds),
        supabaseAdmin
          .from("clearance_actions")
          .select("wedding_profile_id, kind, status, reminded_at, executed_at, last_error")
          .in("wedding_profile_id", candidateIds),
      ])
      for (const r of (photoRows || []) as { wedding_profile_id: string }[]) {
        photoCount[r.wedding_profile_id] = (photoCount[r.wedding_profile_id] || 0) + 1
      }
      for (const a of (acts || []) as {
        wedding_profile_id: string
        kind: string
        status: string
        reminded_at: string | null
        executed_at: string | null
        last_error: string | null
      }[]) {
        actionByKey[`${a.wedding_profile_id}:${a.kind}`] = a
      }
    }

    type BoardRow = Record<string, unknown>
    const reminder: { invitation: BoardRow[]; photos: BoardRow[] } = { invitation: [], photos: [] }
    const execute: { invitation: BoardRow[]; photos: BoardRow[] } = { invitation: [], photos: [] }

    for (const p of byId.values()) {
      const last = lastEventDate(p.sessions, p.estimated_wedding_date)
      const months = p.package_type ? monthsByCode[p.package_type] ?? null : null
      const invitationDate =
        isDigitalPackage(p.package_type) && last && months != null ? addMonthsIso(last, months) : null

      const hasG = hasGaleri(p)
      const photoBase = hasG && isIsoDate(p.gallery_end_at) ? (p.gallery_end_at as string).slice(0, 10) : last
      const photoDate = hasG && photoBase ? addDaysIso(photoBase, retentionDays) : null

      const addons = addonsFor(p)
      const packageLabel = PACKAGE_LABELS[p.package_type || ""] || p.package_type || "-"
      const couple = resolveCoupleName(p)

      const buildRow = (kind: "invitation" | "photos", dueDate: string): BoardRow => {
        const action = actionByKey[`${p.id}:${kind}`]
        const message = buildClearanceMessage({
          coupleName: couple,
          packageLabel,
          addons,
          activeUntil: invitationDate,
          photoDeletionDate: photoDate,
          dashboardUrl: `https://wedding.aksaraa.com/dashboard/${p.id}`,
        })
        return {
          kind,
          profile_id: p.id,
          couple,
          slug: p.slug,
          package_type: p.package_type,
          package_label: packageLabel,
          addons,
          whatsapp_number: p.whatsapp_number,
          event_date: last,
          due_date: dueDate,
          days_left: daysUntil(dueDate, today),
          invitation_date: invitationDate,
          photo_date: photoDate,
          photo_count: photoCount[p.id] || 0,
          status: action?.status || "pending",
          reminded_at: action?.reminded_at || null,
          executed_at: action?.executed_at || null,
          last_error: action?.last_error || null,
          message,
          wa_url: buildWaMeUrl(normalizePhone(p.whatsapp_number || ""), message),
          already_disabled: !!p.invitation_disabled_at,
        }
      }

      if (invitationDate) {
        const status = actionByKey[`${p.id}:invitation`]?.status
        if (status !== "done") {
          const dl = daysUntil(invitationDate, today)
          const row = buildRow("invitation", invitationDate)
          if (dl <= 0) execute.invitation.push(row)
          else if (dl <= reminderDays) reminder.invitation.push(row)
        }
      }

      if (photoDate && (photoCount[p.id] || 0) > 0) {
        const status = actionByKey[`${p.id}:photos`]?.status
        if (status !== "done") {
          const dl = daysUntil(photoDate, today)
          const row = buildRow("photos", photoDate)
          if (dl <= 0) execute.photos.push(row)
          else if (dl <= reminderDays) reminder.photos.push(row)
        }
      }
    }

    const sortRows = (rows: BoardRow[]) =>
      rows.sort((a, b) => (a.days_left as number) - (b.days_left as number))
    sortRows(reminder.invitation)
    sortRows(reminder.photos)
    sortRows(execute.invitation)
    sortRows(execute.photos)

    return NextResponse.json({
      today,
      settings: { retentionDays, reminderDays },
      tabs: {
        invitation: { reminder: reminder.invitation, execute: execute.invitation },
        photos: { reminder: reminder.photos, execute: execute.photos },
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
