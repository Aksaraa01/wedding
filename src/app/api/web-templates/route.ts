import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const packageType = url.searchParams.get("package_type")

  let query = supabaseAdmin
    .from("web_templates")
    .select("id,code,name,preview_image_url,demo_url,category,tier,package_eligibility,sort_order,is_active,source_type,wp_master_slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

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

  return NextResponse.json({ templates: data }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } })
}
