import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cek Weton & Tanggal Baik Pernikahan Online",
  description:
    "Cek weton tanggal akad dan resepsi: hari, pasaran Jawa, dan nilai neptu otomatis. Bahan pertimbangan memilih tanggal baik pernikahan.",
  alternates: { canonical: "https://wedding.aksaraa.com/tanggal-baik" },
  openGraph: {
    title: "Cek Weton & Tanggal Baik Pernikahan | Aksaraa",
    description:
      "Hitung weton dan neptu tanggal acara Anda otomatis — Jumat Legi, Sabtu Pahing, dan lainnya.",
  },
}

export default function TanggalBaikLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
