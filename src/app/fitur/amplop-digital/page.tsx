import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Amplop Digital & Alamat Kado",
  description:
    "Amplop digital pernikahan: rekening bank, e-wallet, QRIS, dan alamat pengiriman kado fisik — terintegrasi di undangan, aman & praktis.",
  alternates: { canonical: "https://wedding.aksaraa.com/fitur/amplop-digital" },
  openGraph: {
    title: "Amplop Digital & Alamat Kado | Aksaraa",
    description:
      "Amplop digital pernikahan: rekening bank, e-wallet, QRIS, alamat kado fisik — aman, praktis, terintegrasi.",
  },
}

export default function AmplopDigitalPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Amplop Digital
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Amplop Digital & Alamat Kado Fisik
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Tanda kasih tamu terkelola rapi: rekening bank, e-wallet, QRIS, dan alamat pengiriman kado fisik —
          terintegrasi di undangan, aman & praktis tanpa amplop fisik.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Rekening Bank & E-Wallet</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tambahkan banyak rekening: bank (BCA, BRI, BNI, Mandiri, dll) & e-wallet (GoPay, OVO, Dana, ShopeePay).
              Masing-masing dengan nama pemilik, nomor rekening, & logo bank — tampil rapi di undangan.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">QRIS & Copy Nomor Rekening</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu scan QRIS untuk transfer instan, atau copy nomor rekening satu ketuk. Tidak perlu ketik manual,
              anti salah ketik, proses cepat & aman.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Alamat Pengiriman Kado Fisik</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Alamat lengkap pengiriman kado fisik: nama penerima, alamat lengkap, kota, kode pos, nomor telepon.
              Tampil di undangan + copy ke clipboard untuk aplikasi pengiriman (Gojek, Grab, J&T, JNE, dll).
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Copy Satu Ketuk & Buka Maps</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tombol copy nomor rekening/alamat satu ketuk. Tombol buka Google Maps/Waze langsung ke alamat
              pengiriman — tamu tidak perlu copy-paste manual.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap Amplop Digital</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Multi rekening bank (BCA, BRI, BNI, Mandiri, dll)</span>
            <span>✓ E-wallet (GoPay, OVO, Dana, ShopeePay, dll)</span>
            <span>✓ QRIS scan & bayar instan</span>
            <span>✓ Copy nomor rekening satu ketuk</span>
            <span>✓ Alamat lengkap + kode pos + telepon</span>
            <span>✓ Buka Google Maps/Waze satu ketuk</span>
            <span>✓ Tampil rapi di undangan (logo bank/icon e-wallet)</span>
            <span>✓ Urutan rekening bisa diatur</span>
            <span>✓ Tanpa biaya tambahan / biaya admin</span>
            <span>✓ Aman: tidak ada penyimpanan dana di platform</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Amplop Digital
          </a>
        </div>
      </article>
    </main>
  )
}