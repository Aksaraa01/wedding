import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { KIDS_SITE, WEDDING_SITE } from "@/lib/eventType"

// Marketing surfaces only. Guest invitation, auth, and app routes are
// noindex + robots-disallowed and stay out of the sitemap by design.
//
// Two brands share this app, so the sitemap is per-host: ceriavite.aksaraa.com
// must never advertise wedding URLs (and vice versa). Reading the host makes the
// route dynamic; it is a tiny payload and was being served with wedding URLs on
// the Ceriavite host before this.
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host") || ""
  if (host.startsWith("ceriavite.")) {
    return [
      { url: KIDS_SITE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
      { url: `${KIDS_SITE}/daftar`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ]
  }

  // The apex homepage is the shared design catalogue; it advertises the apex,
  // not the wedding host (which the rest of this sitemap still covers).
  if (host === "aksaraa.com" || host === "www.aksaraa.com") {
    const apex = "https://aksaraa.com"
    const pages = ["/", "/landing", "/customize", "/portofolio", "/artikel"]
    return pages.map((path) => ({
      url: `${apex}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    }))
  }

  const base = WEDDING_SITE
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
    "/artikel/harga-undangan-digital-2026",
    "/artikel/cara-menyebar-undangan-whatsapp",
    "/artikel/tips-memilih-wedding-organizer",
    "/artikel/undangan-tanpa-foto-vs-foto",
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
