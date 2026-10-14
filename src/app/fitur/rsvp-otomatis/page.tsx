import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "RSVP Otomatis — Konfirmasi Kehadiran Digital",
  description:
    "RSVP otomatis pernikahan: tamu konfirmasi lewat HP, rekap real-time di dashboard, export Excel untuk katering, notifikasi WA.",
  alternates: { canonical: "https://wedding.aksaraa.com/fitur/rsvp-otomatis" },
  openGraph: {
    title: "RSVP Otomatis Pernikahan | Aksaraa",
    description:
      "Tamu konfirmasi kehadiran lewat HP, rekap real-time di dashboard, export Excel untuk catering.",
  },
}

export default function RsvpOtomatisPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          RSVP Otomatis
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          RSVP Otomatis: Konfirmasi Kehadiran Digital
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Tamu konfirmasi kehadiran lewat HP — rekap real-time di dashboard, export Excel untuk catering,
          notifikasi WA otomatis untuk tamu yang belum konfirmasi.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Konfirmasi Satu Ketuk</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu buka link undangan → pilih Hadir/Tidak Hadir → isi jumlah tamu (pax) → kirim.
              Tidak perlu login, tidak perlu aplikasi. Selesai dalam 10 detik.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Rekap Real-Time & Export Excel</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Dashboard mempelai menampilkan total Hadir/Tidak Hadir, jumlah pax, pesan tamu — update real-time.
              Export Excel satu klik untuk catering & seating plan.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Notifikasi Otomatis</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu yang belum konfirmasi mendapat reminder WA otomatis H-7 dan H-1.
              Mempelai juga dapat notifikasi instan saat ada RSVP baru masuk.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tautan Unik per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap tamu mendapat link & QR unik — mencegah tamu tak diundang, rekap per nama akurat,
              nomor meja terotomatisasi. Anti duplikasi & tamu liar.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap RSVP</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Konfirmasi Hadir/Tidak Hadir</span>
            <span>✓ Input jumlah tamu (pax)</span>
            <span>✓ Pesan doa & ucapan</span>
            <span>✓ Rekap real-time di dashboard</span>
            <span>✓ Export Excel (catering/seating)</span>
            <span>✓ Notifikasi WA H-7 & H-1</span>
            <span>✓ Notifikasi instan ke mempelai</span>
            <span>✓ Tautan unik per tamu</span>
            <span>✓ Anti tamu tak diundang</span>
            <span>✓ Export CSV/PDF</span>
            <span>✓ Filter Hadir/Tidak/Belum</span>
            <span>✓ Notifikasi WA ke mempelai</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan RSVP Otomatis
          </a>
        </div>
      </article>
    </main>
  )
}