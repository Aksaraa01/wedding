"use client"

import { useEffect, useRef, useState } from "react"
import { waLink } from "@/lib/contact"

function eventWaLink(title: string) {
  return waLink(`Halo Aksaraa Wedding, saya tertarik dengan undangan digital untuk ${title}. Mohon informasi paket dan tema yang tersedia.`)
}

type Slide = {
  img: string
  alt: string
  badge: string
  price: string
  title: string
  desc: string
  cta: string
  href: string
}

const SLIDES: Slide[] = [
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJvoRjTSRuh5h090FSyRvrO9L_LqrMBuw5KK3Hii4qRhokVU3sMCrT7Urbsyk2Ue9dchbwknKZvps3QlWP1sm8QnM0h4VQyCNhL-wwH2JMUgMYQ1ClfyCzgbN-0BN4Cq4MyJR2R2snnKlBIvZH0DbrLapfExvH3aFilj67kxW-6H52GFxtH1iYq_PpEph9b7OqQja8FoAtXE_mBtQPEI2hyxENUr5kwuY49F_J4zImu89ZO4D75n_k4KiZLD5RvARwkCeFBMwXQKmDlA",
    alt: "Cinematic luxury Indonesian wedding reception at dusk",
    badge: "Signature Series • Pernikahan",
    price: "Mulai Rp 199.000 / paket",
    title: "Pernikahan & Ngunduh Mantu",
    desc: "Kisah cinta sinematik dalam format digital, alunan musik lossless, amplop QRIS, dan sistem meja VIP presisi.",
    cta: "Mulai Buat",
    href: "https://wedding.aksaraa.com",
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDo8_f1wI3ZoAtJ9IDv8q-Wf5tBxhMMHr_KQ9imaRSQMNpnXD1FeThYO_eRK3eUJ2NgHAo0Hbb30YZ-fGySaJGoQDL4VVYKvKfjre2rc7IRkgBcij-ewztetgsq2jZ931UlhLrHm16Hhd_Mn2RDJbPu0Ak3xA8R4EU15H5h-5XLF72-Re5628cRJDkj0ZA2JwLLa5Wa45j5PCIwnp-BKXgN0HrAJ6ELtX2XSmGktZ8ulns7XNRq79lwFrHFs7U_lSICgvRGmvH1BCi5Iw",
    alt: "Wedding Anniversary & Silver Jubilee elegant romantic dinner",
    badge: "EXCLUSIVE • ANNIVERSARY",
    price: "Mulai Rp 199.000 / paket",
    title: "Anniversary & Perayaan Pernikahan",
    desc: "Rayakan perjalanan cinta bertahun-tahun dengan timeline kilas balik memori, galeri foto nostalgia beresolusi tinggi, dan undangan intim untuk keluarga terkasih.",
    cta: "Pilih Tema Anniversary",
    href: eventWaLink("Anniversary & Perayaan Pernikahan"),
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvUHjPfNndCXa8jNLFaUkQngI-4-RjeUKTBjugDeDcTdZgHJDKQcSgx8lobc5t1aIUg-DZDrmR_A0akpF_G6UV50WT9kCVfwafA_ii9-7qEC4SdieTultbUhAyegWT_DzUaE7UCpxj-bSCGCfwjOtvh4OtrNHWTMIbGlEaPMVKfYqlAJsuTdC-iXHWmclvY1jxVaOMSjHNza0-g3WvEg0SbCtnGDDDLK7Agq_0zxU",
    alt: "Elegant 17th birthday party celebration ballroom",
    badge: "Modern & Youthful • Sweet 17",
    price: "Mulai Rp 199.000 / paket",
    title: "Ulang Tahun & Sweet 17",
    desc: "Wish wall interaktif real-time, panduan dresscode palet visual, dan integrasi navigasi instan Google Maps.",
    cta: "Pilih Tema Birthday",
    href: eventWaLink("Ulang Tahun & Sweet 17"),
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD7AyJaUG-JP1cB0nOhdTV1Ehykx7XDS_OhlxUZBzzZ2eFiUZmaBC7HpgBRcwTgZi4X4T-eD539hGOc4kPQk2tnVk8W5NSj0T19OuVHfCN6ok59MHSjqYc5FDMv0xQO3AO6UuXBB1dhNfopZKWZq_MLYzoGF18yGItKzzQDLbAtD_iU2RZeaMeGqVJW41caHIbiR2TZIKUCcn1qSqnMf3gW52BL9z4wgMYPvBrlr2Y",
    alt: "Traditional elegant Indonesian Islamic family celebration",
    badge: "Khidmat & Berkah • Keluarga",
    price: "Mulai Rp 199.000 / paket",
    title: "Syukuran Khitan & Aqiqah",
    desc: "Ayat Al-Qur'an berseni kaligrafi luhur, untaian doa keluarga besar, dan amplop digital santun bebas potongan.",
    cta: "Pilih Tema Khitan",
    href: eventWaLink("Syukuran Khitan & Aqiqah"),
  },
  {
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA80-CC3uAHb9hvNBtJR9VZDwpPKNFLFYTYiYLX5l6ulS6bxOSZmA_QMf9NNgzDzbSMJKaI8wG9CaxsBwcjObPu5xbdNx2m1U0Jf_rU7jg-28fJQmxgvgXKb3qWxnBOP4fYkHfO7bEVy0SdG_jTLoo2bkbJdDn5Pp3VkPM3FXoRiI3SOLe83m45usp3bjXBQsYtRucpwR01ymuNugcMi5rDNOVOfKIf6ajaWcNFO8Q",
    alt: "Prestigious corporate gala dinner banquet hall",
    badge: "Enterprise • Formal Event",
    price: "Mulai Rp 199.000 / paket",
    title: "Corporate Gathering & Gala Dinner",
    desc: "Barcode scanner meja registrasi super cepat (<2 detik), pembagian seating chart multimeja, dan ekspor data CSV.",
    cta: "Solusi Corporate",
    href: eventWaLink("Corporate Gathering & Gala Dinner"),
  },
]

