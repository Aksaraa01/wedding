"use client"

import { useEffect, useRef, useState } from "react"
import { ASSETS } from "@/lib/assets"
import { FONT_PIXEL } from "../shared/Skin"

const PIXEL = FONT_PIXEL

function CoinSeal({ initials }: { initials: string }) {
  return (
    <div className="relative mb-5 sm:mb-6 group">
      <div className="absolute inset-0 -m-3 rounded-2xl bg-[#38bdf8]/40 blur-xl opacity-75 transition-opacity duration-500" />
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#090e1c]/90 border-2 border-[#38bdf8] backdrop-blur-md flex flex-col items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.5),inset_0_0_15px_rgba(56,189,248,0.3)] hover:rotate-3 transition-transform duration-300">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-[#ffc640]/60 flex items-center justify-center bg-[#161b2a]/80 shadow-[inset_0_0_8px_rgba(255,198,64,0.4)]">
          <span
            className="text-[18px] sm:text-[22px] tracking-wider text-[#ffc640]"
            style={{ ...PIXEL, textShadow: "0 0 10px rgba(255,198,64,0.9)" }}
          >
            {initials || "FS"}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PixelCover({
  groom_name,
  bride_name,
  guest_name,
  couple_initials,
  onOpen,
  backgroundUrl,
}: {
  groom_name?: string
  bride_name?: string
  guest_name?: string
  couple_initials?: string
  onOpen: () => void
  backgroundUrl?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Fit the cover to ANY container height so "Buka Undangan" is always visible
  // without scrolling (real device, editor iframe, demo).
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
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#05070c] text-[#dee2f6] select-none">
      {/* Ambient pixel backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b16] via-[#0d1424] to-[#0a0e1c]" />
        <div
          className="absolute inset-0 opacity-50 mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl || ASSETS.pixelParadise.coverBg})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.05)_1px,transparent_1px)] [background-size:18px_18px] opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[420px] bg-[#38bdf8]/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-[380px] h-[380px] bg-[#f472b6]/10 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c]/80" />
      </div>

      {/* Center content */}
      <div className="relative z-10 h-full flex flex-col items-center text-center px-5">
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-center py-4 will-change-transform"
          style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
        >
          <CoinSeal initials={couple_initials || ""} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#38bdf8]/40 bg-[#38bdf8]/10 backdrop-blur-md mb-5 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#8ed5ff]" style={{ ...PIXEL, textShadow: "0 0 8px rgba(56,189,248,0.8)" }}>
              ✦ THE WEDDING OF ✦
            </span>
          </div>
          <h1 className="flex flex-col items-center gap-1 leading-tight">
            <span
              className="text-[24px] sm:text-[34px] md:text-[40px] font-bold text-white uppercase"
              style={{ ...PIXEL, textShadow: "0 0 12px #38bdf8, 0 0 24px #00668a" }}
            >
              {groom_name || "Mempelai Pria"}
            </span>
            <div className="my-1 flex items-center gap-3">
              <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-[#ffc640] to-transparent" />
              <span className="text-[14px] sm:text-[18px] text-[#ffc640]" style={{ ...PIXEL, textShadow: "0 0 12px rgba(255,198,64,0.95)" }}>
                &amp;
              </span>
              <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-[#ffc640] to-transparent" />
            </div>
            <span
              className="text-[24px] sm:text-[34px] md:text-[40px] font-bold text-white uppercase"
              style={{ ...PIXEL, textShadow: "0 0 12px #f472b6, 0 0 24px #db2777" }}
            >
              {bride_name || "Mempelai Wanita"}
            </span>
          </h1>
        </div>

        {/* Action dock */}
        <div className="w-full max-w-md flex flex-col items-center gap-3 z-20 pb-4">
          <div className="w-full text-center mb-1 px-5 py-3 rounded-xl bg-[#090e1c]/80 border border-[#38bdf8]/40 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#8ed5ff]/80 mb-1.5" style={PIXEL}>
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="text-[14px] font-semibold tracking-wide text-white" style={{ ...PIXEL, textShadow: "0 0 8px rgba(56,189,248,0.6)" }}>
              {guest_name || "Tamu Undangan"}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="group relative w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#303444]/90 via-[#161b2a]/90 to-[#303444]/90 border-2 border-[#38bdf8]/70 backdrop-blur-2xl text-[#dee2f6] shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_45px_rgba(56,189,248,0.7)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
          >
            <span className="w-7 h-7 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-[#8ed5ff] shadow-[0_0_10px_rgba(56,189,248,0.6)]">
              <span className="material-symbols-outlined text-[16px]">mail</span>
            </span>
            <span className="text-[11px] tracking-wider text-[#dee2f6] group-hover:text-[#c4e7ff] transition-colors font-semibold" style={PIXEL}>
              Buka Undangan
            </span>
            <span className="material-symbols-outlined text-[#8ed5ff] text-[18px] group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}