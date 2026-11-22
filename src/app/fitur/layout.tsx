import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"

export const metadata: Metadata = {
  title: {
    template: "%s | Fitur",
    default: "Fitur Lengkap Undangan Digital | Aksaraa Wedding",
  },
  description:
    "Jelajahi semua fitur undangan digital Aksaraa: undangan website, RSVP otomatis, buku tamu QR, galeri foto tamu, wish wall, reminder WA, dan banyak lagi.",
  alternates: { canonical: `${siteOrigin()}/fitur` },
  openGraph: {
    title: "Fitur Lengkap Undangan Digital | Aksaraa Wedding",
    description:
      "Semua fitur undangan digital dalam satu platform: RSVP, buku tamu QR, galeri foto, wish wall, reminder WA, amplop digital, dan banyak lagi.",
  },
}

export default function FitursLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">{children}</main>
    </>
  )
}