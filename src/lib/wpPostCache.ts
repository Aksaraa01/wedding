// In-memory TTL cache for WP post liveness (the `w/[slug]` HEAD check).
// Single PM2 fork => one process, so this is reliable; resets on restart.
// "alive" is trusted for 5 min so repeat views skip the WP HEAD round-trip;
// "dead" is only trusted for 30s so a freshly-created post is detected quickly.

const ALIVE_TTL_MS = 5 * 60_000
const DEAD_TTL_MS = 30_000

const MAX_ENTRIES = 5_000

const cache = new Map<string, { alive: boolean; expiresAt: number }>()

export async function getWpPostAlive(url: string): Promise<boolean> {
  const now = Date.now()
  const hit = cache.get(url)
  if (hit && hit.expiresAt > now) return hit.alive

  let alive = false
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" })
    alive = res.status < 400
  } catch {
    alive = false
  }

  cache.set(url, { alive, expiresAt: now + (alive ? ALIVE_TTL_MS : DEAD_TTL_MS) })

  // Bound memory: when near the cap, drop expired entries.
  if (cache.size >= MAX_ENTRIES) {
    for (const [k, v] of cache) {
      if (v.expiresAt <= Date.now()) cache.delete(k)
    }
  }

  return alive
}
