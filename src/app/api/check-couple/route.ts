import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { slugifyCouple, MAX_COUPLE_SLUG_LENGTH } from "@/lib/slug"
import { isReservedSlug } from "@/lib/reservedSlugs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name1 = searchParams.get("name1") || ""
  const name2 = searchParams.get("name2") || ""

  const slug = slugifyCouple(name1, name2)
  if (!slug) {
    return NextResponse.json({ exists: false })
  }

  // Reserved = the address collides with a platform host, so it is never
  // available even though no profile owns it.
  if (isReservedSlug(slug)) {
    return NextResponse.json({
      exists: true,
      reserved: true,
      slug,
      tooLong: false,
    })
  }

  try {
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("slug")
      .eq("slug", slug)
      .limit(1)

    return NextResponse.json({
      exists: !!(data && data.length > 0),
      slug,
      // The slug becomes the invitation subdomain; >63 chars is not a DNS label.
      tooLong: slug.length > MAX_COUPLE_SLUG_LENGTH,
    })
  } catch {
    return NextResponse.json({ exists: false, error: "db_unavailable" })
  }
}
