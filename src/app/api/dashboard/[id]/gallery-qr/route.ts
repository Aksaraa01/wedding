import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"
import { generateUniqueGalleryToken, galleryCameraUrl } from "@/lib/gallery"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Owner QR payload: the camera URL (+ a printable PNG data-URL). Never
// guessable: token is random and issued only after the setup is saved.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth
  const { id } = await params

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("gallery_token, gallery_couple_name, payment_status")
    .eq("id", id)
    .single()

  if (!profile?.gallery_token) {
    return NextResponse.json({ error: "Simpan detail acara dulu untuk menerbitkan QR" }, { status: 404 })
  }

  const url = galleryCameraUrl(profile.gallery_token)
  let qr_png: string | null = null
  try {
    const { default: QRCode } = await import("qrcode")
    qr_png = await QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" })
  } catch {
    qr_png = null
  }

  return NextResponse.json({
    gallery_token: profile.gallery_token,
    gallery_url: url,
    qr_png,
    locked: profile.payment_status === "UNPAID",
  })
}

// Regenerate the event token (invalidates previously printed QRs).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth
  const { id } = await params

  const token = await generateUniqueGalleryToken()
  const { error } = await supabaseAdmin
    .from("wedding_profiles")
    .update({ gallery_token: token })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, gallery_token: token, gallery_url: galleryCameraUrl(token) })
}
