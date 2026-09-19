"use client"

import { useEffect, useRef, useState } from "react"
import { ASSETS } from "@/lib/assets"
import { toTransformedUrl } from "@/lib/storageUrl"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../shared/Skin"
import { formatLongDate } from "../shared/lib"
import PastelAtmosphere, { PC_ATMOSPHERE_CSS } from "./Atmosphere"

function CoastalGrass() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <div className="pc-shell-sway absolute -bottom-2 -left-3 w-36 h-36 opacity-80" style={{ transformOrigin: "bottom left" }}>
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" fill="none" viewBox="0 0 120 120">
          <path d="M10 120 Q30 70 65 50" stroke="#5b7a6e" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M65 50 C70 45, 80 48, 78 58 C72 65, 60 62, 65 50 Z" fill="#e9b8a4" />
          <circle cx="68" cy="54" fill="#f8d778" r="3.5" />
          <path d="M20 120 Q40 85 85 75" stroke="#47655c" strokeLinecap="round" strokeWidth="3" />
          <path d="M85 75 C92 70, 100 76, 96 84 C90 90, 80 84, 85 75 Z" fill="#fdf6ec" />
          <circle cx="89" cy="78" fill="#e8ba4c" r="3" />
          <path d="M14 120 Q28 95 52 88 C48 96, 30 104, 18 118 Z" fill="#4a6a5f" opacity="0.85" />
        </svg>
      </div>
      <div className="pc-shell-sway absolute -bottom-2 -right-4 w-40 h-40 opacity-80" style={{ transformOrigin: "bottom right", animationDelay: "1.4s" }}>
        <svg className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" fill="none" viewBox="0 0 120 120">
          <path d="M110 120 Q85 65 45 45" stroke="#527066" strokeLinecap="round" strokeWidth="3.5" />
          <path d="M45 45 C38 38, 28 44, 32 54 C38 62, 50 56, 45 45 Z" fill="#df9a82" />
          <circle cx="39" cy="48" fill="#f3ce69" r="3.5" />
          <path d="M100 120 Q75 80 35 78" stroke="#3e5a50" strokeLinecap="round" strokeWidth="3" />
          <path d="M35 78 C28 72, 20 80, 24 88 C32 94, 40 87, 35 78 Z" fill="#fcf9f2" />
          <circle cx="30" cy="82" fill="#dfad38" r="3" />
          <path d="M106 120 Q92 95 68 88 C72 96, 90 104, 102 118 Z" fill="#47655c" opacity="0.85" />
        </svg>
      </div>
    </div>
  )
}

export default function PastelCover({
  groom_name,
  bride_name,
  guest_name,
  estimated_wedding_date,
  onOpen,
}: {
  groom_name?: string
  bride_name?: string
  guest_name?: string
  estimated_wedding_date?: string | null
  onOpen: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, Math.max(0.55, el.clientHeight / 820)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#e8d9bd] select-none">
      <style>{PC_ATMOSPHERE_CSS}</style>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={toTransformedUrl(ASSETS.pastelCoastal.bg, { width: 800 })} alt="" draggable={false} className="w-full h-full object-cover object-center pointer-events-none" />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/20 via-transparent to-amber-900/10" />
      <PastelAtmosphere doves={0} mainBirds petals8 motes />
      <CoastalGrass />

      <div className="relative z-10 h-full flex flex-col items-center text-center px-4">
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-start pt-10 will-change-transform"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          <div className="relative flex flex-col items-center">
            <h2 className="relative text-[13px] tracking-[0.28em] uppercase font-semibold mb-1" style={{ ...FONT_BODY, color: "#4A3B32", textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>
              THE WEDDING OF
            </h2>
            <h1 className="relative text-[3.8rem] leading-[1.08] py-0.5 px-2 font-normal" style={{ ...FONT_SCRIPT, color: "#FFFFFF", textShadow: "0 2px 6px rgba(74,52,39,0.45), 0 1px 2px rgba(74,52,39,0.35)" }}>
              <span className="block">{groom_name || "Mempelai"} &amp;</span>
              <span className="block">{bride_name || "Mempelai"}</span>
            </h1>
          </div>
          <p className="text-[0.82rem] tracking-[0.26em] font-semibold uppercase mt-1.5" style={{ ...FONT_BODY, color: "#5D4A3E", textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}>
            {formatLongDate(estimated_wedding_date) || "Segera Hadir"}
          </p>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-3 z-20 pb-9 shrink-0">
          <div className="text-center">
            <p className="italic text-[#8B6343] text-[0.95rem] tracking-[0.04em] mb-1 font-medium" style={{ ...FONT_DISPLAY, textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}>
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <h3 className="font-semibold text-[#3B2C22] text-[1.3rem] tracking-[0.16em] uppercase" style={{ ...FONT_DISPLAY, textShadow: "0 1px 3px rgba(255,255,255,0.95)" }}>
              {guest_name || "Tamu Undangan"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="py-2.5 px-8 rounded-full flex items-center justify-center gap-3 text-[#3B2C22] text-[0.82rem] font-semibold uppercase transition-all duration-300 active:scale-95 cursor-pointer bg-white/60 hover:bg-white/75 border border-white/80 shadow-[0_4px_20px_rgba(142,107,61,0.2)]"
            style={{ ...FONT_BODY, letterSpacing: "0.18em", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          >
            <span className="material-symbols-outlined text-[18px] text-[#8B6343]">mail</span>
            <span className="pt-0.5">BUKA UNDANGAN</span>
          </button>
        </div>
      </div>
    </div>
  )
}
