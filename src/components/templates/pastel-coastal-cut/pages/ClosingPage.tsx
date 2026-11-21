"use client"

import type { TemplateProps } from "@/types/template"
import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { CouplePhoto } from "./MainPage"
import { PastelCloud } from "../Atmosphere"

export default function ClosingPage({ profile, onWishOpenChange }: { profile: TemplateProps; onWishOpenChange: (open: boolean) => void }) {
  const lang = normalizeLanguage(profile.language)
  return (
    <div className="flex-1 w-full max-w-[360px] mx-auto flex flex-col items-center justify-center text-center px-6 pt-12 pb-8">
      <div className="relative w-full max-w-[420px] min-h-[500px] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="pc-cloud-stage absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none drop-shadow-2xl">
          <PastelCloud className="w-[115%] max-w-none h-[115%] object-contain opacity-95" />
        </div>
        <div className="relative z-10 flex flex-col items-center w-full px-5 py-4 mt-2">
          <div className="mb-2.5 relative">
            <div className="w-24 h-32 rounded-t-full rounded-b-xl overflow-hidden border-2 border-[#d4af37]/80 shadow-lg relative bg-[#fdfbf7] ring-4 ring-white/80">
              <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-xl" />
            </div>
            <div className="absolute -inset-1.5 rounded-t-full rounded-b-xl border border-[#d4af37]/40 pointer-events-none" />
          </div>
          <h1 className="text-[34px] leading-[1.05] mb-1.5 drop-shadow-sm" style={{ ...FONT_SCRIPT, color: "#2c221a" }}>
            {lang === "en" ? "Thank You & Blessings" : "Terima Kasih & Doa Restu"}
          </h1>
          <div className="flex items-center gap-2 mb-3.5 w-full max-w-[260px] justify-center">
            <span className="h-px w-6 bg-[#8c6d48]/40" />
            <span className="italic text-[11px] leading-relaxed text-center" style={{ ...FONT_DISPLAY, color: "#4a3a2f" }}>
              {lang === "en" ? "It is an honor and joy for us to have your presence and blessings on our special day." : "Merupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran serta doa restu Bapak/Ibu/Saudara/i sekalian."}
            </span>
            <span className="h-px w-6 bg-[#8c6d48]/40" />
          </div>
          <button
            type="button"
            onClick={() => onWishOpenChange(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b37a56] via-[#c68962] to-[#b37a56] text-[#fffdfa] font-semibold text-[12px] tracking-wider shadow-lg shadow-[#b37a56]/25 hover:brightness-105 active:scale-95 transition-all border border-[#f5ded0]/50"
            style={FONT_BODY}
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span>{lang === "en" ? "Send Wishes & Prayers" : "Beri Doa & Ucapan"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
