import { supabaseAdmin } from "@/lib/supabase"
import { PACKAGE_LABELS } from "@/lib/packages"

type NotifyPayload = {
  wedding_profile_id: string
  slug: string
  bride_name: string
  groom_name: string
  whatsapp_number: string
  package_type: string
  wa_blast_tier: number
  total: number
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
      .maybeSingle()

    if (existing) return
  } catch {}

  const label = PACKAGE_LABELS[payload.package_type] || payload.package_type
  const tierSuffix = payload.wa_blast_tier ? ` (+${payload.wa_blast_tier} VIP)` : ""
  const paketLine = `Paket: ${label}${tierSuffix} — Rp ${formatIDR(payload.total)}`
  const couple = `${payload.groom_name} & ${payload.bride_name}`
  const now = formatDateWIB(new Date())

  const text = [
    `Nama Couple: ${couple}`,
    `Nomor Handphone: ${payload.whatsapp_number}`,
    paketLine,
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
