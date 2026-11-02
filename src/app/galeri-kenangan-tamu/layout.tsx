import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Galeri Foto Tamu & Disposable Camera Pernikahan",
  description:
    "Kumpulkan foto candid dari sudut pandang tamu: scan QR, upload langsung, tampil live layaknya disposable camera di resepsi pernikahan Anda.",
  alternates: { canonical: "https://wedding.aksaraa.com/galeri-kenangan-tamu" },
  openGraph: {
    title: "Galeri Foto Tamu & Disposable Camera Pernikahan | Aksaraa",
    description:
      "Tamu scan QR dan upload foto yang tampil live, arsip kenangan candid ala disposable camera untuk pernikahan Anda.",
  },
}

export default function GaleriKenanganLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
