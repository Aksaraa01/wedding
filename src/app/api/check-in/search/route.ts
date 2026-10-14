import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyScannerJwt, extractScannerJwt } from "@/lib/scannerJwt"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    let weddingProfileId = searchParams.get("wedding_profile_id")

    const token = extractScannerJwt(req)
    if (token) {
      const verified = await verifyScannerJwt(token)
      if (verified) {
        weddingProfileId = verified.weddingProfileId
      } else {
        return NextResponse.json({ error: "Token scanner tidak valid atau kadaluarsa" }, { status: 401 })
      }
    }

    if (!weddingProfileId || !q) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, guest_count, rsvp_status, rsvp_pax_count, is_checked_in, checkin_timestamp, souvenir_claimed, qr_token, added_manually, is_vip")
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
