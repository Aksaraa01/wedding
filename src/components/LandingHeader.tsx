"use client"

import { useState } from "react"
import { waLink } from "@/lib/contact"

const WA_MULAI = waLink("Halo Aksaraa Wedding, saya ingin membuat undangan pernikahan digital untuk momen saya.")

const MOBILE_LINKS = [
  { label: "Event", href: "https://wedding.aksaraa.com" },
  { label: "Harga", href: "/customize" },
  { label: "Template", href: "/templates" },
  { label: "Artikel", href: "/artikel" },
  { label: "Konsultasi", href: waLink("Halo Aksaraa Wedding, saya ingin berkonsultasi.") },
]

export default function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      {/* Announcement bar */}
      <div className="w-full border-b border-[#EFE9DD] bg-[#F8F3E9]">
        <div className="mx-auto flex min-h-8 max-w-7xl items-center justify-center px-4 py-1.5 text-center sm:px-6">
          <a
            className="flex items-center gap-1.5 text-center font-label-sm text-label-sm leading-tight text-[#6E6A63] transition-colors duration-200 hover:text-[#8D4D39]"
            href="/templates"
          >
            <span className="sm:hidden">Musim Perayaan 2026. Rilis tema terbaru.</span>
            <span className="hidden sm:inline">Musim Perayaan 2026. Nikmati rilis tema terbaru &amp; manajemen VIP instan.</span>
            <span className="hidden font-semibold text-[#8D4D39] hover:underline sm:inline">Pelajari lebih lanjut &gt;</span>
          </a>
        </div>
      </div>

      {/* Main nav */}
      <nav className="w-full border-b border-[#EFE9DD] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-12">
          <div className="flex shrink-0 items-center gap-6">
            <a className="group flex items-center gap-1.5 focus:outline-none" href="/">
              <span className="font-headline-sm text-headline-sm tracking-tight text-[#1A1817] transition-colors duration-200 group-hover:text-[#8D4D39]">Aksaraa</span>
              <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]"></span>
            </a>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            <a
              className="font-label-lg text-label-lg text-[#6E6A63] transition-colors duration-200 hover:text-[#1A1817]"
              href="https://wedding.aksaraa.com"
            >
              Event
            </a>
            <a className="font-label-lg text-label-lg text-[#6E6A63] transition-colors duration-200 hover:text-[#1A1817]" href="/customize">
              Harga
            </a>
            <a className="font-label-lg text-label-lg text-[#6E6A63] transition-colors duration-200 hover:text-[#1A1817]" href="/templates">
              Template
            </a>
            <a className="font-label-lg text-label-lg text-[#6E6A63] transition-colors duration-200 hover:text-[#1A1817]" href="/artikel">
              Artikel
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button
              aria-label="Pencarian Tema"
              className="hidden items-center justify-center text-[#6E6A63] transition-colors duration-200 hover:text-[#1A1817] focus:outline-none sm:flex"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            <a
              className="rounded-full bg-[#1A1817] px-3.5 py-1.5 font-label-md text-label-md uppercase tracking-wider text-white transition-colors duration-200 hover:bg-[#8D4D39]"
              href={WA_MULAI}
            >
              Mulai
            </a>
            <button
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center justify-center text-[#1A1817] lg:hidden"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">{open ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="landing-mobile-menu"
          className={`overflow-hidden border-t border-[#F0EAE0] bg-white transition-[max-height,opacity] duration-300 lg:hidden ${
            open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="mx-auto max-w-7xl px-5 py-2">
            {MOBILE_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-[#F4EEE4] py-3 text-[15px] font-medium text-[#1A1817] last:border-0"
              >
                {link.label}
                <span className="material-symbols-outlined text-[16px] text-[#A39B8E]">chevron_right</span>
              </a>
            ))}
          </nav>
        </div>
      </nav>
    </header>
  )
}
