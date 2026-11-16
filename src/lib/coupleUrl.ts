// Couple links have two shapes because a DNS label maxes out at 63 octets.
//
// `slugifyCouple()` builds the slug from the FULL names ("AmatYogiPrasetya…-aptRizki…"
// is 64 chars), and a label that long is not a legal DNS name: the resolver never
// answers, so the browser shows DNS_PROBE_FINISHED_NXDOMAIN before any request is
// made. No DNS record or Caddy rule can fix that, so every link builder must fall
// back to the path form (`/w/{slug}`) once the slug is too long.
//
// One canonical form is minted for every product: `{slug}.aksaraa.com`. That host
// sits one level under the apex, so Cloudflare's Universal certificate covers it
// and the invitation is served through the edge. The older
// `{slug}.wedding.aksaraa.com` and `{slug}.undangananak.aksaraa.com` hosts stay
// as Caddy aliases so links already printed or shared keep resolving.
//
// Pure and client-safe: no server-only imports.

import { MAX_COUPLE_SLUG_LENGTH } from "@/lib/slug"
import { WEDDING_SITE, eventSite } from "@/lib/eventType"

export const MAIN_SITE = WEDDING_SITE
/** Invitations live one level under the apex; marketing sites are separate. */
export const COUPLE_DOMAIN = "aksaraa.com"

/** RFC 1035: a label is 63 octets max. Longer slugs can only live on the path. */
export const MAX_DNS_LABEL_LENGTH = MAX_COUPLE_SLUG_LENGTH

export function isSubdomainSlug(slug: string | null | undefined): boolean {
  const clean = (slug || "").trim()
  return clean.length > 0 && clean.length <= MAX_DNS_LABEL_LENGTH
}

/**
 * Public URL for a couple, on their subdomain when the slug is a legal label and
 * on `https://{eventSite}/w/{slug}` when it is not.
 *
 * `path` is what would be appended to `https://{slug}.aksaraa.com`, e.g. `""`,
 * `"?to=Budi"`, `"/led"`, `"/scanner"`, `"/qr/<token>"`, `"/welcome/<token>"`.
 * Routes that resolve their couple from a token (`/qr`, `/welcome`) or that exist
 * as `/{feature}/{slug}` (`/led`, `/scanner`) keep their own shape on the main host.
 *
 * `eventType` only picks which marketing host carries the long-slug path form;
 * the short form is identical for every event family.
 */
export function coupleUrl(slug: string, path = "", eventType: unknown = "wedding"): string {
  const clean = (slug || "").trim()
  const p = path && !path.startsWith("/") ? `/${path}` : path
  const base = eventSite(eventType)

  if (!clean) return `${base}${p}`

  if (clean.length <= MAX_DNS_LABEL_LENGTH) {
    return `https://${clean}.${COUPLE_DOMAIN}${p}`
  }

  // Long slug: the invitation only exists at /w/{slug}. Keep any query string.
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
  // Token-resolved routes and static assets are host-independent.
  if (/^\/(qr|welcome|defaults|images|templates|fonts)(\/|$|\?)/.test(p)) {
    return `${base}${p}`
  }
  // Anything else is a couple-scoped page: keep it under the invitation.
  return `${base}/w/${encodeURIComponent(clean)}${p}`
}

