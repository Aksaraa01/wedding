"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { ASSETS } from "@/lib/assets"

type WishCard = {
  id: number
  name: string
  message: string
  relation: string
  likes: number
  pinned?: boolean
  type: string
}

const initialCards: WishCard[] = [
  {
    id: 1,
    name: "Bpk. Dr. Wijaya",
    message: "Untuk Dimas & Kirana, semoga pernikahan kalian senantiasa diliputi berkah dan kebahagiaan yang abadi hingga akhir hayat.",
    relation: "KELUARGA",
    likes: 24,
    pinned: true,
    type: "pinned keluarga",
  },
  {
    id: 2,
    name: "Kirani & Rizky",
    message: "Selamat menempuh hidup baru sahabatku! Dari zaman SMA sampai sekarang kita sukses bareng, semoga di pernikahan ini kalian juga sukses bangun keluarga yang hebat!",
    relation: "SAHABAT",
    likes: 12,
    type: "sahabat",
  },
  {
    id: 3,
    name: "Ibu Siti Aminah",
    message: "Semoga menjadi keluarga sakinah, mawaddah, warahmah. Bahagia selalu kawan sekantor!",
    relation: "REKAN KERJA",
    likes: 8,
    type: "rekan kerja",
  },
]

export default function VirtualWishWallPage() {
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [cards, setCards] = useState<WishCard[]>(initialCards)
  const [guestName, setGuestName] = useState("")
  const [guestMessage, setGuestMessage] = useState("")
  const [relation, setRelation] = useState("KELUARGA")
  const gridRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [sparkleId, setSparkleId] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0")
            entry.target.classList.remove("opacity-0", "translate-y-12")
          }
        })
      },
      { threshold: 0.1 }
    )

    const els = sectionRef.current?.querySelectorAll(".masonry-item, .sandbox-card, .bento-item")
    els?.forEach((el) => {
      ;(el as HTMLElement).classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-12")
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [cards])

  const filteredCards = cards.filter((c) => {
    if (filter === "all") return true
    return c.type.toLowerCase().includes(filter.toLowerCase())
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = guestName || "Tamu Undangan"
    const message = guestMessage || "Selamat menempuh hidup baru!"
    const newCard: WishCard = {
      id: Date.now(),
      name,
      message,
      relation,
      likes: 0,
      type: relation.toLowerCase(),
    }
    setCards((prev) => [newCard, ...prev])
    setSparkleId(newCard.id)
    setTimeout(() => setSparkleId(null), 800)
    setGuestName("")
    setGuestMessage("")
    setRelation("KELUARGA")

    setTimeout(() => {
      gridRef.current?.firstElementChild?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  const handleLike = (id: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    )
  }

  const filters = [
    { key: "all", label: "SEMUA DOA" },
    { key: "pinned", label: "DISEMATKAN", icon: "push_pin" },
    { key: "keluarga", label: "KELUARGA" },
    { key: "sahabat", label: "SAHABAT" },
  ]

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .editorial-shadow { box-shadow: 0px 20px 60px rgba(26, 24, 23, 0.08); }
        .masonry {
          column-count: 1;
          column-gap: 2rem;
        }
        @media (min-width: 768px) { .masonry { column-count: 2; } }
        @media (min-width: 1024px) { .masonry { column-count: 3; } }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 2rem;
        }
        .ticker-container { overflow: hidden; white-space: nowrap; }
        .ticker-scroll {
          display: inline-flex;
          animation: scroll 40s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .sparkle-animate {
          animation: sparkle 0.8s ease-out;
        }
        @keyframes sparkle {
          0% { transform: scale(0.8); opacity: 0; filter: brightness(2); }
          50% { transform: scale(1.05); opacity: 1; filter: brightness(1.2); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        .oled-screen {
          background: radial-gradient(circle at center, #2c2826 0%, #1a1817 100%);
          border: 1px solid rgba(255, 215, 0, 0.1);
        }
        .gold-border-glow { box-shadow: 0 0 20px rgba(141, 77, 57, 0.15); }
      `}</style>

      {/* Fixed Top Navigation */}
      <nav className="fixed top-0 left-0 w-full h-20 z-[100] bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-margin-mobile md:px-margin-desktop flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/hero")}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <span className="font-headline-md text-[24px] md:text-headline-md tracking-tight text-primary">AKSARAA</span>
          <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-1.5 rounded-full border border-outline-variant/40 shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">LIVE VENUE SYNC ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            className="hidden md:block bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-caps text-[11px] hover:bg-secondary transition-all"
            href="#sandbox"
          >
            COBA SIMULASI LIVE
          </a>
        </div>
      </nav>

      <main className="pt-20" ref={sectionRef}>
        {/* Hero */}
        <section className="min-h-[90vh] flex flex-col lg:flex-row items-center max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 lg:py-24 gap-16 overflow-hidden">
          <div className="flex-1 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/5 border border-secondary/20 text-secondary rounded-sm font-label-caps text-[10px] tracking-widest">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              MODUL DINDING DOA &amp; UCAPAN DIGITAL
            </div>
            <h1 className="font-display-lg text-[44px] md:text-display-lg text-primary leading-[1.1]">
              Abadikan Doa <br />dalam Karya <span className="italic text-secondary">Visual Elegan.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              Transformasikan ucapan tamu menjadi instalasi digital artistik. Terhubung secara instan dari smartphone tamu langsung ke layar LED venue utama dalam hitungan milidetik.
            </p>
            <div className="flex flex-wrap gap-5 pt-4">
              <button onClick={() => router.push("/register")} className="bg-primary text-on-primary px-10 py-5 rounded-sm font-label-caps text-[14px] flex items-center gap-3 group transition-all hover:bg-secondary">
                AKTIFKAN WISH WALL
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="flex-1 relative w-full group">
            <div className="relative w-full aspect-[4/3] md:aspect-video oled-screen rounded-xl editorial-shadow overflow-hidden border-[12px] border-[#1a1817] ring-1 ring-outline-variant/30 gold-border-glow">
              <div className="absolute inset-0 flex flex-col justify-center gap-8 py-8">
                <div className="ticker-container">
                  <div className="ticker-scroll gap-6 px-4">
                    <div className="flex gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[300px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[18px] italic mb-4">&ldquo;Bahagia selamanya Dimas &amp; Kirana!&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Sarah &amp; Kevin</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 42</span>
                        </div>
                      </div>
                      <div className="bg-secondary/10 border border-secondary/30 p-6 rounded-lg min-w-[300px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[18px] italic mb-4">&ldquo;Semoga sakinah mawaddah warahmah.&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Keluarga Besar Wijaya</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 108</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[300px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[18px] italic mb-4">&ldquo;Bahagia selamanya Dimas &amp; Kirana!&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Sarah &amp; Kevin</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 42</span>
                        </div>
                      </div>
                      <div className="bg-secondary/10 border border-secondary/30 p-6 rounded-lg min-w-[300px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[18px] italic mb-4">&ldquo;Semoga sakinah mawaddah warahmah.&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Keluarga Besar Wijaya</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 108</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ticker-container scale-110">
                  <div className="ticker-scroll gap-6 px-4" style={{ animationDirection: "reverse" }}>
                    <div className="flex gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[320px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[20px] italic mb-4">&ldquo;Happy Wedding my best friend!&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Rian Santoso</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 15</span>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[320px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[20px] italic mb-4">&ldquo;Cheers to a new beginning! ✨&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Amanda Putri</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 28</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[320px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[20px] italic mb-4">&ldquo;Happy Wedding my best friend!&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Rian Santoso</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 15</span>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-lg min-w-[320px] backdrop-blur-sm">
                        <p className="text-white font-display-lg text-[20px] italic mb-4">&ldquo;Cheers to a new beginning! ✨&rdquo;</p>
                        <div className="flex justify-between items-center text-white/50 font-label-caps text-[10px]">
                          <span>- Amanda Putri</span>
                          <span className="flex items-center gap-1 text-secondary">❤️ 28</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10">
                <span className="text-[9px] text-white/80 font-label-caps tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> PREVIEW: MAIN BALLROOM LED
                </span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 editorial-shadow rounded-lg border border-outline-variant/30 hidden md:block max-w-[240px] z-20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">speed</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold">0.5s</p>
                  <p className="text-[10px] text-on-surface-variant font-label-caps">LATENCY SYNC</p>
                </div>
              </div>
              <p className="text-[12px] text-on-surface-variant">Tamu mengirim pesan, layar langsung terupdate tanpa delay.</p>
            </div>
          </div>
        </section>

        {/* Metrics Strip */}
        <section className="bg-primary-container py-20">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "cloud_sync", title: "0.5s Sync", desc: "REAL-TIME CLOUD SPEED" },
              { icon: "hd", title: "4K Quality", desc: "PIXEL PERFECT PROJECTION" },
              { icon: "verified_user", title: "100% Control", desc: "SMART MODERATION PANEL" },
              { icon: "picture_as_pdf", title: "PDF Export", desc: "LIFETIME DIGITAL MEMORY" },
            ].map((m) => (
              <div key={m.title} className="bg-white/5 border border-white/10 p-8 rounded-lg hover:border-secondary transition-all group">
                <span className="material-symbols-outlined text-secondary text-[32px] mb-4">{m.icon}</span>
                <h4 className="text-white font-display-lg text-[24px] mb-1">{m.title}</h4>
                <p className="text-white/50 font-label-caps text-[10px] tracking-widest">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sandbox */}
        <section className="py-24 bg-surface-container-low" id="sandbox">
          <div className="max-w-4xl mx-auto px-margin-mobile sandbox-card">
            <div className="text-center mb-12 space-y-4">
              <h2 className="font-display-lg text-[36px] md:text-[48px] text-primary leading-tight">Coba Simulasi Interaktif</h2>
              <p className="text-on-surface-variant font-body-md max-w-lg mx-auto">Tulis pesan Anda di bawah ini dan lihat bagaimana pesan tersebut tampil secara instan di &quot;Wish Wall&quot; kami.</p>
            </div>
            <div className="bg-white editorial-shadow rounded-xl p-8 border border-outline-variant/30">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-caps text-[11px] text-on-surface-variant">NAMA TAMU</label>
                    <input
                      className="w-full bg-surface-container border-none focus:ring-1 focus:ring-secondary rounded-sm py-4 px-5"
                      placeholder="Contoh: Bpk. Heru & Ibu"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-caps text-[11px] text-on-surface-variant">HUBUNGAN</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["KELUARGA", "SAHABAT", "REKAN KERJA"].map((r) => (
                        <label key={r} className="cursor-pointer">
                          <input
                            className="hidden peer"
                            type="radio"
                            name="rel"
                            value={r}
                            checked={relation === r}
                            onChange={() => setRelation(r)}
                          />
                          <span className="px-4 py-2 border border-outline-variant rounded-full text-[11px] font-label-caps peer-checked:bg-primary peer-checked:text-white transition-all block">
                            {r}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[11px] text-on-surface-variant">PESAN DOA &amp; UCAPAN</label>
                  <textarea
                    className="w-full bg-surface-container border-none focus:ring-1 focus:ring-secondary rounded-sm py-4 px-5"
                    placeholder="Tuliskan doa restu Anda di sini..."
                    rows={4}
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                  />
                </div>
                <button
                  className="w-full bg-secondary text-on-primary py-5 rounded-sm font-label-caps text-[14px] flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-secondary/20"
                  type="submit"
                >
                  <span className="material-symbols-outlined">send</span>
                  KIRIM DOA KE LAYAR LED
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Live Wish Feed */}
        <section className="py-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4">
              <h2 className="font-headline-md text-primary text-[40px]">Live Wish Feed</h2>
              <p className="text-on-surface-variant font-body-md max-w-md">Eksplorasi doa-doa yang telah masuk dan disetujui oleh moderator.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  className={`px-6 py-3 rounded-full font-label-caps text-[11px] transition-all flex items-center gap-1 ${
                    filter === f.key
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface-variant hover:border-primary"
                  }`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.icon && <span className="material-symbols-outlined text-[14px]">{f.icon}</span>}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="masonry" ref={gridRef}>
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`masonry-item p-8 editorial-shadow relative group ${
                  card.id === sparkleId ? "sparkle-animate" : ""
                } ${
                  card.pinned
                    ? "bg-[#F5ECE1] border-l-4 border-secondary"
                    : card.type === "sahabat"
                      ? "bg-primary-container text-white"
                      : "bg-white border border-outline-variant/30"
                }`}
                data-type={card.type}
              >
                {card.pinned && (
                  <div className="absolute top-4 right-4 text-secondary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                  </div>
                )}
                <p className={`font-body-lg text-[18px] leading-relaxed mb-6 ${card.pinned ? "text-primary italic" : card.type === "sahabat" ? "text-white/90" : "text-on-surface-variant"}`}>
                  &ldquo;{card.message}&rdquo;
                </p>
                <div className="flex justify-between items-center pt-6 border-t border-secondary/20">
                  <div>
                    <span className={`block font-label-caps text-[12px] ${card.pinned ? "text-primary" : card.type === "sahabat" ? "text-white" : "text-primary"}`}>
                      {card.name}
                    </span>
                    <span className={`text-[10px] uppercase tracking-tighter ${card.pinned ? "text-secondary font-bold" : card.type === "sahabat" ? "text-white/50" : "text-on-surface-variant"}`}>
                      {card.relation}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-secondary hover:scale-110 transition-transform"
                    onClick={() => handleLike(card.id)}
                  >
                    <span className="material-symbols-outlined text-[20px]">favorite</span>
                    <span className="font-label-caps text-[14px]">{card.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid */}
        <section className="py-24 bg-[#1a1817]">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-20 space-y-6">
              <h2 className="font-display-lg text-white text-[40px] md:text-[56px]">The Aksaraa Experience</h2>
              <p className="text-white/60 max-w-lg mx-auto">Untuk momen yang hanya terjadi sekali seumur hidup.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-gutter h-auto md:h-[700px]">
              <div className="md:col-span-8 relative overflow-hidden rounded-xl border border-white/10 group bento-item">
                <img
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] transition-transform duration-1000 group-hover:scale-105"
                  alt="Cinematic luxury wedding venue projection"
                  src={ASSETS.wishWall.venueProjection}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="w-12 h-[1px] bg-secondary" />
                    <span className="font-label-caps text-secondary text-[12px] tracking-[0.3em]">IMMERSIVE ART</span>
                  </div>
                  <h3 className="font-display-lg text-white text-[32px] mb-4">Venue Cinematic Projection</h3>
                  <p className="text-white/60 max-w-md">Ubah dinding polos ballroom menjadi kanvas digital yang menceritakan cinta melalui ucapan-ucapan hangat dari tamu spesial Anda.</p>
                </div>
              </div>
              <div className="md:col-span-4 md:row-span-2 bg-[#252220] border border-white/5 rounded-xl overflow-hidden flex flex-col p-8 group bento-item">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-label-caps">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> MODERATOR ONLINE
                    </div>
                  </div>
                  <h3 className="font-display-lg text-white text-[24px] mb-4">Moderation Mastery</h3>
                  <p className="text-white/40 text-[14px] mb-8 leading-relaxed">Kendali penuh di tangan Anda atau wedding organizer. Setujui pesan secara instan sebelum muncul di layar utama.</p>
                </div>
                <div className="mt-auto relative rounded-lg border border-white/10 bg-black/40 p-4 transform transition-all group-hover:-translate-y-2">
                  <img className="w-full rounded-md" alt="Dashboard Interface" src={ASSETS.wishWall.dashboardInterface} />
                  <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-4 bg-[#F5ECE1] p-10 rounded-xl border border-outline-variant/20 flex flex-col justify-between group bento-item">
                <span className="material-symbols-outlined text-secondary text-[40px] group-hover:rotate-12 transition-transform">auto_stories</span>
                <div>
                  <h3 className="font-display-lg text-primary text-[24px] mb-2">Memory Export</h3>
                  <p className="text-on-surface-variant text-[14px]">Dapatkan bundel digital lengkap berupa PDF dari semua ucapan di akhir acara.</p>
                </div>
              </div>
              <div className="md:col-span-4 bg-secondary p-10 rounded-xl flex flex-col justify-between group bento-item">
                <div className="flex -space-x-3">
                  {["❤️", "✨", "💎"].map((emoji, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-secondary bg-white/20 flex items-center justify-center text-[20px]">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-display-lg text-white text-[24px] mb-2">Live Reactions</h3>
                  <p className="text-white/70 text-[14px]">Interaksi dua arah yang hidup dengan fitur &apos;Like&apos; yang membuat tamu merasa pesan mereka dihargai.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-outline-variant/30 py-4 px-margin-mobile md:px-margin-desktop z-[90] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="bg-secondary/10 p-2 rounded-full hidden sm:block">
            <span className="material-symbols-outlined text-secondary">celebration</span>
          </div>
          <span className="font-body-md font-semibold text-[14px] md:text-[15px]">Hadirkan Virtual Wish Wall di Pernikahan Anda</span>
        </div>
        <button onClick={() => router.push("/register")} className="w-full sm:w-auto bg-[#25D366] text-white px-8 py-3.5 rounded-sm font-label-caps text-[13px] flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-green-500/20">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.284l-.582 2.166 2.207-.58c.958.544 1.912.931 3.127.931h.001c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766m3.303 8.016c-.144.407-.84.771-1.2.822-.336.05-.77.087-1.248-.069-3.21-1.049-5.202-3.874-5.362-4.086-.16-.213-1.301-1.731-1.301-3.301 0-1.57.822-2.342 1.115-2.637.293-.294.636-.367.848-.367.213 0 .426.01.61.02.184.01.436-.07.683.528.252.61.859 2.097.934 2.246.075.149.124.322.025.52-.099.198-.148.322-.296.494-.149.172-.313.385-.445.516-.148.148-.303.31-.131.604.172.293.764 1.258 1.639 2.035.875.776 1.611 1.017 1.905 1.164.294.148.463.124.636-.075.173-.198.743-.865.941-1.163.198-.297.396-.248.669-.148.272.099 1.73.816 2.027.965.297.148.495.223.569.346.074.124.074.717-.223 1.124z" />
          </svg>
          KONSULTASI WISH WALL SEKARANG
        </button>
      </div>
    </>
  )
}
