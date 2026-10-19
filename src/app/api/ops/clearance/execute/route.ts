import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { executeClearance, type ClearanceKind } from "@/lib/clearanceExecutor"
import { computeDueDates, todayIso, type LifecycleProfile } from "@/lib/lifecycle"

// A single execute clears a lifecycle. When the OTHER lifecycle is also due on
// the same execution day (its due date <= today), it is cleared in the same
// action too — so a couple whose invitation and galeri fall due together never
// leaves half its data behind.

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => ({}))
  const profileId = body?.profileId as string | undefined
  const kind = body?.kind as string | undefined
  if (!profileId || (kind !== "photos" && kind !== "invitation")) {
    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 })
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("sessions, estimated_wedding_date, package_type, galeri_addon, gallery_end_at")
      .eq("id", profileId)
      .maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    const today = todayIso()
    const { invitationDue, photosDue } = await computeDueDates(profile as LifecycleProfile)
    const dueFor: Record<ClearanceKind, string | null> = { invitation: invitationDue, photos: photosDue }

    const targets: { kind: ClearanceKind; dueAt: string }[] = [
      { kind, dueAt: dueFor[kind] || today },
    ]
    const other: ClearanceKind = kind === "invitation" ? "photos" : "invitation"
    const otherDue = dueFor[other]
    if (otherDue && otherDue <= today) {
      targets.push({ kind: other, dueAt: otherDue })
    }

    const results = []
    for (const t of targets) {
      const r = await executeClearance(profileId, t.kind, auth.employee.id, t.dueAt)
      results.push({ kind: t.kind, ok: r.ok, status: r.status, error: r.error, deletedMedia: r.deletedMedia, deletedPhotos: r.deletedPhotos })
    }

    const allOk = results.every((r) => r.ok)
    const firstError = results.find((r) => !r.ok)?.error
    return NextResponse.json(
      {
        ok: allOk,
        status: allOk ? "done" : "partial",
        error: firstError,
        deletedMedia: results.reduce((n, r) => n + r.deletedMedia, 0),
        deletedPhotos: results.reduce((n, r) => n + r.deletedPhotos, 0),
        results,
      },
      { status: allOk ? 200 : 500 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
