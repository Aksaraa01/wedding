// Pure, client-safe presentation helpers for article categories.
// Icons must exist in the Material Symbols subset in src/app/layout.tsx.

export interface ArticleCategoryStyle {
  icon: string
  from: string
  to: string
}

const CATEGORY_STYLES: Record<string, ArticleCategoryStyle> = {
  Panduan: { icon: "menu_book", from: "#B34E3F", to: "#7C3230" },
  "Wedding Planner": { icon: "event_available", from: "#8A6A45", to: "#4F3A24" },
  Checklist: { icon: "fact_check", from: "#4E6B5A", to: "#2C4436" },
  Tradisi: { icon: "auto_stories", from: "#8B5E3C", to: "#543421" },
  Harga: { icon: "payments", from: "#A5762F", to: "#664518" },
  Template: { icon: "palette", from: "#6B5B7B", to: "#3C3145" },
  "Galeri Tamu": { icon: "photo_library", from: "#4A6A78", to: "#28414C" },
}

const FALLBACK: ArticleCategoryStyle = { icon: "description", from: "#8A7F75", to: "#544C45" }

export function categoryStyle(category: string): ArticleCategoryStyle {
  return CATEGORY_STYLES[category] ?? FALLBACK
}
