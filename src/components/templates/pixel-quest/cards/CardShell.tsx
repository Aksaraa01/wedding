"use client"

import type { ReactNode } from "react"
import { FONT_PIXEL } from "../../shared/Skin"

type Props = {
  icon: string
  iconClassName?: string
  eyebrow: string
  title: string
  badge?: string
  badgeClassName?: string
  onHide: () => void
  children: ReactNode
}

// Compact quest card: capped at half the device screen (.pq-card), body scrolls.
export default function CardShell({
  icon,
  iconClassName = "bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]",
  eyebrow,
  title,
  badge,
  badgeClassName = "bg-cyan-950/80 border-cyan-500/40 text-cyan-400",
  onHide,
  children,
}: Props) {
  return (
    <div className="pq-card w-full rounded-3xl p-4 bg-[#0e1321]/90 backdrop-blur-xl border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(56,189,248,0.25)] flex flex-col gap-2.5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-cyan-500/25 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${iconClassName}`}>
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-[8px] tracking-widest uppercase text-cyan-300 font-bold truncate" style={FONT_PIXEL}>
                {eyebrow}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide truncate">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className={`px-2 py-0.5 rounded-full border text-[8px] ${badgeClassName}`} style={FONT_PIXEL}>
              {badge}
            </span>
          )}
          <button
            type="button"
            onClick={onHide}
            aria-label="Sembunyikan"
            className="w-6 h-6 rounded-full bg-slate-800/80 hover:bg-rose-500/30 border border-slate-600/70 hover:border-rose-400 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        </div>
      </div>
      <div className="overflow-y-auto custom-scrollbar pr-1 space-y-2.5 flex-1 min-h-0">{children}</div>
    </div>
  )
}