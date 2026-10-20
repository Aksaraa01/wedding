import type { NextResponse } from "next/server"

export const COUPLE_COOKIE = "aksaraa_session"
export const OPS_COOKIE = "aksaraa_ops"
export const COUPLE_TTL_SECONDS = 7 * 24 * 60 * 60
export const OPS_TTL_SECONDS = 12 * 60 * 60

export type SessionScope = "couple" | "ops"

export type SessionPayload = {
  sub: string
  scope: SessionScope
  role?: string
  iat: number
  exp: number
}

const encoder = new TextEncoder()

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(value: string): Uint8Array {
  const pad = value.length % 4
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function getSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.SCANNER_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("AUTH_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY required")
  return secret
}

async function hmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  )
}

export async function signSession(
  input: { sub: string; scope: SessionScope; role?: string },
  ttlSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        sub: input.sub,
        scope: input.scope,
        ...(input.role ? { role: input.role } : {}),
        iat: now,
        exp: now + ttlSeconds,
      }),
    ),
  )
  const data = `${header}.${payload}`
  const signature = await crypto.subtle.sign("HMAC", await hmacKey("sign"), encoder.encode(data))
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`
}

export async function verifySession(
  token: string | null | undefined,
  expectedScope?: SessionScope,
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const data = `${parts[0]}.${parts[1]}`
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey("verify"),
      base64UrlToBytes(parts[2]),
      encoder.encode(data),
    )
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as SessionPayload
    if (!payload?.sub || !payload?.scope) return null
    if (expectedScope && payload.scope !== expectedScope) return null
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function getSessionToken(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || ""
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=")
    if (key !== name) continue
    try {
      return decodeURIComponent(rest.join("="))
    } catch {
      return null
    }
  }
  return null
}

export function setSessionCookie(
  res: NextResponse,
  name: string,
  token: string,
  maxAge: number,
): void {
  res.cookies.set({
    name,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  })
}

export function clearSessionCookie(res: NextResponse, name: string): void {
  res.cookies.set({
    name,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
