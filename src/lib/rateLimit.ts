import { NextResponse } from "next/server"

// In-memory sliding-window rate limiter. Reliable because the app runs as a
// single PM2 fork (one Node process); the window resets on restart, which is
// acceptable for abuse protection.

const buckets = new Map<string, { count: number; resetAt: number }>()

const MAX_BUCKETS = 10_000

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip") || "unknown"
}

interface RateLimitResult {
  ok: boolean
  retryAfterMs?: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()

  // Bound memory: when near the cap, drop expired buckets.
  if (buckets.size >= MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
    }
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now }
  }
  return { ok: true }
}

export function rateLimited(retryAfterMs: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  )
}
