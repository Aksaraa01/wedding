import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { buildProfileFields } from "@/lib/buildProfileFields"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

export async function POST(req: Request) {
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi" }, { status: 501 })
  }

  try {
    const body = await req.json()
    const { template_id, profile_id, track_url } = body

    if (!template_id || !profile_id) {
      return NextResponse.json({ error: "template_id dan profile_id wajib diisi" }, { status: 400 })
    }

    // Get the template's wp_master_slug
    const { data: tpl } = await supabaseAdmin
      .from("web_templates")
      .select("wp_master_slug, name")
      .eq("id", template_id)
      .maybeSingle()

    if (!tpl?.wp_master_slug) {
      return NextResponse.json({ error: "Template tidak memiliki wp_master_slug" }, { status: 400 })
    }

    // Get profile + full content fields (also written as post meta for dynamic tags).
    const built = await buildProfileFields(profile_id)
    if (!built) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }
    const { profile, fields } = built

    // If this couple already has a duplicated WP post (theme-switch), delete it first.
    // BUT never delete the master template — resolve its post ID first and skip if equal.
    let masterPostId: number | null = null
    try {
      const masterRes = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/post/${encodeURIComponent(tpl.wp_master_slug)}`, {
        headers: { "X-Aksaraa-Secret": WP_SECRET },
      })
      if (masterRes.ok) {
        const md = await masterRes.json()
        masterPostId = typeof md.id === "number" ? md.id : null
      }
    } catch (e) {
      console.error("[wp/duplicate] resolve master failed", e)
    }

    if (profile.active_wp_post_id && profile.active_wp_post_id !== masterPostId) {
      try {
        await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${profile.active_wp_post_id}?force=1`, {
          method: "DELETE",
          headers: { "X-Aksaraa-Secret": WP_SECRET },
        })
      } catch (e) {
        console.error("[wp/duplicate] delete old post failed", e)
      }
    }

    // Resolve track_url if not provided (couple's selected track)
    let resolvedTrackUrl = track_url || ""
    if (!resolvedTrackUrl && profile.selected_track_id) {
      const { data: tr } = await supabaseAdmin
        .from("web_tracks")
        .select("audio_url")
        .eq("id", profile.selected_track_id)
        .maybeSingle()
      resolvedTrackUrl = tr?.audio_url || ""
    }

    const title = `${profile.bride_name} & ${profile.groom_name} — ${tpl.name}`
    const newSlug = profile.slug ? profile.slug : undefined

    const wpBody: Record<string, any> = { title, fields }
    if (newSlug) wpBody.new_slug = newSlug
    if (resolvedTrackUrl) wpBody.track_url = resolvedTrackUrl

    const wpUrl = `${WP_ORIGIN}/wp-json/aksaraa/v1/templates/${encodeURIComponent(tpl.wp_master_slug)}/duplicate`

    const res = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "X-Aksaraa-Secret": WP_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wpBody),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[wp/duplicate] WP error", res.status, errText)
      let errMsg = "Gagal menduplikasi template"
      try { errMsg = JSON.parse(errText).message || errMsg } catch {}
      return NextResponse.json({ error: errMsg, detail: errText }, { status: 502 })
    }

    const data = await res.json()
    const postUrl = data.post_url || ""

    // Store active WP post info + selected template on profile
    const { error: updateErr } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        active_wp_post_id: data.post_id,
        active_wp_post_url: postUrl,
        selected_template_id: template_id,
      })
      .eq("id", profile_id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      post_id: data.post_id,
      post_url: postUrl,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
