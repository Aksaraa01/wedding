/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["html2canvas", "xlsx", "qrcode"],
  },
  async redirects() {
    return [
      // Keyword URL for pricing; the configurator lives at /customize.
      { source: "/harga", destination: "/customize", permanent: true },
      // Weton checker folded into its article.
      { source: "/tanggal-baik", destination: "/artikel/cara-menghitung-weton-tanggal-baik", permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" }],
      },
      // Immutable caching only in production — it breaks Turbopack dev.
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            {
              source: "/media/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            // Self-hosted faces. Without this Next answers `max-age=0`, so every
            // page load revalidated 4-8 woff2 files against the origin, and a
            // deploy's PM2 reload surfaced as a Cloudflare 522 on one of them.
            // Rename a file (or add ?v=) when its binary actually changes.
            {
              source: "/fonts/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            {
              source: "/templates/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
            },
            // Preview pages are prerendered (one per template) and revalidated
            // hourly, so the CDN may hold them. `max-age=0, must-revalidate`
            // keeps browsers honest: a fresh deploy is still visible on the next
            // open, while `s-maxage` lets Cloudflare absorb the traffic.
            {
              source: "/templates/:code/preview",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400",
                },
              ],
            },
          ]
        : []),
    ]
  },
}

module.exports = nextConfig