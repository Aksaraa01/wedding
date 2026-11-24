"use client"

import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_BODY, FONT_DISPLAY } from "../fonts"
import Section, { SectionHeading } from "../Section"
import type { StoryData } from "../../shared/lib"

type Props = {
  stories: StoryData[]
  coupleLabel: string
  language?: string
  title?: string
}

export default function Story({ stories, coupleLabel, language, title }: Props) {
  const lang = normalizeLanguage(language)
  const list = stories.filter((s) => s && (s.title || s.description || s.image_url))
  if (list.length === 0) return null
  const resolvedTitle = (title || "").trim() || t("secStory", lang)

  return (
    <Section id="story" className="bg-black/[0.06]">
      <div className="text-center text-white">
        <SectionHeading>{resolvedTitle}</SectionHeading>
        <p className="mt-2 text-[15px]" style={{ ...FONT_DISPLAY, letterSpacing: "1.5px" }}>
          {coupleLabel}
        </p>

        <div className="mt-8 space-y-10">
          {list.map((s, i) => (
            <div key={i}>
              {s.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.image_url}
                  alt={s.title || ""}
                  draggable={false}
                  className="mx-auto w-full rounded-sm object-cover"
                />
              )}
              {s.title && (
                <h3 className="mt-5 text-[17px]" style={{ ...FONT_DISPLAY, letterSpacing: "1px" }}>
                  {s.title}
                </h3>
              )}
              {s.description && (
                <p className="mt-3 text-[14px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
                  {s.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
