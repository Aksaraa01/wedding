import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const hostname = req.nextUrl.hostname

  // --- wedding.aksaraa.com ---

  if (hostname === "wedding.aksaraa.com") {
    return NextResponse.next()
  }

  const weddingMatch = hostname.match(/^(.+?)\.wedding\.aksaraa\.com$/)
  if (weddingMatch) {
    const slug = weddingMatch[1]
    if (slug === "www") return NextResponse.next()

    const url = new URL(req.url)

    if (url.pathname === "/scanner") {
      url.pathname = `/scanner/${slug}`
    } else if (url.pathname === "/led" || url.pathname === "/led/") {
      url.pathname = `/led/${slug}`
    } else if (url.pathname.startsWith("/qr/") || url.pathname.startsWith("/welcome/")) {
      // pass through as-is
    } else {
      url.pathname = `/w/${slug}${url.pathname === "/" ? "/" : url.pathname}`
    }

    url.search = req.nextUrl.search
    return NextResponse.rewrite(url)
  }

  // --- original aksaraa.com / localhost logic ---

  const appDomains = ["aksaraa.com", "aksaraa.app", "localhost", "127.0.0.1"]
  const isAppDomain = appDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))
  if (!isAppDomain) return NextResponse.next()

  const match = hostname.match(/^(.+?)\.(aksaraa\.com|aksaraa\.app|localhost)$/)
  if (match) {
    const slug = match[1]
    if (slug === "www") return NextResponse.next()

    const url = new URL(req.url)

    if (url.pathname === "/scanner") {
      url.pathname = `/scanner/${slug}`
    } else if (url.pathname === "/led" || url.pathname === "/led/") {
      url.pathname = `/led/${slug}`
    } else if (url.pathname.startsWith("/qr/") || url.pathname.startsWith("/welcome/")) {
      // pass through as-is
    } else {
      url.pathname = `/w/${slug}${url.pathname === "/" ? "/" : url.pathname}`
    }

    url.search = req.nextUrl.search
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon|icon|w/|dashboard|qr|welcome).*)"],
}
