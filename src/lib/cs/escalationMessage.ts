// Notifikasi eskalasi untuk grup ops. Murni (tanpa DB) supaya bisa diuji.
//
// Prinsip: hanya tampilkan yang ada. Baris kosong dibuang (bukan diisi "-"),
// prioritas tampil di judul, dan selalu ada satu baris "Tindakan" yang jelas
// supaya tim tidak perlu membaca ulang percakapan untuk tahu harus apa.

export type EscalationPriority = "high" | "normal" | "low"

const PRIORITY_LABEL: Record<EscalationPriority, string> = {
  high: "TINGGI",
  normal: "NORMAL",
  low: "RENDAH",
}

export interface EscalationMessageInput {
  reason: string
  reasonLabel: string
  priority: EscalationPriority
  channel: "wa" | "web"
  contactName?: string | null
  phone?: string | null
  coupleName?: string | null
  registered: boolean
  stage?: string | null
  waitingMinutes?: number | null
  packageName?: string | null
  templateName?: string | null
  feedbackOpen?: number | null
  recent: { role: "user" | "assistant"; content: string }[]
  opsUrl: string
}

const ACTIONS: Record<string, string> = {
  human_requested: "hubungi klien dan konfirmasi permintaannya",
  refund: "konfirmasi kebijakan pembatalan/refund ke klien",
  reschedule: "cek ketersediaan jadwal lalu konfirmasi ke klien",
  data_change: "verifikasi pemilik, lalu ubah data dari dashboard",
  discount: "putuskan batas nego dan balas klien",
  voucher: "cek kode/kuota voucher lalu balas klien",
  payment: "kirim rekening resmi dan konfirmasi bukti transfer",
  complaint: "tindak lanjuti keluhan dan kabari klien",
  low_confidence: "baca percakapan lalu balas manual",
  no_profile: "cocokkan nomor dengan akun klien",
  sensitive_data: "verifikasi identitas sebelum memberi data",
}

export function escalationAction(reason: string): string {
  return ACTIONS[reason] || "tinjau percakapan lalu balas klien"
}

export function formatWaiting(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes) || minutes < 0) return null
  if (minutes < 1) return "baru saja"
  if (minutes < 60) return `${Math.round(minutes)} mnt`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest ? `${hours} j ${rest} mnt` : `${hours} j`
}

function identityLine(input: EscalationMessageInput): string {
  const name = input.coupleName || input.contactName
  const who = name && name !== "-" ? name : input.phone || (input.channel === "web" ? "Pengunjung web" : "Tanpa nama")
  const state = input.registered ? "terdaftar" : "belum terdaftar"
  const channel = input.channel === "web" ? "Website" : "WhatsApp"
  return `Klien: ${who} · ${state} · ${channel}`
}

export function escalationMessage(input: EscalationMessageInput): string {
  const lines = [
    `🔔 CS perlu tindakan · ${PRIORITY_LABEL[input.priority] || "NORMAL"}`,
    `Alasan: ${input.reasonLabel || input.reason}`,
    identityLine(input),
  ]

  const meta: string[] = []
  if (input.stage) meta.push(`tahap ${input.stage}`)
  const waiting = formatWaiting(input.waitingMinutes)
  if (waiting) meta.push(`menunggu ${waiting}`)
  if (meta.length) lines.push(meta.join(" · ").replace(/^./, (c) => c.toUpperCase()))

  const context: string[] = []
  if (input.packageName) context.push(`paket ${input.packageName}`)
  if (input.templateName) context.push(`template ${input.templateName}`)
  if (input.feedbackOpen && input.feedbackOpen > 0) context.push(`${input.feedbackOpen} revisi terbuka`)
  if (context.length) lines.push(`Konteks: ${context.join(" · ")}`)

  const recent = input.recent
    .filter((item) => item.content && item.content.trim())
    .slice(-4)
  if (recent.length) {
    lines.push("")
    lines.push("Percakapan terakhir:")
    for (const item of recent) {
      const who = item.role === "user" ? "Klien" : "CS"
      lines.push(`  ${who}: ${item.content.replace(/\s+/g, " ").trim().slice(0, 160)}`)
    }
  }

  lines.push("")
  lines.push(`Tindakan: ${escalationAction(input.reason)}`)
  lines.push(`Buka: ${input.opsUrl}`)
  return lines.join("\n")
}
