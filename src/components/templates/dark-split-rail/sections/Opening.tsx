"use client"

import { FONT_BODY, FONT_DISPLAY, FONT_VERSE } from "../fonts"
import Section from "../Section"
import { normalizeLanguage, t } from "@/lib/i18n"

type Props = {
  eyebrow?: string
  coupleLabel: string
  hashtag?: string
  dateShort?: string
  description?: string
  quoteText?: string
  quoteSource?: string
  language?: "id" | "en"
}

export default function Opening({ eyebrow, coupleLabel, hashtag, dateShort, description, quoteText, quoteSource, language = "id" }: Props) {
  const lang = normalizeLanguage(language)
  return (
    <Section id="opening" className="bg-black/[0.06]">
      <div className="text-center text-white">
        <p className="text-[13px] uppercase" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
          {eyebrow || t("theWeddingOf", lang)}
        </p>
        <h1 className="mt-4 text-[30px] leading-tight" style={{ ...FONT_DISPLAY, letterSpacing: "1.5px" }}>
          {coupleLabel}
        </h1>
        {hashtag && (
          <p className="mt-2 text-[14px]" style={{ ...FONT_BODY, letterSpacing: "1px", color: "rgba(255,255,255,0.75)" }}>
            {hashtag}
          </p>
        )}
        {dateShort && (
          <p className="mt-4 text-[16px]" style={{ ...FONT_DISPLAY, letterSpacing: "4px" }}>
            {dateShort}
          </p>
        )}

        {description && (
          <p className="mx-auto mt-6 max-w-[340px] text-[14px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
            {description}
          </p>
        )}

        {quoteText && (
          <div className="mt-10">
            {quoteSource && (
              <p className="text-[17px]" style={{ ...FONT_VERSE }}>
                {quoteSource}
              </p>
            )}
            <p className="mt-3 text-[14px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
              {quoteText}
            </p>
          </div>
        )}
      </div>
    </Section>
  )
}
