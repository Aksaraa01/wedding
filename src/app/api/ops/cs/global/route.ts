import { NextResponse } from "next/server"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { supabaseAdmin } from "@/lib/supabase"
import { clearCsSettingsCache, getCsSettings } from "@/lib/cs/settings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Kill switch AI untuk SEMUA percakapan. Berbeda dari toggle per percakapan:
// ini menghentikan bot di WhatsApp dan widget web sekaligus.
export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res
  const settings = await getCsSettings()
  return NextResponse.json({ enabled: settings.enabled })
}

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {}

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled harus boolean" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("cs_settings")
    .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
    .eq("id", 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cache dibersihkan supaya pesan berikutnya langsung berhenti/dilanjutkan,
  // tidak menunggu 60 detik.
  clearCsSettingsCache()

  await supabaseAdmin.from("cs_audit").insert({
    actor: `ops:${auth.employee.id}`,
    action: body.enabled ? "ai_global_on" : "ai_global_off",
    subject: "cs_settings",
    detail: { source: "ops_global" },
  })

  return NextResponse.json({ enabled: body.enabled })
}
