"use client"

import { useEffect, useRef } from "react"

export default function SolutionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

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
      { threshold: 0.2 }
    )

    const children = sectionRef.current?.querySelectorAll(".sol-reveal")
    children?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-edge-margin-mobile overflow-hidden bg-background"
    >
      {/* Silk Texture Background — above bg-background */}
      <div
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        data-alt="A serene, high-key editorial photograph of raw, cream-colored silk fabric gently rippling like waves. The lighting is soft and natural, emphasizing the fine texture of the material against a warm, minimalist backdrop. The palette is strictly monochromatic whites and creams, evoking a sense of deep peace, luxury, and intentional simplicity for a high-end wedding brand."
      >
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaGj74j83onRJK8-W3eN89UfcAlyfcTX_gBLEqhmDPPbDFdu8E1BKm-0JmFNUg1JTDaRenCUptWGk_Dz18w3mIboLtWntN7XvUe0OoGjQ9va6b2IAQyrAuB_pRzO2JxRJu6ugieD7gn7rV3OoBoGfSihXweo1cORDGytuOtM2UtPnubOhaRqmffT4TdP9hYhr1u2-LJPfg_dLxzCulGlDUT79SGRjaZYRangi3UklDEpHaOOZ5c5tD')",
          }}
        />
      </div>

      {/* Vertical accent line */}
      <div className="fixed top-1/2 bottom-0 left-1/2 -translate-x-1/2 w-px bg-secondary/20 z-0 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-lg w-full text-center space-y-12">
        {/* Monogram Container */}
        <div className="sol-reveal relative transition-all duration-1000 ease-out opacity-0 translate-y-10">
          <div className="w-32 h-32 md:w-40 md:h-40 border-[1px] border-outline-variant/40 rounded-full flex items-center justify-center relative overflow-hidden bg-surface-container-low">
            <span className="font-headline-xl text-headline-xl text-primary relative z-10">A</span>
          </div>
        </div>

        {/* Headline Content */}
        <section className="sol-reveal space-y-6 transition-all duration-1000 ease-out delay-200 opacity-0 translate-y-10">
          <h1 className="font-headline-lg text-headline-lg md:text-headline-xl text-primary px-4 leading-tight">
            Satu Solusi Terpadu.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm mx-auto leading-relaxed italic">
            Kami yang menyempurnakan teknisnya, Anda yang menikmati tiap momen bahagianya.
          </p>
        </section>
      </main>

      {/* Bottom spacer */}
      <div className="h-24" />

      {/* Bottom arrow */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce" style={{ animationDuration: "3s" }}>
        <span
          className="material-symbols-outlined text-primary opacity-30"
          style={{ fontSize: 24, fontWeight: 100 }}
        >
          keyboard_arrow_down
        </span>
      </div>
    </section>
  )
}