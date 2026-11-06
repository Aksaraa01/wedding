// Couple links have two shapes because a DNS label maxes out at 63 octets.
//
// `slugifyCouple()` builds the slug from the FULL names ("AmatYogiPrasetya…-aptRizki…"
// is 64 chars), and a label that long is not a legal DNS name: the resolver never
// answers, so the browser shows DNS_PROBE_FINISHED_NXDOMAIN before any request is
// made. No DNS record or Caddy rule can fix that, so every link builder must fall
// back to the path form (`/w/{slug}`) once the slug is too long.
//
// Pure and client-safe: no server-only imports.

import { MAX_COUPLE_SLUG_LENGTH } from "@/lib/slug"

export const MAIN_SITE = "https://wedding.aksaraa.com"
export const COUPLE_DOMAIN = "wedding.aksaraa.com"

/** RFC 1035: a label is 63 octets max. Longer slugs can only live on the path. */
export const MAX_DNS_LABEL_LENGTH = MAX_COUPLE_SLUG_LENGTH

export function isSubdomainSlug(slug: string | null | undefined): boolean {
  const clean = (slug || "").trim()
  return clean.length > 0 && clean.length <= MAX_DNS_LABEL_LENGTH
}

/**
 * Public URL for a couple, on their subdomain when the slug is a legal label and
 * on `https://wedding.aksaraa.com/w/{slug}` when it is not.
 *
 * `path` is what would be appended to `https://{slug}.wedding.aksaraa.com`, e.g.
 * `""`, `"?to=Budi"`, `"/led"`, `"/scanner"`, `"/qr/<token>"`, `"/welcome/<token>"`.
 * Routes that resolve their couple from a token (`/qr`, `/welcome`) or that exist
 * as `/{feature}/{slug}` (`/led`, `/scanner`) keep their own shape on the main host.
 */
export function coupleUrl(slug: string, path = ""): string {
  const clean = (slug || "").trim()
  const p = path && !path.startsWith("/") ? `/${path}` : path

  if (!clean) return `${MAIN_SITE}${p}`

  if (clean.length <= MAX_DNS_LABEL_LENGTH) {
    return `https://${clean}.${COUPLE_DOMAIN}${p}`
  }

  // Long slug: the invitation only exists at /w/{slug}. Keep any query string.
  if (p === "" || p === "/" || p.startsWith("/?")) {
    return `${MAIN_SITE}/w/${encodeURIComponent(clean)}${p === "" || p === "/" ? "" : p.slice(1)}`
  }
  // Already the path form (guest links that use /w/{slug}?to=…).
  if (p.startsWith("/w/")) return `${MAIN_SITE}${p}`
  // Feature routes that take the couple as a segment on the main host.
  if (p === "/led" || p.startsWith("/led/") || p.startsWith("/led?")) {
    return `${MAIN_SITE}/led/${encodeURIComponent(clean)}${p.slice(4)}`
  }
  if (p === "/scanner" || p.startsWith("/scanner/") || p.startsWith("/scanner?")) {
    return `${MAIN_SITE}/scanner/${encodeURIComponent(clean)}${p.slice(8)}`
  }
  // Token-resolved routes and static assets are host-independent.
  if (/^\/(qr|welcome|defaults|images|templates|fonts)(\/|$|\?)/.test(p)) {
    return `${MAIN_SITE}${p}`
  }
  // Anything else is a couple-scoped page: keep it under the invitation.
  return `${MAIN_SITE}/w/${encodeURIComponent(clean)}${p}`
}
