// Bagian murni jawaban "template <kategori> ada apa aja": label, link, format.
// Tanpa import supaya bisa diuji tanpa Supabase.

const SITE = "https://wedding.aksaraa.com"

const LABELS: Record<string, { label: string; page?: string }> = {
  adat: { label: "adat/tradisional", page: "adat" },
  batak: { label: "adat Batak", page: "adat" },
  jawa: { label: "adat Jawa", page: "adat" },
  minang: { label: "adat Minang", page: "adat" },
  melayu: { label: "adat Melayu", page: "adat" },
  bugis: { label: "adat Bugis", page: "adat" },
  dayak: { label: "adat Dayak", page: "adat" },
  banjar: { label: "adat Banjar", page: "adat" },
  bali: { label: "adat Bali", page: "adat" },
  betawi: { label: "adat Betawi", page: "adat" },
  palembang: { label: "adat Palembang", page: "adat" },
  tionghoa: { label: "Tionghoa", page: "adat" },
  elegance: { label: "elegant", page: "elegansi" },
  elegansi: { label: "elegant", page: "elegansi" },
  floral: { label: "floral", page: "floral" },
  modern: { label: "modern", page: "modern" },
  minimal: { label: "modern minimalis", page: "modern" },
  nasional: { label: "nasional" },
  interaktif: { label: "undangan interaktif" },
  "tanpa-foto": { label: "tanpa foto", page: "tanpa-foto" },
  "dengan-foto": { label: "dengan foto" },
}

export interface CategoryTemplateRow {
  name: string | null
  category: string | null
  no_photo: boolean | null
  is_active: boolean | null
  popular_rank: number | null
}

export function categoryLabel(key: string): string {
  return LABELS[key]?.label || key
}

export function categoryPageUrl(key: string): string {
  const page = LABELS[key]?.page
  return page ? `${SITE}/templates/kategori/${page}` : `${SITE}/templates`
}

function isPlaceholder(name: string): boolean {
  return /^template[-\s]?\d*$/i.test(name.trim())
}

export function formatCategoryReply(key: string, rows: CategoryTemplateRow[], limit = 8): string {
  const label = categoryLabel(key)
  const unique = Array.from(
    new Set(
      rows
        .map((row) => (row.name || "").trim())
        .filter((name) => name && !isPlaceholder(name))
    )
  )
  if (!unique.length) {
    return [
      `Untuk template ${label} belum ada yang aktif saat ini.`,
      `Semua desain bisa dilihat di ${SITE}/templates`,
      "Kalau mau, sebutkan tema atau daerahnya biar aku bantu carikan yang paling dekat.",
    ].join("\n")
  }
  const shown = unique.slice(0, limit)
  const rest = unique.length - shown.length
  const lines = [
    `Untuk template ${label} ada ${unique.length} desain aktif. Yang sering dipilih:`,
    ...shown.map((name) => `• ${name}`),
  ]
  if (rest > 0) lines.push(`• …dan ${rest} desain lain`)
  lines.push("", `Lihat preview dan filternya di sini: ${categoryPageUrl(key)}`)
  lines.push("Mau aku bantu pilihkan yang paling cocok dengan acara Kakak?")
  return lines.join("\n")
}

// Daftar untuk rak "terbaru"/"populer". Nama tetap dari DB, bukan dari model.
export function formatShelfReply(shelf: "newest" | "popular", rows: CategoryTemplateRow[], limit = 8): string {
  const unique = Array.from(
    new Set(
      rows
        .map((row) => (row.name || "").trim())
        .filter((name) => name && !isPlaceholder(name))
    )
  )
  if (!unique.length) {
    return `Daftar desain bisa dilihat di ${SITE}/templates`
  }
  const shown = unique.slice(0, limit)
  const title = shelf === "newest" ? "Desain terbaru" : "Desain paling banyak dipilih"
  const lines = [`${title} saat ini:`, ...shown.map((name) => `• ${name}`)]
  if (unique.length > shown.length) lines.push(`• …dan ${unique.length - shown.length} desain lain`)
  lines.push("", `Preview dan filter lengkapnya di ${SITE}/templates`)
  lines.push("Mau aku bantu pilihkan yang cocok dengan acara Kakak?")
  return lines.join("\n")
}
