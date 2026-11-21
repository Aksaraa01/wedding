// Filter kategori template yang toleran: "adat" harus cocok dengan
// "Adat/Tradisional" maupun "Budaya", karena label di DB tidak seragam.

const REGION_ALIASES: { match: string[]; terms: string[] }[] = [
  { match: ["batak", "horas"], terms: ["batak", "horas", "sai horas"] },
  { match: ["jawa"], terms: ["jawa"] },
  { match: ["minang", "padang"], terms: ["minang", "padang"] },
  { match: ["melayu"], terms: ["melayu"] },
  { match: ["bugis"], terms: ["bugis"] },
  { match: ["dayak"], terms: ["dayak"] },
  { match: ["banjar"], terms: ["banjar"] },
  { match: ["bali"], terms: ["bali"] },
  { match: ["betawi"], terms: ["betawi"] },
  { match: ["palembang"], terms: ["palembang"] },
  { match: ["tionghoa", "chinese", "cina"], terms: ["cinnabar", "tionghoa"] },
]

export function categoryTerms(input: string): string[] {
  const term = (input || "").trim().toLowerCase()
  if (!term) return []

  // "adat batak" harus mencari kata Batak/Horas, bukan semua template adat.
  const region = REGION_ALIASES.find((entry) => entry.match.some((word) => term.includes(word)))
  if (region) return region.terms

  if (term.includes("adat") || term.includes("tradisional") || term.includes("budaya")) {
    return ["adat", "tradisional", "budaya"]
  }
  if (term.includes("elegansi") || term.includes("elegant")) {
    return ["elegant", "elegansi"]
  }
  if (term.includes("modern")) return ["modern"]
  if (term.includes("floral")) return ["floral"]
  if (term.includes("minimal")) return ["minimal"]
  if (term.includes("interaktif") || term.includes("interaksi")) {
    return ["interaktif", "interaksi"]
  }

  return [term]
}

export function matchesTemplateCategory(
  template: { category?: string | null; name?: string | null },
  term: string
): boolean {
  const terms = categoryTerms(term)
  if (terms.length === 0) return true

  const haystack = `${template.category || ""} ${template.name || ""}`.toLowerCase()
  return terms.some((item) => haystack.includes(item))
}

// Baris placeholder seperti "Template-2" bukan template nyata.
export function isPlaceholderTemplate(name: string | null | undefined): boolean {
  return /^template[-\s]?\d*$/i.test((name || "").trim())
}

// Kategori/gaya yang disebut klien. Dipakai untuk memilih daftar yang benar:
// "template adat ada apa aja?" bukan permintaan seluruh galeri.
const CATEGORY_WORDS: { key: string; test: RegExp }[] = [
  { key: "tanpa-foto", test: /tanpa foto|nggak pakai foto|tidak pakai foto/ },
  { key: "dengan-foto", test: /dengan foto|pakai foto|ada fotonya/ },
  { key: "batak", test: /\bbatak\b|\bhoras\b/ },
  { key: "jawa", test: /\bjawa\b/ },
  { key: "minang", test: /\bminang\b|\bpadang\b/ },
  { key: "melayu", test: /\bmelayu\b/ },
  { key: "bugis", test: /\bbugis\b/ },
  { key: "dayak", test: /\bdayak\b/ },
  { key: "banjar", test: /\bbanjar\b/ },
  { key: "bali", test: /\bbali\b/ },
  { key: "betawi", test: /\bbetawi\b/ },
  { key: "palembang", test: /\bpalembang\b/ },
  { key: "tionghoa", test: /tionghoa|chinese|\bcina\b/ },
  { key: "adat", test: /\badat\b|tradisional|budaya/ },
  { key: "elegansi", test: /elegan|elegant/ },
  { key: "floral", test: /floral|bunga/ },
  { key: "minimal", test: /minimalis|\bminimal\b/ },
  { key: "modern", test: /modern/ },
  { key: "nasional", test: /nasional/ },
  { key: "interaktif", test: /interaktif|interaksi/ },
]

export function detectTemplateCategory(text: string): string | null {
  const value = (text || "").toLowerCase()
  // Sengaja tanpa syarat kata "template": klien sering hanya menulis
  // "yang modern dong" setelah sebelumnya membahas template. Pemanggil yang
  // menjaga konteksnya (intent template / pertanyaan galeri).
  for (const entry of CATEGORY_WORDS) {
    if (entry.test.test(value)) return entry.key
  }
  return null
}

