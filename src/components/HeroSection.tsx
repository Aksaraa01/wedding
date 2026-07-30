"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { ASSETS } from "@/lib/assets"

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0")
            entry.target.classList.remove("opacity-0", "translate-y-10")
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="min-h-screen flex flex-col justify-center px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto py-24 md:py-20">
      <div
        ref={sectionRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-gutter items-center transition-all duration-1000 ease-out opacity-0 translate-y-10"
      >
        <div className="md:col-span-7 flex flex-col items-start gap-8 md:gap-10">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 md:w-12 bg-secondary/50" />
            <span className="font-label-md text-[10px] md:text-label-md uppercase tracking-[0.2em] text-secondary">
              Platform Pernikahan Naratif
            </span>
          </div>

          <h1 className="font-display-lg text-[42px] leading-[1.1] md:text-display-lg-mobile lg:text-display-lg md:leading-[1.1] tracking-tight text-on-surface">
            Ukir Janji Suci,
            <br />
            <span className="italic text-secondary">Rayakan Momen Abadi.</span>
          </h1>

          <p className="font-body-lg text-[18px] md:text-body-lg text-on-surface/80 max-w-xl font-light leading-relaxed">
            Aksaraa: Mengubah janji suci dan perjalanan cinta Anda menjadi
            kisah digital interaktif yang memikat
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 mt-2 md:mt-4 w-full sm:w-auto">
            <Link
              href="/problem"
              className="w-full sm:w-auto group flex items-center justify-center gap-4 px-10 py-5 bg-on-surface text-background rounded-full hover:bg-secondary transition-all duration-500 shadow-xl shadow-on-surface/10"
            >
              <span className="font-label-md text-label-md uppercase tracking-widest">
                Mulai Cerita Anda
              </span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                menu_book
              </span>
            </Link>
            <a
              className="font-label-md text-label-md uppercase tracking-[0.15em] border-b border-on-surface/20 pb-1 hover:border-on-surface transition-all text-on-surface whitespace-nowrap"
              href="https://wa.me/6281224459435"
              target="_blank"
              rel="noopener noreferrer"
            >
              Konsultasi Gratis
            </a>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center relative mt-12 md:mt-0">
          <div className="relative group w-full max-w-[420px] md:w-auto">
            <div className="absolute -inset-4 md:-inset-6 border border-on-surface/10 scale-95 group-hover:scale-100 transition-transform duration-1000 hidden sm:block" />

            <div className="w-full md:w-[420px] aspect-[3/4] overflow-hidden shadow-2xl relative">
              <img
                alt="Editorial wedding portrait with artistic line art elements"
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                src={ASSETS.hero.bg}
              />
              <div className="absolute inset-0 bg-secondary/5 mix-blend-multiply" />
            </div>

            <div className="absolute -bottom-6 -left-4 md:-bottom-12 md:-left-12 bg-white/95 backdrop-blur p-6 md:p-8 max-w-[220px] md:max-w-[260px] border border-outline-variant/30 shadow-lg z-20">
              <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary mb-2 md:mb-3">
                Editor&apos;s Note
              </p>
              <p className="font-body-md text-[13px] md:text-[14px] italic leading-relaxed text-on-surface">
                &ldquo;Setiap detil adalah baris kalimat dalam puisi cinta
                Anda.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}