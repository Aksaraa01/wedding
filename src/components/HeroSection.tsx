"use client"

import Link from "next/link"

// Template images live in the prod Supabase bucket (the staging bucket is missing
// most seeded files), so the public hero points at prod directly.
const PROD_MEDIA = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded"

const FAN_CARDS = [
  { src: `${PROD_MEDIA}/guest-gallery/card-1.jpg`, cls: "w-20 sm:w-24 md:w-32", transform: "translate(calc(-50% - 320%), 150%) rotate(-45deg)", z: 10 },
  { src: `${PROD_MEDIA}/guest-gallery/card-2.jpg`, cls: "w-24 sm:w-28 md:w-36", transform: "translate(calc(-50% - 220%), 65%) rotate(-30deg)", z: 20 },
  { src: `${PROD_MEDIA}/premium-web/story-couple-walking.jpg`, cls: "w-28 sm:w-32 md:w-40", transform: "translate(calc(-50% - 110%), 15%) rotate(-15deg)", z: 30 },
  { src: `${PROD_MEDIA}/premium-web/hero-mockup.jpg`, cls: "w-32 sm:w-40 md:w-48", transform: "translate(-50%, 0) rotate(0deg)", z: 40 },
  { src: `${PROD_MEDIA}/reminder-vip/whatsapp-chat.jpg`, cls: "w-28 sm:w-32 md:w-40", transform: "translate(calc(-50% + 110%), 15%) rotate(15deg)", z: 30 },
  { src: `${PROD_MEDIA}/qr-digital/hero-reception.jpg`, cls: "w-24 sm:w-28 md:w-36", transform: "translate(calc(-50% + 220%), 65%) rotate(30deg)", z: 20 },
  { src: `${PROD_MEDIA}/wish-wall/venue-projection.jpg`, cls: "w-20 sm:w-24 md:w-32", transform: "translate(calc(-50% + 320%), 150%) rotate(45deg)", z: 10 },
]

const SOCIAL_AVATARS = [
  `${PROD_MEDIA}/guest-gallery/card-1.jpg`,
  `${PROD_MEDIA}/guest-gallery/card-2.jpg`,
  `${PROD_MEDIA}/wish-wall/venue-projection.jpg`,
  `${PROD_MEDIA}/qr-digital/hero-reception.jpg`,
]

export default function HeroSection() {
  return (
    <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-center min-h-screen text-[#EFEAE1] [font-family:var(--font-inter)] antialiased bg-[radial-gradient(circle_at_center,#592259_0%,#3A153A_100%)]">
      <style>{`
        /* Static fan position lives on the outer wrapper; only the inner card
           lifts/scales on hover, so the motion stays smooth (no sweep/shatter). */
        .fan-outer { transition: z-index 0s; }
        .fan-outer:hover { z-index: 50 !important; }
        .fan-card {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .fan-outer:hover .fan-card {
          transform: scale(1.06) translateY(-14px);
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.65);
          border-color: rgba(255, 255, 255, 0.4);
        }
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
              className="fan-outer absolute"
              style={{ transform: card.transform, left: "50%", transformOrigin: "bottom center", zIndex: card.z }}
            >
              <div className={`fan-card relative ${card.cls} aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl`}>
                <img alt="Galeri" className="w-full h-full object-cover" src={card.src} />
                {isCenter && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 badge-float">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] font-medium tracking-wider text-white uppercase">200+ Animated Designs</span>
                  </div>
                )}
              </div>
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
