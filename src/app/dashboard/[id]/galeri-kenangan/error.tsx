"use client"

import Link from "next/link"

export default function GaleriError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 py-16" style={{ backgroundColor: "#fbf9f4" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4f1519" }}>
        <span className="material-symbols-outlined text-4xl text-white">photo_library</span>
      </div>
      <h1 className="text-[24px] leading-9 mt-4 font-medium" style={{ fontFamily: "'Playfair Display', serif", color: "#4f1519" }}>
        Galeri Gagal Dimuat
      </h1>
      <p className="text-[15px] leading-relaxed text-[#444841] max-w-xs mt-2">
        Terjadi gangguan saat memuat galeri. Foto Anda aman — silakan coba lagi.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => reset()}
          className="py-2.5 px-6 rounded-full text-white text-[11px] tracking-wider uppercase font-semibold shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: "#4f1519" }}
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="py-2.5 px-6 rounded-full text-[11px] tracking-wider uppercase font-semibold border border-[#d9c1c0] text-[#444841]"
        >
          Beranda
        </Link>
      </div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-[#867272] mt-6">Aksaraa Wedding</p>
    </div>
  )
}
