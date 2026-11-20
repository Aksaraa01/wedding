import { NextResponse } from "next/server"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { supabaseAdmin } from "@/lib/supabase"
import { clearCsSettingsCache, getCsSettings } from "@/lib/cs/settings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Kill switch AI per kanal: WhatsApp dan widget website bisa dimatikan terpisah.
// Master `cs_settings.enabled` tetap dihormati (kalau false, keduanya mati).
export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res
  const settings = await getCsSettings()
  return NextResponse.json({
    whatsapp: settings.channels.wa,
    website: settings.channels.web,
  })
}

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {}

  const channel = String(body.channel || "")
  if (channel !== "wa" && channel !== "web") {
    return NextResponse.json({ error: "channel harus 'wa' atau 'web'" }, { status: 400 })
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled harus boolean" }, { status: 400 })
  }

  const { data: row, error: readError } = await supabaseAdmin
    .from("cs_settings")
    .select("guardrails")
    .eq("id", 1)
    .maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

  const guardrails =
    row?.guardrails && typeof row.guardrails === "object"
      ? (row.guardrails as Record<string, unknown>)
      : {}
  const currentChannels =
    guardrails.channels && typeof guardrails.channels === "object"
      ? (guardrails.channels as Record<string, unknown>)
      : {}

  const nextGuardrails = {
    ...guardrails,
    channels: { ...currentChannels, [channel]: body.enabled },
  }

  const { error } = await supabaseAdmin
    .from("cs_settings")
    .update({ enabled: true, guardrails: nextGuardrails, updated_at: new Date().toISOString() })
    .eq("id", 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cache dibersihkan supaya pesan berikutnya langsung berhenti/dilanjutkan.
  clearCsSettingsCache()

  await supabaseAdmin.from("cs_audit").insert({
    actor: `ops:${auth.employee.id}`,
    action: body.enabled ? "ai_channel_on" : "ai_channel_off",
    subject: "cs_settings",
    detail: { channel, source: "ops_global" },
  })

  const settings = await getCsSettings()
  return NextResponse.json({
    whatsapp: settings.channels.wa,
    website: settings.channels.web,
  })
}
