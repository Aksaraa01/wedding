"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

// Local copies of the reference artwork (downloaded from the design HTML).
const IMG_HERO = "/media/qr-digital/hero.jpg"
const IMG_EPASS = "/media/qr-digital/epass.jpg"
const IMG_LAYAR = "/media/qr-digital/layar.jpg"
const IMG_DOA = "/media/qr-digital/doa.jpg"
const IMG_MOMEN = "/media/qr-digital/momen.jpg"
const GALLERY = [
  "/media/qr-digital/gallery-1.jpg",
  "/media/qr-digital/gallery-2.jpg",
  "/media/qr-digital/gallery-3.jpg",
]

const ADVANTAGES = [
  { icon: "tablet_mac", title: "Perangkat Profesional", text: "Kami menyediakan tablet scanner di lokasi, Anda tidak perlu repot menyiapkan perangkat." },
  { icon: "mail", title: "Undangan Personal", text: "Setiap tamu menerima QR unik, memastikan satu nama untuk satu akses eksklusif." },
  { icon: "grid_view", title: "Manajemen Meja", text: "Atur posisi duduk tamu dengan mudah, tidak ada lagi tamu yang bingung mencari meja." },
  { icon: "support_agent", title: "Pendampingan Tim", text: "Tim teknis kami standby di lokasi untuk memastikan sistem berjalan sempurna." },
  { icon: "smartphone", title: "Perangkat Sendiri", text: "Dapat juga gunakan perangkat sendiri (HP usher), tidak perlu install aplikasi dan lebih hemat." },
]

export default function QrDigitalBukuTamuPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opts = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-up")
          observer.unobserve(entry.target)
        }
      })
    }, opts)
    const els = mainRef.current?.querySelectorAll(".bento-card, .fade-in-up")
    els?.forEach((el) => {
      if (!el.classList.contains("fade-in-up")) {
        ;(el as HTMLElement).style.opacity = "0"
        observer.observe(el)
      } else {
        observer.observe(el)
      }
    })
    return () => observer.disconnect()
  }, [])

  const scrollGallery = (dir: number) => {
    galleryRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" })
  }

  return (
    <>
      <PageTheme mode="dark" />
      <style>{`
        body { background-color: #1c1c16; color: #fcf9f4; -webkit-font-smoothing: antialiased; }
        .canvas { padding-bottom: 120px; }
        .editorial-line { height: 1px; background: linear-gradient(to right, #8D4D39, transparent); }
        .hover-lift { transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); }
        .hover-lift:hover { transform: translateY(-8px); }
        .bento-card {
          background: rgba(252, 249, 244, 0.03);
          border: 1px solid rgba(252, 249, 244, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.4s ease;
        }
        .bento-card:hover {
          background: rgba(252, 249, 244, 0.05);
          box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.4);
          border-bottom: 2px solid #8D4D39;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .editorial-image-frame {
          border-radius: 0.25rem;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(252, 249, 244, 0.1);
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .text-gold { color: #ecbf83; }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-[#1c1c16]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-margin-mobile md:px-margin-desktop py-6 w-full transition-all duration-300">
        <button onClick={() => router.back()}>
          <span className="material-symbols-outlined text-[#fcf9f4]">arrow_back</span>
        </button>
        <div className="font-headline-md text-[22px] text-[#fcf9f4] tracking-tight">AKSARAA</div>
        <div className="w-6" />
      </header>

      <main className="canvas pt-32 md:pt-40" ref={mainRef}>
        {/* HERO SECTION */}
        <section className="px-margin-mobile md:px-margin-desktop mb-32 md:mb-48 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto mt-10 md:mt-16 gap-16">
            <div className="w-full lg:w-1/2 text-left fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h1 className="font-[family-name:var(--font-cormorant)] font-semibold text-[40px] md:text-[56px] lg:text-[64px] leading-[1.1] text-[#fcf9f4] mb-6 tracking-[-0.02em]">
                Kehadiran Tamu Jadi <span className="italic text-secondary" style={{ color: "#8d4d39" }}>Berkesan</span>
              </h1>
              <p className="font-body-lg text-body-lg text-[#e5e2dd] max-w-lg mb-8 opacity-90">
                Solusi resepsi digital premium untuk momen tak terlupakan Anda. Menghadirkan kesan modern sejak langkah pertama.
              </p>
              <a
                href="#features"
                className="inline-flex items-center gap-3 px-8 py-4 bg-secondary text-[#fcf9f4] font-label-caps text-label-caps tracking-widest hover:bg-secondary/90 transition-colors rounded-sm"
              >
                PELAJARI LEBIH LANJUT
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </a>
            </div>
            <div className="w-full lg:w-1/2 relative fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="relative editorial-image-frame overflow-hidden w-full mx-auto lg:ml-auto rounded-xl">
                <img
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                  alt="Digital reception hero"
                  src={IMG_HERO}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHT GRID */}
        <section className="px-margin-mobile md:px-margin-desktop mb-40 md:mb-[160px] max-w-7xl mx-auto" id="features">
          <div className="mb-20">
            <h2 className="font-[family-name:var(--font-cormorant)] font-semibold text-[32px] md:text-[40px] text-[#fcf9f4] mb-4">
              Semua <span className="italic text-secondary">Tersedia</span>
            </h2>
            <div className="w-16 h-px bg-secondary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* E-Pass */}
            <div className="bento-card p-10 flex flex-col justify-between rounded-xl hover-lift fade-in-up lg:col-span-2 row-span-2 group">
              <div>
                <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center rounded-full mb-8 text-gold">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-2xl text-[#fcf9f4] mb-4 group-hover:text-gold transition-colors">
                  <span className="italic">E-Pass</span> Access
                </h3>
                <p className="font-body-lg text-body-lg text-[#e5e2dd] opacity-80 mb-8 max-w-md">
                  Tamu menerima kode akses personal sebelum hari H. &quot;Verified Access&quot; memastikan identifikasi instan tanpa kerumitan pencarian nama manual.
                </p>
                <ul className="space-y-4 font-body-md text-[#fcf9f4] mb-12">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gold text-xl">check</span> Personalized QR Code
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gold text-xl">check</span> Instant Identification
                  </li>
                </ul>
              </div>
              <div className="relative editorial-image-frame overflow-hidden rounded-lg mt-auto rounded-xl">
                <img
                  className="w-full h-auto object-contain object-top hover:scale-[1.03] transition-transform duration-700"
                  alt="E-Pass Access"
                  src={IMG_EPASS}
                />
              </div>
            </div>
            {/* Layar Sapa */}
            <div className="bento-card p-8 rounded-xl hover-lift fade-in-up flex flex-col justify-between" style={{ animationDelay: "0.1s" }}>
              <div>
                <div className="w-10 h-10 bg-secondary/10 flex items-center justify-center rounded-full mb-6 text-gold">
                  <span className="material-symbols-outlined">waving_hand</span>
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-xl text-[#fcf9f4] mb-3">
                  <span className="italic">Layar Sapa</span> Personal
                </h3>
                <p className="font-body-md text-[#e5e2dd] opacity-80 mb-6">
                  Pengalaman interaktif dimana tamu disambut dengan nama mereka dan dapat mengabadikan momen kehadiran secara langsung.
                </p>
              </div>
              <div className="relative editorial-image-frame overflow-hidden rounded-lg mt-4 h-48 rounded-xl">
                <img
                  className="w-full h-full object-cover object-top hover:scale-[1.05] transition-transform duration-700"
                  alt="Layar Sapa Experience"
                  src={IMG_LAYAR}
                />
              </div>
            </div>
            {/* Doa & Foto */}
            <div className="bento-card p-8 rounded-xl hover-lift fade-in-up flex flex-col justify-between" style={{ animationDelay: "0.2s" }}>
              <div>
                <div className="w-10 h-10 bg-secondary/10 flex items-center justify-center rounded-full mb-6 text-gold">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-xl text-[#fcf9f4] mb-3">
                  Doa &amp; Foto Kenangan <span className="italic text-secondary">Tamu</span>
                </h3>
                <p className="font-body-md text-[#e5e2dd] opacity-80 mb-6">
                  Berikan ucapan restu terbaik, Tamu juga bisa mengambil foto dipernikahanmu dari hp mereka dan terkumpul menjadi satu album.
                </p>
              </div>
              <div className="relative editorial-image-frame overflow-hidden rounded-lg mt-4 h-48 rounded-xl">
                <img
                  className="w-full h-auto object-cover object-top hover:scale-[1.05] transition-transform duration-700"
                  alt="Virtual Wish Wall"
                  src={IMG_DOA}
                />
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEY TIMELINE */}
        <section className="bg-[#141410] py-32 md:py-[160px] mb-40 md:mb-[160px] relative border-y border-white/5" id="experience">
          <div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
            <div className="text-center mb-24 fade-in-up">
              <h2 className="font-[family-name:var(--font-cormorant)] font-semibold text-[32px] md:text-[40px] text-[#fcf9f4] mb-6">
                Alur <span className="italic text-secondary">Pengalaman</span>
              </h2>
              <p className="font-body-lg text-body-lg text-[#e5e2dd] max-w-2xl mx-auto opacity-80">
                Dari penerimaan undangan hingga penyambutan personal di lokasi acara.
              </p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2 z-0" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
                {[
                  { n: "1", title: "Undangan Personal", text: "Tamu menerima tautan eksklusif berisi QR Code unik yang menjadi akses masuk." },
                  { n: "2", title: "Pindai & Verifikasi", text: "Check-in cepat di meja resepsi digital menggunakan tablet scanner profesional." },
                  { n: "3", title: "Sapaan Hangat", text: "Layar khusus menyapa tamu dengan nama mereka dan mengarahkan ke nomor meja." },
                ].map((step, i) => (
                  <div key={step.n} className="flex flex-col items-center text-center fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className="w-16 h-16 rounded-full bg-[#1c1c16] border border-secondary flex items-center justify-center text-gold font-[family-name:var(--font-cormorant)] text-2xl mb-8 relative">
                      {step.n}
                      {i === 0 && <div className="absolute inset-0 rounded-full border border-secondary animate-ping opacity-20" />}
                    </div>
                    <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-2xl text-[#fcf9f4] mb-4">{step.title}</h3>
                    <p className="font-body-md text-[#e5e2dd] opacity-80">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* THE CHECK-IN MOMENT */}
        <section className="px-margin-mobile md:px-margin-desktop mb-40 md:mb-[160px] max-w-7xl mx-auto">
          <div className="flex flex-col-reverse md:flex-row gap-16 lg:gap-24 items-center">
            <div className="w-full md:w-1/2 fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="font-[family-name:var(--font-cormorant)] font-semibold text-[32px] md:text-[40px] text-[#fcf9f4] mb-6">
                Momen <span className="italic text-secondary">Check-In</span> Modern
              </h2>
              <p className="font-body-lg text-body-lg text-[#e5e2dd] max-w-md mb-8 opacity-80">
                Alur penyambutan yang mulus: Scan, Verifikasi, Sambut. Mengubah antrean menjadi pengalaman berkesan. Tim teknis kami standby di lokasi untuk memastikan sistem berjalan sempurna.
              </p>
              <div className="editorial-line w-24" />
            </div>
            <div className="w-full md:w-1/2 fade-in-up">
              <div className="relative editorial-image-frame overflow-hidden rounded-xl">
                <img
                  className="w-full aspect-video md:aspect-square lg:aspect-video object-cover hover:scale-[1.03] transition-transform duration-700"
                  alt="Guests at digital reception desk"
                  src={IMG_MOMEN}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ADVANTAGES GRID */}
        <section className="px-margin-mobile md:px-margin-desktop mb-40 md:mb-[160px] max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-[family-name:var(--font-cormorant)] font-semibold text-[32px] md:text-[40px] text-[#fcf9f4] mb-4">
              Kemudahan di <span className="italic text-gold">Setiap Detail</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-3">
            {ADVANTAGES.map((a, i) => (
              <div key={a.title} className="border border-white/5 bg-[#1c1c16] p-8 flex flex-col items-start fade-in-up rounded-sm" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="mb-6 text-secondary">
                  <span className="material-symbols-outlined text-3xl">{a.icon}</span>
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-xl text-[#fcf9f4] mb-3">{a.title}</h3>
                <p className="font-body-sm text-[#e5e2dd] opacity-70">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EVENT GALLERY */}
        <section className="pl-margin-mobile md:pl-margin-desktop mb-40 md:mb-[160px] max-w-[1920px] mx-auto overflow-hidden relative group" id="gallery">
          <div className="mb-16 md:pr-margin-desktop pr-margin-mobile flex justify-between items-end fade-in-up">
            <h2 className="font-[family-name:var(--font-cormorant)] font-semibold text-[32px] md:text-[40px] text-[#fcf9f4]">
              <span className="italic text-secondary">Galeri</span> Momen
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollGallery(-1)}
                className="hidden md:flex w-10 h-10 rounded-full border border-[#e5e2dd]/30 items-center justify-center text-[#fcf9f4] hover:bg-secondary/20 hover:text-gold transition-all"
                aria-label="Sebelumnya"
              >
                <span className="material-symbols-outlined">arrow_left</span>
              </button>
              <button
                onClick={() => scrollGallery(1)}
                className="hidden md:flex w-10 h-10 rounded-full border border-[#e5e2dd]/30 items-center justify-center text-[#fcf9f4] hover:bg-secondary/20 hover:text-gold transition-all"
                aria-label="Berikutnya"
              >
                <span className="material-symbols-outlined">arrow_right</span>
              </button>
              <span className="font-label-caps text-label-caps text-gold tracking-widest block md:hidden">GESER →</span>
            </div>
          </div>
          <div
            ref={galleryRef}
            className="flex overflow-x-auto gap-6 md:gap-8 pb-12 snap-x snap-mandatory hide-scrollbar pr-margin-mobile md:pr-margin-desktop cursor-grab"
          >
            {GALLERY.map((src, i) => (
              <div key={i} className="flex-none w-[85%] md:w-[60%] lg:w-[45%] snap-center editorial-image-frame overflow-hidden fade-in-up hover-lift rounded-xl" style={{ animationDelay: `${i * 0.1}s` }}>
                <img
                  className="w-full h-48 md:h-[250px] object-cover"
                  alt="Event Gallery"
                  src={src}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Structured Footer */}
      <footer className="bg-[#141410] pt-20 pb-10 px-margin-mobile md:px-margin-desktop border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <h4 className="font-[family-name:var(--font-cormorant)] font-semibold text-2xl text-[#fcf9f4] mb-6">AKSARAA</h4>
            <p className="font-body-md text-[#e5e2dd] opacity-80 max-w-sm">
              Solusi resepsi digital premium untuk momen tak terlupakan Anda. Menghadirkan kesan modern sejak langkah pertama.
            </p>
          </div>
          <div>
            <h4 className="font-label-caps font-semibold text-gold tracking-widest mb-6">HUBUNGI KAMI</h4>
            <ul className="space-y-4 font-body-md text-[#e5e2dd] opacity-80">
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-sm">mail</span> askaraa.mini@gmail.com</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-sm">phone_iphone</span> +62 812 2445 9435</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-label-caps text-[#e5e2dd]/50">© 2024 AKSARA DIGITAL RECEPTION. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#e5e2dd] hover:text-[#fcf9f4] hover:bg-white/10 transition-colors" href="#">
              <span className="material-symbols-outlined text-sm">public</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}