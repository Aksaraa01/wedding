import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("x-frame-options", "SAMEORIGIN")
  res.headers.set("x-content-type-options", "nosniff")
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin")
  res.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()")
  return res
}

export function proxy(req: NextRequest) {
  const hostname = req.nextUrl.hostname

  if (hostname === "wedding.aksaraa.com") {
    return withSecurityHeaders(NextResponse.next())
  }

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

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon|icon|w/|dashboard|qr|q|welcome).*)"],
}
