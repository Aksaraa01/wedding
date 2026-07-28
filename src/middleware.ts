import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const hostname = host.split(":")[0]

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
    } else {
      url.pathname = `/w/${slug}${url.pathname === "/" ? "/" : url.pathname}`
    }

    url.search = req.nextUrl.search
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon|icon|w/|dashboard).*)"],
}
