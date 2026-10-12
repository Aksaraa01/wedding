"use client"

import { ASSETS } from "@/lib/assets"

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" }
const BODY: React.CSSProperties = { fontFamily: "'EB Garamond', Georgia, serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

export type StandeeData = {
  couple: string
  dateLine: string
  qrPng: string
  qrUrl: string
  hashtag: string
  sigDate: string
}

function Corner({ className }: { className: string }) {
  return (
    <div className={`absolute pointer-events-none text-[#C49A6C] ${className}`}>
      <svg className="w-full h-full stroke-current" fill="none" viewBox="0 0 28 28">
        <path d="M1 27V6C1 3.23858 3.23858 1 6 1H27" strokeWidth="1.2" />
        <path d="M5 23V8C5 6.34315 6.34315 5 8 5H23" strokeDasharray="1 1" strokeWidth="0.75" />
        <circle cx="9" cy="9" fill="currentColor" r="1.5" stroke="none" />
      </svg>
    </div>
  )
}

function GoldFrame() {
  // One continuous double border tracing the card's rounded contour, with
  // flourishes straddling the border at each corner. Shared by screen,
  // print, and raster download so all three match exactly.
  return (
    <>
      <div className="absolute inset-2 rounded-[14px] pointer-events-none ring-1 ring-[#C49A6C]/40" />
      <div className="absolute inset-[13px] rounded-[10px] pointer-events-none ring-[0.5px] ring-[#C49A6C]/25" />
      <Corner className="top-1 left-1 w-9 h-9" />
      <Corner className="top-1 right-1 w-9 h-9 rotate-90" />
      <Corner className="bottom-1 left-1 w-9 h-9 -rotate-90" />
      <Corner className="bottom-1 right-1 w-9 h-9 rotate-180" />
    </>
  )
}

function namesOf(couple: string): [string, string] {
  const [a, b] = String(couple || "").split("&").map((s) => s.trim())
  return [a || "", b || ""]
}

export function hashtagOf(couple: string): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z]/g, "")
  const [a, b] = namesOf(couple)
  const tag = `${clean(a)}${clean(b)}`
  return tag ? `#${tag}` : "#GaleriKenangan"
}

function CardShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="print-sheet relative w-full bg-[#FAF7F2] rounded-2xl shadow-[0_16px_48px_-12px_rgba(107,43,45,0.18)] p-8 sm:p-10 overflow-hidden text-center"
      style={{ breakInside: "avoid", ...style }}
    >
      <GoldFrame />
      {children}
    </div>
  )
}

