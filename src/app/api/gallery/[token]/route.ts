import { NextResponse } from "next/server"
import {
  getGalleryEventByToken,
  galleryStatusForEvent,
  getGalleryQuota,
  countDevicePhotos,
  formatGalleryDateWib,
  formatGalleryTimeWib,
  wibDateParts,
  galeriCoupleName,
  galeriPhotoUrl,
} from "@/lib/gallery"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

// Public resolver for the scanned event QR. Returns only the data a guest
// needs (couple name, photo, schedule labels, window status, quota usage).
// Rate-limited per IP+token; responses are short-cacheable except the
// per-device `used` count.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req)
  const { token } = await params

  const rl = checkRateLimit(`gallery-resolve:${ip}:${token}`, 60, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs || 60_000)

  const event = await getGalleryEventByToken(token)
  const status = galleryStatusForEvent(event)

  if (status === "invalid" || !event) {
    return NextResponse.json({ status: "invalid" })
  }

  const { searchParams } = new URL(req.url)
  const deviceId = searchParams.get("device_id") || ""
  const { quota } = await getGalleryQuota(event.id, event.package_type)
  const used =
    deviceId && /^[0-9a-f-]{8,64}$/i.test(deviceId)
      ? await countDevicePhotos(event.id, deviceId)
      : 0

  const res = NextResponse.json({
    status,
    quota,
    used,
    remaining: Math.max(0, quota - used),
    event: {
      couple_name: galeriCoupleName(event),
      photo_url: galeriPhotoUrl(event),
      date_label: formatGalleryDateWib(event.gallery_start_at),
      start_label: formatGalleryTimeWib(event.gallery_start_at),
      end_label: formatGalleryTimeWib(event.gallery_end_at),
      date_parts: wibDateParts(event.gallery_start_at),
    },
  })
  // Window status flips on the hour boundary; keep CDN/browser cache short.
  res.headers.set("Cache-Control", "public, max-age=30")
  return res
}
