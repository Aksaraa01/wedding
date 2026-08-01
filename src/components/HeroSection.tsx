"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { ASSETS } from "@/lib/assets"

const MARQUEE_ITEMS = [
  "Web Invitation",
  "QR Pass",
  "RSVP Real-time",
  "Reminder VIP",
  "Wish Wall",
  "Galeri Kenangan",
  "Digital Angpao",
]

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
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0e0e10] text-[#e5e1e4]">
      <style>{`
        @keyframes hero-blob-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.15); }
        }
        @keyframes hero-blob-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.1); }
        }
        @keyframes hero-blob-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 30px) scale(1.2); }
        }
        @keyframes hero-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .hero-blob-a { animation: hero-blob-a 14s ease-in-out infinite; }
        .hero-blob-b { animation: hero-blob-b 18s ease-in-out infinite; }
        .hero-blob-c { animation: hero-blob-c 12s ease-in-out infinite; }
        .hero-marquee-track { animation: hero-marquee 28s linear infinite; }
        .hero-float { animation: hero-float 5s ease-in-out infinite; }
        .hero-float-delay { animation: hero-float 6s ease-in-out 1s infinite; }
        .hero-outline { -webkit-text-stroke: 1px rgba(229,225,228,0.55); color: transparent; }
        @keyframes hero-glow {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .hero-glow { animation: hero-glow 7s ease-in-out infinite; }
        @keyframes hero-card-in {
          0% { opacity: 0; transform: scale(1.6) translateY(40px); filter: blur(26px) brightness(0.4); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
        }
        @keyframes hero-card-in-soft {
          0% { opacity: 0; transform: scale(1.3) translateY(30px); filter: blur(18px) brightness(0.4); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
        }
        .hero-card-in { opacity: 0; animation: hero-card-in 1.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-card-in-soft { opacity: 0; animation: hero-card-in-soft 1.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-card-in-1 { animation-delay: 0.1s; }
        .hero-card-in-2 { animation-delay: 0.45s; }
        .hero-card-in-3 { animation-delay: 0.8s; }
        .hero-card-in-4 { animation-delay: 1.15s; }
        .hero-card-in-5 { animation-delay: 1.5s; }
        @keyframes hero-line-in {
          0% { opacity: 0; transform: translateY(34px) scale(0.98); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .hero-line { opacity: 0; animation: hero-line-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-line-1 { animation-delay: 0.05s; }
        .hero-line-2 { animation-delay: 0.22s; }
        .hero-line-3 { animation-delay: 0.4s; }
      `}</style>

      {/* Animated gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-[#f2ca50]/15 blur-[130px] hero-blob-a" />
        <div className="absolute top-1/3 right-[-160px] w-[520px] h-[520px] rounded-full bg-[#8d4d39]/25 blur-[130px] hero-blob-b" />
        <div className="absolute bottom-[-180px] left-1/4 w-[480px] h-[480px] rounded-full bg-[#b8860b]/15 blur-[130px] hero-blob-c" />
      </div>
      {/* Gold dot texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#f2ca50 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Copy — centered, full-width */}
      <div
        ref={sectionRef}
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-edge-margin-mobile md:px-edge-margin-desktop pt-28 pb-6 transition-all duration-1000 ease-out opacity-0 translate-y-10"
      >
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-[#f2ca50]/50" />
          <span className="font-label-md text-label-md uppercase tracking-[0.3em] text-[#f2ca50]">
            The Digital Wedding Ecosystem
          </span>
          <span className="h-px w-10 bg-[#f2ca50]/50" />
        </div>

        <h1 className="mt-10 text-center max-w-6xl mx-auto">
          <span className="hero-line hero-line-1 block font-display-lg text-[58px] md:text-[104px] lg:text-[132px] leading-[0.92] tracking-[-0.02em] text-[#e5e1e4]">
            Solusi
          </span>
          <span className="hero-line hero-line-2 block italic font-medium text-[50px] md:text-[92px] lg:text-[118px] leading-[0.95] tracking-[-0.02em] bg-gradient-to-br from-[#f2ca50] via-[#ffd98a] to-[#ca9b2e] bg-clip-text text-transparent [font-family:var(--font-cormorant)]">
            Digital
          </span>
          <span className="hero-line hero-line-3 block mt-2 md:mt-4 text-[24px] md:text-[32px] lg:text-[36px] italic font-normal leading-tight text-[#e5e1e4]/85 [font-family:var(--font-cormorant)]">
            untuk <span className="text-[#f2ca50]">Pernikahan Anda.</span>
          </span>
        </h1>

        <p className="mt-9 font-body-lg text-body-lg text-[#e5e1e4]/60 max-w-2xl font-light leading-relaxed">
          Aksara merancang pengalaman tamu yang seamless—
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-8">
          <Link
            href="/problem"
            className="w-full sm:w-auto group flex items-center justify-center gap-4 px-10 py-5 bg-[#f2ca50] text-[#3c2f00] rounded-full hover:bg-white transition-all duration-500 shadow-2xl shadow-[#f2ca50]/20"
          >
            <span className="font-label-md text-label-md uppercase tracking-widest">
              Mulai Cerita Anda
            </span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
          <a
            className="font-label-md text-label-md uppercase tracking-[0.15em] border-b border-white/20 pb-1 hover:border-[#f2ca50] hover:text-[#f2ca50] transition-all text-[#e5e1e4] whitespace-nowrap"
            href="https://wa.me/6281224459435"
            target="_blank"
            rel="noopener noreferrer"
          >
            Konsultasi Gratis
          </a>
        </div>

        {/* scroll hint */}
        <div className="mt-12 flex flex-col items-center gap-1 text-[#e5e1e4]/35">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <span className="material-symbols-outlined animate-bounce">expand_more</span>
        </div>
      </div>

      {/* Cards — centered row below copy */}
      <div className="relative z-10 hidden lg:block px-edge-margin-mobile md:px-edge-margin-desktop pb-10">
        <div className="relative w-full max-w-[820px] h-[450px] mx-auto group">
          {/* cinematic glow behind the stack */}
          <div className="absolute inset-0 hero-glow rounded-full bg-[radial-gradient(circle,rgba(242,202,80,0.22),rgba(141,77,57,0.12)_45%,transparent_70%)] pointer-events-none" />

          {/* invitation — sweeps in from background */}
          <div className="hero-card-in hero-card-in-1 absolute left-0 top-4 w-[300px] h-[400px]">
            <div className="w-full h-full rounded-[1.8rem] border border-white/10 bg-[#201f22] p-2 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] transition-all duration-700 group-hover:rotate-0 rotate-[-8deg] origin-bottom-left overflow-hidden">
              <img alt="Premium Web Invitation" className="w-full h-full object-cover rounded-[1.3rem]" src={ASSETS.premiumWeb.hero} />
            </div>
          </div>
          {/* qr pass */}
          <div className="hero-card-in hero-card-in-2 absolute inset-x-0 mx-auto top-0 w-[300px] h-[400px] z-10">
            <div className="w-full h-full rounded-[1.8rem] border border-white/10 bg-[#201f22] p-2 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] transition-all duration-700 group-hover:rotate-0 rotate-[1deg] origin-bottom-center overflow-hidden">
              <img alt="QR Pass" className="w-full h-full object-cover rounded-[1.3rem]" src={ASSETS.qrDigital.hero} />
            </div>
          </div>
          {/* reminder */}
          <div className="hero-card-in hero-card-in-3 absolute right-0 top-4 w-[300px] h-[400px] z-20">
            <div className="w-full h-full rounded-[1.8rem] border border-white/10 bg-[#201f22] p-2 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] transition-all duration-700 group-hover:rotate-0 rotate-[8deg] origin-bottom-right overflow-hidden">
              <img alt="WhatsApp Reminder" className="w-full h-full object-cover rounded-[1.3rem]" src={ASSETS.reminderVip.chat} />
            </div>
          </div>

          {/* extra images — polaroids peeking over the outer cards */}
          <div className="hero-card-in-soft hero-card-in-4 absolute -top-3 left-3 w-[140px] h-[195px] z-30 rotate-[-7deg]">
            <div className="w-full h-full rounded-[1.2rem] border border-white/10 bg-[#201f22] p-2 shadow-2xl origin-bottom-left overflow-hidden">
              <img alt="Guest Gallery" className="w-full h-full object-cover rounded-[0.9rem]" src={ASSETS.guestGallery.card1} />
            </div>
          </div>
          <div className="hero-card-in-soft hero-card-in-5 absolute -top-3 right-3 w-[140px] h-[195px] z-30 rotate-[7deg]">
            <div className="w-full h-full rounded-[1.2rem] border border-white/10 bg-[#201f22] p-2 shadow-2xl origin-bottom-right overflow-hidden">
              <img alt="Wish Wall" className="w-full h-full object-cover rounded-[0.9rem]" src={ASSETS.wishWall.venueProjection} />
            </div>
          </div>

          {/* floating QR badge */}
          <div className="absolute -bottom-6 left-12 w-28 h-28 rounded-full bg-[#f2ca50] text-[#3c2f00] flex flex-col items-center justify-center shadow-2xl hero-float z-30">
            <span className="material-symbols-outlined text-3xl">touch_app</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">QR Pass</span>
          </div>
          {/* floating chip */}
          <div className="absolute top-1/2 -translate-y-1/2 right-2 bg-[#1c1b1e]/95 border border-white/10 rounded-full px-4 py-2 shadow-xl flex items-center gap-2 hero-float-delay z-30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-[#e5e1e4]">RSVP Real-time</span>
          </div>
          {/* floating stat */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#1c1b1e]/95 border border-white/10 rounded-xl px-5 py-2.5 shadow-xl hero-float z-30 flex items-center gap-3">
            <p className="text-[10px] uppercase tracking-wider text-[#e5e1e4]/50">Reminder VIP</p>
            <p className="font-headline-md text-lg text-[#f2ca50]">100+ Tamu</p>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm py-4 overflow-hidden">
        <div className="hero-marquee-track flex items-center gap-10 whitespace-nowrap w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-10 font-label-md text-label-md uppercase tracking-[0.25em] text-[#e5e1e4]/50">
              {item}
              <span className="text-[#f2ca50]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
