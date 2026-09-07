// Pure helper — safe to import from client components.
// Allowed guest-name charset: letters, digits, space, dot, comma, parentheses.
export function sanitizeGuestName(name: string): string {
  return (name || "").replace(/[^A-Za-z0-9 .,()]/g, "")
}