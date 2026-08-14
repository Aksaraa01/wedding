import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const profileId = searchParams.get("profile_id")

  if (!profileId) {
    return NextResponse.json({ error: "profile_id wajib diisi" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, wedding_profile_id, kind, status, attempts, last_error, result, created_at, updated_at")
    .eq("wedding_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: data || [] })
}