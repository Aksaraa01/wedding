import type { MetadataRoute } from "next"

// Explicit crawler policy (previously no robots.txt was served at all).
// Marketing pages stay allowed — including facebookexternalhit, which the
// Sharing Debugger explicitly asks to allowlist. Guest invitation links
// (/w/, /g/, /welcome/, /led/, /qr/, /q/) canonicalize to the couple
// subdomain and are meta-noindex, so thin per-couple duplicates stay out of
// the index. Private surfaces are disallowed (direct access unaffected).
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard/", "/ops/", "/api/", "/preview/", "/scanner/"]
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "facebookexternalhit", allow: "/", disallow },
    ],
    sitemap: "https://wedding.aksaraa.com/sitemap.xml",
  }
}
