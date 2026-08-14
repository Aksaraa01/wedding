"use client"

import Link from "next/link"

// Template screenshots live in the prod bucket's `templates/` folder.
const PROD_MEDIA = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media"

const FAN_CARDS = [
  { src: `${PROD_MEDIA}/templates/Template%201.png`, transform: "translate(calc(-50% - 250%), 130%) rotate(-48deg)", z: 10 },
  { src: `${PROD_MEDIA}/templates/Template%202.png`, transform: "translate(calc(-50% - 170%), 60%) rotate(-32deg)", z: 20 },
  { src: `${PROD_MEDIA}/templates/Template%203.png`, transform: "translate(calc(-50% - 95%), 12%) rotate(-16deg)", z: 30 },
  { src: `${PROD_MEDIA}/templates/Template%204.png`, transform: "translate(calc(-50% - 28%), 0) rotate(-5deg)", z: 40 },
  { src: `${PROD_MEDIA}/templates/Template%205.png`, transform: "translate(calc(-50% + 28%), 0) rotate(5deg)", z: 35 },
  { src: `${PROD_MEDIA}/templates/Template%206.png`, transform: "translate(calc(-50% + 95%), 12%) rotate(16deg)", z: 30 },
  { src: `${PROD_MEDIA}/templates/Template%207.png`, transform: "translate(calc(-50% + 170%), 60%) rotate(32deg)", z: 20 },
  { src: `${PROD_MEDIA}/templates/Template%209.png`, transform: "translate(calc(-50% + 250%), 130%) rotate(48deg)", z: 10 },
]

const SOCIAL_AVATARS = [
  `${PROD_MEDIA}/templates/Template%201.png`,
  `${PROD_MEDIA}/templates/Template%202.png`,
  `${PROD_MEDIA}/templates/Template%203.png`,
  `${PROD_MEDIA}/templates/Template%204.png`,
]

const CARD_SIZE = "w-28 sm:w-32 md:w-40"

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

      {/* Fan cards gallery (rounded box, same size) */}
      <div
        aria-hidden="true"
        className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] max-w-6xl mx-auto flex justify-center items-end mb-10"
      >
        {FAN_CARDS.map((card, i) => {
          const hasBadge = i === 3
          return (
            <div
              key={i}
              className="fan-outer absolute"
              style={{ transform: card.transform, left: "50%", transformOrigin: "bottom center", zIndex: card.z }}
            >
              <div className={`fan-card relative ${CARD_SIZE} aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl`}>
                <img alt="Galeri" className="w-full h-full object-cover" src={card.src} />
                {hasBadge && (
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
          Every Moment<br />
          Deserves an<br />
          <span className="italic">Opening Act.</span>
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
