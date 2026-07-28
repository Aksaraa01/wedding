import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { wedding_profile_id } = await req.json()

    if (!wedding_profile_id) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id")
      .eq("id", wedding_profile_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    const pin = String(Math.floor(100000 + Math.random() * 900000))

    const { error: updateErr } = await supabaseAdmin
      .from("wedding_profiles")
      .update({ scanner_pin: pin })
      .eq("id", wedding_profile_id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ pin })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
