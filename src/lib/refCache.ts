// In-memory TTL cache for static reference-table reads shared across all
// couples (package matrix/features, web tracks, web templates). These never
// vary per invite, so caching removes them from the per-view `w/[slug]`
// Supabase fan-out. Reliable on the single PM2 fork; resets on restart.

const cache = new Map<string, { data: unknown; expiresAt: number }>()

const MAX_ENTRIES = 1_000

export async function cachedRead<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.data as T

  const data = await loader()
  cache.set(key, { data, expiresAt: now + ttlMs })

  if (cache.size >= MAX_ENTRIES) {
    for (const [k, v] of cache) {
      if (v.expiresAt <= Date.now()) cache.delete(k)
    }
  }

  return data
}

export function invalidateCachedRead(keys: string[]): void {
  for (const k of keys) cache.delete(k)
}