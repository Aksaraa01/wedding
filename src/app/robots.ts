import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { KIDS_SITE, WEDDING_SITE } from "@/lib/eventType"

// Explicit crawler policy (previously no robots.txt was served at all).
// Marketing pages stay allowed — including facebookexternalhit, which the
// Sharing Debugger explicitly asks to allowlist. Guest invitation links
// (/w/, /g/, /welcome/, /led/, /qr/, /q/) canonicalize to the couple
// subdomain and are meta-noindex, so thin per-couple duplicates stay out of
// the index. Private surfaces are disallowed (direct access unaffected).
//
// Per-host sitemap: the Ceriavite host must point crawlers at its own URLs.
export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") || ""
  const disallow = ["/dashboard/", "/ops/", "/api/", "/preview/", "/scanner/"]
  const apex = host === "aksaraa.com" || host === "www.aksaraa.com"
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "facebookexternalhit", allow: "/", disallow },
    ],
    sitemap: `${apex ? "https://aksaraa.com" : host.startsWith("ceriavite.") ? KIDS_SITE : WEDDING_SITE}/sitemap.xml`,
  }
}
