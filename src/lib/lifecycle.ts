import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"
import { getPhotoRetentionDays } from "@/lib/appSettings"

// Lifecycle math shared by the Clearance console and the /w,/g,/welcome guards.
// All durations come from the DB (packages.active_period_months + app_settings),
// never hardcoded. Pure date helpers are client-safe; the async readers are
// server-only (they touch supabaseAdmin).

export type LifecycleProfile = {
  package_type: string | null
  sessions: unknown
  estimated_wedding_date: string | null
  galeri_addon?: boolean | null
  gallery_end_at?: string | null
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todayIso(): string {
  return isoDate(new Date())
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)
}

// Last acara session date (max), falling back to the registration estimate.
export function lastEventDate(sessions: unknown, estimated: string | null): string | null {
  let latest: string | null = null
  if (Array.isArray(sessions)) {
    for (const s of sessions) {
      const d = typeof (s as { date?: unknown })?.date === "string" ? (s as { date: string }).date.slice(0, 10) : null
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        if (!latest || d > latest) latest = d
      }
    }
  }
  if (latest) return latest
  return estimated ? estimated.slice(0, 10) : null
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

// Add calendar months, clamping the day to the target month's last day
// (e.g. 2026-01-31 + 1 month -> 2026-02-28).
export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const firstOfTarget = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)).getUTCDate()
  firstOfTarget.setUTCDate(Math.min(d, lastDay))
  return firstOfTarget.toISOString().slice(0, 10)
}

// Days from `todayIso` to `iso`. Negative = already past.
export function daysUntil(iso: string, todayIsoStr: string = todayIso()): number {
  const a = Date.parse(todayIsoStr + "T00:00:00Z")
  const b = Date.parse(iso + "T00:00:00Z")
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / 86_400_000)
}

export async function getActivePeriodMonths(packageType: string): Promise<number | null> {
  return cachedRead(`active-period:${packageType}`, 10 * 60_000, async () => {
    const { data } = await supabaseAdmin
      .from("packages")
      .select("active_period_months")
      .eq("code", packageType)
      .maybeSingle()
    const v = (data as { active_period_months?: number | null } | null)?.active_period_months
    return v === undefined || v === null ? null : Number(v)
  })
}

// "Digital" = everything except standalone Galeri Tamu (gt), which has no
// invitation and therefore no masa aktif.
export function isDigitalPackage(packageType: string | null | undefined): boolean {
  return !!packageType && packageType !== "gt"
}

export function hasGaleri(p: Pick<LifecycleProfile, "package_type" | "galeri_addon">): boolean {
  return p.package_type === "gt" || p.galeri_addon === true
}

export type Lifecycle = {
  lastEventDate: string | null
  activePeriodMonths: number | null
  activeUntil: string | null // ISO date the invitation masa aktif ends
  photoBaseDate: string | null // end of the photo window
  photoDeletionDate: string | null // ISO date photos become eligible for deletion
}

export type DueDates = { invitationDue: string | null; photosDue: string | null }

// Both lifecycle due dates for a profile (used by the board and to decide the
// combined teardown). Retention comes from the DB.
export async function computeDueDates(p: LifecycleProfile): Promise<DueDates> {
  const retentionDays = await getPhotoRetentionDays()
  const life = await computeLifecycle(p, retentionDays)
  // A lifecycle only "exists" if the couple is eligible for it: invitations
  // for digital packages (everything but standalone Galeri Tamu), photos only
  // when the profile has a galeri (standalone or add-on). Otherwise a digital
  // profile would get a phantom photos due-date and its galeri-less teardown
  // would run for no reason.
  return {
    invitationDue: isDigitalPackage(p.package_type) ? life.activeUntil : null,
    photosDue: hasGaleri(p) ? life.photoDeletionDate : null,
  }
}

export async function computeLifecycle(p: LifecycleProfile, retentionDays: number): Promise<Lifecycle> {
  const last = lastEventDate(p.sessions, p.estimated_wedding_date)
  const months = p.package_type ? await getActivePeriodMonths(p.package_type) : null
  const activeUntil = last && months != null ? addMonthsIso(last, months) : null

  // Galeri (standalone or add-on) uses the stored event window end; otherwise
  // fall back to the last acara session date (mirrors the photo-retention rule).
  let photoBase: string | null = null
  if (hasGaleri(p) && isIsoDate(p.gallery_end_at)) photoBase = (p.gallery_end_at as string).slice(0, 10)
  else photoBase = last
  const photoDeletionDate = photoBase ? addDaysIso(photoBase, retentionDays) : null

  return { lastEventDate: last, activePeriodMonths: months, activeUntil, photoBaseDate: photoBase, photoDeletionDate }
}
