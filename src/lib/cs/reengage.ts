// Re-engage: satu kali follow-up untuk klien yang sudah pernah chat CS lalu
// berhenti sebelum pembayaran selesai.
//
// Aturan yang disengaja:
//  - HANYA kontak yang pernah mengirim pesan (tidak ada cold outreach ke nomor
//    yang belum pernah menghubungi CS — risiko nomor diblokir WhatsApp).
//  - SEKALI saja per kontak, ditandai di cs_audit (tanpa tabel baru).
//  - Flag off secara default: worker menghitung kandidat, tidak mengirim.
//  - Jam tenang 09.00–20.00 WIB, kuota harian, dan pembatalan otomatis kalau
//    klien balas lebih dulu.

import { supabaseAdmin } from "@/lib/supabase"
import { sendCsWhatsApp } from "@/lib/cs/waSend"

import {
  reengageMessage,
  reengageSettings,
  withinQuietWindow,
  type ReengageCandidate,
  } from "@/lib/cs/reengagePolicy"

const DAY_MS = 86_400_000

interface ConversationRow {
  id: string
  status: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
  contact_id: string
  cs_contacts:
    | {
        id: string
        name: string | null
        phone: string | null
        wa_jid: string | null
        blocked: boolean | null
        wedding_profile_id: string | null
      }
    | {
        id: string
        name: string | null
        phone: string | null
        wa_jid: string | null
        blocked: boolean | null
        wedding_profile_id: string | null
      }[]
    | null
}

function firstContact(row: ConversationRow) {
  const value = row.cs_contacts
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

async function alreadySent(contactIds: string[]): Promise<Set<string>> {
  if (!contactIds.length) return new Set()
  const { data } = await supabaseAdmin
    .from("cs_audit")
    .select("subject")
    .eq("action", "reengage_sent")
    .in("subject", contactIds)
    .limit(1000)
  return new Set((data || []).map((row) => String((row as { subject: string }).subject)))
}

export async function findReengageCandidates(now = Date.now()): Promise<{
  candidates: ReengageCandidate[]
  skipped: { contact_id: string; reason: string }[]
}> {
  const settings = reengageSettings()
  const cutoff = new Date(now - settings.days * DAY_MS).toISOString()

  const { data, error } = await supabaseAdmin
    .from("cs_conversations")
    .select(
      "id,status,last_inbound_at,last_outbound_at,contact_id,cs_contacts!inner(id,name,phone,wa_jid,blocked,wedding_profile_id)"
    )
    .lt("last_inbound_at", cutoff)
    .order("last_inbound_at", { ascending: true })
    .limit(200)

  if (error || !data) return { candidates: [], skipped: [] }

  const rows = (data as unknown as ConversationRow[]) || []
  const sent = await alreadySent(rows.map((row) => row.contact_id))
  const profileIds = rows
    .map((row) => firstContact(row)?.wedding_profile_id)
    .filter((id): id is string => !!id)

  const { data: profiles } = profileIds.length
    ? await supabaseAdmin
        .from("wedding_profiles")
        .select("id,groom_name,bride_name,payment_status")
        .in("id", [...new Set(profileIds)])
    : { data: [] as Record<string, unknown>[] }
  const profileById = new Map<string, Record<string, unknown>>()
  for (const row of (profiles || []) as Record<string, unknown>[]) profileById.set(String(row.id), row)

  const candidates: ReengageCandidate[] = []
  const skipped: { contact_id: string; reason: string }[] = []

  for (const row of rows) {
    const contact = firstContact(row)
    if (!contact) continue
    const skip = (reason: string) => skipped.push({ contact_id: contact.id, reason })

    if (!row.last_inbound_at) continue
    if (row.status === "human") { skip("ditangani tim"); continue }
    if (row.status === "closed") { skip("percakapan selesai"); continue }
    if (contact.blocked) { skip("nomor diblokir"); continue }
    if (!contact.wedding_profile_id) { skip("belum punya undangan"); continue }
    if (sent.has(contact.id)) { skip("sudah pernah di-follow-up"); continue }

    const profile = profileById.get(contact.wedding_profile_id)
    if (!profile) { skip("profil tidak ditemukan"); continue }
    if (profile.payment_status === "FULLY_PAID") { skip("sudah lunas"); continue }

    const daysSilent = Math.floor((now - new Date(row.last_inbound_at).getTime()) / DAY_MS)
    if (daysSilent < settings.days) { skip("belum " + settings.days + " hari"); continue }

    // Hanya kalau klien yang bicara terakhir (kalau bot yang terakhir bicara,
    // follow-up akan terasa mengulang dan bisa menabrak antrean tim).
    if (row.last_outbound_at && row.last_outbound_at > row.last_inbound_at) {
      skip("sudah dibalas, menunggu klien")
      continue
    }

    const couple = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || null
    candidates.push({
      contactId: contact.id,
      conversationId: row.id,
      name: contact.name,
      phone: contact.phone,
      waJid: contact.wa_jid,
      couple,
      daysSilent,
    })
  }

  return { candidates, skipped }
}

export interface ReengageRun {
  enabled: boolean
  dryRun: boolean
  withinQuiet: boolean
  candidates: ReengageCandidate[]
  skipped: { contact_id: string; reason: string }[]
  sent: number
  errors: number
}

export async function runReengageOnce(now = Date.now()): Promise<ReengageRun> {
  const settings = reengageSettings()
  const { candidates, skipped } = await findReengageCandidates(now)
  const withinQuiet = withinQuietWindow(settings, now)
  const result: ReengageRun = {
    enabled: settings.enabled,
    dryRun: settings.dryRun,
    withinQuiet,
    candidates,
    skipped,
    sent: 0,
    errors: 0,
  }
  if (!settings.enabled || settings.dryRun || !withinQuiet) return result

  for (const candidate of candidates.slice(0, settings.dailyCap)) {
    const ok = await sendCsWhatsApp({ jid: candidate.waJid, phone: candidate.phone }, reengageMessage(candidate), 8000).catch(
      () => false
    )
    if (!ok) {
      result.errors += 1
      if (result.errors >= 3) break
      continue
    }
    result.sent += 1
    await supabaseAdmin.from("cs_audit").insert({
      actor: "system:cs",
      action: "reengage_sent",
      subject: candidate.contactId,
      detail: { campaign: "stalled_chat", days: candidate.daysSilent, conversation_id: candidate.conversationId },
    })
    await supabaseAdmin
      .from("cs_conversations")
      .update({ last_outbound_at: new Date().toISOString() })
      .eq("id", candidate.conversationId)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return result
}

let started = false

export function startReengageWorker(): void {
  if (started) return
  started = true
  const tick = async () => {
    try {
      const settings = reengageSettings()
      if (!settings.enabled) return
      const result = await runReengageOnce()
      if (result.sent || result.candidates.length) {
        console.log(
          `[cs-reengage] ${result.dryRun ? "dry-run" : "sent " + result.sent} · kandidat ${result.candidates.length} · dilewati ${result.skipped.length}`
        )
      }
    } catch (error) {
      console.error("[cs-reengage] failed", String((error as Error)?.message || error))
    }
  }
  void tick()
  setInterval(tick, 10 * 60_000)
}
