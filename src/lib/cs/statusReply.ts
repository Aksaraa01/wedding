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
  // Penghalang KONTEN dari getPublishBlockers (bagian yang masih kosong).
  contentBlockers: string[]
  linkMode: "terbatas" | "fleksibel"
  link: string
  dashboardUrl: string
  disabled?: boolean
}

export const CONFIRM_BLOCKER = "Undangan belum dikonfirmasi"

// Semua yang menahan undangan tayang, berurutan: pembayaran → konten →
// konfirmasi. Pembayaran dan konfirmasi BUKAN bagian dari getPublishBlockers,
// jadi harus ditambahkan di sini supaya status tidak terlihat "hampir selesai".
export function pendingBlockers(input: {
  payment: PaymentState
  contentBlockers: string[]
  published: boolean
}): string[] {
  if (input.published) return []
  const out: string[] = []
  if (input.payment !== "FULLY_PAID") {
    out.push(
      input.payment === "PARTIAL_DP" ? "Pembayaran belum lunas (baru DP)" : "Pembayaran belum lunas"
    )
  }
  out.push(...input.contentBlockers.filter(Boolean))
  out.push(CONFIRM_BLOCKER)
  return out
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

  const packageLabel = input.packageName ? `Paket: ${input.packageName}` : "Paket: belum dipilih"
  lines.push(`• ${packageLabel} · Pembayaran: ${PAYMENT_LABEL[input.payment] || "belum ada pembayaran"}`)

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
    const blockers = pendingBlockers({
      payment: input.payment,
      contentBlockers: input.contentBlockers,
      published: input.published,
    })

    if (blockers.length === 1 && blockers[0] === CONFIRM_BLOCKER) {
      lines.push("Konten sudah lengkap dan pembayaran lunas. Tinggal konfirmasi:")
      lines.push("Buka halaman pratinjau, lalu tekan *Konfirmasi* — undangan langsung tayang.")
      return lines.join("\n")
    }

    lines.push("Yang menahan undangan belum tayang:")
    for (const blocker of blockers) {
      lines.push(blocker === CONFIRM_BLOCKER ? `• ${blocker} (tombol *Konfirmasi* di pratinjau)` : `• ${blocker}`)
    }
    lines.push("")
    lines.push(
      "Setelah semua beres, tekan *Konfirmasi* di halaman pratinjau — undangan langsung tayang."
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
