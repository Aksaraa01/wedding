import { PACKAGE_LABELS as PACKAGE_LABELS_MAP } from "@/lib/packages"

export const PACKAGE_LABELS: Record<string, string> = PACKAGE_LABELS_MAP

export const FEATURE_LABELS: Record<string, string> = {
  premium_web: "Undangan Digital",
  wish_wall: "Wish Wall",
  reservation_automation: "Reservasi Otomatis",
  kolom_direct_transfer: "Amplop Digital & Alamat Kado",
  galeri_foto_tamu: "Galeri Kenangan Tamu",
  qr_code_book: "Buku Tamu QR",
  unique_link_generator: "QR Code Tamu",
  undangan_fisik: "Undangan Fisik",
  wa_blast: "Reminder Otomatis",
}

export const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PARTIAL_DP: "Parsial (DP)",
  FULLY_PAID: "Lunas",
}

export const WA_BLAST_LABELS: Record<string, string> = {
  formal: "Formal & Resmi",
  hangat: "Hangat & Personal",
  singkat: "Singkat & Padat",
  islami: "Islami",
  mewah: "Mewah & Eksklusif",
}

// Content features where the couple fills the content themselves; ops only needs
// to contact them via WhatsApp (no "Butuh Tindakan" flag, no "Selesaikan").
export const NO_ACTION_KEYS = new Set([
  "wish_wall",
  "reservation_automation",
  "kolom_direct_transfer",
  "galeri_foto_tamu",
  "qr_code_book",
  "unique_link_generator",
])

// Cards that need ops action are pinned first.
export const CARD_PRIORITY: Record<string, number> = {
  premium_web: 0,
  unique_link_generator: 1,
  wa_blast: 2,
}

export function formatCurrency(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "TBD"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "TBD"
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getWeddingDate(profile: { estimated_wedding_date?: string; sessions?: any }): string {
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  if (sessions.length > 0 && sessions[0]?.date) return sessions[0].date
  return profile.estimated_wedding_date || ""
}

// Normalize a photo field (string URL, JSON array, or array) to a string array.
export function photoList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean)
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter(Boolean) : [v]
    } catch {
      return [v]
    }
  }
  return []
}

// Flatten cover_photos (slots may be nested arrays for slideshow) to a string list.
export function coverPhotos(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    if (Array.isArray(item)) out.push(...(item as string[]).filter(Boolean))
    else if (typeof item === "string" && item) out.push(item)
  }
  return out
}