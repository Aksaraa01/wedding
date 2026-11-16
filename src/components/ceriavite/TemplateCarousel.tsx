"use client"

// Ceriavite design carousel, built to the wedding landing's card shape:
// landscape cards (420/460/500 tall), image covered, gradient at the bottom,
// name + one-line description + two actions (Lihat / Pilih). Auto-advances.

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export type CarouselTemplate = {
  code: string
  name: string
  description?: string | null
  preview_image_url?: string | null
  demo_url?: string | null
}

export default function TemplateCarousel({ items }: { items: CarouselTemplate[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    if (items.length < 2) return
    const id = window.setInterval(() => {
      if (paused.current) return
      setActive((current) => {
        const next = (current + 1) % items.length
        const track = trackRef.current
        const card = track?.children[next] as HTMLElement | undefined
        if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" })
        return next
      })
    }, 5000)
    return () => window.clearInterval(id)
  }, [items.length])

  if (items.length === 0) return null

  const goTo = (i: number) => {
    setActive(i)
    const track = trackRef.current
    const card = track?.children[i] as HTMLElement | undefined
    if (track && card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" })
  }

  return (
    <div
      className="relative"
      onPointerDown={() => { paused.current = true }}
      onPointerUp={() => { paused.current = false }}
      onPointerLeave={() => { paused.current = false }}
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 pt-1 md:gap-6"
        style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((t, i) => (
          <article
            key={t.code}
            className="group relative flex h-[420px] w-[86vw] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-3xl border border-black/5 p-5 shadow-[0_30px_60px_-30px_rgba(26,24,23,0.45)] sm:h-[460px] sm:w-[640px] sm:p-9 lg:h-[500px] lg:w-[820px] lg:p-12"
            style={{ scrollSnapAlign: "center" }}
          >
            {t.preview_image_url && (
              <img
                src={t.preview_image_url}
                alt={t.name}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1512]/95 via-[#0B1512]/45 to-black/10" />

            <div className="relative z-10 max-w-2xl space-y-2.5 sm:space-y-3">
              <span className="inline-block rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                Undangan acara anak
              </span>
              <h3 className="font-headline-lg text-[22px] leading-tight text-white sm:text-[30px] lg:text-[34px]">
                {t.name}
              </h3>
              {t.description && (
                <p className="max-w-xl text-[12px] leading-relaxed text-white/80 sm:text-[14px]">
                  {t.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2.5 pt-1.5 sm:gap-3">
                {t.demo_url && (
                  <a
                    href={t.demo_url}
                    className="inline-flex items-center justify-center rounded-full border border-white/45 bg-white/10 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    Lihat
                  </a>
                )}
                <Link
                  href={`/daftar?template=${encodeURIComponent(t.code)}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#8D4D39] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7A4130]"
                >
                  Pilih
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {items.map((t, i) => (
            <button
              key={t.code}
              type="button"
              aria-label={`Lihat desain ${t.name}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-[#8D4D39]" : "w-1.5 bg-[#CFC6B6]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
