import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, wedding_profile_id, kind, status, attempts, last_error, result, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json(data)
}