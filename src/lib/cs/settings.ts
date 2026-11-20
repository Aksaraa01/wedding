import { supabaseAdmin } from "@/lib/supabase"
import { resolvePolicies, type CsPolicies } from "@/lib/cs/policies"

export interface CsChannels {
  wa: boolean
  web: boolean
}

export interface CsSettings {
  enabled: boolean
  // Kill switch per kanal. WhatsApp dan widget web bisa dimatikan terpisah.
  channels: CsChannels
  model: string
  maxReplyWords: number
  persona: string | null
  policies: CsPolicies
}

const DEFAULTS: CsSettings = {
  enabled: true,
  channels: { wa: true, web: true },
  model: "anthropic/claude-haiku-5.5",
  maxReplyWords: 90,
  persona: null,
  policies: resolvePolicies(null),
}

let cached: { value: CsSettings; at: number } | null = null

// Kill switch global harus berlaku seketika, bukan setelah TTL 60 detik.
export function clearCsSettingsCache(): void {
  cached = null
}

export async function getCsSettings(): Promise<CsSettings> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value

  const { data, error } = await supabaseAdmin
    .from("cs_settings")
    .select("enabled,model,max_reply_words,persona,guardrails")
    .eq("id", 1)
    .maybeSingle()

  if (error || !data) return DEFAULTS

  const master = data.enabled !== false
  const rawGuardrails = (data.guardrails || {}) as Record<string, unknown>
  const rawChannels =
    rawGuardrails.channels && typeof rawGuardrails.channels === "object"
      ? (rawGuardrails.channels as Record<string, unknown>)
      : {}

  const value: CsSettings = {
    enabled: master,
    channels: {
      wa: master && rawChannels.wa !== false,
      web: master && rawChannels.web !== false,
    },
    model: data.model || DEFAULTS.model,
    maxReplyWords: Number(data.max_reply_words) || DEFAULTS.maxReplyWords,
    persona: data.persona || null,
    policies: resolvePolicies(data.guardrails),
  }

  cached = { value, at: Date.now() }
  return value
}
