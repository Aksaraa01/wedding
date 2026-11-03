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
