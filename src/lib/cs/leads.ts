import { supabaseAdmin } from "@/lib/supabase"
import {
  missingCoreFacts,
  nextQualifyingQuestion,
  validateLeadFact,
  type LeadFacts,
  type LeadStage,
} from "@/lib/cs/playbook"

export interface CsLead {
  id: string
  contactId: string
  weddingProfileId: string | null
  stage: LeadStage
  facts: LeadFacts
  objectionCount: number
  qualifyAsked: number
  optOut: boolean
  nextActionAt: string | null
  owner: string | null
  notes: string | null
}

function rowToLead(row: Record<string, unknown>): CsLead {
  return {
    id: String(row.id),
    contactId: String(row.contact_id),
    weddingProfileId: (row.wedding_profile_id as string | null) || null,
    stage: (row.stage as LeadStage) || "new",
    facts: {
      wedding_date: (row.wedding_date as string | null) || null,
      city: (row.city as string | null) || null,
      guest_count: row.guest_count === null || row.guest_count === undefined ? null : Number(row.guest_count),
      budget_band: (row.budget_band as LeadFacts["budget_band"]) || null,
      need: (row.need as LeadFacts["need"]) || null,
      package_interest: (row.package_interest as string | null) || null,
      template_interest: (row.template_interest as string | null) || null,
    },
    objectionCount: Number(row.objection_count || 0),
    qualifyAsked: Number(row.qualify_asked || 0),
    optOut: row.opt_out === true,
    nextActionAt: (row.next_action_at as string | null) || null,
    owner: (row.owner as string | null) || null,
    notes: (row.notes as string | null) || null,
  }
}

export async function ensureLead(contactId: string, weddingProfileId?: string | null): Promise<CsLead> {
  const { data } = await supabaseAdmin
    .from("cs_leads")
    .select("*")
    .eq("contact_id", contactId)
    .maybeSingle()

  if (data) return rowToLead(data as Record<string, unknown>)

  const { data: created, error } = await supabaseAdmin
    .from("cs_leads")
    .insert({ contact_id: contactId, wedding_profile_id: weddingProfileId || null })
    .select("*")
    .single()

  if (error || !created) throw new Error(`lead tidak bisa dibuat: ${error?.message || "unknown"}`)
  return rowToLead(created as Record<string, unknown>)
}

export async function updateLead(id: string, patch: Record<string, unknown>): Promise<void> {
  await supabaseAdmin
    .from("cs_leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
}

export async function recordObjection(id: string, current: number, followupDays: number | null): Promise<void> {
  const patch: Record<string, unknown> = { objection_count: current + 1 }
  if (followupDays !== null) {
    patch.next_action_at = new Date(Date.now() + followupDays * 86_400_000).toISOString()
  }
  await updateLead(id, patch)
}

export interface SaveFactResult {
  ok: boolean
  error?: string
  summary?: string
  lead?: CsLead
  next_field?: string | null
  next_question?: string | null
}

export async function saveLeadFact(
  contactId: string,
  key: string,
  raw: unknown,
  now: Date = new Date()
): Promise<SaveFactResult> {
  const checked = validateLeadFact(key, raw, now)
  if (!checked.ok) return { ok: false, error: checked.error }

  const lead = await ensureLead(contactId)
  const patch: Record<string, unknown> = { [key]: checked.value }

  if (key === "wedding_date") {
    patch.wedding_date_approx = String(checked.summary).includes("perkiraan")
  }

  await updateLead(lead.id, patch)
  const updated = await ensureLead(contactId)
  const next = nextQualifyingQuestion(updated.facts, updated.qualifyAsked)

  return {
    ok: true,
    summary: checked.summary,
    lead: updated,
    next_field: next?.key || null,
    next_question: next?.question || null,
  }
}

export function leadPromptLine(lead: CsLead): string {
  const parts = [
    `tahap=${lead.stage}`,
    `tanggal=${lead.facts.wedding_date || "-"}`,
    `kota=${lead.facts.city || "-"}`,
    `tamu=${lead.facts.guest_count ?? "-"}`,
    `budget=${lead.facts.budget_band || "-"}`,
    `kebutuhan=${lead.facts.need || "-"}`,
    `paket=${lead.facts.package_interest || "-"}`,
    `template=${lead.facts.template_interest || "-"}`,
    `keberatan=${lead.objectionCount}x`,
  ]
  return parts.join("; ")
}

export function leadMissing(lead: CsLead): number {
  return missingCoreFacts(lead.facts).length
}
