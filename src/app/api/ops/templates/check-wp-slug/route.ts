import { NextResponse } from "next/server"
import { requireOpsEmployee } from "@/lib/ops-auth"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

// GET /api/ops/templates/check-wp-slug?slug=marry-with-you
// Validates that a WP master post exists for the given slug (returns post title).
export async function GET(req: Request) {
  const guard = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!guard.ok) return guard.res

  const url = new URL(req.url)
  const slug = (url.searchParams.get("slug") || "").trim()
  if (!slug) return NextResponse.json({ ok: false, msg: "Slug wajib diisi." }, { status: 400 })

  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ ok: false, msg: "Integrasi WordPress belum dikonfigurasi pada environment ini." }, { status: 501 })
  }

  try {
    const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/post/${encodeURIComponent(slug)}`, {
      headers: { "X-Aksaraa-Secret": WP_SECRET },
      cache: "no-store",
    })
    if (res.status === 404) {
      return NextResponse.json({ ok: false, msg: `Postingan "/${slug}/" tidak ditemukan di WordPress.` })
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, msg: "Gagal memeriksa WordPress (" + res.status + ")" }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, title: data.title || slug, msg: `Ditemukan: ${data.title || slug}` })
  } catch {
    return NextResponse.json({ ok: false, msg: "WordPress tidak dapat dijangkau." }, { status: 502 })
  }
}
