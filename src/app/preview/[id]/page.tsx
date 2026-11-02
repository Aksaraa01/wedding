import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTemplateComponent } from "@/components/templates"
import { thumbUrl, thumbStoryImages } from "@/lib/storageUrl"
import { getRowGates, getFeatureIncluded } from "@/lib/featureGates"
import { cachedRead } from "@/lib/refCache"
import { ASSETS } from "@/lib/assets"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// GET /preview/[id] — couple preview of an IN-HOUSE invitation, rendered from
// SAVED profile data (no guest gating, no tracking, no QR/RSVP overlay). Used
// as the editor preview iframe so couples see exactly what a real device shows.
export default async function CouplePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, slug, bride_name, groom_name, estimated_wedding_date, selected_template_id, selected_track_id, display_name, couple_illustration_url, cover_photos, couple_initials, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, package_type, opening_title, opening_description, gift_section_visible, video_section_visible, inviting_families_visible, story_visible, dresscode, livestream, dresscode_visible, livestream_visible, rundown, contacts, rundown_visible, contacts_visible, template_content")
    .eq("id", id)
    .single()

  if (!profile) notFound()

  const [rowGates, featureSet] = await Promise.all([
    getRowGates(profile.package_type || "signature"),
    getFeatureIncluded(profile.package_type || "signature"),
  ])

  let templateCode: string | null = null
  let isInhouse = false
  if (profile.selected_template_id) {
    const tmpl = await cachedRead<{ code: string | null; source_type: string | null; wp_master_slug: string | null } | null>(`template:${profile.selected_template_id}`, 10 * 60_000, async () => {
      const { data, error } = await supabaseAdmin
        .from("web_templates")
        .select("code, source_type, wp_master_slug")
        .eq("id", profile.selected_template_id)
        .single()
      if (error) return null
      return { code: data?.code || null, source_type: data?.source_type || null, wp_master_slug: data?.wp_master_slug || null }
    })
    if (tmpl) {
      templateCode = tmpl.code
      isInhouse = tmpl.source_type === "inhouse" ||
        (!!tmpl.code && !!getTemplateComponent(tmpl.code) && !tmpl.wp_master_slug)
    }
  }

  const Template = templateCode ? getTemplateComponent(templateCode) : null
  if (!Template || !isInhouse) notFound()

  const [giftAcctsRes, giftAddrRes, trackRes] = await Promise.all([
    supabaseAdmin.from("gift_accounts").select("provider_name, account_number, account_name, type").eq("wedding_profile_id", profile.id),
    supabaseAdmin.from("gift_addresses").select("full_address, recipient_name").eq("wedding_profile_id", profile.id).single(),
    profile.selected_track_id
      ? supabaseAdmin.from("web_tracks").select("audio_url").eq("id", profile.selected_track_id).single()
      : Promise.resolve({ data: null } as any),
  ])
  const giftAccounts = (giftAcctsRes.data || []).filter((a: any) => a.type === "bank" || a.type === "ewallet")
  const giftAddress = (giftAddrRes.data as any)?.full_address || undefined
  const giftAddressName = (giftAddrRes.data as any)?.recipient_name || undefined
  const trackUrl = (trackRes.data as any)?.audio_url || ASSETS.defaultMusic

  return (
    <Template
      bride_name={profile.bride_name}
      groom_name={profile.groom_name}
      estimated_wedding_date={profile.estimated_wedding_date}
      slug={profile.slug || ""}
      guest_name="Tamu Undangan"
      couple_illustration_url={(thumbUrl(profile.couple_illustration_url, 800) as string) || undefined}
      cover_photos={(thumbUrl(profile.cover_photos, 1200) as typeof profile.cover_photos) || undefined}
      couple_initials={profile.couple_initials || undefined}
      display_name={profile.display_name || undefined}
      grayscale={profile.grayscale || undefined}
      groom_full_name={profile.groom_full_name || undefined}
      bride_full_name={profile.bride_full_name || undefined}
      groom_photo_url={(thumbUrl(profile.groom_photo_url, 800) as typeof profile.groom_photo_url) || undefined}
      bride_photo_url={(thumbUrl(profile.bride_photo_url, 800) as typeof profile.bride_photo_url) || undefined}
      groom_parents={profile.groom_parents || undefined}
      bride_parents={profile.bride_parents || undefined}
      groom_instagram={profile.groom_instagram || undefined}
      bride_instagram={profile.bride_instagram || undefined}
      video_url={profile.video_url || undefined}
      opening_title={profile.opening_title || undefined}
      opening_description={profile.opening_description || undefined}
      template_content={(profile.template_content as Record<string, string>) || undefined}
      preview_mode
      dresscode={(profile.dresscode as any) || undefined}
      livestream={(profile.livestream as any) || undefined}
      dresscode_visible={(profile as any).dresscode_visible !== false}
      livestream_visible={(profile as any).livestream_visible !== false}
      rundown={(profile as any).rundown || undefined}
      contacts={(profile as any).contacts || undefined}
      rundown_visible={(profile as any).rundown_visible !== false}
      contacts_visible={(profile as any).contacts_visible !== false}
      sessions={profile.sessions || undefined}
      quote_text={profile.quote_text || undefined}
      quote_source={profile.quote_source || undefined}
      stories={rowGates.story.included ? (thumbStoryImages(profile.stories) as typeof profile.stories) || undefined : undefined}
      gallery_photos={(thumbUrl(profile.gallery_photos, 800) as typeof profile.gallery_photos) || undefined}
      gift_accounts={giftAccounts.length > 0 ? giftAccounts : undefined}
      gift_address={rowGates.gift_address.included ? giftAddress : undefined}
      gift_address_name={giftAddressName || undefined}
      gift_section_visible={profile.gift_section_visible !== false}
      video_section_visible={profile.video_section_visible !== false}
      inviting_families_visible={profile.inviting_families_visible !== false}
      story_visible={profile.story_visible !== false}
      track_url={trackUrl}
      inviting_families={rowGates.inviting_families.included ? (profile.inviting_families ? (typeof profile.inviting_families === "string" ? JSON.parse(profile.inviting_families) : profile.inviting_families) : undefined) : undefined}
      wedding_profile_id={profile.id}
      rsvp_max_pax={profile.rsvp_max_pax ?? undefined}
      feature_gates={{
        story: rowGates.story.included,
        gift_address: rowGates.gift_address.included,
        inviting_families: rowGates.inviting_families.included,
        video: rowGates.cinematic_video.included,
        qr_code_book: featureSet.has("qr_code_book"),
      }}
    />
  )
}