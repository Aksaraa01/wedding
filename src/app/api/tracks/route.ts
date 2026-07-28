import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mood = searchParams.get("mood")

  let query = supabaseAdmin
    .from("web_tracks")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (mood) {
    query = query.eq("mood_category", mood)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tracks: data })
}
