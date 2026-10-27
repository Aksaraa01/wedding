import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import {
  signScannerJwt,
  signScannerRefreshToken,
  SCANNER_ACCESS_TTL_SECONDS,
  SCANNER_REFRESH_TTL_SECONDS,
} from "@/lib/scannerJwt"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { pin } = await req.json()

    if (!pin) {
      return NextResponse.json({ error: "PIN diperlukan" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, scanner_pin")
      .eq("slug", slug)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 })
    }

    if (!profile.scanner_pin) {
      return NextResponse.json(
        { error: "PIN scanner belum dibuat. Buat PIN terlebih dahulu dari halaman Live Attendance." },
        { status: 400 }
      )
    }

    if (profile.scanner_pin !== pin) {
      return NextResponse.json({ error: "PIN salah" }, { status: 403 })
    }

    const token = await signScannerJwt(profile.id, profile.scanner_pin)
    const refreshToken = await signScannerRefreshToken(profile.id, profile.scanner_pin)

    return NextResponse.json({
      valid: true,
      wedding_profile_id: profile.id,
      token,
      refresh_token: refreshToken,
      expires_in: SCANNER_ACCESS_TTL_SECONDS,
      refresh_expires_in: SCANNER_REFRESH_TTL_SECONDS,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
