"use client"

import { normalizeLanguage } from "@/lib/i18n";

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { bridePhoto, groomPhoto, initialsOf } from "../../shared/lib"
import CardShell from "./CardShell"

export default function CoupleCard({ profile, onHide }: { profile: TemplateProps; onHide: () => void }) {
  const lang = normalizeLanguage(profile.language);
  const groomPhotoUrl = groomPhoto(profile.groom_photo_url)
  const bridePhotoUrl = bridePhoto(profile.bride_photo_url)
  const groomTag = initialsOf(profile.groom_name)
  const brideTag = initialsOf(profile.bride_name)

  const person = (
    key: "groom" | "bride",
    photo: string | undefined,
    tag: string,
    fullName: string | undefined,
    shortName: string | undefined,
    parents: string | undefined,
    parentsLabel: string,
    instagram: string | undefined,
  ) => {
    const cyan = key === "groom"
    const raw = (instagram || "").trim()
    const handle = raw
      ? raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "")
      : (shortName || fullName || "").split(/\s+/)[0]?.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase()
    const linkHref = raw ? (raw.includes("instagram.com") ? raw : `https://instagram.com/${raw.replace(/^@/, "")}`) : undefined
    return (
      <div className={`rounded-xl bg-[#090e1c]/90 border ${cyan ? "border-cyan-400/40" : "border-pink-400/40"} p-2.5 flex items-center gap-3`}>
        {photo ? (
          <div className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border ${cyan ? "border-cyan-400" : "border-pink-400"} bg-slate-900`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={fullName || ""} className="w-full h-full object-contain" loading="lazy" />
          </div>
        ) : (
          <div className={`shrink-0 w-20 h-20 rounded-xl bg-cyan-500/20 border ${cyan ? "border-cyan-400 text-cyan-300" : "border-pink-400 text-pink-300"} flex items-center justify-center text-xs shadow-[0_0_10px_rgba(56,189,248,0.4)]`} style={FONT_PIXEL}>
            {tag || "P1"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[10px] text-white truncate" style={FONT_PIXEL}>
              {fullName || shortName || (lang === "en" ? "Bride/Groom" : "Mempelai")}
            </h3>
            <span className={`text-[8px] shrink-0 ${cyan ? "text-cyan-400" : "text-pink-400"}`}>
              {key === "groom" ? "P1 GROOM" : "P2 BRIDE"}
            </span>
          </div>
          {parents && (
            <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
              {parentsLabel} {parents}
            </p>
          )}
          <a
            href={linkHref}
            target={linkHref ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-disabled={!linkHref}
            className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1321] border ${cyan ? "border-[#38bdf8]/40" : "border-[#f472b6]/40"} text-[10px] hover:opacity-90 transition-all active:scale-95 shadow-sm w-fit ${cyan ? "text-[#38bdf8]" : "text-[#f472b6]"}`}
            style={FONT_PIXEL}
          >
            <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="truncate max-w-[90px]">@{handle}</span>
            <span className="material-symbols-outlined text-[11px]">north_east</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <CardShell icon="favorite" eyebrow="STAGE: SOULMATES" title="The Bride & The Groom" badge="LVL.100" onHide={onHide}>
      {person("groom", groomPhotoUrl, groomTag, profile.groom_full_name || undefined, profile.groom_name || undefined, profile.groom_parents || undefined, "Putra dari", profile.groom_instagram || undefined)}
      <div className="flex items-center justify-center">
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
        <div className="mx-2.5 px-2.5 py-0.5 rounded-full bg-[#161b2a] border border-pink-400/50 text-[9px] font-bold text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.35)] flex items-center gap-1" style={FONT_PIXEL}>
          <span className="material-symbols-outlined text-[12px] animate-pulse">favorite</span>
          CO-OP MODE
        </div>
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
      </div>
      {person("bride", bridePhotoUrl, brideTag, profile.bride_full_name || undefined, profile.bride_name || undefined, profile.bride_parents || undefined, "Putri dari", profile.bride_instagram || undefined)}
      {profile.quote_text && (
        <div className="rounded-xl bg-[#090e1c]/90 border border-dashed border-cyan-400/40 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[12px] text-cyan-400">chat</span>
            <span className="text-[8px] font-bold tracking-widest text-cyan-300 uppercase" style={FONT_PIXEL}>
              {profile.quote_source || "AR-RUM: 21"}
            </span>
          </div>
          <p className="italic text-[11px] text-slate-200 leading-snug">&ldquo;{profile.quote_text}&rdquo;</p>
        </div>
      )}
    </CardShell>
  )
}