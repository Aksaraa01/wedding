// Reserved slugs.
//
// Every profile slug is also a hostname on the brand apex
// ({slug}.aksaraa.com), so a slug is not just a database value — it is a DNS
// label competing with the platform's own hosts. Until now registration only
// checked uniqueness, which meant a couple could claim `cdn`, `wp` or
// `ceriavite` and either shadow infrastructure or get a dead invitation link.
//
// Client-safe (pure): the registration hint and the API routes share one list.

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Platform hosts
  "www", "app", "admin", "api", "ops", "cdn", "art", "media", "static", "assets",
  "mail", "email", "smtp", "imap", "pop", "webmail", "ftp", "ssh", "vpn", "ns",
  "ns1", "ns2", "dns", "status", "monitor", "health", "grafana", "metrics",
  // Marketing / product hosts
  "wedding", "ceriavite", "undangananak", "khitanan", "akikah", "aqiqah",
  "birthday", "education", "academy", "atlas", "staging", "stg", "dev", "test",
  "preview", "demo", "sandbox", "beta", "alpha",
  // App routes that must stay unambiguous
  "w", "q", "qr", "led", "scanner", "welcome", "dashboard", "templates",
  "template", "fitur", "artikel", "galeri", "gallery", "register", "daftar",
  "login", "logout", "checkout", "payment", "pay", "invoice", "billing",
  "sitemap", "robots", "favicon", "icon", "defaults", "fonts", "images",
  // Support / brand
  "help", "support", "docs", "blog", "careers", "legal", "privacy", "terms",
  "vendor", "partner", "affiliate", "reseller",
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has((slug || "").trim().toLowerCase())
}

export function reservedSlugMessage(slug: string): string {
  return `Alamat "${slug || ""}" tidak tersedia karena dipakai sistem. Gunakan nama lain, misalnya nama panggilan Anda.`
}
