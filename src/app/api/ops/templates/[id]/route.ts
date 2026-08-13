import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

// PUT /api/ops/templates/[id] — update template (demo_url uniqueness enforced)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!guard.ok) return guard.res

  const { id } = await ctx.params
  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
  }

  const existing = await supabaseAdmin.from("web_templates").select("id, code, demo_url").eq("id", id).maybeSingle()
  if (!existing.data) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 })

  const demoUrl = typeof body.demo_url === "string" ? body.demo_url.trim() : (existing.data.demo_url || "")

  // code uniqueness if changed
  const newCode = typeof body.code === "string" ? body.code.trim() : existing.data.code
  if (newCode && newCode !== existing.data.code) {
    const { data: dupCode } = await supabaseAdmin
      .from("web_templates")
      .select("id, name")
      .eq("code", newCode)
      .maybeSingle()
    if (dupCode) {
      return NextResponse.json(
        { error: "Kode template \"" + newCode + "\" sudah digunakan oleh template lain. Mohon gunakan kode yang berbeda." },
        { status: 409 },
      )
    }
  }

  if (demoUrl) {
    const { data: dup } = await supabaseAdmin
      .from("web_templates")
      .select("id, name")
      .eq("demo_url", demoUrl)
      .neq("id", id)
      .maybeSingle()
    if (dup) {
      return NextResponse.json(
        { error: "Demo URL sudah digunakan oleh template \"" + dup.name + "\". Mohon gunakan URL yang berbeda." },
        { status: 409 },
      )
    }
  }

  const patch: Record<string, unknown> = {}
  if ("name" in body) patch.name = String(body.name || "").trim()
  if ("description" in body) patch.description = body.description || null
  if ("preview_image_url" in body) patch.preview_image_url = body.preview_image_url || null
  if ("demo_url" in body) patch.demo_url = demoUrl || null
  if ("is_active" in body) patch.is_active = body.is_active !== false
  if ("sort_order" in body) patch.sort_order = typeof body.sort_order === "number" ? body.sort_order : 0
  if ("package_eligibility" in body) patch.package_eligibility = Array.isArray(body.package_eligibility) ? body.package_eligibility : []
  if ("wp_master_slug" in body) patch.wp_master_slug = body.wp_master_slug || null
  if ("wp_manifest" in body) patch.wp_manifest = body.wp_manifest && typeof body.wp_manifest === "object" ? body.wp_manifest : null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from("web_templates").update(patch).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE /api/ops/templates/[id] — soft delete (is_active=false)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!guard.ok) return guard.res

  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin
    .from("web_templates")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
