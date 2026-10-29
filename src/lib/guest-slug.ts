// Pure guest-slug helpers — client-safe (no server imports).
// The supabase-backed functions live in ./guest-link (server only).

// Clean, URL-safe guest slug (zero '%' in query). Only A-Z a-z 0-9 . - & remain,
// space and every other symbol -> "-":
// "Prof. Dr. …, Ph.D (HC)" -> "Prof.-Dr.-…-Ph.D-HC". Case preserved.
//
// "/", "+" and "&" are all read as "and" and become ONE canonical token "-&-"
// ("Budi & Ani", "Budi/Ani", "Budi + Ani" -> "Budi-&-Ani"), so the partner half
// of a shared name is never dropped. A raw "&" in a pasted URL still has to be
// percent-encoded (%26) or it truncates the query — src/proxy.ts repairs that.
export function slugifyName(name: string): string {
  return (name || "")
    .normalize("NFC")
    .replace(/[/+&]+/g, " & ")
    .replace(/[^A-Za-z0-9.&]+/g, "-")
    .split("&")
    .map((part) => part.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-&-")
}

// Display version of a raw ?to= slug for Fleksibel mode:
// "Budi-Santoso" -> "Budi Santoso". Underscores also become spaces.
export function prettifyGuestSlug(slug: string | null | undefined): string {
  return ((slug || "").replace(/[-_]+/g, " ")).trim()
}

// Stored slugs (and ?to= after normalization) are capped at this length.
export const MAX_GUEST_SLUG_LENGTH = 80

// Raw ?to= values must look like slugs we generate (letters, digits, dot,
// hyphen, the "-&-" join) and stay short — prevents junk rows from the flexible
// RSVP path. At least one letter/digit is required so "&", "-" and "..." can
// never become a guest slug.
export function isValidGuestSlug(slug: string | null | undefined): boolean {
  if (!slug || slug.length > MAX_GUEST_SLUG_LENGTH) return false
  if (!/[A-Za-z0-9]/.test(slug)) return false
  return /^[A-Za-z0-9.&-]+$/.test(slug)
}

// Turn any hand-typed ?to= value into the slug we would have generated for it:
// "Budi / Ani", "Budi + Ani", "Budi & Ani", "Budi  Ani" and "Budi-Ani"-style
// inputs all become "Budi-&-Ani". Only forbid characters never reach a stored
// slug, so URLs, LIKE lookups and WP forwarding stay safe. Generated slugs are
// slugify fixed points, so this is a no-op for every link we build ourselves.
export function normalizeGuestSlug(raw: string | null | undefined): string {
  const slug = slugifyName((raw || "").normalize("NFC"))
  if (slug.length <= MAX_GUEST_SLUG_LENGTH) return slug
  return slug.slice(0, MAX_GUEST_SLUG_LENGTH).replace(/[-&]+$/, "")
}

// Query params that are never part of a guest name. Anything else that arrives
// with an EMPTY value is a fragment of a name that a raw "&" split off.
const NON_NAME_PARAMS = new Set([
  "qr_token",
  "preview",
  "token",
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
])

// Re-assemble ?to= from parsed search params.
//
// A name pasted as "?to=Sindy Sihombing&/Partner" (or "?to=Budi & Ani", or one
// re-shared by a chat app) is split by the query parser: `to` keeps the first
// half and every following "&" fragment arrives as a parameter of its own with
// an empty value. Next re-serialises the query before we ever see it, so the
// fragments are joined back here, in order, with "&" — normalizeGuestSlug()
// then reads each "&" as the "and" join.
export function guestToFromParams(
  params: Record<string, string | string[] | undefined>
): string {
  const firstValue = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) || ""

  let to = firstValue(params.to)
  if (!to) return ""

  for (const [key, value] of Object.entries(params)) {
    if (!key || key === "to" || firstValue(value) !== "") continue
    if (NON_NAME_PARAMS.has(key)) continue
    to += `&${key}`
  }
  return to
}

// Generic fallback identity for Fleksibel bare links (no ?to=). It is
// display-only: flexible-rsvp rejects it so it can never become a guest row.
export const FALLBACK_GUEST_SLUG = "Teman-Partner"
export const FALLBACK_GUEST_NAME = "Teman & Partner"

export function isFallbackGuestSlug(slug: string | null | undefined): boolean {
  const raw = (slug || "").trim().toLowerCase()
  if (!raw) return false
  // The generic link ships as ?to=Teman-Partner (the slug form). Comparing the
  // prettified value only ever matched "Teman & Partner", so the slug slipped
  // through and created junk "Teman Partner" rows in Fleksibel mode.
  if (raw === FALLBACK_GUEST_SLUG.toLowerCase()) return true
  const pretty = prettifyGuestSlug(raw).toLowerCase()
  return pretty === FALLBACK_GUEST_NAME.toLowerCase() || pretty === "teman partner"
}

// Guest identity categories for the Galeri photobooth. Single source of
// truth — also used by the dashboard add-guest and scanner forms.
export const GUEST_CATEGORIES = ["Keluarga", "Kerabat", "Teman", "Kolega", "Lainnya"] as const

export type GuestCategory = (typeof GUEST_CATEGORIES)[number]

export function isValidGuestCategory(value: string | null | undefined): value is GuestCategory {
  return !!value && (GUEST_CATEGORIES as readonly string[]).includes(value)
}
