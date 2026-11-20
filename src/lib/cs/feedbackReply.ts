// Ringkasan status revisi/masukan undangan. Murni (tanpa DB) supaya bisa diuji.
//
// Sumbernya feedback_submissions milik profil yang terikat ke percakapan:
// area, status (pending/in_progress/resolved), ronde, tanggal. Deskripsi bebas
// tidak dibacakan ulang (bisa panjang dan bukan yang ditanya).

export interface FeedbackSummary {
  total: number
  pending: number
  inProgress: number
  resolved: number
  maxRound: number
  latest: {
    area: string | null
    status: FeedbackStatus
    createdAt: string
  } | null
  // Usia item yang masih terbuka (hari). null kalau tidak ada yang terbuka.
  openDays: number | null
}

export interface FeedbackReplyInput {
  coupleName: string | null
  summary: FeedbackSummary
  dashboardUrl: string
  // Ambang "lama" sebelum menawarkan sambungan ke tim.
  staleAfterDays?: number
}

export type FeedbackStatus = "pending" | "in_progress" | "resolved"

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "menunggu dikerjakan",
  in_progress: "sedang dikerjakan",
  resolved: "selesai",
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function countsLine(summary: FeedbackSummary): string {
  const parts: string[] = []
  if (summary.resolved) parts.push(`${summary.resolved} selesai`)
  if (summary.inProgress) parts.push(`${summary.inProgress} sedang dikerjakan`)
  if (summary.pending) parts.push(`${summary.pending} menunggu`)
  return parts.join(", ")
}

export function feedbackReplyText(input: FeedbackReplyInput): string {
  const { summary } = input
  const who = input.coupleName ? ` *${input.coupleName}*` : ""

  if (summary.total === 0) {
    return [
      `Belum ada masukan atau revisi yang tercatat untuk undangan${who || " Kakak"}.`,
      "",
      "Kalau ada yang mau diperbaiki (foto, nama, jadwal, atau bagian lain), kirim di sini:",
      input.dashboardUrl,
      "",
      "Setelah dikirim, tim akan mengerjakan dan statusnya bisa Kakak tanyakan lagi lewat chat ini.",
    ].join("\n")
  }

  const lines = [`Status revisi undangan${who}:`]
  lines.push(`• Total masukan: ${summary.total}${countsLine(summary) ? ` (${countsLine(summary)})` : ""}`)
  if (summary.maxRound > 0) lines.push(`• Sudah ${summary.maxRound} ronde revisi`)

  if (summary.latest) {
    const area = summary.latest.area ? `bagian "${summary.latest.area}"` : "masukan terakhir"
    lines.push(
      `• Terakhir: ${area} · ${formatDate(summary.latest.createdAt)} · ${
        STATUS_LABEL[summary.latest.status] || "diproses"
      }`
    )
  }

  const staleAfter = input.staleAfterDays ?? 3
  const stale = summary.openDays !== null && summary.openDays >= staleAfter
  if (stale) {
    lines.push("")
    lines.push(
      `Masukan yang masih terbuka sudah ${summary.openDays} hari. Balas "minta tim" kalau mau aku sambungkan ke tim CS supaya dicek langsung.`
    )
  }

  lines.push("")
  lines.push("Mau menambah masukan baru? Kirim di sini:")
  lines.push(input.dashboardUrl)
  lines.push("")
  lines.push(
    "Catatan: masukan yang sudah selesai tidak bisa diubah lagi. Kalau hasilnya belum sesuai, kirim masukan baru ya Kak."
  )
  return lines.join("\n")
}
