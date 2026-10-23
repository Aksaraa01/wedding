"use client"

import { useState } from "react"
import Link from "next/link"
import type { Article } from "@/data/artikel"
import { formatIdDate } from "@/lib/formatDate"

interface ArticleGridProps {
  articles: Article[]
  categories: string[]
}

// Client-side category filter (all cards stay in the HTML for SEO;
// filtering only hides them).
export default function ArticleGrid({ articles, categories }: ArticleGridProps) {
  const [active, setActive] = useState("Semua")
  const visible = active === "Semua" ? articles : articles.filter((a) => a.category === active)

  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
      {categories.length > 1 && (
        <div className="-mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 mb-7 md:mb-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 md:flex-wrap md:justify-center md:overflow-visible md:snap-none">
            {["Semua", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`shrink-0 snap-start px-4 py-2.5 md:py-2 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-colors ${
                  active === c
                    ? "bg-[#B34E3F] text-white"
                    : "bg-white text-[#2C2A29] border border-[#E2D9CF] active:border-[#B34E3F] md:hover:border-[#B34E3F]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {visible.map((a) => (
          <Link
            key={a.slug}
            href={`/artikel/${a.slug}`}
            className="group bg-white border border-[#E2D9CF] rounded-2xl p-5 md:p-8 active:scale-[0.99] hover:shadow-md transition-all flex flex-col"
          >
            <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-2">
              {a.category}
            </p>
            <h2 className="font-headline-md text-base md:text-xl text-[#2C2A29] group-hover:text-[#B34E3F] leading-snug">
              {a.title}
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed flex-1">{a.description}</p>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mt-4">
              {formatIdDate(a.date)} • {a.readMinutes} mnt baca
            </p>
          </Link>
        ))}
      </div>
      {visible.length === 0 && (
        <p className="text-center text-sm text-on-surface-variant">Belum ada artikel pada kategori ini.</p>
      )}
    </section>
  )
}
