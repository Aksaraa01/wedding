"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_SCRIPT } from "../../shared/Skin"
import { photoList } from "../../shared/lib"

export default function PersonPage({ profile, side }: { profile: TemplateProps; side: "groom" | "bride" }) {
  const isGroom = side === "groom"
  const photo = photoList(isGroom ? profile.groom_photo_url : profile.bride_photo_url)[0]
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
    <div className="flex-shrink-0 relative flex flex-col items-center z-10 -mt-10 mb-1">
      <div className="absolute -inset-2 rounded-t-[80px] rounded-b-xl bg-amber-100/40 blur-sm pointer-events-none -z-10" />
      <div
        className="pc-frame-pulse relative w-[120px] h-[165px] rounded-t-[78px] rounded-b-xl overflow-hidden p-[3px] bg-gradient-to-b from-[#FFFDF7] via-[#F6EFE2] to-[#E9DEC9] z-10"
        style={{ boxShadow: "0 14px 30px -6px rgba(32, 24, 16, 0.35), 0 0 0 1.5px rgba(212, 175, 55, 0.45), 0 0 0 3px rgba(255, 252, 245, 0.9)" }}
      >
        <div className="relative w-full h-full rounded-t-[72px] rounded-b-lg overflow-hidden border border-amber-200/50 bg-[#F4EDE2]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={fullName || shortName || ""} className="w-full h-full object-cover object-top scale-105" loading="lazy" style={{ filter: "contrast(1.04) brightness(1.02) saturate(0.96)" }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F4EDE2]">
              <span className="material-symbols-outlined text-4xl text-[#8E6B3D]/50">person</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2c2016]/30 via-transparent to-amber-100/10 pointer-events-none" />
        </div>
      </div>
    </div>
  )

  const textBlock = (
    <div className="flex flex-col items-start text-left flex-1 min-w-0 pr-1">
      <h1 className="pc-stagger-1 text-[3rem] leading-[0.9] text-[#233543] filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" style={FONT_SCRIPT}>
        {shortName || "Mempelai"}
      </h1>
      <h2 className="pc-stagger-2 font-semibold text-[0.95rem] tracking-[0.12em] uppercase text-[#1e2d38] mt-0.5 mb-1.5 leading-tight" style={FONT_BODY}>
        {fullName || shortName || "Mempelai"}
      </h2>
      {parents && (
        <>
          <p className="pc-stagger-3 italic text-xs text-[#3b474e] font-normal leading-none mb-1" style={FONT_BODY}>
            {isGroom ? "Putra dari" : "Putri dari"}
          </p>
          <p className="pc-stagger-4 font-medium text-xs leading-snug text-[#1e2d38] mb-2" style={FONT_BODY}>
            {parents}
          </p>
        </>
      )}
      {handle && (
        <a
          href={linkHref}
          target={linkHref ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="pc-stagger-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b2025] border border-[#d4af37]/80 shadow-md text-[#f2ca50] hover:text-white transition-colors"
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
    <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col justify-end">
      <div className="pc-sea-shimmer absolute top-[58%] left-0 right-0 h-10 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-[3px] pointer-events-none" />
      <section className="relative z-20 w-full mt-auto">
        <div className="relative w-full pc-shell-sway overflow-hidden pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.pastelCoastal.shell}
            alt=""
            draggable={false}
            loading="lazy"
            className="absolute inset-0 w-[112%] max-w-none -left-[6%] h-[115%] object-cover object-top pointer-events-none drop-shadow-[0_-12px_24px_rgba(0,0,0,0.14)]"
            style={{ filter: "contrast(1.03) brightness(0.98)" }}
          />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 60%, rgba(254, 215, 203, 0.55), rgba(248, 196, 180, 0.35) 60%, transparent 100%)", mixBlendMode: "multiply" }} />
          <div className="relative z-10 w-full px-7 pt-4 pb-8 flex flex-col items-center text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8E6B3D] font-bold mb-1" style={FONT_BODY}>
              {isGroom ? "The Groom" : "The Bride"}
            </p>
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
