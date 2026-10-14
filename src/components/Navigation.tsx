"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const PRODUCTS = [
  { label: "Premium Web Invitation", href: "/premium-web-invitation" },
  { label: "Galeri Template", href: "/templates" },
  { label: "QR dan Digital Buku Tamu", href: "/qr-digital-buku-tamu" },
  { label: "Doa & Harapan Tamu", href: "/virtual-wish-wall" },
  { label: "Galeri Kenangan Tamu", href: "/galeri-kenangan-tamu" },
  { label: "Reminder Tamu VIP", href: "/reminder-tamu-vip" },
  { label: "Artikel", href: "/artikel" },
]

export default function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [showProductsMobile, setShowProductsMobile] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const toggleMenu = () => {
    setIsOpen((prev) => !prev)
    document.body.classList.toggle("mobile-menu-open")
  }

  const closeMenu = () => {
    setIsOpen(false)
    document.body.classList.remove("mobile-menu-open")
  }

  const showComingSoon = (label: string) => {
    setSnackbar(label)
    setTimeout(() => setSnackbar(null), 2000)
  }

  return (
    <>
      {snackbar && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-[#1c1b1e] text-[#f2ca50] px-6 py-4 shadow-2xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out] border border-white/10">
          <span className="material-symbols-outlined text-sm">construction</span>
          <span className="font-label-md text-label-md uppercase tracking-widest">{snackbar} — Coming Soon</span>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
      <header className="fixed top-0 w-full z-50 bg-[#131315]/90 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display-lg text-2xl tracking-tighter text-[#f2ca50]">
              WEDDING.AKSAR<span className="italic font-normal">AA</span>
            </span>
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
            <button
              onClick={() => showComingSoon("Portofolio")}
              className="font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
            >
              Portofolio
            </button>
            <button
              onClick={() => showComingSoon("Tentang Kami")}
              className="font-label-md text-label-md uppercase tracking-widest text-[#e5e1e4] hover:text-[#f2ca50] transition-colors"
            >
              Tentang Kami
            </button>
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
            <span className="font-display-lg text-xl tracking-tighter text-[#f2ca50]">
              WEDDING.AKSAR<span className="italic font-normal">AA</span>
            </span>
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
            <button
              className="border-b border-white/10 pb-4 text-left"
              onClick={() => { closeMenu(); showComingSoon("Portofolio") }}
            >
              Portofolio
            </button>
            <button
              className="border-b border-white/10 pb-4 text-left"
              onClick={() => { closeMenu(); showComingSoon("Tentang Kami") }}
            >
              Tentang Kami
            </button>
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
