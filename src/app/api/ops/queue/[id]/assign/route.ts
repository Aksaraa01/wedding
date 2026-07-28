import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { employee_id } = await req.json()

    const { error } = await supabaseAdmin
      .from("ops_queue")
      .update({ assigned_to: employee_id || null })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
