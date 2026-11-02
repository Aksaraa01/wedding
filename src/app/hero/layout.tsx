import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo"

const title = "Undangan Pernikahan Digital & Website Nikah Online"
const description =
  "Buat undangan pernikahan digital dengan 100+ desain menawan: RSVP online, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp otomatis."
const socialTitle = `${title} | Aksaraa`
const socialDescription =
  "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp, semua dalam satu genggaman."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/hero` },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: `${SITE_URL}/hero`,
    siteName: SITE_NAME,
    title: socialTitle,
    description: socialDescription,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: socialDescription,
    images: [DEFAULT_OG_IMAGE.url],
  },
}

export default function HeroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
