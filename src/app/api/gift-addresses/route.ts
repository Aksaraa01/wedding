import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { cleanBlock, cleanLine } from "@/lib/plainText"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("gift_addresses")
      .select("*")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ addresses: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wedding_profile_id, recipient_name, phone, full_address, city, postal_code } = body

    if (!wedding_profile_id || !recipient_name || !full_address) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("gift_addresses")
      .insert({
        wedding_profile_id,
        recipient_name: cleanLine(recipient_name, 120),
        phone: cleanLine(phone, 40),
        full_address: cleanBlock(full_address, 600),
        city: cleanLine(city, 80),
        postal_code: cleanLine(postal_code, 20),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ address: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
