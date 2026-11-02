"use client"

import Link from "next/link"
import { normalizeTemplateTier } from "@/lib/templateTier"
import type { GalleryTemplate } from "@/lib/templateGallery"

// A single design tile, shaped like the reference gallery: the screenshot sits
// on a warm "shelf" card (a phone floating on a beige plate) with the name and
// tier underneath, and the ranked variant tucks a big outlined number behind
// the plate's left edge.

const TIER_TEXT: Record<string, string> = {
  Baru: "text-[#0F8A62]",
  Populer: "text-[#B08A3E]",
  Signature: "text-[#B34E3F]",
}

export interface TemplateTileProps {
  template: GalleryTemplate
  size?: "lg" | "md"
  rank?: number | null
  /** Fills its grid cell instead of a fixed shelf width. */
  fluid?: boolean
  /** Public surfaces link out; interactive ones pass onOpen/onSelect instead. */
  href?: string | null
  onOpen?: () => void
  onSelect?: () => void
  selectHref?: string | null
  selectLabel?: string
  selectDisabled?: boolean
  active?: boolean
  locked?: boolean
  showActions?: boolean
  tourOpen?: string
  tourSelect?: string
  eager?: boolean
}

export default function TemplateTile({
  template,
  size = "md",
  rank = null,
  fluid = false,
  href = null,
  onOpen,
  onSelect,
  selectHref = null,
  selectLabel = "Pilih",
  selectDisabled = false,
  active = false,
  locked = false,
  showActions = false,
  tourOpen,
  tourSelect,
  eager = false,
}: TemplateTileProps) {
  const tier = normalizeTemplateTier(template.tier)
  const styleTag = (template.category || "Modern").trim()
  const ranked = typeof rank === "number" && rank > 0

  const width = fluid
    ? "w-full"
    : ranked
      ? "w-[68vw] max-w-[268px] lg:w-[264px]"
      : size === "lg"
        ? "w-[56vw] max-w-[220px] lg:w-[220px]"
        : "w-[42vw] max-w-[180px] lg:w-[196px]"

  return (
    <article className={`group flex shrink-0 snap-start flex-col ${width}`}>
      <div className="relative">
        {ranked && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-9 left-0 z-0 select-none font-headline-lg text-[88px] leading-[0.66] text-transparent [-webkit-text-stroke:2px_rgba(179,78,63,0.30)] lg:text-[162px]"
          >
            {rank}
          </span>
        )}

        <div className={`relative z-10 ${ranked ? "ml-8 lg:ml-12" : ""}`}>
          <div className="relative">
            <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-b from-[#F3F0E9] via-[#E9E5DC] to-[#DAD6CC] p-2.5 ring-1 ring-black/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_36px_-26px_rgba(44,42,41,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1">
              <div className="aspect-[9/19] overflow-hidden rounded-[10px] bg-[#FBF9F5] ring-1 ring-black/10 shadow-[0_14px_28px_-14px_rgba(0,0,0,0.5)]">
                {template.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Template undangan pernikahan digital ${template.name}`}
                    src={template.preview_image_url}
                    loading={eager ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-3 text-center font-headline-md text-[13px] leading-snug text-[#2C2A29]">
                    {template.name}
                  </span>
                )}
              </div>

              {active && (
                <span className="pointer-events-none absolute left-2.5 top-2.5 z-20 rounded-full bg-[#10B981] px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-white shadow-sm">
                  Active
                </span>
              )}
              {locked && (
                <span className="pointer-events-none absolute right-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-[#B34E3F] px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-white shadow-sm">
                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                  Premium
                </span>
              )}
            </div>

            {onOpen ? (
              <button
                type="button"
                onClick={onOpen}
                data-tour={tourOpen}
                aria-label={`Lihat pratinjau ${template.name}`}
                className="absolute inset-0 z-10 cursor-pointer rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34E3F]"
              />
            ) : href ? (
              <Link
                href={href}
                aria-label={`Lihat pratinjau ${template.name}`}
                className="absolute inset-0 z-10 rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34E3F]"
              />
            ) : null}

            {!showActions && (onOpen || selectHref) && (
              <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 z-20 hidden items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:flex">
                {onOpen && (
                  <button
                    type="button"
                    onClick={onOpen}
                    className="flex-1 rounded-full bg-white/95 py-2.5 text-center font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29] shadow-sm backdrop-blur transition-colors hover:bg-white"
                  >
                    Lihat
                  </button>
                )}
                {selectHref && (
                  <Link
                    href={selectHref}
                    className="flex-1 rounded-full bg-[#B34E3F] py-2.5 text-center font-label-md text-[10px] uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#9E3B2D]"
                  >
                    {selectLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="mt-3 font-headline-md text-[13px] leading-snug text-[#2C2A29] lg:text-[15px]">
        {template.name}
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] lg:text-[11px]">
        {tier && <span className={`font-semibold ${TIER_TEXT[tier] || "text-[#2C2A29]"}`}>{tier}</span>}
        <span className="text-[#8A827B]">{styleTag}</span>
        {template.no_photo && <span className="text-[#8A827B]">· Tanpa Foto</span>}
      </p>

      {showActions && (
        <div className="mt-2.5 flex gap-1.5">
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 rounded-full border border-[#E2D9CF] bg-[#F5EFE6] py-2 font-label-md text-[9px] uppercase tracking-widest text-[#2C2A29] transition-colors hover:bg-[#E2D9CF]"
            >
              Lihat
            </button>
          )}
          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              disabled={selectDisabled}
              data-tour={tourSelect}
              className="flex-1 rounded-full border border-[#B34E3F] bg-[#B34E3F] py-2 font-label-md text-[9px] uppercase tracking-widest text-white transition-colors hover:bg-[#9E3B2D] disabled:opacity-70"
            >
              {selectLabel}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
