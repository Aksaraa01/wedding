import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { slugifyName } from "@/lib/guest-link"

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
  const host = _req.headers.get("host") || `${profile.slug}.wedding.aksaraa.com`
  const proto = _req.headers.get("x-forwarded-proto") || "https"
  return NextResponse.redirect(
    `${proto}://${host}/?to=${encodedSlug}`,
    302
  )
}
