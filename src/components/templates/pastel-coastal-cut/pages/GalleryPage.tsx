"use client"

import { FONT_DISPLAY } from "../../shared/Skin"
import { toTransformedUrl } from "@/lib/storageUrl"

const HEIGHTS = ["h-52", "h-40", "h-44", "h-60", "h-48"]
const BOBS = ["pc-bob-1", "pc-bob-2", "pc-bob-3", "pc-bob-4", "pc-bob-5"]

export default function GalleryPage({ photos }: { photos: string[] }) {
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto px-1 pt-5 pb-16">
      <div className="text-center mt-2 mb-4 flex flex-col items-center">
        <h1 className="italic text-[30px] leading-tight drop-shadow-sm" style={{ ...FONT_DISPLAY, color: "#2c221a" }}>
          Our Moments
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#8E6B3D]" />
          <span className="material-symbols-outlined text-[14px] text-[#d4af37]">photo_camera</span>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#8E6B3D]" />
        </div>
      </div>
      <div className="columns-2 gap-3 space-y-3">
        {photos.map((src, i) => (
          <div key={i} className={BOBS[i % BOBS.length]}>
            <div className="break-inside-avoid relative rounded-[16px] overflow-hidden backdrop-blur-md bg-white/5 border border-[#d4af37]/35 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_12px_28px_rgba(212,175,55,0.25)] hover:border-[#d4af37]/60 cursor-pointer group">
              <div className={`w-full ${HEIGHTS[i % HEIGHTS.length]} overflow-hidden relative`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={toTransformedUrl(src, { width: 600 })} alt={`Galeri ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                <div className="absolute inset-1.5 rounded-[12px] border border-[#d4af37]/25 pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-5">
        <span className="w-1.5 h-1.5 rounded-full bg-white pc-sand-1 shadow-[0_0_10px_rgba(255,248,220,0.8)]" />
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-200 to-white pc-pearl-node" />
        <span className="w-1.5 h-1.5 rounded-full bg-white pc-sand-2 shadow-[0_0_10px_rgba(255,248,220,0.8)]" />
      </div>
    </div>
  )
}
