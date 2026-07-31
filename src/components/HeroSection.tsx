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
    <section className="min-h-screen flex flex-col justify-center px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto py-20">
      <div
        ref={sectionRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center transition-all duration-1000 ease-out opacity-0 translate-y-10"
      >
        <div className="md:col-span-6 flex flex-col items-start gap-10">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-secondary/50" />
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
              The Digital Wedding Ecosystem
            </span>
          </div>

          <h1 className="font-display-lg text-display-lg-mobile md:text-[72px] leading-[1.05] tracking-tight text-on-surface">
            Solusi Digital
            <br />
            <span className="italic text-secondary">untuk Pernikahan Anda.</span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface/80 max-w-xl font-light leading-relaxed">
            Aksara merancang pengalaman tamu yang seamless—dari pesan WhatsApp yang elegan
            hingga check-in eksklusif dengan QR Pass. Satu platform untuk seluruh perjalanan
            hari bahagia Anda.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-8 mt-4 w-full sm:w-auto">
            <Link
              href="/problem"
              className="w-full sm:w-auto group flex items-center justify-center gap-4 px-10 py-5 bg-on-surface text-background rounded-full hover:bg-secondary transition-all duration-500 shadow-xl shadow-on-surface/10"
            >
              <span className="font-label-md text-label-md uppercase tracking-widest">
                Mulai Cerita Anda
              </span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                arrow_forward
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

        <div className="hidden md:col-span-6 md:flex flex-col items-end justify-center relative mt-12 md:mt-0">
          <div className="relative group">
            <div className="absolute -inset-8 border border-on-surface/5 scale-95 group-hover:scale-100 transition-transform duration-1000" />

            <div className="w-[520px] max-w-full aspect-[4/5] overflow-hidden shadow-2xl relative bg-white">
              <img
                alt="Premium Web Invitation Cinematic Mockup"
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                src={ASSETS.hero.mockup}
              />
              <div className="absolute inset-0 bg-secondary/5 mix-blend-multiply" />
              <div className="absolute top-8 right-8 flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-secondary">touch_app</span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-12 bg-white/95 backdrop-blur p-8 max-w-[280px] border border-outline-variant/30 shadow-lg z-20">
              <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary mb-3">
                Product Spotlight
              </p>
              <p className="font-body-md text-[14px] italic leading-relaxed text-on-surface">
                &ldquo;Desain interaktif yang memadukan estetika editorial dengan teknologi
                terkini.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
