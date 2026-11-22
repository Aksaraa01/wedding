"use client"

import { FONT_BODY, FONT_BTN, FONT_DISPLAY } from "./fonts"

type Props = {
  coverUrl: string
  coupleLabel: string
  guestName?: string
  dateShort?: string
  objectPosition?: string
  onOpen: () => void
}

export default function Cover({ coverUrl, coupleLabel, guestName, dateShort, objectPosition = "50% 50%", onOpen }: Props) {
  return (
    <div className="fixed inset-0 z-[900] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition, animation: "dsrKen 18s ease-out forwards" }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative flex h-full flex-col items-center justify-center px-8 text-center text-white">
        <p className="text-[13px] uppercase" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
          The Wedding Of
        </p>
        <h1 className="mt-4 text-[34px] leading-tight" style={{ ...FONT_DISPLAY, letterSpacing: "1.5px" }}>
          {coupleLabel}
        </h1>
        {dateShort && (
          <p className="mt-3 text-[15px]" style={{ ...FONT_DISPLAY, letterSpacing: "3px" }}>
            {dateShort}
          </p>
        )}

        <div className="mt-10">
          <p className="text-[13px] text-white/80" style={{ ...FONT_BODY, letterSpacing: "1.5px" }}>
            Kepada Yth.
          </p>
          <p className="mt-1 text-[17px]" style={{ ...FONT_DISPLAY, letterSpacing: "1.5px" }}>
            {guestName || "Tamu Undangan"}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3 text-[12px] uppercase transition-transform duration-300 hover:scale-105 active:scale-95"
          style={{ ...FONT_BTN, letterSpacing: "1.5px", backgroundColor: "#1B1B18", color: "#F2F1EE" }}
        >
          <span>Buka Undangan</span>
          <span className="material-symbols-outlined text-[18px]">arrow_circle_right</span>
        </button>
      </div>
    </div>
  )
}
