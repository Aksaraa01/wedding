export const INVITATION_SECTION_LABELS: Record<string, string> = {
  tema: "Tema",
  sampul: "Sampul",
  pembuka: "Kalimat Pembuka",
  profile: "Profile Mempelai",
  acara: "Acara",
  galeri: "Galeri",
  inviting: "Turut Mengundang",
  kutipan: "Kutipan",
  video: "Video",
  story: "Story",
  gift: "Gift",
}

export const INVITATION_SECTION_ORDER = [
  "tema",
  "sampul",
  "pembuka",
  "profile",
  "acara",
  "galeri",
  "inviting",
  "kutipan",
  "video",
  "story",
  "gift",
] as const

export type InvitationGates = {
  inviting_families: boolean
  cinematic_video: boolean
  story: boolean
}

export type InvitationCompletenessInput = {
  has_template: boolean
  cover_photos: unknown
  couple_illustration_url: unknown
  opening_title: unknown
  opening_description: unknown
  display_name: unknown
  groom_full_name: unknown
  bride_full_name: unknown
  sessions: unknown
  gallery_photos: unknown
  inviting_families: unknown
  inviting_families_visible: unknown
  quote_text: unknown
  video_url: unknown
  video_section_visible: unknown
  stories: unknown
  story_visible: unknown
  gift_section_visible: unknown
  gift_has_address: boolean
  gift_account_count: number
  gates: InvitationGates
}

function hasArr(v: unknown): boolean {
  return Array.isArray(v) && v.filter(Boolean).length > 0
}

function hasStr(v: unknown): boolean {
  return typeof v === "string" && v.trim() !== ""
}

export function parseStringList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : [v]
    } catch {
      return [v]
    }
  }
  return []
}

const SESSION_REQUIRED = ["name", "date", "venue", "address", "maps_url"]

function isSessionComplete(s: unknown): boolean {
  if (!s || typeof s !== "object") return false
  const r = s as Record<string, unknown>
  return SESSION_REQUIRED.every(k => hasStr(r[k]))
}

function isSectionIncomplete(key: string, d: InvitationCompletenessInput): boolean {
  switch (key) {
    case "tema":
      return !d.has_template
    case "sampul":
      return !hasArr(d.cover_photos) && !hasStr(d.couple_illustration_url)
    case "pembuka":
      return !hasStr(d.opening_title) && !hasStr(d.opening_description)
    case "profile":
      return !hasStr(d.groom_full_name) || !hasStr(d.bride_full_name)
    case "inviting":
      if (!d.gates.inviting_families) return false
      if (d.inviting_families_visible === false) return false
      return !hasArr(d.inviting_families)
    case "acara": {
      if (!hasArr(d.sessions)) return true
      return !(d.sessions as unknown[]).every(isSessionComplete)
    }
    case "kutipan":
      return !hasStr(d.quote_text)
    case "video":
      if (!d.gates.cinematic_video) return false
      if (d.video_section_visible === false) return false
      return !hasStr(d.video_url)
    case "story":
      if (!d.gates.story) return false
      if (d.story_visible === false) return false
      return !hasArr(d.stories)
    case "galeri":
      return !hasArr(d.gallery_photos)
    case "gift":
      if (d.gift_section_visible === false) return false
      return !d.gift_has_address && d.gift_account_count === 0
    default:
      return false
  }
}

export type IncompleteInvitationSection = {
  key: string
  label: string
  action: "templates" | "section"
}

export function getIncompleteInvitationSections(
  d: InvitationCompletenessInput
): IncompleteInvitationSection[] {
  return INVITATION_SECTION_ORDER.filter(key =>
    isSectionIncomplete(key, d)
  ).map(key => ({
    key,
    label: INVITATION_SECTION_LABELS[key],
    action: key === "tema" ? "templates" : "section",
  }))
}
