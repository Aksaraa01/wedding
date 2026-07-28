import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const weddingProfileId = searchParams.get("wedding_profile_id")

    if (!weddingProfileId || !q) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, is_checked_in, checkin_timestamp, souvenir_claimed, qr_token")
      .eq("wedding_profile_id", weddingProfileId)
      .or(`name.ilike.%${q}%,phone_number.ilike.%${q}%`)
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guests: guests || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
