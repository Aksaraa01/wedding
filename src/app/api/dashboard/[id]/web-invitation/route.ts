import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getRowGates, getFeatureIncluded } from "@/lib/featureGates"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, slug, package_type, selected_template_id, selected_track_id, couple_illustration_url, cover_photos, couple_initials, grayscale, is_published, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, estimated_wedding_date, sessions, display_name, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, active_wp_post_id, active_wp_post_url")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const packageType = profile.package_type || "signature"
    const gates = await getRowGates(packageType)
    const features = await getFeatureIncluded(packageType)

    let template = null
    if (profile.selected_template_id) {
      const { data: t } = await supabaseAdmin
        .from("web_templates")
        .select("*")
        .eq("id", profile.selected_template_id)
        .single()
      template = t
    }

    let track = null
    if (profile.selected_track_id) {
      const { data: tr } = await supabaseAdmin
        .from("web_tracks")
        .select("*")
        .eq("id", profile.selected_track_id)
        .single()
      track = tr
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        bride_name: profile.bride_name,
        groom_name: profile.groom_name,
        slug: profile.slug,
        package_type: packageType,
        package_gates: gates,
        feature_set: Array.from(features),
        selected_track_id: profile.selected_track_id,
        couple_illustration_url: profile.couple_illustration_url,
        cover_photos: profile.cover_photos,
        couple_initials: profile.couple_initials,
        grayscale: profile.grayscale,
        is_published: profile.is_published,
        groom_full_name: profile.groom_full_name,
        bride_full_name: profile.bride_full_name,
        groom_photo_url: profile.groom_photo_url ? (Array.isArray(profile.groom_photo_url) ? profile.groom_photo_url : (() => { try { const p = JSON.parse(profile.groom_photo_url); return Array.isArray(p) ? p : [profile.groom_photo_url] } catch { return [profile.groom_photo_url] } })()) : [],
        bride_photo_url: profile.bride_photo_url ? (Array.isArray(profile.bride_photo_url) ? profile.bride_photo_url : (() => { try { const p = JSON.parse(profile.bride_photo_url); return Array.isArray(p) ? p : [profile.bride_photo_url] } catch { return [profile.bride_photo_url] } })()) : [],
        groom_parents: profile.groom_parents,
        bride_parents: profile.bride_parents,
        groom_instagram: profile.groom_instagram,
        bride_instagram: profile.bride_instagram,
        video_url: profile.video_url,
        estimated_wedding_date: profile.estimated_wedding_date,
        sessions: profile.sessions,
        display_name: profile.display_name,
        quote_text: profile.quote_text,
        quote_source: profile.quote_source,
        stories: profile.stories,
        gallery_photos: profile.gallery_photos,
        invitation_url: `https://${profile.slug}.wedding.aksaraa.com`,
        inviting_families: profile.inviting_families ? (typeof profile.inviting_families === "string" ? JSON.parse(profile.inviting_families) : profile.inviting_families) : [],
        rsvp_max_pax: profile.rsvp_max_pax,
        active_wp_post_id: profile.active_wp_post_id,
        active_wp_post_url: profile.active_wp_post_url,
      },
      template,
      track,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const allowed = [
      "selected_template_id", "selected_track_id",
      "couple_illustration_url", "cover_photos", "couple_initials", "grayscale", "is_published",
      "groom_full_name", "bride_full_name",
      "groom_photo_url", "bride_photo_url",
      "groom_parents", "bride_parents", "groom_instagram", "bride_instagram", "video_url",
      "display_name", "sessions", "quote_text", "quote_source", "stories",
      "gallery_photos", "inviting_families", "rsvp_max_pax",
      "estimated_wedding_date",
    ]

    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        // groom/bride photos are stored as JSON strings in text columns so they can
        // hold multiple slides (slideshow backgrounds).
        if ((key === "groom_photo_url" || key === "bride_photo_url") && Array.isArray(body[key])) {
          updates[key] = JSON.stringify(body[key].filter(Boolean))
        } else {
          updates[key] = body[key]
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("wedding_profiles")
      .update(updates)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}