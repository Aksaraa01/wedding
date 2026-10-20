import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

// POST /api/ops/queue/[id]/invitation-log
// Audit trail for invitation-data edits made from the ops console
// (Detail Undangan Digital modal). The couple editor's own autosaves must NOT
// hit this route — only explicit ops saves — so the timeline stays readable.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const body = await req.json()
    const { details, wedding_profile_id } = body

    if (!details || typeof details !== "string") {
      return NextResponse.json({ error: "details wajib diisi" }, { status: 400 })
    }

    // Resolve the queue: direct id, or latest queue for a wedding profile
    // (used when only the profile is known, e.g. feedback submitted from a
    // couple page opened by ops).
    let queueId = id
    if (wedding_profile_id && id === "by-profile") {
      const { data: queues } = await supabaseAdmin
        .from("ops_queue")
        .select("id")
        .eq("wedding_profile_id", wedding_profile_id)
        .order("created_at", { ascending: false })
        .limit(1)
      if (!queues || queues.length === 0) {
        return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
      }
      queueId = queues[0].id
    }

    const { error } = await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: queueId,
      kind: "invitation",
      previous_status: null,
      new_status: null,
      previous_package: null,
      new_package: null,
      details: details.slice(0, 500),
      changed_by_employee_id: auth.employee.id,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
