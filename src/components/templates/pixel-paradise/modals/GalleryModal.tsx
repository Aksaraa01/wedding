"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import ModalShell from "./ModalShell"

const frame = (i: number) =>
  i % 2 === 0
    ? "from-cyan-400 via-slate-800 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
    : "from-pink-500 via-slate-800 to-cyan-400 shadow-[0_0_12px_rgba(236,72,153,0.35)]"

export default function GalleryModal({ profile, onClose }: { profile: TemplateProps; onClose: () => void }) {
  const photos: string[] = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  if (photos.length === 0) return null
  return (
    <ModalShell icon="photo_library" eyebrow="LEVEL SELECT" title="OUR GALLERY" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((src, i) => (
          <div key={i} className={`relative p-[2px] rounded-lg bg-gradient-to-br ${frame(i)}`}>
            <div className="relative overflow-hidden rounded-[6px] bg-slate-950">
              <span className={`absolute top-1 left-1 w-1.5 h-1.5 z-10 shadow-[0_0_4px_#22d3ee] ${i % 2 === 0 ? "bg-cyan-400" : "bg-pink-400"}`} />
              <span className={`absolute top-1 right-1 w-1.5 h-1.5 z-10 shadow-[0_0_4px_#f472b6] ${i % 2 === 0 ? "bg-pink-400" : "bg-cyan-400"}`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Galeri ${i + 1}`} loading="lazy" decoding="async" className="w-full h-28 object-contain" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent py-1 px-1.5 flex items-center justify-between">
                <span className="text-[7px] text-cyan-300 tracking-wider" style={FONT_PIXEL}>
                  {`LVL.${String(i + 1).padStart(2, "0")}`}
                </span>
                <span className={`w-1 h-1 rounded-full shadow-[0_0_4px_#22d3ee] ${i % 2 === 0 ? "bg-cyan-400" : "bg-pink-400"}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[8px] text-cyan-300/80" style={FONT_PIXEL}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-green-400 animate-pulse" />
          ONLINE
        </span>
        <span className="text-pink-400 tracking-wider">INSERT COIN TO EXPAND</span>
      </div>
    </ModalShell>
  )
}