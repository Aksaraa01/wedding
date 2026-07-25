"use client"

import { useState } from "react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen((prev) => !prev)
    document.body.classList.toggle("mobile-menu-open")
  }

  const closeMenu = () => {
    setIsOpen(false)
    document.body.classList.remove("mobile-menu-open")
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/20">
        <div className="flex justify-between items-center w-full px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto py-4 md:py-6">
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-headline-md text-[24px] md:text-headline-md font-normal text-on-surface tracking-tight">
              Aksaraa.Wedding
            </span>
            <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-1.5 md:mt-2" />
          </div>

          <button
            className="md:hidden flex items-center p-2 text-on-surface"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>

          <nav className="hidden md:flex items-center gap-10 font-label-md text-label-md uppercase tracking-widest">
            <div className="group relative">
              <button className="flex items-center gap-1 text-on-surface/70 hover:text-on-surface transition-colors duration-300">
                UNTUK ANDA
                <span className="material-symbols-outlined text-sm">
                  expand_more
                </span>
              </button>
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 mt-4 w-72 bg-white border border-outline-variant/30 shadow-xl py-6 z-50 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="grid grid-cols-1 gap-1">
                  <a
                    className="px-8 py-3 hover:bg-surface-container-low transition-colors font-label-md text-[10px] text-on-surface"
                    href="#"
                  >
                    Premium Web Invitation
                  </a>
                  <a
                    className="px-8 py-3 hover:bg-surface-container-low transition-colors font-label-md text-[10px] text-on-surface"
                    href="#"
                  >
                    QR Code Book &amp; Attendance
                  </a>
                  <a
                    className="px-8 py-3 hover:bg-surface-container-low transition-colors font-label-md text-[10px] text-on-surface"
                    href="#"
                  >
                    Undangan Fisik Premium
                  </a>
                  <a
                    className="px-8 py-3 hover:bg-surface-container-low transition-colors font-label-md text-[10px] text-on-surface"
                    href="#"
                  >
                    Virtual Wish Wall
                  </a>
                  <a
                    className="px-8 py-3 hover:bg-surface-container-low transition-colors font-label-md text-[10px] text-on-surface"
                    href="#"
                  >
                    WhatsApp Blast Resmi
                  </a>
                </div>
              </div>
            </div>
            <a
              className="text-on-surface/70 hover:text-on-surface transition-colors"
              href="#"
            >
              Portofolio
            </a>
            <a
              className="text-on-surface/70 hover:text-on-surface transition-colors"
              href="#"
            >
              Tentang Kami
            </a>
          </nav>

          <div className="hidden md:block">
            <button className="px-8 py-2.5 bg-on-surface text-background font-label-md text-label-md uppercase tracking-widest border border-on-surface hover:bg-secondary hover:border-secondary transition-all duration-500">
              Masuk
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-background transition-transform duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-edge-margin-mobile">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-1">
              <span className="font-headline-md text-[24px] font-normal text-on-surface">
                Aksara.
              </span>
              <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
            </div>
            <button
              className="p-2 text-on-surface"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>
          <nav className="flex flex-col gap-8 mt-12 font-headline-md text-[28px] text-on-surface">
            <a
              className="border-b border-outline-variant/20 pb-4"
              href="#"
              onClick={closeMenu}
            >
              Untuk Anda
            </a>
            <a
              className="border-b border-outline-variant/20 pb-4"
              href="#"
              onClick={closeMenu}
            >
              Portofolio
            </a>
            <a
              className="border-b border-outline-variant/20 pb-4"
              href="#"
              onClick={closeMenu}
            >
              Tentang Kami
            </a>
          </nav>
          <div className="mt-auto flex flex-col gap-6 pb-12">
            <button className="w-full py-5 bg-on-surface text-background font-label-md text-label-md uppercase tracking-widest">
              Masuk
            </button>
            <div className="flex justify-center gap-6">
              <a className="text-on-surface/60 font-label-md uppercase tracking-widest text-[12px]" href="#">
                Instagram
              </a>
              <a className="text-on-surface/60 font-label-md uppercase tracking-widest text-[12px]" href="#">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}