import { createHash } from "crypto"

// Scanner kiosks keep a short-lived access token and a long-lived refresh
// token, so an event day (often 10h+) never hits a PIN wall mid-reception.
export const SCANNER_ACCESS_TTL_SECONDS = 6 * 60 * 60
export const SCANNER_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60
const ALGORITHM = "HS256"

function base64url(input: Uint8Array | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input)
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice(0, (str.length + 3) % 4)
  return Uint8Array.from(Buffer.from(padded, "base64"))
}

function getSecret(): string {
  const secret = process.env.SCANNER_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("SCANNER_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY required")
  return createHash("sha256").update(secret).digest("hex")
}

// Short fingerprint of the profile PIN. Tokens carry it so rotating the PIN
// revokes every kiosk token issued under the old one.
export function pinFingerprint(pin: string | null | undefined): string {
  if (!pin) return ""
  return createHash("sha256").update(pin).digest("hex").slice(0, 16)
}

async function signPayload(payload: Record<string, unknown>): Promise<string> {
  const headerB64 = base64url(JSON.stringify({ alg: ALGORITHM, typ: "JWT" }))
  const payloadB64 = base64url(JSON.stringify(payload))
  const data = `${headerB64}.${payloadB64}`
  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, Buffer.from(data))
  return `${data}.${base64url(new Uint8Array(sig))}`
}

export async function signScannerJwt(
  weddingProfileId: string,
  pin?: string | null,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return signPayload({
    sub: weddingProfileId,
    scope: "scanner",
    iat: now,
    exp: now + SCANNER_ACCESS_TTL_SECONDS,
    pin_hash: pinFingerprint(pin),
  })
}

export async function signScannerRefreshToken(
  weddingProfileId: string,
  pin?: string | null,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return signPayload({
    sub: weddingProfileId,
    scope: "scanner_refresh",
    iat: now,
    exp: now + SCANNER_REFRESH_TTL_SECONDS,
    pin_hash: pinFingerprint(pin),
  })
}

type ScannerClaims = {
  weddingProfileId: string
  pinHash: string
  scope: string
  exp: number
}

// Tokens issued before the base64url fix encoded header/payload as raw JSON.
// They are still HMAC-signed over the same bytes, so accept both shapes until
// they expire instead of resurrecting a 401 mid-event.
function decodeSegment(segment: string): unknown {
  if (segment.trim().startsWith("{")) return JSON.parse(segment)
  return JSON.parse(Buffer.from(base64urlDecode(segment)).toString())
}

async function verifyToken(token: string, scope: string): Promise<ScannerClaims | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts
    const data = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    )
    const valid = await crypto.subtle.verify("HMAC", key, base64urlDecode(sigB64), Buffer.from(data))
    if (!valid) return null
    const payload = decodeSegment(payloadB64) as Record<string, unknown>
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== "number" || payload.exp < now) return null
    if (payload.scope !== scope) return null
    if (!payload.sub || typeof payload.sub !== "string") return null
    return {
      weddingProfileId: payload.sub,
      pinHash: typeof payload.pin_hash === "string" ? payload.pin_hash : "",
      scope,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export function verifyScannerJwt(token: string): Promise<ScannerClaims | null> {
  return verifyToken(token, "scanner")
}

export function verifyScannerRefreshToken(token: string): Promise<ScannerClaims | null> {
  return verifyToken(token, "scanner_refresh")
}

export function extractScannerJwt(req: Request): string | null {
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}
