import type { MetadataRoute } from "next"

// Marketing surfaces only. Guest invitation, auth, and app routes are
// noindex + robots-disallowed and stay out of the sitemap by design.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wedding.aksaraa.com"
  const pages = [
    "/hero",
    "/premium-web-invitation",
    "/templates",
    "/templates/kategori/adat",
    "/templates/kategori/modern",
    "/templates/kategori/elegansi",
    "/templates/kategori/floral",
    "/templates/kategori/tanpa-foto",
    "/qr-digital-buku-tamu",
    "/galeri-kenangan-tamu",
    "/virtual-wish-wall",
    "/reminder-tamu-vip",
    "/customize",
    "/artikel",
    "/artikel/cara-membuat-undangan-pernikahan-digital",
    "/artikel/biaya-wedding-organizer-2026",
    "/artikel/checklist-persiapan-pernikahan-12-bulan",
    "/artikel/ide-disposable-camera-pernikahan",
  ]
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/hero" ? 1 : 0.8,
  }))
}
