"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GuestGalleryView, { type GalleryViewPhoto } from "@/components/gallery/GuestGalleryView"
import { displayCategory } from "@/lib/gallery-client"

function datePartsOf(dateStr: string): { d: string; m: string; y: string } | null {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr || "")
  if (!m) return null
  const [y, mo, d] = dateStr.split("-")
  return { d, m: mo, y }
}

// Buku Tamu Digital entry: this guest's photos. Same gallery UI as GT.
export default function WelcomeGaleriPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [identity, setIdentity] = useState<{ name: string; category: string } | null>(null)
  const [couple, setCouple] = useState("")
  const [dateLabel, setDateLabel] = useState("")
  const [dateParts, setDateParts] = useState<{ d: string; m: string; y: string } | null>(null)
  const [photos, setPhotos] = useState<GalleryViewPhoto[]>([])
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const isTok = token.startsWith("AKS-")
        const query = isTok ? `qr_token=${encodeURIComponent(token)}` : `slug=${encodeURIComponent(token)}`
        const res = await fetch(`/api/check-in?${query}`)
        if (!res.ok) throw new Error("QR tidak valid")
        const data = await res.json()
        if (!data.guest || !data.profile) throw new Error("Data tidak ditemukan")
        const quota = typeof data.photoQuota === "number" ? data.photoQuota : 0
        setIdentity({ name: data.guest.name || "", category: data.guest.category || "Umum" })
        setCouple(data.profile.display_name || `${data.profile.bride_name} & ${data.profile.groom_name}`)
        const rawDate = data.profile.estimated_wedding_date || ""
        setDateParts(datePartsOf(rawDate))
        try {
          setDateLabel(rawDate ? new Date(`${rawDate}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "")
        } catch {
          setDateLabel("")
        }
        const photoRes = await fetch(`/api/guest-photos?guest_id=${data.guest.id}`)
        const photoData = await photoRes.json()
        const list = Array.isArray(photoData.photos) ? photoData.photos : []
        const mine = list
          .map((p: { id: string; image_url: string; caption?: string | null; created_at?: string; source?: string | null; uploader_name?: string | null; category?: string | null }) => ({
            id: p.id,
            image_url: p.image_url,
            caption: p.caption || null,
            created_at: p.created_at || new Date().toISOString(),
            source: p.source || null,
            uploader_name: p.uploader_name || null,
            category: p.category || null,
          }))
        setPhotos(mine)
        // Check-in selfies display but never consume the upload quota.
        setRemaining(Math.max(0, quota - mine.filter((p: { source: string | null }) => p.source !== "selfie").length))
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "QR tidak valid")
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  if (loading || error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 gap-4">
        {loading ? (
          <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4f1519" }}>
              <span className="material-symbols-outlined text-4xl text-white">photo_library</span>
            </div>
            <p className="text-[15px] text-[#444841] max-w-xs">{error}</p>
            <button
              onClick={() => router.push(`/welcome/${encodeURIComponent(token)}`)}
              className="mt-2 px-6 py-3 rounded-full text-white text-[12px] font-semibold uppercase tracking-widest"
              style={{ backgroundColor: "#6b2b2d" }}
            >
              Kembali
            </button>
          </>
        )}
      </main>
    )
  }

  return (
    <GuestGalleryView
      backHref={`/welcome/${encodeURIComponent(token)}`}
      cameraHref={`/welcome/${encodeURIComponent(token)}/kamera`}
      identityName={identity?.name || ""}
      identityCategory={displayCategory(identity?.category) || "Umum"}
      coupleName={couple}
      dateParts={dateParts}
      dateLabel={dateLabel}
      photos={photos}
      remaining={remaining}
    />
  )
}
