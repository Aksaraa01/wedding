import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getRowGates, getFeatureIncluded, getPhotoQuota } from "@/lib/featureGates"
import { getIncompleteInvitationSections, parseStringList } from "@/lib/invitationCompleteness"
import { ensureOgImage, ogPublicUrlFor, resolveCoverImage } from "@/lib/ogImage"
import { getPublishBlockers } from "@/lib/publishBlockers"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, slug, package_type, payment_status, selected_template_id, selected_track_id, couple_illustration_url, cover_photos, couple_initials, grayscale, is_published, published_at, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, estimated_wedding_date, sessions, display_name, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, gift_section_visible, video_section_visible, inviting_families_visible, story_visible, opening_title, opening_description, active_wp_post_id, active_wp_post_url, portfolio_visible, portfolio_featured")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const packageType = profile.package_type || "signature"
    // Independent reads — one parallel wave instead of 7 sequential roundtrips.
    // Plain Promise.all (fail-fast) keeps error semantics identical to the old
    // sequential awaits: any network-level throw still lands in the outer catch
    // below → 500. Deliberately NOT allSettled with silent fallbacks: wrong
    // gates would misrender paid-feature locks, worse than a visible error.
    const [gates, features, photoQuota, template, track, giftAccts, giftAddr] = await Promise.all([
      getRowGates(packageType),
      getFeatureIncluded(packageType),
      getPhotoQuota(packageType),
      profile.selected_template_id
        ? supabaseAdmin.from("web_templates").select("*").eq("id", profile.selected_template_id).single().then(r => r.data ?? null)
        : Promise.resolve(null),
      profile.selected_track_id
        ? supabaseAdmin.from("web_tracks").select("*").eq("id", profile.selected_track_id).single().then(r => r.data ?? null)
        : Promise.resolve(null),
      supabaseAdmin.from("gift_accounts").select("id, provider_name, provider_logo_url, account_number, account_name, type").eq("wedding_profile_id", profile.id).then(r => r.data ?? []),
      supabaseAdmin.from("gift_addresses").select("full_address, recipient_name").eq("wedding_profile_id", profile.id).maybeSingle().then(r => r.data ?? null),
    ])
    const gift_accounts = (giftAccts || []).filter(a => a.type === "bank" || a.type === "ewallet")

    return NextResponse.json({
      profile: {
        id: profile.id,
        bride_name: profile.bride_name,
        groom_name: profile.groom_name,
        slug: profile.slug,
        package_type: packageType,
        payment_status: profile.payment_status || null,
        package_gates: gates,
        feature_set: Array.from(features),
        selected_template_id: profile.selected_template_id || null,
        selected_track_id: profile.selected_track_id,
        couple_illustration_url: profile.couple_illustration_url,
        cover_photos: profile.cover_photos,
        couple_initials: profile.couple_initials,
        grayscale: profile.grayscale,
        is_published: profile.is_published,
        published_at: profile.published_at,
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
        gift_section_visible: profile.gift_section_visible !== false,
        video_section_visible: profile.video_section_visible !== false,
        inviting_families_visible: profile.inviting_families_visible !== false,
        story_visible: profile.story_visible !== false,
        opening_title: profile.opening_title || "",
        opening_description: profile.opening_description || "",
        active_wp_post_id: profile.active_wp_post_id,
        active_wp_post_url: profile.active_wp_post_url,
        portfolio_visible: (profile as any).portfolio_visible === true,
        portfolio_featured: (profile as any).portfolio_featured === true,
      },
      template,
      track,
      gift_accounts,
      gift_address: giftAddr?.full_address || "",
      gift_address_name: giftAddr?.recipient_name || "",
      photo_quota: photoQuota,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Mirror of the editor's sectionIncomplete gate lives in @/lib/publishBlockers
// (shared with the ops confirm flow) — publishing is rejected while any
// required section is still empty.

export async function PUT(  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const allowed = [
      "selected_template_id", "selected_track_id", "has_seen_tour",
      "couple_illustration_url", "cover_photos", "couple_initials", "grayscale", "is_published",
      "groom_full_name", "bride_full_name", "groom_name", "bride_name",
      "groom_photo_url", "bride_photo_url",
      "groom_parents", "bride_parents", "groom_instagram", "bride_instagram", "video_url",
      "display_name", "sessions", "quote_text", "quote_source", "stories",
      "gallery_photos", "inviting_families", "rsvp_max_pax",
      "estimated_wedding_date", "gift_section_visible", "video_section_visible", "inviting_families_visible", "story_visible",
      "opening_title", "opening_description", "portfolio_visible", "portfolio_featured",
      "led_greeting_enabled", "led_greeting_duration_sec",
    ]

    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) {
        // Greeting duration is constrained by DB check — coerce strays.
        if (key === "led_greeting_duration_sec") {
          const v = Number(body[key])
          updates[key] = v === 15 || v === 20 || v === 30 ? v : 30
        } else if ((key === "groom_photo_url" || key === "bride_photo_url") && Array.isArray(body[key])) {
          // groom/bride photos are stored as JSON strings in text columns so
          // they can hold multiple slides (slideshow backgrounds).
          updates[key] = JSON.stringify(body[key].filter(Boolean))
        } else {
          updates[key] = body[key]
        }
      }
    }

    // Record the confirmation time when the invitation is first published.
    if (body.is_published === true) {
      const incomplete = await getPublishBlockers(id)
      if (incomplete.length > 0) {
        return NextResponse.json(
          { error: "Konten undangan belum lengkap. Lengkapi konten terlebih dahulu sebelum konfirmasi.", incomplete },
          { status: 422 }
        )
      }
      updates.published_at = new Date().toISOString()
    }

    // Keep the social thumbnail in sync with the selected cover (illustration
    // first, then first cover — same priority as guest metadata). Runs only
    // when cover fields are part of this save; any failure falls back to the
    // normal cover chain and never blocks the save itself.
    if (body.couple_illustration_url !== undefined || body.cover_photos !== undefined) {
      try {
        const { data: current } = await supabaseAdmin
          .from("wedding_profiles")
          .select("couple_illustration_url, cover_photos, og_image_url, og_image_width, og_image_height")
          .eq("id", id)
          .maybeSingle()
        const effective = resolveCoverImage({
          couple_illustration_url: body.couple_illustration_url !== undefined ? body.couple_illustration_url : current?.couple_illustration_url,
          cover_photos: body.cover_photos !== undefined ? body.cover_photos : current?.cover_photos,
        })
        if (!effective) {
          if (current?.og_image_url) {
            updates.og_image_url = null
            updates.og_image_width = null
            updates.og_image_height = null
          }
        } else if (ogPublicUrlFor(effective) !== (current?.og_image_url || null)) {
          const og = await ensureOgImage(effective)
          // Null on generation failure clears a stale variant so shares fall
          // back to the (new) cover instead of the old photo.
          updates.og_image_url = og?.url ?? null
          updates.og_image_width = og?.width ?? null
          updates.og_image_height = og?.height ?? null
        }
      } catch (err) {
        // og sync is best-effort; fallbacks in generateMetadata cover failures.
        console.warn("[og] cover hook failed:", err instanceof Error ? err.message : String(err))
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