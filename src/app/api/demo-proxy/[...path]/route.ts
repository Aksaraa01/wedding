import { NextRequest, NextResponse } from "next/server"

const PROXY_PREFIX = "/api/demo-proxy"
const ALLOWED_HOSTS = new Set(["ayomarried.com"])
const ATTRS = ["src", "href", "action", "poster"]

function cleanAndProxyUrl(rawUrl: string, baseOrigin: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("javascript:"))
    return rawUrl
  if (trimmed.includes(PROXY_PREFIX))
    return rawUrl
  try {
    const resolved = new URL(trimmed, baseOrigin)
    if (!ALLOWED_HOSTS.has(resolved.host))
      return rawUrl
    const proxy = `${PROXY_PREFIX}/${resolved.host}${resolved.pathname}${resolved.search}${resolved.hash}`
    return proxy
  } catch {
    return rawUrl
  }
}

function processSrcset(srcset: string, baseOrigin: string): string {
  return srcset
    .split(",")
    .map(part => {
      const trimmed = part.trim()
      if (!trimmed) return part
      const segments = trimmed.split(/\s+/)
      const url = segments[0]
      const descriptor = segments.length > 1 ? " " + segments.slice(1).join(" ") : ""
      const proxied = cleanAndProxyUrl(url, baseOrigin)
      return proxied + descriptor
    })
    .join(", ")
}

function stripScripts(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/\s+on\w+\s*=\s*(["'])[\s\S]*?\1/gi, "")
}

const AUTO_SCROLL_SNIPPET = `
<style>
  html, body {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
    overflow-x: hidden !important;
  }
  ::-webkit-scrollbar {
    display: none !important;
  }
</style>
<script>
  (function() {
    let isScrolling = true;
    const speed = 1.2;
    const intervalMs = 30;
    const timer = setInterval(function() {
      if (!isScrolling) return;
      if ((window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 10)) {
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        window.scrollBy(0, speed);
      }
    }, intervalMs);
    window.addEventListener("mouseenter", function() { isScrolling = false; });
    window.addEventListener("mouseleave", function() { isScrolling = true; });
    window.addEventListener("touchstart", function() { isScrolling = false; });
  })();
</script>
`

function rewriteHtmlUrls(html: string, host: string): string {
  const baseOrigin = `https://${host}`
  const prefix = `${PROXY_PREFIX}/${host}`

  // Step 1: rewrite srcset attributes with dedicated parser
  html = html.replace(
    /srcset\s*=\s*(["'])([\s\S]*?)\1/gi,
    (match, quote, value) => `srcset=${quote}${processSrcset(value, baseOrigin)}${quote}`
  )

  // Step 2: rewrite other URL attributes (absolute + relative)
  const attrPattern = new RegExp(`(${ATTRS.join("|")})\\s*=\\s*(["'])([^"']+)\\2`, "gi")
  html = html.replace(attrPattern, (match, attr, quote, value) => {
    if (value.includes(PROXY_PREFIX)) return match
    const proxied = cleanAndProxyUrl(value, baseOrigin)
    return `${attr}=${quote}${proxied}${quote}`
  })

  // Step 3: url() in inline styles and attribute values — absolute
  const hostEscaped = host.replace(/\./g, "\\.")
  html = html.replace(
    new RegExp(`url\\(\\s*(["']?)(https?:\\/\\/[^)'"]*${hostEscaped}[^)'"]*)\\1\\s*\\)`, "gi"),
    (match, q, url) => {
      if (url.includes(PROXY_PREFIX)) return match
      try {
        const u = new URL(url)
        return `url(${q}${prefix}${u.pathname}${u.search}${q})`
      } catch { return match }
    }
  )

  // Step 4: url() in inline styles — relative
  html = html.replace(
    /url\(\s*(["']?)\/([^)'"]+)\1\s*\)/gi,
    (match, q, path) => {
      if (path.includes("api/demo-proxy") || path.startsWith(PROXY_PREFIX)) return match
      return `url(${q}${prefix}/${path}${q})`
    }
  )

  return html
}

function rewriteCssUrls(css: string, host: string): string {
  const baseOrigin = `https://${host}`
  const prefix = `${PROXY_PREFIX}/${host}`

  // Step 1: rewrite srcset inside CSS (e.g. image-set())
  css = css.replace(
    /image-set\(\s*url\([^)]+\)\s*[^)]*\)/gi,
    (match) => {
      const urlMatch = match.match(/url\((["']?)([^)"']+)\1\)/)
      if (!urlMatch) return match
      const url = urlMatch[2]
      if (url.includes(PROXY_PREFIX)) return match
      const proxied = cleanAndProxyUrl(url, baseOrigin)
      return match.replace(urlMatch[0], `url(${proxied})`)
    }
  )

  // Step 2: url() absolute
  const hostEscaped = host.replace(/\./g, "\\.")
  css = css.replace(
    new RegExp(`url\\(\\s*(["']?)(https?:\\/\\/[^)'"]*${hostEscaped}[^)'"]*)\\1\\s*\\)`, "gi"),
    (match, q, url) => {
      if (url.includes(PROXY_PREFIX)) return match
      try {
        const u = new URL(url)
        return `url(${q}${prefix}${u.pathname}${u.search}${q})`
      } catch { return match }
    }
  )

  // Step 3: url() relative with leading /
  css = css.replace(
    /url\(\s*(["']?)\/([^)'"]+)\1\s*\)/gi,
    (match, q, path) => {
      if (path.includes("api/demo-proxy") || path.startsWith(PROXY_PREFIX)) return match
      return `url(${q}${prefix}/${path}${q})`
    }
  )

  return css
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    if (!path || path.length === 0)
      return new NextResponse("Missing path", { status: 400 })

    const host = path[0]
    if (!ALLOWED_HOSTS.has(host))
      return new NextResponse("Host not allowed", { status: 403 })

    const resourcePath = path.length > 1 ? "/" + path.slice(1).join("/") : "/"
    const targetUrl = `https://${host}${resourcePath}${req.nextUrl.search}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const upstream = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)

    const contentType = upstream.headers.get("content-type") || ""
    const status = upstream.status
    const headers = new Headers()
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("X-Content-Type-Options", "nosniff")

    if (contentType.includes("text/html")) {
      let html = await upstream.text()
      html = rewriteHtmlUrls(html, host)
      html = stripScripts(html)

      // Replace existing <base> then inject proxied base
      html = html.replace(/<base\b[^>]*>/gi, "")
      html = html.replace(
        "<head>",
        `<head><base href="${PROXY_PREFIX}/${host}/">`
      )

      // Inject auto-scroll before </body>
      html = html.replace("</body>", `${AUTO_SCROLL_SNIPPET}</body>`)

      headers.set("Content-Type", "text/html; charset=utf-8")
      headers.set("Cache-Control", "public, max-age=300, s-maxage=60")
      return new NextResponse(html, { status, headers })
    }

    if (contentType.includes("text/css")) {
      let css = await upstream.text()
      css = rewriteCssUrls(css, host)
      headers.set("Content-Type", "text/css; charset=utf-8")
      headers.set("Cache-Control", "public, max-age=86400, s-maxage=3600")
      return new NextResponse(css, { status, headers })
    }

    headers.set("Cache-Control", "public, max-age=86400, s-maxage=3600")
    if (contentType) headers.set("Content-Type", contentType)
    return new NextResponse(Buffer.from(await upstream.arrayBuffer()), { status, headers })

  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError")
      return new NextResponse("Upstream timeout", { status: 504 })
    return new NextResponse("Proxy failed", { status: 502 })
  }
}
