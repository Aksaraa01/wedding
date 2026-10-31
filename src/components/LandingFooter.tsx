export default function LandingFooter() {
  return (
    <footer className="w-full bg-[#02110C]/95 backdrop-blur-md border-t border-[#9B8F81]/30 pt-16 pb-12 text-left relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#9B8F81]/30">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm tracking-tight text-[#D2E7DD] font-serif">Aksaraa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C29B61] inline-block mb-1" />
            </div>
            <p className="font-body-md text-body-md text-[#D2C4B5] max-w-sm leading-relaxed">
              Platform manajemen resepsi, undangan sinematik, dan buku tamu VIP cerdas untuk perayaan istimewa Anda.
            </p>
            <div className="pt-2 space-y-2.5">
              <a className="flex items-center gap-2.5 text-[#D2E7DD] hover:text-[#EAC082] transition-colors text-body-md" href="mailto:askaraa.mini@gmail.com">
                <span className="material-symbols-outlined text-[18px] text-[#EAC082]">mail</span>
                <span>askaraa.mini@gmail.com</span>
              </a>
              <a className="flex items-center gap-2.5 text-[#D2E7DD] hover:text-[#9FD1BB] transition-colors text-body-md" href="https://wa.me/6281161613071" rel="noopener noreferrer" target="_blank">
                <span className="material-symbols-outlined text-[18px] text-[#9FD1BB]">chat</span>
                <span>+62 811-6161-3071 (WhatsApp)</span>
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-label-md text-label-md uppercase tracking-wider text-[#EAC082] font-semibold">Layanan &amp; Fitur</p>
            <ul className="space-y-2 font-body-sm text-body-sm text-[#D2C4B5]">
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#fitur-utama">Undangan Digital Sinematik</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#fitur-utama">QR Pass &amp; Check-In Kilat</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#fitur-utama">Manajemen RSVP &amp; Kuota</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#fitur-utama">Live Candid Photo Stream</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-label-md text-label-md uppercase tracking-wider text-[#EAC082] font-semibold">Koleksi Acara</p>
            <ul className="space-y-2 font-body-sm text-body-sm text-[#D2C4B5]">
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#koleksi-acara">Pernikahan &amp; Ngunduh Mantu</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#koleksi-acara">Sweet 17 &amp; Ulang Tahun</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#koleksi-acara">Khitanan &amp; Aqiqah</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#koleksi-acara">Corporate &amp; Gala Dinner</a></li>
              <li><a className="hover:text-[#D2E7DD] transition-colors" href="#koleksi-acara">Anniversary &amp; Perayaan</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-[#9B8F81]">
          <p>© 2026 Aksaraa Master Suite. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#EAC082] transition-colors" href="mailto:askaraa.mini@gmail.com">askaraa.mini@gmail.com</a>
            <a className="hover:text-[#9FD1BB] transition-colors" href="https://wa.me/6281161613071" rel="noopener noreferrer" target="_blank">+62 811-6161-3071 (WhatsApp)</a>
            <a className="hover:text-[#D2E7DD] transition-colors" href="#">Kebijakan Privasi</a>
            <a className="hover:text-[#D2E7DD] transition-colors" href="#">Syarat Layanan</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
