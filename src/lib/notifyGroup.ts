import { supabaseAdmin } from "@/lib/supabase"
import { PACKAGE_LABELS } from "@/lib/packages"
import { profileView } from "@/lib/profileView"

type NotifyPayload = {
  wedding_profile_id: string
  slug: string
  bride_name?: string | null
  groom_name: string
  whatsapp_number: string
  package_type: string
  wa_blast_tier: number
  total: number
  voucher_code?: string | null
  voucher_discount?: number | null
  event_type?: string | null
}

function formatIDR(n: number): string {
  return n.toLocaleString("id-ID")
}

function formatDateWIB(d: Date): string {
  return d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "") + " WIB"
}

export async function notifyNewAccountGroup(payload: NotifyPayload): Promise<void> {
  const targetJid = process.env.WA_TARGET_GROUP_JID || process.env.WA_NOTIFY_GROUP_ID || ""
  if (!targetJid) {
    console.error("[notifyGroup] missing WA_TARGET_GROUP_JID — notification skipped")
    return
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from("notification_log")
      .select("wedding_profile_id")
      .eq("wedding_profile_id", payload.wedding_profile_id)
      .eq("kind", "registration")
      .maybeSingle()

    if (existing) return
  } catch {}

  const label = PACKAGE_LABELS[payload.package_type] || payload.package_type
  const tierSuffix = payload.wa_blast_tier ? ` (+${payload.wa_blast_tier} VIP)` : ""
  const paketLine = `Paket: ${label}${tierSuffix} — Rp ${formatIDR(payload.total)}`
  // One name for a kids event, two for a wedding.
  const view = profileView({
    event_type: payload.event_type,
    groom_name: payload.groom_name,
    bride_name: payload.bride_name,
  })
  const couple = [payload.groom_name, payload.bride_name].filter(Boolean).join(" & ")
  const nameLine = view.kids
    ? `Nama Ananda (${view.labels.eventNoun}): ${couple}`
    : `Nama Couple: ${couple}`
  const now = formatDateWIB(new Date())

  const text = [
    nameLine,
    `Nomor Handphone: ${payload.whatsapp_number}`,
    paketLine,
    ...(payload.voucher_code
      ? [`Voucher: ${payload.voucher_code}--Rp ${formatIDR(payload.voucher_discount || 0)}`]
      : []),
    `Tanggal Buat: ${now}`,
    `Status Bayar: Belum Bayar (UNPAID)`,
    ``,
    `Pastikan untuk menghubungi cust untuk follow-up dan update paket bila cust cetakundangan pada https://wedding.aksaraa.com/ops`,
  ].join("\n")

  const apiUrl = process.env.WA_SCHOOL_API_URL || "http://127.0.0.1:3001/send"
  const body: any = targetJid.includes("@g.us") ? { phone: targetJid, message: text } : { phone: targetJid, message: text }

  const maxAttempts = 3
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`WA send ${res.status} ${t}`)
      }
      lastError = null
      break
    } catch (e) {
      lastError = e
      console.error(`[notifyGroup] WA send failed (attempt ${attempt}/${maxAttempts})`, e)
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  if (lastError) throw lastError

  try {
    await supabaseAdmin.from("notification_log").insert({
      wedding_profile_id: payload.wedding_profile_id,
      channel: "wa_group",
      payload: { ...payload, text },
    })
  } catch {}
}

type FeedbackPayload = {
  wedding_profile_id: string
  feedback_id: string
  couple: string
  package_type: string
  payment_status: string
  round_number: number
  area: string | null
  description: string
  queue_id: string
}

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Belum Bayar (UNPAID)",
  PARTIAL_DP: "DP Sebagian (PARTIAL_DP)",
  FULLY_PAID: "Lunas (FULLY_PAID)",
}

export async function notifyFeedbackBaruGroup(payload: FeedbackPayload): Promise<boolean> {
  const targetJid = process.env.WA_FEEDBACK_GROUP_JID || ""
  if (!targetJid) {
    console.error("[notifyGroup] missing WA_FEEDBACK_GROUP_JID — notification skipped")
    return false
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from("notification_log")
      .select("wedding_profile_id")
      .eq("wedding_profile_id", payload.wedding_profile_id)
      .eq("kind", "feedback")
      .eq("ref_id", payload.feedback_id)
      .maybeSingle()

    if (existing) return false
  } catch {}

  const label = PACKAGE_LABELS[payload.package_type] || payload.package_type
  const payment = PAYMENT_LABELS[payload.payment_status] || payload.payment_status
  const desc = payload.description.trim().slice(0, 1500)
  const roundLabel = payload.round_number > 0 ? `ke-${payload.round_number} ` : ""
  const now = formatDateWIB(new Date())

  const text = [
    `🔔 Feedback Baru Masuk`,
    `Couple: ${payload.couple}`,
    `Paket: ${label}`,
    `Status Bayar: ${payment}`,
    ``,
    ``,
    `Feedback ${roundLabel}:`,
    `${desc}`,
    ``,
    ``,
    `Waktu Feedback : ${now}`,
    ``,
    ``,
    `Tindak lanjut: https://wedding.aksaraa.com/ops/antrian/${payload.queue_id}`,
  ].join("\n")

  const apiUrl = process.env.WA_SCHOOL_API_URL || "http://127.0.0.1:3001/send"

  const maxAttempts = 3
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetJid, message: text }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`WA send ${res.status} ${t}`)
      }
      lastError = null
      break
    } catch (e) {
      lastError = e
      console.error(`[notifyGroup] feedback WA send failed (attempt ${attempt}/${maxAttempts})`, e)
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  if (lastError) throw lastError

  try {
    await supabaseAdmin.from("notification_log").insert({
      wedding_profile_id: payload.wedding_profile_id,
      kind: "feedback",
      ref_id: payload.feedback_id,
      channel: "wa_group",
      payload: { ...payload, text },
    })
  } catch {}
  return true
}
