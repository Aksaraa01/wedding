"use client"

import { FONT_BODY, FONT_SCRIPT } from "../../shared/Skin"
import { formatLongDate, type SessionData } from "../../shared/lib"

function EventBlock({ session, align }: { session: SessionData; align: "left" | "right" }) {
  const right = align === "right"
  return (
    <section className={`flex flex-col max-w-[290px] drop-shadow-sm ${right ? "items-end text-right self-end mt-4" : "items-start text-left"}`}>
      <h1 className="text-[38px] leading-tight font-normal mb-2" style={{ ...FONT_SCRIPT, color: "#1c1815" }}>
        {session.name || "Acara"}
      </h1>
      {session.date && (
        <p className="text-[13px] font-medium tracking-wide mb-1" style={{ ...FONT_BODY, color: "#2d241e" }}>
          {formatLongDate(session.date)}
        </p>
      )}
      {session.time && (
        <p className="text-[12.5px] font-normal tracking-wide mb-2" style={{ ...FONT_BODY, color: "#3c3028" }}>
          {session.time}
        </p>
      )}
      {session.venue && (
        <h2 className="text-[12.5px] font-bold uppercase mb-1.5" style={{ ...FONT_BODY, color: "#231b15", letterSpacing: "0.14em" }}>
          {session.venue}
        </h2>
      )}
      {session.address && (
        <p className="text-[11px] leading-[1.35] font-normal mb-3.5 max-w-[230px]" style={{ ...FONT_BODY, color: "#3f3227" }}>
          {session.address}
        </p>
      )}
      {session.maps_url && (
        <a
          href={session.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10.5px] font-semibold uppercase border border-white/60 shadow-sm backdrop-blur-md transition-transform active:scale-95"
          style={{ ...FONT_BODY, letterSpacing: "0.14em", background: "rgba(244,237,227,0.7)", color: "#292019" }}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ color: "#3b2a1e" }}>
            location_on
          </span>
          <span>Lihat Lokasi</span>
        </a>
      )}
    </section>
  )
}

// Renders all invited sessions on one page. With two sessions, keeps the
// top-left / bottom-right composition; with one or more, alternates sides.
export default function EventPage({ sessions }: { sessions: SessionData[] }) {
  const list = (sessions || []).filter((s) => s && (s.date || s.venue || s.time || s.name || s.address))
  return (
    <div className="flex-1 w-full max-w-[430px] mx-auto flex flex-col px-6 pt-10 pb-16 pointer-events-auto select-none">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/15 via-transparent to-transparent" />
      <div className="relative flex-1 w-full h-full flex flex-col justify-between px-5 pt-14 pb-4 gap-4">
        {list.length > 0 ? (
          list.map((session, i) => (
            <EventBlock key={i} session={session} align={i % 2 === 0 ? "left" : "right"} />
          ))
        ) : (
          <span />
        )}
        <footer className="w-full flex items-center justify-center relative pt-2">
          <span className="text-[11px] font-semibold uppercase" style={{ ...FONT_BODY, letterSpacing: "0.2em", color: "rgba(61,48,37,0.9)" }}>
            Geser ke atas
          </span>
        </footer>
      </div>
    </div>
  )
}
