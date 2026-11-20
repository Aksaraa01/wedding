// Jawaban tautan undangan. Dipisah dari DB supaya bisa diuji.
//
// Dua mode tautan (kolom wedding_profiles.guest_link_strict):
//  - Terbatas (default): ?to= harus tamu yang terdaftar, kalau tidak 404.
//    Jadi jangan bagikan satu tautan dengan nama yang diketik bebas.
//  - Fleksibel: nama apa pun boleh, tamu RSVP otomatis tercatat.

export interface LinkReplyInput {
  link: string
  mode: "terbatas" | "fleksibel"
  published: boolean
  blockers: string[]
  dashboardUrl: string
  disabled?: boolean
}

export function linkReplyText(input: LinkReplyInput): string {
  if (input.disabled) {
    return [
      "Undangan ini sudah ditutup, jadi tautannya tidak bisa dibuka lagi (termasuk tautan tamu yang sudah dibagikan).",
      "Kalau memang mau diaktifkan lagi, balas \"minta tim\" dan aku sambungkan ke tim CS.",
    ].join("\n")
  }

  const lines: string[] = []

  if (!input.published) {
    lines.push("Undangannya belum tayang, jadi tautannya belum bisa dibuka tamu.")
    if (input.blockers.length) {
      lines.push(`Yang menahan undangan belum tayang: ${input.blockers.join(", ")}.`)
    }
    lines.push(
      "Kalau semua sudah beres (termasuk pembayaran), tekan *Konfirmasi* di halaman pratinjau — tautan langsung aktif."
    )
    lines.push("")
  }

  if (input.mode === "fleksibel") {
    lines.push(
      "Mode tautan Kakak *Fleksibel*: satu tautan bisa dipakai untuk semua tamu, nama tamu ditulis di belakangnya."
    )
    lines.push("")
    lines.push(`Tautan: ${input.link}`)
    lines.push(`Contoh: ${input.link}?to=Budi%20%26%20Ani`)
    lines.push("")
    lines.push("• Spasi ditulis %20, tanda & ditulis %26 (untuk nama pasangan). Kalau tidak, nama setelah & bisa hilang.")
    lines.push("• Nama yang tampil mengikuti tulisan di tautan, jadi tulis nama tamu apa adanya.")
    lines.push("• Tamu yang mengisi RSVP otomatis masuk daftar tamu.")
    return lines.join("\n")
  }

  lines.push(
    "Mode tautan Kakak *Terbatas*: tautan hanya terbuka untuk tamu yang sudah terdaftar. Nama yang diketik bebas akan ditolak (halamannya tidak ditemukan)."
  )
  lines.push("")
  lines.push("Ambil tautan per tamu di dashboard:")
  lines.push(`1. Buka ${input.dashboardUrl}`)
  lines.push('2. Pilih "Undangan dan QR Tamu"')
  lines.push("3. Salin tautan atau unduh QR tiap tamu")
  lines.push("")
  lines.push(
    'Kalau Kakak justru mau satu tautan umum yang bisa dibuka siapa saja, ubah mode tautan ke "Fleksibel" di halaman yang sama.'
  )
  return lines.join("\n")
}
