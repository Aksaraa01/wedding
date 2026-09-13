"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_DISPLAY, FONT_PIXEL } from "../../shared/Skin"
import { bridePhoto, groomPhoto } from "../../shared/lib"
import ModalShell from "./ModalShell"

function PersonCard({
  side,
  photo,
  name,
  shortName,
  parents,
  instagram,
}: {
  side: "groom" | "bride"
  photo?: string
  name?: string
  shortName?: string
  parents?: string
  instagram?: string
}) {
  const cyan = side === "groom"
  const accentText = cyan ? "text-[#38bdf8]" : "text-[#f472b6]"
  const accentBorder = cyan ? "border-[#38bdf8]/40" : "border-[#f472b6]/40"
  const accentFrame = cyan ? "border-[#38bdf8]/60 shadow-[0_0_10px_rgba(56,189,248,0.35)]" : "border-[#f472b6]/60 shadow-[0_0_10px_rgba(244,114,182,0.35)]"

  const raw = (instagram || "").trim()
  const handle = raw
    ? raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "")
    : (shortName || name || "").split(/\s+/)[0]?.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase()
  const linkHref = raw ? (raw.includes("instagram.com") ? raw : `https://instagram.com/${raw.replace(/^@/, "")}`) : undefined

  return (
    <article className={`relative rounded-xl bg-gradient-to-b from-[#161b2a] to-[#0e1321] border-2 ${accentBorder} p-3.5 shadow-[0_0_15px_rgba(56,189,248,0.15)]`}>
      <div className="flex items-center gap-3.5">
        {photo ? (
          <div className={`relative shrink-0 w-[96px] h-[96px] rounded-lg overflow-hidden border-2 ${accentFrame} bg-slate-900`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={name || ""} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className={`relative shrink-0 w-[96px] h-[96px] rounded-lg overflow-hidden border-2 ${accentFrame} bg-slate-900 flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-3xl ${accentText}/50`} style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold tracking-wide uppercase ${accentText} ${accentText}/10 ${accentBorder}`} style={FONT_PIXEL}>
              {side === "groom" ? "GROOM" : "BRIDE"}
            </span>
            <span className="text-[9px] text-slate-400" style={FONT_PIXEL}>LV. 100</span>
          </div>
          <h2 className="text-lg font-bold text-white truncate" style={FONT_DISPLAY}>
            {name || shortName || "Mempelai"}
          </h2>
          {parents && (
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
              {parents.split("\n").map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </p>
          )}
          <a
            href={linkHref}
            target={linkHref ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-disabled={!linkHref}
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0e1321] border ${accentBorder} text-[11px] hover:opacity-90 transition-all active:scale-95 shadow-sm w-fit ${accentText}`}
            style={FONT_PIXEL}
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="truncate max-w-[100px]">@{handle}</span>
            <span className="material-symbols-outlined text-[12px]">north_east</span>
          </a>
        </div>
      </div>
    </article>
  )
}

export default function CoupleModal({ profile, onClose }: { profile: TemplateProps; onClose: () => void }) {
  const groomPhotoUrl = groomPhoto(profile.groom_photo_url)
  const bridePhotoUrl = bridePhoto(profile.bride_photo_url)

  return (
    <ModalShell
      icon="videogame_asset"
      iconColor="pink"
      eyebrow="STAGE: SOULMATES"
      eyebrowColor="cyan"
      title="The Bride & The Groom"
      onClose={onClose}
    >
      <PersonCard
        side="groom"
        photo={groomPhotoUrl}
        name={profile.groom_full_name || profile.groom_name}
        shortName={profile.groom_name}
        parents={profile.groom_parents}
        instagram={profile.groom_instagram}
      />

      <div className="flex items-center justify-center">
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
        <div className="mx-3 px-3 py-1 rounded-full bg-[#161b2a] border border-[#f472b6]/50 text-[11px] text-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.35)] flex items-center gap-1.5" style={FONT_PIXEL}>
          <span className="material-symbols-outlined text-[14px] animate-pulse">favorite</span>
          CO-OP MODE
        </div>
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
      </div>

      <PersonCard
        side="bride"
        photo={bridePhotoUrl}
        name={profile.bride_full_name || profile.bride_name}
        shortName={profile.bride_name}
        parents={profile.bride_parents}
        instagram={profile.bride_instagram}
      />

      {profile.quote_text && (
        <div className="rounded-xl bg-[#090e1c] border-2 border-dashed border-[#38bdf8]/40 p-3.5 text-center relative">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">chat</span>
            {profile.quote_source && (
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#38bdf8] uppercase" style={FONT_PIXEL}>
                {profile.quote_source}
              </span>
            )}
          </div>
          <p className="text-xs italic text-slate-200 leading-relaxed" style={FONT_DISPLAY}>
            &ldquo;{profile.quote_text}&rdquo;
          </p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[8px] text-slate-400" style={FONT_PIXEL}>
            <span className="text-pink-400">♥</span> PRESS ANY BUTTON TO CONTINUE <span className="text-[#38bdf8]">▶</span>
          </div>
        </div>
      )}
    </ModalShell>
  )
}