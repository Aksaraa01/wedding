import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { POPULAR_RANK_MAX } from "@/lib/templatePopularRank"

// GET /api/ops/templates/popular-rank — suggested lineup from real usage.
// The ops panel uses it to prefill empty slots (and for "Muat dari data"),
// so nobody has to start from an alphabetical list.
export async function GET(req: Request) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res

  const { data, error } = await supabaseAdmin
    .from("web_template_popularity")
    .select("template_id, code, name, score, selected_count, pick_count, feedback_count")
    .order("score", { ascending: false })
    .order("name", { ascending: true })
    .limit(POPULAR_RANK_MAX)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: saves } = await supabaseAdmin
    .from("web_templates")
    .select("id,name,popular_rank")
    .not("popular_rank", "is", null)
    .order("popular_rank", { ascending: true })

  return NextResponse.json({
    suggested: data || [],
    ranked: saves || [],
  })
}

// POST /api/ops/templates/popular-rank — replace the whole "Top 10 Populer"
// lineup in one call. `ordered` is the slot list (index 0 = rank 1); null marks
// an empty slot. Replacing wholesale keeps the drag-and-drop panel honest: what
// ops sees after saving is exactly the order they left.
export async function POST(req: Request) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin", "creative"] })
  if (!guard.ok) return guard.res

  let body: { ordered?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
  }

  if (!Array.isArray(body.ordered)) {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }
  if (body.ordered.length > POPULAR_RANK_MAX) {
    return NextResponse.json({ error: `Maksimal ${POPULAR_RANK_MAX} slot.` }, { status: 400 })
  }

  const ids = body.ordered.map((v) => (typeof v === "string" && v.trim() ? v.trim() : null))
  const picked = ids.filter(Boolean) as string[]
  if (new Set(picked).size !== picked.length) {
    return NextResponse.json({ error: "Satu template tidak boleh masuk dua slot." }, { status: 400 })
  }

  if (picked.length > 0) {
    const { data: found, error } = await supabaseAdmin
      .from("web_templates")
      .select("id")
      .in("id", picked)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const foundIds = new Set((found || []).map((r) => r.id))
    const missing = picked.filter((id) => !foundIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json({ error: "Ada template yang tidak ditemukan (mungkin sudah dihapus)." }, { status: 400 })
    }
  }

  // Null everything first: popular_rank is unique, so moving A(1)->B(2) and
  // B(2)->A(1) in place would collide half way through.
  const { error: clearError } = await supabaseAdmin
    .from("web_templates")
    .update({ popular_rank: null })
    .not("popular_rank", "is", null)
  if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]
    if (!id) continue
    const { error } = await supabaseAdmin.from("web_templates").update({ popular_rank: i + 1 }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: ranked, error: readError } = await supabaseAdmin
    .from("web_templates")
    .select("id,name,popular_rank")
    .not("popular_rank", "is", null)
    .order("popular_rank", { ascending: true })
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

  return NextResponse.json({ ranked: ranked || [] })
}
