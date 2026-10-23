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
            {
              source: "/templates/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
            },
          ]
        : []),
    ]
  },
}

module.exports = nextConfig