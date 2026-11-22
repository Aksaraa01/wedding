import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Buku Tamu Digital QR: Check-in & E-Pass",
  description:
    "Buku tamu digital QR: check-in QR di pintu masuk, e-pass berisi nama & nomor meja, layar sapa, rekap kehadiran real-time.",
  alternates: { canonical: `${siteOrigin()}/fitur/buku-tamu-qr` },
  openGraph: {
    title: "Buku Tamu Digital QR: Check-in & E-Pass | Aksaraa",
    description:
      "Check-in QR, e-pass tamu, layar sapa, rekap kehadiran otomatis, buku tamu digital modern untuk resepsi.",
  },
}

export default function BukuTamuQrPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Buku Tamu QR
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Buku Tamu Digital QR: Check-in & E-Pass
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Check-in QR di pintu masuk, e-pass berisi nama & nomor meja, layar sapa, dan rekap kehadiran
          otomatis, buku tamu digital modern untuk resepsi pernikahan yang berkesan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">QR Check-in di Pintu Masuk</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap tamu mendapat QR unik. Petugas scan QR di pintu masuk → kehadiran tercatat instan,
              e-pass tampil di layar (nama, kategori, nomor meja), souvenir otomatis Tercatat.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">E-Pass Tamu & Nomor Meja</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap tamu mendapat e-pass digital: nama, kategori (Keluarga/Teman/Kollega), nomor meja,
              kategori VIP. Tampil di layar HP tamu & layar sapa di venue.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Layar Sapa & Rekap Real-Time</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Nama tamu tampil di layar sapa saat check-in (animasi elegan). Dashboard mempelai/WO:
              total hadir, per kategori, per meja, VIP, souvenir, update real-time, export Excel.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Souvenir & Hadiah Otomatis</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Saat check-in, souvenir/hadiah otomatis tertanda "Diberikan". Rekap klaim souvenir real-time,
              export untuk tim logistik. Anti dobel ambil, anti lupa.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap Buku Tamu QR</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ QR unik per tamu (anti duplikasi)</span>
            <span>✓ Check-in scan QR (HP petugas/laptop)</span>
            <span>✓ E-pass: nama, kategori, nomor meja</span>
            <span>✓ Layar sapa animasi (nama + kategori)</span>
            <span>✓ Rekap real-time: hadir/tidak/VIP</span>
            <span>✓ Export Excel (catering/seating/souvenir)</span>
            <span>✓ Souvenir tracking (diberikan/belum)</span>
            <span>✓ Multi-device scanner (HP/laptop)</span>
            <span>✓ Offline-first (sync saat online)</span>
            <span>✓ VIP tag & prioritas check-in</span>
            <span>✓ Export CSV/PDF/Excel</span>
            <span>✓ Multi-venue (akad + resepsi beda tempat)</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Buku Tamu QR
          </a>
        </div>
      </article>
    </main>
  )
}