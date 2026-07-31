import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateUniqueToken } from "@/lib/qr"
import { generateUniqueSlug } from "@/lib/guest-link"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, qr_token, slug, is_checked_in, checkin_timestamp, souvenir_claimed")
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status")
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

    const { data: guests, error: fetchError } = await supabaseAdmin
      .from("guests")
      .select("id, name, qr_token")
      .eq("wedding_profile_id", id)
      .or("qr_token.is.null,slug.is.null")

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json({ generated: 0, message: "Semua tamu sudah memiliki QR" })
    }

    const results = await Promise.all(
      guests.map(async (g) => {
        const token = g.qr_token || (await generateUniqueToken())
        const slug = await generateUniqueSlug(id, g.name)
        return supabaseAdmin
          .from("guests")
          .update({ ...(g.qr_token ? {} : { qr_token: token }), slug })
          .eq("id", g.id)
      })
    )

    const firstError = results.find((r) => r.error)
    if (firstError) {
      return NextResponse.json({ error: firstError.error!.message }, { status: 500 })
    }

    return NextResponse.json({ generated: results.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
