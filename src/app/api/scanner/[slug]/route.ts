import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { formatEndDate, getEndDate } from "@/lib/selfieOverlay"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, display_name, scanner_pin, sessions, estimated_wedding_date, cover_photos, couple_illustration_url")
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
      display_name: profile.display_name,
      guest_count: guestCount || 0,
      has_pin: !!profile.scanner_pin,
      end_date: formatEndDate(getEndDate(profile)),
      cover_photo: (() => {
        const covers = Array.isArray((profile as any).cover_photos) ? (profile as any).cover_photos : []
        const first = covers.find((c: unknown) => typeof c === "string" && (c as string).trim()) as string | undefined
        return (first as string) || (profile as any).couple_illustration_url || null
      })(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
