import { waLink } from "@/lib/contact"

const WA_MULAI = waLink("Halo Aksaraa Wedding, saya ingin membuat undangan pernikahan digital untuk momen saya.")

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement bar */}
      <div className="w-full bg-[#02110C]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-8 py-1.5 flex items-center justify-center text-center">
          <a
            className="font-label-sm text-label-sm text-[#D2C4B5] hover:text-[#EAC082] transition-colors duration-200 flex items-center gap-1.5 text-center leading-tight"
            href="/templates"
          >
            <span className="sm:hidden">Musim Perayaan 2026. Rilis tema terbaru.</span>
            <span className="hidden sm:inline">Musim Perayaan 2026. Nikmati rilis tema terbaru &amp; manajemen VIP instan.</span>
            <span className="hidden sm:inline text-[#EAC082] font-semibold hover:underline">Pelajari lebih lanjut &gt;</span>
          </a>
        </div>
      </div>
      {/* Main nav */}
      <nav className="w-full bg-[#051711]/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <a className="group flex items-center gap-1.5 focus:outline-none" href="/">
              <span className="font-headline-sm text-headline-sm tracking-tight text-[#D2E7DD] group-hover:text-[#EAC082] transition-colors duration-200">Aksaraa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C29B61] inline-block mb-1"></span>
            </a>
          </div>

          <nav className="hidden xl:flex items-center justify-center gap-7 flex-1">
            <a
              className="font-label-lg text-label-lg text-[#D2C4B5] hover:text-[#D2E7DD] transition-colors duration-200"
              href="https://wedding.aksaraa.com"
            >
              Event
            </a>
            <a className="font-label-lg text-label-lg text-[#D2C4B5] hover:text-[#D2E7DD] transition-colors duration-200" href="/customize">
              Harga
            </a>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button
              aria-label="Pencarian Tema"
              className="text-[#D2C4B5] hover:text-[#D2E7DD] transition-colors duration-200 focus:outline-none flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            <button
              aria-label="Item Tersimpan & Keranjang"
              className="text-[#D2C4B5] hover:text-[#D2E7DD] transition-colors duration-200 focus:outline-none flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
            </button>
            <a
              className="px-3.5 py-1.5 rounded-full bg-[#C29B61] hover:bg-[#EAC082] text-[#051711] font-label-md text-label-md tracking-wider uppercase transition-all duration-200 shadow-[0_0_12px_rgba(194,155,97,0.25)] hover:shadow-[0_0_16px_rgba(194,155,97,0.35)]"
              href={WA_MULAI}
            >
              Mulai
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
