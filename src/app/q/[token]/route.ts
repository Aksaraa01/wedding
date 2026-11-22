import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { slugifyName } from "@/lib/guest-link"
import { coupleUrl, isSubdomainSlug } from "@/lib/coupleUrl"
import { coupleUrlMode, isWeddingMainHost } from "@/lib/site"

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
  const host = (_req.headers.get("host") || "").toLowerCase().split(":")[0]
  const proto = _req.headers.get("x-forwarded-proto") || "https"
  // A QR opened on the main/staging app host, or a couple whose slug is longer
  // than a DNS label allows, or when the environment is path-only (B1 staging),
  // has no subdomain to redirect to — land on the canonical couple path form.
  const onMainSite = !host || isWeddingMainHost(host)
  const forcePath = coupleUrlMode() === "path"
  const target =
    onMainSite || !isSubdomainSlug(profile.slug) || forcePath
      ? coupleUrl(profile.slug, `/?to=${encodedSlug}`)
      : `${proto}://${host}/?to=${encodedSlug}`
  return NextResponse.redirect(target, 302)
}
