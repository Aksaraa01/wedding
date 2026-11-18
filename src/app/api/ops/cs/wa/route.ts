import { NextResponse } from "next/server"
import { requireOpsEmployee } from "@/lib/ops-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Proxy ke gateway WhatsApp CS (Baileys) di localhost. Ops-only.
// GET  → status + kode/QR pairing
// POST → { action: "pair", phone } | { action: "logout" }

function gateway() {
  return {
    url: (process.env.CS_GATEWAY_URL || "http://127.0.0.1:3101").replace(/\/$/, ""),
    secret: process.env.CS_GATEWAY_SECRET || "",
  }
}

async function call(path: string, init?: RequestInit) {
  const { url, secret } = gateway()
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-cs-secret": secret, ...(init?.headers || {}) },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res

  try {
    const result = await call("/status")
    if (!result.ok) {
      return NextResponse.json(
        { connected: false, offline: true, error: result.data?.error || "gateway tidak merespons" },
        { status: 200 }
      )
    }
    return NextResponse.json(result.data)
  } catch {
    return NextResponse.json({ connected: false, offline: true, error: "gateway tidak dapat dihubungi" })
  }
}

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {}

  const action = String(body.action || "")

  try {
    if (action === "pair") {
      const phone = String(body.phone || "").replace(/\D/g, "")
      if (phone.length < 9) return NextResponse.json({ error: "nomor tidak valid" }, { status: 400 })
      const result = await call("/pair", { method: "POST", body: JSON.stringify({ phone }) })
      return NextResponse.json(result.data, { status: result.ok ? 200 : 502 })
    }

    if (action === "logout") {
      const result = await call("/logout", { method: "POST", body: "{}" })
      return NextResponse.json(result.data, { status: result.ok ? 200 : 502 })
    }

    return NextResponse.json({ error: "aksi tidak dikenal" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "gateway tidak dapat dihubungi" }, { status: 502 })
  }
}
