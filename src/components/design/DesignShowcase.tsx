"use client"

import { useEffect, useState } from "react"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import {
  designAlt,
  designDescription,
  splitDesignTitle,
  type DesignTemplate,
} from "@/lib/designCatalogue"

const SLIDE_MS = 9000

const SLIDE_BG = [
  "radial-gradient(46% 66% at 74% 38%, #f9dbe6 0, transparent 72%), radial-gradient(40% 50% at 58% 78%, #dfeadb 0, transparent 70%), linear-gradient(180deg, #fbf6f4, #FAF7F2)",
  "radial-gradient(46% 66% at 74% 38%, #d9ead0 0, transparent 72%), radial-gradient(40% 50% at 58% 78%, #d6e9f2 0, transparent 70%), linear-gradient(180deg, #f6faf3, #FAF7F2)",
  "radial-gradient(46% 66% at 74% 38%, #f3e2c6 0, transparent 72%), radial-gradient(40% 50% at 58% 78%, #ecdff0 0, transparent 70%), linear-gradient(180deg, #fcf7f0, #FAF7F2)",
]

// The "sorotan" carousel: one featured design at a time, its own screenshot as
// a trio of phone plates (centre full height, neighbours tilted behind), the
// serif name split like the reference, and a progress bar per slide.
export default function DesignShowcase({ items }: { items: DesignTemplate[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [preview, setPreview] = useState<DesignTemplate | null>(null)

  const slides = items.filter((t) => t.preview_image_url)
  const total = slides.length

  useEffect(() => {
    if (total < 2 || paused) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % total), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, paused, total])

  if (total === 0) return null

  const active = slides[Math.min(index, total - 1)]
  const { head, script } = splitDesignTitle(active.name)
  const tier = (active.tier || "").trim()
  const tags = [active.category, "Undangan Digital"].filter(Boolean).join(" · ")

  return (
    <>
    <section
      aria-roledescription="carousel"
      aria-label="Desain sorotan"
      className="relative isolate overflow-hidden border-b border-[#EFE9DD]"
      style={{ background: SLIDE_BG[index % SLIDE_BG.length] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #8D4D39 1px, transparent 1.4px), radial-gradient(circle at 9px 9px, #8D4D39 1px, transparent 1.4px)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(60% 80% at 12% 40%, #000 0, transparent 78%)",
          WebkitMaskImage: "radial-gradient(60% 80% at 12% 40%, #000 0, transparent 78%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1760px] items-center gap-4 px-4 pb-9 pt-7 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] md:gap-6 md:px-10 md:pb-16 md:pt-12 lg:px-16">
        <div key={active.id} className="order-2 md:order-1" style={{ animation: "design-fade .7s ease both" }}>
          <p className="flex flex-wrap items-center gap-2.5 text-[12px] font-semibold text-[#6E6A63]">
            <span className="inline-flex h-6 items-center rounded-[5px] bg-[#B34E3F] px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">
              Desain {tier || "Pilihan"}
            </span>
            <span>{tags}</span>
          </p>

          <p className="mt-3 font-[family-name:var(--font-playfair)] text-[2.6rem] font-semibold leading-[0.95] tracking-[-0.02em] text-[#1A1817] sm:text-[3.2rem] md:text-[clamp(3.1rem,5.4vw,5rem)]">
            {head}
            {script && (
              <span className="mt-0.5 block pl-[0.45em] font-[family-name:var(--font-cormorant)] text-[0.62em] font-semibold italic leading-[1.1] text-[#8D4D39]">
                {script}
              </span>
            )}
          </p>

          <p className="mt-3 max-w-[44ch] text-[13.5px] leading-[1.6] text-[#6E6A63] md:mt-4 md:text-[15.5px]">
            {designDescription(active)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 md:mt-6 md:gap-2.5">
            <button
              type="button"
              onClick={() => setPreview(active)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1A1817] pl-5 pr-2 text-[12.5px] font-bold text-white transition-colors hover:bg-[#8D4D39] md:h-12 md:pl-6 md:text-[13.5px]"
            >
              Coba langsung
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </span>
            </button>
            <a
              href={active.select_href}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#DCD2C2] bg-white/80 px-4 text-[12.5px] font-bold text-[#1A1817] transition-colors hover:border-[#1A1817] md:h-12 md:px-5 md:text-[13.5px]"
            >
              Pilih desain
            </a>
          </div>

          {total > 1 && (
            <div className="mt-5 flex items-center gap-2 md:mt-6" role="group" aria-label="Pilih desain sorotan">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Tampilkan ${slide.name}`}
                  aria-pressed={i === index}
                  className="group flex h-8 items-center"
                >
                  <span className="relative block h-[3px] w-9 overflow-hidden rounded-full bg-[#1A1817]/15 transition-colors group-hover:bg-[#1A1817]/30 md:w-11">
                    {i === index && (
                      <span
                        key={`${slide.id}-${index}`}
                        className="absolute inset-y-0 left-0 block rounded-full bg-[#8D4D39]"
                        style={{
                          animation: `design-progress ${SLIDE_MS}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="order-1 flex h-[260px] items-end justify-center sm:h-[330px] md:order-2 md:h-[470px] lg:h-[540px]">
          <div key={active.id} className="relative h-full w-full max-w-[560px]" style={{ animation: "design-fade .8s ease both" }}>
            {[
              { cls: "left-[4%] bottom-[9%] z-10 h-[74%] -rotate-6", position: "50% 18%" },
              { cls: "right-[4%] bottom-[9%] z-10 h-[74%] rotate-6", position: "50% 45%" },
              { cls: "left-1/2 bottom-0 z-20 h-[94%] -translate-x-1/2", position: "50% 0%" },
            ].map(({ cls, position }, i) => (
              <span
                key={`${active.id}-${i}`}
                className={`absolute overflow-hidden rounded-[22px] border-[5px] border-white bg-[#EFE9DD] shadow-[0_34px_60px_-26px_rgba(110,24,44,0.42),0_0_0_1px_rgba(27,20,22,0.06)] ${cls}`}
                style={{ aspectRatio: "480 / 1039" }}
              >
                {active.preview_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.preview_image_url}
                    alt={i === 2 ? designAlt(active) : ""}
                    aria-hidden={i === 2 ? undefined : "true"}
                    loading="eager"
                    decoding="async"
                    style={{ objectPosition: position }}
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {preview && (
        <TemplatePreviewModal
          name={preview.name}
          demoUrl={preview.preview_url}
          selectHref={preview.select_href}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
    </>
  )
}
