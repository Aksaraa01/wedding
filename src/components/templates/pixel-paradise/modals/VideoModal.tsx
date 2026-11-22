"use client"

import { FONT_PIXEL } from "../../shared/Skin"
import ModalShell from "./ModalShell"

export type VideoModalData =
  | { state: "ready"; videoUrl: string }
  | { state: "none" }
  | { state: "loading" }

type Props = {
  data: VideoModalData | null
  onClose: () => void
}

// Autoplays as soon as the modal opens (opening it is a user gesture; the iframe
// is created on mount with autoplay=1). Lessons from Skyline applied: no poster.
export default function VideoModal({ data, onClose }: Props) {
  if (!data) return null

  if (data.state === "none") {
    return (
      <ModalShell icon="sports_esports" eyebrow="CINEMA TEASER" title="OUR MOMENTS" onClose={onClose}>
        <p className="text-center text-sm text-slate-400">Video belum tersedia.</p>
      </ModalShell>
    )
  }

  if (data.state === "loading") {
    return (
      <ModalShell icon="sports_esports" eyebrow="CINEMA TEASER" title="OUR MOMENTS" onClose={onClose}>
        <p className="text-center text-sm text-slate-400">Memuat video…</p>
      </ModalShell>
    )
  }

  const videoUrl = data.videoUrl
  const src = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0&playsinline=1`

  return (
    <ModalShell icon="sports_esports" eyebrow="CINEMA TEASER" title="OUR MOMENTS" onClose={onClose}>
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-[#38bdf8]/40 bg-black shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_20px_rgba(56,189,248,0.15)]">
        <iframe
          src={src}
          title="Video Teaser"
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#090e1c]/90 border border-[#38bdf8]/40 w-fit">
        <span className="w-2 h-2 rounded-full bg-[#ffc640] shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
        <span className="text-[9px] text-[#38bdf8] tracking-wider font-bold" style={FONT_PIXEL}>
          NOW PLAYING
        </span>
      </div>
    </ModalShell>
  )
}