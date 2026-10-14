import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res
  try {
    const { id, key } = await params
    const { status, client_note, image_url } = await req.json()

    if (!["butuh_tindakan", "aktif", "selesai"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (client_note !== undefined) updateData.client_note = client_note
    if (image_url !== undefined) updateData.image_url = image_url

    const { error } = await supabaseAdmin
      .from("feature_actions")
      .update(updateData)
      .eq("ops_queue_id", id)
      .eq("feature_key", key)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
