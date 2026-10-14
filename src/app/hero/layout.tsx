import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Undangan Pernikahan Digital & Website Nikah Online",
  description:
    "Buat undangan pernikahan digital dengan 100+ desain menawan: RSVP online, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp otomatis.",
  alternates: { canonical: "https://wedding.aksaraa.com/hero" },
  openGraph: {
    title: "Undangan Pernikahan Digital & Website Nikah Online | Aksaraa",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp — semua dalam satu genggaman.",
  },
}

export default function HeroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
