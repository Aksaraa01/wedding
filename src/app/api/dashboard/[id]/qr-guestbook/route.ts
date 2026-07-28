import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function generateToken(): string {
  const part = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8)
  return `AKS-${part()}-${part()}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, qr_token, is_checked_in, checkin_timestamp, souvenir_claimed")
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
      .select("id")
      .eq("wedding_profile_id", id)
      .is("qr_token", null)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json({ generated: 0, message: "Semua tamu sudah memiliki QR" })
    }

    const records = guests.map((g) => ({
      id: g.id,
      qr_token: generateToken(),
    }))

    const results = await Promise.all(
      records.map((r) =>
        supabaseAdmin.from("guests").update({ qr_token: r.qr_token }).eq("id", r.id)
      )
    )

    const firstError = results.find((r) => r.error)
    if (firstError) {
      return NextResponse.json({ error: firstError.error!.message }, { status: 500 })
    }

    return NextResponse.json({ generated: records.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
