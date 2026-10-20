"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PhotoboothCamera from "@/components/gallery/PhotoboothCamera"
import { resolveCoupleName } from "@/lib/coupleName"

type Ready = {
  guestId: string
  weddingProfileId: string
  name: string
  category: string
  couple: string
  dateLabel: string
  quota: number
  used: number
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ""
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

// Buku Tamu Digital entry: guest identity comes from the guest row
// (check-in), quota is the per-guest package quota. Same camera UI as GT.
export default function WelcomeKameraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [ready, setReady] = useState<Ready | null>(null)
  const [blocked, setBlocked] = useState("")

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
        if (quota <= 0) {
          setBlocked("Fitur galeri foto tidak tersedia untuk paket ini.")
          return
        }
        let used = 0
        try {
          const photoRes = await fetch(`/api/guest-photos?guest_id=${data.guest.id}&guest_token=${encodeURIComponent(token)}`)
          const photoData = await photoRes.json()
          const list = Array.isArray(photoData.photos) ? photoData.photos : []
          used = list.filter((p: { source?: string | null }) => p.source !== "selfie").length
        } catch {}
        setReady({
          guestId: data.guest.id,
          weddingProfileId: data.guest.wedding_profile_id,
          name: data.guest.name || "",
          category: data.guest.category || "Umum",
          couple: resolveCoupleName(data.profile),
          dateLabel: formatDateLabel(data.profile.estimated_wedding_date || ""),
          quota,
          used,
        })
      } catch (e: unknown) {
        setBlocked(e instanceof Error ? e.message : "QR tidak valid")
      }
    })()
  }, [token])

  if (blocked) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4f1519" }}>
          <span className="material-symbols-outlined text-4xl text-white">photo_camera</span>
        </div>
        <p className="text-[15px] text-[#444841] max-w-xs">{blocked}</p>
        <button
          onClick={() => router.push(`/welcome/${encodeURIComponent(token)}`)}
          className="mt-2 px-6 py-3 rounded-full text-white text-[12px] font-semibold uppercase tracking-widest"
          style={{ backgroundColor: "#6b2b2d" }}
        >
          Kembali
        </button>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const uploadShot = async ({ file, caption }: { file: File; caption: string; captureId: string }) => {
    const form = new FormData()
    form.append("file", file)
    form.append("wedding_profile_id", ready.weddingProfileId)
    form.append("guest_id", ready.guestId)
    form.append("source", "gallery")
    form.append("caption", caption)
    const res = await fetch("/api/guest-photos/upload", { method: "POST", body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto")
    return { used: ready.used + 1 }
  }

  return (
    <PhotoboothCamera
      coupleName={ready.couple}
      dateLabel={ready.dateLabel}
      quota={ready.quota}
      initialUsed={ready.used}
      backHref={`/welcome/${encodeURIComponent(token)}`}
      doneHref={`/welcome/${encodeURIComponent(token)}/galeri`}
      uploadShot={uploadShot}
    />
  )
}
