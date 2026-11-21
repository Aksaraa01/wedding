"use client"

import { normalizeLanguage, t } from "@/lib/i18n"
import { useCountdown } from "../../shared/useCountdown"
import { FONT_BODY, FONT_BTN, FONT_DISPLAY } from "../fonts"
import Section from "../Section"
import Slideshow from "../Slideshow"

type Props = {
  photos: string[]
  target: Date | null
  gcal?: string
  coupleLabel: string
  language?: string
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[25px] font-semibold text-white" style={FONT_BODY}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[13px] text-white/80" style={FONT_BODY}>
        {label}
      </span>
    </div>
  )
}

export default function SaveTheDate({ photos, target, gcal, coupleLabel, language }: Props) {
  const lang = normalizeLanguage(language)
  const { days, hours, minutes, seconds } = useCountdown(target)

  return (
    <Section id="std" className="bg-black/[0.06]" reveal={false}>
      {photos.length > 0 && (
        <Slideshow images={photos} className="h-[46vh] w-full" overlayClassName="bg-black/40">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[20px] uppercase text-white" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
              {t("saveTheDate", lang)}
            </span>
          </div>
        </Slideshow>
      )}

      <div className="pt-10 text-center text-white">
        {target && (
          <div className="mx-auto grid w-[285px] grid-cols-4 gap-5">
            <Cell value={days} label={t("days", lang)} />
            <Cell value={hours} label={t("hours", lang)} />
            <Cell value={minutes} label={t("minutes", lang)} />
            <Cell value={seconds} label={t("seconds", lang)} />
          </div>
        )}

        {gcal && (
          <a
            href={gcal}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] uppercase transition-transform duration-300 hover:scale-105 active:scale-95"
            style={{ ...FONT_BTN, letterSpacing: "1px", backgroundColor: "#1B1B18", color: "#F2F1EE" }}
          >
            <span className="material-symbols-outlined text-[16px]">event</span>
            {t("saveToCalendar", lang)}
          </a>
        )}

        <p className="mt-6 text-[13px] text-white/70" style={FONT_BODY}>
          {coupleLabel}
        </p>
      </div>
    </Section>
  )
}
