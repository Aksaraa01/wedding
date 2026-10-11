import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { getPublishBlockers } from "@/lib/publishBlockers"

// POST /api/ops/queue/[id]/confirm — confirm the invitation from the ops
// console on the couple's behalf (same completeness gate as the couple's own
// Konfirmasi). Admin + sales. Idempotent: already-published returns success.
// Every confirmation is logged to the unified queue timeline (kind "publish").
// Body { force: true } publishes even with blockers (logged as DIPAKSA).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    let force = false
    try {
      const body = await req.json().catch(() => null)
      force = (body as any)?.force === true
    } catch { force = false }
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, wedding_profile_id")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const profileId = queueItem.wedding_profile_id as string
    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, is_published, published_at")
      .eq("id", profileId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    if (profile.is_published === true) {
      return NextResponse.json({ success: true, already: true })
    }

    const incomplete = await getPublishBlockers(profileId)
    if (incomplete.length > 0 && !force) {
      return NextResponse.json(
        { error: "Konten undangan belum lengkap.", incomplete },
        { status: 422 },
      )
    }
    const forcedLabels = force ? incomplete.map((s: any) => s.label).filter(Boolean) : []

    const updates: Record<string, any> = { is_published: true }
    if (!profile.published_at) updates.published_at = new Date().toISOString()

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update(updates)
      .eq("id", profileId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id, name")
      .eq("phone_number", phone)
      .maybeSingle()
    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "publish",
      details: (`Undangan dikonfirmasi oleh ${(emp as any)?.name || "ops"} • ${profile.groom_name || ""} & ${profile.bride_name || ""}${forcedLabels.length > 0 ? ` • DIPAKSA meski belum lengkap: ${forcedLabels.join(", ")}` : ""}`).slice(0, 500),
      changed_by_employee_id: (emp as any)?.id || null,
    })

    return NextResponse.json({ success: true, ...(forcedLabels.length > 0 ? { forced: true, incomplete } : {}) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
