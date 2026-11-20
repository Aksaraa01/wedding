// Router pertanyaan template: kategori/daerah, rak terbaru & populer, filter
// paket, dan acara anak. Nama desain selalu dari DB, bukan ingatan model.
//
// Ini yang mencegah "template adat ada apa aja?" dijawab dengan seluruh galeri.

import { supabaseAdmin } from "@/lib/supabase"
import {
  asksToSwitchTemplate,
  detectKidsTemplateAsk,
  detectTemplateCategory,
  detectTemplatePackageAsk,
  detectTemplateShelf,
  matchesTemplateCategory,
  templateAnswerKind,
} from "@/lib/cs/templateFilter"
import { formatCategoryReply, formatShelfReply, type CategoryTemplateRow } from "@/lib/cs/templateCategoryReply"
import { premiumTemplateReply, templateGalleryReply } from "@/lib/cs/contact"

async function loadTemplates(): Promise<CategoryTemplateRow[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("name,category,no_photo,is_active,popular_rank,created_at")
    .eq("is_active", true)
    .order("popular_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200)
  return (data || []) as CategoryTemplateRow[]
}

export async function templateAnswer(text: string): Promise<string | null> {
  const kind = templateAnswerKind(text)
  if (!kind) return null

  if (kind === "kids") return templateGalleryReply(true)
  if (kind === "package") return premiumTemplateReply()

  const rows = await loadTemplates()

  if (kind === "newest") {
    const newest = [...rows].sort((a, b) => {
      const left = (a as { created_at?: string }).created_at || ""
      const right = (b as { created_at?: string }).created_at || ""
      return right.localeCompare(left)
    })
    return formatShelfReply("newest", newest)
  }
  if (kind === "popular") {
    const popular = rows
      .filter((row) => typeof row.popular_rank === "number")
      .sort((a, b) => (a.popular_rank || 99) - (b.popular_rank || 99))
    return formatShelfReply("popular", popular.length ? popular : rows)
  }

  const key = detectTemplateCategory(text)
  if (!key) return null
  let filtered = rows
  if (key === "tanpa-foto") filtered = rows.filter((row) => row.no_photo === true)
  else if (key === "dengan-foto") filtered = rows.filter((row) => row.no_photo !== true)
  else filtered = rows.filter((row) => matchesTemplateCategory(row, key))
  return formatCategoryReply(key, filtered)
}
