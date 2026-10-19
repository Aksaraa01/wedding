"use client"

import { FONT_BODY, FONT_DISPLAY } from "./fonts"

type Props = {
  progress: number
  leaving: boolean
  initials: string
  coupleLabel: string
}

// Intro preloader from the reference: full-screen black, monogram, a 0–100%
// counter, then a fade-out before the cover appears.
export default function Splash({ progress, leaving, initials, coupleLabel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-8 text-center transition-opacity duration-1000"
      style={{ opacity: leaving ? 0 : 1, visibility: leaving ? "hidden" : "visible" }}
    >
      <span className="text-[54px] leading-none text-white" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
        {initials}
      </span>
      <span className="mt-4 text-[12px] uppercase text-white/80" style={{ ...FONT_BODY, letterSpacing: "4px" }}>
        Wedding Invitation
      </span>
      <span className="mt-1 text-[15px] text-white" style={{ ...FONT_DISPLAY, letterSpacing: "2px" }}>
        {coupleLabel}
      </span>
      <span className="mt-6 text-[16px] text-white/90" style={{ ...FONT_BODY, letterSpacing: "2px", animation: "dsrPulse 1.6s ease-in-out infinite" }}>
        {Math.min(Math.floor(progress), 100)}%
      </span>
    </div>
  )
}
