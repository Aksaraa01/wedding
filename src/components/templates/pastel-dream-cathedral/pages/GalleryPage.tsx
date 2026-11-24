"use client"

import { FONT_DISPLAY } from "../../shared/Skin"
import { t } from "@/lib/i18n"

const HEIGHTS = ["h-52", "h-40", "h-44", "h-48"]

export default function GalleryPage({ photos, title, lang = "id" }: { photos: string[]; title?: string; lang?: "id" | "en" }) {
  const resolvedTitle = (title || "").trim() || t("secGallery", lang)
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto px-1 pt-5 pb-16">
      <h1 className="text-center italic text-[30px] leading-tight mt-2 mb-4 drop-shadow-sm whitespace-pre-line" style={{ ...FONT_DISPLAY, color: "#221a14" }}>
        {resolvedTitle}
      </h1>
      <div className="columns-2 gap-3 space-y-3">
        {photos.map((src, i) => (
          <div
            key={i}
            className="break-inside-avoid relative rounded-[16px] overflow-hidden backdrop-blur-md bg-white/5 border border-[#d4af37]/35 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_12px_28px_rgba(212,175,55,0.25)] hover:border-[#d4af37]/60 cursor-pointer group"
          >
            <div className={`w-full ${HEIGHTS[i % HEIGHTS.length]} overflow-hidden relative`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Galeri ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-1.5 rounded-[12px] border border-[#d4af37]/25 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
