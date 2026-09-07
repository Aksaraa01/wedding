import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fdf9f0] flex flex-col items-center justify-center px-6 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
      <p className="text-xs tracking-[0.2em] uppercase text-[#8d4d39] mb-3">Undangan Tidak Ditemukan</p>
      <h1 className="text-3xl text-[#1c1c16] mb-2">Tautan Undangan Tidak Valid</h1>
      <p className="text-sm text-[#444748] mb-8 max-w-sm" style={{ fontFamily: "Inter, sans-serif" }}>Tautan atau nama tamu tidak ditemukan pada daftar undangan. Periksa kembali tautan dari pasangan.</p>
      <Link href="/hero" className="bg-[#1c1c16] text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest">Kembali ke Beranda</Link>
    </div>
  )
}
