"use client"

import { use, useEffect, useState, useRef, useCallback } from "react"

type Wish = {
  id: string
  name: string
  message: string
  is_pinned: boolean
  status: string
  created_at: string
  guest_id: string | null
  guests: { category: string } | null
}

export default function LedDisplay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [profileId, setProfileId] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [pinned, setPinned] = useState<Wish[]>([])
  const [others, setOthers] = useState<Wish[]>([])
  const [error, setError] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchWishes = useCallback(async (pid: string) => {
    try {
      const r = await fetch(`/api/wishes/led?wedding_profile_id=${pid}`)
      const data = await r.json()
      if (data) {
        setPinned(data.pinned || [])
        setOthers(data.others || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let pid = ""

    fetch(`/api/scanner/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data || !data.wedding_profile_id) return
        pid = data.wedding_profile_id
        setProfileId(pid)
        setCoupleName(`${data.bride_name} & ${data.groom_name}`)
        fetchWishes(pid)
      })
      .catch((e) => { if (!cancelled) setError(e.message) })

    const interval = setInterval(() => {
      if (pid) fetchWishes(pid)
    }, 10000)

    return () => { cancelled = true; clearInterval(interval) }
  }, [slug, fetchWishes])

  useEffect(() => {
    if (others.length === 0) return
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % others.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [others.length])

  useEffect(() => {
    if (!containerRef.current) return
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("div")
      p.className = "particle"
      const size = Math.random() * 3 + 1
      p.style.cssText = `
        position: absolute; background: #d4af37; border-radius: 50%;
        opacity: 0.3; filter: blur(1px);
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        animation: rise ${Math.random() * 10 + 15}s linear infinite;
        animation-delay: ${Math.random() * 15}s;
      `
      containerRef.current.appendChild(p)
    }
  }, [])

  const allApproved = [...pinned, ...others]

  return (
    <div className="min-h-screen flex flex-col overflow-hidden select-none cursor-none" style={{ backgroundColor: "#0a0a0a", color: "#fdf9f0" }}>
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />
      <main className="relative z-10 h-screen flex flex-col justify-between py-16 px-8 md:px-20 lg:px-40">
        <button className="absolute top-8 left-8 flex items-center gap-2 text-[#d4af37]/60 hover:text-[#d4af37] transition-colors z-20" onClick={() => history.back()}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-label-md text-label-md uppercase tracking-[0.2em]">Kembali</span>
        </button>

        <header className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold opacity-90 tracking-tight mb-4" style={{ background: "linear-gradient(135deg, #d4af37 0%, #f7e290 50%, #8d4d39 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Doa &amp; Restu Tamu Kehormatan
          </h1>
          <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto opacity-40" />
        </header>

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#d4af37]/60">{error}</p>
          </div>
        ) : allApproved.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#d4af37]/40 text-lg italic">Belum ada doa yang disetujui...</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-7xl">
              <div className="lg:col-span-7" style={{ animation: "float 8s ease-in-out infinite" }}>
                {pinned.length > 0 ? (
                  <div className="glass-card p-10 md:p-16 relative overflow-hidden" style={{
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(212,175,55,0.15)",
                  }}>
                    <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-[#d4af37]/30" />
                    <span className="material-symbols-outlined text-[#d4af37]/40 text-5xl md:text-6xl mb-6 md:mb-8 block" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                    <blockquote className="text-xl md:text-3xl lg:text-4xl italic leading-relaxed mb-8 md:mb-12 text-[#fdf9f0]">
                      &ldquo;{pinned[0].message}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-full border border-[#d4af37]/40 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(141,77,57,0.1))" }}>
                        <span className="material-symbols-outlined text-[#d4af37]">person</span>
                      </div>
                      <div>
                        <p className="font-label-md text-[10px] md:text-xs text-[#d4af37] uppercase tracking-[0.2em]">Pengirim</p>
                        <p className="text-base md:text-lg text-[#fdf9f0] font-semibold">
                          {pinned[0].name}{pinned[0].guests?.category ? <span className="text-[#d4af37]/60 text-sm md:text-base font-normal ml-2">({pinned[0].guests.category})</span> : null}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-10 md:p-16 text-center" style={{
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(212,175,55,0.15)",
                  }}>
                    <span className="material-symbols-outlined text-[#d4af37]/40 text-5xl md:text-6xl block" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <p className="text-lg md:text-xl text-[#d4af37]/60 italic mt-4">Belum ada doa yang disematkan</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 flex flex-col gap-4 md:gap-8 justify-center">
                {others.length > 0 ? (
                  others.map((wish, idx) => (
                    <div
                      key={wish.id}
                      className="glass-card p-6 md:p-10 transition-all duration-700"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(12px)",
                        border: idx === activeIdx ? "1px solid rgba(212,175,55,0.15)" : "1px solid rgba(212,175,55,0.08)",
                        opacity: idx === activeIdx ? 1 : 0.4,
                        transform: idx === activeIdx ? "translateX(16px) scale(1)" : "translateX(0px) scale(0.95)",
                        filter: idx === activeIdx ? "blur(0px)" : "blur(1px)",
                        borderLeft: idx === activeIdx ? "4px solid #8d4d39" : "4px solid transparent",
                      }}
                    >
                      <p className="text-lg md:text-xl lg:text-2xl text-[#fdf9f0] mb-4 md:mb-6 leading-snug">
                        &ldquo;{wish.message}&rdquo;
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-label-md text-[10px] md:text-xs text-[#d4af37]/60 mb-1">Tamu Undangan</p>
                          <p className="text-sm md:text-base text-[#fdf9f0]">
                            {wish.name}{wish.guests?.category ? <span className="text-[#d4af37]/60 text-xs md:text-sm font-normal ml-1.5">({wish.guests.category})</span> : null}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-[#8d4d39]">favorite</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(212,175,55,0.08)" }}>
                    <p className="text-[#d4af37]/40 italic">Doa yang disetujui akan muncul di sini</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="w-full" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)" }}>
          {allApproved.length > 0 && (
            <div className="py-4 border-t border-[#d4af37]/10 overflow-hidden">
              <div className="flex items-center gap-4 mb-2 text-[#d4af37]/40 uppercase tracking-widest font-label-md text-xs">
                <span className="material-symbols-outlined scale-75">star</span>
                <span>Untaian Doa Dari Sahabat</span>
              </div>
              <div className="marquee-container flex" style={{ animation: "marquee 30s linear infinite", width: "max-content" }}>
                <div className="flex items-center gap-16" style={{ flexShrink: 0 }}>
                  {[...allApproved, ...allApproved].map((wish, i) => (
                    <span key={`${wish.id}-${i}`} className="italic text-sm md:text-base text-[#fdf9f0]/60 whitespace-nowrap">
                      &ldquo;{wish.message.slice(0, 60)}{wish.message.length > 60 ? "..." : ""}&rdquo; — {wish.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </footer>
      </main>

      <style jsx global>{`
        body { margin: 0; overflow: hidden; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(0.5deg); }
        }
        @keyframes rise {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container { display: flex; }
        .glass-card { transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  )
}
