"use client"

import { useState } from "react"
import Link from "next/link"
import type { Article } from "@/data/artikel"
import { categoryStyle } from "@/lib/articleCategory"
import { formatIdDate } from "@/lib/formatDate"

interface ArticleGridProps {
  articles: Article[]
  categories: string[]
}

// App-style feed: compact thumbnail rows on mobile, editorial cards on desktop.
// Every article stays in the DOM (filtering only hides rows) so crawlers see all.
export default function ArticleGrid({ articles, categories }: ArticleGridProps) {
  const [active, setActive] = useState("Semua")
  const isVisible = (a: Article) => active === "Semua" || a.category === active

  return (
    <section className="max-w-container-max mx-auto mb-16 md:px-margin-desktop">
      {categories.length > 1 && (
        <div className="sticky top-20 z-30 border-b border-[#E2D9CF]/70 bg-[#FAF7F2]/95 backdrop-blur-md md:static md:border-0 md:bg-transparent md:backdrop-blur-none">
          <div className="flex gap-1.5 overflow-x-auto px-margin-mobile py-2.5 no-scrollbar md:flex-wrap md:justify-center md:gap-2 md:px-0 md:py-0">
            {["Semua", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors md:px-4 md:py-2 md:text-[11px] ${
                  active === c
                    ? "bg-[#B34E3F] text-white"
                    : "border border-[#E2D9CF] bg-white text-[#2C2A29] active:border-[#B34E3F] md:hover:border-[#B34E3F]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: dense reading-app rows */}
      <div className="mx-margin-mobile mt-1 divide-y divide-[#E2D9CF]/60 overflow-hidden rounded-2xl border border-[#E2D9CF]/70 bg-white md:hidden">
        {articles.map((a) => {
          const style = categoryStyle(a.category)
          return (
            <Link
              key={a.slug}
              href={`/artikel/${a.slug}`}
              className={`${isVisible(a) ? "flex" : "hidden"} items-start gap-3 px-3.5 py-3.5 transition-colors active:bg-[#F7F1E8]`}
            >
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-white/95"
                style={{ background: `linear-gradient(140deg, ${style.from}, ${style.to})` }}
                aria-hidden
              >
                <span className="material-symbols-outlined text-[24px]">{style.icon}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F]">
                  {a.category}
                </span>
                <span className="mt-1 block font-headline-md text-[14.5px] leading-[1.35] text-[#2C2A29]">
                  {a.title}
                </span>
                <span className="mt-1 block line-clamp-2 text-[11.5px] leading-[1.55] text-on-surface-variant">
                  {a.description}
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-on-surface-variant/70">
                  {formatIdDate(a.date)}
                  <span className="h-0.5 w-0.5 rounded-full bg-on-surface-variant/40" />
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">schedule</span>
                    {a.readMinutes} mnt
                  </span>
                </span>
              </span>
              <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant/45" aria-hidden>
                chevron_right
              </span>
            </Link>
          )
        })}
      </div>

      {/* Desktop: card grid */}
      <div className="mx-auto hidden max-w-4xl grid-cols-2 gap-5 md:grid">
        {articles.map((a) => {
          const style = categoryStyle(a.category)
          return (
            <Link
              key={a.slug}
              href={`/artikel/${a.slug}`}
              className={`${isVisible(a) ? "flex" : "hidden"} group flex-col overflow-hidden rounded-2xl border border-[#E2D9CF] bg-white transition-shadow hover:shadow-md`}
            >
              <span
                className="flex h-24 items-end justify-between px-5 pb-3"
                style={{ background: `linear-gradient(140deg, ${style.from}, ${style.to})` }}
                aria-hidden
              >
                <span className="material-symbols-outlined text-[26px] text-white/85">{style.icon}</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
                  {a.readMinutes} mnt baca
                </span>
              </span>
              <span className="flex flex-1 flex-col p-5">
                <span className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F]">
                  {a.category}
                </span>
                <h2 className="font-headline-md text-[18px] leading-snug text-[#2C2A29] group-hover:text-[#B34E3F]">
                  {a.title}
                </h2>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-on-surface-variant">{a.description}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-on-surface-variant/80">
                  {formatIdDate(a.date)}
                </p>
              </span>
            </Link>
          )
        })}
      </div>

      {active !== "Semua" && articles.every((a) => !isVisible(a)) && (
        <p className="text-center text-[12px] text-on-surface-variant">Belum ada artikel pada kategori ini.</p>
      )}
    </section>
  )
}
