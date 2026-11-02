import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buku Tamu Digital QR untuk Resepsi Pernikahan",
  description:
    "Buku tamu digital dengan QR check-in, e-pass tamu, layar sapa, dan rekap kehadiran otomatis untuk resepsi pernikahan yang berkesan.",
  alternates: { canonical: "https://wedding.aksaraa.com/qr-digital-buku-tamu" },
  openGraph: {
    title: "Buku Tamu Digital QR untuk Resepsi | Aksaraa",
    description:
      "Check-in QR, e-pass tamu, layar sapa, dan rekap kehadiran otomatis, buku tamu digital modern untuk hari bahagia Anda.",
  },
}

export default function QrBukuTamuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
