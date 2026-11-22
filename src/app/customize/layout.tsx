import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Harga Undangan Pernikahan Digital & Paket Fitur",
  description:
    "Lihat harga undangan pernikahan digital Aksaraa dan pilih paket: undangan website, buku tamu digital QR, galeri foto tamu, wish wall, reminder WhatsApp.",
  alternates: { canonical: `${siteOrigin()}/customize` },
  openGraph: {
    title: "Harga Undangan Pernikahan Digital & Paket Fitur | Aksaraa",
    description:
      "Pilih paket undangan digital sesuai kebutuhan, undangan website, buku tamu QR, galeri tamu, wish wall, dan reminder WA.",
  },
}

export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
