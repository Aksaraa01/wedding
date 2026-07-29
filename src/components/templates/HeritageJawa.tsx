"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { TemplateTheme, TemplateConfig } from "@/types/template"
import ThemeInjector from "./shared/ThemeInjector"
import MotionSection from "./shared/MotionSection"

interface Props {
  bride_name: string
  groom_name: string
  estimated_wedding_date: string
  slug: string
  guest_name: string
  theme?: TemplateTheme
}

const DEFAULT_THEME: TemplateTheme = {
  fonts: { display: "Cormorant Infant", script: "Alex Brush", body: "Plus Jakarta Sans" },
  colors: { surface: "#fdf9f0", text: "#1c1c16", accent: "#d4af37", accentMuted: "#8d4d39", overlay: "#1c1a15", dark: "#1c1a15" },
  ornaments: { divider: "gunungan", border: "ornate", frame: "arch" },
  motion: { enabled: true, duration: 0.6, stagger: 0.15 },
}

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const target = new Date(targetDate).getTime()
    if (isNaN(target)) return
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

function Ornament({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M0 20 Q25 0 50 20 Q75 40 100 20 Q125 0 150 20 Q175 40 200 20" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.4"/>
      <circle cx="50" cy="20" r="1.5" fill="currentColor" opacity="0.3"/>
      <circle cx="100" cy="20" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="150" cy="20" r="1.5" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}

function GununganSvg({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <path d="M50 0C50 0 35 30 20 40C10 47 2 55 2 70C2 90 15 105 28 112C38 117 50 120 50 120C50 120 62 117 72 112C85 105 98 90 98 70C98 55 90 47 80 40C65 30 50 0 50 0Z" fill="currentColor" opacity="0.08"/>
      <path d="M50 8C50 8 38 33 26 41C17 47 10 54 10 66C10 83 21 95 32 101C40 106 50 108 50 108C50 108 60 106 68 101C79 95 90 83 90 66C90 54 83 47 74 41C62 33 50 8 50 8Z" fill="currentColor" opacity="0.05"/>
      <circle cx="50" cy="55" r="5" fill="currentColor" opacity="0.06"/>
      <path d="M42 70L50 82L58 70" stroke="currentColor" strokeWidth="0.5" opacity="0.15" fill="none"/>
    </svg>
  )
}

function PhotoPlaceholder({ icon, className, frame }: { icon: string; className?: string; frame?: string }) {
  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/5 to-[#d4af37]/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl md:text-6xl text-[#d4af37]/20">{icon}</span>
      </div>
    </div>
  )
}

function AudioPlayer({ trackUrl }: { trackUrl: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() } else { audioRef.current.play().catch(() => {}) }
    setPlaying(!playing)
  }, [playing])
  if (!trackUrl) return null
  return (
    <>
      <audio ref={audioRef} src={trackUrl} loop />
      <button onClick={toggle} className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-white/90 border border-[#d4af37]/30 flex items-center justify-center shadow-lg hover:bg-white transition-all" aria-label="Toggle music">
        <span className="material-symbols-outlined text-sm text-[#8d4d39]">{playing ? "music_note" : "music_off"}</span>
      </button>
    </>
  )
}

function GiftSection({ theme }: { theme: TemplateTheme }) {
  const c = theme.colors
  const gifts = [
    { bank: "BRI", name: "Rekening 1", number: "338001052747530", logo: "BRI" },
    { bank: "DANA", name: "E-Wallet 1", number: "082361944259", logo: "DANA" },
  ]
  const [copied, setCopied] = useState<number | null>(null)
  const copyNumber = (num: string, idx: number) => {
    navigator.clipboard.writeText(num.replace(/\s/g, "")).then(() => { setCopied(idx); setTimeout(() => setCopied(null), 2000) }).catch(() => {})
  }
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
      {gifts.map((g, i) => (
        <div key={i} className="bg-white border p-5 text-center" style={{ borderColor: `${c.accent}33` }}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center text-xs font-bold tracking-wider" style={{ backgroundColor: c.surface, borderColor: `${c.accent}33`, borderWidth: 1, color: c.accentMuted }}>
            {g.logo}
          </div>
          <p className="text-[10px] uppercase tracking-[0.15em] opacity-40 mb-1">{g.bank}</p>
          <p className="text-sm font-semibold mb-0.5">a.n. {g.name}</p>
          <p className="text-xs tracking-wider opacity-70 mb-3 font-mono">{g.number}</p>
          <button onClick={() => copyNumber(g.number, i)} className="text-[10px] uppercase tracking-[0.2em] px-5 py-2 border transition-all" style={{ borderColor: `${c.accent}44`, color: c.accentMuted }}>
            {copied === i ? "Tersalin ✓" : "Salin"}
          </button>
        </div>
      ))}
    </div>
  )
}

