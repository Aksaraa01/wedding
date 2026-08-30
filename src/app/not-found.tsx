import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">search_off</span>
      <h1 className="font-headline-md text-2xl text-primary mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-on-surface-variant mb-8 max-w-sm">Maaf, halaman yang Anda cari tidak tersedia atau tautan sudah tidak aktif.</p>
      <Link href="/hero" className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-xs uppercase tracking-widest hover:bg-secondary transition-colors">Kembali ke Beranda</Link>
    </div>
  )
}
