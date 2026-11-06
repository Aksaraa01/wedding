import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { slugifyName } from "@/lib/guest-link"
import { coupleUrl, isSubdomainSlug } from "@/lib/coupleUrl"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("name, slug, wedding_profile_id, qr_token")
    .eq("qr_token", token)
    .maybeSingle()

  if (!guest) {
    return NextResponse.json({ error: "QR tidak valid" }, { status: 404 })
  }

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("slug")
    .eq("id", guest.wedding_profile_id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 })
  }

  const guestSlug = guest.slug || slugifyName(guest.name)
  const encodedSlug = encodeURIComponent(guestSlug)
  const host = _req.headers.get("host") || ""
  const proto = _req.headers.get("x-forwarded-proto") || "https"
  // A QR opened on the main site (or a couple whose slug is longer than a DNS
  // label allows) has no subdomain to redirect to — land on /w/{slug} instead
  // of the marketing homepage.
  const onMainSite = !host || host === "wedding.aksaraa.com" || host === "www.wedding.aksaraa.com"
  const target =
    onMainSite || !isSubdomainSlug(profile.slug)
      ? coupleUrl(profile.slug, `/?to=${encodedSlug}`)
      : `${proto}://${host}/?to=${encodedSlug}`
  return NextResponse.redirect(target, 302)
}
