"use client"

import { FONT_BODY } from "../../shared/Skin"

export default function GalleryPage({ photos }: { photos: string[] }) {
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto px-1 pt-5 pb-16">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#8E6B3D]" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#554300] font-bold" style={FONT_BODY}>
          Our Moments
        </span>
        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#8E6B3D]" />
      </div>
      <div className="columns-2 gap-3 space-y-3">
        {photos.map((src, i) => (
          <div
            key={i}
            className="break-inside-avoid relative rounded-[16px] overflow-hidden backdrop-blur-md bg-white/5 border border-[#d4af37]/35 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_12px_28px_rgba(212,175,55,0.25)] hover:border-[#d4af37]/60 cursor-pointer group"
          >
            <div className="w-full overflow-hidden relative bg-[#f7f4ee]/40 min-h-[120px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Galeri ${i + 1}`} loading="lazy" decoding="async" className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-1.5 rounded-[12px] border border-[#d4af37]/25 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
