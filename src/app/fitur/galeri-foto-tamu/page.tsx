import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Galeri Foto Tamu (Disposable Camera Digital)",
  description:
    "Galeri foto tamu digital: tamu upload foto candid via QR di meja, tampil live seperti disposable camera, tanpa aplikasi, real-time.",
  alternates: { canonical: "https://wedding.aksaraa.com/fitur/galeri-foto-tamu" },
  openGraph: {
    title: "Galeri Foto Tamu Disposable Camera Digital | Aksaraa",
    description:
      "Tamu upload foto candid via QR di meja, tampil live di galeri live, disposable camera digital untuk pernikahan.",
  },
}

export default function GaleriFotoTamuPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Galeri Foto Tamu
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Galeri Foto Tamu: Disposable Camera Digital
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Tamu upload foto candid via QR di meja, tampil live di galeri live, arsip kenangan candid
          ala disposable camera, tanpa aplikasi, tanpa kamera fisik.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">QR di Setiap Meja</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap meja mendapat QR unik. Tamu scan → buka galeri → ambil/pilih foto → upload.
              Foto tampil di galeri live dalam hitungan detik, tanpa aplikasi, di browser HP.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tampil Live Like Disposable Camera</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Foto tamu tampil real-time di galeri live (web/app), slideshow otomatis, grid masonry,
              fullscreen. Seperti disposable camera di meja, tapi digital & unlimited.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Kuota Foto per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Kuota foto per tamu mengikuti paket (Essential 5, Signature 10, Premium 20, dst).
              Dashboard mempelai: total foto, per tamu, per meja, download ZIP semua foto.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Tanpa Aplikasi & Tanpa Kamera Fisik</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu pakai HP sendiri: buka QR → kamera HP → ambil/pilih foto → upload.
              Tidak perlu beli/sewa kamera disposable, tidak perlu print, tidak perlu ambil kamera pasca acara.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap Galeri Foto Tamu</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ QR unik per meja</span>
            <span>✓ Upload foto/video dari HP tamu</span>
            <span>✓ Tampil live di galeri (slideshow/masonry)</span>
            <span>✓ Kuota foto per tamu (paket bergantung)</span>
            <span>✓ Dashboard mempelai: statistik & download ZIP</span>
            <span>✓ Filter per meja / per tamu</span>
            <span>✓ Download ZIP semua foto (original quality)</span>
            <span>✓ Mode fullscreen untuk proyektor</span>
            <span>✓ Tanpa aplikasi, browser HP cukup</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Galeri Foto Tamu
          </a>
        </div>
      </article>
    </main>
  )
}