export function StandeeFront({ data, style }: { data: StandeeData; style?: React.CSSProperties }) {
  const [n1, n2] = namesOf(data.couple)
  return (
    <CardShell style={style}>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 mb-2 rounded-full bg-white flex items-center justify-center shadow-sm p-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Aksaraa Wedding Monogram" className="w-full h-full object-cover rounded-full" src={ASSETS.galeriEnvelope.aksaraaMonogram} />
        </div>
        <span className="text-[11px] tracking-[0.25em] uppercase text-[#743234]/80 font-medium" style={SANS}>Galeri Tamu</span>
      </div>
      <div className="relative z-10 mt-3 mb-1">
        <h1 className="text-[36px] leading-[44px] tracking-[-0.01em] text-[#4f1519] my-1" style={SERIF}>
          {n1 || data.couple}
          {n1 && n2 && (
            <>
              {" "}<span className="italic font-normal text-[#cea374]" style={BODY}>&amp;</span>{" "}{n2}
            </>
          )}
        </h1>
        {data.dateLine && (
          <div className="flex items-center justify-center gap-2 text-[#534342]/80">
            <span className="h-[0.5px] w-6 bg-[#C49A6C]" />
            <p className="text-[11px] uppercase tracking-widest text-[#573914] font-medium" style={SANS}>{data.dateLine}</p>
            <span className="h-[0.5px] w-6 bg-[#C49A6C]" />
          </div>
        )}
      </div>
      <div className="relative z-10 my-5 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white shadow-sm mb-3" style={{ backgroundColor: "#6b2b2d", ...SANS }}>
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
          <span className="text-[11px] uppercase tracking-widest font-medium">Scan Untuk Abadikan Momen</span>
        </div>
        <div className="relative p-3.5 bg-white rounded-2xl shadow-[0_8px_24px_-4px_rgba(107,43,45,0.12)]">
          <div className="w-44 h-44 sm:w-48 sm:h-48 bg-white p-2 rounded-xl flex items-center justify-center relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrPng} alt="QR Galeri Tamu" className="w-full h-full object-contain" />
            <span className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#C49A6C] rounded-tl-md pointer-events-none" />
            <span className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#C49A6C] rounded-tr-md pointer-events-none" />
            <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#C49A6C] rounded-bl-md pointer-events-none" />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#C49A6C] rounded-br-md pointer-events-none" />
          </div>
        </div>
        <p className="text-[15px] leading-[22px] text-[#534342]/90 mt-2" style={BODY}>atau langsung akses:</p>
        <a href={data.qrUrl} className="text-[12px] font-semibold text-[#4f1519] tracking-wide underline underline-offset-4 decoration-[#C49A6C] break-all" style={SANS}>
          <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "11px", fontWeight: 400 }}>{data.qrUrl}</span>
        </a>
      </div>
      <div className="relative z-10 mt-4 pt-3 bg-white/60 rounded-xl p-3" style={SANS}>
        <p className="text-[11px] uppercase tracking-widest text-[#4f1519] font-semibold mb-3">
          Panduan Mengabadikan Momen
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { bg: "bg-[#d4e4ce]", fg: "text-[#3c4b3a]", icon: "qr_code_scanner", t: "1. Buka Kamera", d: "Arahkan lensa tanpa aplikasi" },
            { bg: "bg-[#ffdad9]", fg: "text-[#4f1519]", icon: "photo_library", t: "2. Ambil Foto", d: "Selfie atau bersama kawan" },
            { bg: "bg-[#ffddba]", fg: "text-[#5f401a]", icon: "favorite", t: "3. Tambah Caption", d: "Masuk ke live photowall" },
          ].map((s) => (
            <div key={s.t} className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full ${s.bg} ${s.fg} flex items-center justify-center mb-1`}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#1b1c19]">{s.t}</span>
              <p className="text-[12px] leading-tight text-[#534342] mt-0.5" style={BODY}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-center justify-between text-[#534342]/70 text-[11px]" style={SANS}>
        <span className="italic text-[15px]" style={BODY}>Terima kasih atas kehadiran &amp; doa restu Anda</span>
        <span className="font-semibold">wedding.aksaraa</span>
      </div>
    </CardShell>
  )
}

export function StandeeBack({ data, style }: { data: StandeeData; style?: React.CSSProperties }) {
  return (
    <CardShell style={style}>
      <div className="absolute -top-14 -left-14 w-40 h-40 pointer-events-none opacity-70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="w-full h-full object-contain" alt="Botanical heirloom" src={ASSETS.galeriEnvelope.flowerTopLeft} />
      </div>
      <div className="relative z-10 flex flex-col items-center mt-2">
        <span className="material-symbols-outlined text-3xl text-[#4f1519] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <span className="text-[11px] tracking-[0.25em] uppercase text-[#743234]/80 font-medium" style={SANS}>Sekapur Sirih</span>
        <h2 className="text-[26px] leading-[34px] font-medium text-[#4f1519] mt-2" style={SERIF}>Kepada Tamu yang Berbahagia</h2>
        <div className="w-12 h-[1px] bg-[#C49A6C] my-3" />
        <p className="text-[17px] leading-[26px] text-[#534342] max-w-sm mx-auto italic" style={BODY}>
          &ldquo;Kehadiran Anda adalah sepenggal doa dan berkah terindah bagi kami yang mengawali langkah baru ini. Mari abadikan senyum hangat malam ini dalam galeri kenangan bersama.&rdquo;
        </p>
        <div className="my-6 p-4 rounded-xl bg-white/80 max-w-sm mx-auto w-full">
          <h3 className="text-[12px] uppercase tracking-wider text-[#4f1519] mb-2 font-semibold" style={SANS}>Live Photo Wall &amp; Instagram</h3>
          <p className="text-[15px] text-[#1b1c19]" style={BODY}>
            Gunakan tanda pagar resmi pernikahan:
          </p>
          <div className="mt-2 inline-block px-4 py-1.5 rounded-full text-white text-[20px] leading-[28px] font-semibold tracking-wide" style={{ backgroundColor: "#4f1519", ...SERIF }}>
            {data.hashtag}
          </div>
          <p className="text-[13px] text-[#534342] mt-2" style={BODY}>
            Foto yang Anda unggah melalui QR di seberang akan langsung tayang pada layar utama pelaminan.
          </p>
        </div>
        <div className="flex flex-col items-center pt-2">
          <p className="text-[36px] leading-[44px] tracking-[-0.01em] text-[#4f1519]" style={SERIF}>{data.couple || "Mempelai"}</p>
          {data.sigDate && (
            <span className="text-[11px] uppercase tracking-widest text-[#536251] mt-1 font-medium" style={SANS}>{data.sigDate}</span>
          )}
        </div>
      </div>
    </CardShell>
  )
}
