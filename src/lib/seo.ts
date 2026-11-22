import { siteOrigin } from "@/lib/site"

export function siteUrl(): string {
  return siteOrigin()
}

export const SITE_URL = siteUrl()
export const SITE_NAME = "Aksaraa Wedding"

// 1200x630 JPEG used for every marketing link preview. Keep it under 300KB
// (WhatsApp's practical limit) so cards render instead of falling back to text.
export function defaultOgImage() {
  const base = siteOrigin()
  return {
    url: `${base}/og/aksaraa-wedding.jpg`,
    width: 1200,
    height: 630,
    type: "image/jpeg" as const,
    alt: "Aksaraa Wedding, undangan pernikahan digital dengan RSVP, buku tamu QR, galeri foto tamu, dan reminder WhatsApp",
  }
}

export const DEFAULT_OG_IMAGE = defaultOgImage()
