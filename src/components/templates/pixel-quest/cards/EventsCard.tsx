"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { countdownTarget, formatDotDate, formatLongDate, gcalLink, type SessionData } from "../../shared/lib"
import { useCountdown } from "../../shared/useCountdown"
import CardShell from "./CardShell"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function EventsCard({ profile, content, onHide }: { profile: TemplateProps; content?: Record<string, string>; onHide: () => void }) {
  const lang = normalizeLanguage(profile.language)
  const tc = content || {}
  const sessions: SessionData[] = (Array.isArray(profile.sessions) ? profile.sessions : []).filter((s) => s && (s.date || s.venue))
  const target = countdownTarget(sessions, profile.estimated_wedding_date)
  const { days, hours, minutes, seconds } = useCountdown(target)
  const calLink = gcalLink(sessions[0], profile.groom_name, profile.bride_name)
  const pad2 = (n: number) => String(n).padStart(2, "0")
  return (
    <CardShell icon="calendar_month" iconClassName="bg-pink-500/20 border-pink-400/50 text-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)]" eyebrow={tc.save_date_label || "STOP 3: CEREMONY"} title={tc.events_title || t("secEvent", lang)} badge="MAP 03" onHide={onHide}>
      {sessions.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          {profile.estimated_wedding_date ? formatLongDate(profile.estimated_wedding_date) : "Detail acara akan segera diumumkan."}
        </p>
      )}
      {target && (
        <section className="p-3 rounded-2xl bg-[#081020]/95 border-2 border-[#38bdf8]/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5" style={{ ...FONT_PIXEL, textShadow: "0 0 10px rgba(56,189,248,0.7)" }}>
              <span className="inline-block w-2 h-2 rounded-sm bg-[#f472b6] animate-ping" />
              COUNTDOWN TIMER
            </span>
            <span className="text-[8px] text-[#f472b6] tracking-wider" style={FONT_PIXEL}>
              {formatDotDate(profile.estimated_wedding_date || sessions[0]?.date)}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { v: pad2(days), l: "DAYS", c: "text-[#38bdf8]" },
              { v: pad2(hours), l: "HRS", c: "text-[#38bdf8]" },
              { v: pad2(minutes), l: "MIN", c: "text-[#38bdf8]" },
              { v: pad2(seconds), l: "SEC", c: "text-[#f472b6]" },
            ].map((c) => (
              <div key={c.l} className="py-1.5 px-1 rounded-xl bg-[#050914] border border-[#38bdf8]/40 shadow-[inset_0_0_12px_rgba(56,189,248,0.2)]">
                <span className={`block text-base font-extrabold leading-tight ${c.c}`} style={FONT_PIXEL}>
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
      {sessions.map((s, i) => {
        const cyan = i % 2 === 0
        return (
          <div key={i} className={`rounded-xl bg-[#090e1c]/90 border ${cyan ? "border-cyan-400/50" : "border-pink-400/50"} p-2.5`}>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className={`text-[8px] ${cyan ? "text-cyan-300" : "text-pink-300"}`} style={FONT_PIXEL}>
                {((s.name || "").trim().toUpperCase() || "ACARA")}
              </span>
              {s.time && <span className="text-[8px] text-emerald-400">{s.time}</span>}
            </div>
            {s.date && <p className="text-xs font-bold text-white mt-1">{formatLongDate(s.date)}</p>}
            {[s.venue, s.address].filter(Boolean).length > 0 && (
              <p className="text-[10px] text-slate-300 mt-0.5">{[s.venue, s.address].filter(Boolean).join(" • ")}</p>
            )}
            {s.maps_url && (
              <a
                href={s.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-[8px] tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
                style={FONT_PIXEL}
              >
                <span className="material-symbols-outlined text-sm">near_me</span> BUKA GOOGLE MAPS
              </a>
            )}
          </div>
        )
      })}
      {(profile.dresscode_visible !== false && (tc.dresscode_title || profile.dresscode?.description)) && (
        <div className="rounded-xl bg-[#090e1c]/90 border border-cyan-400/40 p-2.5 text-center">
          <p className="text-[8px] tracking-widest uppercase text-cyan-300" style={FONT_PIXEL}>
            {tc.dresscode_title || "DRESS CODE"}
          </p>
          {profile.dresscode?.description && (
            <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{profile.dresscode.description}</p>
          )}
        </div>
      )}
      {calLink && (
        <a
          href={calLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#ec4899] hover:brightness-110 border-2 border-[#38bdf8] text-white text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 active:scale-[0.97]"
          style={FONT_PIXEL}
        >
          <span className="material-symbols-outlined text-[18px]">event_available</span>
          SAVE TO CALENDAR
        </a>
      )}
    </CardShell>
  )
}