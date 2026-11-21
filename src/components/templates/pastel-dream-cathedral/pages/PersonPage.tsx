"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
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
    <div
      className={`relative w-[185px] sm:w-[200px] aspect-[3/4] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.65)] p-1 flex-shrink-0 ${
        isGroom
          ? "rounded-t-full rounded-bl-none rounded-br-2xl border-2 border-l-0 border-b-0 border-[#d4af37]/70 -translate-x-1 translate-y-1"
          : "rounded-t-full rounded-br-none rounded-bl-2xl overflow-hidden border-2 border-r-0 border-b-0 border-[#d4af37]/70 translate-x-1 translate-y-1"
      }`}
      style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.45) 0%, rgba(42,31,24,0.6) 100%)" }}
    >
      <div className={`w-full h-full overflow-hidden relative ${isGroom ? "rounded-t-full rounded-br-xl" : "rounded-t-full rounded-bl-xl"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={fullName || ""} className={`w-full h-full object-cover object-top brightness-[1.02] contrast-[1.03] ${isGroom ? "scale-x-[-1]" : ""}`} loading="lazy" />
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 20px rgba(42,31,24,0.4), inset 0 -30px 30px rgba(15,20,25,0.5)" }} />
        <div className={`absolute inset-1.5 pointer-events-none border border-[#d4af37]/25 ${isGroom ? "rounded-t-full rounded-br-xl" : "rounded-t-full rounded-bl-xl"}`} />
      </div>
    </div>
  )

  const textBlock = (
    <div className={`flex-1 max-w-[210px] pb-4 z-20 flex flex-col ${isGroom ? "items-end text-right" : "items-start text-left"}`}>
      <h1 className="italic text-[30px] sm:text-[34px] leading-[1.1] tracking-tight mb-2" style={{ ...FONT_DISPLAY, color: "#241a00", textShadow: "0 1px 2px rgba(255,255,255,0.6)" }}>
        {`${fullName || shortName || (lang === "en" ? "The Bride/Groom" : "Mempelai")},`}
      </h1>
      {parents && (
        <p className="text-[11.5px] leading-[17px] font-normal mb-3.5" style={{ ...FONT_BODY, color: "#2c3136", textShadow: "0 1px 1px rgba(255,255,255,0.5)" }}>
          <span className="font-semibold" style={{ color: "#171c21" }}>{parents}</span>
        </p>
      )}
      {handle && (
        <a
          href={linkHref}
          target={linkHref ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b2025] border border-[#d4af37]/80 shadow-md text-[#f2ca50] hover:text-white transition-colors"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span className="text-[11px] font-semibold tracking-wider" style={FONT_BODY}>@{handle}</span>
        </a>
      )}
    </div>
  )

  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto flex flex-col items-center justify-end text-center px-2">
      <div className="relative flex flex-col justify-end w-full pointer-events-auto pb-0 overflow-visible">
        <div className={`absolute bottom-8 w-[130%] h-[380px] pointer-events-none -z-10 opacity-95 mix-blend-screen scale-110 ${isGroom ? "right-[-15%] -scale-x-100" : "left-[-15%]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.pastelDreamCathedral.brush} alt="" className="w-full h-full object-contain object-bottom drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]" loading="lazy" />
        </div>
        <div className="relative z-10 flex flex-col justify-end px-6 pb-6">
          <div className="flex items-end justify-between gap-3">
            {isGroom ? (
              <>{photoFrame}{textBlock}</>
            ) : (
              <>{textBlock}{photoFrame}</>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
