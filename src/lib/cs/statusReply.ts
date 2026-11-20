// Ringkasan status undangan untuk klien terverifikasi. Murni (tanpa DB).
//
// Tujuannya satu: klien tahu persis undangannya sudah tayang atau belum, apa
// yang kurang, dan di mana tautannya — tanpa model menebak.

export type PaymentState = "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"

export interface StatusReplyInput {
  coupleName: string | null
  packageName: string | null
  payment: PaymentState
  weddingDate: string | null
  published: boolean
  blockers: string[]
  linkMode: "terbatas" | "fleksibel"
  link: string
  dashboardUrl: string
  disabled?: boolean
}

const PAYMENT_LABEL: Record<PaymentState, string> = {
  UNPAID: "belum ada pembayaran",
  PARTIAL_DP: "DP sudah masuk",
  FULLY_PAID: "lunas",
}

export function formatWeddingDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export function statusReplyText(input: StatusReplyInput): string {
  const who = input.coupleName ? ` *${input.coupleName}*` : ""
  const lines = [`Status undangan${who}:`]

  if (input.disabled) {
    lines.push("• Undangan: sudah ditutup (tidak bisa dibuka tamu)")
  } else {
    lines.push(`• Undangan: ${input.published ? "sudah tayang" : "belum tayang"}`)
  }

  const packageParts = [
    input.packageName ? `paket ${input.packageName}` : null,
    `pembayaran ${PAYMENT_LABEL[input.payment] || "belum ada pembayaran"}`,
  ].filter(Boolean)
  lines.push(`• ${packageParts.join(" · ")}`)

  const date = formatWeddingDate(input.weddingDate)
  if (date) lines.push(`• Tanggal acara: ${date}`)

  if (input.published && !input.disabled) {
    lines.push(
      input.linkMode === "fleksibel"
        ? `• Tautan: ${input.link}`
        : `• Tautan: tautan per tamu ada di dashboard → ${input.dashboardUrl}`
    )
  }
  lines.push("")

  if (!input.published && !input.disabled) {
    if (input.blockers.length) {
      lines.push(`Yang masih kurang: ${input.blockers.join(", ")}.`)
    }
    lines.push(
      "Selesaikan di editor, lalu tekan *Konfirmasi* di halaman pratinjau — setelah dikonfirmasi undangan langsung tayang."
    )
    return lines.join("\n")
  }

  if (input.disabled) {
    lines.push('Kalau mau diaktifkan lagi, balas "minta tim" dan aku sambungkan ke tim CS.')
    return lines.join("\n")
  }

  lines.push(
    input.linkMode === "fleksibel"
      ? 'Mau aku bantu susun tautan untuk tamu? Balas "link tamu".'
      : "Mau tautan tamu yang mana? Balas \"link tamu\" dan aku tunjukkan caranya di dashboard."
  )
  return lines.join("\n")
}
