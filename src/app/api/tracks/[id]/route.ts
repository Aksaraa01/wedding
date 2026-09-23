import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { deleteFile } from "@/lib/storage"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const { data: track, error: fetchError } = await supabaseAdmin
      .from("web_tracks")
      .select("id, is_custom")
      .eq("id", id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: "Lagu tidak ditemukan" }, { status: 404 })
    }
    if (track.is_custom !== true) {
      return NextResponse.json({ error: "Hanya lagu upload yang dapat diubah" }, { status: 403 })
    }

    const updates: Record<string, any> = {}
    if (typeof body.is_public === "boolean") updates.is_public = body.is_public
    // Title and artist are independent: editing the title never overwrites
    // the singer. An explicit empty artist clears it (hidden in editor).
    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim()
    }
    if (typeof body.artist === "string") {
      updates.artist = body.artist.trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("web_tracks")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ track: updated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: track, error: fetchError } = await supabaseAdmin
      .from("web_tracks")
      .select("id, audio_url, is_custom, is_public, uploaded_by")
      .eq("id", id)
      .single()

    if (fetchError || !track) {
      return NextResponse.json({ error: "Lagu tidak ditemukan" }, { status: 404 })
    }
    if (track.is_custom !== true) {
      return NextResponse.json({ error: "Hanya lagu upload yang dapat dihapus" }, { status: 403 })
    }

    // Unset selected_track_id on any profile still referencing this track so no
    // couple keeps pointing at a deleted track.
    const { data: refs, error: refError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id")
      .eq("selected_track_id", id)
    if (!refError && refs && refs.length > 0) {
      await supabaseAdmin.from("wedding_profiles").update({ selected_track_id: null }).eq("selected_track_id", id)
    }

    const path = extractStoragePath(track.audio_url)
    if (path) {
      try { await deleteFile(path) } catch {}
    }

    const { error } = await supabaseAdmin.from("web_tracks").delete().eq("id", id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      unsetFrom: refs?.map((r) => r.id) || [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function extractStoragePath(audioUrl: string): string | null {
  if (!audioUrl) return null
  const marker = "/object/public/media/"
  const idx = audioUrl.indexOf(marker)
  if (idx === -1) return null
  return audioUrl.slice(idx + marker.length).split("?")[0] || null
}