import { supabaseAdmin } from "@/lib/supabase"
import { resolvePolicies, type CsPolicies } from "@/lib/cs/policies"

export interface CsSettings {
  enabled: boolean
  model: string
  maxReplyWords: number
  persona: string | null
  policies: CsPolicies
}

const DEFAULTS: CsSettings = {
  enabled: true,
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

  const value: CsSettings = {
    enabled: data.enabled !== false,
    model: data.model || DEFAULTS.model,
    maxReplyWords: Number(data.max_reply_words) || DEFAULTS.maxReplyWords,
    persona: data.persona || null,
    policies: resolvePolicies(data.guardrails),
  }

  cached = { value, at: Date.now() }
  return value
}
