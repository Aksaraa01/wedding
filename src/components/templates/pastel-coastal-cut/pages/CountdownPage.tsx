"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../../shared/Skin"
import { countdownTarget, formatLongDate, gcalLink, type SessionData } from "../../shared/lib"
import { useCountdown } from "../../shared/useCountdown"
import { PastelCloud } from "../Atmosphere"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function CountdownPage({ profile, sessions }: { profile: TemplateProps; sessions: SessionData[] }) {
  const lang = normalizeLanguage(profile.language)
  const tc = profile.template_content ?? {}
  const saveDateLabel = (tc.save_date_label || "").trim() || t("saveTheDate", lang)
  const target = countdownTarget(sessions, profile.estimated_wedding_date)
  const { days, hours, minutes, seconds } = useCountdown(target)
  const calLink = gcalLink(sessions[0], profile.groom_name, profile.bride_name)
  const pad2 = (n: number) => String(n).padStart(2, "0")
  const cells = [
    { v: String(days), l: t("days", lang) },
    { v: pad2(hours), l: t("hours", lang) },
    { v: pad2(minutes), l: t("minutes", lang) },
    { v: pad2(seconds), l: t("seconds", lang) },
  ]
  const names = [(profile.groom_name || "").trim(), (profile.bride_name || "").trim()].filter(Boolean).join(" & ")
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto flex flex-col items-center justify-center text-center px-4 pt-2 pb-12">
      <div className="pc-cloud-stage relative w-full max-w-[440px] flex flex-col items-center justify-center px-2 py-0 select-none">
        <div className="relative w-full flex flex-col items-center justify-center overflow-visible min-h-[460px]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-125 drop-shadow-[0_16px_28px_rgba(42,29,23,0.3)]">
            <PastelCloud className="pc-cloud-wing-l absolute inset-0 w-full h-full object-contain max-h-[520px] scale-y-110 filter contrast-[1.03]" />
            <PastelCloud flip className="pc-cloud-wing-r absolute inset-0 w-full h-full object-contain max-h-[520px] scale-y-110 filter contrast-[1.03]" />
          </div>
          <div className="pc-content-in relative z-10 flex flex-col items-center w-full px-5 pt-3 pb-6 -translate-y-2">
            {names && (
              <div className="mb-1.5 px-4 py-0.5 rounded-full bg-[#df8268]/95 text-[#fffdfa] text-[10px] uppercase font-bold tracking-[0.2em] shadow-md border border-white/60" style={FONT_BODY}>
                {names}
              </div>
            )}
            <h1 className="text-[44px] leading-[1.02] font-normal mb-0.5 tracking-normal whitespace-pre-line" style={{ ...FONT_SCRIPT, color: "#2c221a", textShadow: "0 1px 2px rgba(255,255,255,0.7)" }}>
              {saveDateLabel}
            </h1>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-px w-6 bg-[#8E6B3D]/50" />
              <span className="text-[14.5px] font-bold tracking-wider" style={{ ...FONT_DISPLAY, color: "#2c221a" }}>
                {formatLongDate(profile.estimated_wedding_date || sessions[0]?.date) || (lang === "en" ? "Coming Soon" : "Segera Hadir")}
              </span>
              <span className="h-px w-6 bg-[#8E6B3D]/50" />
            </div>
            {target && (
              <div className="grid grid-cols-4 gap-2 w-full max-w-[280px] mb-3.5">
                {cells.map((c) => (
                  <div key={c.l} className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-white/85 border border-[#df8268]/30 shadow-sm backdrop-blur-sm">
                    <span className="text-[20px] font-bold leading-none mb-0.5" style={{ ...FONT_DISPLAY, color: "#2c221a" }}>
                      {c.v}
                    </span>
                    <span className="text-[8.5px] uppercase tracking-[0.15em] font-bold" style={{ ...FONT_BODY, color: "#8E6B3D" }}>
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
                style={{ ...FONT_BODY, background: "linear-gradient(135deg, #b37a56 0%, #df8268 100%)" }}
              >
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                <span>{t("saveToCalendar", lang)}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
