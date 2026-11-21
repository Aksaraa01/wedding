"use client"

import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import { countdownTarget, formatLongDate, gcalLink, type SessionData } from "../../shared/lib"
import { useCountdown } from "../../shared/useCountdown"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function CountdownPage({ profile, sessions }: { profile: TemplateProps; sessions: SessionData[] }) {
  const lang = normalizeLanguage(profile.language)
  const target = countdownTarget(sessions, profile.estimated_wedding_date)
  const { days, hours, minutes, seconds } = useCountdown(target)
  const calLink = gcalLink(sessions[0], profile.groom_name, profile.bride_name)
  const pad2 = (n: number) => String(n).padStart(2, "0")
  const cells = [
    { v: String(days), l: "Hari" },
    { v: pad2(hours), l: "Jam" },
    { v: pad2(minutes), l: "Menit" },
    { v: pad2(seconds), l: "Detik" },
  ]
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto flex flex-col items-center justify-start text-center px-6 pt-12 pb-8">
      <div className="relative w-full max-w-[360px] flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-visible">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.pastelDreamCathedral.brush} alt="" className="w-[115%] h-[115%] max-w-none object-cover mix-blend-screen opacity-50 drop-shadow-md" loading="lazy" style={{ maskImage: "radial-gradient(90% 80%, black 65%, transparent 100%)" }} />
        </div>
      <div className="relative z-10 flex flex-col items-center w-full px-4 py-2">
        <h1 className="italic text-[28px] leading-tight mb-2 drop-shadow-sm" style={{ ...FONT_DISPLAY, color: "#221a14" }}>
          Save The Date
        </h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="h-px w-6 bg-[#8E6B3D]/40" />
          <span className="text-[15px] font-bold tracking-wider" style={{ ...FONT_DISPLAY, color: "#2c221a" }}>
            {formatLongDate(profile.estimated_wedding_date || sessions[0]?.date) || "Segera Hadir"}
          </span>
          <span className="h-px w-6 bg-[#8E6B3D]/40" />
        </div>
        {target && (
          <div className="grid grid-cols-4 gap-2 w-full max-w-[280px] mb-5">
            {cells.map((c) => (
              <div key={c.l} className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-[#2A1F18]/90 border border-[#8E6B3D]/40 shadow-sm">
                <span className="text-[20px] font-bold text-[#f5ecd8] leading-none mb-0.5" style={FONT_DISPLAY}>
                  {c.v}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#b38f53] font-medium" style={FONT_BODY}>
                  {c.l}
                </span>
              </div>
            ))}
          </div>
        )}
        {calLink && (
          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[#fffdfa] font-semibold text-[12px] tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ ...FONT_BODY, background: "linear-gradient(135deg, #8E6B3D 0%, #b38f53 100%)" }}
          >
            <span className="material-symbols-outlined text-[16px]">event_available</span>
            <span>{t("saveToCalendar", lang)}</span>
          </a>
        )}
        </div>
      </div>
    </div>
  )
}
