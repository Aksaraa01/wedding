import { waLink } from "@/lib/contact"

const WA_MULAI_LINK = waLink("Halo Aksaraa Wedding, saya ingin membuat undangan pernikahan digital untuk momen saya.")
const WA_HUBUNGI_LINK = waLink("Halo Aksaraa Wedding, saya ingin berkonsultasi mengenai sistem manajemen resepsi dan tamu VIP.")

export default function HeroSection() {
  return (
    <section className="relative z-10 w-full overflow-hidden pt-12 pb-24 lg:pt-16 lg:pb-36 bg-[#051711]">
      {/* Ambient radial glows */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[540px] bg-gradient-to-tr from-[#051711] via-[#10B981]/25 to-[#D4AF37]/30 rounded-full blur-[140px] pointer-events-none animate-aurora opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/3 w-[420px] h-[420px] bg-[#EAC082]/15 rounded-full blur-[110px] pointer-events-none animate-aurora opacity-35"
        style={{ animationDelay: "-9s" }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-10 -left-40 w-[800px] h-[700px] bg-gradient-to-tr from-[#215240]/40 via-[#C29B61]/25 to-[#02120C] rounded-full blur-[140px] pointer-events-none animate-aurora opacity-35"
        style={{ animationDelay: "-11s" }}
      />

      {/* Fluid Wave Mesh Layer 1: Champagne Gold Glowing Silk Wave & Contours */}
      <div aria-hidden="true" className="absolute inset-0 flex items-start pointer-events-none animate-ribbon overflow-hidden opacity-60">
        <svg
          className="w-[220%] h-full min-h-[1400px] animate-wave-flow-1 flex-shrink-0"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 2800 1200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldSilkGlowGrad" x1="0%" x2="100%" y1="20%" y2="80%">
              <stop offset="0%" stopColor="#C29B61" stopOpacity="0.32" />
              <stop offset="28%" stopColor="#D4AF37" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#F3E5AB" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#051711" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="strokeGoldShimmer" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#C29B61" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#FFE4A0" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#F3E5AB" stopOpacity="0.9" />
              <stop offset="90%" stopColor="#34D399" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="strokeGoldThin" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#FFE4A0" stopOpacity="0.65" />
              <stop offset="80%" stopColor="#10B981" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
            </linearGradient>
            <filter height="140%" id="softGlowFilter" width="140%" x="-20%" y="-20%">
              <feGaussianBlur result="blur" stdDeviation="3.5" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Filled Wave Body */}
          <path d="M0,280 C360,420 620,160 1020,290 C1420,420 1680,180 2080,310 C2420,410 2640,240 2800,320 L2800,1200 L0,1200 Z" fill="url(#goldSilkGlowGrad)" />
          {/* Radiant Primary Contour Wave Ribbons */}
          <path d="M0,280 C360,420 620,160 1020,290 C1420,420 1680,180 2080,310 C2420,410 2640,240 2800,320" filter="url(#softGlowFilter)" stroke="url(#strokeGoldShimmer)" strokeWidth="2.5" />
          <path d="M0,320 C380,470 650,210 1050,330 C1450,450 1710,230 2110,350 C2450,440 2660,280 2800,360" opacity="0.85" stroke="url(#strokeGoldThin)" strokeWidth="1.8" />
          <path d="M0,360 C400,510 680,260 1080,370 C1480,480 1740,280 2140,390 C2480,470 2680,320 2800,400" opacity="0.6" stroke="url(#strokeGoldThin)" strokeWidth="1.2" />
          <path d="M0,400 C420,550 710,310 1110,410 C1510,510 1770,330 2170,430 C2510,500 2700,360 2800,440" opacity="0.4" stroke="url(#strokeGoldThin)" strokeWidth="0.9" />
        </svg>
      </div>

      {/* Fluid Wave Mesh Layer 2: Emerald Green & Champagne Sinusoidal Undulations */}
      <div aria-hidden="true" className="absolute inset-0 flex items-center pointer-events-none overflow-hidden opacity-50">
        <svg
          className="w-[230%] h-full min-h-[1400px] animate-wave-flow-2 flex-shrink-0"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 2800 1200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="emeraldSilkGrad" x1="100%" x2="0%" y1="10%" y2="90%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
              <stop offset="35%" stopColor="#059669" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#02120C" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="strokeEmeraldGlow" x1="100%" x2="0%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#34D399" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#F3E5AB" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#D4AF37" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="strokeEmeraldFine" x1="100%" x2="0%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="40%" stopColor="#34D399" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#FFE4A0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
            </linearGradient>
            <filter height="140%" id="softGlowFilter" width="140%" x="-20%" y="-20%">
              <feGaussianBlur result="blur" stdDeviation="3.5" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d="M0,450 C440,300 780,590 1200,430 C1620,270 1960,540 2380,390 C2590,310 2710,440 2800,380 L2800,1200 L0,1200 Z" fill="url(#emeraldSilkGrad)" />
          <path d="M0,450 C440,300 780,590 1200,430 C1620,270 1960,540 2380,390 C2590,310 2710,440 2800,380" filter="url(#softGlowFilter)" stroke="url(#strokeEmeraldGlow)" strokeWidth="2.6" />
          <path d="M0,490 C460,340 810,620 1230,470 C1650,310 1990,570 2410,420 C2620,350 2730,470 2800,420" opacity="0.85" stroke="url(#strokeEmeraldFine)" strokeWidth="1.8" />
          <path d="M0,530 C480,380 840,650 1260,510 C1680,350 2020,600 2440,450 C2650,390 2750,500 2800,460" opacity="0.6" stroke="url(#strokeEmeraldFine)" strokeWidth="1.2" />
          <path d="M0,570 C500,420 870,680 1290,550 C1710,390 2050,630 2470,480 C2680,430 2770,530 2800,500" opacity="0.4" stroke="url(#strokeEmeraldFine)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Fluid Wave Mesh Layer 3: Intertwined Golden Horizon Waves */}
      <div aria-hidden="true" className="absolute inset-0 flex items-end pointer-events-none overflow-hidden opacity-45">
        <svg
          className="w-[240%] h-full min-h-[1400px] animate-wave-flow-3 flex-shrink-0"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 2800 1200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="champagneGoldDeepGrad" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#C29B61" stopOpacity="0.32" />
              <stop offset="75%" stopColor="#10B981" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#02120C" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="strokeGoldDeepGlow" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#C29B61" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#FFE4A0" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M0,640 C340,490 700,770 1080,610 C1460,460 1820,720 2200,560 C2440,460 2660,610 2800,540 L2800,1200 L0,1200 Z" fill="url(#champagneGoldDeepGrad)" />
          <path d="M0,640 C340,490 700,770 1080,610 C1460,460 1820,720 2200,560 C2440,460 2660,610 2800,540" filter="url(#softGlowFilter)" stroke="url(#strokeGoldDeepGlow)" strokeWidth="2.2" />
          <path d="M0,680 C360,530 730,800 1110,640 C1490,500 1850,750 2230,600 C2470,500 2680,640 2800,580" opacity="0.65" stroke="url(#strokeGoldDeepGlow)" strokeWidth="1.3" />
          <path d="M0,720 C380,570 760,830 1140,670 C1520,540 1880,780 2260,640 C2500,540 2700,670 2800,620" opacity="0.4" stroke="url(#strokeGoldDeepGlow)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Hero content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C2D27]/70 backdrop-blur-md shadow-sm mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EAC082] animate-pulse" />
          <span className="font-label-md text-[9px] sm:text-label-md uppercase text-[#EAC082] tracking-wide sm:tracking-widest">AKSARAA Event Management</span>
        </div>

        {/* Monumental Headline */}
        <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-[#D2E7DD] tracking-tight max-w-4xl">
          Momen Berharga.
          <span
            className="block mt-2 font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#ffe5be] via-[#EAC082] to-[#C29B61] drop-shadow-sm"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "normal", fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            Kini jauh lebih berkesan.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 font-body-lg text-body-lg text-[#D2C4B5] max-w-2xl leading-relaxed">
          Lebih dari Sekadar Undangan. Ini Adalah Sistem Manajemen Resepsi dan Tamu VIP yang Dirancang Sempurna untuk Anda
        </p>

        {/* Dual CTAs */}
        <div className="mt-8 flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
          <a
            href={WA_MULAI_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[10px] sm:text-label-lg transition-all duration-300 shadow-lg hover:shadow-[#0071e3]/30 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
          >
            <span>Mulai Sekarang</span>
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
          </a>
          <a
            href={WA_HUBUNGI_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#1C2D27]/80 hover:bg-[#263832] text-[#D2E7DD] text-[10px] sm:text-label-lg backdrop-blur-md transition-all duration-300 shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"
          >
            <span>Hubungi Konsultan</span>
            <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#EAC082]">north_east</span>
          </a>
        </div>

        {/* Floating Device Stage */}
        <div className="mt-16 w-full max-w-5xl relative flex justify-center items-center">
          {/* Flanking Badge Left (Live Cloud Sync) */}
          <div className="hidden lg:flex absolute left-4 xl:left-8 top-1/3 -translate-y-1/2 z-20 flex-col items-start gap-3 p-4 rounded-xl bg-[#02110C]/85 backdrop-blur-xl shadow-xl w-60 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#215240] flex items-center justify-center text-[#EAC082]">
                <span className="material-symbols-outlined text-[18px]">movie</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-[#9B8F81] uppercase tracking-wider">PENGALAMAN SINEMATIK</p>
                <p className="font-title-md text-body-md text-[#D2E7DD] font-semibold">Cinematic Invitation</p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-[#D2C4B5]">Video latar bergerak, alunan musik lossless, dan transisi editorial setara layar lebar.</p>
            <div className="flex items-center gap-1.5 text-[#9FD1BB] font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-[#9FD1BB] animate-pulse" />
              <span>Ultra HD 4K • 60fps</span>
            </div>
          </div>

          {/* Flanking Badge Right (QR Pass 1.8 Detik) */}
          <div className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-20 flex-col items-start gap-3 p-4 rounded-xl bg-[#02110C]/85 backdrop-blur-xl shadow-xl w-60 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EAC082]/20 flex items-center justify-center text-[#EAC082]">
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-[#9B8F81] uppercase tracking-wider">Resepsi Gate</p>
                <p className="font-title-md text-body-md text-[#D2E7DD] font-semibold">QR Pass 1.8 Detik</p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-[#D2C4B5]">Pemindaian kilat kamera gawai tanpa antrean meja penerimaan.</p>
            <div className="w-full bg-[#263832] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#EAC082] h-full w-11/12 rounded-full" />
            </div>
          </div>

          {/* Center Smartphone Mockup */}
          <div className="relative z-10 w-[min(340px,88vw)] sm:w-[380px] bg-[#02110C] rounded-[44px] p-3.5 shadow-2xl shadow-black/80">
            <div className="relative w-full h-[690px] rounded-[34px] overflow-hidden bg-[#02110C] flex flex-col justify-between p-5 text-left">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#263832]" />
                <span className="w-2 h-2 rounded-full bg-[#C29B61]/40" />
              </div>
              {/* Mobile Screen Header Background Art */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: "url('/templates/imagine/thumbnail.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02110C] via-[#02110C]/80 to-transparent" />
              {/* Screen Bottom: Music Player & Action Pill */}
              <div className="relative z-10 space-y-3 mt-auto">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1F19]/90 backdrop-blur-md">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-[#EAC082] text-[#051711] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                    </div>
                    <div className="truncate">
                      <p className="font-label-sm text-label-sm text-[#D2E7DD] truncate">Claire de Lune – Debussy</p>
                      <p className="font-body-sm text-body-sm text-[#9B8F81] truncate">Simfoni Pengiring Resepsi</p>
                    </div>
                  </div>
                  <button className="text-[#EAC082] hover:text-[#D2E7DD] p-1" type="button">
                    <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                  </button>
                </div>
                <div className="w-full py-2.5 rounded-full bg-[#EAC082] hover:bg-[#FFDDB0] text-[#442C00] font-label-md text-label-md text-center font-bold tracking-wide transition-colors">
                  Buka Surat &amp; RSVP Tamu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
