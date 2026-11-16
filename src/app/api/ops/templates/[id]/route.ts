import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { normalizeTemplateTier } from "@/lib/templateTier"
import { parsePopularRank } from "@/lib/templatePopularRank"

// PUT /api/ops/templates/[id] — update template (demo_url uniqueness enforced)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
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

  let nextRank: number | null | undefined
  if ("popular_rank" in body) {
    const parsed = parsePopularRank(body.popular_rank)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    nextRank = parsed.value
  }
  if (typeof nextRank === "number") {
    const { data: holder } = await supabaseAdmin
      .from("web_templates")
      .select("id, name")
      .eq("popular_rank", nextRank)
      .neq("id", id)
      .maybeSingle()
    if (holder) {
      return NextResponse.json(
        { error: `Urutan populer #${nextRank} sudah dipakai oleh "${holder.name}". Kosongkan dulu template itu.` },
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
  if ("category" in body) patch.category = body.category ? String(body.category).trim() : null
  if ("tier" in body) patch.tier = normalizeTemplateTier(body.tier)
  if ("no_photo" in body) patch.no_photo = body.no_photo === true
  if (nextRank !== undefined) patch.popular_rank = nextRank
  if ("event_type" in body) {
    patch.event_type = body.event_type === "kids" ? "kids" : "wedding"
  }
  // source_type switches effective; switching to in-house clears the WP contract.
  if ("source_type" in body) {
    const isInhouse = body.source_type === "inhouse"
    patch.source_type = isInhouse ? "inhouse" : "wp"
    if (isInhouse) {
      patch.wp_master_slug = null
      patch.wp_manifest = null
    }
  }
  if ("wp_master_slug" in body && patch.source_type !== "inhouse") patch.wp_master_slug = body.wp_master_slug || null
  if ("wp_manifest" in body && patch.source_type !== "inhouse") {
    patch.wp_manifest = body.wp_manifest && typeof body.wp_manifest === "object" ? body.wp_manifest : null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from("web_templates").update(patch).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE /api/ops/templates/[id] — soft delete (is_active=false) by
// default; ?hard=true removes the row from the DB. Hard delete is refused
// with 409 while any profile or feedback references the template.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res

  const { id } = await ctx.params
  const hard = new URL(req.url).searchParams.get("hard") === "true"
  if (!hard) {
    const { data, error } = await supabaseAdmin
      .from("web_templates")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ template: data })
  }

  const [{ count: profileCount }, { count: feedbackCount }] = await Promise.all([
    supabaseAdmin.from("wedding_profiles").select("id", { count: "exact", head: true }).eq("selected_template_id", id),
    supabaseAdmin.from("feedback_submissions").select("id", { count: "exact", head: true }).eq("template_id", id),
  ])
  if ((profileCount || 0) > 0 || (feedbackCount || 0) > 0) {
    return NextResponse.json(
      {
        error: `Template dipakai ${profileCount || 0} profil & ${feedbackCount || 0} feedback — nonaktifkan saja, jangan hapus.`,
      },
      { status: 409 },
    )
  }
  const { error } = await supabaseAdmin.from("web_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
