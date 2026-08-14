"use client"

import Link from "next/link"
import { ASSETS } from "@/lib/assets"

const FAN_CARDS = [
  { src: ASSETS.guestGallery.card1, cls: "w-20 sm:w-24 md:w-32", transform: "translate(calc(-50% - 320%), 150%) rotate(-45deg)", z: 10 },
  { src: ASSETS.guestGallery.card2, cls: "w-24 sm:w-28 md:w-36", transform: "translate(calc(-50% - 220%), 65%) rotate(-30deg)", z: 20 },
  { src: ASSETS.premiumWeb.story1, cls: "w-28 sm:w-32 md:w-40", transform: "translate(calc(-50% - 110%), 15%) rotate(-15deg)", z: 30 },
  { src: ASSETS.premiumWeb.hero, cls: "w-32 sm:w-40 md:w-48", transform: "translate(-50%, 0) rotate(0deg)", z: 40 },
  { src: ASSETS.reminderVip.chat, cls: "w-28 sm:w-32 md:w-40", transform: "translate(calc(-50% + 110%), 15%) rotate(15deg)", z: 30 },
  { src: ASSETS.qrDigital.hero, cls: "w-24 sm:w-28 md:w-36", transform: "translate(calc(-50% + 220%), 65%) rotate(30deg)", z: 20 },
  { src: ASSETS.wishWall.venueProjection, cls: "w-20 sm:w-24 md:w-32", transform: "translate(calc(-50% + 320%), 150%) rotate(45deg)", z: 10 },
]

const SOCIAL_AVATARS = [
  ASSETS.guestGallery.card1,
  ASSETS.guestGallery.card2,
  ASSETS.wishWall.venueProjection,
  ASSETS.qrDigital.hero,
]

export default function HeroSection() {
  return (
    <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen text-[#EFEAE1] [font-family:var(--font-inter)] antialiased bg-[radial-gradient(circle_at_center,#592259_0%,#3A153A_100%)]">
      <style>{`
        .card-fan { transition: transform 0.3s ease, z-index 0s; }
        .card-fan:hover { transform: scale(1.05) translateY(-10px) rotate(0deg) !important; z-index: 50 !important; }
        .badge-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Fan cards gallery (rounded box) */}
      <div
        aria-hidden="true"
        className="relative w-full h-[250px] sm:h-[300px] md:h-[380px] max-w-5xl mx-auto flex justify-center items-end mb-10"
      >
        {FAN_CARDS.map((card, i) => {
          const isCenter = i === 3
          return (
            <div
              key={i}
              className={`card-fan absolute ${card.cls} aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl`}
              style={{ transform: card.transform, left: "50%", transformOrigin: "bottom center", zIndex: card.z }}
            >
              <img alt="Galeri" className="w-full h-full object-cover" src={card.src} />
              {isCenter && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 badge-float">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] font-medium tracking-wider text-white uppercase">200+ Animated Designs</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Typography */}
      <div className="text-center max-w-3xl mx-auto relative z-50 mt-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium text-[#FAF7F2] leading-[1.1] mb-6 drop-shadow-xl [font-family:var(--font-playfair)]">
          Solusi Digital,<br />
          Sejuta Memori<br />
          <span className="italic">Abadi.</span>
        </h1>
        <p className="text-base sm:text-lg text-[#B09BA6] max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
          Lebih dari sekadar undangan digital. Aksara adalah simfoni visual yang memadukan estetika editorial dengan
          teknologi mutakhir, mengabadikan setiap detik perjalanan cinta Anda dalam satu ekosistem yang utuh.
        </p>

        {/* Call to actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/problem"
            className="w-full sm:w-auto bg-[#C5A85D] hover:bg-[#D4B86A] text-black font-semibold py-3.5 px-8 rounded-full transition-colors text-center"
          >
            Mulai Cerita Anda
          </Link>
          <a
            href="https://wa.me/6281224459435"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-[#FAF7F2] hover:text-[#C5A85D] transition-colors font-medium flex items-center justify-center gap-2 py-3.5 border-b border-transparent hover:border-[#C5A85D]"
          >
            Konsultasi Gratis
          </a>
        </div>
      </div>

      {/* Social proof footer */}
      <div className="mt-16 flex flex-col items-center gap-3">
        <div className="flex -space-x-2">
          {SOCIAL_AVATARS.map((src, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#3A153A] overflow-hidden">
              <img src={src} alt="Tamu" className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-[#3A153A] bg-[#592259] flex items-center justify-center text-xs text-white">
            +
          </div>
        </div>
        <p className="text-sm text-[#B09BA6]">
          <span className="text-[#C5A85D] font-medium">48,200+</span> invitations sent this week
        </p>
      </div>
    </section>
  )
}
