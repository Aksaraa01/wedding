"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ASSETS } from "@/lib/assets"
import { frameStageFlorals, normalizeFrameSelection } from "@/lib/galeriFrames"
import { loadIdentity } from "@/lib/gallery-client"

type ResolveData = {
  status: "active" | "upcoming" | "ended" | "locked" | "not_configured" | "invalid" | "cleared"
  quota?: number
  used?: number
  remaining?: number
  event?: {
    couple_name: string
    photo_url: string
    frame?: string
    date_label: string
    start_label: string
    end_label: string
  }
}

const INVALID_COPY: Record<string, { title: string; body: string; icon: string }> = {
  upcoming: {
    title: "QR Belum Aktif",
    body: "QR galeri hanya aktif 1 jam sebelum acara dimulai. Sampai jumpa di hari bahagia!",
    icon: "schedule",
  },
  ended: {
    title: "QR Sudah Tidak Aktif",
    body: "Masa unggah foto telah berakhir. Terima kasih sudah hadir dan berbagi kebahagiaan!",
    icon: "check_circle",
  },
  locked: {
    title: "Galeri Belum Aktif",
    body: "Galeri kenangan ini belum diaktifkan oleh mempelai. Silakan coba lagi nanti.",
    icon: "lock",
  },
  not_configured: {
    title: "Galeri Belum Siap",
    body: "Detail acara belum dilengkapi oleh mempelai. Silakan coba lagi nanti.",
    icon: "edit_calendar",
  },
  invalid: {
    title: "QR Tidak Valid",
    body: "Tautan galeri ini tidak dikenal. Pastikan Anda memindai QR resmi dari mempelai.",
    icon: "qr_code_2",
  },
  cleared: {
    title: "Masa Aktif Berakhir",
    body: "Masa aktif galeri kenangan ini telah berakhir dan foto tamu telah dihapus. Terima kasih atas kebersamaan dan kenangan indahnya.",
    icon: "hourglass_disabled",
  },
}

type Particle = { left: number; top: number; size: number; color: string; delay: number }

const PARTICLE_COLORS = ["#ffdea4", "#d7e7ce", "#ffffff", "#eec067", "#fea3a2"]

function makeParticles(): Particle[] {
  return Array.from({ length: 16 }, () => ({
    left: 20 + Math.random() * 60,
    top: 35 + Math.random() * 25,
    size: Math.random() * 8 + 4,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    delay: Math.random() * 0.4,
  }))
}

function hashtagOf(couple: string): string {
  const pascal = couple
    .split("&")
    .map((s) => s.trim().replace(/[^A-Za-z]/g, ""))
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("")
  return pascal ? `#${pascal}Moment` : ""
}

function monogramOf(couple: string): string {
  const parts = couple.split("&").map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] || ""}&${parts[1][0] || ""}`
  const words = couple.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0][0]}&${words[words.length - 1][0]}`
  return (couple.trim()[0] || "A").toUpperCase()
}

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

