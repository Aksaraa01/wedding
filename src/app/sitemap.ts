import type { MetadataRoute } from "next"

// Marketing surfaces only. Guest invitation, auth, and app routes are
// noindex + robots-disallowed and stay out of the sitemap by design.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    "/kalkulator-budget",
    "/checklist-nikah",
    "/artikel/cara-menghitung-weton-tanggal-baik",
    "/artikel",
    "/artikel/cara-membuat-undangan-pernikahan-digital",
    "/artikel/biaya-wedding-organizer-2026",
    "/artikel/checklist-persiapan-pernikahan-12-bulan",
    "/artikel/ide-disposable-camera-pernikahan",
    "/portofolio",
  ]
  const urls: MetadataRoute.Sitemap = pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/hero" ? 1 : 0.8,
  }))
  try {
    const { getPortfolioEntries } = await import("@/lib/portfolio")
    for (const e of await getPortfolioEntries()) {
      urls.push({
        url: `${base}/portofolio/${encodeURIComponent(e.slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      })
    }
  } catch {}
  return urls
}
