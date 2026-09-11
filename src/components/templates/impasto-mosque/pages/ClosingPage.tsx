"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { CouplePhoto } from "./MainPage"

export default function ClosingPage({ profile, onWishOpenChange }: { profile: TemplateProps; onWishOpenChange: (open: boolean) => void }) {
  return (
    <div className="flex-1 w-full max-w-[360px] mx-auto flex flex-col items-center justify-start text-center px-6 pt-12 pb-8">
      <div className="relative w-full max-w-[360px] flex flex-col items-center p-8">
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none drop-shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.impastoMosque.brush} alt="" className="w-full h-full object-fill scale-110 opacity-95" loading="lazy" />
        </div>
        <div className="relative z-10 flex flex-col items-center w-full px-4 py-2">
          <div className="mb-3 relative">
            <div className="w-28 h-36 rounded-t-full rounded-b-lg overflow-hidden border-2 border-[#8E6B3D]/60 shadow-lg relative bg-[#f7f4ee]">
              <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-lg" />
            </div>
            <div className="absolute -inset-1 rounded-t-full rounded-b-lg border border-[#d4af37]/30 pointer-events-none" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ ...FONT_BODY, color: "#715c48" }}>
            UNGKAPAN TERIMA KASIH
          </span>
          <h1 className="text-[34px] leading-tight mb-1.5" style={{ ...FONT_SCRIPT, color: "#2A1F18", textShadow: "0 2px 4px rgba(255,255,255,0.4), 0 1px 2px rgba(74,52,39,0.2)" }}>
            Terima Kasih &amp; Doa Restu
          </h1>
          <div className="flex items-center gap-2 mb-2 w-full max-w-[280px] justify-center">
            <span className="h-px w-6 bg-[#8E6B3D]/40" />
            <span className="text-[11px] italic leading-relaxed text-center" style={{ ...FONT_DISPLAY, color: "#4A3427" }}>
              Merupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran serta doa restu Bapak/Ibu/Saudara/i sekalian.
            </span>
            <span className="h-px w-6 bg-[#8E6B3D]/40" />
          </div>
          <button
            type="button"
            onClick={() => onWishOpenChange(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full text-[#fffdfa] font-semibold text-[12px] tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ ...FONT_BODY, background: "linear-gradient(135deg, #8E6B3D 0%, #b38f53 100%)" }}
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span>Beri Doa &amp; Ucapan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
