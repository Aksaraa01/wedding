import { supabaseAdmin } from "@/lib/supabase"
import { formatDateUpper } from "@/lib/formatDate"
import { resolveBankLogo } from "@/lib/bankList"
import { getRowGates } from "@/lib/featureGates"

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

// Gather a couple's content into a flat `fields` object (the same shape the WP
// mu-plugin consumes for PATCH / duplicate). Returns null if the profile is missing.
export async function buildProfileFields(profileId: string): Promise<{ profile: any; fields: Record<string, any> } | null> {
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

  const rawSessions: any[] = parseList(profile.sessions)
  const sessions = rawSessions.map((r: any) => ({
    name: esc(r?.name),
    date: r?.date ? formatDateUpper(r.date) : "",
    time: esc(r?.time),
    venue: esc(r?.venue),
    address: esc(r?.address),
    maps_url: r?.maps_url || "",
  }))

  const calendar_link = buildCalendarLink(
    rawSessions[0] as any,
    esc(profile.groom_name) || esc(profile.display_name?.split("&")[0]?.trim()),
    esc(profile.bride_name) || esc(profile.display_name?.split("&")[1]?.trim())
  )

  const stories = parseList(profile.stories).map((r: any) => ({
    title: esc(r?.title),
    description: esc(r?.description),
    image_url: r?.image_url || "",
  }))

  const fields: Record<string, any> = {
    couple_illustration_url: profile.couple_illustration_url || "",
    cover_photos: parseList(profile.cover_photos).filter(Boolean),
    couple_initials: esc(profile.couple_initials),
    display_name: esc(profile.display_name || (profile.bride_name && profile.groom_name ? `${profile.bride_name} & ${profile.groom_name}` : "")),
    groom_name: esc(profile.groom_name),
    bride_name: esc(profile.bride_name),
    groom_full_name: esc(profile.groom_full_name),
    bride_full_name: esc(profile.bride_full_name),
    groom_photo_url: parseList(profile.groom_photo_url).filter(Boolean),
    bride_photo_url: parseList(profile.bride_photo_url).filter(Boolean),
    groom_parents: esc(profile.groom_parents),
    bride_parents: esc(profile.bride_parents),
    groom_instagram: esc(profile.groom_instagram),
    bride_instagram: esc(profile.bride_instagram),
    video_url: profile.video_url || "",
    quote_text: esc(profile.quote_text),
    quote_source: esc(profile.quote_source),
    opening_title: esc(profile.opening_title),
    opening_description: esc(profile.opening_description),
    countdown: profile.estimated_wedding_date ? `${profile.estimated_wedding_date} 00:00` : "",
    gift_address: esc(giftAddr?.full_address),
    gift_address_name: esc(giftAddr?.recipient_name),
    gift_section_hidden: profile.gift_section_visible === false,
    video_section_hidden: !gates.cinematic_video.included || profile.video_section_visible === false,
    inviting_families_hidden: !gates.inviting_families.included || profile.inviting_families_visible === false,
    story_hidden: !gates.story.included || profile.story_visible === false,
    gift_address_hidden: !gates.gift_address.included,
    date_upper: profile.estimated_wedding_date ? formatDateUpper(profile.estimated_wedding_date) : "",
    sessions,
    calendar_link,
    gallery_photos: parseList(profile.gallery_photos).filter(Boolean),
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
