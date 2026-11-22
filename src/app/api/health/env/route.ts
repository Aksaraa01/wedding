import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type ReleaseManifest = {
  env?: string
  commit?: string
  short?: string
  branch?: string
  buildId?: string
  anonKeySha256?: string
  siteUrl?: string
  coupleMode?: string
  supabaseRef?: string
}

function readRelease(): ReleaseManifest | null {
  const candidates = [
    join(process.cwd(), "RELEASE.json"),
    join(process.cwd(), ".next/standalone/RELEASE.json"),
    join(process.cwd(), ".next/build-env.json"),
  ]
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf8")) as ReleaseManifest
    } catch {
      // try next
    }
  }
  return null
}

function has(name: string): boolean {
  return !!(process.env[name] || "").trim()
}

function hostFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const expected = (process.env.HEALTH_TOKEN || process.env.CRON_SECRET || "").trim()
  const got = (req.headers.get("x-health-token") || "").trim()
  // Gated: no token, no information. 404 rather than 401 to avoid advertising it.
  if (!expected || got !== expected) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const release = readRelease()
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
  const anonKeySha256 = anon ? createHash("sha256").update(anon).digest("hex") : release?.anonKeySha256 || ""

  const body = {
    status: "ok",
    env: release?.env || process.env.NEXT_PUBLIC_SITE_ENV || "unknown",
    commit: release?.commit || null,
    short: release?.short || (release?.commit ? release.commit.slice(0, 7) : null),
    buildId: release?.buildId || null,
    branch: release?.branch || null,
    supabaseHost: hostFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || release?.supabaseRef ? `${release?.supabaseRef}.supabase.co` : null,
    anonKeySha256: anonKeySha256 ? anonKeySha256.slice(0, 12) : null,
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || release?.siteUrl || "").trim() || null,
    coupleMode: (process.env.NEXT_PUBLIC_COUPLE_URL_MODE || release?.coupleMode || "").trim() || null,
    notifyEnabled: (process.env.NOTIFY_GROUP_ENABLED || "").trim().toLowerCase() === "true",
    wpConfigured: has("WP_INTERNAL_SECRET") && has("NEXT_PUBLIC_WP_ORIGIN"),
    waConfigured: has("WA_TARGET_GROUP_JID") || has("WA_NOTIFY_GROUP_ID"),
    runtime: {
      supabaseServiceRole: has("SUPABASE_SERVICE_ROLE_KEY"),
      scannerJwt: has("SCANNER_JWT_SECRET"),
      authSession: has("AUTH_SESSION_SECRET"),
      cronSecret: has("CRON_SECRET"),
    },
  }

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } })
}
