"use client"

// Ceriavite design carousel: the wedding landing's auto-sliding shelf, with the
// kids catalogue. One card per design, 5s auto-advance, swipe/scroll on touch.

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
        if (track && card) track.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" })
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
    if (track && card) track.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" })
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
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:px-6 lg:px-12"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((t, i) => (
          <article
            key={t.code}
            className={`w-[74%] shrink-0 snap-center overflow-hidden rounded-2xl border bg-white transition-all duration-500 sm:w-[46%] lg:w-[30%] ${
              i === active ? "border-[#B08A4A]/60 shadow-[0_18px_50px_-24px_rgba(44,42,41,0.45)]" : "border-[#EFE9DD]"
            }`}
          >
            <div className="relative aspect-[9/19] overflow-hidden bg-[#F3EDE1]">
              {t.preview_image_url && (
                <img
                  src={t.preview_image_url}
                  alt={t.name}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-headline-sm text-[15px] leading-tight text-[#1A1817]">{t.name}</h3>
              {t.description && (
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-[#6E6A63]">{t.description}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Link
                  href={`/daftar?template=${encodeURIComponent(t.code)}`}
                  className="rounded-full bg-[#8D4D39] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7A4130]"
                >
                  Pakai desain
                </Link>
                {t.demo_url && (
                  <a
                    href={t.demo_url}
                    className="text-[10px] uppercase tracking-[0.16em] text-[#8D4D39] underline-offset-4 hover:underline"
                  >
                    Pratinjau
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
