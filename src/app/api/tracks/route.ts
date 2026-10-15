import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBucket, uploadFile, deleteFile } from "@/lib/storage"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mood = searchParams.get("mood")
  const weddingProfileId = searchParams.get("wedding_profile_id")
  const scope = searchParams.get("scope")

  try {
    // Admin / OPS view: all tracks (system + uploaded) with owner info
    if (scope === "custom") {
      const { data, error } = await supabaseAdmin
        .from("web_tracks")
        .select("id, title, artist, mood_category, audio_url, is_active, sort_order, created_at, is_custom, uploaded_by, uploaded_by_name, is_public")

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const sorted = (data || []).sort((a, b) => {
        const aCustom = a.is_custom === true ? 1 : 0
        const bCustom = b.is_custom === true ? 1 : 0
        if (aCustom !== bCustom) return bCustom - aCustom
        if (aCustom === 1) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })

      return NextResponse.json({ tracks: sorted })
    }

    // Client view: system tracks + own customs + public customs
    let query = supabaseAdmin
      .from("web_tracks")
      .select("*")
      .eq("is_active", true)
      .or(`is_custom.is.false,${weddingProfileId ? `uploaded_by.eq.${weddingProfileId},` : ""}is_public.eq.true`)

    if (mood) {
      query = query.eq("mood_category", mood)
    }

    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Own uploads pinned first (most recent first); system + others follow by sort_order
    const sorted = (data || []).sort((a, b) => {
      const aMine = a.is_custom === true && a.uploaded_by === weddingProfileId ? 1 : 0
      const bMine = b.is_custom === true && b.uploaded_by === weddingProfileId ? 1 : 0
      if (aMine !== bMine) return bMine - aMine
      if (aMine === 1) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

    return NextResponse.json({ tracks: sorted })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const weddingProfileId = (formData.get("wedding_profile_id") as string) || ""
    const uploadedByName = (formData.get("uploaded_by_name") as string) || ""
    const customTitle = ((formData.get("title") as string) || "").trim()
    const customArtist = ((formData.get("artist") as string) || "").trim()

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    const isAudio = file.type.startsWith("audio/") || /\.mp3$/i.test(file.name)
    if (!isAudio) {
      return NextResponse.json({ error: "File harus berupa audio/MP3" }, { status: 400 })
    }

    const isAdmin = !weddingProfileId

    // Client upload: enforce one non-public custom track per user (published ones survive).
    // NOTE: the old row is usually still referenced by
    // wedding_profiles.selected_track_id (NO ACTION FK), so it cannot be
    // deleted first — collect it, insert the replacement, re-point the
    // selection, then delete. Never swallow delete errors: a silent FK
    // failure is exactly how duplicate "Lagu Saya" rows were born.
    let superseded: { id: string; audio_url: string | null }[] = []
    if (!isAdmin) {
      const { data: existing } = await supabaseAdmin
        .from("web_tracks")
        .select("id, audio_url, is_public")
        .eq("is_custom", true)
        .eq("uploaded_by", weddingProfileId)
        .eq("is_public", false)
      superseded = existing || []
    }

    const name = `t-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const url = await uploadFile(file, "user-tracks", name)

    const titleBase = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()

    let ownerName = uploadedByName
    if (!isAdmin && !ownerName) {
      const { data: profile } = await supabaseAdmin
        .from("wedding_profiles")
        .select("bride_name, groom_name")
        .eq("id", weddingProfileId)
        .single()
      if (profile) ownerName = `${profile.groom_name} & ${profile.bride_name}`
    }

    const { data: track, error: insertError } = await supabaseAdmin
      .from("web_tracks")
      .insert({
        title: customTitle || titleBase || "Lagu Saya",
        // Admin uploads: singer is optional — empty means hidden in the
        // editor (no "Aksaraa" default). Couple uploads keep "Lagu Saya",
        // shown as "★ Lagu Saya" only to the uploader (isMine rule).
        artist: isAdmin ? (customArtist || null) : "Lagu Saya",
        mood_category: "custom",
        audio_url: url,
        is_active: true,
        sort_order: 0,
        is_custom: true,
        uploaded_by: isAdmin ? null : weddingProfileId,
        uploaded_by_name: ownerName || (isAdmin ? "Administrator" : null),
        is_public: isAdmin,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Now that the replacement exists, release the FK reference and remove
    // the superseded rows. Failures here are returned loudly — the client
    // keeps showing the new track, and ops can see/clean the leftover.
    if (!isAdmin && superseded.length > 0) {
      const oldIds = superseded.map((o) => o.id)
      // Re-point the uploader's own profile(s) off the old rows first so the
      // FK no longer blocks the delete. A no-op match simply means nothing
      // referenced them.
      await supabaseAdmin
        .from("wedding_profiles")
        .update({ selected_track_id: track.id })
        .eq("id", weddingProfileId)
        .in("selected_track_id", oldIds)
      for (const old of superseded) {
        const path = extractStoragePath(old.audio_url || "")
        if (path) {
          try { await deleteFile(path) } catch {}
        }
        const { error: deleteError } = await supabaseAdmin.from("web_tracks").delete().eq("id", old.id)
        if (deleteError) {
          return NextResponse.json(
            { error: `Lagu baru tersimpan, tetapi lagu lama gagal dihapus: ${deleteError.message}` },
            { status: 500 },
          )
        }
      }
    }

    return NextResponse.json({ track })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function extractStoragePath(audioUrl: string): string | null {
  if (!audioUrl) return null
  const marker = "/object/public/media/"
  const idx = audioUrl.indexOf(marker)
  if (idx === -1) return null
  const rest = audioUrl.slice(idx + marker.length).split("?")[0]
  return rest || null
}