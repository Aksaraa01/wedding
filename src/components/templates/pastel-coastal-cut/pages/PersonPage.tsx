"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_SCRIPT } from "../../shared/Skin"
import { bridePhoto, groomPhoto } from "../../shared/lib"

export default function PersonPage({ profile, side, language = "id" }: { profile: TemplateProps; side: "groom" | "bride"; language?: string }) {
  const lang = (language === "en" ? "en" : "id") as "id" | "en"
  const isGroom = side === "groom"
  const photo = isGroom ? groomPhoto(profile.groom_photo_url) : bridePhoto(profile.bride_photo_url)
  const fullName = (isGroom ? profile.groom_full_name : profile.bride_full_name) || undefined
  const shortName = (isGroom ? profile.groom_name : profile.bride_name) || undefined
  const parents = ((isGroom ? profile.groom_parents : profile.bride_parents) || "").trim()
  const instagram = ((isGroom ? profile.groom_instagram : profile.bride_instagram) || "").trim()

  const raw = instagram.trim()
  const handle = raw
    ? raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "")
    : undefined
  const linkHref = raw ? (raw.includes("instagram.com") ? raw : `https://instagram.com/${raw.replace(/^@/, "")}`) : undefined

  const photoFrame = (
    <div className="pc-photo-in flex-shrink-0 relative flex flex-col items-center z-10 -mt-10 mb-1">
      <div className="absolute -inset-2 rounded-t-[80px] rounded-b-xl bg-amber-100/40 blur-sm pointer-events-none -z-10" />
      <div
        className="pc-frame-pulse relative w-[120px] h-[165px] rounded-t-[78px] rounded-b-xl overflow-hidden p-[3px] bg-gradient-to-b from-[#FFFDF7] via-[#F6EFE2] to-[#E9DEC9] z-10"
        style={{ boxShadow: "0 14px 30px -6px rgba(32, 24, 16, 0.35), 0 0 0 1.5px rgba(212, 175, 55, 0.45), 0 0 0 3px rgba(255, 252, 245, 0.9), 0 5px 14px rgba(200, 160, 100, 0.25)" }}
      >
        <div className="relative w-full h-full rounded-t-[72px] rounded-b-lg overflow-hidden border border-amber-200/50 bg-[#F4EDE2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={fullName || shortName || ""} className="w-full h-full object-cover object-top scale-105" loading="lazy" style={{ filter: "contrast(1.04) brightness(1.02) saturate(0.96)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2c2016]/30 via-transparent to-amber-100/10 pointer-events-none" />
        </div>
      </div>
    </div>
  )

  const textBlock = (
    <div className={`flex flex-col flex-1 min-w-0 pr-1 ${isGroom ? "items-start text-left" : "items-end text-right"}`}>
      <h1 className="pc-stagger-1 text-[3rem] leading-[0.9] text-[#233543] filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" style={FONT_SCRIPT}>
        {shortName || (lang === "en" ? "The Bride/Groom" : "Mempelai")}
      </h1>
      <h2 className="pc-stagger-2 font-semibold text-[0.95rem] tracking-[0.12em] uppercase text-[#1e2d38] mt-0.5 mb-1.5 leading-tight" style={FONT_BODY}>
        {fullName || shortName || (lang === "en" ? "The Bride/Groom" : "Mempelai")}
      </h2>
      {parents && (
        <p className="pc-stagger-4 font-medium text-xs leading-snug text-[#1f2930] mb-2.5" style={FONT_BODY}>
          {parents}
        </p>
      )}
      {handle && (
        <a
          href={linkHref}
          target={linkHref ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="pc-stagger-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d59a8c]/40 hover:bg-[#d59a8c]/50 active:scale-95 backdrop-blur-sm border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200"
        >
          <svg className="w-3 h-3 text-[#2b2b2b]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span className="text-[11px] font-medium tracking-wide text-[#292929]" style={FONT_BODY}>@{handle}</span>
        </a>
      )}
    </div>
  )

  return (
    <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col justify-end">
      <div className="pc-sea-shimmer absolute top-[58%] left-0 right-0 h-10 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-[3px] pointer-events-none" />
      <section className="pc-shell-in relative z-20 w-full mt-auto">
        <div className="relative w-full shell-container pc-shell-sway overflow-hidden pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.pastelCoastal.shell}
            alt=""
            draggable={false}
            loading="lazy"
            className={`absolute inset-0 w-[112%] max-w-none -left-[6%] h-[115%] object-cover object-top pointer-events-none drop-shadow-[0_-12px_24px_rgba(0,0,0,0.14)] ${isGroom ? "" : "scale-x-[-1]"}`}
            style={{ filter: "contrast(1.03) brightness(0.98)" }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 60%, rgba(254, 215, 203, 0.55), rgba(248, 196, 180, 0.35) 60%, transparent 100%)", mixBlendMode: "multiply" }} />
          <div className="relative z-10 w-full px-7 pt-4 pb-8 flex flex-col items-center text-center">
            <div className="flex flex-row items-center justify-center gap-3 w-full max-w-[390px] mx-auto pt-2 pb-2">
              {isGroom ? (
                <>{photoFrame}{textBlock}</>
              ) : (
                <>{textBlock}{photoFrame}</>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
