import type { Metadata } from "next"
import Script from "next/script"
import RouteUnlock from "@/components/RouteUnlock"
import ChunkErrorWatcher from "@/components/ChunkErrorWatcher"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo"
import "./globals.css"
import "./fonts.css"

export const metadata: Metadata = {
  title: {
    default: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    template: "%s | Aksaraa Wedding",
  },
  description:
    "Aksaraa Wedding: undangan pernikahan digital, buku tamu digital QR, galeri foto tamu, wish wall, dan reminder WhatsApp untuk hari bahagia Anda.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp, semua dalam satu genggaman.",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Undangan Pernikahan Digital, Buku Tamu & Galeri Foto Tamu | Aksaraa Wedding",
    description:
      "Undangan website, RSVP, buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp, semua dalam satu genggaman.",
    images: [DEFAULT_OG_IMAGE.url],
  },
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
        {/* Template previews are iframes on wp.aksaraa.com. Warm up DNS + TLS
            while the visitor is still scrolling so the modal opens sooner. */}
        <link rel="dns-prefetch" href="https://wp.aksaraa.com" />
        <link rel="preconnect" href="https://wp.aksaraa.com" />
      </head>
      <body
        className="font-body-md bg-background text-on-surface"
        data-mode="connect"
      >
        {children}
        <RouteUnlock />
        <ChunkErrorWatcher />
        {/* Cloudflare Web Analytics (cookieless). Deliberately injected in the
            app instead of CF's auto-install: guest invitations live on DNS-only
            couple subdomains where Cloudflare never touches the HTML, and those
            are exactly the pages whose real LCP we need to see. The token is a
            public site tag, not a secret. */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"60ffb5fbf13543519fb77d6e861b195e"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}