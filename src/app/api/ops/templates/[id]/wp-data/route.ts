import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

// GET /api/ops/templates/[id]/wp-data — fetch WP master post element tree for mapping UI.
// Calls the WP mu-plugin endpoint: GET {wp}/wp-json/aksaraa/v1/post/{slug}/elements
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!guard.ok) return guard.res

  const { id } = await ctx.params
  const { data: tpl } = await supabaseAdmin.from("web_templates").select("wp_master_slug").eq("id", id).maybeSingle()
  if (!tpl) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 })

  const slug = tpl.wp_master_slug
  if (!slug) {
    return NextResponse.json({ error: "Template ini belum memiliki WP master slug. Simpan terlebih dahulu." }, { status: 400 })
  }
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi pada environment ini." }, { status: 501 })
  }

  try {
    const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/post/${encodeURIComponent(slug)}/elements`, {
      headers: { "X-Aksaraa-Secret": WP_SECRET },
      cache: "no-store",
    })
    if (!res.ok) {
      return NextResponse.json({ error: "Gagal memuat elemen dari WordPress (" + res.status + ")" }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "WordPress tidak dapat dijangkau. Pastikan server WP aktif." }, { status: 502 })
  }
}
