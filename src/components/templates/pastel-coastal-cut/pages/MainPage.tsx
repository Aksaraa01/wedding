"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { firstImage, initialsOf } from "../../shared/lib"
import { PastelCloud } from "../Atmosphere"

const DEFAULT_VERSE = "“Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.”"

export function CouplePhoto({ profile, className = "" }: { profile: TemplateProps; className?: string }) {
  const src = firstImage(profile.cover_photos) || firstImage(profile.couple_illustration_url) || ASSETS.impastoMosque.coupleCover
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
      <img src={src} alt="Mempelai" className="w-full h-full object-cover object-top brightness-[1.02] contrast-[1.03]" loading="lazy" />
    </div>
  )
}

export default function MainPage({ profile }: { profile: TemplateProps }) {
  const initials = (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "AR"
  return (
    <div className="flex-1 w-full mx-auto flex flex-col items-center text-center pt-3">
      <section className="relative flex flex-col items-center justify-center text-center px-3 pt-3 pb-2 w-full min-h-[220px] overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="pc-cloud-left absolute w-[330px] sm:w-[360px] max-w-[95vw] pointer-events-none filter drop-shadow-[0_8px_20px_rgba(74,52,39,0.18)]">
            <PastelCloud className="w-full h-auto object-contain opacity-95 select-none" />
          </div>
          <div className="pc-cloud-right absolute w-[340px] sm:w-[370px] max-w-[95vw] pointer-events-none filter drop-shadow-[0_6px_18px_rgba(74,52,39,0.14)]">
            <PastelCloud flip className="w-full h-auto object-contain opacity-90 select-none" />
          </div>
        </div>
        <div className="pc-quote-in w-full max-w-[360px] mx-auto relative select-none flex flex-col items-center text-center px-4 py-3">
          <h2 className="text-[42px] leading-tight font-normal tracking-wide mb-1.5 relative z-10" style={{ ...FONT_SCRIPT, color: "#2C1E16", textShadow: "0 1px 2px rgba(255,255,255,0.95), 0 0 14px rgba(255,255,255,0.85)" }}>
            {initials}
          </h2>
          <p className="italic text-[13.5px] leading-[22px] tracking-[0.01em] px-2 font-medium relative z-10" style={{ ...FONT_DISPLAY, color: "#2D2118", textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>
            {profile.quote_text || DEFAULT_VERSE}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 relative z-10">
            <span className="text-[11px] tracking-[0.25em] font-semibold uppercase relative z-10" style={{ ...FONT_DISPLAY, color: "#7C5A37", textShadow: "0 1px 2px rgba(255,255,255,0.75)" }}>
              {profile.quote_source || "QS. AR-RUM: 21"}
            </span>
          </div>
        </div>
      </section>

      <div className="flex-1 min-h-0 flex items-center justify-center relative pointer-events-none w-full">
        <div className="relative flex flex-col items-center justify-end w-full max-w-[370px] h-full max-h-[380px] px-4 mx-auto">
          <div className="absolute -left-4 bottom-6 origin-bottom-left opacity-90 pointer-events-none pc-shell-sway" style={{ transformOrigin: "bottom left" }}>
            <svg fill="none" height="78" viewBox="0 0 75 90" width="65">
              <path d="M8 88 C18 68 25 48 50 25" fill="none" stroke="#8E6B3D" strokeLinecap="round" strokeWidth="1.6" opacity="0.8" />
              <path d="M22 64 C30 55 42 58 46 64 C42 70 29 71 22 64 Z" fill="#6f8e72" opacity="0.85" />
              <g transform="translate(35, 12) scale(0.68)" style={{ transformOrigin: "14px 14px" }}>
                <circle cx="14" cy="14" fill="#d4af37" opacity="0.85" r="7" />
                <circle cx="14" cy="4" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="22" cy="8" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="22" cy="20" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="14" cy="24" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="6" cy="20" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="6" cy="8" fill="#FFF9F0" opacity="0.95" r="5.5" />
                <circle cx="14" cy="14" fill="#f2ca50" r="3.8" />
              </g>
            </svg>
          </div>
          <svg className="absolute bottom-28 left-6 pc-sparkle-1 pointer-events-none" fill="none" height="16" viewBox="0 0 24 24" width="16">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#d4af37" opacity="0.85" />
          </svg>
          <svg className="absolute bottom-36 right-8 pc-sparkle-2 pointer-events-none" fill="none" height="14" viewBox="0 0 24 24" width="14">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#ecc99f" opacity="0.9" />
          </svg>
          <div className="absolute -inset-2 pointer-events-none flex items-center justify-center">
            <div
              className="w-[236px] aspect-[3/4] rounded-t-full rounded-b-2xl pointer-events-none"
              style={{ border: "1.5px solid rgba(212, 175, 55, 0.6)", boxShadow: "0 8px 24px rgba(74, 52, 39, 0.12), inset 0 0 12px rgba(255, 255, 255, 0.4)", opacity: 0.95 }}
            />
          </div>
          <div
            className="relative w-[210px] aspect-[3/4] rounded-t-full rounded-b-2xl overflow-hidden p-1 bg-[#FDFBF7]"
            style={{ border: "2.5px solid #d4af37", boxShadow: "0 12px 28px rgba(74, 52, 39, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)" }}
          >
            <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-xl" />
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 15px rgba(255, 248, 238, 0.25)" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
