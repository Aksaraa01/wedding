import { supabaseAdmin } from "@/lib/supabase"
import { formatDateUpper } from "@/lib/formatDate"
import { resolveCoupleName } from "@/lib/coupleName"
import { resolveBankLogo } from "@/lib/bankList"
import { getRowGates } from "@/lib/featureGates"
import { coupleUrl } from "@/lib/coupleUrl"

const PROFILE_SELECT =
  "id, bride_name, groom_name, slug, package_type, selected_template_id, selected_track_id, active_wp_post_id, couple_illustration_url, cover_photos, couple_initials, display_name, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, estimated_wedding_date, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, gift_section_visible, video_section_visible, inviting_families_visible, story_visible, opening_title, opening_description"

function parseList(v: unknown): any[] {
  if (Array.isArray(v)) return v
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

function esc(v: unknown): string {
  if (typeof v !== "string") return typeof v === "number" ? String(v) : ""
  return v.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").slice(0, 500)
}

function normalizeVideoUrl(url: string): string {
  if (!url || typeof url !== "string") return url
  const t = url.trim()
  try {
    const u = new URL(t)
    if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
      const id = u.searchParams.get("v")?.split("&")[0]?.split("?")[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
    return t
  } catch { return t }
}

// Gather a couple's content into a flat `fields` object (the same shape the WP
// mu-plugin consumes for PATCH / duplicate). Returns null if the profile is missing.
export async function buildProfileFields(profileId: string, templateId?: string | null): Promise<{ profile: any; fields: Record<string, any> } | null> {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select(PROFILE_SELECT)
    .eq("id", profileId)
    .maybeSingle()

  if (!profile) return null

  const { data: giftAccts } = await supabaseAdmin
    .from("gift_accounts")
    .select("provider_name, provider_logo_url, account_number, account_name, type")
    .eq("wedding_profile_id", profile.id)
  const giftAccounts = (giftAccts || []).filter(a => a.type === "bank" || a.type === "ewallet")

  const { data: giftAddr } = await supabaseAdmin
    .from("gift_addresses")
    .select("full_address, recipient_name")
    .eq("wedding_profile_id", profile.id)
    .maybeSingle()

  const gates = await getRowGates(profile.package_type || "signature")

  // Tanpa-photo template: photo fields are hidden in editor + ops. The WP-bound
  // payload blanks them (with default-image injection suppressed) so even a
  // stale photo mapping can't leak photos into the duplicate — and story
  // images go as explicit null so sideloaded images are actively cleared.
  // DB values stay intact, so switching back to a with-photo template
  // restores everything.
  // Duplicate/finalize chains still point at the previous template until the
  // finalize patch succeeds, so callers pass the NEW template id explicitly.
  const effectiveTemplateId = templateId || profile.selected_template_id
  let noPhotoTemplate = false
  if (effectiveTemplateId) {
    const { data: tpl } = await supabaseAdmin
      .from("web_templates")
      .select("no_photo")
      .eq("id", effectiveTemplateId)
      .maybeSingle()
    noPhotoTemplate = (tpl as any)?.no_photo === true
  }

  const rawSessions: any[] = parseList(profile.sessions)
  const sessions = rawSessions.map((r: any) => ({
    name: esc(r?.name),
    date: r?.date ? formatDateUpper(r.date) : "",
    time: esc(r?.time),
    venue: esc(r?.venue),
    address: esc(r?.address),
    maps_url: r?.maps_url || "",
  }))

  const coupleParts = resolveCoupleName(profile).split("&").map((s) => s.trim())
  const calendar_link = buildCalendarLink(
    rawSessions[0] as any,
    esc(coupleParts[0] || ""),
    esc(coupleParts[1] || "")
  )

  // Tanpa-photo story images are explicit null (not ""): the mu-plugin
  // treats null image values as "clear the slot" so pre-switch sideloaded
  // images get wiped from the duplicate. Empty string keeps the old
  // skip-and-preserve-placeholders behavior. image_bg covers the card
  // container backdrop (a stock-photo bg the manifest maps separately);
  // the key is omitted entirely for with-photo templates.
  const stories = parseList(profile.stories).map((r: any) => ({
    title: esc(r?.title),
    description: esc(r?.description),
    image_url: noPhotoTemplate ? null : (r?.image_url || ""),
    ...(noPhotoTemplate ? { image_bg: null } : {}),
  }))

  const hasAddress = !!esc(giftAddr?.full_address)
  const hasBank = giftAccounts.length > 0
  const coverPhotos = noPhotoTemplate ? [] : parseList(profile.cover_photos).filter(Boolean)
  // Real cover emptiness BEFORE the default-image injection below (the mu-plugin
  // scopes cover-carousel visibility off this, independently of gallery state).
  const coverPhotosHidden = coverPhotos.length === 0
  const galleryPhotos = noPhotoTemplate ? [] : parseList(profile.gallery_photos).filter(Boolean)
  const groomPhoto = noPhotoTemplate ? [] : parseList(profile.groom_photo_url).filter(Boolean)
  const bridePhoto = noPhotoTemplate ? [] : parseList(profile.bride_photo_url).filter(Boolean)
  // Inject default images when the couple hasn't uploaded their own — the
  // mu-plugin sideloads the URL into WP media so the Elementor template renders it.
  // Skipped entirely for tanpa-photo templates (no fallback photo either).
  if (!noPhotoTemplate && coverPhotos.length === 0 && profile.slug) {
    coverPhotos.push(coupleUrl(profile.slug, "/defaults/couple.png"))
  }
  if (!noPhotoTemplate && groomPhoto.length === 0 && profile.slug) {
    groomPhoto.push(coupleUrl(profile.slug, "/defaults/groom.png"))
  }
  if (!noPhotoTemplate && bridePhoto.length === 0 && profile.slug) {
    bridePhoto.push(coupleUrl(profile.slug, "/defaults/bride.png"))
  }
  const fields: Record<string, any> = {
    couple_illustration_url: noPhotoTemplate ? "" : (profile.couple_illustration_url || ""),
    cover_photos: coverPhotos,
    couple_initials: esc(profile.couple_initials),
    display_name: esc(profile.display_name || ""),
    groom_name: esc(profile.groom_name),
    bride_name: esc(profile.bride_name),
    groom_full_name: esc(profile.groom_full_name),
    bride_full_name: esc(profile.bride_full_name),
    groom_photo_url: groomPhoto,
    bride_photo_url: bridePhoto,
    groom_parents: esc(profile.groom_parents),
    bride_parents: esc(profile.bride_parents),
    groom_instagram: esc(profile.groom_instagram),
    bride_instagram: esc(profile.bride_instagram),
    video_url: normalizeVideoUrl(profile.video_url || ""),
    quote_text: esc(profile.quote_text),
    quote_source: esc(profile.quote_source),
    opening_title: esc(profile.opening_title),
    opening_description: esc(profile.opening_description),
    countdown: profile.estimated_wedding_date ? `${profile.estimated_wedding_date} 00:00` : "",
    gift_address: esc(giftAddr?.full_address),
    gift_address_name: esc(giftAddr?.recipient_name),
    gift_section_hidden: profile.gift_section_visible === false || (!hasBank && !hasAddress),
    video_section_hidden: !gates.cinematic_video.included || profile.video_section_visible === false,
    inviting_families_hidden: !gates.inviting_families.included || profile.inviting_families_visible === false,
    story_hidden: !gates.story.included || profile.story_visible === false,
    gift_address_hidden: !gates.gift_address.included,
    date_upper: profile.estimated_wedding_date ? formatDateUpper(profile.estimated_wedding_date) : "",
    sessions,
    calendar_link,
    gallery_photos: galleryPhotos,
    gallery_photos_hidden: galleryPhotos.length === 0,
    cover_photos_hidden: coverPhotosHidden,
    inviting_families: parseList(profile.inviting_families).filter(Boolean).map(esc),
    gift_accounts: giftAccounts.map(a => ({
      provider_name: a.provider_logo_url || resolveBankLogo(a.provider_name),
      account_number: esc(a.account_number),
      account_name: esc(a.account_name),
    })),
    stories,
  }

  return { profile, fields }
}

function parseStartTime(raw: string | undefined): { h: number; m: number } {
  if (!raw || typeof raw !== "string") return { h: 8, m: 0 }
  const t = raw.trim()
  const hm = t.match(/(\d{1,2})\s*[:.]\s*(\d{2})/)
  if (hm) {
    const h = parseInt(hm[1], 10)
    const m = parseInt(hm[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { h, m }
  }
  const hourOnly = t.match(/\b(\d{1,2})\b/)
  if (hourOnly) {
    const h = parseInt(hourOnly[1], 10)
    if (h >= 0 && h <= 23) return { h, m: 0 }
  }
  return { h: 8, m: 0 }
}

function buildCalendarLink(
  rawSession: any,
  groom: string,
  bride: string
): string {
  if (!rawSession || typeof rawSession !== "object") return ""
  const iso = String(rawSession.date || "").trim()
  const dm = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return ""
  const yyyy = dm[1], mm = dm[2], dd = dm[3]
  const groomName = (groom || "").trim()
  const brideName = (bride || "").trim()
  const titleCore = groomName && brideName ? `${groomName}-${brideName}` : (groomName || brideName || "Mempelai")
  const title = `The Wedding OF ${titleCore}`

  const { h, m } = parseStartTime(rawSession.time as string | undefined)

  const pad = (n: number) => String(n).padStart(2, "0")
  const startStr = `${yyyy}${mm}${dd}T${pad(h)}${pad(m)}00`
  let endH = h + 2
  let endY = yyyy, endM = mm, endD = dd
  if (endH >= 24) {
    endH -= 24
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00+07:00`)
    d.setDate(d.getDate() + 1)
    endY = String(d.getFullYear())
    endM = String(d.getMonth() + 1).padStart(2, "0")
    endD = String(d.getDate()).padStart(2, "0")
  }
  const endStr = `${endY}${endM}${endD}T${pad(endH)}${pad(m)}00`

  const venue = String(rawSession.venue || "").trim()
  const address = String(rawSession.address || "").trim()
  const location = [venue, address].filter(Boolean).join(", ")

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
    ctz: "Asia/Jakarta",
  })
  if (location) params.set("location", location)
  const detailsName = String(rawSession.name || "").trim()
  if (detailsName) params.set("details", detailsName)
  return `https://www.google.com/calendar/render?${params.toString()}`
}
