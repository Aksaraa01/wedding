"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import SeoFaq from "@/components/SeoFaq"
import { ASSETS } from "@/lib/assets"

const heroImages = [
  ASSETS.guestGallery.heroSide1,
  ASSETS.guestGallery.heroSide2,
  ASSETS.guestGallery.heroSide3,
  ASSETS.guestGallery.heroSide4,
]

const galleryCards = [
  {
    img: ASSETS.guestGallery.card1,
    uploader: "Rian & Team",
    time: "12:45 • Meja 08",
    likes: 24,
    filled: true,
    tall: true,
  },
  {
    img: ASSETS.guestGallery.card2,
    uploader: "Sarah J.",
    time: "13:12 • VIP A",
    likes: 12,
    filled: false,
    tall: false,
  },
  {
    img: ASSETS.guestGallery.card3,
    uploader: "Wedding Live",
    time: "11:05 • Ceremony",
    likes: 148,
    filled: true,
    tall: false,
  },
  {
    img: ASSETS.guestGallery.card4,
    uploader: "Guest044",
    time: "14:00 • Dancefloor",
    likes: 32,
    filled: false,
    tall: true,
  },
]

export default function GaleriKenanganTamuPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)
  const [guestName, setGuestName] = useState("")
  const [guestMessage, setGuestMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [livePhotos, setLivePhotos] = useState<{ id: number; img: string; uploader: string; time: string; message: string }[]>([])
  const liveIdRef = useRef(0)

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

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          grid-auto-rows: 10px;
          gap: 24px;
        }
        .masonry-item { grid-row-end: span 30; }
        .masonry-item.tall { grid-row-end: span 45; }
        .masonry-item.short { grid-row-end: span 25; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--color-surface); }
        ::-webkit-scrollbar-thumb { background: var(--color-primary); }
      `}</style>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full h-[80px] z-50 bg-surface/85 backdrop-blur-xl border-b border-primary flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto left-0 right-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/hero")}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="font-headline-md text-[24px] md:text-headline-md tracking-tight text-primary">AKSARAA</div>
        </div>
      </header>

      <main className="pt-[80px]" ref={mainRef}>
        {/* Hero */}
        <section className="min-h-[90vh] flex flex-col md:flex-row items-stretch border-b border-primary">
          <div className="w-full md:w-1/2 p-margin-mobile md:p-margin-desktop flex flex-col justify-center items-start space-y-8 bg-surface">
            <span className="inline-block border border-primary px-4 py-1 font-label-sm text-label-sm uppercase tracking-[0.2em]">
              Modul Galeri &amp; Candid Photo
            </span>
            <h1 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.02em] text-[44px] md:text-[72px] leading-[1.05] text-primary max-w-xl">
              Galeri Foto Tamu <span className="italic text-secondary">Disposable Camera</span> Pernikahan Anda.
            </h1>
            <p className="font-body-lg text-body-lg text-secondary max-w-lg">
              Tamu pindai QR dan langsung mengunggah foto yang tampil live, arsip kenangan candid ala disposable camera, tanpa aplikasi tambahan.
            </p>
            <button
              onClick={() => router.push("/customize?tab=galeri")}
              className="bg-primary text-on-primary px-10 py-5 font-label-sm text-label-sm uppercase tracking-[0.3em] hover:scale-[0.98] transition-transform flex items-center gap-3"
            >
              Aktifkan Galeri Tamu
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <div className="w-full md:w-1/2 relative bg-primary-container overflow-hidden min-h-[500px]">
            <div className="relative h-full flex items-center justify-center p-8">
              <div className="w-64 h-[500px] bg-surface-container border-[12px] border-primary z-10 shadow-2xl flex flex-col overflow-hidden relative">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 border border-primary mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl">qr_code_2</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-cormorant)] font-semibold text-[28px] text-primary">Pindai QR Meja</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold">Unggah Foto Momen Anda</p>
                  <div className="pt-8 grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-outline-variant" />
                    <div className="aspect-square bg-outline-variant" />
                    <div className="aspect-square bg-outline-variant" />
                    <div className="aspect-square bg-outline-variant" />
                  </div>
                </div>
                <div className="mt-auto bg-primary text-on-primary p-4 text-center font-label-sm text-[10px] uppercase tracking-widest">
                  Simulasi Live Gallery
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-[80%] flex gap-4 opacity-40 select-none pointer-events-none pr-8">
                <div className="flex-1 space-y-4 pt-12">
                  <div className="bg-surface-dim aspect-[3/4] w-full" style={{ backgroundImage: `url(${heroImages[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div className="bg-surface-dim aspect-square w-full" style={{ backgroundImage: `url(${heroImages[1]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="bg-surface-dim aspect-square w-full" style={{ backgroundImage: `url(${heroImages[2]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div className="bg-surface-dim aspect-[3/4] w-full" style={{ backgroundImage: `url(${heroImages[3]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="border-b border-primary grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary">
          <div className="p-8 flex flex-col items-center text-center space-y-3 hover:bg-surface-container transition-colors group reveal-item">
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">qr_code_scanner</span>
            <h4 className="font-label-sm text-label-sm uppercase tracking-widest font-bold">Scan QR Meja</h4>
            <p className="text-secondary text-sm">Akses instan tanpa instalasi aplikasi (Zero App Strategy).</p>
          </div>
          <div className="p-8 flex flex-col items-center text-center space-y-3 hover:bg-surface-container transition-colors group reveal-item">
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">high_quality</span>
            <h4 className="font-label-sm text-label-sm uppercase tracking-widest font-bold">Original HD</h4>
            <p className="text-secondary text-sm">Penyimpanan tanpa kompresi untuk kualitas cetak maksimal.</p>
          </div>
          <div className="p-8 flex flex-col items-center text-center space-y-3 hover:bg-surface-container transition-colors group reveal-item">
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">folder_zip</span>
            <h4 className="font-label-sm text-label-sm uppercase tracking-widest font-bold">Akses Kenangan</h4>
            <p className="text-secondary text-sm">Lihat ribuan kenangan hanya dengan satu klik</p>
          </div>
        </section>

        {/* Sandbox Upload */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-8 reveal-item">
              <h2 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.01em] text-[36px] md:text-[48px] text-primary">
                Rasakan <span className="italic text-secondary">Kemudahannya</span> Sekarang.
              </h2>
              <p className="font-body-lg text-body-lg text-secondary">
                Sandbox interaktif kami memungkinkan Anda mencoba proses unggah foto seolah Anda adalah tamu di hari pernikahan Anda.
              </p>
              <ul className="space-y-4">
                {["Unggah instan ke Live Wall", "Tambahkan pesan pribadi", "Tanpa login, Tanpa hambatan"].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-primary font-bold uppercase text-xs tracking-widest">
                    <span className="material-symbols-outlined text-lg">check_circle</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7 bg-surface p-1 border border-primary reveal-item">
              <div className="border border-primary p-12 space-y-10">
                <div className="space-y-6">
                  <div className="relative group">
                    <label className="absolute -top-3 left-0 bg-surface px-2 font-label-sm text-label-sm text-primary uppercase tracking-widest">Nama Lengkap</label>
                    <input className="w-full border-0 border-b border-outline bg-transparent py-4 focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-colors" placeholder="Masukkan nama Anda..." type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <label className="absolute -top-3 left-0 bg-surface px-2 font-label-sm text-label-sm text-primary uppercase tracking-widest">Pesan untuk Pengantin</label>
                    <input className="w-full border-0 border-b border-outline bg-transparent py-4 focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-colors" placeholder="Tuliskan ucapan Anda..." type="text" value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} />
                  </div>
                  <div className="border-2 border-dashed border-outline-variant p-12 text-center group hover:border-primary transition-colors cursor-pointer relative overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    <div className="space-y-4">
                      <span className="material-symbols-outlined text-5xl text-outline-variant group-hover:text-primary transition-colors">add_photo_alternate</span>
                      <p className="font-label-sm text-label-sm uppercase tracking-widest">
                        {selectedFile ? `Terpilih: ${selectedFile.name}` : "Pilih Foto dari Galeri Anda"}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!selectedFile) return
                    const img = URL.createObjectURL(selectedFile)
                    setLivePhotos((prev) => [
                      { id: liveIdRef.current++, img, uploader: guestName.trim() || "Kamu", time: "Baru saja", message: guestMessage.trim() },
                      ...prev,
                    ])
                    setSelectedFile(null)
                  }}
                  className={`w-full py-6 font-label-sm text-label-sm uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 ${
                    selectedFile ? "bg-primary text-on-primary hover:bg-on-surface-variant" : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                  }`}
                >
                  Unggah Foto ke Galeri Live <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="bg-surface-container py-24 px-margin-mobile md:px-margin-desktop border-y border-primary">
          <div className="max-w-container-max mx-auto space-y-16">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 reveal-item">
              <div className="space-y-4">
                <h2 className="font-[family-name:var(--font-cormorant)] font-semibold tracking-[-0.01em] text-[36px] md:text-[48px] text-primary">
                  Arsip <span className="italic text-secondary">Kenangan Live</span>
                </h2>
                <p className="text-secondary uppercase tracking-[0.2em] text-xs font-bold">Aksara Wedding: Rian &amp; Amira - 12.10.2024</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button className="border border-primary bg-primary text-on-primary px-6 py-2 font-label-sm text-[10px] uppercase tracking-widest">Semua Foto</button>
                <button className="border border-primary text-primary px-6 py-2 font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">📌 Pilihan Pengantin</button>
                <button className="border border-primary text-primary px-6 py-2 font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">Candid Resepsi</button>
              </div>
            </div>
            <div className="masonry-grid">
              {livePhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`masonry-item ${i % 2 === 0 ? "tall" : "short"} bg-surface border border-primary group flex flex-col overflow-hidden reveal-item`}
                >
                  <div className="flex-grow relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                      alt="Uploaded live photo"
                      src={photo.img}
                    />
                    <div className="absolute top-4 left-4 bg-primary text-on-primary px-2 py-0.5 font-label-sm text-[9px] uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </div>
                  </div>
                  <div className="p-6 space-y-3 bg-surface">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-widest">Unggahan: {photo.uploader}</p>
                        <p className="text-[10px] text-secondary uppercase tracking-tighter">{photo.time}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        <span className="text-xs font-bold">0</span>
                      </div>
                    </div>
                    {photo.message && (
                      <p className="font-body-md text-sm italic text-secondary leading-relaxed">&ldquo;{photo.message}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
              {galleryCards.map((card, i) => (
                <div
                  key={i}
                  className={`masonry-item ${card.tall ? "tall" : "short"} bg-surface border border-primary group flex flex-col overflow-hidden reveal-item`}
                >
                  <div className="flex-grow relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      alt={`Wedding gallery photo ${i + 1}`}
                      src={card.img}
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-10 h-10 bg-surface text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-3 bg-surface">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-widest">Unggahan: {card.uploader}</p>
                        <p className="text-[10px] text-secondary uppercase tracking-tighter">{card.time}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm" style={card.filled ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                        <span className="text-xs font-bold">{card.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SeoFaq
          heading="Pertanyaan tentang Galeri Foto Tamu"
          items={[
            {
              q: "Apa itu galeri foto tamu ala disposable camera?",
              a: "Konsep seperti kamera disposable di setiap meja: tamu memotret dari sudut pandang mereka dan foto langsung tampil di galeri live, candid, spontan, dan penuh kejutan.",
            },
            {
              q: "Bagaimana tamu mengunggah foto?",
              a: "Tamu memindai QR di meja atau undangan, mengambil atau memilih foto dari HP, lalu mengunggah, foto tampil di galeri dalam hitungan detik.",
            },
            {
              q: "Apakah tamu perlu menginstal aplikasi?",
              a: "Tidak. Seluruh proses berjalan di browser HP: pindai, jepret, unggah. Semudah mengisi RSVP.",
            },
            {
              q: "Berapa banyak foto yang bisa diunggah?",
              a: "Kuota foto per tamu mengikuti paket yang dipilih mempelai dan bisa dilihat langsung di halaman galeri.",
            },
          ]}
        />
      </main>
    </>
  )
}
