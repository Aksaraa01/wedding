import { supabaseAdmin } from "@/lib/supabase"
import { KIDS_SITE } from "@/lib/eventType"
import {
  designFamily,
  featuredDesigns,
  localPreviewUrl,
  type DesignTemplate,
} from "@/lib/designCatalogue"
import DesignHeader from "./DesignHeader"
import DesignShowcase from "./DesignShowcase"
import DesignCatalogue from "./DesignCatalogue"
import DesignCustom from "./DesignCustom"
import DesignFooter from "./DesignFooter"

type TemplateRow = {
  id: string
  code: string
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
  category: string | null
  tier: string | null
  no_photo: boolean | null
  popular_rank: number | null
  sort_order: number | null
  created_at: string | null
  event_type: string | null
}

export const DESIGN_TEMPLATE_SELECT =
  "id,code,name,description,preview_image_url,demo_url,category,tier,no_photo,popular_rank,sort_order,created_at,event_type"

function toDesign(row: TemplateRow): DesignTemplate {
  const family = designFamily(row.event_type)
  const templateQuery = `?template=${encodeURIComponent(row.code)}`
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    preview_image_url: row.preview_image_url,
    preview_url: localPreviewUrl(row.demo_url),
    // Kids designs live on the Ceriavite host, so "Pilih" must cross hosts
    // (`/daftar` does not exist on aksaraa.com). Wedding stays same-origin.
    select_href:
      family === "kids" ? `${KIDS_SITE}/daftar${templateQuery}` : `/register${templateQuery}`,
    family,
    category: row.category,
    tier: row.tier,
    no_photo: row.no_photo,
    popular_rank: row.popular_rank,
    sort_order: row.sort_order,
    created_at: row.created_at,
  }
}

export async function getDesignTemplates(): Promise<DesignTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select(DESIGN_TEMPLATE_SELECT)
    .eq("is_active", true)
    .in("event_type", ["wedding", "kids"])
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return ((data as TemplateRow[] | null) || []).map(toDesign)
}

/**
 * The Aksaraa homepage catalogue: wedding + Ceriavite designs in one page.
 *
 * Rendered by `/design` and, through the apex rewrite in `src/proxy.ts`, by
 * `https://aksaraa.com/`. Both entry points share this component so the two
 * URLs can never drift.
 */
export default async function DesignPage() {
  const templates = await getDesignTemplates()
  const wedding = templates.filter((t) => t.family === "wedding")
  const kids = templates.filter((t) => t.family === "kids")
  const featured = featuredDesigns(
    wedding.filter((t) => Boolean(t.preview_image_url)),
    3,
  )
  const sampleImage = wedding.find((t) => t.preview_image_url)?.preview_image_url || null

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1817] antialiased">
      <DesignHeader />
      <main>
        <DesignShowcase items={featured} />
        <DesignCatalogue wedding={wedding} kids={kids} />
        <DesignCustom sampleImage={sampleImage} />
      </main>
      <DesignFooter />
    </div>
  )
}
