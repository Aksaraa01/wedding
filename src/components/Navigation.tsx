"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const PRODUCTS = [
  { label: "Premium Web Invitation", href: "/premium-web-invitation" },
  { label: "QR dan Digital Buku Tamu", href: "/qr-digital-buku-tamu" },
  { label: "Doa & Harapan Tamu", href: "/virtual-wish-wall" },
  { label: "Galeri Kenangan Tamu", href: "/galeri-kenangan-tamu" },
  { label: "Reminder Tamu VIP", href: "/reminder-tamu-vip" },
]

const TOOLS = [
  { label: "Kalkulator Budget", href: "/kalkulator-budget" },
  { label: "Checklist Nikah", href: "/checklist-nikah" },
]

export default function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [showProductsMobile, setShowProductsMobile] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showToolsMobile, setShowToolsMobile] = useState(false)

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
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
      <header className="fixed top-0 w-full z-50 bg-[#131315]/90 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/hero" aria-label="Aksaraa Wedding, Beranda" className="flex items-center gap-2">
              <span className="font-display-lg text-2xl tracking-tighter text-[#f2ca50]">
                WEDDING.AKSAR<span className="italic font-normal">AA</span>
              </span>
            </a>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <div className="group relative">
              <button
                onClick={() => setShowProducts((prev) => !prev)}
                className="flex items-center gap-1 font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
              >
                Fitur Utama
                <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{ transform: showProducts ? "rotate(180deg)" : "rotate(0deg)" }}>
                  expand_more
                </span>
              </button>
              <div
                className={`absolute top-full left-0 mt-4 w-72 bg-[#1c1b1e] border border-white/10 shadow-2xl py-4 transition-all duration-300 origin-top-left ${
                  showProducts ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-2 invisible"
                }`}
              >
                {PRODUCTS.map((p) => (
                  <a
                    key={p.label}
                    href={p.href}
                    className="block px-6 py-3 hover:bg-[#2a2a2c] transition-colors font-label-md text-[10px] uppercase tracking-wider text-[#d0c5af] hover:text-[#f2ca50]"
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </div>
            <a
              href="/portofolio"
              className="font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
            >
              Portofolio
            </a>
            <a
              href="/artikel"
              className="font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
            >
              Artikel
            </a>
            <a
              href="/templates"
              className="font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
            >
              Template
            </a>
            <div className="group relative">
              <button
                onClick={() => setShowTools((prev) => !prev)}
                className="flex items-center gap-1 font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
              >
                Tools
                <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{ transform: showTools ? "rotate(180deg)" : "rotate(0deg)" }}>
                  expand_more
                </span>
              </button>
              <div
                className={`absolute top-full left-0 mt-4 w-72 bg-[#1c1b1e] border border-white/10 shadow-2xl py-4 transition-all duration-300 origin-top-left ${
                  showTools ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-2 invisible"
                }`}
              >
                {TOOLS.map((t) => (
                  <a
                    key={t.label}
                    href={t.href}
                    className="block px-6 py-3 hover:bg-[#2a2a2c] transition-colors font-label-md text-[10px] uppercase tracking-wider text-[#d0c5af] hover:text-[#f2ca50]"
                  >
                    {t.label}
                  </a>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 border border-[#f2ca50]/30 rounded-full font-label-md text-label-md uppercase tracking-widest text-[#f2ca50] hover:bg-[#f2ca50] hover:text-[#3c2f00] transition-all duration-300"
            >
              Masuk
            </button>
          </div>

          <button
            className="md:hidden text-[#e5e1e4] p-1"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-[#131315] transition-transform duration-[0.4s] ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-edge-margin-mobile">
          <div className="flex justify-between items-center py-4">
            <a href="/hero" aria-label="Aksaraa Wedding, Beranda" onClick={closeMenu} className="font-display-lg text-xl tracking-tighter text-[#f2ca50]">
              WEDDING.AKSAR<span className="italic font-normal">AA</span>
            </a>
            <button className="p-2 text-[#e5e1e4]" onClick={closeMenu} aria-label="Close menu">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>
          <nav className="flex flex-col gap-6 mt-8 font-headline-md text-[20px] text-[#e5e1e4]">
            <div className="border-b border-white/10 pb-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowProductsMobile(!showProductsMobile)}
              >
                <span>Fitur Utama</span>
                <span className="material-symbols-outlined text-2xl transition-transform duration-300" style={{ transform: showProductsMobile ? "rotate(180deg)" : "rotate(0deg)" }}>
                  expand_more
                </span>
              </button>
              {showProductsMobile && (
                <div className="mt-4 flex flex-col gap-1">
                  {PRODUCTS.map((p) => (
                    <a
                      key={p.label}
                      href={p.href}
                      onClick={closeMenu}
                      className="block pl-4 py-3 font-headline-md text-lg text-[#d0c5af] hover:text-[#f2ca50] transition-colors"
                    >
                      {p.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a
              href="/artikel"
              onClick={closeMenu}
              className="border-b border-white/10 pb-4 text-left"
            >
              Artikel
            </a>
            <a
              href="/templates"
              onClick={closeMenu}
              className="border-b border-white/10 pb-4 text-left"
            >
              Template
            </a>
            <a
              href="/portofolio"
              onClick={closeMenu}
              className="border-b border-white/10 pb-4 text-left"
            >
              Portofolio
            </a>
            <div className="border-b border-white/10 pb-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowToolsMobile(!showToolsMobile)}
              >
                <span>Tools</span>
                <span className="material-symbols-outlined text-2xl transition-transform duration-300" style={{ transform: showToolsMobile ? "rotate(180deg)" : "rotate(0deg)" }}>
                  expand_more
                </span>
              </button>
              {showToolsMobile && (
                <div className="mt-4 flex flex-col gap-1">
                  {TOOLS.map((t) => (
                    <a
                      key={t.label}
                      href={t.href}
                      onClick={closeMenu}
                      className="block pl-4 py-3 font-headline-md text-lg text-[#d0c5af] hover:text-[#f2ca50] transition-colors"
                    >
                      {t.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>
          <div className="mt-auto pb-12">
            <button
              onClick={() => { closeMenu(); router.push("/login") }}
              className="w-full py-4 border border-[#f2ca50]/30 rounded-full text-[#f2ca50] font-label-md text-label-md uppercase tracking-widest"
            >
              Masuk
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
