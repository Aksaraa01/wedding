import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("name, wedding_profile_id, qr_token")
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

  const encodedName = encodeURIComponent(guest.name)
  const encodedToken = encodeURIComponent(guest.qr_token || "")
  const host = _req.headers.get("host") || `${profile.slug}.wedding.aksaraa.com`
  const proto = _req.headers.get("x-forwarded-proto") || "https"
  return NextResponse.redirect(
    `${proto}://${host}/w/${profile.slug}?to=${encodedName}&qr_token=${encodedToken}`,
    302
  )
}
