import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

// A no-photo variant must keep a target for the stock Love Story backdrop so
// the patch payload's explicit `image_bg: null` can clear it. Older variants
// dropped that mapping; derive it from the card container (or its background
// image mapping) when cloning from a with-photo template.
function withStoryBgClearMapping(source: Record<string, any>) {
  if (!source.wp_manifest || typeof source.wp_manifest !== "object") return source.wp_manifest
  const manifest = JSON.parse(JSON.stringify(source.wp_manifest))
  const slots = manifest?.stories_container
  if (!Array.isArray(slots)) return manifest
  const isBgPath = (settings: unknown) =>
    Array.isArray(settings) && settings.join(".") === "background_image.url"
  for (const slot of slots) {
    if (!slot || typeof slot !== "object" || slot.image_bg?.elementId) continue
    const candidate = isBgPath(slot.container?.settings)
      ? slot.container
      : isBgPath(slot.image_url?.settings)
        ? slot.image_url
        : null
    if (candidate?.elementId) {
      slot.image_bg = { elementId: candidate.elementId, settings: [...candidate.settings] }
    }
  }
  return manifest
}

// POST /api/ops/templates/[id]/duplicate — clone a template so a tanpa-photo
// (or other) variant starts with the full mapping instead of from zero.
// Forces is_active=false (ops activates after review) and no_photo=true;
// blanks demo_url + wp_master_slug (both unique-checked, ops re-points).
// Accepts optional { code }; falls back to `{source}-tanpa-foto(-2, ...)`.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res
  const { id } = await params

  const { data: source, error: srcErr } = await supabaseAdmin
    .from("web_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 })
  if (!source) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 })

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {}

  const codeBase = String(body.code || "").trim() || `${source.code}-tanpa-foto`
  const { data: maxRow } = await supabaseAdmin
    .from("web_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = typeof maxRow?.sort_order === "number" ? maxRow.sort_order + 1 : 0

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = attempt === 0 ? codeBase : `${codeBase}-${attempt + 1}`
    const { data, error } = await supabaseAdmin
      .from("web_templates")
      .insert({
        code,
        name: `${source.name} (Tanpa Foto)`,
        description: source.description,
        preview_image_url: source.preview_image_url,
        demo_url: null,
        is_active: false,
        sort_order: sortOrder,
        package_eligibility: Array.isArray(source.package_eligibility) ? source.package_eligibility : [],
        category: source.category,
        tier: source.tier,
        source_type: source.source_type,
        wp_master_slug: null,
        wp_manifest: source.source_type === "inhouse" ? null : withStoryBgClearMapping(source),
        no_photo: true,
      })
      .select()
      .single()
    if (!error) return NextResponse.json({ template: data })
    if ((error as { code?: string }).code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  return NextResponse.json({ error: "Gagal membuat kode unik, coba kode lain." }, { status: 409 })
}
