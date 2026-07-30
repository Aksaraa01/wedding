"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { ASSETS } from "@/lib/assets"

export default function PremiumWebInvitationPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const opts = { threshold: 0.1 }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0")
          entry.target.classList.remove("opacity-0", "translate-y-10")
        }
      })
    }, opts)
    const els = mainRef.current?.querySelectorAll(
      ".bento-card, section h2, section p"
    )
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .bento-card { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0px 10px 40px rgba(26, 24, 23, 0.05); }
        .editorial-divider { height: 0.5px; background-color: #ffdbd0; width: 100%; }
      `}</style>

      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b-[0.5px] border-outline-variant">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 w-full max-w-container-max mx-auto">
          <div className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tighter">
            Aksaraa
          </div>
          <div className="md:hidden">
            <span className="material-symbols-outlined text-primary">menu</span>
          </div>
        </div>
      </nav>

      <main className="pt-32" ref={mainRef}>
        {/* Hero */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-32" id="experience">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-8">
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg leading-[1.1] text-primary">
                Abadikan Cerita Cintamu dengan{" "}
                <span className="italic text-secondary">Undangan Digital Premium</span> kami
              </h1>
              <p className="font-body-lg text-body-lg max-w-lg text-on-surface">
                Didesain eksklusif, undangan digital kami memadukan cerita sinematik dengan kemudahan
              </p>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => router.push("/register")}
                  className="bg-primary text-on-primary px-8 py-4 rounded-sm font-label-caps text-label-caps hover:bg-secondary transition-all"
                >
                  Pesan Sekarang
                </button>
                <button className="border border-primary text-primary px-8 py-4 rounded-sm font-label-caps text-label-caps hover:bg-surface-container-low transition-all">
                  Lihat Koleksi
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 relative h-[600px] flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-64 h-[500px] bg-surface-container-high rounded-[3rem] border-[8px] border-inverse-surface shadow-2xl z-20 translate-x-12 translate-y-8 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Smartphone mockup showing a premium wedding invitation"
                    src={ASSETS.premiumWeb.hero}
                  />
                </div>
                <div className="hidden md:block absolute w-[500px] h-80 bg-surface-container-high rounded-[2rem] border-[10px] border-inverse-surface shadow-xl z-10 -translate-x-12 -translate-y-12 overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Tablet mockup of RSVP dashboard"
                    src={ASSETS.premiumWeb.tablet}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Guest Journey */}
        <section className="bg-surface-container-low py-32">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="mb-24 space-y-4">
              <span className="font-label-caps text-label-caps text-secondary text-center block">THE EXPERIENCE</span>
              <h2 className="font-display-lg text-center text-primary">Perjalanan Tamu</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
              <div className="md:col-span-7 bento-card bg-surface p-10 rounded-lg space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-md text-primary mb-2">Kedatangan</h3>
                    <p className="font-body-md text-on-surface">Sapaan personal untuk setiap tamu spesial.</p>
                  </div>
                  <div className="flex gap-2 bg-surface-container-high p-1 rounded-full">
                    <button className="px-4 py-1 font-label-caps text-[10px] bg-primary text-on-primary rounded-full uppercase">EN</button>
                    <button className="px-4 py-1 font-label-caps text-[10px] text-on-surface-variant uppercase">ID</button>
                  </div>
                </div>
                <div className="p-8 border-[0.5px] border-outline-variant rounded-sm text-center space-y-4">
                  <p className="font-label-caps text-label-caps text-secondary italic">Tamu Spesial</p>
                  <h4 className="font-headline-md text-primary tracking-tight">Halo, Thomas &amp; Martha</h4>
                  <p className="font-body-md max-w-xs mx-auto text-on-surface">Suatu kehormatan bagi kami atas kehadiran Anda di hari bahagia kami.</p>
                </div>
              </div>

              <div className="md:col-span-5 bento-card bg-primary text-on-primary p-10 rounded-lg flex flex-col justify-between h-full">
                <span className="material-symbols-outlined text-4xl mb-8">schedule</span>
                <div className="flex-grow flex flex-col justify-center items-center space-y-12">
                  <div className="flex gap-8 items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl md:text-display-lg font-display-lg-mobile md:font-display-lg leading-none">24</div>
                      <div className="font-label-caps text-[10px] opacity-60 uppercase tracking-widest mt-2">Hari</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl md:text-display-lg font-display-lg-mobile md:font-display-lg leading-none">08</div>
                      <div className="font-label-caps text-[10px] opacity-60 uppercase tracking-widest mt-2">Jam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl md:text-display-lg font-display-lg-mobile md:font-display-lg leading-none">45</div>
                      <div className="font-label-caps text-[10px] opacity-60 uppercase tracking-widest mt-2">Menit</div>
                    </div>
                  </div>
                  <button className="w-full border border-on-primary/30 py-4 font-label-caps text-label-caps hover:bg-on-primary hover:text-primary transition-all">
                    Simpan di Kalender
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 bento-card bg-surface p-10 rounded-lg space-y-6">
                <h3 className="font-headline-md text-primary">Lokasi Acara</h3>
                <div className="h-64 rounded-sm overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover"
                    alt="Luxury wedding venue location map"
                    src={ASSETS.premiumWeb.maps}
                  />
                  <div className="absolute bottom-4 right-4 bg-primary text-on-primary p-3 rounded-full shadow-lg">
                    <span className="material-symbols-outlined">directions</span>
                  </div>
                </div>
                <p className="font-body-md text-on-surface">The Glass House, Cavalli Estate, California</p>
              </div>

              <div className="md:col-span-7 bento-card bg-secondary/5 border border-secondary/10 p-10 rounded-lg space-y-8">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Turut Mengundang</span>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="font-label-caps text-[10px] opacity-60 text-on-surface">KELUARGA MEMPELAI PRIA</p>
                    <p className="font-body-lg text-primary">Dr. Robert Sinclair &amp; Rekan</p>
                    <p className="font-body-lg text-primary">Keluarga Besar Aris</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-label-caps text-[10px] opacity-60 text-on-surface">KELUARGA MEMPELAI WANITA</p>
                    <p className="font-body-lg text-primary">Kol. Edward Thorne</p>
                    <p className="font-body-lg text-primary">Keluarga Besar Sterling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story & Media */}
        <section className="py-32 overflow-hidden">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row gap-24 items-center">
              <div className="w-full md:w-1/2 space-y-12">
                <div className="space-y-4">
                  <h2 className="font-display-lg text-primary">Cerita Kami</h2>
                  <div className="editorial-divider" />
                </div>
                <div className="relative pl-12 space-y-16 border-l-[0.5px] border-outline-variant">
                  <div className="relative">
                    <div className="absolute -left-[51px] top-1 bg-secondary w-2 h-2 rotate-45" />
                    <span className="font-label-caps text-label-caps text-secondary mb-2 block">MUSIM SEMI 2021</span>
                    <h4 className="font-headline-md text-primary mb-4">Pertemuan Pertama</h4>
                    <p className="font-body-md text-on-surface">Di pusat kota Florence, di mana bayang-bayang Duomo memanjang dengan indahnya, langkah kaki kami bertemu secara tak sengaja di sebuah toko buku tua yang nyaman.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[51px] top-1 bg-outline w-2 h-2 rotate-45" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 block">MUSIM GUGUR 2023</span>
                    <h4 className="font-headline-md text-primary mb-4">Satu Janji</h4>
                    <p className="font-body-md text-on-surface">Di bawah langit berbintang pesisir Amalfi, sebuah janji terucap untuk merajut lembar demi lembar kehidupan bersama, diikat oleh kecintaan pada momen yang abadi.</p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                <div className="space-y-4 translate-y-12">
                  <div className="h-80 w-full rounded-sm overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                    <img className="w-full h-full object-cover" alt="Couple walking through a sun-drenched square" src={ASSETS.premiumWeb.story1} />
                  </div>
                  <div className="h-48 w-full rounded-sm overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                    <img className="w-full h-full object-cover" alt="Close-up of intertwined hands with ring" src={ASSETS.premiumWeb.story2} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-48 w-full rounded-sm overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                    <img className="w-full h-full object-cover" alt="Coastal Italian villa at dusk" src={ASSETS.premiumWeb.story3} />
                  </div>
                  <div className="h-80 w-full rounded-sm overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                    <img className="w-full h-full object-cover" alt="Editorial portrait of couple in gallery" src={ASSETS.premiumWeb.story4} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-32 relative aspect-video w-full rounded-sm overflow-hidden bg-primary shadow-2xl group">
              <img
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-[2000ms]"
                alt="Cinematic frame of a couple dancing"
                src={ASSETS.premiumWeb.cinematic}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full border border-on-primary flex items-center justify-center hover:bg-on-primary hover:text-primary transition-all cursor-pointer"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <span className="material-symbols-outlined text-4xl">{isPlaying ? "pause" : "play_arrow"}</span>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 flex items-center gap-6">
                <div className="w-48 h-[1px] bg-on-primary/30 relative">
                  <div className="absolute top-0 left-0 h-full w-1/3 bg-on-primary" />
                </div>
                <div className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
                  <span className="font-label-caps text-[10px] text-on-primary uppercase tracking-widest italic">Sedang Diputar: L&apos;amour Toujours (Custom Mix)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interaction & Gifts */}
        <section className="bg-surface py-32 relative overflow-hidden" id="rsvp">
          <div className="absolute -top-64 -right-64 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-64 -left-64 w-96 h-96 bg-tertiary-fixed/10 rounded-full blur-3xl pointer-events-none" />
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24 relative z-10">
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-4">
                <span className="font-label-caps text-label-caps text-secondary block">RESERVASI</span>
                <h2 className="font-display-lg text-primary">Konfirmasi Kehadiran</h2>
                <p className="font-body-md text-on-surface">Mohon lakukan RSVP sebelum tanggal 15 Juni. Kehadiran Anda adalah kado terindah bagi kami.</p>
              </div>
              <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input className="w-full bg-transparent border-b border-on-surface/20 py-4 font-label-caps text-label-caps text-primary focus:border-secondary outline-none transition-colors uppercase placeholder:text-on-surface-variant/40" placeholder="NAMA TAMU" type="text" />
                </div>
                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border border-on-surface/20 flex items-center justify-center group-hover:border-secondary transition-all">
                      <div className="w-2.5 h-2.5 bg-secondary rounded-full opacity-0" />
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">AKAN HADIR</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border border-on-surface/20 flex items-center justify-center group-hover:border-secondary transition-all">
                      <div className="w-2.5 h-2.5 bg-secondary rounded-full opacity-0" />
                    </div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">BERHALANGAN</span>
                  </label>
                </div>
                <div className="relative">
                  <select className="w-full bg-transparent border-b border-on-surface/20 py-4 font-label-caps text-label-caps text-primary focus:border-secondary outline-none transition-colors uppercase appearance-none">
                    <option>JUMLAH TAMU: 1</option>
                    <option>JUMLAH TAMU: 2</option>
                  </select>
                </div>
                <button className="w-full bg-primary text-on-primary py-5 rounded-sm font-label-caps text-label-caps tracking-[0.2em] hover:bg-secondary transition-all" type="submit">
                  KIRIM RESERVASI
                </button>
              </form>
            </div>
            <div className="lg:col-span-7 space-y-16" id="registry">
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <h3 className="font-headline-md text-primary">Doa &amp; Harapan</h3>
                  <a className="font-label-caps text-[10px] text-secondary border-b border-secondary pb-1 uppercase" href="#">Lihat Semua</a>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                  <div className="min-w-[300px] bg-white p-8 rounded-lg shadow-sm border border-outline-variant/30 snap-start">
                    <p className="font-body-md italic text-on-surface mb-6">&ldquo;Semoga kalian berdua bahagia selamanya dan penuh petualangan indah. Gak sabar buat ngerayain bareng!&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-label-caps text-[10px]">LS</div>
                      <p className="font-label-caps text-[10px] uppercase text-on-surface">Laura &amp; Stephen</p>
                    </div>
                  </div>
                  <div className="min-w-[300px] bg-white p-8 rounded-lg shadow-sm border border-outline-variant/30 snap-start">
                    <p className="font-body-md italic text-on-surface mb-6">&ldquo;Seneng banget buat kalian! Bakal jadi malam paling cantik tahun ini.&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-label-caps text-[10px]">MK</div>
                      <p className="font-label-caps text-[10px] uppercase text-on-surface">Mark Kowalski</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-container p-12 rounded-lg text-on-primary-container space-y-8">
                <h3 className="font-headline-md text-on-primary-fixed">Kirim Kado</h3>
                <p className="font-body-md text-on-primary">Jika Anda ingin memberikan tanda kasih, kami telah menyediakan informasi kado digital dan alamat pengiriman di bawah ini.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface/5 border border-on-primary-fixed/20 p-6 rounded-sm space-y-4">
                    <span className="font-label-caps text-[10px] text-on-primary-fixed block uppercase text-surface-bright">Transfer Bank</span>
                    <div className="flex justify-between items-center">
                      <span className="font-headline-md text-on-primary-fixed">128-009-1221</span>
                      <span className="material-symbols-outlined cursor-pointer hover:text-secondary text-on-primary">content_copy</span>
                    </div>
                    <p className="font-label-caps text-[10px] text-on-primary">CITIBANK - MARCUS STERLING</p>
                  </div>
                  <div className="bg-surface/5 border border-on-primary-fixed/20 p-6 rounded-sm space-y-4">
                    <span className="font-label-caps text-[10px] text-on-primary-fixed block uppercase text-surface-bright">Alamat Pengiriman</span>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-body-md text-on-primary-fixed leading-tight">124 Serenity Lane, Beverly Hills, CA</span>
                      <span className="material-symbols-outlined cursor-pointer hover:text-secondary shrink-0 text-on-primary">content_copy</span>
                    </div>
                    <p className="font-label-caps text-[10px] text-on-primary">TUJUAN PENGIRIMAN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Couple's Smart Tools */}
        <section className="py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="relative rounded-lg border-8 border-inverse-surface shadow-2xl overflow-hidden bg-surface-container-high">
                <img className="w-full aspect-[16/10] object-cover" alt="Admin dashboard screenshot" src={ASSETS.premiumWeb.dashboard} />
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-12">
              <div className="space-y-4">
                <span className="font-label-caps text-label-caps text-secondary block">DASHBOARD</span>
                <h2 className="font-display-lg text-primary">Logistik Pintar untuk Pasangan Modern</h2>
                <p className="font-body-md text-on-surface">Kelola perayaan Anda dengan praktis dan presisi melalui portal khusus pasangan kami.</p>
              </div>
              <ul className="space-y-8">
                <li className="flex gap-6">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  <div>
                    <h4 className="font-label-caps text-label-caps text-primary uppercase mb-2">Pantau RSVP Secara Real-time</h4>
                    <p className="font-body-md text-on-surface">Lihat respon tamu, info diet, dan jumlah tamu secara instan saat mereka melakukan reservasi.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  <div>
                    <h4 className="font-label-caps text-label-caps text-primary uppercase mb-2">Kirim Undangan Sepuasnya</h4>
                    <p className="font-body-md text-on-surface">Kirim undangan sebanyak yang dibutuhkan via WhatsApp, Email, atau Media Sosial tanpa biaya tambahan.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                  <div>
                    <h4 className="font-label-caps text-label-caps text-primary uppercase mb-2">Pengingat Otomatis untuk VIP</h4>
                    <p className="font-body-md text-on-surface">Ingatkan tamu Anda dengan lembut melalui update jadwal otomatis dan hitung mundur acara.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-primary text-on-primary text-center">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto space-y-12">
            <h2 className="font-display-lg-mobile md:font-display-lg max-w-3xl mx-auto">
              Siap untuk merancang mahakarya Anda?
            </h2>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push("/register")}
                className="bg-secondary text-on-primary px-12 py-5 rounded-sm font-label-caps text-label-caps tracking-[0.2em] hover:bg-on-primary hover:text-primary transition-all w-full md:w-auto"
              >
                MULAI RANCANG
              </button>
              <button
                onClick={() => router.push("/register")}
                className="border border-on-primary/30 text-on-primary px-12 py-5 rounded-sm font-label-caps text-label-caps tracking-[0.2em] hover:bg-on-primary hover:text-primary transition-all w-full md:w-auto uppercase"
              >
                Lihat Demo
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
