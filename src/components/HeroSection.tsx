"use client"

import Link from "next/link"

// Template screenshots live in the prod bucket's `templates/` folder.
const PROD_MEDIA = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media"

// 8 square cards in a top arch, mirroring the reference layout.
// Sizes ladder: edges 130px → center 156px. Rotations ∓36° → ∓4°.
const ARCH_PHOTOS = [
  { src: `${PROD_MEDIA}/templates/Template%201.png`, left: "4%", top: "72%", size: 130, rotate: -36, z: 10 },
  { src: `${PROD_MEDIA}/templates/Template%202.png`, left: "13%", top: "42%", size: 140, rotate: -24, z: 20 },
  { src: `${PROD_MEDIA}/templates/Template%203.png`, left: "24%", top: "16%", size: 148, rotate: -13, z: 30 },
  { src: `${PROD_MEDIA}/templates/Template%204.png`, left: "37%", top: "4%", size: 156, rotate: -4, z: 40 },
  { src: `${PROD_MEDIA}/templates/Template%205.png`, left: "51%", top: "4%", size: 156, rotate: 4, z: 35 },
  { src: `${PROD_MEDIA}/templates/Template%206.png`, left: "64%", top: "16%", size: 148, rotate: 13, z: 30 },
  { src: `${PROD_MEDIA}/templates/Template%207.png`, left: "76%", top: "42%", size: 140, rotate: 24, z: 20 },
  { src: `${PROD_MEDIA}/templates/Template%209.png`, left: "85%", top: "72%", size: 130, rotate: 36, z: 10 },
]

const SOCIAL_AVATARS = [
  `${PROD_MEDIA}/templates/Template%201.png`,
  `${PROD_MEDIA}/templates/Template%202.png`,
  `${PROD_MEDIA}/templates/Template%203.png`,
  `${PROD_MEDIA}/templates/Template%204.png`,
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-[#EFEAE1] [font-family:var(--font-inter)] antialiased overflow-hidden bg-[radial-gradient(circle_at_center,#592259_0%,#3A153A_100%)]">
      <style>{`
        .arch-photo { position: absolute; }
        .arch-photo:hover { z-index: 50 !important; }
        .arch-photo img {
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.55);
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .arch-photo:hover img {
          transform: scale(1.06) translateY(-8px);
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.65);
          border-color: rgba(255, 255, 255, 0.4);
        }
      `}</style>

      {/* Top arch gallery (mirrors reference positioning) — desktop only */}
      <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[380px] pointer-events-none px-4 z-5">
        {ARCH_PHOTOS.map((photo, i) => (
          <div
            key={i}
            className="arch-photo pointer-events-auto"
            style={{
              left: photo.left,
              top: photo.top,
              width: photo.size,
              height: photo.size,
              transform: `rotate(${photo.rotate}deg)`,
              zIndex: photo.z,
            }}
          >
            <img
              src={photo.src}
              alt="Galeri"
              width={photo.size}
              height={photo.size}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        ))}
      </div>

      {/* Mobile: horizontal snap carousel of the template frames (no overlap with text) */}
      <div className="md:hidden w-full max-w-[1100px] mx-auto mb-6 mt-6">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar px-4">
          {ARCH_PHOTOS.map((photo, i) => (
            <div key={i} className="shrink-0 snap-start w-[200px]">
              <img
                src={photo.src}
                alt="Galeri"
                className="w-full aspect-[9/19] object-cover rounded-2xl border border-white/20 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hero content below the arch */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mt-6 md:mt-[200px] px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 text-[11px] sm:text-xs font-bold tracking-widest uppercase bg-[#C5A85D]/15 border border-[#C5A85D]/40 text-[#C5A85D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A85D] animate-pulse" />
          100+ Animated Designs
        </div>

        <h1 className="[font-family:var(--font-playfair)] text-[clamp(2rem,5.5vw,4.2rem)] font-bold leading-[1.08] tracking-tight text-[#FAF7F2] mb-6 drop-shadow-xl">
          Setiap Aksara
          <br />
          Bercerita Tentang
          <br />
          <span className="italic">Hari Bahagia Kami.</span>
        </h1>

        <p className="text-base md:text-lg text-[#B09BA6] max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-light drop-shadow-md">
          Bagikan momen spesial Anda dengan undangan website berdesain menawan, dilengkapi sistem RSVP
          dan buku tamu digital yang berkesan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-[#C5A85D] hover:bg-[#D4B86A] text-black font-semibold py-3.5 px-8 rounded-full transition-colors text-center"
          >
            Mulai Cerita Anda
          </Link>
          <a
            href="https://wa.me/6282268905055?text=Halo%20Aksaraa%20Wedding%20Saya%20perlu%20konsultasi%20mengenai.."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-[#FAF7F2] hover:text-[#C5A85D] transition-colors font-medium flex items-center justify-center gap-2 py-3.5 border-b border-transparent hover:border-[#C5A85D]"
          >
            Konsultasi Gratis
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mt-10">
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
            <span className="text-[#C5A85D] font-bold">1000+</span> undangan terkirim minggu ini
          </p>
        </div>
      </div>
    </section>
  )
}
