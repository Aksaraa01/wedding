import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { autoGenerateGuestLinks } from "@/lib/guest-link"
import { getFeatureIncluded } from "@/lib/featureGates"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, slug, is_checked_in, checkin_timestamp, souvenir_claimed, added_manually, is_vip")
      .eq("wedding_profile_id", id)
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = guests.length
    const withToken = guests.filter((g) => g.qr_token).length
    // "Active" means the guest has a working link (QR token or invitation
    // slug). Slug-only guests (e.g. flexible auto-rows, non-QR packages)
    // open and RSVP fine but never get a token.
    const withLink = guests.filter((g) => g.qr_token || g.slug).length
    const checkedIn = guests.filter((g) => g.is_checked_in).length

    return NextResponse.json({
      guests,
      stats: { total, with_token: withToken, with_link: withLink, checked_in: checkedIn },
      tokens_missing: total - withToken,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    if (typeof body.guest_link_strict !== "boolean") {
      return NextResponse.json({ error: "guest_link_strict harus boolean" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("wedding_profiles")
      .update({ guest_link_strict: body.guest_link_strict })
      .eq("id", id)
      .select("id, guest_link_strict")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guest_link_strict: data.guest_link_strict })
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

    const gated = profile.is_published !== true && !!requestedGuestId

    let query = supabaseAdmin
      .from("guests")
      .select("id, name, qr_token, slug")
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

    // Check if QR feature is included in the package
    const { data: profileFull } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type")
      .eq("id", id)
      .single()

    const features = await getFeatureIncluded(profileFull?.package_type || "signature")
    const generateQr = features.has("qr_code_book")

    const generated = await autoGenerateGuestLinks(id, guests)

    // Clearer response: distinguish between QR tokens generated vs links only
    if (generateQr) {
      return NextResponse.json({ 
        generated, 
        qr_generated: generated, 
        gated,
        message: `${generated} QR Code dan tautan undangan berhasil dibuat`
      })
    } else {
      return NextResponse.json({ 
        generated, 
        qr_generated: 0, 
        gated,
        message: `${generated} tautan undangan berhasil dibuat. QR Code tidak tersedia pada paket ini.`
      })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
