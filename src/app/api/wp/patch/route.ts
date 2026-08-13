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
    const { profile_id } = body

    if (!profile_id) {
      return NextResponse.json({ error: "profile_id wajib diisi" }, { status: 400 })
    }

    const built = await buildProfileFields(profile_id)
    if (!built) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }
    const { profile, fields } = built

    if (!profile.active_wp_post_id) {
      return NextResponse.json({ error: "Belum ada postingan WordPress aktif. Pilih template terlebih dahulu." }, { status: 400 })
    }

    // Resolve the couple's selected track so the WP post audio stays in sync even
    // when the track is changed after the template was duplicated.
    let trackUrl = ""
    if (profile.selected_track_id) {
      const { data: tr } = await supabaseAdmin
        .from("web_tracks")
        .select("audio_url")
        .eq("id", profile.selected_track_id)
        .maybeSingle()
      trackUrl = tr?.audio_url || ""
    }

    // Load template manifest
    const { data: tpl } = await supabaseAdmin
      .from("web_templates")
      .select("wp_manifest")
      .eq("id", profile.selected_template_id)
      .maybeSingle()

    const manifest = tpl?.wp_manifest || {}

    const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${profile.active_wp_post_id}/elements`, {
      method: "PATCH",
      headers: {
        "X-Aksaraa-Secret": WP_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, manifest, track_url: trackUrl }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[wp/patch] WP error", res.status, errText)
      let errMsg = "Gagal memperbarui konten WordPress"
      try { errMsg = JSON.parse(errText).message || errMsg } catch {}
      return NextResponse.json({ error: errMsg, detail: errText }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ patched: data.patched || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
