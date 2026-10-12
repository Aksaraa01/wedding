import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getGalleryEventByToken, galleryStatusForEvent } from "@/lib/gallery"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

// Guest POV gallery: only photos uploaded by THIS device. Guests must never
// see other devices' photos (no public wall for this product).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req)
  const { token } = await params
  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get("device_id") || ""

  if (!deviceId || !/^[0-9a-f-]{8,64}$/i.test(deviceId)) {
    return NextResponse.json({ error: "device_id diperlukan" }, { status: 400 })
  }

  const rl = checkRateLimit(`gallery-photos:${ip}:${token}`, 60, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs || 60_000)

  const event = await getGalleryEventByToken(token)
  const status = galleryStatusForEvent(event)
  if (status === "invalid" || !event) {
    return NextResponse.json({ status: "invalid", photos: [] })
  }

  const { data, error } = await supabaseAdmin
    .from("guest_photos")
    .select("id, image_url, caption, created_at, source")
    .eq("wedding_profile_id", event.id)
    .eq("device_id", deviceId)
    .neq("source", "selfie")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status, photos: data || [] })
}
