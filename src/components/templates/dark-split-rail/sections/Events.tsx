"use client"

import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_BODY, FONT_BTN, FONT_DISPLAY } from "../fonts"
import Section from "../Section"
import { formatLongDate, type SessionData } from "../../shared/lib"

export default function Events({ sessions, language, title }: { sessions: SessionData[]; language?: string; title?: string }) {
  const lang = normalizeLanguage(language)
  const list = sessions.filter((s) => s && (s.name || s.date || s.venue))
  if (list.length === 0) return null
  const resolvedTitle = (title || "").trim()

  return (
    <Section id="events" className="bg-black/[0.06]">
      <div className="space-y-12 text-center text-white">
        {resolvedTitle && (
          <h2 className="text-[20px] uppercase text-white/95 whitespace-pre-line" style={{ ...FONT_DISPLAY, letterSpacing: "2px" }}>
            {resolvedTitle}
          </h2>
        )}
        {list.map((s, i) => (
          <div key={i}>
            <h3 className="text-[19px] uppercase" style={{ ...FONT_DISPLAY, letterSpacing: "2.5px" }}>
              {s.name || t("secEvent", lang)}
            </h3>
            {s.date && (
              <p className="mt-3 text-[14px] uppercase" style={{ ...FONT_BODY, letterSpacing: "1.5px" }}>
                {formatLongDate(s.date)}
              </p>
            )}
            {s.time && (
              <p className="mt-1 text-[14px]" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.9)" }}>
                {s.time}
              </p>
            )}
            {s.venue && (
              <p className="mt-4 text-[16px]" style={{ ...FONT_DISPLAY, letterSpacing: "0.5px" }}>
                {s.venue}
              </p>
            )}
            {s.address && (
              <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.8)" }}>
                {s.address}
              </p>
            )}
            {s.maps_url && (
              <a
                href={s.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[12px] uppercase transition-colors duration-300 hover:bg-white/10"
                style={{ ...FONT_BTN, letterSpacing: "1px", borderColor: "rgba(255,255,255,0.5)", color: "#F2F1EE" }}
              >
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {t("viewLocation", lang)}
              </a>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}
