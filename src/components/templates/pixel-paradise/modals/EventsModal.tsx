"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { countdownTarget, coverPhoto, formatDotDate, formatLongDate, gcalLink, type SessionData } from "../../shared/lib"
import { useCountdown } from "../../shared/useCountdown"
import { toTransformedUrl } from "@/lib/storageUrl"
import ModalShell from "./ModalShell"
import { normalizeLanguage, t } from "@/lib/i18n"

function SessionCard({ session }: { session: SessionData }) {
  const badge = (session.name || "").trim().toUpperCase() || "MOMENT"
  const mapsUrl = session.maps_url || ""
  const location = [session.venue, session.address].filter(Boolean).join(" • ")
  return (
    <article className="p-4 rounded-2xl bg-[#081020]/95 border-2 border-[#38bdf8]/40 relative overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.12)]">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#38bdf8]/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <span className="px-2.5 py-1 rounded-md text-[9px] text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]" style={FONT_PIXEL}>
          {badge}
        </span>
        {session.time && (
          <span className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">schedule</span>
            {session.time}
          </span>
        )}
      </div>
      <div className="space-y-1.5 mb-3 text-left">
        {session.date && (
          <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span className="text-[#f472b6]">♥</span>
            {formatLongDate(session.date)}
          </div>
        )}
        {location && (
          <div className="flex items-start gap-2 text-xs text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-[#38bdf8] shrink-0 mt-0.5">location_on</span>
            <span>{location}</span>
          </div>
        )}
      </div>
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0d3b66]/70 to-[#0284c7]/50 border-2 border-[#38bdf8]/60 hover:border-[#38bdf8] text-[#38bdf8] hover:text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.3)] transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          <span className="text-[9px] tracking-wide" style={FONT_PIXEL}>
            NAVIGATE TO VENUE
          </span>
        </a>
      )}
    </article>
  )
}

export default function EventsModal({ profile, templateContent, onClose }: { profile: TemplateProps; templateContent?: Record<string, string>; onClose: () => void }) {
  const tc = templateContent || {}
  const lang = normalizeLanguage(profile.language)
  const sessions: SessionData[] = (Array.isArray(profile.sessions) ? profile.sessions : []).filter((s) => s && (s.date || s.venue))
  const cover = coverPhoto(profile)
  const target = countdownTarget(sessions, profile.estimated_wedding_date)
  const { days, hours, minutes, seconds } = useCountdown(target)
  const calLink = gcalLink(sessions[0], profile.groom_name, profile.bride_name)
  const pad2 = (n: number) => String(n).padStart(2, "0")

  return (
    <ModalShell icon="event" eyebrow={tc.save_date_label || "RETRO ARCADE LOUNGE"} title={tc.events_title || "DATE & VENUE"} onClose={onClose}>
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#38bdf8]/40 group shadow-lg bg-[#090e1c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={toTransformedUrl(cover, { width: 800 })} alt="Venue" className="w-full h-44 object-contain" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090f1d]/60 via-transparent to-black/20 pointer-events-none" />
      </div>

      {target && (
        <section className="p-3.5 rounded-2xl bg-[#081020]/95 border-2 border-[#38bdf8]/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5" style={{ ...FONT_PIXEL, textShadow: "0 0 10px rgba(56,189,248,0.7)" }}>
              <span className="inline-block w-2 h-2 rounded-sm bg-[#f472b6] animate-ping" />
              COUNTDOWN TIMER
            </span>
            <span className="text-[8px] text-[#f472b6] tracking-wider" style={FONT_PIXEL}>
              {formatDotDate(profile.estimated_wedding_date || sessions[0]?.date)}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: pad2(days), l: "DAYS", c: "text-[#38bdf8]" },
              { v: pad2(hours), l: "HRS", c: "text-[#38bdf8]" },
              { v: pad2(minutes), l: "MIN", c: "text-[#38bdf8]" },
              { v: pad2(seconds), l: "SEC", c: "text-[#f472b6]" },
            ].map((c) => (
              <div key={c.l} className="py-2 px-1 rounded-xl bg-[#050914] border border-[#38bdf8]/40 shadow-[inset_0_0_12px_rgba(56,189,248,0.2)]">
                <span className={`block text-lg font-extrabold leading-tight ${c.c}`} style={FONT_PIXEL}>
                  {c.v}
                </span>
                <span className="text-[7px] tracking-widest text-slate-400 uppercase" style={FONT_PIXEL}>
                  {c.l}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          {profile.estimated_wedding_date ? formatLongDate(profile.estimated_wedding_date) : normalizeLanguage(profile.language) === "en" ? "Event details will be announced soon." : "Detail acara akan segera diumumkan."}
        </p>
      )}

      {sessions.map((s, i) => (
        <SessionCard key={i} session={s} />
      ))}

      {(profile.dresscode_visible !== false && (tc.dresscode_title || profile.dresscode?.description)) && (
        <section className="p-3.5 rounded-2xl bg-[#081020]/95 border-2 border-[#38bdf8]/40 text-center">
          <p className="text-[9px] tracking-wider uppercase text-[#f472b6]" style={FONT_PIXEL}>
            {tc.dresscode_title || t("secDresscode", lang)}
          </p>
          {profile.dresscode?.description && (
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{profile.dresscode.description}</p>
          )}
        </section>
      )}

      {calLink && (
        <a
          href={calLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#ec4899] hover:brightness-110 border-2 border-[#38bdf8] text-white text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 active:scale-[0.97]"
          style={FONT_PIXEL}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          SAVE TO CALENDAR
        </a>
      )}
    </ModalShell>
  )
}