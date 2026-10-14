import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Wish Wall Digital — Papan Ucapan Pernikahan",
  description:
    "Wish wall digital untuk pernikahan: tamu kirim doa dari HP, tampil live di layar venue dengan moderasi instan, download kenangan.",
  alternates: { canonical: "https://wedding.aksaraa.com/fitur/wish-wall" },
  openGraph: {
    title: "Wish Wall Digital — Papan Ucapan Pernikahan | Aksaraa",
    description:
      "Papan ucapan digital dengan moderasi instan — doa tamu tampil live di layar LED venue, moderasi instan.",
  },
}

export default function WishWallPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Wish Wall
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Wish Wall Digital: Papan Ucapan Pernikahan
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Doa dan ucapan tamu tampil live sebagai karya visual elegan di layar venue — moderasi instan,
          langsung dari smartphone tamu, tanpa aplikasi.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tampil Live di Layar Venue</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Ucapan tamu tampil real-time di layar LED/proyektor — animasi elegan, font elegan, warna custom.
              Mode fullscreen untuk momen puncak acara.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Moderasi Instan</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Mempelai/WO setujui setiap ucapan sebelum tayang — ucapan tidak pantas tidak akan muncul.
              Notifikasi instan saat ada ucapan baru.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tanpa Aplikasi, Langsung dari HP</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu buka link undangan → tulis ucapan → kirim. Tidak perlu download aplikasi, tidak perlu login.
              Cepat, mudah, semua usia bisa pakai.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Kustomisasi Visual Penuh</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tema visual disesuaikan template undangan: font, warna, animasi, background — konsisten
              dengan brand pernikahan Anda.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Standar Wish Wall</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Tampil live di layar LED/TV</span>
            <span>✓ Moderasi instan (approve/reject)</span>
            <span>✓ Animasi elegan per ucapan</span>
            <span>✓ Tema visual mengikuti undangan</span>
            <span>✓ Mode fullscreen untuk momen puncak</span>
            <span>✓ Download semua ucapan (PDF/ZIP)</span>
            <span>✓ Filter kata kasar otomatis</span>
            <span>✓ Notifikasi WA ke mempelai</span>
            <span>✓ Statistik ucapan real-time</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/artikel/cara-menghitung-weton-tanggal-baik"
            className="inline-block px-7 py-3 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors mr-3"
          >
            Lihat Artikel Terkait
          </a>
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Wish Wall
          </a>
        </div>
      </article>
    </main>
  )
}