import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBucket, uploadFromUrl } from "@/lib/storage"

export async function POST() {
  try {
    await ensureBucket()

    const results: { type: string; name: string; old_url: string; new_url: string }[] = []

    // Migrate web_templates preview images
    const { data: templates } = await supabaseAdmin
      .from("web_templates")
      .select("id, code, preview_image_url")
      .not("preview_image_url", "is", null)

    if (templates) {
      for (const t of templates) {
        if (!t.preview_image_url || t.preview_image_url.includes("supabase.co")) continue
        const ext = "jpg"
        const name = `${t.code}-preview.${ext}`
        const newUrl = await uploadFromUrl(t.preview_image_url, "templates", name)
        await supabaseAdmin.from("web_templates").update({ preview_image_url: newUrl }).eq("id", t.id)
        results.push({ type: "template_image", name: t.code, old_url: t.preview_image_url, new_url: newUrl })
      }
    }

    // Migrate web_tracks audio
    const { data: tracks } = await supabaseAdmin
      .from("web_tracks")
      .select("id, title, audio_url")
      .not("audio_url", "is", null)
      .neq("audio_url", "")

    if (tracks) {
      for (const t of tracks) {
        if (!t.audio_url || t.audio_url.includes("supabase.co")) continue
        const name = `${t.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`
        const newUrl = await uploadFromUrl(t.audio_url, "tracks", name)
        await supabaseAdmin.from("web_tracks").update({ audio_url: newUrl }).eq("id", t.id)
        results.push({ type: "track_audio", name: t.title, old_url: t.audio_url, new_url: newUrl })
      }
    }

    return NextResponse.json({ ok: true, migrated: results.length, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
