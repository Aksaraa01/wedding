"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import CsWidget from "@/components/cs/CsWidget"
import SeoFaq from "@/components/SeoFaq"
import { ASSETS } from "@/lib/assets"
import { coupleUrl } from "@/lib/coupleUrl"

export default function ReminderTamuVIPPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [simState, setSimState] = useState<"idle" | "loading" | "success">("idle")
  const [guestName, setGuestName] = useState("")
  const [category, setCategory] = useState("")
  const [tableNo, setTableNo] = useState("")

  const guestSlug = (guestName.trim() || "tamu-undangan")
    .replace(/&/g, "dan")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "") || "tamu-undangan"

  const SIM_TEMPLATE = {
    label: "Singkat & Padat",
    text: "{Nama Tamu},\n\nInformasi pernikahan kami:\n\n📅 {Tanggal}\n📍 {Lokasi}\n🔗 {Tautan Unik}\n\nQR Code akses: {QR Akses}\nNomor Meja: {Nomor Meja}\n\nSampai jumpa!\n{Nama Pengantin}",
  }

  const previewMessage = SIM_TEMPLATE.text
    .replace("{Nama Tamu}", guestName.trim() || "Bpk. Robert J. Oppenheimer")
    .replace("{Tanggal}", "Sabtu, 14 Februari 2027")
    .replace("{Lokasi}", "The Ritz-Carlton Jakarta Ballroom")
    .replace("{Tautan Unik}", coupleUrl("dela", `/?to=${guestSlug}`))
    .replace("{QR Akses}", coupleUrl("dela", `/qr/${guestSlug}`))
    .replace("{Nomor Meja}", tableNo.trim() || "Emerald - 01")
    .replace("{Nama Pengantin}", "Aksaraa")

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
        className="fixed top-0 w-full h-16 md:h-[80px] z-50 bg-surface/85 backdrop-blur-xl border-b border-primary flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto left-0 right-0"
      >
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/hero")}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="font-headline-md text-[17px] md:text-headline-md tracking-tight text-primary">AKSARAA</div>
        </div>
      </header>

      <main className="pt-16 md:pt-[80px]" ref={mainRef}>
        {/* Hero */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-7 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-center">
            <div className="lg:col-span-6">
              <span className="inline-block px-4 py-1 border border-primary/20 font-label-sm text-label-sm uppercase tracking-[0.2em] mb-3 md:mb-8 reveal-item">
                Modul Pengingat Otomatis
              </span>
              <h1 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[27px] md:text-[72px] leading-[1.12] md:leading-[1.05] text-primary mb-3 md:mb-8 reveal-item">
                Reminder WhatsApp Otomatis untuk <span className="italic text-secondary">Tamu Undangan</span>.
              </h1>
              <p className="text-[13px] leading-relaxed md:font-body-lg md:text-body-lg text-on-surface-variant max-w-xl mb-4 md:mb-8 reveal-item">
                Blast undangan dan pengingat otomatis via WhatsApp, lengkap dengan RSVP, tautan unik, dan nomor meja untuk setiap tamu.
              </p>
              <button
                onClick={() => router.push("/register")}
                className="group flex items-center gap-2.5 md:gap-4 px-6 py-3.5 md:px-10 md:py-5 bg-primary text-on-primary font-label-sm text-[10px] md:text-label-sm uppercase tracking-widest transition-all hover:bg-on-surface-variant reveal-item"
              >
                Aktifkan Auto-Reminder VIP
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            <div className="lg:col-span-6 relative reveal-item">
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="pt-4 md:pt-12">
                  <img
                    alt="WhatsApp Chat Mockup"
                    className="w-full h-auto border border-primary/10 md:grayscale md:hover:grayscale-0 transition-all duration-700"
                    src={ASSETS.reminderVip.chat}
                  />
                </div>
                <div>
                  <img
                    alt="Dispatch Dashboard"
                    className="w-full h-auto border border-primary/10 md:grayscale md:hover:grayscale-0 transition-all duration-700"
                    src={ASSETS.reminderVip.dashboard}
                  />
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 border border-primary/10 hidden md:block" />
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="bg-surface-container py-8 md:py-24 border-y border-primary/5 reveal-item">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-primary/10">
              <div className="px-4 py-3 md:px-8 md:py-4 text-center lg:text-left">
                <p className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[24px] md:text-[44px] mb-1 md:mb-2 text-primary">100</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Tamu VIP</p>
              </div>
              <div className="px-4 py-3 md:px-8 md:py-4 text-center lg:text-left">
                <p className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[24px] md:text-[44px] mb-1 md:mb-2 text-primary">H-n</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Pemicu</p>
              </div>
              <div className="px-4 py-3 md:px-8 md:py-4 text-center lg:text-left">
                <p className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[24px] md:text-[44px] mb-1 md:mb-2 text-primary">QR</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Personal Pass</p>
              </div>
              <div className="px-4 py-3 md:px-8 md:py-4 text-center lg:text-left">
                <p className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[24px] md:text-[44px] mb-1 md:mb-2 text-primary">LIVE</p>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Tracking</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sandbox */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 md:py-32">
          <div className="bg-surface border border-primary p-4 md:p-16 reveal-item">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-16">
              <div className="lg:col-span-5">
                <h2 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.01em] text-[25px] md:text-[48px] mb-2 md:mb-6 text-primary">Interactive <span className="italic text-secondary">Preview</span></h2>
                <p className="text-[13px] md:text-base text-on-surface-variant mb-4 md:mb-12 leading-relaxed">
                  Rasakan pengalaman pengiriman pesan secara langsung. Isi data di bawah untuk melihat bagaimana sistem kami memformat undangan personal tamu Anda.
                </p>
              </div>
              <div className="lg:col-span-7">
                <form className="space-y-5 md:space-y-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative group">
                    <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Nama Tamu</label>
                    <input
                      className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-3 text-[14px] md:text-body-lg md:py-4 focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                      placeholder="Contoh: Bpk. Robert J. Oppenheimer"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
                    <div className="relative group">
                      <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Gelar / Kategori</label>
                      <input
                        className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-3 text-[14px] md:text-body-lg md:py-4 focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                        placeholder="Contoh: VIP Jakarta"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <label className="block font-label-sm text-label-sm uppercase tracking-widest mb-2">Nomor Meja</label>
                      <input
                        className="w-full bg-transparent border-t-0 border-x-0 border-b border-primary/20 py-3 text-[14px] md:text-body-lg md:py-4 focus:border-b-2 focus:border-primary outline-none transition-colors placeholder:text-on-surface-variant/40"
                        placeholder="Contoh: Emerald - 01"
                        type="text"
                        value={tableNo}
                        onChange={(e) => setTableNo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={handleSimulate}
                      disabled={simState !== "idle"}
                      className={`w-full md:w-auto px-6 py-3.5 md:px-12 md:py-5 font-label-sm text-[10px] md:text-label-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
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

                {simState === "success" && (
                  <div className="mt-6 md:mt-12">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                        Template: {SIM_TEMPLATE.label}
                      </span>
                      <span className="flex items-center gap-1.5 text-green-700 font-label-sm text-[10px] uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Terkirim ke WhatsApp
                      </span>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-primary/10 shadow-xl max-w-md lg:ml-auto">
                      {/* WhatsApp header */}
                      <div className="bg-[#075E54] px-5 py-4 flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">Aksaraa</p>
                          <p className="text-[11px] opacity-80 truncate">
                            Reminder Otomatis{category ? ` • ${category}` : ""}
                          </p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 text-[10px] shrink-0">
                          ✓✓ Terbaca
                        </span>
                      </div>
                      {/* Chat body */}
                      <div className="bg-[#E5DDD5] p-4 min-h-[220px]">
                        <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow max-w-[88%] text-[14px] leading-relaxed whitespace-pre-line">
                          {previewMessage}
                          <span className="block text-right text-[10px] text-gray-400 mt-2">09:00 ✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 md:py-32">
          <div className="text-center mb-6 md:mb-24 reveal-item">
            <h2 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.01em] text-[25px] md:text-[48px] mb-2 md:mb-4 text-primary">Langkah Kerja <span className="italic text-secondary">Modular</span></h2>
            <div className="w-24 h-[1px] bg-primary mx-auto mb-5 md:mb-8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {[
              { icon: "person_add", title: "Tagging VIP", desc: "Identifikasi daftar tamu eksklusif dalam dashboard kami yang terintegrasi secara seamless." },
              { icon: "edit_note", title: "Konfigurasi Pesan", desc: "Personalisasi pesan mulai dari sapaan khusus hingga detail akomodasi spesifik tamu." },
              { icon: "schedule", title: "Eksekusi Otomatis", desc: "Sistem akan mengeksekusi pengiriman sesuai tanggal dan waktu yang Anda atur di dashboard tanpa intervensi manual." },
              { icon: "query_stats", title: "Live Tracking", desc: "Pantau status delivery, read, hingga RSVP tamu secara real-time melalui dashboard sentral." },
            ].map((card, i) => (
              <div
                key={card.title}
                className="p-5 md:p-10 border border-primary/10 flex flex-col h-full bg-surface-container-low reveal-item"
              >
                <span className="material-symbols-outlined text-[22px] md:text-4xl mb-3 md:mb-8">{card.icon}</span>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-[17px] md:text-[26px] mb-1.5 md:mb-4 text-primary">{card.title}</h3>
                <p className="text-[12.5px] md:text-base leading-relaxed text-on-surface-variant">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-10 md:py-32 border-t border-primary/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-8">
            <div className="lg:col-span-8 bg-primary text-on-primary p-6 md:p-12 flex flex-col justify-end relative overflow-hidden reveal-item">
              <div className="relative z-10">
                <h2 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.01em] text-[25px] md:text-[56px] mb-3 md:mb-6 text-on-primary">Efisiensi Waktu <span className="italic">Tanpa Batas</span></h2>
                <p className="text-on-primary/70 text-[13px] md:font-body-lg max-w-lg mb-4 md:mb-8 leading-relaxed">
                  Fokuslah pada momen berharga Anda, biar sistem kami yang mengelola komunikasi VIP dengan presisi milidetik.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 bg-surface-container-high p-6 md:p-12 flex flex-col justify-between border border-primary/5 reveal-item">
              <div className="w-11 h-11 md:w-16 md:h-16 bg-primary flex items-center justify-center mb-4 md:mb-8">
                <span className="material-symbols-outlined text-on-primary text-3xl">qr_code_2</span>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-[18px] md:text-[26px] mb-1.5 md:mb-4 text-primary">Link &amp; <span className="italic text-secondary">QR Tamu</span></h3>
                <p className="text-[12.5px] md:text-base leading-relaxed text-on-surface-variant">Setiap pesan dilengkapi dengan QR unik untuk digital guest book</p>
              </div>
            </div>
            <div className="lg:col-span-4 bg-surface-container p-6 md:p-12 flex flex-col justify-between border border-primary/5 reveal-item">
              <div className="w-11 h-11 md:w-16 md:h-16 bg-primary/10 flex items-center justify-center mb-4 md:mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">directions</span>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-[18px] md:text-[26px] mb-1.5 md:mb-4 text-primary">Petunjuk <span className="italic text-secondary">Arah Maps</span></h3>
                <p className="text-[12.5px] md:text-base leading-relaxed text-on-surface-variant">Navigasi presisi disematkan langsung dalam pesan untuk meminimalisir kendala kedatangan.</p>
              </div>
            </div>
          </div>
        </section>

        <SeoFaq
          heading="Pertanyaan tentang Reminder WhatsApp"
          items={[
            {
              q: "Apa itu reminder WhatsApp otomatis?",
              a: "Sistem yang mengirim undangan dan pengingat kehadiran ke setiap tamu via WhatsApp secara terjadwal, tanpa broadcast manual satu per satu.",
            },
            {
              q: "Apakah setiap tamu mendapat pesan personal?",
              a: "Ya. Setiap pesan memuat nama tamu, tautan undangan unik, dan nomor meja masing-masing, bukan pesan massal yang generik.",
            },
            {
              q: "Apakah RSVP bisa lewat WhatsApp?",
              a: "Ya. Tamu mengonfirmasi kehadiran lewat tautan di pesan, dan status RSVP tercatat otomatis di dashboard mempelai.",
            },
            {
              q: "Apakah memakai nomor WhatsApp pribadi mempelai?",
              a: "Tidak. Pesan dikirim melalui sistem Aksaraa, sehingga nomor pribadi tetap aman dan riwayat pengiriman terdokumentasi.",
            },
          ]}
        />

      </main>
      <CsWidget />
    </>
  )
}
