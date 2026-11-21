import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { autoGenerateGuestLinks, sanitizeGuestName } from "@/lib/guest-link"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const q = searchParams.get("q") || ""

    if (!weddingProfileId) {
      return NextResponse.json({ error: "Missing wedding_profile_id" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status")
      .eq("id", weddingProfileId)
      .single()

    if (profile && profile.payment_status !== "UNPAID") {
      const { data: missing, error: missingError } = await supabaseAdmin
        .from("guests")
        .select("id, name, qr_token, slug")
        .eq("wedding_profile_id", weddingProfileId)
        .or("qr_token.is.null,slug.is.null")
        .limit(500)

      if (!missingError && missing && missing.length > 0) {
        await autoGenerateGuestLinks(weddingProfileId, missing)
      }
    }

    let query = supabaseAdmin
      .from("guests")
      .select("*")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: true })

    if (q) {
      query = query.or(`name.ilike.%${q}%,table_number.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guests: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, name, phone_number, category, table_number, guest_count, is_vip, added_manually, checked_in_by, invited_session_indexes } = body

    if (!wedding_profile_id || !name) {
      return NextResponse.json({ error: "Nama tamu wajib diisi" }, { status: 400 })
    }

    // The dashboard UI already strips the guest-name charset, but a direct API
    // call could store "/" (or other symbols) that later break the WP guestbook
    // and the slug. Keep the name and the slug it produces in agreement.
    const cleanName = sanitizeGuestName(String(name)).replace(/\s+/g, " ").trim()
    if (!cleanName) {
      return NextResponse.json({ error: "Nama tamu wajib diisi" }, { status: 400 })
    }

    const digits = (phone_number || "").replace(/\D/g, "").replace(/^0+/, "")
    const normalized = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""

    const nameMatch = cleanName
    let dupQuery = supabaseAdmin
      .from("guests")
      .select("id")
      .eq("wedding_profile_id", wedding_profile_id)
      .ilike("name", nameMatch)

    if (normalized) {
      dupQuery = dupQuery.eq("phone_number", normalized)
    }

    const { data: existing } = await dupQuery.maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Tamu dengan nama dan nomor yang sama sudah ada", duplicate: true }, { status: 409 })
    }

    const pax = Math.max(1, Number(guest_count) || 1)
    const isManual = !!added_manually
    const invitedIndexes = Array.isArray(invited_session_indexes)
      ? invited_session_indexes
          .map((n: unknown) => Number(n))
          .filter((n: number) => Number.isInteger(n) && n >= 0)
      : null
    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert({
        wedding_profile_id,
        name: cleanName,
        phone_number: normalized,
        category,
        table_number,
        guest_count: pax,
        is_vip: !!is_vip,
        added_manually: isManual,
        // A manually added guest is physically present, so check them in immediately.
        is_checked_in: isManual,
        checkin_timestamp: isManual ? new Date().toISOString() : null,
        checked_in_by: isManual ? (checked_in_by || "Manual") : null,
        invited_session_indexes: invitedIndexes && invitedIndexes.length > 0 ? Array.from(new Set(invitedIndexes)).sort((a, b) => a - b) : null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const linksGenerated = await autoGenerateGuestLinks(wedding_profile_id, [data])

    let guest = data
    if (linksGenerated > 0) {
      const { data: updated } = await supabaseAdmin
        .from("guests")
        .select()
        .eq("id", data.id)
        .single()
      if (updated) guest = updated
    }

    return NextResponse.json({ guest, links_generated: linksGenerated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { wedding_profile_id } = await req.json()

    if (!wedding_profile_id) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("guests")
      .delete()
      .eq("wedding_profile_id", wedding_profile_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
