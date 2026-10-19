// Pure, client-safe reminder builder for the Clearance console. Produces ONE
// merged message per couple (never two), listing every applicable deletion with
// its own execution date. No server imports.

export type ClearanceMessageInput = {
  coupleName: string
  packageLabel: string
  addons: string[]
  activeUntil?: string | null // invitation teardown date
  photoDeletionDate?: string | null // guest-photo deletion date
  dashboardUrl: string
}

function fmtIdDate(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function buildClearanceMessage(i: ClearanceMessageInput): string {
  const hasInvitation = !!i.activeUntil
  const hasPhotos = !!i.photoDeletionDate
  const pkg = i.addons.length ? `${i.packageLabel} + ${i.addons.join(", ")}` : i.packageLabel

  const lines: string[] = []
  lines.push(`Halo Bapak/Ibu ${i.coupleName},`)
  lines.push("")

  if (hasInvitation && hasPhotos) {
    lines.push(`Masa aktif layanan undangan digital & Galeri Foto Tamu Anda (paket ${pkg}) akan segera berakhir.`)
  } else if (hasInvitation) {
    lines.push(`Masa aktif undangan digital Anda (paket ${pkg}) akan segera berakhir.`)
  } else {
    lines.push(`Masa aktif Galeri Foto Tamu Anda (paket ${pkg}) akan segera berakhir.`)
  }
  lines.push("")

  lines.push("Yang akan kami lakukan:")
  if (hasInvitation) {
    lines.push(`• Menonaktifkan link undangan & menghapus undangan beserta medianya pada ${fmtIdDate(i.activeUntil)}.`)
  }
  if (hasPhotos) {
    lines.push(`• Menghapus seluruh Galeri Foto Tamu secara permanen pada ${fmtIdDate(i.photoDeletionDate)}.`)
  }
  lines.push("")
  lines.push("Mohon simpan / unduh data yang masih diperlukan sebelum tanggal tersebut.")
  if (hasPhotos) lines.push("Setelah dihapus, foto tamu tidak dapat dikembalikan.")
  lines.push("")
  lines.push(`Dashboard Anda: ${i.dashboardUrl}`)
  lines.push("")
  lines.push("Ini adalah notifikasi terakhir dari kami.")
  return lines.join("\n")
}

// wa.me click-to-chat URL (Ops sends from their own WhatsApp).
export function buildWaMeUrl(phone: string, message: string): string {
  const digits = (phone || "").replace(/\D/g, "")
  const normalized = digits.startsWith("0") ? "62" + digits.slice(1) : digits
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
