import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const start = Date.now()
  let db = "ok"
  try {
    const { error } = await supabaseAdmin.from("wedding_profiles").select("id").limit(1).single()
    if (error && error.code !== "PGRST116") db = error.message
  } catch (e) { db = String(e) }
  return NextResponse.json({ status: "ok", db, uptime: process.uptime(), latencyMs: Date.now() - start })
}
