import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("x-cron-secret") || ""
  const expected = process.env.CRON_SECRET || process.env.WP_INTERNAL_SECRET || ""
  if (expected && !auth.includes(expected)) {
    const url = new URL(req.url)
    if (url.searchParams.get("secret") !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  const start = Date.now()
  let db = "ok"
  try {
    const { error } = await supabaseAdmin.from("wedding_profiles").select("id").limit(1).single()
    if (error && (error as any).code !== "PGRST116") db = (error as any).message
  } catch (e) { db = String(e) }
  const latency = Date.now() - start
  await supabaseAdmin.from("health_logs").insert({ latency_ms: latency, db_status: db, uptime_seconds: process.uptime() })
  const { count } = await supabaseAdmin.from("health_logs").select("id", { count: "exact", head: true })
  if ((count || 0) > 1000) {
    const { data: old } = await supabaseAdmin.from("health_logs").select("id").order("created_at", { ascending: true }).limit(200)
    if (old?.length) await supabaseAdmin.from("health_logs").delete().in("id", old.map(r => r.id))
  }
  return NextResponse.json({ ok: true, latency, db })
}
