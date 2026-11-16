// Client-safe brand/host helpers.
//
// One deployment serves both brands, so a link that means "home" must be
// resolved at click time, not hardcoded: /hero is the wedding landing and
// /ceriavite is the kids landing. Reading window here is safe because every
// caller uses it inside an event handler (never during render).

export const KIDS_HOST_PREFIX = "ceriavite."

export function isKidsHost(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname.startsWith(KIDS_HOST_PREFIX)
}

/** Landing page for the brand that is currently open. */
export function brandHomeHref(): string {
  return isKidsHost() ? "/ceriavite" : "/hero"
}

/** Registration path for the brand that is currently open. */
export function brandRegisterHref(templateCode?: string | null): string {
  const base = isKidsHost() ? "/daftar" : "/register"
  return templateCode ? `${base}?template=${encodeURIComponent(templateCode)}` : base
}