// Rak/urutan yang disebut klien: "template terbaru apa aja?", "yang paling
// populer?". Ini bukan permintaan seluruh galeri.
export type TemplateShelf = "newest" | "popular" | null

export function detectTemplateShelf(text: string): TemplateShelf {
  const value = (text || "").toLowerCase()
  if (/populer|terpopuler|paling banyak (dipakai|dipilih)|favorit|best ?seller|paling laris/.test(value)) {
    return "popular"
  }
  if (/terbaru|paling baru|baru rilis|baru keluar|update terbaru|rilis terbaru/.test(value)) {
    return "newest"
  }
  return null
}

// Acara anak punya katalog sendiri (Ceriavite), bukan galeri pernikahan.
export function detectKidsTemplateAsk(text: string): boolean {
  return /\b(khitanan|khitan|sunatan|aqiqah|aqikah|ulang tahun|ultah|anak|ceriavite)\b/.test(
    (text || "").toLowerCase()
  )
}

// "template premium itu apa?", "bedanya basic sama premium?" — ini soal FILTER
// paket di galeri, bukan kualitas desain dan bukan paket Buku Tamu Digital.
export function detectTemplatePackageAsk(text: string): boolean {
  const value = (text || "").toLowerCase()
  if (!/\b(basic|premium)\b/.test(value)) return false
  return /template|desain|galeri|filter|beda|bedanya|maksud|arti|apa itu|paket/.test(value)
}

// Klien minta undangannya diganti ke template/desain lain. Bukan permintaan
// daftar galeri, dan bukan sesuatu yang boleh dijanjikan bot.
export function asksToSwitchTemplate(text: string): boolean {
  const value = (text || "").toLowerCase()
  // "ganti template" (aktif) dan "template saya bisa diganti?" (pasif).
  const active = /\b(ganti|ubah|pindah|replace|switch)\s+(template|desain|tema)\b/.test(value)
  const passive =
    /\b(template|desain|tema)\b[^.?!]{0,25}\b(di)?(ganti|ubah|pindah)\b(?!\s*(warna|foto|isi|nama|teks|musik|lagu|tanggal|tulisan))/.test(
      value
    )
  return active || passive
}

// Satu pintu untuk memilih jawaban template yang tepat. Murni (tanpa DB) supaya
// bisa diuji, dan supaya orchestrator tidak perlu menebak.
export type TemplateAnswerKind = "kids" | "package" | "category" | "newest" | "popular" | null

export function templateAnswerKind(text: string): TemplateAnswerKind {
  const value = (text || "").toLowerCase()
  if (asksToSwitchTemplate(value)) return null
  if (detectKidsTemplateAsk(value)) return "kids"
  if (detectTemplatePackageAsk(value)) return "package"
  if (detectTemplateCategory(value)) return "category"
  const shelf = detectTemplateShelf(value)
  if (shelf === "newest") return "newest"
  if (shelf === "popular") return "popular"
  return null
}

// Permintaan umum untuk melihat semua/daftar template (galeri), bukan 3 contoh.
// Kategori/spesifik (adat, terbaru, populer, premium filter, ganti template)
// bukan "lihat semua template".
export function wantsAllTemplates(text: string): boolean {
  const value = (text || "").toLowerCase()
  if (asksToSwitchTemplate(value)) return false
  if (detectTemplatePackageAsk(value)) return false
  if (detectKidsTemplateAsk(value)) return false
  if (detectTemplateCategory(value)) return false
  if (detectTemplateShelf(value)) return false
  if (/semua\s+(template|desain|tema)/.test(value)) return true
  if (/lihat\s+semua/.test(value)) return true
  if (/\bdaftar\b|\bminta\s+list\b|\blist\b/.test(value)) return true
  if (/dilihat\s+di\s*mana|lihat\s+di\s*mana|bisa\s+dilihat|bisa\s+lihat/.test(value)) return true
  if (/template.{0,25}apa\s+(saja|aja)|desain.{0,25}apa\s+(saja|aja)|apa\s+(saja|aja).{0,25}(template|desain)/.test(value)) return true
  return false
}
