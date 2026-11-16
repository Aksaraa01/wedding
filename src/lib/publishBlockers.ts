import { supabaseAdmin } from "@/lib/supabase"
import { getRowGates } from "@/lib/featureGates"
import { hidesOpeningSection } from "@/lib/templateSections"
import { getIncompleteInvitationSections, parseStringList } from "@/lib/invitationCompleteness"
import { getTemplateContentSpec } from "@/components/templates"

// Mirror of the editor's sectionIncomplete gate: publishing is rejected while
// any required section is still empty. Hidden or package-locked sections count
// as complete, exactly like the client. Shared by the couple publish flow and
// the ops confirm flow so both enforce the identical rule.
export async function getPublishBlockers(id: string): Promise<{ key: string; label: string }[]> {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("package_type, selected_template_id, couple_illustration_url, link_thumbnail_url, link_thumbnail_disabled, cover_photos, opening_title, opening_description, display_name, groom_full_name, bride_full_name, sessions, gallery_photos, inviting_families, inviting_families_visible, quote_text, video_url, video_section_visible, stories, story_visible, gift_section_visible, dresscode, livestream, event_type")
    .eq("id", id)
    .maybeSingle()

  if (!profile) return [{ key: "profile", label: "Profile Mempelai" }]

  const [gates, giftAccts, giftAddr, tpl] = await Promise.all([
    getRowGates(profile.package_type || "signature"),
    supabaseAdmin.from("gift_accounts").select("id").eq("wedding_profile_id", id).in("type", ["bank", "ewallet"]).then(r => r.data ?? []),
    supabaseAdmin.from("gift_addresses").select("full_address").eq("wedding_profile_id", id).maybeSingle().then(r => r.data ?? null),
    profile.selected_template_id
      ? supabaseAdmin.from("web_templates").select("no_photo, code, wp_manifest").eq("id", profile.selected_template_id).maybeSingle().then(r => r.data ?? null)
      : Promise.resolve(null),
  ])

  // Cover-slot count decides whether a dedicated link thumbnail is required:
  // in-house designs declare it in the content spec, WP designs in the manifest.
  const tplCode = (tpl as any)?.code as string | undefined
  const spec = getTemplateContentSpec(tplCode || null)
  const specSlots = spec?.cover_slots
  const manifestSlots = Array.isArray((tpl as any)?.wp_manifest?.cover_photos)
    ? (tpl as any).wp_manifest.cover_photos.length
    : undefined
  const hasCoverSlots = (tpl as any)?.no_photo !== true && (specSlots ?? manifestSlots ?? 0) > 0

  return getIncompleteInvitationSections({
    has_template: !!profile.selected_template_id,
    cover_photos: parseStringList(profile.cover_photos),
    couple_illustration_url: profile.couple_illustration_url,
    link_thumbnail_url: profile.link_thumbnail_url,
    link_thumbnail_disabled: profile.link_thumbnail_disabled,
    has_cover_slots: hasCoverSlots,
    opening_title: profile.opening_title,
    opening_description: profile.opening_description,
    display_name: profile.display_name,
    groom_full_name: profile.groom_full_name,
    bride_full_name: profile.bride_full_name,
    sessions: parseStringList(profile.sessions),
    gallery_photos: parseStringList(profile.gallery_photos),
    inviting_families: parseStringList(profile.inviting_families),
    inviting_families_visible: profile.inviting_families_visible,
    quote_text: profile.quote_text,
    video_url: profile.video_url,
    video_section_visible: profile.video_section_visible,
    stories: parseStringList(profile.stories),
    story_visible: profile.story_visible,
    gift_section_visible: profile.gift_section_visible,
    gift_has_address: !!(giftAddr?.full_address && String(giftAddr.full_address).trim()),
    gift_account_count: giftAccts.length,
    no_photo_template: (tpl as any)?.no_photo === true,
    no_opening_section: hidesOpeningSection((tpl as any)?.code),
    no_story_section: spec?.sections?.story === false,
    no_inviting_section: spec?.sections?.inviting === false,
    event_type: (profile as any).event_type || "wedding",
    gates: {
      inviting_families: gates.inviting_families.included,
      cinematic_video: gates.cinematic_video.included,
      story: gates.story.included,
    },
  })
}