const MOCK_WISHES = [
  { name: "Tante Rina", message: "Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah!" },
  { name: "Mas Budi", message: "Turut berbahagia. Barakallah!" },
  { name: "Sari & Keluarga", message: "Semoga menjadi keluarga yang berkah dan langgeng." },
]

export default function HeritageJawa({ bride_name, groom_name, estimated_wedding_date, guest_name, theme: themeProp }: Props) {
  const theme = themeProp || DEFAULT_THEME
  const c = theme.colors
  const [opened, setOpened] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const countdown = useCountdown(estimated_wedding_date)

  const handleOpen = () => {
    setOpened(true)
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth" }), 200)
  }

  const weddingDateFormatted = estimated_wedding_date
    ? new Date(estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""
  const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const dayName = estimated_wedding_date ? daysOfWeek[new Date(estimated_wedding_date).getDay()] : ""

  const sectionClass = "py-20 px-6 text-center max-w-2xl mx-auto"
  const dividerClass = "w-16 h-px mx-auto my-8"
  const subHeadingClass = "text-[10px] uppercase tracking-[0.25em] opacity-40 mb-2"

  return (
    <ThemeInjector display={theme.fonts.display} script={theme.fonts.script} body={theme.fonts.body}>
      <main className="min-h-screen font-serif selection:bg-[#d4af37]/20" style={{ backgroundColor: c.surface, color: c.text }}>

        {/* COVER */}
        {!opened && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: c.dark }}>
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.overlay}99 0%, transparent 50%, ${c.overlay}88 100%)` }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 15L45 15L37 22L40 32L30 27L20 32L23 22L15 15L25 15Z' fill='%23d4af37'/%3E%3C/svg%3E\")", backgroundSize: "60px 60px" }} />
            <div className="relative z-10 text-center px-6">
              <GununganSvg className="w-16 h-20 mx-auto mb-8" style={{ color: `${c.accent}44` }} />
              <p className="text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: `${c.accent}88` }}>The Wedding of</p>
              <h1 className="text-4xl md:text-6xl font-light tracking-wide leading-tight text-white">{bride_name}</h1>
              <p className="text-2xl md:text-3xl font-light my-3" style={{ color: `${c.accent}99` }}>&amp;</p>
              <h2 className="text-4xl md:text-6xl font-light tracking-wide leading-tight text-white">{groom_name}</h2>
              <div className={dividerClass} style={{ backgroundColor: `${c.accent}55` }} />
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Kepada Yth.</p>
              <p className="text-base md:text-lg font-semibold mt-1" style={{ color: c.accent }}>{guest_name}</p>
              <button onClick={handleOpen} className="mt-10 inline-flex items-center gap-3 px-10 py-4 border text-xs uppercase tracking-[0.25em] transition-all duration-500" style={{ borderColor: `${c.accent}77`, color: c.accent }}>
                <span className="material-symbols-outlined text-sm">mail</span>
                Buka Undangan
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 z-10" style={{ background: `linear-gradient(180deg, transparent, ${c.surface})` }} />
          </div>
        )}

        {/* MAIN */}
        <div ref={contentRef} className={opened ? "block" : "invisible"}>
          <AudioPlayer trackUrl="" />

          {/* HERO */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: c.dark }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 8L46 22L60 22L49 32L53 46L40 38L27 46L31 32L20 22L34 22Z' fill='%23d4af37'/%3E%3C/svg%3E\")", backgroundSize: "80px 80px" }} />
            <div className="relative z-10 text-center px-6">
              <GununganSvg className="w-20 h-24 mx-auto mb-8" style={{ color: `${c.accent}33` }} />
              <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: `${c.accent}77` }}>The Wedding of</p>
              <h1 className="text-4xl md:text-6xl font-light tracking-wide text-white leading-tight">{bride_name}</h1>
              <p className="text-2xl md:text-3xl font-light my-4" style={{ color: `${c.accent}88` }}>&amp;</p>
              <h2 className="text-4xl md:text-6xl font-light tracking-wide text-white leading-tight">{groom_name}</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-8">{dayName}, {weddingDateFormatted}</p>
              <div className="mt-10 flex gap-8 justify-center text-white">
                {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="text-center">
                    <div className="text-3xl md:text-4xl font-light tracking-widest">{String(countdown[unit]).padStart(2, "0")}</div>
                    <div className="text-[9px] uppercase tracking-[0.15em] mt-1 text-white/30">{unit === "days" ? "Hari" : unit === "hours" ? "Jam" : unit === "minutes" ? "Menit" : "Detik"}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* OPENING */}
          <MotionSection delay={0} duration={theme.motion.duration}>
            <section className={sectionClass}>
              <GununganSvg className="w-16 h-20 mx-auto mb-8" style={{ color: `${c.accent}44` }} />
              <p className="text-sm md:text-base italic leading-relaxed opacity-70 max-w-lg mx-auto">
                &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri&hellip;&rdquo;
              </p>
              <p className="text-xs uppercase tracking-[0.15em] mt-5 opacity-40">QS. Ar-Rum: 21</p>
              <Ornament className="w-40 h-6 mx-auto mt-8" style={{ color: c.accent }} />
            </section>
          </MotionSection>

          {/* BRIDE & GROOM */}
          <section style={{ background: `linear-gradient(180deg, ${c.surface}, #f5f0e4)` }}>
            <MotionSection delay={0} duration={theme.motion.duration}>
              <div className="py-20 px-6">
                <p className={subHeadingClass}>Mempelai</p>
                <Ornament className="w-32 h-5 mx-auto mb-12" style={{ color: c.accent }} />
                <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto">
                  <div className="text-center">
                    <PhotoPlaceholder icon="face_4" className="w-40 h-56 mx-auto mb-5" />
                    <h3 className="text-xl font-semibold">{bride_name}</h3>
                    <p className="text-xs italic opacity-50 mt-2 max-w-xs mx-auto">Putri bungsu dari (Alm.) Bapak Ariffin & Ibu Nawen</p>
                  </div>
                  <div className="text-center">
                    <PhotoPlaceholder icon="face_6" className="w-40 h-56 mx-auto mb-5" />
                    <h3 className="text-xl font-semibold">{groom_name}</h3>
                    <p className="text-xs italic opacity-50 mt-2 max-w-xs mx-auto">Putra bungsu dari (Alm.) Bapak Syahrum & Ibu Tugini</p>
                  </div>
                </div>
              </div>
            </MotionSection>
          </section>

          {/* DIVIDER */}
          <div className="py-10 text-center" style={{ color: `${c.accentMuted}33` }}>
            <GununganSvg className="w-24 h-28 mx-auto" />
          </div>

          {/* EVENTS */}
          <MotionSection delay={0.1} duration={theme.motion.duration}>
            <section className={sectionClass}>
              <p className={subHeadingClass}>Akad Nikah</p>
              <Ornament className="w-24 h-4 mx-auto mb-8" style={{ color: c.accent }} />
              <p className="text-lg md:text-xl font-light">{dayName}, {weddingDateFormatted}</p>
              <p className="text-sm opacity-50 mt-1">Pukul 09:00 WIB</p>
              <p className="text-xs italic opacity-40 mt-4 max-w-sm mx-auto leading-relaxed">Kediaman Mempelai Wanita<br />Jl. Blok 1 Dusun 1 Desa Wonosari Kec. Tanjung Morawa</p>
              <a href="https://maps.app.goo.gl/JxDdCyvpvjbsQenAA" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 border transition-all"
                style={{ color: c.accentMuted, borderColor: c.accentMuted }}>
                <span className="material-symbols-outlined text-sm">map</span> Google Maps
              </a>
              <div className={dividerClass} style={{ backgroundColor: `${c.accent}55` }} />
              <p className={subHeadingClass}>Resepsi</p>
              <Ornament className="w-24 h-4 mx-auto mb-8" style={{ color: c.accent }} />
              <p className="text-lg md:text-xl font-light">{dayName}, {weddingDateFormatted}</p>
              <p className="text-sm opacity-50 mt-1">Pukul 11:00 WIB</p>
              <p className="text-xs italic opacity-40 mt-4 max-w-sm mx-auto leading-relaxed">Kediaman Mempelai Wanita<br />Jl. Blok 1 Dusun 1 Desa Wonosari Kec. Tanjung Morawa</p>
              <a href="https://maps.app.goo.gl/JxDdCyvpvjbsQenAA" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 border transition-all"
                style={{ color: c.accentMuted, borderColor: c.accentMuted }}>
                <span className="material-symbols-outlined text-sm">map</span> Google Maps
              </a>
            </section>
          </MotionSection>

          {/* LOVE STORY */}
          <section style={{ background: `linear-gradient(180deg, #f5f0e4, ${c.surface})` }}>
            <MotionSection delay={0.1} duration={theme.motion.duration}>
              <div className="py-20 px-6">
                <p className={subHeadingClass}>Love Story</p>
                <Ornament className="w-32 h-5 mx-auto mb-12" style={{ color: c.accent }} />
                <div className="max-w-lg mx-auto space-y-12">
                  {[
                    { year: "2022", title: "Awal Mula Pertemuan Kami", desc: "Pertemuan tak terduga di tahun 2022 membuka lembaran baru kisah kami." },
                    { year: "April 2026", title: "Lamaran", desc: "Tanpa diduga, dia memberanikan diri mengutarakan niat baik untuk datang melamar." },
                    { year: "Juli 2026", title: "Menuju Ikatan Suci", desc: "Setelah menemukan kembali percikan cinta, kami siap melangkah ke pernikahan yang sakral." },
                  ].map((s, i) => (
                    <div key={i} className="relative pl-8 border-l" style={{ borderColor: `${c.accent}44` }}>
                      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `${c.accent}66` }} />
                      <p className="text-[10px] uppercase tracking-[0.15em] opacity-40 mb-1">{s.year}</p>
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="text-xs italic opacity-60 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </MotionSection>
          </section>

          {/* DIVIDER */}
          <div className="py-10 text-center" style={{ color: `${c.accentMuted}33` }}>
            <GununganSvg className="w-24 h-28 mx-auto" />
          </div>

          {/* LOVE GIFT */}
          <MotionSection delay={0.1} duration={theme.motion.duration}>
            <section className={sectionClass}>
              <p className={subHeadingClass}>Love Gift</p>
              <Ornament className="w-32 h-5 mx-auto mb-4" style={{ color: c.accent }} />
              <p className="text-xs italic opacity-50 mb-8 max-w-sm mx-auto">
                Tanpa mengurangi rasa hormat, bagi yang ingin memberikan tanda kasih untuk kami, dapat melalui:
              </p>
              <GiftSection theme={theme} />
            </section>
          </MotionSection>

          {/* WISHES */}
          <section style={{ background: `linear-gradient(180deg, ${c.surface}, #f5f0e4)` }}>
            <MotionSection delay={0.15} duration={theme.motion.duration}>
              <div className="py-20 px-6 text-center max-w-lg mx-auto">
                <p className={subHeadingClass}>Ucapan & Doa</p>
                <Ornament className="w-32 h-5 mx-auto mb-4" style={{ color: c.accent }} />
                <p className="text-[11px] uppercase tracking-[0.15em] opacity-30 mb-8">{MOCK_WISHES.length} Ucapan</p>
                <div className="space-y-4 mb-12">
                  <div className="flex gap-3">
                    <input placeholder="Nama Anda" className="flex-1 bg-white/80 border px-4 py-2.5 text-sm outline-none font-sans" style={{ borderColor: `${c.accent}33` }} />
                    <select className="bg-white/80 border px-4 py-2.5 text-sm outline-none font-sans" style={{ borderColor: `${c.accent}33` }}>
                      <option>Hadir</option>
                      <option>Tidak Hadir</option>
                      <option>Masih Ragu</option>
                    </select>
                  </div>
                  <textarea placeholder="Ucapan & doa..." rows={3} className="w-full bg-white/80 border px-4 py-2.5 text-sm outline-none resize-none font-sans" style={{ borderColor: `${c.accent}33` }} />
                  <button className="w-full py-3 text-white text-xs uppercase tracking-[0.2em] transition-all" style={{ backgroundColor: c.accentMuted }}>
                    Kirim Ucapan
                  </button>
                </div>
                <div className="space-y-3 text-left">
                  {MOCK_WISHES.map((w, i) => (
                    <div key={i} className="border-l-2 pl-4 py-2" style={{ borderColor: `${c.accent}44` }}>
                      <p className="text-xs font-semibold">{w.name}</p>
                      <p className="text-xs italic opacity-60 mt-0.5">&ldquo;{w.message}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            </MotionSection>
          </section>

          {/* CLOSING */}
          <section className="relative py-24 px-6 text-center overflow-hidden" style={{ backgroundColor: c.dark }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 15L45 15L37 22L40 32L30 27L20 32L23 22L15 15L25 15Z' fill='%23d4af37'/%3E%3C/svg%3E\")", backgroundSize: "60px 60px" }} />
            <div className="relative z-10 max-w-lg mx-auto">
              <GununganSvg className="w-16 h-20 mx-auto mb-8" style={{ color: `${c.accent}33` }} />
              <p className="text-xs italic leading-relaxed text-white/50 mb-8">
                Suatu kebahagiaan & kehormatan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kami.
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: `${c.accent}77` }}>Kami Yang Berbahagia,</p>
              <p className="text-xl md:text-2xl text-white font-light tracking-wide">{bride_name} & {groom_name}</p>
              <Ornament className="w-40 h-5 mx-auto mt-8" style={{ color: `${c.accent}77` }} />
              <p className="text-[9px] text-white/20 tracking-wider mt-6">&copy; {new Date().getFullYear()} Aksaraa</p>
            </div>
          </section>
        </div>
      </main>
    </ThemeInjector>
  )
}