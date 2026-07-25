import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("q") || ""

  const slug = raw
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim()

  if (!slug) {
    return NextResponse.json({ available: false, slug: "" })
  }

  try {
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle()

    return NextResponse.json({ available: !data, slug })
  } catch {
    return NextResponse.json({ available: true, slug, error: "db_unavailable" })
  }
}
