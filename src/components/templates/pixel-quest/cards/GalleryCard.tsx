"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { toTransformedUrl } from "@/lib/storageUrl"
import CardShell from "./CardShell"

// Compact inline gallery grid for the quest step. Tapping opens the full
// pixel-paradise gallery overlay (handled by the parent).
export default function GalleryCard({
  photos,
  content,
  onHide,
  onExpand,
}: {
  photos: string[]
  content?: Record<string, string>
  onHide: () => void
  onExpand: () => void
}) {
  const tc = content || {}
  if (photos.length === 0) return null
  return (
    <CardShell icon="photo_library" eyebrow="STOP: GALLERY" title={tc.gallery_title || "OUR GALLERY"} badge={`${photos.length} FOTO`} onHide={onHide}>
      <button type="button" onClick={onExpand} className="block w-full text-left cursor-zoom-in active:scale-[0.99] transition-transform" aria-label="Lihat galeri penuh">
        <div className="grid grid-cols-3 gap-1.5">
          {photos.slice(0, 6).map((src, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden border border-[#38bdf8]/40 bg-slate-950 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toTransformedUrl(src, { width: 400 })} alt={`Galeri ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-contain" />
              <span className="absolute bottom-0.5 left-1 text-[7px] text-cyan-300" style={FONT_PIXEL}>
                {`LVL.${String(i + 1).padStart(2, "0")}`}
              </span>
            </div>
          ))}
        </div>
        <span className="mt-1.5 w-full py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[8px] tracking-wider flex items-center justify-center gap-1" style={FONT_PIXEL}>
          <span className="material-symbols-outlined text-[13px]">zoom_in_map</span>
          TAP TO EXPAND
        </span>
      </button>
    </CardShell>
  )
}
