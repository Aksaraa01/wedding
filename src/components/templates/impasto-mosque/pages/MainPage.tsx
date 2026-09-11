"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { firstImage, initialsOf } from "../../shared/lib"

const DEFAULT_VERSE = "“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.”"

export function CouplePhoto({ profile, className = "" }: { profile: TemplateProps; className?: string }) {
  const src = firstImage(profile.cover_photos) || firstImage(profile.couple_illustration_url)
  if (!src) {
    return (
      <div className={`bg-[#f7f4ee] flex items-center justify-center ${className}`}>
        <span className="text-3xl text-[#8E6B3D]" style={FONT_SCRIPT}>
          {profile.couple_initials || initialsOf(profile.groom_name, profile.bride_name) || "AR"}
        </span>
      </div>
    )
  }
  return (
    <div className={`overflow-hidden relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Mempelai" className="w-full h-full object-contain bg-[#f7f4ee]" loading="lazy" />
    </div>
  )
}

export default function MainPage({ profile, onWishOpenChange }: { profile: TemplateProps; onWishOpenChange: (open: boolean) => void }) {
  const initials = (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "AR"
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto flex flex-col items-center text-center px-2 pt-3">
      <div className="relative px-5 py-6 w-full">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.impastoMosque.brush} alt="" className="w-[115%] h-[115%] max-w-none object-cover opacity-60" loading="lazy" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-[38px] leading-tight tracking-wide mb-2" style={{ ...FONT_SCRIPT, color: "#171c21", textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}>
            {initials}
          </h2>
          <p className="italic text-[13px] leading-[22px] px-3 font-medium" style={{ ...FONT_DISPLAY, color: "#1c2227" }}>
            {profile.quote_text || DEFAULT_VERSE}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <span className="text-[11px] tracking-[0.25em] font-semibold uppercase" style={{ ...FONT_DISPLAY, color: "#2e353d" }}>
              {profile.quote_source || "QS. AR-RUM: 21"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center w-full max-h-[300px] mt-2">
        <div className="w-[200px] aspect-[3/4] rounded-t-full rounded-b-2xl overflow-hidden border-2 border-[#d4af37]/60 shadow-[0_12px_32px_rgba(0,0,0,0.65)] p-1 bg-[#f7f4ee]/40">
          <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-xl" />
        </div>
      </div>

      <div className="rounded-xl bg-[#090e1c]/80 border border-dashed border-[#d4af37]/40 p-3 text-center mt-3 w-full">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#8E6B3D] font-semibold mb-1 block" style={FONT_BODY}>
          UNGKAPAN TERIMA KASIH
        </span>
        <button
          type="button"
          onClick={() => onWishOpenChange(true)}
          className="mt-1 inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full text-white text-[12px] font-semibold tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
          style={{ ...FONT_BODY, background: "linear-gradient(135deg, #8E6B3D 0%, #b38f53 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">forum</span>
          Beri Doa &amp; Ucapan
        </button>
      </div>
    </div>
  )
}
