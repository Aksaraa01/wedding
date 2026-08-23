import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""
const CRON_SECRET = process.env.CRON_SECRET || WP_SECRET

function wpHeaders() {
  return { "X-Aksaraa-Secret": WP_SECRET, "Content-Type": "application/json" }
}

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret") || req.headers.get("x-aksaraa-secret") || ""
  if (auth !== CRON_SECRET && auth !== WP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profiles, error } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, slug, active_wp_post_id")
    .not("slug", "is", null)
    .not("active_wp_post_id", "is", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let queued = 0
  let cleaned = 0
  for (const p of profiles || []) {
    if (!p.slug || !p.active_wp_post_id) continue
    const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/cleanup`, {
      method: "POST",
      headers: wpHeaders(),
      body: JSON.stringify({ base_slug: p.slug, keep_post_id: p.active_wp_post_id }),
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json().catch(() => ({}))
      if ((data.deleted_posts || 0) > 0 || (data.deleted_popups || 0) > 0) cleaned++
    }
    queued++
    if (queued % 20 === 0) await new Promise((r) => setTimeout(r, 200))
  }

  return NextResponse.json({ scanned: profiles?.length || 0, cleaned_profiles: cleaned })
}

export async function GET(req: Request) {
  return POST(req)
}
