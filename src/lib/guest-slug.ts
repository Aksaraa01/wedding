// Pure guest-slug helpers — client-safe (no server imports).
// The supabase-backed functions live in ./guest-link (server only).

// Clean, URL-safe guest slug (zero '%' in query). Commas/parens/+/& are dropped
// (map to "-"), only A-Z a-z 0-9 . - remain, space -> "-":
// "Prof. Dr. …, Ph.D (HC)" -> "Prof.-Dr.-…-Ph.D-HC". Case preserved.
export function slugifyName(name: string): string {
  return (name || "")
    .trim()
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Display version of a raw ?to= slug for Fleksibel mode:
// "Budi-Santoso" -> "Budi Santoso". Underscores also become spaces.
export function prettifyGuestSlug(slug: string | null | undefined): string {
  return ((slug || "").replace(/[-_]+/g, " ")).trim()
}

// Stored slugs (and ?to= after normalization) are capped at this length.
export const MAX_GUEST_SLUG_LENGTH = 80

// Raw ?to= values must look like slugs we generate (letters, digits, dot,
// hyphen) and stay short — prevents junk rows from the flexible RSVP path.
export function isValidGuestSlug(slug: string | null | undefined): boolean {
  if (!slug || slug.length > MAX_GUEST_SLUG_LENGTH) return false
  return /^[A-Za-z0-9.-]+$/.test(slug)
}

// Turn any hand-typed ?to= value into the slug we would have generated for it:
// "Budi / Ani", "Budi  Ani" and "Budi-Ani" all become "Budi-Ani". Slashes and
// other symbols never reach a stored slug, so URLs, LIKE lookups and WP
// forwarding stay safe. Slugs are already slugify fixed points, so this is a
// no-op for every link we generate ourselves.
export function normalizeGuestSlug(raw: string | null | undefined): string {
  const slug = slugifyName((raw || "").normalize("NFC"))
  if (slug.length <= MAX_GUEST_SLUG_LENGTH) return slug
  return slug.slice(0, MAX_GUEST_SLUG_LENGTH).replace(/-+$/, "")
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
