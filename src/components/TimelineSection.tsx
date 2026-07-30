"use client"

import { useEffect, useRef } from "react"
import { ASSETS } from "@/lib/assets"

function TimelineItem({
  image,
  title,
  description,
  tag,
}: {
  image: string
  title: string
  description: string
  tag?: string
}) {
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -100px 0px" }
    )

    if (itemRef.current) observer.observe(itemRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={itemRef} className="flex flex-col items-center relative reveal-on-scroll">
      <div className="w-full max-w-sm aspect-[9/16] overflow-hidden border border-outline-variant/30 shadow-2xl z-10 bg-white">
        <img alt={title} className="w-full h-full object-cover" src={image} />
      </div>
      <div className="w-full max-w-lg mt-12 text-center px-4">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-4">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">{description}</p>
        {tag && (
          <div className="inline-block">
            <span className="font-label-md text-label-md px-6 py-3 border border-outline uppercase tracking-widest bg-transparent">
              {tag}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TimelineSection() {
  return (
    <section className="relative pt-24 pb-32 max-w-screen-xl mx-auto px-edge-margin-mobile md:px-edge-margin-desktop overflow-x-hidden bg-background">
      {/* Felt texture background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/felt.png')" }}
      />

      {/* Section Header */}
      <header className="text-center mb-24 relative z-10">
        <h2 className="font-headline-xl text-headline-xl text-primary mb-4">
          Linimasa Kisah
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Setiap detail perjalanan cinta Anda dikurasi dengan presisi editorial yang tak tertandingi.
        </p>
      </header>

      {/* Timeline Thread */}
      <div
        className="absolute timeline-line h-[calc(100%-400px)] z-0 top-[350px]"
        style={{
          background: "linear-gradient(to bottom, transparent, #8d4d39 10%, #8d4d39 90%, transparent)",
          width: "1px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      {/* Timeline Items */}
      <div className="relative space-y-32">
        <TimelineItem
          image={ASSETS.timeline.img1}
          title="Undangan Web Premium"
          description="Bukan sekadar penyampai pesan. Kami mengurasi tiap elemen visual demi memberikan kesan pertama yang tak terlupakan bagi tamu Anda."
        />
        <TimelineItem
          image={ASSETS.timeline.img2}
          title="Manajemen RSVP Pintar"
          description="Tinggalkan rumitnya rekap manual di grup percakapan. Seluruh konfirmasi kehadiran terpantau rapi dalam satu dasbor yang intuitif dan elegan."
          tag="Efisiensi Maksimal"
        />
        <TimelineItem
          image={ASSETS.timeline.img3}
          title="QR Check-In Instan"
          description="Cukup satu pemindaian kode. Hadirkan penyambutan tamu yang anggun, modern, dan bebas antrean."
          tag="Modernitas"
        />
      </div>
    </section>
  )
}