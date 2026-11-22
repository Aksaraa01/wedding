import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { KIDS_SITE, WEDDING_SITE } from "@/lib/eventType"
import { isStagingSite, siteOrigin } from "@/lib/site"

// Explicit crawler policy (previously no robots.txt was served at all).
// Marketing pages stay allowed — including facebookexternalhit, which the
// Sharing Debugger explicitly asks to allowlist. Guest invitation links
// (/w/, /g/, /welcome/, /led/, /qr/, /q/) canonicalize to the couple
// subdomain/path form and are meta-noindex, so thin per-couple duplicates stay
// out of the index. Private surfaces are disallowed (direct access unaffected).
//
// Per-host sitemap: the Ceriavite host must point crawlers at its own URLs.
// Staging is fully non-indexed.
export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase()
  const disallow = ["/dashboard/", "/ops/", "/api/", "/preview/", "/scanner/"]
  const staging =
    isStagingSite() ||
    host === "wedding-stg.aksaraa.com" ||
    host === "www.wedding-stg.aksaraa.com"

  if (staging) {
    return {
      rules: [
        { userAgent: "*", disallow: "/" },
        { userAgent: "facebookexternalhit", disallow: "/" },
      ],
    }
  }

  const apex = host === "aksaraa.com" || host === "www.aksaraa.com"
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "facebookexternalhit", allow: "/", disallow },
    ],
    sitemap: `${apex ? "https://aksaraa.com" : host.startsWith("ceriavite.") ? KIDS_SITE : siteOrigin()}/sitemap.xml`,
  }
}
