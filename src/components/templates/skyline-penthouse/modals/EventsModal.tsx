"use client"

import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import { countdownTarget, coverPhoto, formatDotDate, formatLongDate, gcalLink, type SessionData } from "../lib"
import { normalizeLanguage, t } from "@/lib/i18n"
import { useCountdown } from "../useCountdown"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const
const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const

function SessionCard({ session, lang = "id" }: { session: SessionData; lang?: "id" | "en" }) {
  const badge = (session.name || "").trim().toUpperCase() || "MOMENT"
  const mapsUrl = session.maps_url || ""
  const location = [session.venue, session.address].filter(Boolean).join(" • ")
  return (
    <article className="p-4 rounded-2xl bg-[#081020]/95 border border-[#38bdf8]/35 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#38bdf8]/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider text-[#8ed5ff] bg-[#38bdf8]/10 border border-[#38bdf8]/30">
          {badge}
        </span>
        {session.time && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">schedule</span>
            {session.time}
          </span>
        )}
      </div>
      <div className="space-y-1.5 mb-3.5 text-left">
        {session.date && (
          <div className="text-sm font-bold text-white tracking-wide" style={DISPLAY}>
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
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0d3b66]/60 to-[#0284c7]/40 border border-[#38bdf8]/50 hover:border-[#38bdf8] text-[#38bdf8] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={BODY}
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          {t("viewLocation", lang)}
        </a>
      )}
    </article>
  )
}

export default function EventsModal({ profile, onClose }: { profile: TemplateProps; onClose: () => void }) {
  const lang = normalizeLanguage(profile.language)
  const sessions: SessionData[] = (Array.isArray(profile.sessions) ? profile.sessions : []).filter(
    (s) => s && (s.date || s.venue)
  )
  const cover = coverPhoto(profile)
  const target = countdownTarget(sessions, profile.estimated_wedding_date)
  const { days, hours, minutes, seconds } = useCountdown(target)
  const calLink = gcalLink(sessions[0], profile.groom_name, profile.bride_name)
  const labelDate = formatLongDate(profile.estimated_wedding_date || sessions[0]?.date)

  const pad2 = (n: number) => String(n).padStart(2, "0")

  return (
    <ModalShell icon="event" eyebrow={t("saveTheDate", lang).toUpperCase()} title={lang === "en" ? "DATE & VENUE" : "TANGGAL & LOKASI"} onClose={onClose}>
      <div className="relative rounded-2xl overflow-hidden border border-[#38bdf8]/35 group shadow-lg bg-[#090e1c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="Venue" className="w-full h-44 object-contain" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090f1d]/70 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#08101c]/80 border border-[#38bdf8]/50 text-[#38bdf8] text-[11px] font-semibold tracking-wide">
            <span className="material-symbols-outlined text-[15px]">location_on</span>
            {sessions[0]?.venue || (lang === "en" ? "Event Location" : "Lokasi Acara")}
          </div>
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#0284c7]/30 border border-[#38bdf8]/40 text-[9px] font-bold text-[#38bdf8] uppercase tracking-wider">
            Skyline View
          </div>
      </div>

      {target && (
        <section className="p-3.5 rounded-2xl bg-[#0a1222]/90 border border-[#38bdf8]/30">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5" style={BODY}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              {t("secCountdown", lang)}
            </span>
            <span className="text-[10px] text-[#38bdf8] font-medium tracking-wide">{formatDotDate(profile.estimated_wedding_date || sessions[0]?.date)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: pad2(days), l: t("days", lang) },
              { v: pad2(hours), l: t("hours", lang) },
              { v: pad2(minutes), l: (lang === "en" ? "Mins" : "Menit") },
              { v: pad2(seconds), l: (lang === "en" ? "Secs" : "Detik") },
            ].map((c) => (
              <div key={c.l} className="py-2 px-1 rounded-xl bg-[#060c18] border border-[#38bdf8]/20">
                <span className="block text-xl font-extrabold text-[#38bdf8] leading-tight" style={BODY}>
                  {c.v}
                </span>
                <span className="text-[9px] tracking-widest text-slate-400 uppercase font-semibold">{c.l}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          {labelDate || (lang === "en" ? "Event details will be announced soon." : "Detail acara akan segera diumumkan.")}
        </p>
      )}

      {sessions.map((s, i) => (
        <SessionCard key={i} session={s} />
      ))}

      {calLink && (
        <a
          href={calLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-[#09152b] hover:bg-[#0c1c38] border border-[#38bdf8] text-[#38bdf8] hover:text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.97]"
          style={BODY}
        >
          <span className="material-symbols-outlined text-[18px]">event_available</span>
          {t("saveToCalendar", lang)}
        </a>
      )}
    </ModalShell>
  )
}