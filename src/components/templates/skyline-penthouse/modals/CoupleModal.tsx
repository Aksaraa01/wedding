"use client"

import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import { photoList } from "../lib"

const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const
const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const

function PersonCard({
  photo,
  name,
  shortName,
  parents,
  instagram,
}: {
  photo?: string
  name?: string
  shortName?: string
  parents?: string
  instagram?: string
}) {
  // Instagram handle, tolerating "@user", bare username, or a full profile URL.
  const raw = (instagram || "").trim()
  const handle = raw
    ? raw
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/+$/, "")
    : (shortName || name || "").split(/\s+/)[0]?.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase()
  const linkHref = raw
    ? raw.includes("instagram.com")
      ? raw
      : `https://instagram.com/${raw.replace(/^@/, "")}`
    : undefined
  return (
    <article className="relative rounded-2xl bg-gradient-to-b from-[#141a2c]/90 to-[#0e1424]/95 border border-slate-700/70 p-3.5 shadow-lg hover:border-[#38bdf8]/60 transition-all duration-300">
      <div className="flex items-center gap-3.5">
        {photo ? (
          <div className="relative shrink-0 w-[96px] h-[96px] rounded-xl overflow-hidden border border-[#38bdf8]/50 shadow-[0_0_10px_rgba(56,189,248,0.35)] bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={name || ""} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="relative shrink-0 w-[96px] h-[96px] rounded-xl overflow-hidden border border-[#38bdf8]/40 bg-slate-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#38bdf8]/50" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-white truncate" style={DISPLAY}>
            {name || shortName || "Mempelai"}
          </h3>
          {parents && (
            <p className="text-[11px] text-slate-400 leading-snug mt-1">
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
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-[#38bdf8]/15 border border-slate-700 hover:border-[#38bdf8]/50 text-[11px] font-medium text-slate-300 hover:text-[#38bdf8] transition-all duration-200 active:scale-95 w-fit"
            style={BODY}
          >
            <svg
              className="w-3.5 h-3.5 fill-current text-[#38bdf8] shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="truncate max-w-[110px]">@{handle}</span>
            <span className="material-symbols-outlined text-[12px] text-slate-500">north_east</span>
          </a>
        </div>
      </div>
    </article>
  )
}

export default function CoupleModal({ profile, onClose }: { profile: TemplateProps; onClose: () => void }) {
  const groomPhoto = photoList(profile.groom_photo_url)[0]
  const bridePhoto = photoList(profile.bride_photo_url)[0]
  const hasQuote = profile.quote_text

  return (
    <ModalShell icon="favorite" iconFill title="THE BRIDE & GROOM" serifTitle onClose={onClose}>
      <PersonCard
        photo={groomPhoto}
        name={profile.groom_full_name || profile.groom_name}
        shortName={profile.groom_name}
        parents={profile.groom_parents}
        instagram={profile.groom_instagram}
      />

      <div className="flex items-center justify-center">
        <div className="flex-grow border-t border-slate-800/80" />
        <div className="mx-3 px-3 py-0.5 rounded-full bg-slate-900 border border-[#38bdf8]/30 text-[10px] font-bold text-[#8ed5ff] shadow-[0_0_10px_rgba(56,189,248,0.35)]" style={DISPLAY}>
          &amp;
        </div>
        <div className="flex-grow border-t border-slate-800/80" />
      </div>

      <PersonCard
        photo={bridePhoto}
        name={profile.bride_full_name || profile.bride_name}
        shortName={profile.bride_name}
        parents={profile.bride_parents}
        instagram={profile.bride_instagram}
      />

      {hasQuote && (
        <div className="rounded-xl bg-slate-900/50 border border-slate-800/80 p-3 text-center">
          {profile.quote_source && (
            <span className="text-[9px] font-semibold tracking-[0.2em] text-[#8ed5ff]/80 uppercase block mb-1" style={BODY}>
              {profile.quote_source}
            </span>
          )}
          <p className="text-xs italic text-slate-300 leading-relaxed" style={DISPLAY}>
            &ldquo;{profile.quote_text}&rdquo;
          </p>
        </div>
      )}
    </ModalShell>
  )
}
