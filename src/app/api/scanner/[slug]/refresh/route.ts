import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import {
  extractScannerJwt,
  pinFingerprint,
  signScannerJwt,
  signScannerRefreshToken,
  verifyScannerJwt,
  verifyScannerRefreshToken,
  SCANNER_ACCESS_TTL_SECONDS,
  SCANNER_REFRESH_TTL_SECONDS,
} from "@/lib/scannerJwt"

// Trades a still-valid access token (or the long-lived refresh token) for a new
// pair. Refused only when the profile PIN was rotated — the one case where the
// operator is supposed to be pushed back to the PIN screen.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await req.json().catch(() => ({}) as { refresh_token?: string })
    const rawToken = extractScannerJwt(req) || body?.refresh_token || ""

    if (!rawToken) {
      return NextResponse.json({ error: "Token diperlukan" }, { status: 401 })
    }

    const claims = (await verifyScannerJwt(rawToken)) || (await verifyScannerRefreshToken(rawToken))
    if (!claims) {
      return NextResponse.json({ error: "Token scanner tidak valid atau kadaluarsa" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, scanner_pin")
      .eq("slug", slug)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 })
    }

    if (claims.weddingProfileId !== profile.id) {
      return NextResponse.json({ error: "Token tidak sesuai dengan acara ini" }, { status: 403 })
    }

    if (!profile.scanner_pin) {
      return NextResponse.json({ error: "PIN scanner belum dibuat" }, { status: 401 })
    }

    // Legacy tokens carry no fingerprint; let them roll over once so the kiosk
    // never needs a PIN mid-event. Fingerprinted tokens must still match.
    if (claims.pinHash && claims.pinHash !== pinFingerprint(profile.scanner_pin)) {
      return NextResponse.json({ error: "PIN scanner sudah diperbarui" }, { status: 401 })
    }

    return NextResponse.json({
      token: await signScannerJwt(profile.id, profile.scanner_pin),
      refresh_token: await signScannerRefreshToken(profile.id, profile.scanner_pin),
      expires_in: SCANNER_ACCESS_TTL_SECONDS,
      refresh_expires_in: SCANNER_REFRESH_TTL_SECONDS,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
