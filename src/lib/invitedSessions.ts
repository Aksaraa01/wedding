// Helpers for per-guest invited session scope.
// Scope is stored as 0-based indexes into wedding_profiles.sessions.
// null/undefined = invited to all sessions (dynamic, follows current/future sessions).
// An explicit empty result after normalization is treated as "all" (safe fallback).

export type SessionLike = { name?: string | null }

export function isInvitedToAll(
  scope: number[] | null | undefined,
  sessionCount: number,
): boolean {
  if (scope == null) return true
  if (!Array.isArray(scope)) return true
  const uniq = normalizeIndexArray(scope, sessionCount)
  // Treat "no valid selection" or "covers every current session" as all.
  return uniq.length === 0 || uniq.length >= sessionCount
}

// Normalize to a sorted unique array of valid 0-based indexes, or null for "all".
export function normalizeInvitedSessionIndexes(
  value: unknown,
  sessionCount: number,
): number[] | null {
  if (value == null) return null
  if (!Array.isArray(value)) return null
  if (sessionCount <= 0) return null
  const uniq = normalizeIndexArray(value, sessionCount)
  if (uniq.length === 0) return null
  // Selecting every session is equivalent to "all" (and stays dynamic).
  if (uniq.length >= sessionCount) return null
  return uniq
}

function normalizeIndexArray(value: unknown[], sessionCount: number): number[] {
  const set = new Set<number>()
  for (const v of value) {
    const n = typeof v === "number" ? v : Number(v)
    if (!Number.isInteger(n)) continue
    if (n < 0 || n >= sessionCount) continue
    set.add(n)
  }
  return Array.from(set).sort((a, b) => a - b)
}

// Filter a sessions array to those invited for the given scope.
// Falls back to the full list when scope is "all" or when filtering would
// produce an empty/invalid result (never show an invitation with no events).
export function filterSessionsByScope<T>(
  sessions: T[] | null | undefined,
  scope: number[] | null | undefined,
): T[] {
  const list = Array.isArray(sessions) ? sessions : []
  if (list.length === 0) return list
  if (scope == null || !Array.isArray(scope)) return list
  const idxs = normalizeIndexArray(scope, list.length)
  if (idxs.length === 0 || idxs.length >= list.length) return list
  const filtered = idxs.map((i) => list[i]).filter(Boolean)
  return filtered.length > 0 ? filtered : list
}

// 1-based display label for a session, matching editor order.
export function sessionDisplayLabel(session: SessionLike | undefined, index: number): string {
  const name = (session?.name || "").trim()
  return name || `Acara ${index + 1}`
}

// Parse a bulk/import "Acara"/"Sesi" cell into a scope.
// Accepts: empty / "Semua" / "All" => null (all), comma/semicolon-separated
// 1-based numbers ("1", "2", "1,2"), and session names (case-insensitive)
// matched against current session titles.
export function parseInvitedSessionsCell(
  raw: unknown,
  sessions: SessionLike[],
): { indexes: number[] | null; unknownTokens: string[] } {
  const sessionCount = sessions.length
  if (sessionCount === 0) return { indexes: null, unknownTokens: [] }
  const text = String(raw ?? "").trim()
  if (!text) return { indexes: null, unknownTokens: [] }
  const lowered = text.toLowerCase()
  if (lowered === "semua" || lowered === "all" || lowered === "*" || lowered === "-") {
    return { indexes: null, unknownTokens: [] }
  }

  const tokens = text
    .split(/[;,|/]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  if (tokens.length === 0) return { indexes: null, unknownTokens: [] }

  const picked = new Set<number>()
  const unknownTokens: string[] = []

  const nameToIndex = new Map<string, number>()
  sessions.forEach((s, i) => {
    const n = (s.name || "").trim().toLowerCase()
    if (n) nameToIndex.set(n, i)
  })

  for (const tok of tokens) {
    // 1-based number(s) like "1" or "acara 2" or "sesi 2"
    const numMatch = tok.match(/(\d+)/)
    if (/^\d+$/.test(tok) || /^acara\s*\d+$/i.test(tok) || /^sesi\s*\d+$/i.test(tok)) {
      const n = Number(numMatch ? numMatch[1] : tok)
      const idx = n - 1
      if (Number.isInteger(idx) && idx >= 0 && idx < sessionCount) {
        picked.add(idx)
        continue
      }
    }
    // Try exact/contained name match (case-insensitive).
    const tLower = tok.toLowerCase()
    if (nameToIndex.has(tLower)) {
      picked.add(nameToIndex.get(tLower)!)
      continue
    }
    // Fallback: match by contained session name
    let matched = false
    for (const [name, idx] of nameToIndex.entries()) {
      if (name && (tLower.includes(name) || name.includes(tLower))) {
        picked.add(idx)
        matched = true
        break
      }
    }
    if (!matched) unknownTokens.push(tok)
  }

  if (picked.size === 0) {
    // Nothing valid resolved: safe fallback to all (and surface unknowns).
    return { indexes: null, unknownTokens }
  }
  const arr = Array.from(picked).sort((a, b) => a - b)
  if (arr.length >= sessionCount) return { indexes: null, unknownTokens }
  return { indexes: arr, unknownTokens }
}

// Format a scope as a human/bulk string for export or hints (1-based, comma-separated).
export function formatInvitedSessionsCell(
  scope: number[] | null | undefined,
  sessionCount: number,
): string {
  if (isInvitedToAll(scope, sessionCount)) return "Semua"
  const arr = Array.isArray(scope) ? scope : []
  return arr.map((i) => String(i + 1)).join(",")
}
