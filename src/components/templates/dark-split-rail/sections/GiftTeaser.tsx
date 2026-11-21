"use client"

import { FONT_BODY, FONT_BTN } from "../fonts"
import Section, { SectionHeading } from "../Section"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function GiftTeaser({ onOpen, language = "id" }: { onOpen: () => void; language?: string }) {
  const lang = normalizeLanguage(language)
  return (
    <Section id="gift" className="bg-black/[0.06]">
      <div className="text-center text-white">
        <SectionHeading>{t("secGift", lang)}</SectionHeading>
        <p className="mx-auto mt-5 max-w-[340px] text-[14px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
          {lang === "en" ? "Your blessing is a precious gift to us. If you wish to send a cashless gift, we have provided the details for you." : "Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika Anda ingin memberi kado secara cashless, kami menyediakannya untuk Anda."}
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] uppercase transition-transform duration-300 hover:scale-105 active:scale-95"
          style={{ ...FONT_BTN, letterSpacing: "1px", backgroundColor: "#1B1B18", color: "#F2F1EE" }}
        >
          <span>{lang === "en" ? "Click Here" : "Klik Disini"}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
        </button>
      </div>
    </Section>
  )
}
