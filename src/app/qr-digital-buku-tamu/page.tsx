"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { ASSETS } from "@/lib/assets"

export default function QrDigitalBukuTamuPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const els = mainRef.current?.querySelectorAll(".bento-card, .group")
    els?.forEach((el) => {
      ;(el as HTMLElement).style.opacity = "0"
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 50) {
          headerRef.current.classList.add("shadow-sm")
        } else {
          headerRef.current.classList.remove("shadow-sm")
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .editorial-line { height: 1px; background: linear-gradient(to right, #8D4D39, transparent); }
        .hover-lift { transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); }
        .hover-lift:hover { transform: translateY(-4px); }
        .bento-card {
          background: #ffffff;
          border: 0.5px solid #d0c4be;
          transition: all 0.3s ease;
        }
        .bento-card:hover {
          box-shadow: 0px 10px 40px rgba(26, 24, 23, 0.05);
          border-bottom: 2px solid #8D4D39;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
      `}</style>

      <header
        ref={headerRef}
        className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b-[0.5px] border-outline-variant flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 transition-shadow"
      >
        <button onClick={() => router.back()} className="flex items-center">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div className="font-headline-md text-[24px] md:text-headline-md tracking-tight text-primary">
          AKSARAA
        </div>
        <div className="flex items-center w-6" />
      </header>

      <main className="pt-28" style={{ paddingBottom: "120px" }} ref={mainRef}>
        {/* Hero */}
        <section className="px-margin-mobile md:px-margin-desktop mb-24 md:mb-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1
              className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8"
              style={{ animationDelay: "0.2s" }}
            >
              Bebas Antrean, Sambut Tamu dengan Anggun &amp; Presisi.
            </h1>
            <div
              className="w-full relative overflow-hidden rounded-sm shadow-2xl"
              style={{ animationDelay: "0.3s" }}
            >
              <img
                className="w-full aspect-[16/9] object-cover hover:scale-[1.02] transition-transform duration-700"
                alt="Luxurious wedding reception with digital check-in station"
                src={ASSETS.qrDigital.hero}
              />
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="px-margin-mobile md:px-margin-desktop mb-32 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="sticky top-32">
              <h2 className="font-headline-md text-headline-md text-primary mb-4 italic">
                Alur Absensi Modern
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                Mengubah kerumitan registrasi menjadi momen penyambutan yang hangat dan instan.
              </p>
              <div className="editorial-line mt-8 w-24" />
            </div>
            <div className="space-y-16">
              <div className="group flex gap-8" style={{ opacity: 0 }}>
                <div className="flex-shrink-0 font-display-lg text-display-lg text-secondary opacity-20 group-hover:opacity-100 transition-opacity">
                  01
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-primary mb-2">Terima QR Pass</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Setiap tamu menerima kode unik personal melalui WhatsApp atau undangan web digital sebelum hari H.
                  </p>
                </div>
              </div>
              <div className="group flex gap-8 border-t border-outline-variant pt-12" style={{ opacity: 0 }}>
                <div className="flex-shrink-0 font-display-lg text-display-lg text-secondary opacity-20 group-hover:opacity-100 transition-opacity">
                  02
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-primary mb-2">Scan &lt; 3 Detik</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Cukup tunjukkan ponsel. Resepsionis melakukan pemindaian kilat melalui tablet yang elegan.
                  </p>
                </div>
              </div>
              <div className="group flex gap-8 border-t border-outline-variant pt-12" style={{ opacity: 0 }}>
                <div className="flex-shrink-0 font-display-lg text-display-lg text-secondary opacity-20 group-hover:opacity-100 transition-opacity">
                  03
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-primary mb-2">Info Meja &amp; Souvenir</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Nomor meja dan status pengambilan souvenir muncul otomatis untuk memandu tamu dengan presisi.
                  </p>
                </div>
              </div>
              <div className="group flex gap-8 border-t border-outline-variant pt-12" style={{ opacity: 0 }}>
                <div className="flex-shrink-0 font-display-lg text-display-lg text-secondary opacity-20 group-hover:opacity-100 transition-opacity">
                  04
                </div>
                <div>
                  <h3 className="font-headline-md text-2xl text-primary mb-2">Live Attendance Sync</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Data kehadiran langsung tercatat di dashboard pusat untuk pemantauan katering dan logistik secara real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simulator */}
        <section className="bg-surface-container-low py-24 md:py-32 mb-32 overflow-hidden">
          <div className="px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="w-full md:w-1/2">
                <div className="relative group" style={{ opacity: 0 }}>
                  <div className="absolute -inset-4 bg-secondary/5 rounded-xl blur-2xl group-hover:bg-secondary/10 transition-colors" />
                  <img
                    className="relative rounded-xl shadow-xl w-full hover:scale-[1.01] transition-transform duration-500"
                    alt="Tablet displaying Aksara Wedding Dashboard"
                    src={ASSETS.qrDigital.tablet}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="font-label-caps text-label-caps uppercase text-secondary mb-4 block">
                  Antarmuka Resepsionis
                </span>
                <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 italic leading-tight">
                  Presisi dalam Tiap Ketukan.
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
                  Dashboard &apos;Aksara Reception&apos; dirancang untuk kenyamanan kru di lapangan. Visual jernih, navigasi minimalis, dan verifikasi data tanpa celah.
                </p>
                <div className="flex items-center gap-4 text-primary font-semibold group cursor-pointer" style={{ opacity: 0 }}>
                  <span className="font-label-caps uppercase tracking-widest border-b border-primary pb-1 group-hover:text-secondary group-hover:border-secondary transition-colors">
                    Lihat Demo Interaktif
                  </span>
                  <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advantages */}
        <section className="px-margin-mobile md:px-margin-desktop mb-32">
          <div className="mb-16 text-center">
            <h2 className="font-headline-md text-headline-md text-primary mb-4">Keunggulan Aksara QR Pass</h2>
            <div className="w-12 h-0.5 bg-secondary mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bento-card p-10 flex flex-col items-start hover-lift" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded-full mb-6">
                <span className="material-symbols-outlined text-secondary">speed</span>
              </div>
              <h3 className="font-headline-md text-xl mb-4">Anti-Antrean Resepsi</h3>
              <p className="font-body-md text-on-surface-variant">Memproses hingga 20 tamu per menit. Tidak ada lagi penumpukan di pintu masuk utama.</p>
            </div>
            <div className="bento-card p-10 flex flex-col items-start hover-lift" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded-full mb-6">
                <span className="material-symbols-outlined text-secondary">grid_view</span>
              </div>
              <h3 className="font-headline-md text-xl mb-4">Pemetaan Meja Otomatis</h3>
              <p className="font-body-md text-on-surface-variant">Tamu mendapatkan informasi posisi duduk instan saat check-in, mengurangi kebingungan usher.</p>
            </div>
            <div className="bento-card p-10 flex flex-col items-start hover-lift" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded-full mb-6">
                <span className="material-symbols-outlined text-secondary">redeem</span>
              </div>
              <h3 className="font-headline-md text-xl mb-4">Manajemen Souvenir</h3>
              <p className="font-body-md text-on-surface-variant">Validasi digital untuk setiap pengambilan souvenir, mencegah duplikasi dan kekurangan stok.</p>
            </div>
            <div className="bento-card p-10 flex flex-col items-start hover-lift" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded-full mb-6">
                <span className="material-symbols-outlined text-secondary">analytics</span>
              </div>
              <h3 className="font-headline-md text-xl mb-4">Dashboard Real-time</h3>
              <p className="font-body-md text-on-surface-variant">Pantau grafik kedatangan dan profil tamu VIP langsung dari gawai Anda di mana saja.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 bg-inverse-surface py-4 px-margin-mobile md:px-margin-desktop flex justify-center items-center shadow-2xl">
        <button
          onClick={() => router.push("/register")}
          className="w-full max-w-4xl flex items-center justify-center gap-3 bg-secondary text-on-secondary font-label-caps text-label-caps uppercase py-4 rounded-sm tracking-widest hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
          Integrasikan QR Buku Tamu ke Acara Anda
        </button>
      </footer>
    </>
  )
}
