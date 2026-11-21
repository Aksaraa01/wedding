import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getFeatureIncluded, getGuestPhotoQuota } from "@/lib/featureGates"
import { verifyScannerJwt, extractScannerJwt } from "@/lib/scannerJwt"

async function resolveWeddingProfileId(req: NextRequest, body: any): Promise<string | null> {
  const token = extractScannerJwt(req)
  if (token) {
    const verified = await verifyScannerJwt(token)
    if (verified) return verified.weddingProfileId
  }
  return body.wedding_profile_id || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qr_token, checked_in_by, wedding_profile_id, slug } = body

    const resolvedProfileId = await resolveWeddingProfileId(req, body)

    if (!qr_token && !slug) {
      return NextResponse.json({ error: "QR token diperlukan" }, { status: 400 })
    }

    let guestQuery = supabaseAdmin
      .from("guests")
      .select("id, name, table_number, is_checked_in, checkin_timestamp, souvenir_claimed, wedding_profile_id, is_vip")

    const { data: guest, error: guestErr } = qr_token
      ? await guestQuery.eq("qr_token", qr_token).maybeSingle()
      : await guestQuery
          .eq("wedding_profile_id", resolvedProfileId || "")
          .ilike("slug", slug || "")
          .maybeSingle()

    if (guestErr) {
      return NextResponse.json({ error: guestErr.message }, { status: 500 })
    }

    if (!guest) {
      return NextResponse.json({ error: qr_token ? "QR tidak valid. Tamu tidak ditemukan." : "Tamu tidak ditemukan." }, { status: 404 })
    }

    if (resolvedProfileId && guest.wedding_profile_id !== resolvedProfileId) {
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
      .select("id, name, table_number, is_checked_in, checkin_timestamp, checked_in_by, souvenir_claimed, added_manually, is_vip")
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
        .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually, is_vip, invited_session_indexes")
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
          .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually, is_vip, invited_session_indexes")
          .eq("wedding_profile_id", profile.id)
          .ilike("slug", (slug as string) || "")
          .maybeSingle()
        guest = g
      }
      if (!guest) {
        const { data: g } = await supabaseAdmin
          .from("guests")
          .select("id, name, slug, table_number, category, guest_count, rsvp_status, rsvp_pax_count, qr_token, wedding_profile_id, is_checked_in, added_manually, is_vip, invited_session_indexes")
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
      .select("bride_name, groom_name, bride_full_name, groom_full_name, display_name, slug, estimated_wedding_date, sessions, package_type, cover_photos, couple_illustration_url, gallery_photo_url, gallery_frame, gallery_camera, invitation_disabled_at")
      .eq("id", guest.wedding_profile_id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    // Ops executed the invitation teardown: the guest pass is no longer valid.
    if ((profile as { invitation_disabled_at?: string | null }).invitation_disabled_at) {
      return NextResponse.json({ error: "Masa aktif undangan telah berakhir.", expired: true }, { status: 410 })
    }

    // Scope profile.sessions to the guest's invited sessions (server-side, authoritative).
    const { filterSessionsByScope } = await import("@/lib/invitedSessions")
    const scopedProfile = {
      ...profile,
      sessions: filterSessionsByScope(
        Array.isArray((profile as any).sessions) ? (profile as any).sessions : [],
        (guest as any).invited_session_indexes ?? null,
      ),
    }

    const features = await getFeatureIncluded(profile.package_type || "signature")
    const gates = {
      wish_wall: features.has("wish_wall"),
      galeri_foto_tamu: features.has("galeri_foto_tamu"),
    }
    const photoQuota = await getGuestPhotoQuota(profile.package_type || "signature")

    return NextResponse.json({ guest, profile: scopedProfile, gates, photoQuota })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
