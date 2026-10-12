// Pure helper — safe to import from client components.
// Allowed guest-name charset: letters, digits, space, dot, comma, parentheses.
export function sanitizeGuestName(name: string): string {
  return (name || "").replace(/[^A-Za-z0-9 .,()]/g, "")
}

// Couple display names allow one extra glyph: the "&" separator
// ("Dela & Kamrio"). Guest paths keep the strict charset above — this is
// only for display names, never slugs or tokens.
export function sanitizeCoupleName(name: string): string {
  return (name || "").replace(/[^A-Za-z0-9 .,()&-]/g, "")
}