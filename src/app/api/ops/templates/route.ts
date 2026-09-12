import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { normalizeTemplateTier } from "@/lib/templateTier"

// GET /api/ops/templates — all templates (active + inactive), for ops management
export async function GET(req: Request) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res

  const { data, error } = await supabaseAdmin
    .from("web_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST /api/ops/templates — create template with demo_url uniqueness check
export async function POST(req: Request) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
  }

  const code = String(body.code || "").trim()
  const name = String(body.name || "").trim()
  const demoUrl = String(body.demo_url || "").trim()
  if (!code || !name) {
    return NextResponse.json({ error: "Kode dan nama template wajib diisi" }, { status: 400 })
  }

  if (demoUrl) {
    const { data: dup, error: dupErr } = await supabaseAdmin
      .from("web_templates")
      .select("id, name")
      .eq("demo_url", demoUrl)
      .maybeSingle()
    if (dupErr) return NextResponse.json({ error: dupErr.message }, { status: 500 })
    if (dup) {
      return NextResponse.json(
        { error: "Demo URL sudah digunakan oleh template \"" + dup.name + "\". Mohon gunakan URL yang berbeda." },
        { status: 409 },
      )
    }
  }

  const tier = body.tier === undefined ? "Baru" : normalizeTemplateTier(body.tier)
  const sourceType = body.source_type === "inhouse" ? "inhouse" : "wp"
  const isInhouse = sourceType === "inhouse"
  const { data, error } = await supabaseAdmin
    .from("web_templates")
    .insert({
      code,
      name,
      description: body.description || null,
      preview_image_url: body.preview_image_url || null,
      demo_url: demoUrl || null,
      is_active: body.is_active !== false,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      package_eligibility: Array.isArray(body.package_eligibility) ? body.package_eligibility : [],
      category: body.category ? String(body.category).trim() : null,
      tier,
      source_type: sourceType,
      wp_master_slug: isInhouse ? null : (body.wp_master_slug || null),
      wp_manifest: isInhouse ? null : (body.wp_manifest && typeof body.wp_manifest === "object" ? body.wp_manifest : null),
    })
    .select()
    .single()

  if (error) {
    if ((error as any).code === "23505") {
      return NextResponse.json({ error: "Kode template sudah digunakan. Mohon gunakan kode yang berbeda." }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ template: data })
}
