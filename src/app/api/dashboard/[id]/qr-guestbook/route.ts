import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { autoGenerateGuestLinks } from "@/lib/guest-link"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, slug, is_checked_in, checkin_timestamp, souvenir_claimed, added_manually")
      .eq("wedding_profile_id", id)
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = guests.length
    const withToken = guests.filter((g) => g.qr_token).length
    const checkedIn = guests.filter((g) => g.is_checked_in).length

    return NextResponse.json({
      guests,
      stats: { total, with_token: withToken, checked_in: checkedIn },
      tokens_missing: total - withToken,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const requestedGuestId = typeof body.guest_id === "string" ? body.guest_id : null

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status, is_published")
      .eq("id", id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    if (profile.payment_status === "UNPAID") {
      return NextResponse.json(
        { error: "Selesaikan pembayaran terlebih dahulu untuk menghasilkan QR" },
        { status: 403 }
      )
    }

    // Paid but not confirmed: the invitation content isn't final, so only the
    // first guest's QR may be activated. The client passes the first guest's id.
    const gated = profile.is_published !== true && !!requestedGuestId

    let query = supabaseAdmin
      .from("guests")
      .select("id, name, qr_token")
      .eq("wedding_profile_id", id)
      .or("qr_token.is.null,slug.is.null")
      .order("created_at", { ascending: true })

    if (gated) {
      query = query.eq("id", requestedGuestId)
    }

    const { data: guests, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json({ generated: 0, message: "Semua tamu sudah memiliki QR" })
    }

    const generated = await autoGenerateGuestLinks(id, guests)

    return NextResponse.json({ generated, gated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
