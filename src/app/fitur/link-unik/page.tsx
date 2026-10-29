import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Link Unik & QR Pass per Tamu",
  description:
    "Tautan unik & QR Pass per tamu: anti tamu tak diundang, rekap RSVP akurat, nomor meja otomatis, aman & personal.",
  alternates: { canonical: "https://wedding.aksaraa.com/fitur/link-unik" },
  openGraph: {
    title: "Link Unik & QR Pass per Tamu | Aksaraa",
    description:
      "Tautan unik & QR Pass per tamu — anti tamu tak diundang, rekap RSVP akurat, nomor meja otomatis.",
  },
}

export default function LinkUnikPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Link Unik & QR Pass
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Link Unik & QR Pass per Tamu
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Setiap tamu mendapat tautan undangan & QR Pass unik — anti tamu tak diundang, rekap RSVP
          akurat per nama, nomor meja otomatis, aman & personal.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tautan Unik per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap tamu mendapat link undangan unik: `https://wedding.aksaraa.com/w/[slug]?to=[nama]`.
              Nama tamu maupun slug sama-sama diterima — spasi dan simbol (mis. `/`) otomatis
              dirapikan, jadi tidak ada tautan yang gagal dibuka.
              Link tidak bisa ditebak, tidak bisa dibagikan ke orang lain — hanya tamu bersangkutan yang bisa buka.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">QR Pass Unik per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              QR Pass berisi: nama tamu, kategori, nomor meja, status VIP. Scan di pintu masuk →
              check-in instan, e-pass tampil, souvenir Tercatat. Anti duplikasi & tamu liar.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Nomor Meja Otomatis</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Nomor meja tergenerate otomatis per tamu/kelompok. Tampil di e-pass, link undangan,
              layar sapa, & rekap seating plan — export Excel untuk seating plan venue.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Anti Tamu Tak Diundang</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Link & QR tidak bisa ditebak/dibagikan. Hanya tamu di daftar yang punya akses.
              Check-in scan QR → hanya tamu terdaftar yang lolos. Rekap kehadiran 100% akurat.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap Link Unik & QR Pass</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Link undangan unik per tamu (unguessable)</span>
            <span>✓ QR Pass: nama, kategori, meja, VIP</span>
            <span>✓ Nomor meja otomatis per tamu/kelompok</span>
            <span>✓ Anti duplikasi & tamu tak diundang</span>
            <span>✓ Check-in QR instan di pintu masuk</span>
            <span>✓ E-pass tampil: nama, meja, kategori</span>
            <span>✓ Rekap RSVP per nama (akurat 100%)</span>
            <span>✓ Seating plan export Excel</span>
            <span>✓ Multi-device check-in (HP/laptop)</span>
            <span>✓ Offline-first (sync saat online)</span>
            <span>✓ VIP tag & prioritas check-in</span>
            <span>✓ Souvenir tracking otomatis</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Link Unik & QR Pass
          </a>
        </div>
      </article>
    </main>
  )
}