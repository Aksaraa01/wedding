import type { Metadata } from "next"
import { Inter, Playfair_Display, Cormorant_Garamond, Dancing_Script } from "next/font/google"
import RouteUnlock from "@/components/RouteUnlock"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

// Caption script for Galeri Tamu photo frames (canvas + picker).
const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dancing",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu — Aksaraa Wedding",
    template: "%s | Aksaraa Wedding",
  },
  description:
    "Aksaraa Wedding: undangan pernikahan digital, buku tamu digital QR, galeri foto tamu, wish wall, dan reminder WhatsApp untuk hari bahagia Anda.",
  metadataBase: new URL("https://wedding.aksaraa.com"),
  alternates: { canonical: "https://wedding.aksaraa.com/hero" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Aksaraa Wedding",
    title: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu — Aksaraa Wedding",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp — semua dalam satu genggaman.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: { google: "ifDL7s6gKstun8HclzEYCap2-w4Ss1biIA5EtVlRVFg" },
  icons: { icon: "/icon.svg" },
}

export const viewport = {
  themeColor: "#4f1519",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${dancing.variable} font-body-md bg-background text-on-surface`}
        data-mode="connect"
      >
        {children}
        <RouteUnlock />
      </body>
    </html>
  )
}