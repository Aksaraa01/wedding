"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { formatLongDate, type SessionData } from "../../shared/lib"
import CardShell from "./CardShell"

export default function EventsCard({ profile, onHide }: { profile: TemplateProps; onHide: () => void }) {
  const sessions: SessionData[] = (Array.isArray(profile.sessions) ? profile.sessions : []).filter((s) => s && (s.date || s.venue))
  return (
    <CardShell icon="calendar_month" iconClassName="bg-pink-500/20 border-pink-400/50 text-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)]" eyebrow="STOP 3: CEREMONY" title="Waktu & Lokasi Acara" badge="MAP 03" onHide={onHide}>
      {sessions.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          {profile.estimated_wedding_date ? formatLongDate(profile.estimated_wedding_date) : "Detail acara akan segera diumumkan."}
        </p>
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
    </CardShell>
  )
}