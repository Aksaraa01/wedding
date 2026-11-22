"use client"

import { useState } from "react"
import Link from "next/link"
import { siteOrigin } from "@/lib/site"

const LINKS = [
  { label: "Beranda", href: "/landing" },
  { label: "Desain", href: "/", current: true },
  { label: "Harga", href: "/customize" },
  { label: "Artikel", href: "/artikel" },
  { label: "Aksaraa Wedding", href: siteOrigin() },
  { label: "Ceriavite", href: "https://ceriavite.aksaraa.com" },
]

// The umbrella site header. `aksaraa.com/` is the design catalogue, so "Desain"
// is the current page and the old marketing landing stays at /landing.
export default function DesignHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#EFE9DD] bg-[#FAF7F2]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1760px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 xl:px-16">
        <Link href="/" className="group flex shrink-0 items-center gap-1.5 focus:outline-none">
          <span className="font-headline-sm text-headline-sm tracking-tight text-[#1A1817] transition-colors duration-200 group-hover:text-[#8D4D39]">
            Aksaraa
          </span>
          <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden flex-1 items-center justify-center gap-6 xl:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className={`font-label-lg text-[12.5px] transition-colors duration-200 hover:text-[#1A1817] ${
                link.current ? "font-semibold text-[#1A1817]" : "text-[#6E6A63]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/register"
            className="rounded-full bg-[#8D4D39] px-3.5 py-1.5 font-label-md text-[10px] uppercase tracking-wider text-white transition-colors duration-200 hover:bg-[#7A4130] sm:px-4 sm:text-[11px]"
          >
            Buat undangan
          </Link>
          <button
            type="button"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="design-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#1A1817] transition-colors hover:bg-[#F0EAE0] xl:hidden"
          >
            <span className="material-symbols-outlined text-[22px]">{open ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      <div
        id="design-mobile-menu"
        className={`overflow-hidden border-t border-[#F0EAE0] bg-[#FAF7F2] transition-[max-height,opacity] duration-300 xl:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Navigasi seluler" className="mx-auto max-w-[1760px] px-4 py-1 sm:px-6">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={link.current ? "page" : undefined}
              className="flex items-center justify-between border-b border-[#F4EEE4] py-3 text-[14px] text-[#1A1817] last:border-0"
            >
              {link.label}
              <span className="material-symbols-outlined text-[16px] text-[#A39B8E]">chevron_right</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
