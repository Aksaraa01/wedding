// Template-gallery shaping: the "Top 10 Populer" / "Top 10 Terbaru" shelves and
// the per-category rows shared by /templates, /premium-web-invitation and the
// couple's dashboard picker. Pure helpers only — safe in client components.
//
// Ordering rules:
//   * populer — ops owns web_templates.popular_rank (1..10). Anything left over
//     is padded with tier "Populer" rows, then the curated sort_order, so the
//     shelf is never half empty on a fresh database.
//   * terbaru — newest web_templates.created_at first (registration date, which
//     is the release date for this catalogue).

import { TEMPLATE_CATEGORIES, matchesCategory } from "./templateCategory"

export type GalleryTemplate = {
  id: string
  code: string
  name: string
  preview_image_url: string | null
  demo_url?: string | null
  description?: string | null
  category?: string | null
  tier?: string | null
  no_photo?: boolean | null
  popular_rank?: number | null
  sort_order?: number | null
  created_at?: string | null
  package_eligibility?: string[] | null
}

export type PhotoFilter = "semua" | "dengan" | "tanpa"

// Public package filter. A template's package_eligibility lists the package
// codes it ships in, so each bucket is a set of codes that group together in
// the catalogue: the bonus print package reads as "Basic", the entry paid tier
// as "Essensial", and everything above it (incl. the full-custom bonus) as
// "Signature & Up". Empty/absent eligibility means "every package".
export type PackageFilter = "semua" | "basic" | "essensial" | "signature-up"

export const PACKAGE_FILTERS: { id: PackageFilter; label: string; codes: string[] }[] = [
  { id: "semua", label: "Semua", codes: [] },
  { id: "basic", label: "Basic", codes: ["cetak_undangan_bonus"] },
  { id: "essensial", label: "Essensial", codes: ["essential"] },
  {
    id: "signature-up",
    label: "Signature & Up",
    codes: ["signature", "prestige", "elite", "bonus_full_custom"],
  },
]

export type GalleryRow = {
  id: string
  label: string
  /** Landing page on the public site (built-in categories only). */
  href?: string
  /** Chip id the interactive picker filters by (absent when unfilterable). */
  filterId?: string
  templates: GalleryTemplate[]
}

export const POPULAR_LIMIT = 10
export const NEWEST_LIMIT = 10
export const SHELF_LIMIT = 6

// "tanpa-foto" is a cross-cutting property (no_photo), not a category row.
const ROW_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c.id !== "tanpa-foto")
const HIDDEN_DB_CATEGORIES = ["nasional", "budaya"]

export function matchesPhoto(t: GalleryTemplate, filter: PhotoFilter): boolean {
  if (filter === "tanpa") return t.no_photo === true
  if (filter === "dengan") return t.no_photo !== true
  return true
}

export function matchesPackage(t: GalleryTemplate, filter: PackageFilter): boolean {
  if (filter === "semua") return true
  const group = PACKAGE_FILTERS.find((g) => g.id === filter)
  if (!group) return true
  const elig = t.package_eligibility
  if (!Array.isArray(elig) || elig.length === 0) return true
  return elig.some((code) => group.codes.includes(code))
}

export function matchesSearch(t: GalleryTemplate, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [t.name, t.category, t.description, t.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q)
}

export function popularTemplates(all: GalleryTemplate[], limit = POPULAR_LIMIT): GalleryTemplate[] {
  const ranked = all
    .filter((t) => typeof t.popular_rank === "number" && t.popular_rank > 0)
    .sort((a, b) => (a.popular_rank as number) - (b.popular_rank as number))
    .slice(0, limit)

  if (ranked.length >= limit) return ranked

  const seen = new Set(ranked.map((t) => t.id))
  const fillers = all
    .filter((t) => !seen.has(t.id))
    .sort((a, b) => {
      const ap = a.tier === "Populer" ? 0 : 1
      const bp = b.tier === "Populer" ? 0 : 1
      if (ap !== bp) return ap - bp
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "id")
    })
    .slice(0, limit - ranked.length)

  return [...ranked, ...fillers]
}

export function newestTemplates(all: GalleryTemplate[], limit = NEWEST_LIMIT): GalleryTemplate[] {
  return [...all]
    .sort((a, b) => {
      const at = a.created_at ? Date.parse(a.created_at) : 0
      const bt = b.created_at ? Date.parse(b.created_at) : 0
      if (bt !== at) return bt - at
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "id")
    })
    .slice(0, limit)
}

// Category rows for the shelves under the two top-10 lists. Built-in categories
// keep their SEO landing page as "Lihat semua"; free-text DB categories that no
// built-in bucket covers get their own row without a link.
export function galleryRows(all: GalleryTemplate[], limit = SHELF_LIMIT): GalleryRow[] {
  const rows: GalleryRow[] = []
  const claimed = new Set<string>()

  for (const cat of ROW_CATEGORIES) {
    const items = all.filter((t) => matchesCategory(t.category, cat.id))
    if (items.length === 0) continue
    items.forEach((t) => claimed.add(t.id))
    rows.push({
      id: cat.id,
      label: cat.label,
      href: `/templates/kategori/${cat.id}`,
      filterId: cat.id,
      templates: items.slice(0, limit),
    })
  }

  const extra = [...new Set(all.map((t) => (t.category || "").trim()).filter(Boolean))]
    .filter((c) => {
      const lower = c.toLowerCase()
      if (HIDDEN_DB_CATEGORIES.includes(lower)) return false
      return !ROW_CATEGORIES.some((cat) => matchesCategory(c, cat.id))
    })
    .sort((a, b) => a.localeCompare(b, "id"))

  for (const c of extra) {
    const items = all.filter((t) => matchesCategory(t.category, c.trim().toLowerCase()))
    if (items.length === 0) continue
    items.forEach((t) => claimed.add(t.id))
    rows.push({
      id: `cat-${c.toLowerCase()}`,
      label: c,
      filterId: c.trim().toLowerCase(),
      templates: items.slice(0, limit),
    })
  }

  // Never drop a template from the page: anything whose category matched no
  // bucket lands in a final row instead of disappearing.
  const rest = all.filter((t) => !claimed.has(t.id))
  if (rest.length > 0) {
    rows.push({ id: "lainnya", label: "Lainnya", templates: rest.slice(0, limit) })
  }

  return rows
}
