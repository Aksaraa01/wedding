"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function ConversionClimax() {
  const router = useRouter()
  const sectionRef = useRef<HTMLDivElement>(null)
  const monogramRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0")
            entry.target.classList.remove("opacity-0", "translate-y-10")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const children = sectionRef.current?.querySelectorAll(".climax-reveal")
    children?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01
      if (monogramRef.current) {
        monogramRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section ref={sectionRef} className="relative pt-16 pb-32 bg-background overflow-hidden">
      <div className="flex flex-col items-center justify-center min-h-screen max-w-lg mx-auto relative z-10 px-edge-margin-mobile text-center">
        {/* Timeline Thread Termination */}
        <div
          className="climax-reveal transition-all duration-1000 ease-out opacity-0 translate-y-10"
          style={{
            width: "1.5px",
            height: "120px",
            background: "linear-gradient(to bottom, transparent, #8d4d39)",
          }}
        />

        {/* Monogram A */}
        <div
          ref={monogramRef}
          className="climax-reveal mb-12 transition-all duration-1000 ease-out opacity-0 translate-y-10"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1px] border-secondary/30 rounded-full scale-125"
              style={{ animation: "spin 30s linear infinite" }}
            />
            <div className="absolute inset-0 border-[0.5px] border-secondary/20 rotate-45 scale-110" />
            <div
              className="z-20"
              style={{ filter: "drop-shadow(0 0 15px rgba(141, 77, 57, 0.2))" }}
            >
              <span
                className="text-[80px] leading-none text-secondary"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                A
              </span>
            </div>
          </div>
        </div>

        {/* Typography Climax */}
        <div className="climax-reveal space-y-6 mb-16 px-4 transition-all duration-1000 ease-out opacity-0 translate-y-10">
          <h2 className="font-display-lg-mobile text-display-lg-mobile text-primary font-bold leading-tight tracking-tight">
            Nikmati momen bahagiamu, ukir cerita pernikahan sempurna.
          </h2>
          <p className="font-quote-display text-secondary text-lg italic opacity-90">
            Aksaraa menata sistem, Kamu mengukir kenangan abadi.
          </p>
        </div>

        {/* CTA Row */}
        <div className="climax-reveal w-full flex flex-col items-center gap-12 transition-all duration-1000 ease-out opacity-0 translate-y-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-8 text-on-surface-variant">
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
                <span className="font-label-md text-[10px] tracking-widest uppercase">Katalog</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                <span className="font-label-md text-[10px] tracking-widest uppercase">Pesan</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-2xl">group_add</span>
                <span className="font-label-md text-[10px] tracking-widest uppercase">RSVP</span>
              </div>
            </div>
            <span className="material-symbols-outlined animate-bounce text-secondary">
              expand_more
            </span>
          </div>

          <button
            onClick={() => router.push("/register")}
            className="group relative w-full max-w-sm flex items-center justify-center gap-4 py-5 px-6 bg-secondary text-on-secondary hover:bg-secondary/90 transition-all duration-500 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span className="font-body-md font-semibold">Lanjutkan Cerita Anda</span>
          </button>
        </div>

        {/* Footer Quote */}
        <div className="climax-reveal mt-24 border-t border-outline-variant/30 pt-8 w-full max-w-xs transition-all duration-1000 ease-out opacity-0 translate-y-10">
          <p className="font-label-md text-center text-on-surface-variant leading-relaxed">
            Setiap detik pernikahan adalah puisi. Kami membantu Anda merangkai bait-baitnya dengan sempurna.
          </p>
        </div>
      </div>

      {/* Tanya Aksara Floating Button */}
      <div className="fixed bottom-24 right-edge-margin-mobile z-50">
        <button className="flex items-center gap-3 bg-primary text-on-primary py-3 px-5 rounded-full shadow-xl hover:bg-secondary transition-colors duration-300">
          <span className="font-label-md uppercase tracking-widest text-[10px]">Tanya Aksara</span>
          <span className="material-symbols-outlined">auto_fix_high</span>
        </button>
      </div>
    </section>
  )
}