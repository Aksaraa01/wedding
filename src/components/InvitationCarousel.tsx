"use client"

import { useEffect, useRef, useState } from "react"
import { waLink } from "@/lib/contact"
import { siteOrigin } from "@/lib/site"

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
    href: siteOrigin(),
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
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = (card?.offsetWidth || 800) + 24
    el.scrollTo({ left: active * step, behavior: "smooth" })
  }, [active])

  const goTo = (i: number) => {
    setActive(i)
    startAuto()
  }

  const scrollBy = (dir: number) => {
    goTo((active + dir + SLIDES.length) % SLIDES.length)
  }

  return (
    <section className="relative z-10 w-full overflow-hidden border-y border-[#F0EAE0] bg-[#FBF8F2] py-14 scroll-mt-24 md:py-24" id="koleksi-acara">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:mb-12 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E7DECD] bg-white px-3 py-1 font-label-md text-label-md uppercase tracking-widest text-[#8D4D39]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
              <span>Koleksi &amp; Kategori Acara</span>
            </div>
            <h2 className="font-headline-lg text-[26px] leading-[1.15] tracking-tight text-[#1A1817] sm:text-headline-lg">
              Dirancang sempurna untuk setiap momen.
            </h2>
            <p className="mt-2 max-w-xl font-body-md text-[13px] leading-relaxed text-[#6E6A63] sm:text-body-lg">
              Satu platform untuk berbagai format perayaan. Setiap tema dirancang sinematik,
              siap dipakai, dan tetap personal untuk hari Anda.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              aria-label="Slide Sebelumnya"
              onClick={() => scrollBy(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4DCCD] bg-white text-[#1A1817] shadow-sm transition-colors hover:border-[#1A1817]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              aria-label="Slide Berikutnya"
              onClick={() => scrollBy(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4DCCD] bg-white text-[#1A1817] shadow-sm transition-colors hover:border-[#1A1817]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full pl-6 pr-6 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+3rem))]">
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar md:gap-6"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          id="card-carousel-slider"
        >
          {SLIDES.map((s) => (
            <div
              key={s.title}
              className="group relative flex h-[420px] w-[86vw] shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-black/5 p-5 shadow-[0_30px_60px_-30px_rgba(26,24,23,0.45)] transition-transform duration-300 sm:h-[460px] sm:w-[640px] sm:p-9 lg:h-[500px] lg:w-[820px] lg:p-12"
              style={{ scrollSnapAlign: "center" }}
            >
              <img
                alt={s.alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={s.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1512]/95 via-[#0B1512]/45 to-black/10" />
              <div className="absolute left-4 top-4 z-10 max-w-[58%] sm:left-8 sm:top-8">
                <span className="inline-block truncate rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur-md sm:px-3.5 sm:py-1.5 sm:text-label-md">
                  {s.badge}
                </span>
              </div>
              <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
                <span className="inline-block whitespace-nowrap rounded-full border border-white/25 bg-white/15 px-2 py-1 font-mono text-[8px] text-white backdrop-blur-md sm:px-3.5 sm:py-1.5 sm:text-label-sm">
                  {s.price}
                </span>
              </div>
              <div className="relative z-10 max-w-2xl space-y-2.5 sm:space-y-3">
                <h3 className="font-headline-md text-[22px] tracking-tight text-white sm:text-headline-lg">{s.title}</h3>
                <p className="line-clamp-3 text-[12px] leading-relaxed text-white/80 sm:text-body-lg">{s.desc}</p>
                <div className="flex flex-nowrap items-center gap-2 pt-2 sm:gap-3 sm:pt-3">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[9px] font-semibold text-[#1A1817] transition-colors hover:bg-[#F3E7D6] sm:flex-none sm:gap-2 sm:px-6 sm:py-2.5 sm:text-label-lg"
                  >
                    <span>{s.cta}</span>
                    <span className="material-symbols-outlined text-[12px] sm:text-[16px]">arrow_forward</span>
                  </a>
                  <a
                    href={s.href === siteOrigin() ? s.href : "#"}
                    target={s.href === siteOrigin() ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-white/30 bg-white/10 px-3 py-2 text-[9px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:flex-none sm:gap-1.5 sm:px-6 sm:py-2.5 sm:text-label-lg"
                  >
                    <span>Lihat Contoh</span>
                    <span className="material-symbols-outlined text-[12px] text-[#EAC082] sm:text-[16px]">north_east</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            aria-label={`Pindah ke Slide ${i + 1}`}
            className="cursor-pointer border-0 bg-transparent p-0"
            onClick={() => goTo(i)}
            type="button"
          >
            <span
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === active ? 26 : 8,
                height: 8,
                backgroundColor: i === active ? "#8D4D39" : "#DED6C8",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
