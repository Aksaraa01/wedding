import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function firstPart(name: string): string {
  return (name || "").trim().split(/\s+/)[0]?.toLowerCase() || ""
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name1 = searchParams.get("name1") || ""
  const name2 = searchParams.get("name2") || ""

  const first1 = firstPart(name1)
  const first2 = firstPart(name2)
  if (!first1 || !first2) {
    return NextResponse.json({ exists: false })
  }

  const slug = `${first1}-${first2}`

  try {
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("slug")
      .eq("slug", slug)
      .limit(1)

    return NextResponse.json({ exists: !!(data && data.length > 0) })
  } catch {
    return NextResponse.json({ exists: false, error: "db_unavailable" })
  }
}
