"use client"

import type { ReactNode } from "react"
import { normalizeLanguage, t } from "@/lib/i18n"

const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const
const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const

export function CloseButton({ onClick, className = "", language }: { onClick: () => void; className?: string; language?: string }) {
  const lang = normalizeLanguage(language)
  return (
    <button
      type="button"
      aria-label={t("close", lang)}
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-[#1a1f2e]/60 border border-[#38bdf8]/40 text-[#7bd0ff] hover:bg-[#38bdf8]/20 hover:text-[#dee2f6] active:scale-95 transition-all duration-200 flex items-center justify-center ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">close</span>
    </button>
  )
}

type ModalShellProps = {
  icon: string
  iconFill?: boolean
  eyebrow?: string
  sub?: string
  title: string
  serifTitle?: boolean
  onClose: () => void
  children: ReactNode
  maxH?: string
  language?: string
}

// Shared smoked-glass modal frame for the Skyline Penthouse room. Rendered
// absolute inside the phone column; backdrop click + close button dismiss it.
export default function ModalShell({
  icon,
  iconFill = false,
  eyebrow,
  sub,
  title,
  serifTitle = false,
  onClose,
  children,
  maxH = "max-h-[90%]",
  language,
}: ModalShellProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-md bg-[#0e1321]/95 backdrop-blur-2xl border border-[#38bdf8]/45 rounded-t-[28px] sm:rounded-[28px] shadow-[0_0_35px_rgba(56,189,248,0.18),0_20px_45px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col ${maxH}`}
        style={BODY}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-80 shrink-0" />
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0">
              <span
                className="material-symbols-outlined text-[20px]"
                style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
            </div>
            <div className="min-w-0">
              {eyebrow && (
                <span className="block text-[9px] text-[#8ed5ff] tracking-[0.22em] uppercase font-semibold" style={BODY}>
                  {eyebrow}
                </span>
              )}
              <h2
                className={`truncate tracking-wide ${serifTitle ? "text-[17px]" : "text-[15px] font-bold uppercase tracking-wider"} text-[#dee2f6]`}
                style={serifTitle ? DISPLAY : BODY}
              >
                {title}
              </h2>
              {sub && (
                <p className="text-[10px] text-[#bdc8d1] tracking-wide" style={BODY}>
                  {sub}
                </p>
              )}
            </div>
          </div>
          <CloseButton onClick={onClose} language={language} />
        </div>
        {/* Scrollable body */}
        <div className="custom-scrollbar overflow-y-auto px-5 py-4 space-y-4 flex-1">{children}</div>
      </div>
    </div>
  )
}
