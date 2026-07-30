"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { ASSETS } from "@/lib/assets"

export default function ReminderTamuVIPPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [simState, setSimState] = useState<"idle" | "loading" | "success">("idle")

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

    const els = mainRef.current?.querySelectorAll(".reveal-item")
    els?.forEach((el) => {
      ;(el as HTMLElement).classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-12")
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let lastScroll = 0
    const handleScroll = () => {
      const currentScroll = window.scrollY
      const nav = headerRef.current
      if (!nav) return
      if (currentScroll > lastScroll && currentScroll > 100) {
        nav.style.transform = "translateY(-100%)"
      } else {
        nav.style.transform = "translateY(0)"
      }
      lastScroll = currentScroll
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSimulate = () => {
    if (simState !== "idle") return
    setSimState("loading")
    setTimeout(() => setSimState("success"), 2000)
  }

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--color-surface); }
        ::-webkit-scrollbar-thumb { background: var(--color-primary); }
      `}</style>

      <header
        ref={headerRef}
        className="fixed top-0 w-full h-[80px] z-50 bg-surface/85 backdrop-blur-xl border-b border-primary flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto left-0 right-0"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/hero")}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="font-headline-md text-[24px] md:text-headline-md tracking-tight text-primary">AKSARAA</div>
        </div>
      </header>

      <main className="pt-[80px]" ref={mainRef}>
        {/* Hero */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-16 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <span className="inline-block px-4 py-1 border border-primary/20 font-label-sm text-label-sm uppercase tracking-[0.2em] mb-8 reveal-item">
                Modul Pengingat Otomatis
              </span>
              <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg mb-8 leading-[1.1] reveal-item">
                Pastikan Kehadiran Tamu Kehormatan dengan Sentuhan Personal.
              </h1>
              <button
                onClick={() => router.push("/register")}
                className="group flex items-center gap-4 px-10 py-5 bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-widest transition-all hover:bg-on-surface-variant reveal-item"
              >
                Aktifkan Auto-Reminder VIP
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            <div className="lg:col-span-6 relative reveal-item">
              <div className="grid grid-cols-2 gap-4">
                <div className="pt-12">
                  <img
                    alt="WhatsApp Chat Mockup"
                    className="w-full h-auto border border-primary/10 grayscale hover:grayscale-0 transition-all duration-700"
                    src={ASSETS.reminderVip.chat}
                  />
                </div>
                <div>
                  <img
                    alt="Dispatch Dashboard"
                    className="w-full h-auto border border-primary/10 grayscale hover:grayscale-0 transition-all duration-700"
                    src={ASSETS.reminderVip.dashboard}
                  />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 border border-primary/10 hidden md:block" />
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="bg-surface-container py-24 border-y border-primary/5 reveal-item">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-primary/10">
              <div className="px-8 py-4 text-center lg:text-left">
                <p className="font-display-lg text-headline-lg mb-2">100</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Tamu VIP</p>
              </div>
              <div className="px-8 py-4 text-center lg:text-left">
                <p className="font-display-lg text-headline-lg mb-2">H-n</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Pemicu</p>
              </div>
              <div className="px-8 py-4 text-center lg:text-left">
                <p className="font-display-lg text-headline-lg mb-2">QR</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Personal Pass</p>
              </div>
              <div className="px-8 py-4 text-center lg:text-left">
                <p className="font-display-lg text-headline-lg mb-2">LIVE</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Tracking</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sandbox */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-32">
          <div className="bg-surface border border-primary p-8 md:p-16 reveal-item">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5">
                <h2 className="font-headline-lg text-headline-lg mb-6">Interactive Preview</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-12">
                  Rasakan pengalaman pengiriman pesan secara langsung. Isi data di bawah untuk melihat bagaimana sistem kami memformat undangan personal tamu Anda.
                </p>
              </div>
              <div className="lg:col-span-7">
                <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative group">
                    <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Nama Tamu</label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-4 text-body-lg font-body-lg focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                      placeholder="Contoh: Bpk. Robert J. Oppenheimer"
                      type="text"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="relative group">
                      <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Gelar / Kategori</label>
                      <input
                        className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-4 text-body-lg font-body-lg focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                        placeholder="Contoh: VIP Jakarta"
                        type="text"
                      />
                    </div>
                    <div className="relative group">
                      <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Nomor Meja</label>
                      <input
                        className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-4 text-body-lg font-body-lg focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                        placeholder="Contoh: Emerald - 01"
                        type="text"
                      />
                    </div>
                  </div>
                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={handleSimulate}
                      disabled={simState !== "idle"}
                      className={`w-full md:w-auto px-12 py-5 font-label-sm text-label-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
                        simState === "success"
                          ? "bg-green-600 text-white"
                          : "bg-primary text-on-primary hover:bg-on-surface-variant"
                      } ${simState === "loading" ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      {simState === "loading" ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          Mengirim...
                        </>
                      ) : simState === "success" ? (
                        <>
                          <span className="material-symbols-outlined">check_circle</span>
                          Simulasi Berhasil
                        </>
                      ) : (
                        "Simulasi"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-32">
          <div className="text-center mb-24 reveal-item">
            <h2 className="font-headline-lg text-headline-lg mb-4">Langkah Kerja Modular</h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mb-8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "person_add", title: "Tagging VIP", desc: "Identifikasi daftar tamu eksklusif dalam dashboard kami yang terintegrasi secara seamless." },
              { icon: "edit_note", title: "Konfigurasi Pesan", desc: "Personalisasi pesan mulai dari sapaan khusus hingga detail akomodasi spesifik tamu." },
              { icon: "schedule", title: "Eksekusi Otomatis", desc: "Sistem akan mengeksekusi pengiriman sesuai tanggal dan waktu yang Anda atur di dashboard tanpa intervensi manual." },
              { icon: "query_stats", title: "Live Tracking", desc: "Pantau status delivery, read, hingga RSVP tamu secara real-time melalui dashboard sentral." },
            ].map((card, i) => (
              <div
                key={card.title}
                className="p-10 border border-primary/10 flex flex-col h-full bg-surface-container-low reveal-item"
              >
                <span className="material-symbols-outlined text-4xl mb-8">{card.icon}</span>
                <h3 className="font-headline-md text-headline-md mb-4">{card.title}</h3>
                <p className="text-on-surface-variant font-body-md">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-32 border-t border-primary/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-primary text-on-primary p-12 flex flex-col justify-end relative overflow-hidden reveal-item">
              <div className="relative z-10">
                <h2 className="font-display-lg text-headline-lg md:text-display-lg mb-6">Efisiensi Waktu Tanpa Batas</h2>
                <p className="text-on-primary/70 font-body-lg max-w-lg mb-8">
                  Fokuslah pada momen berharga Anda, biar sistem kami yang mengelola komunikasi VIP dengan presisi milidetik.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 bg-surface-container-high p-12 flex flex-col justify-between border border-primary/5 reveal-item">
              <div className="w-16 h-16 bg-primary flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-on-primary text-3xl">qr_code_2</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-4">Link &amp; QR Tamu</h3>
                <p className="text-on-surface-variant">Setiap pesan dilengkapi dengan QR unik untuk digital guest book</p>
              </div>
            </div>
            <div className="lg:col-span-4 bg-surface-container p-12 flex flex-col justify-between border border-primary/5 reveal-item">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">directions</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md mb-4">Petunjuk Arah Maps</h3>
                <p className="text-on-surface-variant">Navigasi presisi disematkan langsung dalam pesan untuk meminimalisir kendala kedatangan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacer for fixed footer */}
        <div className="h-32 md:h-24" />
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 w-full z-50 bg-primary h-24 md:h-20 shadow-2xl" />
    </>
  )
}
