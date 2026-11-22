import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("x-frame-options", "SAMEORIGIN")
  res.headers.set("x-content-type-options", "nosniff")
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  res.headers.set("permissions-policy", "camera=(self), microphone=(self), geolocation=(self)")
  return res
}

// Hosts that serve the wedding app itself (not a couple invitation).
const WEDDING_APP_HOSTS = new Set([
  "wedding.aksaraa.com",
  "www.wedding.aksaraa.com",
  "wedding-stg.aksaraa.com",
  "www.wedding-stg.aksaraa.com",
])

function isWeddingAppHost(hostname: string): boolean {
  if (WEDDING_APP_HOSTS.has(hostname)) return true
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim()
  if (configured) {
    try {
      const h = new URL(configured).hostname.toLowerCase()
      if (hostname === h || hostname === `www.${h}`) return true
    } catch {}
  }
  return false
}

export function proxy(req: NextRequest) {
  const hostname = req.nextUrl.hostname.toLowerCase()

  if (isWeddingAppHost(hostname)) {
    return withSecurityHeaders(NextResponse.next())
  }

  // Ceriavite (kids) marketing host. Production Caddy rewrites `/` to /ceriavite
  // before Next sees the request; this branch keeps `next dev` behaving the same
  // and stops the apex wildcard below from treating "ceriavite" as a couple slug.
  if (hostname === "ceriavite.aksaraa.com" || hostname.startsWith("ceriavite.")) {
    const url = new URL(req.url)
    if (url.pathname === "/") url.pathname = "/ceriavite"
    return withSecurityHeaders(NextResponse.rewrite(url))
  }

  // Apex homepage is the design catalogue (both products in one list). The
  // rewrite lives in the Caddy apex block: `req.nextUrl.hostname` is the
  // server's bind host in the standalone runtime, not the request `Host`
  // header, so a host branch here would fire on every host and 500 `/`.

  const weddingMatch = hostname.match(/^(.+?)\.wedding\.aksaraa\.com$/)
  if (weddingMatch) {
    const slug = weddingMatch[1]
    if (slug === "www") return withSecurityHeaders(NextResponse.next())

    const url = new URL(req.url)

    if (url.pathname === "/scanner") {
      url.pathname = `/scanner/${slug}`
    } else if (url.pathname === "/led" || url.pathname === "/led/") {
      url.pathname = `/led/${slug}`
    } else if (url.pathname.startsWith("/qr/") || url.pathname.startsWith("/welcome/") || url.pathname.startsWith("/scanner/") || url.pathname.startsWith("/led/") || url.pathname.startsWith("/q/")) {
    } else {
      url.pathname = `/w/${slug}${url.pathname === "/" ? "/" : url.pathname}`
    }

    url.search = req.nextUrl.search
    return withSecurityHeaders(NextResponse.rewrite(url))
  }

  const appDomains = ["aksaraa.com", "aksaraa.app", "localhost", "127.0.0.1"]
  const isAppDomain = appDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))
  if (!isAppDomain) return withSecurityHeaders(NextResponse.next())

  const match = hostname.match(/^(.+?)\.(aksaraa\.com|aksaraa\.app|localhost)$/)
  if (match) {
    const slug = match[1]
    // These first labels are app/marketing/infra hosts, never a couple slug.
    // "wedding-stg" and any staging-style label are also protected by the
    // isWeddingAppHost() check above, but keep the reserved set defensive.
    if (
      slug === "www" ||
      slug === "wedding" ||
      slug === "wedding-stg" ||
      slug === "ceriavite" ||
      slug === "cdn" ||
      slug === "wp" ||
      slug === "art" ||
      slug === "staging" ||
      slug === "stg" ||
      slug === "education"
    ) {
      return withSecurityHeaders(NextResponse.next())
    }

    const url = new URL(req.url)

    if (url.pathname === "/scanner") {
      url.pathname = `/scanner/${slug}`
    } else if (url.pathname === "/led" || url.pathname === "/led/") {
      url.pathname = `/led/${slug}`
    } else if (url.pathname.startsWith("/qr/") || url.pathname.startsWith("/welcome/") || url.pathname.startsWith("/scanner/") || url.pathname.startsWith("/led/") || url.pathname.startsWith("/q/")) {
    } else {
      url.pathname = `/w/${slug}${url.pathname === "/" ? "/" : url.pathname}`
    }

    url.search = req.nextUrl.search
    return withSecurityHeaders(NextResponse.rewrite(url))
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon|icon|w/|dashboard|qr|q|welcome).*)"],
}
