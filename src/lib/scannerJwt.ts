import { createHash } from "crypto"

const JWT_EXPIRY_SECONDS = 6 * 60 * 60
const ALGORITHM = "HS256"

function base64url(bytes: Uint8Array | string): string {
  const str = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("base64")
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
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

export async function signScannerJwt(weddingProfileId: string): Promise<string> {
  const header = { alg: ALGORITHM, typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: weddingProfileId,
    scope: "scanner",
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
  }
  const headerB64 = base64url(JSON.stringify(header))
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

export async function verifyScannerJwt(token: string): Promise<{ weddingProfileId: string } | null> {
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
    const payload = JSON.parse(Buffer.from(base64urlDecode(payloadB64)).toString())
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    if (payload.scope !== "scanner") return null
    if (!payload.sub) return null
    return { weddingProfileId: payload.sub }
  } catch {
    return null
  }
}

export function extractScannerJwt(req: Request): string | null {
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}