"use client"

import { useEffect, useRef, useState } from "react"

export default function TransitionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [curtainFallen, setCurtainFallen] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setCurtainFallen(true), 300)
            setTimeout(() => setShowContent(true), 3000)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="transition-section"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden bg-[#000000] flex flex-col items-center justify-center"
    >
      {/* Fading Chaos Headline — on dark bg */}
      <div className="absolute top-1/4 w-full text-center px-edge-margin-mobile pointer-events-none z-0 transition-opacity duration-1000 opacity-10">
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-white/50 tracking-tighter italic">
          The Infinite Noise
        </h1>
      </div>

      {/* Chaotic Elements Vortex — on dark bg */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute" style={{ top: "20%", left: "10%" }}>
            <div className="bg-emerald-900/40 border border-emerald-500/20 px-4 py-2 rounded-2xl text-[10px] text-white backdrop-blur-sm whitespace-nowrap">
              &ldquo;Is the floral quote ready?&rdquo;
            </div>
          </div>
          <div className="absolute hidden md:block" style={{ top: "60%", right: "8%" }}>
            <div className="bg-red-900/40 border border-red-500/20 px-4 py-2 rounded-lg text-[10px] text-white backdrop-blur-sm whitespace-nowrap">
              OVERDUE: CATERING DEPOSIT
            </div>
          </div>
          <div className="absolute" style={{ bottom: "20%", left: "8%" }}>
            <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] text-white backdrop-blur-sm whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">phone_missed</span>
              Missed Call: Decorator
            </div>
          </div>
          <div className="absolute hidden md:block" style={{ top: "30%", right: "20%" }}>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded text-[10px] text-white whitespace-nowrap">
              Conflict: Tasting vs Fittings
            </div>
          </div>
        </div>
      </div>

      {/* Content — above curtain (z-40), hidden until curtain has fallen */}
      <div
        className={`relative z-40 flex flex-col items-center px-4 transition-all duration-1000 ease-out ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-10 md:mb-12" />

        <div className="relative group">
          <div className="bg-surface border border-outline-variant/30 w-16 h-16 flex items-center justify-center rounded-full shadow-2xl">
            <span className="font-headline-md text-headline-md text-primary tracking-widest ml-1">A</span>
          </div>
          <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-50" />
        </div>

        <div className="mt-10 md:mt-12 text-center">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.2em] mb-4">
            Aksaraa wedding
          </p>
          <h2 className="text-[32px] md:text-display-lg-mobile text-primary leading-tight font-display-lg-mobile italic">
            Ketenangan adalah kemewahan baru
          </h2>
        </div>
      </div>

      {/* Cream Curtain — falls DOWN from above, covering dark bg with cream */}
      <div
        className="absolute inset-0 pointer-events-none z-30 bg-surface transition-transform duration-[2500ms] ease-[cubic-bezier(0.8,0,0.2,1)]"
        style={{ transform: curtainFallen ? "translateY(0%)" : "translateY(-100%)" }}
      />

      {/* Scroll Indicator */}
      {showContent && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center z-50 animate-bounce">
          <span className="material-symbols-outlined text-primary/40 font-thin text-2xl">
            expand_more
          </span>
        </div>
      )}
    </section>
  )
}