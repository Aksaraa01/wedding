"use client"

import { useEffect, useRef, useState } from "react"
import { ASSETS } from "@/lib/assets"
import type { TemplateProps } from "@/types/template"

const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const
const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const

function CoverSeal({ initials }: { initials: string }) {
  return (
    <div className="relative mb-6 sm:mb-8 group">
      <div className="absolute inset-0 -m-3 rounded-full bg-[#ffc640]/20 blur-xl opacity-60" />
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#303444]/90 to-[#090e1c]/90 border border-[#3e484f]/50 backdrop-blur-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.8)]">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#ffc640]/30 flex items-center justify-center">
          <span
            className="text-2xl sm:text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-[#dee2f6] via-[#c4e7ff] to-[#ffc640] drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]"
            style={DISPLAY}
          >
            {initials || "FS"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SkylineCover({
  groom_name,
  bride_name,
  guest_name,
  couple_initials,
  onOpen,
}: {
  groom_name?: string
  bride_name?: string
  guest_name?: string
  couple_initials?: string
  onOpen: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Fit the cover to ANY container height (real device, editor iframe/preview,
  // demo) so the "Buka Undangan" button is always visible without scrolling.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = el.clientHeight
      setScale(Math.min(1, Math.max(0.55, h / 820)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#070b16] text-[#dee2f6] select-none">
      {/* Ambient backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b16] via-[#0d1424] to-[#0a0e1c]" />
        <div
          className="absolute inset-0 opacity-45 mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: `url(${ASSETS.skylinePenthouse.coverBg})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(226,232,240,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,232,240,0.02)_1px,transparent_1px)] [background-size:14vw_100vh]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#38bdf8]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-[#ffc640]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1321] via-transparent to-[#0e1321]/70" />
      </div>

      {/* Center content */}
      <div className="relative z-10 h-full flex flex-col items-center text-center px-5">
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-center py-4 gap-1 will-change-transform"
          style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
        >
          <CoverSeal initials={couple_initials || ""} />
          <p
            className="text-[11px] sm:text-[13px] uppercase tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-[#bdc8d1] via-[#dee2f6] to-[#bdc8d1] mb-4"
            style={BODY}
          >
            The Wedding Of
          </p>
          <h1 className="text-4xl md:text-5xl leading-tight tracking-tight" style={DISPLAY}>
            <span className="block">{groom_name || "Mempelai Pria"}</span>
            <span className="block my-1 font-normal italic text-[#ffc640] text-transparent bg-clip-text bg-gradient-to-r from-[#ffdf9f] via-[#ffc640] to-[#e3aa00]" style={DISPLAY}>
              &amp;
            </span>
            <span className="block">{bride_name || "Mempelai Wanita"}</span>
          </h1>
        </div>

        {/* Action dock */}
        <div className="w-full max-w-md flex flex-col items-center gap-3 z-20 pb-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#bdc8d1]/80 mb-1" style={BODY}>
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="text-base text-[#dee2f6] font-semibold tracking-wide" style={DISPLAY}>
              {guest_name || "Tamu Undangan"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="group relative w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#303444]/90 via-[#1a1f2e]/90 to-[#303444]/90 border border-[#38bdf8]/60 backdrop-blur-2xl text-[#dee2f6] shadow-[0_0_30px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:shadow-[0_0_45px_rgba(56,189,248,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:border-[#8ed5ff] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5"
            style={BODY}
          >
            <span className="w-7 h-7 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#8ed5ff] group-hover:bg-[#38bdf8] group-hover:text-[#090e1c] transition-all duration-300">
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </span>
            <span className="text-sm font-semibold tracking-wide text-[#dee2f6] group-hover:text-[#c4e7ff] transition-colors">
              Buka Undangan
            </span>
            <span className="material-symbols-outlined text-[#8ed5ff] text-[18px] group-hover:translate-x-1 transition-transform duration-300">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
