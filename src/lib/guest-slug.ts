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

// Raw ?to= values must look like slugs we generate (letters, digits, dot,
// hyphen) and stay short — prevents junk rows from the flexible RSVP path.
export function isValidGuestSlug(slug: string | null | undefined): boolean {
  if (!slug || slug.length > 80) return false
  return /^[A-Za-z0-9.-]+$/.test(slug)
}

// Generic fallback identity for Fleksibel bare links (no ?to=). It is
// display-only: flexible-rsvp rejects it so it can never become a guest row.
export const FALLBACK_GUEST_SLUG = "Teman-Partner"
export const FALLBACK_GUEST_NAME = "Teman & Partner"

export function isFallbackGuestSlug(slug: string | null | undefined): boolean {
  return prettifyGuestSlug(slug).toLowerCase() === "teman & partner"
}
