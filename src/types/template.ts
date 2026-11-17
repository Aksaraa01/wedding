export type TemplateTheme = {
  fonts: {
    display: string
    script: string
    body: string
  }
  colors: {
    surface: string
    text: string
    accent: string
    accentMuted: string
    overlay: string
    dark: string
  }
  ornaments: {
    divider: "gunungan" | "floral" | "line"
    border: "ornate" | "minimal" | "none"
    frame: "arch" | "square" | "circle"
  }
  motion: {
    enabled: boolean
    duration: number
    stagger: number
  }
}

// Props every in-house template receives. All keys come from wedding_profiles
// (+ a few per-couple children) assembled by the renderer (/w/[slug], editor
// preview, in-house demo route). Everything is optional so a template that does
// not use a field simply ignores it, and old components keep compiling.
export type TemplateProps = {
  bride_name?: string
  groom_name?: string
  estimated_wedding_date?: string
  slug?: string
  guest_name?: string
  display_name?: string
  couple_illustration_url?: string
  cover_photos?: string[]
  couple_initials?: string
  grayscale?: boolean
  groom_full_name?: string
  bride_full_name?: string
  groom_photo_url?: string | string[]
  bride_photo_url?: string | string[]
  groom_parents?: string
  bride_parents?: string
  groom_instagram?: string
  bride_instagram?: string
  opening_title?: string
  opening_description?: string
  sessions?: {
    name?: string
    date?: string
    time?: string
    venue?: string
    address?: string
    maps_url?: string
  }[]
  quote_text?: string
  quote_source?: string
  stories?: {
    title?: string
    description?: string
    image_url?: string
    // Optional milestone year, edited from ops. Rendered as the chapter label
    // where a template has room for one (lace).
    year?: string
  }[]
  gallery_photos?: string[]
  video_url?: string
  dresscode_visible?: boolean
  livestream_visible?: boolean
  rundown_visible?: boolean
  contacts_visible?: boolean
  rundown?: { time?: string; description?: string }[]
  contacts?: { name?: string; description?: string; whatsapp?: string }[]
  dresscode?: {
    title?: string
    description?: string
    colors?: { hex?: string; name?: string }[]
  }
  livestream?: {
    title?: string
    description?: string
    buttonLabel?: string
    url?: string
  }
  gift_accounts?: { provider_name?: string; account_number?: string; account_name?: string; type?: string }[]
  gift_address?: string
  gift_address_name?: string
  track_url?: string
  auto_play?: boolean
  inviting_families?: string[]
  // Section visibility toggles from the editor (mirrors wedding_profiles booleans).
  gift_section_visible?: boolean
  video_section_visible?: boolean
  inviting_families_visible?: boolean
  story_visible?: boolean
  // Template-specific reference copy (Sandhya). Kept generic so other in-house
  // templates can opt in without new columns per template.
  template_content?: Record<string, string>
  // Editor/demo preview only: enables preview-only chrome (e.g. theme switcher).
  preview_mode?: boolean
  // Public template gallery demo. Never set for a couple's real invitation.
  template_demo?: boolean
  wedding_profile_id?: string
  guest_id?: string
  // Fleksibel link mode: RSVP dock renders without a guest row and provisions
  // one keyed by guest_slug on submit.
  guest_link_strict?: boolean
  guest_slug?: string
  guest_qr_token?: string
  guest_qr_url?: string
  guest_qr_content?: string
  guest_table_number?: string
  guest_rsvp_status?: string
  guest_rsvp_message?: string
  rsvp_max_pax?: number
  feature_gates?: {
    story?: boolean
    gift_address?: boolean
    inviting_families?: boolean
    video?: boolean
    qr_code_book?: boolean
  }
  // Ceriavite only: the ananda introduced on this invitation. More than one
  // child (siblings sharing the ceremony) is normal; the parent line stays
  // single and shared via `groom_parents`. `resolveChildren()` in
  // `@/lib/children` falls back to the legacy `groom_*` slot when empty.
  children?: {
    name?: string
    full_name?: string
    photo_url?: string
    instagram?: string
  }[]
  // Event family. Kept optional so every existing template compiles unchanged;
  // absent means "wedding". Kids templates read the labels instead of
  // hard-coding "Mempelai" / "The Wedding of".
  event_type?: string
  subject_gender?: "putra" | "putri"
  event_labels?: {
    brand: string
    site: string
    eventNoun: string
    eventKicker: string
    coverKicker: string
    subjectLabel: string
    subjectPossessive: string
    subjectOf: string
    mainEventName: string
    secondaryEventName: string
    countdownLabel: string
    giftTitle: string
    wishesTitle: string
    closingHeadline: string
    guestFallback: string
    coupleSeparator: string
  }
}

export type PhotoStyle = "single" | "slideshow"

// Lightweight content contract for IN-HOUSE templates. This is the in-house
// equivalent of a WordPress element manifest: it tells the editor which content
// the React component consumes (how many cover slots, whether a photo field is a
// slideshow, and which optional sections the template actually renders). It is
// authored in code (TEMPLATE_CONFIGS) — a single source of truth next to the
// component — instead of per-template DB mapping.
export type ContentSpec = {
  cover_slots?: number
  // Optional human labels for each cover slot (e.g. per-scene backgrounds).
  cover_slot_labels?: string[]
  // Optional section gate per slot, aligned by index. A slot whose section is
  // hidden is not offered in the editor/ops (the stored photo is kept).
  cover_slot_sections?: (string | null)[]
  // Indices (0-based) of cover slots that render as 2-photo slideshows.
  cover_slideshows?: number[]
  groom_photo?: PhotoStyle
  bride_photo?: PhotoStyle
  // Whether the groom/bride portrait fields are used at all. Absent ⇒ true.
  // Set false for designs that show no portraits (e.g. lace), so the editor
  // does not offer an upload that the template would never render.
  person_photos?: boolean
  // Whether love-story milestones render/accept a photo. Absent ⇒ true.
  // Set false for text-only story layouts (e.g. piano-garden).
  story_photo?: boolean
  // Whether the couple-initials monogram is offered/rendered. Absent ⇒ true.
  // Set false for templates that never print the initials field.
  initials?: boolean
  // Sections the template renders. Absent/false ⇒ the section's content either
  // never appears or, where the toggle exists, hides its entry point entirely.
  sections?: {
    opening_description?: boolean
    quote?: boolean
    countdown?: boolean
    inviting?: boolean
    video?: boolean
    story?: boolean
    gallery?: boolean
    gift?: boolean
    dresscode?: boolean
    livestream?: boolean
    rundown?: boolean
    contacts?: boolean
  }
  // Template consumes profile.template_content (reference-only copy fields).
  extras?: boolean
}

export type TemplateConfig = {
  code: string
  name: string
  description: string
  theme: TemplateTheme
  content?: ContentSpec
}