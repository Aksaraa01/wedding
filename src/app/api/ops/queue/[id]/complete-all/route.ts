import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: actions, error: fetchError } = await supabaseAdmin
      .from("feature_actions")
      .select("id")
      .eq("ops_queue_id", id)
      .neq("status", "selesai")

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("feature_actions")
      .update({ status: "selesai", updated_at: new Date().toISOString() })
      .eq("ops_queue_id", id)
      .neq("status", "selesai")

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: actions.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
