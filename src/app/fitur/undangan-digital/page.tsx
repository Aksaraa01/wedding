import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Undangan Digital Pernikahan",
  description:
    "Undangan website premium dengan desain elegan, countdown, love story, galeri foto, dan RSVP terintegrasi, siap dibagikan via WhatsApp.",
  alternates: { canonical: `${siteOrigin()}/fitur/undangan-digital` },
  openGraph: {
    title: "Undangan Digital Pernikahan Premium | Aksaraa",
    description:
      "Undangan website elegan dengan countdown, love story, galeri foto, RSVP terintegrasi, siap bagikan via WhatsApp.",
  },
}

export default function UndanganDigitalPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <Link href="/fitur" className="hover:underline">Fitur</Link>
          {" • "}
          Undangan Digital
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Undangan Digital Pernikahan Premium
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Undangan website elegan dengan desain premium, countdown timer, love story, galeri foto prewedding,
          RSVP terintegrasi, dan amplop digital. Siap dibagikan lewat WhatsApp dalam hitungan menit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Desain Premium & Responsive</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              100+ template desainer: modern minimalis, floral, elegansi dark, adat tradisional, hingga tanpa foto.
              Mobile-first, responsif di semua perangkat, loading cepat tanpa aplikasi.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Countdown Timer & Love Story</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Timer mundur ke hari-H, kisah cinta interaktif dengan timeline, foto prewedding full-screen,
              dan kutipan romantis yang bisa dikustomisasi.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Galeri Foto & Video Prewedding</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Galeri foto full-screen dengan lightbox, video prewedding embed YouTube/IG, slideshow otomatis
              di halaman depan, momen indah tampil penuh.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Detail Acara & Google Maps</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Info lengkap akad & resepsi: tanggal, waktu, venue, alamat lengkap, tombol navigasi Google Maps
              one-tap, dan dress code, tamu tidak tersesat.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Standar yang Termasuk</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Countdown timer interaktif</span>
            <span>✓ Love story dengan timeline</span>
            <span>✓ Galeri foto unlimited</span>
            <span>✓ Video prewedding embed</span>
            <span>✓ Google Maps navigasi</span>
            <span>✓ Dress code & info tamu</span>
            <span>✓ Musik latar bebas royalti</span>
            <span>✓ Kutipan/doa pembuka</span>
            <span>✓ Font & warna kustom</span>
            <span>✓ Domain kustom (opsional)</span>
            <span>✓ SEO & Open Graph ready</span>
            <span>✓ Watermark hilang (paket premium)</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/templates"
            className="inline-block px-8 py-3.5 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors mr-3"
          >
            Lihat Semua Template
          </a>
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Mulai Buat Undangan
          </a>
        </div>
      </article>
    </main>
  )
}