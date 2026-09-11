"use client"

import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import { formatLongDate, type SessionData } from "../../shared/lib"

// Single event card on the white brush backdrop (used for Akad and Resepsi).
export default function EventPage({ session }: { session: SessionData }) {
  const location = [session.venue, session.address].filter(Boolean).join(" • ")
  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none opacity-95">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSETS.impastoMosque.brush} alt="" className="w-full h-full object-fill scale-110 opacity-95" loading="lazy" />
      </div>
      <div className="relative z-10 flex flex-col items-center w-full px-4 py-2">
        <h1 className="italic text-[38px] leading-tight mb-2 drop-shadow-sm" style={{ ...FONT_DISPLAY, color: "#221a14" }}>
          {session.name || "Acara"}
        </h1>
        {session.date && (
          <div className="flex flex-col items-center mb-3">
            <span className="text-[18px] font-bold tracking-wide" style={{ ...FONT_DISPLAY, color: "#2c221a" }}>
              {formatLongDate(session.date)}
            </span>
          </div>
        )}
        {session.time && (
          <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#2A1F18] border border-[#8E6B3D]/40 shadow-sm mb-4">
            <span className="text-[11px] font-semibold tracking-wider text-[#f5ecd8]" style={FONT_BODY}>
              {session.time}
            </span>
          </div>
        )}
        {location && (
          <div className="flex flex-col items-center mb-5">
            {session.venue && (
              <h2 className="text-[19px] font-bold tracking-wide mb-1" style={{ ...FONT_DISPLAY, color: "#221a14" }}>
                {session.venue}
              </h2>
            )}
            {session.address && (
              <p className="text-[12px] leading-[18px] font-medium max-w-[240px]" style={{ ...FONT_BODY, color: "#554638" }}>
                {session.address}
              </p>
            )}
          </div>
        )}
        {session.maps_url && (
          <a
            href={session.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[#fffdfa] font-semibold text-[12px] tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{ ...FONT_BODY, background: "linear-gradient(135deg, #8E6B3D 0%, #b38f53 100%)" }}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Buka Google Maps</span>
          </a>
        )}
      </div>
    </div>
  )
}
