import type { MetadataRoute } from "next"

// Marketing surfaces only. Guest invitation, auth, and app routes are
// noindex + robots-disallowed and stay out of the sitemap by design.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wedding.aksaraa.com"
  const pages = [
    "/hero",
    "/premium-web-invitation",
    "/qr-digital-buku-tamu",
    "/galeri-kenangan-tamu",
    "/virtual-wish-wall",
    "/reminder-tamu-vip",
    "/customize",
  ]
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/hero" ? 1 : 0.8,
  }))
}
