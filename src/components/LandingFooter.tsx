export default function LandingFooter() {
  return (
    <footer className="relative z-10 w-full border-t border-[#EFE9DD] bg-white pb-10 pt-12 text-left md:pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-8 border-b border-[#F0EAE0] pb-10 md:grid-cols-2 md:gap-10 lg:grid-cols-5">
          <div className="space-y-3.5 lg:col-span-2">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm tracking-tight text-[#1A1817]">Aksaraa</span>
              <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
            </div>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-[#6E6A63] md:text-body-md">
              Platform manajemen resepsi, undangan sinematik, dan buku tamu VIP untuk perayaan istimewa Anda.
            </p>
            <div className="space-y-2 pt-1">
              <a className="flex items-center gap-2.5 text-[12.5px] text-[#3B3833] transition-colors hover:text-[#8D4D39]" href="mailto:askaraa.mini@gmail.com">
                <span className="material-symbols-outlined text-[17px] text-[#B08A4A]">mail</span>
                <span>askaraa.mini@gmail.com</span>
              </a>
              <a className="flex items-center gap-2.5 text-[12.5px] text-[#3B3833] transition-colors hover:text-[#8D4D39]" href="https://wa.me/6281161613071" rel="noopener noreferrer" target="_blank">
                <span className="material-symbols-outlined text-[17px] text-[#2F6B54]">chat</span>
                <span>+62 811-6161-3071 (WhatsApp)</span>
              </a>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D4D39] md:text-label-md">Layanan &amp; Fitur</p>
            <ul className="space-y-1.5 text-[12.5px] text-[#6E6A63] md:text-body-sm">
              <li><a className="transition-colors hover:text-[#1A1817]" href="#fitur-utama">Undangan Digital Sinematik</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#fitur-utama">QR Pass &amp; Check-In Kilat</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#fitur-utama">Manajemen RSVP &amp; Kuota</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#fitur-utama">Live Candid Photo Stream</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D4D39] md:text-label-md">Koleksi Acara</p>
            <ul className="space-y-1.5 text-[12.5px] text-[#6E6A63] md:text-body-sm">
              <li><a className="transition-colors hover:text-[#1A1817]" href="#koleksi-acara">Pernikahan &amp; Ngunduh Mantu</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#koleksi-acara">Sweet 17 &amp; Ulang Tahun</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#koleksi-acara">Khitanan &amp; Aqiqah</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#koleksi-acara">Corporate &amp; Gala Dinner</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="#koleksi-acara">Anniversary &amp; Perayaan</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D4D39] md:text-label-md">Jelajahi</p>
            <ul className="space-y-1.5 text-[12.5px] text-[#6E6A63] md:text-body-sm">
              <li><a className="transition-colors hover:text-[#1A1817]" href="/templates">Galeri Template</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="/customize">Harga &amp; Paket</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="/artikel">Artikel &amp; Panduan</a></li>
              <li><a className="transition-colors hover:text-[#1A1817]" href="https://wedding.aksaraa.com">Aksaraa Wedding</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[11px] text-[#8A847A] md:flex-row md:text-body-sm">
          <p>© 2026 Aksaraa Master Suite. Seluruh hak cipta dilindungi.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a className="transition-colors hover:text-[#1A1817]" href="#">Kebijakan Privasi</a>
            <a className="transition-colors hover:text-[#1A1817]" href="#">Syarat Layanan</a>
            <a className="transition-colors hover:text-[#1A1817]" href="https://wa.me/6281161613071" rel="noopener noreferrer" target="_blank">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
