"use client"

import { useEffect } from "react"

export default function ChaosHero() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".floating-card")
      const x = (window.innerWidth / 2 - e.pageX) / 50
      const y = (window.innerHeight / 2 - e.pageY) / 50

      cards.forEach((card, index) => {
        const speed = (index + 1) * 0.2
        ;(card as HTMLElement).style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(var(--rot))`
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      const cards = document.querySelectorAll(".floating-card")
      const touch = e.touches[0]
      const x = (window.innerWidth / 2 - touch.pageX) / 40
      const y = (window.innerHeight / 2 - touch.pageY) / 40

      cards.forEach((card, index) => {
        const speed = (index + 1) * 0.15
        ;(card as HTMLElement).style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(var(--rot))`
      })
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: true })

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [])

  const scrollToTransition = () => {
    const el = document.getElementById("transition-section")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-surface select-none">
      {/* Central Typography */}
      <div className="text-center px-edge-margin-mobile pointer-events-none z-40">
        <h2 className="font-headline-xl text-display-lg-mobile text-white font-black drop-shadow-2xl">
          Rekap Tamu Berantakan,
          <br />
          tanpa RSVP otomatis.
          <br />
          <span className="text-error italic">Kekacauan Total.</span>
        </h2>
      </div>

      {/* Card 1: WhatsApp Mama */}
      <div
        className="floating-card absolute z-20 w-64 p-4 rounded-xl bg-[#25D366]/20 backdrop-blur-lg border border-white/10"
        style={{ top: "15%", left: "5%", "--rot": "-8deg" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            M
          </div>
          <span className="font-label-md text-white">Mama</span>
        </div>
        <p className="text-sm text-white/90 leading-snug">
          &ldquo;Kak, Tante Ani minta tambah 150 undangan lagi ya, meja VIP jangan lupa.&rdquo;
        </p>
        <span className="block text-[10px] text-right text-white/50 mt-1">22:42</span>
      </div>

      {/* Card 2: Overdue Invoice */}
      <div
        className="floating-card absolute z-30 w-56 p-5 rounded-none bg-white shadow-2xl"
        style={{ bottom: "20%", right: "5%", "--rot": "5deg" } as React.CSSProperties}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-bold tracking-widest text-black uppercase">
            FAKTUR #132
          </span>
          <span className="bg-error text-white text-[9px] px-2 py-0.5 font-bold">
            JATUH TEMPO
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 uppercase font-semibold">
          Physical Invitation&nbsp;
        </p>
        <h3 className="text-xl font-bold text-black mt-1">Rp 45.000.000</h3>
        <div className="mt-4 border-t border-zinc-200 pt-2">
          <button className="w-full bg-black text-white py-2 text-[10px] font-bold uppercase tracking-widest">
            BAYAR SEKARANG
          </button>
        </div>
      </div>

      {/* Card 3: Missed Calls Notification */}
      <div
        className="floating-card absolute z-20 w-72 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl"
        style={{ top: "10%", right: "-10px", "--rot": "12deg" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div className="bg-error/20 p-2 rounded-lg">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Panggilan Tak Terjawab (5)</h4>
            <p className="text-zinc-400 text-xs">Vendor Suvenir &amp; Manajer Tamu</p>
          </div>
        </div>
      </div>

      {/* Card 4: Budget Pie Chart */}
      <div
        className="floating-card absolute z-0 w-48 h-48 p-4 rounded-full bg-surface-container-high border border-white/5 backdrop-blur-sm opacity-60"
        style={{ bottom: "10%", left: "-20px", "--rot": "-15deg" } as React.CSSProperties}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" fill="transparent" r="16" stroke="#333" strokeWidth="32" />
            <circle
              cx="16" cy="16" fill="transparent" r="16" stroke="#ff4d4d"
              strokeDasharray="75 100" strokeWidth="32"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] uppercase tracking-widest text-zinc-500">Biaya Tak Terduga</span>
            <span className="text-lg font-bold text-error">75%</span>
          </div>
        </div>
      </div>

      {/* Card 5: Guest List Chaos */}
      <div
        className="floating-card absolute z-0 w-60 p-3 rounded-lg bg-surface-variant/40 blur-[2px]"
        style={{ top: "40%", right: "15%", "--rot": "-20deg" } as React.CSSProperties}
      >
        <p className="text-[10px] text-white/40 mb-2">STATUS DAFTAR TAMU</p>
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white/20 w-1/4" />
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white/20 w-3/4" />
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white/20 w-2/3" />
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="absolute bottom-32 w-full px-6 z-40 text-center">
        <p className="font-label-md text-white/60 mb-6 uppercase tracking-[0.2em]">
          ADA CARA YANG LEBIH BAIK.
        </p>
        <button
          onClick={scrollToTransition}
          className="w-full max-w-sm py-4 font-bold text-sm tracking-widest uppercase transition-all active:scale-95 bg-secondary text-white mx-auto block cursor-pointer"
        >
          AMBIL KENDALI
        </button>
      </div>
    </section>
  )
}