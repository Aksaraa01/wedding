"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import { firstImage } from "../../shared/lib"
import { CouplePhoto } from "./MainPage"

export default function ClosingPage({ profile, onWishOpenChange }: { profile: TemplateProps; onWishOpenChange: (open: boolean) => void }) {
  return (
    <div className="flex-1 w-full max-w-[360px] mx-auto flex flex-col items-center justify-start text-center px-2 pt-12 pb-8">
      <div className="w-[190px] aspect-[3/4] rounded-t-full rounded-b-2xl overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_12px_32px_rgba(0,0,0,0.65)] p-1 bg-[#f7f4ee]/30">
        <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-xl" />
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] font-semibold mt-4 mb-1" style={{ ...FONT_BODY, color: "#715c48" }}>
        UNGKAPAN TERIMA KASIH
      </span>
      <h1 className="italic text-[30px] leading-tight mb-1.5 drop-shadow-sm" style={{ ...FONT_DISPLAY, color: "#221a14" }}>
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
  )
}
