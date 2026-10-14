"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PhotoboothCamera from "@/components/gallery/PhotoboothCamera"
import { loadIdentity } from "@/lib/gallery-client"
import { preloadFrameArt } from "@/lib/galeriFrames"
import { cameraCss, cameraPreset, normalizeCameraId } from "@/lib/galeriCameras"

type Ready = {
  deviceId: string
  name: string
  category: string
  couple: string
  dateLabel: string
  frame: string
  cameraFilter: string
  cameraName: string
  quota: number
  used: number
}

// Galeri Tamu entry: device identity from the identitas step, quota enforced
// per device. The camera UI itself is the shared PhotoboothCamera.
export default function GalleryCameraRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [ready, setReady] = useState<Ready | null>(null)

  useEffect(() => {
    // Prewarm frame art on mount: event Wi-Fi is often slow, and loading
    // all florals mid-upload is the failure window for missing decor.
    preloadFrameArt()
    const idn = loadIdentity(token)
    if (!idn) {
      router.replace(`/g/${encodeURIComponent(token)}/identitas`)
      return
    }
    fetch(`/api/gallery/${encodeURIComponent(token)}?device_id=${encodeURIComponent(idn.device_id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.status && d.status !== "active") {
          router.replace(`/g/${encodeURIComponent(token)}`)
          return
        }
        setReady({
          deviceId: idn.device_id,
          name: idn.name,
          category: idn.category,
          couple: d?.event?.couple_name || "",
          dateLabel: d?.event?.date_label || "",
          frame: typeof d?.event?.frame === "string" ? d.event.frame : "none",
          cameraFilter: cameraCss(normalizeCameraId(typeof d?.event?.camera === "string" ? d.event.camera : undefined)),
          cameraName: cameraPreset(typeof d?.event?.camera === "string" ? d.event.camera : undefined).name,
          quota: typeof d?.quota === "number" ? d.quota : 0,
          used: typeof d?.used === "number" ? d.used : 0,
        })
      })
      .catch(() => router.replace(`/g/${encodeURIComponent(token)}`))
  }, [token, router])

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const uploadShot = async ({ file, caption, captureId }: { file: File; caption: string; captureId: string }) => {
    const form = new FormData()
    form.append("file", file)
    form.append("gallery_token", token)
    form.append("device_id", ready.deviceId)
    form.append("uploader_name", ready.name)
    form.append("category", ready.category)
    form.append("caption", caption)
    form.append("capture_id", captureId)
    const res = await fetch("/api/guest-photos/upload", { method: "POST", body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto")
    return { used: typeof data.used === "number" ? data.used : ready.used + 1 }
  }

  return (
    <PhotoboothCamera
      coupleName={ready.couple}
      dateLabel={ready.dateLabel}
      frameId={ready.frame}
      cameraFilter={ready.cameraFilter}
      cameraName={ready.cameraName}
      quota={ready.quota}
      initialUsed={ready.used}
      backHref={`/g/${encodeURIComponent(token)}/home`}
      doneHref={`/g/${encodeURIComponent(token)}/galeri`}
      uploadShot={uploadShot}
    />
  )
}
