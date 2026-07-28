"use client"

import { useEffect, useRef } from "react"

export default function FeaturesSection() {
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
    <>
      <div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
        <div className="h-[1px] w-full bg-outline-variant/20" />
      </div>

      <section className="px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto py-16 md:py-section-gap">
        <div
          ref={sectionRef}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 transition-all duration-1000 ease-out opacity-0 translate-y-10"
        >
          <div className="md:col-span-8 group cursor-pointer relative overflow-hidden bg-surface-container">
            <div className="absolute inset-0 bg-on-surface/5 group-hover:bg-transparent transition-all duration-700 z-10" />
            <div className="w-full h-[450px] md:h-[650px] overflow-hidden">
              <img
                alt="Premium Digital Invitation Experience"
                className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6JvU3E1i7nY3fG6fUkWjfs-rVnrXu7a8Pd5-tN3mGj0dBAd2GaY-4VgqlJg74SOGmFyZD2ssWBvnvDhS8eLBm1PvLi0dHxyE2bWGwhdYeygfNjsNl25xqJJYeyyRLDKn_gX7UiWfUUEMsuhW-8Scbfy58lRjfpRMDJsnyS3rcYoovgJfhpgyYfFDBuOAT_JVFezW7VqhYjppOeYSDyFBJJvSK6YPU5J73e0RJVMuzbGluy5x0FLnw"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
              <span className="font-label-md text-label-md uppercase tracking-widest opacity-80 mb-2 block">
                Experience
              </span>
              <h3 className="font-headline-lg text-[28px] md:text-headline-lg mb-4">
                Invitasi Digital Premium
              </h3>
              <p className="max-w-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-700 md:transform md:translate-y-4 md:group-hover:translate-y-0 font-body-md text-white/90 text-sm md:text-base">
                Desain yang bernafas, layout yang bercerita. Lebih dari sekadar
                tautan, ini adalah gerbang pertama menuju perayaan abadi Anda.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-8 md:gap-12">
            <div className="bg-white p-8 md:p-12 border border-outline-variant/30 h-full flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-background rounded-full flex items-center justify-center mb-6 md:mb-8">
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-secondary">
                    verified_user
                  </span>
                </div>
                <h4 className="font-headline-md text-[24px] md:text-headline-md mb-4 md:mb-6 text-on-surface">
                  Eksklusif &amp; Terjaga
                </h4>
                <p className="text-on-surface/70 font-body-md text-sm md:text-base leading-relaxed">
                  Melalui WhatsApp resmi dan RSVP terenkripsi, kami memastikan
                  kabar bahagia Anda sampai ke tangan yang tepat dengan aman dan
                  penuh kesan.
                </p>
              </div>
              <a
                className="group flex items-center gap-3 font-label-md text-label-md uppercase tracking-widest mt-8 md:mt-10 text-on-surface"
                href="#"
              >
                Pelajari Keamanan{" "}
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </a>
            </div>

            <div className="relative w-full h-[240px] md:h-[320px] overflow-hidden grayscale md:hover:grayscale-0 transition-all duration-1000 shadow-inner bg-surface-variant">
              <img
                alt="Detail of premium stationery texture"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1GWVTUwBLSqgL7tsxpyFVk1CRKFGqtWF2db4xgNA2s1pkUWKdZGEZIq_7wkX45tihHNn6LnCYqUDgW4Hwn6Myiv4XPcAC6uFfmLNcxUo_ZdgmaQ4Lk7IdXxyF_IKqwA-ixzLeL464WNVxgtZnMkn5gfl59JbMapLk5w7UXZ1siObXHGf9zqLl80_hPwQNoYivHJsqxHqvUe-Ko5YBvEGJ6g5vM1xU4S1t0W_rPxkIvlFLZrJwYpXi"
              />
              <div className="absolute inset-0 border-[8px] md:border-[12px] border-white/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}