import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyScannerJwt, extractScannerJwt } from "@/lib/scannerJwt"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()
    let weddingProfileId = searchParams.get("wedding_profile_id")

    // A valid scanner token always wins over the query param (the kiosk can
    // never search another couple's guests). An expired/legacy token must NOT
    // block the concierge mid-event: fall back to the param, exactly like
    // /api/check-in already does. Requiring the header here protected nothing —
    // a caller that simply omits it reaches the same guests.
    const token = extractScannerJwt(req)
    if (token) {
      const verified = await verifyScannerJwt(token)
      if (verified) weddingProfileId = verified.weddingProfileId
    }

    if (!weddingProfileId || !q) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    // PostgREST `or()` splits on commas and treats parens as grouping; a name
    // containing them would otherwise fail the whole filter.
    const safeQ = q.replace(/[,()]/g, " ").trim()
    if (!safeQ) {
      return NextResponse.json({ guests: [] })
    }

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, guest_count, rsvp_status, rsvp_pax_count, is_checked_in, checkin_timestamp, souvenir_claimed, qr_token, added_manually, is_vip")
      .eq("wedding_profile_id", weddingProfileId)
      .or(`name.ilike.%${safeQ}%,phone_number.ilike.%${safeQ}%`)
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guests: guests || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
