"use client"

import type { ReactNode } from "react"
import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_BODY, FONT_DISPLAY, FONT_PIXEL } from "../../shared/Skin"

export function CloseButton({ onClick, className = "", language }: { onClick: () => void; className?: string; language?: string }) {
  const lang = normalizeLanguage(language)
  return (
    <button
      type="button"
      aria-label={t("close", lang)}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg bg-[#161b2a] border-2 border-[#38bdf8]/60 text-[#7bd0ff] hover:text-white hover:border-[#f472b6] hover:shadow-[0_0_12px_rgba(244,114,182,0.5)] active:scale-95 transition-all duration-200 flex items-center justify-center ${className}`}
    >
      <span className="text-sm" style={FONT_PIXEL}>✕</span>
    </button>
  )
}

type ModalShellProps = {
  icon: string
  iconColor?: "cyan" | "pink"
  eyebrow?: string
  eyebrowColor?: "cyan" | "pink"
  title: string
  onClose: () => void
  children: ReactNode
  maxH?: string
  language?: string
}

// Shared retro-arcade modal frame for Pixel Paradise: 2px neon border, cyan→pink
// top gradient line, pixel header + scrollable body.
export default function ModalShell({
  icon,
  iconColor = "cyan",
  eyebrow,
  eyebrowColor = "cyan",
  title,
  onClose,
  children,
  maxH = "max-h-[90%]",
  language,
}: ModalShellProps) {
  const accent = (color: "cyan" | "pink") => (color === "pink" ? pink : cyan)
  const cyan = {
    text: "text-[#38bdf8]",
    border: "border-[#38bdf8]/50",
    bg: "bg-[#38bdf8]/15",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.4)]",
  }
  const pink = {
    text: "text-[#f472b6]",
    border: "border-[#f472b6]/50",
    bg: "bg-[#f472b6]/15",
    glow: "shadow-[0_0_12px_rgba(244,114,182,0.4)]",
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-md bg-[#0e1321]/95 backdrop-blur-2xl border-2 border-[#38bdf8]/70 rounded-2xl rounded-b-none sm:rounded-2xl flex flex-col overflow-hidden ${maxH}`}
        style={{
          boxShadow: "0 0 30px rgba(56,189,248,0.35), 0 0 45px rgba(244,114,182,0.2), inset 0 0 15px rgba(56,189,248,0.1)",
        }}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[#38bdf8] via-[#f472b6] to-[#38bdf8] opacity-90 shrink-0 shadow-[0_0_8px_#f472b6]" />
        {/* Header */}
        <div className="px-5 pt-4 pb-3.5 shrink-0 border-b border-[#38bdf8]/20 flex items-center justify-between bg-[#161b2a]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg ${accent(iconColor).bg} border ${accent(iconColor).border} flex items-center justify-center ${accent(iconColor).text} ${accent(iconColor).glow} shrink-0`}>
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
            <div className="min-w-0">
              {eyebrow && (
                <span className={`block text-[8px] tracking-[0.2em] uppercase font-bold ${accent(eyebrowColor).text}`} style={FONT_PIXEL}>
                  {eyebrow}
                </span>
              )}
              <h2 className="text-[15px] tracking-wide text-white truncate" style={FONT_DISPLAY}>
                {title}
              </h2>
            </div>
          </div>
          <CloseButton onClick={onClose} language={language} />
        </div>
        {/* Scrollable body */}
        <div className="custom-scrollbar overflow-y-auto px-4 py-4 space-y-4 flex-1" style={FONT_BODY}>
          {children}
        </div>
      </div>
    </div>
  )
}