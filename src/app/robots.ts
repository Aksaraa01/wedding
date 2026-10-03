import type { MetadataRoute } from "next"

// Explicit crawler policy (previously no robots.txt was served at all).
// Public invitation + link-preview pages stay allowed — including
// facebookexternalhit, which the Sharing Debugger explicitly asks to
// allowlist. Private surfaces are disallowed from indexing (direct,
// authenticated access is unaffected).
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard/", "/ops/", "/api/", "/preview/", "/scanner/"]
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "facebookexternalhit", allow: "/", disallow },
    ],
  }
}
