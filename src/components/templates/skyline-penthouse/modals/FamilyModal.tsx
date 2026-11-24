"use client"

import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import { normalizeLanguage, t } from "@/lib/i18n"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const
const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const

export default function FamilyModal({
  families,
  templateContent,
  language,
  onClose,
}: {
  families: string[]
  templateContent?: Record<string, string>
  language?: string
  onClose: () => void
}) {
  if (!families || families.length === 0) return null
  const lang = normalizeLanguage(language)
  const tc = templateContent || {}
  return (
    <ModalShell icon="diversity_3" iconFill eyebrow="FAMILY HONORS" title={tc.inviting_title || t("secInviting", lang).toUpperCase()} onClose={onClose}>
      <div className="text-center px-2 space-y-1.5">
        <p className="text-[13px] text-[#8ed5ff] font-medium tracking-wide" style={BODY}>
          Keluarga Besar Yang Turut Mengundang:
        </p>
      </div>
      <div className="bg-[#161b2a]/90 rounded-2xl p-5 border-l-4 border-l-[#38bdf8] border border-[#3e484f]/40 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#8ed5ff]/10 rounded-full blur-xl pointer-events-none" />
        <div className="divide-y divide-[#3e484f]/20 flex flex-col">
          {families.map((f, i) => (
            <div key={i} className={i === 0 ? "pb-3 text-center sm:text-left" : "py-3 text-center sm:text-left"}>
              <p className="text-[13px] text-[#dee2f6] font-medium leading-relaxed tracking-wide" style={BODY}>
                {f}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 bg-[#1a1f2e]/60 border border-[#3e484f]/30 relative text-center">
        <span className="material-symbols-outlined text-[16px] text-[#ffc640] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
          favorite
        </span>
        <p className="text-[13px] text-[#bdc8d1] italic leading-relaxed" style={DISPLAY}>
          &ldquo;{tc.closing_message || (lang === "en"
            ? "A heartfelt thank you from the families of both the bride and groom for your prayers, attention, and presence."
            : "Ungkapan terima kasih yang tulus dari segenap keluarga besar kedua mempelai atas doa, perhatian, dan kehadiran Anda.")}&rdquo;
        </p>
      </div>
    </ModalShell>
  )
}