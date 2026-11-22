"use client"

import { FONT_BODY, FONT_SCRIPT } from "../../shared/Skin"
import { formatLongDate, type SessionData } from "../../shared/lib"

function EventBlock({ session, align }: { session: SessionData; align: "left" | "right" }) {
  const right = align === "right"
  return (
    <section className={`flex flex-col max-w-[310px] drop-shadow-sm ${right ? "items-end text-right self-end mt-4" : "items-start text-left"}`}>
      <h1 className="text-[46px] leading-[1.1] font-normal mb-3 tracking-normal" style={{ ...FONT_SCRIPT, color: "#332a24", textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}>
        {session.name || "Acara"}
      </h1>
      {session.date && (
        <p className="text-[18px] font-semibold tracking-wide mb-1" style={{ ...FONT_BODY, color: "#2c221a" }}>
          {formatLongDate(session.date)}
        </p>
      )}
      {session.time && (
        <p className="italic text-[14.5px] font-medium tracking-wide mb-3" style={{ ...FONT_BODY, color: "#423328" }}>
          {session.time}
        </p>
      )}
      {session.venue && (
        <h2 className="text-[14px] font-bold uppercase mb-1.5" style={{ ...FONT_BODY, color: "#2a2019", letterSpacing: "0.16em" }}>
          {session.venue}
        </h2>
      )}
      {session.address && (
        <p className="text-[13px] leading-[1.35] font-normal mb-4 max-w-[250px]" style={{ ...FONT_BODY, color: "#3d3027" }}>
          {session.address}
        </p>
      )}
      {session.maps_url && (
        <a
          href={session.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#cb948c]/75 hover:bg-[#c38a82]/85 backdrop-blur-md text-[#2e231d] text-[11.5px] font-bold tracking-[0.15em] uppercase border border-white/40 shadow-[0_4px_16px_rgba(140,80,70,0.15)] transition-transform active:scale-95"
          style={FONT_BODY}
        >
          <span className="material-symbols-outlined text-[16px] text-[#3d2b24]">
            location_on
          </span>
          <span>LIHAT LOKASI</span>
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
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/15" />
      <div className="relative flex-1 w-full h-full flex flex-col justify-between px-3 pt-6 pb-2 gap-4">
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
