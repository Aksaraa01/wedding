import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getFeatureIncluded, getGuestPhotoQuota } from "@/lib/featureGates"

export async function POST(req: NextRequest) {
  try {
    const { qr_token, checked_in_by, wedding_profile_id } = await req.json()

    if (!qr_token) {
      return NextResponse.json({ error: "QR token diperlukan" }, { status: 400 })
    }

    const { data: guest, error: guestErr } = await supabaseAdmin
      .from("guests")
      .select("id, name, table_number, is_checked_in, checkin_timestamp, souvenir_claimed, wedding_profile_id")
      .eq("qr_token", qr_token)
      .maybeSingle()

    if (guestErr) {
      return NextResponse.json({ error: guestErr.message }, { status: 500 })
    }

    if (!guest) {
      return NextResponse.json({ error: "QR tidak valid. Tamu tidak ditemukan." }, { status: 404 })
    }

    if (wedding_profile_id && guest.wedding_profile_id !== wedding_profile_id) {
      return NextResponse.json({ error: "QR tidak sesuai dengan acara ini" }, { status: 403 })
    }

    if (guest.is_checked_in) {
      return NextResponse.json({
        already_checked_in: true,
        guest,
        message: "Tamu sudah check-in sebelumnya",
      })
    }

    const now = new Date().toISOString()

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("guests")
      .update({
        is_checked_in: true,
        checkin_timestamp: now,
        checked_in_by: checked_in_by || null,
      })
      .eq("id", guest.id)
      .select("id, name, table_number, is_checked_in, checkin_timestamp, checked_in_by, souvenir_claimed, added_manually")
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ guest: updated, already_checked_in: false })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { guest_id } = await req.json()

    if (!guest_id) {
      return NextResponse.json({ error: "Guest ID diperlukan" }, { status: 400 })
    }

    const { data: guest, error: guestErr } = await supabaseAdmin
      .from("guests")
      .select("id, souvenir_claimed, is_checked_in")
      .eq("id", guest_id)
      .maybeSingle()

    if (guestErr || !guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 })
    }

    if (guest.souvenir_claimed) {
      return NextResponse.json({ already_claimed: true, message: "Souvenir sudah diambil" })
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("guests")
      .update({ souvenir_claimed: true })
      .eq("id", guest_id)
      .select("id, name, table_number, is_checked_in, souvenir_claimed")
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ guest: updated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const qrToken = searchParams.get("qr_token")
    const slug = searchParams.get("slug")

    if (!qrToken && !slug) {
      return NextResponse.json({ error: "QR token atau slug diperlukan" }, { status: 400 })
    }

    let guest
    if (qrToken) {
      const { data, error: guestErr } = await supabaseAdmin
        .from("guests")
        .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually")
        .eq("qr_token", qrToken)
        .maybeSingle()
      if (guestErr) {
        return NextResponse.json({ error: guestErr.message }, { status: 500 })
      }
      guest = data
    } else {
      const host = req.headers.get("host") || ""
      const subdomain = host.split(":")[0].split(".")[0]
      const { data: profile } = await supabaseAdmin
        .from("wedding_profiles")
        .select("id")
        .ilike("slug", subdomain)
        .maybeSingle()
      if (profile) {
        const { data: g } = await supabaseAdmin
          .from("guests")
          .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually")
          .eq("wedding_profile_id", profile.id)
          .ilike("slug", (slug as string) || "")
          .maybeSingle()
        guest = g
      }
      if (!guest) {
        const { data: g } = await supabaseAdmin
          .from("guests")
          .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually")
          .ilike("slug", (slug as string) || "")
          .maybeSingle()
        guest = g
      }
    }

    if (!guest) {
      return NextResponse.json({ error: "QR tidak valid" }, { status: 404 })
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("wedding_profiles")
      .select("bride_name, groom_name, display_name, slug, estimated_wedding_date, sessions, package_type, cover_photos, couple_illustration_url")
      .eq("id", guest.wedding_profile_id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    const features = await getFeatureIncluded(profile.package_type || "signature")
    const gates = {
      wish_wall: features.has("wish_wall"),
      galeri_foto_tamu: features.has("galeri_foto_tamu"),
    }
    const photoQuota = await getGuestPhotoQuota(profile.package_type || "signature")

    return NextResponse.json({ guest, profile, gates, photoQuota })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