export default function GalleryGatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [data, setData] = useState<ResolveData | null>(null)
  const [opened, setOpened] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    fetch(`/api/gallery/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: "invalid" }))
  }, [token])

  useEffect(() => {
    if (particles.length === 0) return
    const t = setTimeout(() => setParticles([]), 2600)
    return () => clearTimeout(t)
  }, [particles])

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (data.status !== "active") {
    const copy = INVALID_COPY[data.status] || INVALID_COPY.invalid
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 gap-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4f1519" }}>
          <span className="material-symbols-outlined text-4xl text-white">{copy.icon}</span>
        </div>
        <h1 className="text-[28px] leading-9 mt-2 font-medium" style={{ ...SERIF, color: "#4f1519" }}>
          {copy.title}
        </h1>
        {data.event && (data.event.couple_name || data.event.date_label) && (
          <div className="rounded-2xl border border-[#d9c1c0] bg-white px-6 py-4 shadow-sm">
            {data.event.couple_name && (
              <p className="text-lg font-semibold" style={{ ...SERIF, color: "#4f1519" }}>
                {data.event.couple_name}
              </p>
            )}
            {data.event.date_label && (
              <p className="text-sm text-[#444841] mt-1" style={SANS}>
                {data.event.date_label}
                {data.event.start_label ? ` • ${data.event.start_label}` : ""}
                {data.event.end_label ? `–${data.event.end_label} WIB` : ""}
              </p>
            )}
          </div>
        )}
        <p className="text-[15px] leading-relaxed text-[#444841] max-w-xs" style={SANS}>{copy.body}</p>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#867272] mt-4" style={SANS}>Aksaraa Wedding</p>
      </main>
    )
  }

  const couple = data.event?.couple_name || ""
  // Envelope chrome shows the active frame's art in its TL/BR slots
  // (frame-2 Sage = botanicalTopLeft + flowerBottomRight). Unframed
  // events keep the previous flowerTopLeft/flowerBottomRight look.
  const gateFlorals = frameStageFlorals(normalizeFrameSelection(data.event?.frame))
  const gateTL = gateFlorals.tl || gateFlorals.tr || ASSETS.galeriEnvelope.flowerTopLeft
  const gateBR = gateFlorals.br || gateFlorals.bl || ASSETS.galeriEnvelope.flowerBottomRight

  const openEnvelope = () => {
    if (opened) return
    setOpened(true)
    setParticles(makeParticles())
  }

  return (
    <main className="flex-1 flex flex-col relative w-full px-5 pt-4 pb-8" style={{ ...SANS, backgroundColor: "#fbf9f4" }}>
      <style>{`
        .gt-perspective { perspective: 1200px; }
        .gt-flap { transform-origin: top center; transition: transform 0.75s cubic-bezier(0.4,0,0.2,1), z-index 0.2s ease 0.3s; z-index: 25; }
        .gt-opened .gt-flap { transform: rotateX(180deg); z-index: 10; }
        .gt-seal { transition: transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease 0.1s; }
        .gt-opened .gt-seal { transform: translate(-50%,-120%) scale(1.15) rotate(-15deg); opacity: 0; pointer-events: none; }
        .gt-card { transition: transform 0.85s cubic-bezier(0.25,1,0.5,1) 0.4s, box-shadow 0.6s ease; transform: translateY(0); }
        .gt-opened .gt-card { transform: translateY(-165px); z-index: 30; }
        .gt-revealed { opacity: 0; transform: translateY(10px); transition: opacity 0.5s ease 0.9s, transform 0.5s ease 0.9s; }
        .gt-opened .gt-revealed { opacity: 1; transform: translateY(0); }
        @keyframes gt-float { 0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; } 40% { opacity: 0.9; } 100% { transform: translateY(-75px) scale(1) rotate(180deg); opacity: 0; } }
        .gt-particle { animation: gt-float 1.8s ease-out forwards; }
      `}</style>

      <div className="relative w-full overflow-hidden flex flex-col items-center min-h-[720px] p-6 transition-all duration-700 rounded-[2.5rem] shadow-2xl" style={{ backgroundColor: "#6b2b2d" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25 pointer-events-none" />
        <img src={gateTL} alt="" aria-hidden className="absolute -top-6 -left-6 w-40 h-40 object-contain pointer-events-none z-10 select-none" style={{ transform: "rotate(-12deg)", opacity: 0.95 }} />
        <img src={gateBR} alt="" aria-hidden className="absolute -bottom-6 -right-6 w-44 h-44 object-contain pointer-events-none z-10 select-none" style={{ transform: "rotate(6deg)", opacity: 0.95 }} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {particles.map((p, i) => (
            <div
              key={i}
              className="gt-particle absolute rounded-full"
              style={{ width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%`, backgroundColor: p.color, animationDelay: `${p.delay}s` }}
            />
          ))}
        </div>

        <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-40 rotate-90">
          <svg className="w-full h-full" fill="none" viewBox="0 0 160 160" stroke="#ffdad9" strokeWidth="1.25">
            <path d="M12 10C35 30 55 68 62 105M10 42C38 52 74 58 112 50M24 16C36 12 52 14 66 22C48 28 32 30 24 16ZM42 34C58 28 78 30 92 40C72 44 54 44 42 34ZM70 54C88 50 108 54 122 66C102 70 84 66 70 54Z" strokeLinecap="round" />
            <circle cx="28" cy="22" fill="#ffdad9" fillOpacity="0.3" r="3" />
            <circle cx="48" cy="40" fill="#ffdad9" fillOpacity="0.3" r="2.5" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none opacity-30 -rotate-45">
          <svg className="w-full h-full" fill="none" viewBox="0 0 160 160" stroke="#ffdad9" strokeWidth="1.25">
            <path d="M12 10C35 30 55 68 62 105M10 42C38 52 74 58 112 50M24 16C36 12 52 14 66 22C48 28 32 30 24 16ZM42 34C58 28 78 30 92 40C72 44 54 44 42 34ZM70 54C88 50 108 54 122 66C102 70 84 66 70 54Z" strokeLinecap="round" />
          </svg>
        </div>

        <header className="relative z-10 pt-6 text-center flex flex-col items-center">
          <div className="flex flex-col items-center justify-center">
            <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="h-16 w-16 rounded-full object-cover drop-shadow-md bg-white/10 p-1" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#ffdad9] mt-2 opacity-90">Aksaraa Wedding</span>
          </div>
          <div className="w-12 h-px mt-3 mx-auto" style={{ backgroundColor: "rgba(255,218,217,0.4)" }} />
        </header>

        <div className={`relative z-20 w-full max-w-[290px] my-auto pt-24 pb-4 flex flex-col items-center gt-perspective ${opened ? "gt-opened" : ""}`}>
          <div
            role="button"
            tabIndex={0}
            aria-label="Buka amplop undangan pernikahan"
            onClick={openEnvelope}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope() } }}
            className="relative w-full aspect-[4/2.75] rounded-2xl cursor-pointer select-none group outline-none"
          >
            <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/35 rounded-full blur-md -z-10 transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 rounded-2xl shadow-xl p-1.5 flex items-center justify-center" style={{ backgroundColor: "#f5f3ee" }}>
              <div className="relative w-full h-full rounded-xl overflow-visible" style={{ backgroundColor: "#e8e4dc" }}>
                <div className="absolute inset-0 rounded-xl opacity-80 overflow-hidden" style={{ backgroundColor: "#e3ded4" }}>
                  <div className="w-full h-full border border-dashed rounded-xl m-1" style={{ borderColor: "rgba(79,21,25,0.2)" }} />
                </div>

                <div className="gt-card absolute left-3 right-3 bottom-2 h-[240px] rounded-xl shadow-lg border border-[#e8e3d8] p-4 flex flex-col items-center justify-between z-[15] overflow-hidden" style={{ backgroundColor: "#fdfbf7" }}>
                  <div className="w-full flex items-center justify-between border-b border-[#e4e2dd] pb-2" style={{ color: "#6b2b2d" }}>
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="" aria-hidden className="h-5 w-5 object-cover rounded-full opacity-80" />
                    <span className="text-[10px] tracking-[0.2em] uppercase font-bold">Galeri Tamu</span>
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="" aria-hidden className="h-5 w-5 object-cover rounded-full opacity-80" />
                  </div>
                  <div className="gt-revealed text-center my-auto flex flex-col items-center">
                    <p className="italic text-[18px] leading-tight mb-1 font-semibold" style={{ ...SERIF, color: "#4f1519" }}>
                      {couple}
                    </p>
                    <p className="text-[12px] text-[#444841] tracking-wide px-2 leading-relaxed mb-3">
                      <span className="italic" style={{ ...SERIF, color: "#91494a" }}>Ambil &amp; bagikan memori kebahagiaan kita!</span>
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Identified devices skip reinput and land straight
                        // on home; new guests (or name-switchers) go through
                        // identitas. device_id stays stable either way.
                        const idn = loadIdentity(token)
                        router.push(`/g/${encodeURIComponent(token)}/${idn ? "home" : "identitas"}`)
                      }}
                      className="py-2 px-5 rounded-full text-white text-[11px] tracking-wider uppercase font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      style={{ backgroundColor: "#4f1519" }}
                    >
                      Lanjut Tambah Moment
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    </button>
                  </div>
                  <div className="w-full flex justify-between items-center pt-1.5 border-t border-[#e4e2dd] text-[10px] tracking-widest uppercase text-[#867272]">
                    <span>{data.event?.date_label || ""}</span>
                    {hashtagOf(couple) && <span className="font-semibold" style={{ color: "#91494a" }}>{hashtagOf(couple)}</span>}
                  </div>
                </div>

                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 280 196">
                    <polygon fill="#f5f3ee" opacity="0.97" points="0,0 0,196 140,105" />
                    <polygon fill="#f0eee9" opacity="0.97" points="280,0 280,196 140,105" />
                    <polygon fill="#fbf9f5" points="0,196 280,196 140,96" stroke="#e0ded8" strokeWidth="0.75" />
                    <line opacity="0.6" stroke="#d5d0c7" strokeWidth="1" x1="0" x2="140" y1="196" y2="96" />
                    <line opacity="0.6" stroke="#d5d0c7" strokeWidth="1" x1="280" x2="140" y1="196" y2="96" />
                  </svg>
                </div>

                <div className="gt-flap absolute top-0 left-0 right-0 h-1/2 rounded-t-xl overflow-visible pointer-events-none origin-top">
                  <svg className="w-full h-full drop-shadow-sm" preserveAspectRatio="none" viewBox="0 0 280 98">
                    <polygon fill="#fcfbf8" points="0,0 280,0 140,98" stroke="#e3dfd7" strokeWidth="1" />
                    <polygon fill="#faf8f4" opacity="0.4" points="10,0 270,0 140,90" />
                  </svg>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Buka segel"
                  onClick={(e) => { e.stopPropagation(); openEnvelope() }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openEnvelope() } }}
                  className="gt-seal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 outline-none"
                >
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl border-2 cursor-pointer active:scale-90 hover:scale-105 transition-transform duration-200" style={{ backgroundColor: "#4f1519", borderColor: "#ffb3b2" }}>
                    <div className="absolute rounded-full border opacity-80 pointer-events-none" style={{ inset: -3, borderColor: "rgba(255,218,217,0.3)" }} />
                    <span className="italic text-[18px] select-none drop-shadow-sm" style={{ ...SERIF, color: "#ffdad9" }}>
                      {monogramOf(couple)}
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!opened ? (
          <button onClick={openEnvelope} className="mt-5 flex flex-col items-center gap-2 transition-opacity duration-300 select-none z-20 cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#ffdad9]/20 backdrop-blur-sm shadow-sm">
              <span className="material-symbols-outlined text-[15px] animate-bounce" style={{ color: "#ffdad9" }}>touch_app</span>
              <span className="text-[11px] tracking-[0.25em] uppercase font-semibold text-white/90">Ketuk amplop untuk membuka</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 opacity-60 animate-pulse mt-0.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "#ffdad9" }} />
              <span className="w-1 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,218,217,0.7)" }} />
              <span className="w-1 h-2 rounded-full" style={{ backgroundColor: "rgba(255,218,217,0.4)" }} />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setOpened(false)}
            className="mt-4 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] tracking-widest uppercase transition-all duration-300 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">replay</span>
            Lipat Amplop
          </button>
        )}

      </div>
    </main>
  )
}
