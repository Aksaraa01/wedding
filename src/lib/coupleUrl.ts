// Couple links have two shapes because a DNS label maxes out at 63 octets.
//
// `slugifyCouple()` builds the slug from the FULL names ("AmatYogiPrasetya…-aptRizki…"
// is 64 chars), and a label that long is not a legal DNS name: the resolver never
// answers, so the browser shows DNS_PROBE_FINISHED_NXDOMAIN before any request is
// made. No DNS record or Caddy rule can fix that, so every link builder must fall
// back to the path form (`/w/{slug}`) once the slug is too long.
//
// Prod (subdomain mode) mints the canonical form `{slug}.aksaraa.com`. B1 staging
// (path mode) runs on a single host and must NEVER emit apex couple subdomains —
// all couple links are path-based on the staging origin.
//
// Pure and client-safe: no server-only imports.

import { MAX_COUPLE_SLUG_LENGTH } from "@/lib/slug"
import { eventSite } from "@/lib/eventType"
import { coupleApexDomain, coupleUrlMode, siteOrigin } from "@/lib/site"

export function mainSite(): string {
  return siteOrigin()
}

export const MAIN_SITE = mainSite()
/** Invitations live one level under the apex in subdomain mode. */
export function coupleDomain(): string {
  return coupleApexDomain()
}

export const COUPLE_DOMAIN = coupleDomain()

/** RFC 1035: a label is 63 octets max. Longer slugs can only live on the path. */
export const MAX_DNS_LABEL_LENGTH = MAX_COUPLE_SLUG_LENGTH

export function isSubdomainSlug(slug: string | null | undefined): boolean {
  const clean = (slug || "").trim()
  return clean.length > 0 && clean.length <= MAX_DNS_LABEL_LENGTH
}

function couplePathUrl(base: string, clean: string, p: string): string {
  // Long slug or path-only mode: the invitation only exists at /w/{slug}. Keep
  // any query string on the root invitation path.
  if (p === "" || p === "/" || p.startsWith("/?")) {
    return `${base}/w/${encodeURIComponent(clean)}${p === "" || p === "/" ? "" : p.slice(1)}`
  }
  // Already the path form (guest links that use /w/{slug}?to=…).
  if (p.startsWith("/w/")) return `${base}${p}`
  // Feature routes that take the couple as a segment on the main host.
  if (p === "/led" || p.startsWith("/led/") || p.startsWith("/led?")) {
    return `${base}/led/${encodeURIComponent(clean)}${p.slice(4)}`
  }
  if (p === "/scanner" || p.startsWith("/scanner/") || p.startsWith("/scanner?")) {
    return `${base}/scanner/${encodeURIComponent(clean)}${p.slice(8)}`
  }
  // Token-resolved routes and static assets are host-independent root routes.
  if (/^\/(qr|welcome|defaults|images|templates|fonts)(\/|$|\?)/.test(p)) {
    return `${base}${p}`
  }
  // Anything else is a couple-scoped page: keep it under the invitation.
  return `${base}/w/${encodeURIComponent(clean)}${p}`
}

/**
 * Public URL for a couple.
 *
 * - `subdomain` mode (prod): `https://{slug}.{apex}` when the slug is a legal
 *   DNS label, else path-form on the marketing/event site.
 * - `path` mode (staging B1): ALWAYS path-form on the site origin; never emits
 *   a couple subdomain.
 */
export function coupleUrl(slug: string, path = "", eventType: unknown = "wedding"): string {
  const clean = (slug || "").trim()
  const p = path && !path.startsWith("/") ? `/${path}` : path
  const base = eventSite(eventType)

  if (!clean) return `${base}${p}`

  if (coupleUrlMode() === "path") {
    return couplePathUrl(base, clean, p)
  }

  if (clean.length <= MAX_DNS_LABEL_LENGTH) {
    return `https://${clean}.${coupleApexDomain()}${p}`
  }

  return couplePathUrl(base, clean, p)
}

