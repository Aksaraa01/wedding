import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, scanner_pin")
      .eq("slug", slug)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 })
    }

    const { count: guestCount } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", profile.id)

    return NextResponse.json({
      wedding_profile_id: profile.id,
      bride_name: profile.bride_name,
      groom_name: profile.groom_name,
      guest_count: guestCount || 0,
      has_pin: !!profile.scanner_pin,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
