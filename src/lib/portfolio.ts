import { supabaseAdmin } from "@/lib/supabase"
import { PACKAGE_LABELS, deriveSelections } from "@/lib/packages"
import { FEATURE_LABELS } from "@/lib/opsConstants"

// Real weddings for /portofolio: completed projects with explicit ops
// consent (portfolio_visible). The index shows only curated featured picks
// (portfolio_featured, max 5); detail pages + sitemap cover all visible.
// Server-only (service role). Shared by the index, detail, and sitemap.
export type PortfolioEntry = {
  slug: string
  groom: string
  bride: string
  date: string | null
  venue: string | null
  covers: string[]
  illustration: string | null
  templateName: string | null
  templatePreview: string | null
  packageLabel: string
  features: string[]
}

export const PORTFOLIO_INDEX_CAP = 5

function firstImage(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) {
    try {
      const p = JSON.parse(value)
      if (Array.isArray(p)) return p.filter((u) => typeof u === "string" && (u as string).trim())
      return [value.trim()]
    } catch {
      return [value.trim()]
    }
  }
  if (Array.isArray(value)) return value.filter((u) => typeof u === "string" && (u as string).trim())
  return []
}

export async function getPortfolioEntries(): Promise<PortfolioEntry[]> {
  const { data: queues } = await supabaseAdmin
    .from("ops_queue")
    .select("wedding_profile_id")
    .eq("status", "project_selesai")
  const ids = [...new Set(((queues as { wedding_profile_id: string }[] | null) || []).map((q) => q.wedding_profile_id))].filter(Boolean)
  if (ids.length === 0) return []

  const { data: profiles } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id,slug,bride_name,groom_name,bride_full_name,groom_full_name,estimated_wedding_date,sessions,cover_photos,couple_illustration_url,selected_template_id,package_type,undangan_fisik,portfolio_visible,portfolio_featured")
    .in("id", ids)

  const tplIds = [...new Set(((profiles as { selected_template_id: string | null }[] | null) || []).map((p) => p.selected_template_id).filter(Boolean))] as string[]
  let tplNames = new Map<string, string>()
  let tplPreviews = new Map<string, string>()
  if (tplIds.length > 0) {
    const { data: tpls } = await supabaseAdmin.from("web_templates").select("id,name,preview_image_url").in("id", tplIds)
    for (const t of ((tpls as { id: string; name: string; preview_image_url: string | null }[] | null) || [])) {
      tplNames.set(t.id, t.name)
      if (t.preview_image_url) tplPreviews.set(t.id, t.preview_image_url)
    }
  }

  return (((profiles as any[] | null) || [])
    .filter((p) => p.portfolio_visible === true)
    .map((p) => {
      const covers = firstImage(p.cover_photos)
      const groom = (p.groom_name || "").trim()
      const bride = (p.bride_name || "").trim()
      const sessions = Array.isArray(p.sessions) ? p.sessions : []
      const packageType = p.package_type || "signature"
      const packageLabelType = packageType === "cetak_undangan_bonus" ? "signature" : packageType === "bonus_full_custom" ? "elite" : packageType
      const sel = deriveSelections(packageType, p.undangan_fisik === true)
      const order: (keyof typeof sel)[] = [
        "premium_web", "qr_code_book", "galeri_foto_tamu", "wish_wall",
        "wa_blast", "reservation_automation", "kolom_direct_transfer", "undangan_fisik",
      ]
      return {
        slug: p.slug,
        groom,
        bride,
        date: p.estimated_wedding_date || sessions[0]?.date || null,
        venue: sessions[0]?.venue || null,
        covers,
        illustration: typeof p.couple_illustration_url === "string" ? p.couple_illustration_url : null,
        templateName: (p.selected_template_id && tplNames.get(p.selected_template_id)) || null,
        templatePreview: (p.selected_template_id && tplPreviews.get(p.selected_template_id)) || null,
        packageLabel: PACKAGE_LABELS[packageLabelType] || packageLabelType,
        features: order.filter((k) => (sel as any)[k]).map((k) => FEATURE_LABELS[k] || k),
        featured: p.portfolio_featured === true,
      } as PortfolioEntry & { featured: boolean }
    })
    .filter((e) => e.slug && e.groom && e.bride && (e.covers.length > 0 || e.illustration)))
    .sort((a, b) =>
      Number(b.featured) - Number(a.featured) ||
      String(b.date || "").localeCompare(String(a.date || ""))
    )
}

// Curated index entries: featured picks first, capped at PORTFOLIO_INDEX_CAP.
export function portfolioIndexEntries(entries: PortfolioEntry[]): PortfolioEntry[] {
  return entries
    .filter((e) => (e as PortfolioEntry & { featured: boolean }).featured)
    .slice(0, PORTFOLIO_INDEX_CAP)
}
