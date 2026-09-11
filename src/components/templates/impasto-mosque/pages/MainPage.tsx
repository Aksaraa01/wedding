"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { firstImage, initialsOf } from "../../shared/lib"

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
    <div className="flex-1 w-full max-w-[370px] mx-auto flex flex-col items-center text-center px-4 pt-3">
      <div className="w-full relative select-none flex flex-col items-center text-center px-5 py-6">
        <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-visible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.impastoMosque.brush} alt="" className="w-[115%] h-[115%] max-w-none object-cover mix-blend-screen drop-shadow-md" loading="lazy" style={{ maskImage: "radial-gradient(90% 80%, black 65%, transparent 100%)" }} />
        </div>
        <h2 className="text-[38px] leading-tight tracking-wide mb-2 relative z-10" style={{ ...FONT_SCRIPT, color: "#171c21", textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}>
          {initials}
        </h2>
        <p className="italic text-[13px] leading-[22px] tracking-[0.01em] px-3 font-medium relative z-10" style={{ ...FONT_DISPLAY, color: "#1c2227" }}>
          {profile.quote_text || DEFAULT_VERSE}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2.5 relative z-10">
          <span className="text-[11px] tracking-[0.25em] font-semibold uppercase" style={{ ...FONT_DISPLAY, color: "#2e353d" }}>
            {profile.quote_source || "QS. AR-RUM: 21"}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center relative pointer-events-none w-full">
        <div className="relative flex flex-col items-center justify-end w-full h-full max-h-[380px] px-6">
          <div className="absolute -left-4 bottom-6 origin-bottom-left opacity-80 pointer-events-none">
            <svg fill="none" height="78" viewBox="0 0 75 90" width="65">
              <path d="M8 88 C18 68 25 48 50 25" fill="none" stroke="#8E6B3D" strokeLinecap="round" strokeWidth="1.6" opacity="0.75" />
              <path d="M22 64 C30 55 42 58 46 64 C42 70 29 71 22 64 Z" fill="#3a4e3c" opacity="0.75" />
            </svg>
          </div>
          <svg className="absolute bottom-28 left-6 im-sparkle-1 pointer-events-none" fill="none" height="16" viewBox="0 0 24 24" width="16">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#ffe088" />
          </svg>
          <svg className="absolute bottom-36 right-8 im-sparkle-2 pointer-events-none" fill="none" height="14" viewBox="0 0 24 24" width="14">
            <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#f2ca50" />
          </svg>
          <div className="absolute -inset-2 pointer-events-none flex items-center justify-center">
            <div
              className="w-[236px] aspect-[3/4] rounded-t-full rounded-b-2xl pointer-events-none"
              style={{ border: "1.5px solid rgba(242,202,80,0.65)", boxShadow: "0 0 24px rgba(212,175,55,0.35), inset 0 0 16px rgba(212,175,55,0.2)", opacity: 0.95 }}
            />
          </div>
          <div
            className="relative w-[210px] aspect-[3/4] rounded-t-full rounded-b-2xl overflow-hidden p-1 bg-[#f7f4ee]/40"
            style={{ border: "2.5px solid #d4af37", boxShadow: "0 0 20px rgba(212,175,55,0.5), inset 0 0 14px rgba(212,175,55,0.3), 0 16px 36px rgba(0,0,0,0.85)" }}
          >
            <CouplePhoto profile={profile} className="w-full h-full rounded-t-full rounded-b-xl" />
            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 20px rgba(42,31,24,0.4), inset 0 -30px 30px rgba(15,20,25,0.5)" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
