"use client"

import { useEffect, useRef, useState } from "react"
import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY, FONT_SCRIPT } from "../shared/Skin"
import { formatLongDate } from "../shared/lib"
import ImpastoAtmosphere, { IM_ATMOSPHERE_CSS } from "./Atmosphere"

export default function ImpastoCover({
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
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#2A1F18] select-none">
      <style>{IM_ATMOSPHERE_CSS}</style>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSETS.impastoMosque.coverBg} alt="" draggable={false} className="w-full h-full object-cover object-center pointer-events-none" />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-900/10 via-transparent to-black/50" />
      <ImpastoAtmosphere />

      <div className="relative z-10 h-full flex flex-col items-center text-center px-4">
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-center py-4 will-change-transform"
          style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
        >
          <h2 className="text-[13px] tracking-[0.28em] uppercase font-semibold mb-1" style={{ ...FONT_BODY, color: "#4A3427", textShadow: "0 1px 3px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)" }}>
            THE WEDDING OF
          </h2>
          <h1 className="text-[3.4rem] leading-[1.08] py-1 px-2" style={{ ...FONT_SCRIPT, color: "#3B281C", textShadow: "0 1px 2px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.25)" }}>
            {groom_name || "Mempelai"} &amp; {bride_name || "Mempelai"}
          </h1>
          <p className="text-[0.88rem] tracking-[0.26em] font-semibold uppercase mt-1.5 text-[#F8F5EE]" style={{ ...FONT_DISPLAY, textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 12px rgba(242,202,80,0.35)" }}>
            {formatLongDate(estimated_wedding_date) || "Segera Hadir"}
          </p>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-3 z-20 pb-6 shrink-0">
          <div className="text-center">
            <p className="italic text-[#f2ca50] text-[1.05rem] tracking-[0.06em] mb-1" style={{ ...FONT_DISPLAY, textShadow: "0 1px 2px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.7)" }}>
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <h3 className="font-semibold text-[#FFFDF8] text-[1.4rem] tracking-[0.14em] uppercase" style={{ ...FONT_DISPLAY, textShadow: "0 2px 4px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.8)" }}>
              {guest_name || "Tamu Undangan"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="py-2.5 px-7 rounded-full flex items-center justify-center gap-3 text-white text-[0.82rem] font-medium uppercase transition-all duration-300 active:scale-95 cursor-pointer"
            style={{
              ...FONT_BODY,
              letterSpacing: "0.18em",
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1.5px solid rgba(255,255,255,0.55)",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.35), inset 0 1px 2px 0 rgba(255,255,255,0.45)",
            }}
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span className="pt-0.5 font-semibold">BUKA UNDANGAN</span>
          </button>
        </div>
      </div>
    </div>
  )
}