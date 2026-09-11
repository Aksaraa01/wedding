"use client"

import { ASSETS } from "@/lib/assets"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import { formatLongDate, type SessionData } from "../../shared/lib"

// Single event card on the white brush backdrop (used for Akad and Resepsi).
export default function EventPage({ session, caravan }: { session: SessionData; caravan?: boolean }) {
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
      {caravan && (
        <div className="pointer-events-none select-none mt-2 flex items-end justify-center gap-4 opacity-80" aria-hidden="true">
          <svg className="w-14 h-14 text-[#2A1F18]/90 fill-current" viewBox="0 0 100 100">
            <path d="M12 70 C12 65 14 62 17 60 C17 56 18 52 20 48 C22 44 26 42 30 43 C33 44 35 48 37 49 C39 46 42 42 48 42 C54 42 58 46 61 50 C63 47 66 43 72 43 C77 43 81 47 83 51 C87 49 90 42 91 35 C91 28 89 22 87 18 C86 16 88 14 91 14 C94 14 97 16 97 19 C97 22 95 24 94 26 C95 28 97 30 96 34 C95 38 92 43 89 47 C89 54 87 62 84 66 C84 72 85 78 86 85 C86 87 84 88 82 88 C80 88 79 86 79 84 C79 78 78 72 78 68 C76 68 73 68 71 68 C70 73 69 79 69 85 C69 87 67 88 65 88 C63 88 62 86 62 83 C63 76 64 70 65 67 C58 68 45 68 38 67 C37 72 36 78 35 84 C35 87 33 88 31 88 C29 88 28 86 28 83 C29 77 30 71 31 67 C28 67 26 67 24 67 C23 72 21 78 20 84 C20 86 18 87 16 87 C14 87 13 85 13 83 C14 78 16 73 17 67 C14 68 12 69 12 70 Z" />
          </svg>
          <svg className="w-11 h-11 text-[#2A1F18]/75 fill-current -ml-2" viewBox="0 0 100 100">
            <path d="M12 70 C12 65 14 62 17 60 C17 56 18 52 20 48 C22 44 26 42 30 43 C33 44 35 48 37 49 C39 46 42 42 48 42 C54 42 58 46 61 50 C63 47 66 43 72 43 C77 43 81 47 83 51 C87 49 90 42 91 35 C91 28 89 22 87 18 C86 16 88 14 91 14 C94 14 97 16 97 19 C97 22 95 24 94 26 C95 28 97 30 96 34 C95 38 92 43 89 47 C89 54 87 62 84 66 C84 72 85 78 86 85 C86 87 84 88 82 88 C80 88 79 86 79 84 C79 78 78 72 78 68 C76 68 73 68 71 68 C70 73 69 79 69 85 C69 87 67 88 65 88 C63 88 62 86 62 83 C63 76 64 70 65 67 C58 68 45 68 38 67 C37 72 36 78 35 84 C35 87 33 88 31 88 C29 88 28 86 28 83 C29 77 30 71 31 67 C28 67 26 67 24 67 C23 72 21 78 20 84 C20 86 18 87 16 87 C14 87 13 85 13 83 C14 78 16 73 17 67 C14 68 12 69 12 70 Z" />
          </svg>
        </div>
      )}
    </div>
  )
}
