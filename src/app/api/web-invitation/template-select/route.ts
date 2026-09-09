import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { enqueueCleanup, enqueueDuplicate } from "@/lib/wpSyncWorker"

// POST /api/web-invitation/template-select
// Sets the couple's template by source:
//  - 'wp'      → enqueue the WP duplicate job (existing flow, polled by the client).
//  - 'inhouse' → assign selected_template_id immediately and clear any stale WP
//                duplicate of this couple (best-effort async cleanup of the old post).
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const { profile_id, template_id } = body || {}
    if (!profile_id || !template_id) {
      return NextResponse.json({ error: "profile_id dan template_id wajib diisi" }, { status: 400 })
    }

    const [profileRes, tplRes] = await Promise.all([
      supabaseAdmin
        .from("wedding_profiles")
        .select("slug, active_wp_post_id, selected_template_id")
        .eq("id", profile_id)
        .maybeSingle(),
      supabaseAdmin.from("web_templates").select("id, source_type").eq("id", template_id).maybeSingle(),
    ])

    if (!profileRes.data) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }
    if (!tplRes.data) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 })
    }

    if (tplRes.data.source_type === "inhouse") {
      const oldPostId = profileRes.data.active_wp_post_id
      const { error } = await supabaseAdmin
        .from("wedding_profiles")
        .update({
          selected_template_id: template_id,
          active_wp_post_id: null,
          active_wp_post_url: null,
        })
        .eq("id", profile_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      if (oldPostId) {
        await enqueueCleanup(profile_id, oldPostId, profileRes.data.slug || "").catch(() => {})
      }
      return NextResponse.json({ mode: "inhouse", selected_template_id: template_id })
    }

    const job = await enqueueDuplicate(profile_id, template_id)
    return NextResponse.json({ mode: "wp", job_id: job.job_id, status: job.status }, { status: 202 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}