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
    const { details } = await req.json()

    if (!details || typeof details !== "string") {
      return NextResponse.json({ error: "details wajib diisi" }, { status: 400 })
    }

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle()

    const { error } = await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "invitation",
      previous_status: null,
      new_status: null,
      previous_package: null,
      new_package: null,
      details: details.slice(0, 500),
      changed_by_employee_id: emp?.id || null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
