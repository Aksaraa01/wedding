// Couple-name resolution — single source of truth for every guest-facing
// "Nama Pasangan" display. The invitation hashtag (display_name) must NEVER
// leak in as the couple name; it is a separate field with its own container.
// Rule: both full names present → "full & full", else short names.
// Client-safe (pure function, no server imports) so templates, pages, and
// server routes can all share it.

export type CoupleNameInput = {
  groom_full_name?: string | null
  bride_full_name?: string | null
  groom_name?: string | null
  bride_name?: string | null
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

export function resolveCoupleName(p: CoupleNameInput): string {
  const gf = clean(p.groom_full_name)
  const bf = clean(p.bride_full_name)
  if (gf && bf) return `${gf} & ${bf}`
  const g = clean(p.groom_name)
  const b = clean(p.bride_name)
  if (g && b) return `${g} & ${b}`
  return g || b
}

// Nickname-first label for the one-line couple slots of a template (cover,
// opening, closing). The per-person sections keep the full name, so a couple
// whose `*_full_name` is filled does not get a long name repeated in every
// heading. Falls back to resolveCoupleName() when only full names exist.
export function resolveCoupleShortName(p: CoupleNameInput): string {
  const g = clean(p.groom_name)
  const b = clean(p.bride_name)
  if (g && b) return `${g} & ${b}`
  if (g || b) return g || b
  return resolveCoupleName(p)
}
