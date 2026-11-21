"use client"

import { normalizeLanguage } from "@/lib/i18n"
import { FONT_BODY, FONT_BTN, FONT_DISPLAY } from "../fonts"
import Section from "../Section"
import Slideshow from "../Slideshow"

type Props = {
  id: "groom" | "bride"
  heading?: string
  shortName?: string
  fullName?: string
  parents?: string
  instagram?: string
  photos: string[]
  language?: string
}

function igHref(v?: string): string {
  const t = (v || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return t
  return `https://instagram.com/${t.replace(/^@/, "")}`
}

export default function Person({ id, heading, shortName, fullName, parents, instagram, photos, language = "id" }: Props) {
  const lang = normalizeLanguage(language)
  const href = igHref(instagram)
  return (
    <Section id={id} className="bg-black/[0.06]" reveal={false}>
      <div className="text-center text-white">
        {heading && (
          <p className="text-[15px] uppercase" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
            {heading}
          </p>
        )}

        <Slideshow
          images={photos}
          alt={shortName || ""}
          className="mt-6 h-[52vh] w-full"
          overlayClassName="bg-gradient-to-t from-black/70 via-black/10 to-transparent"
        >
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span
              className="text-[22px] text-white"
              style={{ ...FONT_DISPLAY, letterSpacing: "2px", textShadow: "0 0 10px #000" }}
            >
              {shortName}
            </span>
          </div>
        </Slideshow>

        {fullName && (
          <h3 className="mt-6 text-[20px]" style={{ ...FONT_DISPLAY, letterSpacing: "1px" }}>
            {fullName}
          </h3>
        )}
        <p className="mt-2 text-[14px]" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.8)" }}>
          {parents}
        </p>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] uppercase transition-transform duration-300 hover:scale-105 active:scale-95"
            style={{ ...FONT_BTN, letterSpacing: "1px", backgroundColor: "#1B1B18", color: "#F2F1EE" }}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            Instagram
          </a>
        )}
      </div>
    </Section>
  )
}