const DOT_POSITIONS = [0, 800, 1600, 2400, 3200]

export default function InvitationCarousel() {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 6000)
  }

  useEffect(() => {
    startAuto()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const el = sliderRef.current
    if (el) el.scrollTo({ left: active * 800, behavior: "smooth" })
  }, [active])

  const goTo = (i: number) => {
    setActive(i)
    startAuto()
  }

  const scrollBy = (dir: number) => {
    goTo((active + dir + SLIDES.length) % SLIDES.length)
  }

  return (
    <section className="relative z-10 w-full py-24 bg-[#02110C]/70 backdrop-blur-[2px] overflow-hidden scroll-mt-24" id="koleksi-acara">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C2D27]/80 border border-[#9B8F81]/30 text-[#EAC082] font-label-md text-label-md uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EAC082] animate-pulse" />
              <span>Koleksi &amp; Kategori Acara</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-[#D2E7DD] tracking-tight font-serif">Dirancang Sempurna untuk Setiap Momen.</h2>
            <p className="mt-2 font-body-lg text-body-lg text-[#D2C4B5] max-w-2xl">
              Satu platform untuk berbagai format perayaan istimewa. Nikmati pengalaman undangan digital interaktif bernuansa sinematik yang dirancang khusus untuk menghidupkan kembali esensi dari setiap babak kebahagiaan Anda
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              aria-label="Slide Sebelumnya"
              onClick={() => scrollBy(-1)}
              className="w-11 h-11 rounded-full bg-[#1C2D27]/80 hover:bg-[#263832] text-[#D2E7DD] flex items-center justify-center transition-colors border border-[#9B8F81]/30 shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              aria-label="Slide Berikutnya"
              onClick={() => scrollBy(1)}
              className="w-11 h-11 rounded-full bg-[#1C2D27]/80 hover:bg-[#263832] text-[#D2E7DD] flex items-center justify-center transition-colors border border-[#9B8F81]/30 shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full pl-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+3rem))] pr-6 relative z-10">
        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 scroll-smooth no-scrollbar"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          id="card-carousel-slider"
        >
          {SLIDES.map((s) => (
            <div
              key={s.title}
              className="shrink-0 w-[88vw] sm:w-[720px] lg:w-[860px] h-[500px] rounded-3xl overflow-hidden relative shadow-2xl group flex flex-col justify-end p-5 sm:p-12 transition-transform duration-300"
              style={{ scrollSnapAlign: "center" }}
            >
              <img
                alt={s.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={s.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02110C]/95 via-[#02110C]/50 to-black/20" />
              <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10 max-w-[58%]">
                <span className="inline-block px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#1C2D27]/80 backdrop-blur-md text-[#EAC082] text-[8px] sm:text-label-md font-semibold tracking-wide sm:tracking-wider uppercase border border-[#EAC082]/20 truncate">
                  {s.badge}
                </span>
              </div>
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10">
                <span className="inline-block px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#02110C]/80 backdrop-blur-md text-[#D2E7DD] text-[8px] sm:text-label-sm font-mono border border-[#9B8F81]/40 whitespace-nowrap">
                  {s.price}
                </span>
              </div>
              <div className="relative z-10 max-w-2xl space-y-3">
                <h3 className="font-headline-md sm:font-headline-lg text-headline-md sm:text-headline-lg text-white font-serif tracking-tight">{s.title}</h3>
                <p className="font-body-md sm:font-body-lg text-body-md sm:text-body-lg text-[#D2C4B5] leading-relaxed">{s.desc}</p>
                <div className="pt-4 flex flex-nowrap items-center gap-2 sm:gap-4">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[9px] sm:text-label-lg transition-all duration-300 shadow-lg hover:shadow-[#0071e3]/30 flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
                  >
                    <span>{s.cta}</span>
                    <span className="material-symbols-outlined text-[12px] sm:text-[16px]">arrow_forward</span>
                  </a>
                  <a
                    href={s.href === "https://wedding.aksaraa.com" ? s.href : "#"}
                    target={s.href === "https://wedding.aksaraa.com" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="px-3 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#1C2D27]/70 hover:bg-[#263832] text-[#D2E7DD] text-[9px] sm:text-label-lg backdrop-blur-md transition-all duration-300 shadow-sm flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"
                  >
                    <span>Lihat Contoh Undangan</span>
                    <span className="material-symbols-outlined text-[12px] sm:text-[16px] text-[#EAC082]">north_east</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-6 flex items-center justify-center gap-2.5 relative z-10">
        {DOT_POSITIONS.map((pos, i) => (
          <button
            key={pos}
            aria-label={`Pindah ke Slide ${i + 1}`}
            className="p-0 border-0 bg-transparent cursor-pointer"
            onClick={() => goTo(i)}
            type="button"
          >
            <span
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === 0 ? 32 : 10,
                height: 8,
                backgroundColor: i === 0 ? "#EAC082" : "#1C2D27",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
