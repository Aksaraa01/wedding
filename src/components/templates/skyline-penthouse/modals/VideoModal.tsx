"use client"

import ModalShell from "./ModalShell"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const

export type VideoModalData =
  | {
      state: "ready"
      videoUrl: string
    }
  | { state: "none" }
  | { state: "loading" }

type Props = {
  data: VideoModalData | null
  onClose: () => void
}

// Autoplays as soon as the modal opens (opening it is a user gesture, and the
// iframe is created on mount with autoplay=1), so the teaser starts immediately.
export default function VideoModal({ data, onClose }: Props) {
  if (!data) return null

  if (data.state === "none") {
    return (
      <ModalShell icon="movie" eyebrow="CINEMATIC TEASER" title="OUR MOMENTS" onClose={onClose}>
        <p className="text-center text-sm text-slate-400">Video belum tersedia.</p>
      </ModalShell>
    )
  }

  if (data.state === "loading") {
    return (
      <ModalShell icon="movie" eyebrow="CINEMATIC TEASER" title="OUR MOMENTS" onClose={onClose}>
        <p className="text-center text-sm text-slate-400">Memuat video…</p>
      </ModalShell>
    )
  }

  const videoUrl = data.videoUrl
  const src = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0&playsinline=1`

  return (
    <ModalShell icon="movie" eyebrow="CINEMATIC TEASER" title="OUR MOMENTS / TEASER" onClose={onClose}>
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#38bdf8]/40 bg-black">
        <iframe
          src={src}
          title="Video Teaser"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    </ModalShell>
  )
}