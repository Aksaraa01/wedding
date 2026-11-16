import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const packageType = url.searchParams.get("package_type")
  // Event family filter: the Ceriavite gallery must never list wedding designs
  // (and vice versa). Absent = every family (ops management views).
  const event = url.searchParams.get("event")
  // Dashboard/ops callers opt out of the shared cache so package_eligibility
  // edits show up immediately (the public marketing lists keep caching).
  const fresh = url.searchParams.get("fresh") === "1"

  let query = supabaseAdmin
    .from("web_templates")
    .select("id,code,name,description,preview_image_url,demo_url,category,tier,package_eligibility,sort_order,is_active,source_type,wp_master_slug,no_photo,popular_rank,created_at,event_type")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (event === "kids" || event === "wedding") {
    query = query.eq("event_type", event)
  }

  // WP template management: users only see templates eligible for their package.
  // Legacy templates with empty package_eligibility are shown to everyone.
  if (packageType) {
    // jsonb contains: package_eligibility @> '["signature"]'  (the array contains the package)
    query = query.or(`package_eligibility.cs.["${packageType}"],package_eligibility.is.null`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cacheHeaders = fresh
    ? { "Cache-Control": "no-store" }
    : { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
  return NextResponse.json({ templates: data }, { headers: cacheHeaders })
}
