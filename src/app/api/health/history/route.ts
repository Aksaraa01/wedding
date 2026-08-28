import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("health_logs")
    .select("created_at, latency_ms, db_status")
    .order("created_at", { ascending: false })
    .limit(48)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: (data || []).reverse() })
}
