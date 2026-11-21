// Central, scalable source of truth for the wedding app's origin and
// environment-specific URL behavior.
//
// B1 staging runs on a single host (wedding-stg.aksaraa.com) with path-based
// couple URLs (/w/{slug}), so no couple subdomains are minted on staging.
// Prod keeps the existing subdomain form (https://{slug}.aksaraa.com).
//
// Pure and client-safe: every NEXT_PUBLIC_* read happens at module scope and is
// baked per build, so switching environments is config, not code.
//
// Defaults preserve current production behavior when env vars are unset.

const DEFAULT_PROD_ORIGIN = "https://wedding.aksaraa.com"
const DEFAULT_COUPLE_APEX = "aksaraa.com"

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

function readOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim()
  if (!raw) return DEFAULT_PROD_ORIGIN
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return trimTrailingSlash(raw) || DEFAULT_PROD_ORIGIN
  }
}

export const SITE_ORIGIN = readOrigin()

export function siteOrigin(): string {
  return SITE_ORIGIN
}

export function absoluteUrl(path = "/"): string {
  if (!path) return SITE_ORIGIN
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

export function canonicalUrl(path = "/"): string {
  return absoluteUrl(path)
}

export function siteEnv(): string {
  const explicit = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.APP_ENV || "").trim().toLowerCase()
  if (explicit) return explicit
  try {
    const host = new URL(SITE_ORIGIN).hostname
    if (host === "wedding.aksaraa.com" || host === "localhost" || host === "127.0.0.1") return "production"
  } catch {}
  return "staging"
}

export function isStagingSite(): boolean {
  return siteEnv() !== "production"
}

export type CoupleUrlMode = "subdomain" | "path"

export function coupleUrlMode(): CoupleUrlMode {
  const raw = (process.env.NEXT_PUBLIC_COUPLE_URL_MODE || "").trim().toLowerCase()
  if (raw === "path" || raw === "path-only" || raw === "path_only") return "path"
  if (raw === "subdomain") return "subdomain"
  // Safe default: staging host never mints prod apex couple subdomains.
  return isStagingSite() ? "path" : "subdomain"
}

export function coupleApexDomain(): string {
  const raw = (process.env.NEXT_PUBLIC_COUPLE_APEX_DOMAIN || "").trim().toLowerCase()
  return raw || DEFAULT_COUPLE_APEX
}

export const STAGING_WEDDING_HOST = "wedding-stg.aksaraa.com"

export function weddingAppHosts(): string[] {
  const hosts = new Set<string>(["wedding.aksaraa.com", "www.wedding.aksaraa.com"])
  try {
    const h = new URL(SITE_ORIGIN).hostname.toLowerCase()
    if (h) hosts.add(h)
    if (h && !h.startsWith("www.")) hosts.add(`www.${h}`)
  } catch {}
  hosts.add(STAGING_WEDDING_HOST)
  return [...hosts]
}

// Main wedding app host(s) (prod or staging), not a couple subdomain.
export function isWeddingMainHost(host: string | null | undefined): boolean {
  const h = (host || "").toLowerCase().split(":")[0]
  if (!h) return true
  return weddingAppHosts().includes(h)
}

export function isWeddingStagingHost(host: string | null | undefined): boolean {
  const h = (host || "").toLowerCase().split(":")[0]
  return h === STAGING_WEDDING_HOST || (isStagingSite() && h === new URL(SITE_ORIGIN).hostname.toLowerCase())
}

// A host that must never be treated as a couple slug (app/infra/marketing).
export function isReservedWeddingHost(host: string | null | undefined): boolean {
  const h = (host || "").toLowerCase().split(":")[0]
  if (!h) return false
  if (isWeddingMainHost(h)) return true
  if (h === "www.aksaraa.com" || h === "aksaraa.com") return true
  return false
}
