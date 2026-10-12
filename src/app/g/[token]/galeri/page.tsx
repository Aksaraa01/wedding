"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GuestGalleryView, { type GalleryViewPhoto } from "@/components/gallery/GuestGalleryView"
import { loadIdentity } from "@/lib/gallery-client"

type EventInfo = {
  couple_name: string
  date_label: string
  date_parts: { d: string; m: string; y: string } | null
}

// Galeri Tamu entry: this device's photos only (no public wall).
export default function GalleryGuestRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [identity, setIdentity] = useState<{ name: string; category: string; device_id: string } | null>(null)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [photos, setPhotos] = useState<GalleryViewPhoto[]>([])
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (deviceId: string) => {
    const [galRes, resRes] = await Promise.all([
      fetch(`/api/gallery/${encodeURIComponent(token)}/photos?device_id=${encodeURIComponent(deviceId)}`),
      fetch(`/api/gallery/${encodeURIComponent(token)}?device_id=${encodeURIComponent(deviceId)}`),
    ])
    const gal = await galRes.json().catch(() => null)
    const res = await resRes.json().catch(() => null)
    if (res?.status && res.status !== "active") {
      router.replace(`/g/${encodeURIComponent(token)}`)
      return
    }
    setPhotos(Array.isArray(gal?.photos) ? gal.photos : [])
    setEvent(res?.event || null)
    if (typeof res?.remaining === "number") setRemaining(res.remaining)
  }, [token, router])

  useEffect(() => {
    const idn = loadIdentity(token)
    if (!idn) {
      router.replace(`/g/${encodeURIComponent(token)}/identitas`)
      return
    }
    setIdentity(idn)
    refresh(idn.device_id).finally(() => setLoading(false))
  }, [token, router, refresh])

  if (loading || !identity) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <GuestGalleryView
      backHref={`/g/${encodeURIComponent(token)}/home`}
      cameraHref={`/g/${encodeURIComponent(token)}/kamera`}
      identityName={identity.name}
      identityCategory={identity.category}
      coupleName={event?.couple_name || ""}
      dateParts={event?.date_parts || null}
      dateLabel={event?.date_label || ""}
      photos={photos}
      remaining={remaining}
    />
  )
}
