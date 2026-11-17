"use client"

import { useState } from "react"
import { designAlt, type DesignTemplate } from "@/lib/designCatalogue"

const TIER_COLOR: Record<string, string> = {
  Baru: "text-[#0F8A62]",
  Populer: "text-[#A87A2E]",
  Signature: "text-[#B34E3F]",
}

export interface DesignCardProps {
  template: DesignTemplate
  /** Present on the "Top 10 Populer" shelf: the big outlined rank behind the plate. */
  rank?: number | null
  onOpen: () => void
}

// One catalogue card. The plate shows the template's own 9:19 screenshot at the
// top of the frame; on hover a pair of pills offers the preview and the
// registration CTA without leaving the grid.
export default function DesignCard({ template, rank = null, onOpen }: DesignCardProps) {
  const ranked = typeof rank === "number" && rank > 0
  const style = (template.category || "").trim()
  const tier = (template.tier || "").trim()
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(template.preview_image_url) && !broken

  return (
    <article className="group relative min-w-0">
      <div className="flex items-start">
        {ranked && (
          <span
            aria-hidden="true"
            className="pointer-events-none w-[24%] shrink-0 select-none pt-1 text-right font-[family-name:var(--font-playfair)] text-[3rem] font-semibold leading-[0.7] tracking-[-0.06em] text-[#F1DFE3] [-webkit-text-stroke:1.5px_rgba(26,24,23,0.28)] lg:pt-2 lg:text-[4.75rem]"
          >
            {rank}
          </span>
        )}

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Lihat pratinjau ${template.name}`}
            className="block w-full rounded-[15px] bg-[#EFE9E1] p-1.5 text-left ring-1 ring-black/[0.05] transition-shadow duration-300 hover:shadow-[0_18px_34px_-24px_rgba(44,42,41,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34E3F]"
          >
            <span className="block aspect-[9/19] overflow-hidden rounded-[10px] bg-[#EBE6E3] ring-1 ring-black/[0.06]">
              {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.preview_image_url || ""}
                  alt={designAlt(template)}
                  loading={ranked && rank !== null && rank <= 2 ? "eager" : "lazy"}
                  decoding="async"
                  onError={() => setBroken(true)}
                  ref={(el) => {
                    // A server-rendered <img> can finish (and fail) before React
                    // attaches onError, so the plate would keep a broken icon.
                    if (el?.complete && el.naturalWidth === 0) setBroken(true)
                  }}
                  className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <span className="flex h-full items-center justify-center px-3 text-center font-headline-md text-[13px] leading-snug text-[#2C2A29]">
                  {template.name}
                </span>
              )}
            </span>
          </button>

          <div className="pointer-events-none absolute inset-x-2 bottom-[8%] z-20 hidden items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 rounded-full bg-white/95 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#1A1817] shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              Lihat
            </button>
            <a
              href={template.select_href}
              className="flex-1 rounded-full bg-[#8D4D39] py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#7A4130]"
            >
              Pilih
            </a>
          </div>
        </div>
      </div>

      <p className="mt-2 truncate text-[12.5px] font-bold leading-tight text-[#1A1817] lg:text-[13.5px]">{template.name}</p>
      <p className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-[10.5px] font-semibold text-[#8B857C]">
        {tier && <span className={TIER_COLOR[tier] || "text-[#6E6A63]"}>{tier}</span>}
        {tier && style && <span aria-hidden="true">·</span>}
        {style && <span className="truncate">{style}</span>}
      </p>
    </article>
  )
}
