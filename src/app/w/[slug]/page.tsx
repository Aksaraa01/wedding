import { supabaseAdmin } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import type { Metadata } from "next"
import { getTemplateComponent, getTemplateContentSpec } from "@/components/templates"
import InvitationOverlay from "@/components/InvitationOverlay"
import InvitationOpenedTracker from "@/components/InvitationOpenedTracker"
import { isBotUserAgent, markInvitationOpened } from "@/lib/recordInvitationOpen"
import { getRowGates, getFeatureIncluded } from "@/lib/featureGates"
import { getWpPostAlive } from "@/lib/wpPostCache"
import { cachedRead } from "@/lib/refCache"
import { ASSETS } from "@/lib/assets"
import { thumbUrl, thumbStoryImages } from "@/lib/storageUrl"
import { childFullNamesLine, resolveChildren, thumbChildren } from "@/lib/children"
import { toOgImageUrl } from "@/lib/storage"
import { prettifyGuestSlug, FALLBACK_GUEST_NAME, findGuestForTo, guestToFromParams } from "@/lib/guest-link"
import { filterSessionsByScope } from "@/lib/invitedSessions"
import { resolveCoupleName } from "@/lib/coupleName"
import { profileView } from "@/lib/profileView"
import { normalizeLanguage } from "@/lib/i18n"
import InvitationExpired from "@/components/InvitationExpired"
import { coupleUrl } from "@/lib/coupleUrl"
import { templateContentWithDefaults } from "@/lib/templateExtras"

export const revalidate = 60

// Fields resolved for an identified guest (see findGuestForTo call below).
type GuestContext = {
  id: string
  name: string
  slug: string | null
  table_number: string | null
  qr_token: string | null
  rsvp_status: string | null
  rsvp_pax_count: number | null
  rsvp_message: string | null
  invitation_opened_at: string | null
  invited_session_indexes: number[] | null
}

// Extract the first public image URL from a field that may be: a URL string, a
// JSON-encoded array, or a nested array (slideshow cover slots -> array of URLs).
function firstImageUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim()
    if (!t) return undefined
    if (/^https?:\/\//i.test(t)) return t
    try {
      return firstImageUrl(JSON.parse(t))
    } catch {
      return undefined
    }
  }
  if (Array.isArray(value)) {
    for (const v of value) {
      const r = firstImageUrl(v)
      if (r) return r
    }
  }
  return undefined
}

// Couple-specific social sharing metadata. The shared URL is {slug}.wedding.aksaraa.com
// (rewritten to /w/{slug}), which embeds the couple's WP invitation in an iframe — so the
// OG card shown by WhatsApp/Telegram/crawlers must come from THIS Next page, not WP.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("slug, display_name, bride_name, groom_name, bride_full_name, groom_full_name, estimated_wedding_date, selected_template_id, couple_illustration_url, link_thumbnail_url, link_thumbnail_disabled, cover_photos, og_image_url, og_image_width, og_image_height, event_type, subject_gender, children, language")
    .ilike("slug", slug)
    .single()

  if (!profile) return {}

  const name1 = (profile.groom_full_name || profile.groom_name || "").trim()
  const name2 = (profile.bride_full_name || profile.bride_name || "").trim()

  // Template code decides what `language = "default"` resolves to, so it must be
  // known before any copy is chosen.
  let noCoverSlots = false
  let metaTemplateCode: string | null = null
  if ((profile as any).selected_template_id) {
    const { data: tplRow } = await supabaseAdmin
      .from("web_templates")
      .select("code, no_photo, wp_manifest")
      .eq("id", (profile as any).selected_template_id)
      .maybeSingle()
    metaTemplateCode = (tplRow as any)?.code || null
    const specSlots = getTemplateContentSpec((tplRow as any)?.code || null)?.cover_slots
    const manifestSlots = Array.isArray((tplRow as any)?.wp_manifest?.cover_photos)
      ? (tplRow as any).wp_manifest.cover_photos.length
      : 0
    noCoverSlots = (tplRow as any)?.no_photo === true || (specSlots ?? manifestSlots) === 0
  }
  const lang = normalizeLanguage(profile.language)
  const view = profileView({ ...profile, language: lang })
  const kids = view.kids
  const labels = view.labels
  // One ceremony can introduce several ananda (siblings). The share card names
  // every one of them — "Qari & Rifki", "Qari, Rifki & Rafa" — never only the
  // first child, whose full name is mirrored into `groom_*`.
  const kidsNames = kids ? childFullNamesLine(resolveChildren(profile)) || name1 : ""
  const title: Metadata["title"] = kids
    ? { absolute: `${labels.eventKicker} ${kidsNames} | ${labels.brand}` }
    : lang === "en"
      ? `The Wedding of ${name1} & ${name2}`
      : `Pernikahan ${name1} & ${name2}`

  const tagline = kids
    ? kidsNames
    : `${(profile.groom_name || "").trim()} & ${(profile.bride_name || "").trim()}`.replace(/^ & | & $/g, "")
  const date = profile.estimated_wedding_date
    ? new Date(profile.estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""
  const description = kids
    ? [tagline, date, lang === "en" ? `Invitation to the ${labels.eventNoun.toLowerCase()}. Event details and RSVP are available in this link.` : `Undangan ${labels.eventNoun.toLowerCase()}. Detail acara dan konfirmasi kehadiran tersedia di tautan ini.`].filter(Boolean).join(" • ")
    : [tagline, date, lang === "en" ? "Thank you for your prayers and blessings; event details and RSVP are in this invitation." : "Mohon doa restu atas pernikahan kami; detail acara dan konfirmasi kehadiran tersedia di tautan undangan."].filter(Boolean).join(" • ")

  let covers: string[] = []
  if (Array.isArray(profile.cover_photos)) covers = profile.cover_photos.filter((c: unknown) => typeof c === "string" && c.trim())
  else if (typeof profile.cover_photos === "string" && profile.cover_photos.trim()) {
    try {
      const parsed = JSON.parse(profile.cover_photos)
      if (Array.isArray(parsed)) covers = parsed.filter((c: unknown) => typeof c === "string" && c.trim())
    } catch {
      covers = [profile.cover_photos.trim()]
    }
  }
  // Social thumbnail priority (shared with the PUT og hook — same order):
  // 1) dedicated og variant (guaranteed sub-300KB JPEG), 2) uploaded link
  //    thumbnail, 3) first JPEG cover (transforms stay JPEG and small),
  //    4) any image, 5) default.
  const isJpeg = (u: string) => /\.jpe?g($|\?)/i.test(u)
  const firstJpeg = (list: string[]) => list.find(isJpeg)
  const ogVariant = typeof (profile as any).og_image_url === "string" && (profile as any).og_image_url.trim()
    ? (profile as any).og_image_url.trim()
    : undefined
  const linkThumb = firstImageUrl((profile as any).link_thumbnail_url)
  // A design with no cover slot must never fall back to the couple's stored
  // cover/illustration (those are hidden by the template). Only the uploaded
  // link thumbnail is valid there; otherwise the generic default is used.
  // "Tanpa foto thumbnail": the couple opted out of a personal photo entirely.
  // That means NO og:image at all (title + description only) — never the couple
  // portrait and not a stock placeholder either.
  const linkThumbDisabled = (profile as any).link_thumbnail_disabled === true && covers.length === 0
  const defaultImage = profile.slug ? coupleUrl(profile.slug, "/defaults/couple.png") : undefined
  const image = linkThumbDisabled
    ? undefined
    : noCoverSlots
      ? (linkThumb || defaultImage)
      : ogVariant
        || linkThumb
        || firstJpeg([firstImageUrl(profile.couple_illustration_url), ...covers].filter((u): u is string => !!u))
        || firstImageUrl(profile.couple_illustration_url)
        || firstImageUrl(covers)
        || defaultImage
  // Crawlers (WhatsApp/Telegram) fetch this per share — serve a transform of
  // the raw cover instead of the multi-MB original. The dedicated og variant
  // (when present) is already a small JPEG and passes through untouched.
  const ogImage = image ? toOgImageUrl(image) : undefined
  // Width/height are emitted only when measured for THIS file (stored at
  // generation time) — never a declared box the file doesn't fill, which
  // renders zoomed-out. Without them crawlers probe the file (fine).
  const ogW = Number((profile as any).og_image_width)
  const ogH = Number((profile as any).og_image_height)
  const ogDims = Number.isFinite(ogW) && Number.isFinite(ogH) && ogW > 0 && ogH > 0
    && ogVariant && ogImage === ogVariant.split("?")[0]
    ? { width: ogW, height: ogH } as const
    : undefined
  const ogAlt = tagline
    ? kids
      ? `Undangan ${labels.eventNoun.toLowerCase()} ${tagline}`
      : `Undangan pernikahan ${tagline}`
    : undefined

  const meta: Metadata = {
    title,
    description,
    // Couple subdomains ({slug}.wedding.aksaraa.com) rewrite to this page;
    // canonicalize ?to=/qr_token variants to the clean subdomain root so
    // per-guest URLs consolidate instead of indexing as duplicates. Kept
    // indexable (follow) so the brand credit backlink passes equity.
    alternates: profile.slug ? { canonical: coupleUrl(profile.slug) } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, alt: ogAlt, type: "image/jpeg", ...ogDims }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
  return meta
}

export default async function WeddingInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const query = await searchParams
  // A raw "&" in the shared link ("?to=Sindy Sihombing&/Partner") arrives as an
  // extra empty-valued param; rejoin the halves before resolving the guest.
  const to = guestToFromParams(query) || undefined
  const qr_token = (Array.isArray(query.qr_token) ? query.qr_token[0] : query.qr_token) || undefined

  // Crawler fast-path: link-preview bots (WhatsApp/Telegram/...) only need the
  // <head> metadata from generateMetadata above (guest-independent). Serve a
  // minimal shell and skip every heavy read (guest lookup, gates, gifts,
  // template, WP liveness) so previews never time out under sharing spikes.
  // Same metadata, no cloaking — guests get the full page below.
  const ua = (await headers()).get("user-agent")
  if (isBotUserAgent(ua)) {
    const { data: lite } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, slug, bride_name, groom_name, bride_full_name, groom_full_name, guest_link_strict, children, event_type")
      .ilike("slug", slug)
      .maybeSingle()
    if (!lite) notFound()
    // Same access rule as the guest page below: strict couples 404 unknown
    // ?to= even for crawlers (no invitation exists there). One indexed
    // existence check — still far cheaper than the full render.
    if (to || qr_token) {
      const linkStrict = lite.guest_link_strict !== false
      let guestFound = false
      if (to) {
        // Same resolver as the full page: raw first (keeps every existing
        // link working), then the normalized fallback for hand-typed names
        // such as "Budi / Ani".
        const hit = await findGuestForTo<{ id: string }>(lite.id, to, "id")
        guestFound = !!hit.guest
      }
      if (!guestFound && qr_token) {
        const { data: hit } = await supabaseAdmin
          .from("guests")
          .select("id")
          .eq("wedding_profile_id", lite.id)
          .eq("qr_token", qr_token)
          .maybeSingle()
        guestFound = !!hit
      }
      if (to && !guestFound && !qr_token && linkStrict) notFound()
    }
    const liteView = profileView(lite)
    const names =
      (liteView.kids ? childFullNamesLine(resolveChildren(lite)) : "") ||
      resolveCoupleName(lite) ||
      "Undangan Pernikahan"
    return (
      <div style={{ padding: 32, fontFamily: "Georgia, serif", textAlign: "center" }}>
        <p style={{ fontSize: 20 }}>{names}</p>
        <p style={{ fontSize: 14, opacity: 0.7 }}>
          {liteView.kids ? "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu berkenan hadir." : "Mohon doa restu atas pernikahan kami."}
        </p>
      </div>
    )
  }

  // Subdomains are lowercased by browsers, so resolve the couple slug
  // case-insensitively (the stored slug is camel: "RafiNamu-NoviKamu").
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, slug, bride_name, groom_name, estimated_wedding_date, selected_template_id, selected_track_id, display_name, couple_illustration_url, cover_photos, couple_initials, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, bride_instagram, video_url, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, package_type, active_wp_post_id, active_wp_post_url, opening_title, opening_description, gift_section_visible, video_section_visible, inviting_families_visible, story_visible, guest_link_strict, invitation_disabled_at, dresscode, livestream, dresscode_visible, livestream_visible, rundown, contacts, rundown_visible, contacts_visible, template_content, event_type, subject_gender, children, language")
    .ilike("slug", slug)
    .single()

  if (!profile) notFound()

  // Ops executed the invitation teardown: the link is over, regardless of date.
  // (Enforcement happens only after Ops executes — never from the computed date.)
  if ((profile as { invitation_disabled_at?: string | null }).invitation_disabled_at) {
    return <InvitationExpired coupleName={resolveCoupleName(profile)} />
  }

  const canonicalSlug = profile.slug || slug

  // Reference data (package gates/features) is shared across couples and
  // changes rarely — cache per package type so repeat views skip these reads.
  // Couple content (profile/gifts/track) intentionally stays uncached.
  const packageType = profile.package_type || "signature"
  const [rowGates, featureSet] = await Promise.all([
    cachedRead(`gates:${packageType}`, 10 * 60_000, () => getRowGates(packageType)),
    cachedRead(`features:${packageType}`, 10 * 60_000, () => getFeatureIncluded(packageType)),
  ])

  const guestContext = await (async () => {
    const fields = "id, name, slug, table_number, qr_token, rsvp_status, rsvp_pax_count, rsvp_message, invitation_opened_at, invited_session_indexes"
    if (to) {
      const hit = await findGuestForTo<GuestContext>(profile.id, to, fields)
      if (hit.guest) {
        // Canonicalize the ?to= value (case, or a hand-typed display name such
        // as "Budi / Ani") so every downstream consumer — the WP iframe, the
        // RSVP dock, the QR — receives a slug.
        if (hit.slug && hit.slug !== to) {
          const qs = new URLSearchParams({ to: hit.slug })
          if (qr_token) qs.set("qr_token", qr_token)
          redirect(`/w/${canonicalSlug}?${qs.toString()}`)
        }
        return hit.guest
      }
    }
    if (qr_token) {
      const byToken = await supabaseAdmin
        .from("guests")
        .select(fields)
        .eq("wedding_profile_id", profile.id)
        .eq("qr_token", qr_token)
        .maybeSingle()
      return byToken.data || null
    }
    return null
  })()

  // Terbatas (default): a provided ?to= must resolve to a real guest of
  // this couple — otherwise 404. Fleksibel: any ?to= renders.
  const linkStrict = profile.guest_link_strict !== false
  if (to && !guestContext && !qr_token && linkStrict) notFound()

  // Server-side "dibuka" backup: link loaded for a resolved guest. Runs per
  // request (this route reads searchParams, so it is never statically
  // prerendered). Skipped for bots (link-preview fetches must not count),
  // for already-opened guests (zero extra writes), and never throws.
  // The client-side InvitationOpenedTracker remains as belt-and-suspenders.
  if (guestContext?.id && !(guestContext as { invitation_opened_at?: string | null }).invitation_opened_at) {
    try {
      const ua = (await headers()).get("user-agent")
      if (!isBotUserAgent(ua)) await markInvitationOpened(guestContext.id)
    } catch {
      // tracking must never break page render
    }
  }

  const visibleSessions = filterSessionsByScope(
    (profile.sessions as any[] | null) || [],
    guestContext?.invited_session_indexes ?? null,
  )

  const [giftAcctsRes, giftAddrRes, trackRes] = await Promise.all([
    supabaseAdmin.from("gift_accounts").select("provider_name, account_number, account_name, type").eq("wedding_profile_id", profile.id),
    supabaseAdmin.from("gift_addresses").select("full_address, recipient_name").eq("wedding_profile_id", profile.id).single(),
    profile.selected_track_id
      ? (async () => {
          // Static reference data — cached so repeat views skip this read.
          const audioUrl = await cachedRead(`track:${profile.selected_track_id}`, 10 * 60_000, async () => {
            const { data, error } = await supabaseAdmin.from("web_tracks").select("audio_url").eq("id", profile.selected_track_id).single()
            if (error) return null
            return data?.audio_url || null
          })
          return { data: { audio_url: audioUrl } }
        })()
      : Promise.resolve({ data: null }),
  ])
  const giftAccounts = giftAcctsRes.data?.filter(a => a.type === "bank" || a.type === "ewallet") || []
  const giftAddress = giftAddrRes.data?.full_address || undefined
  const giftAddressName = giftAddrRes.data?.recipient_name || undefined
  const trackUrl = trackRes.data?.audio_url || undefined

  // Resolve template metadata. In-house templates (source_type = 'inhouse') never
  // fall back to a WP iframe (active post or demo) — they render the React
  // component directly from wedding_profiles below.
  let templateCode: string | null = null
  let isInhouse = false
  let templateDemoUrl: string | null = null
  if (profile.selected_template_id) {
    // Static reference data — cached so repeat views skip this read.
    const tmpl = await cachedRead<{ code: string | null; demo_url: string | null; source_type: string | null; wp_master_slug: string | null } | null>(`template:${profile.selected_template_id}`, 10 * 60_000, async () => {
      const { data, error } = await supabaseAdmin
        .from("web_templates")
        .select("code, demo_url, source_type, wp_master_slug")
        .eq("id", profile.selected_template_id)
        .single()
      if (error) return null
      return { code: data?.code || null, demo_url: data?.demo_url || null, source_type: data?.source_type || null, wp_master_slug: data?.wp_master_slug || null }
    })
    if (tmpl) {
      templateCode = tmpl.code
      isInhouse = tmpl.source_type === "inhouse" ||
        (!!tmpl.code && !!getTemplateComponent(tmpl.code) && !tmpl.wp_master_slug)
      templateDemoUrl = tmpl.demo_url
    }
  }
  const lang = normalizeLanguage(profile.language)
  const guestName = guestContext?.name || prettifyGuestSlug(to) || (lang === "en" ? "Guest" : linkStrict ? "Tamu Undangan" : FALLBACK_GUEST_NAME)

  // In-house templates default to "An Everlasting Love" when the couple has not
  // picked a track yet (they can override it in the editor music section).
  const resolvedTrackUrl = trackUrl || (isInhouse ? ASSETS.defaultMusic : undefined)

  // Redirect to WP only if this is a WP-backed template with a live duplicate.
  // A couple who switched WP → in-house may still carry a stale active_wp_post_url.
  const wpPostAlive = profile.active_wp_post_url && !isInhouse
    ? await getWpPostAlive(profile.active_wp_post_url)
    : false

  if (!isInhouse && profile.active_wp_post_url && wpPostAlive) {
    const guestName = guestContext?.name || prettifyGuestSlug(to) || ""
    const wpUrl = guestName
      ? `${profile.active_wp_post_url}?to=${encodeURIComponent(guestName)}`
      : profile.active_wp_post_url
    // Embed the couple's WP invitation in a full-viewport iframe so the guest
    // URL stays on wedding.aksaraa.com instead of redirecting to wp.aksaraa.com.
    // A floating QR (Prestige qr_code_book) + RSVP dock overlays it for the guest.
    return (
      <>
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#fff" }}>
          <iframe
            src={wpUrl}
            title="Undangan Pernikahan"
            allow="autoplay; fullscreen"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
        {/* Count the invitation as "dibuka" for identified guests when the page
            loads (covers popup-based and future popup-less invitations). */}
        <InvitationOpenedTracker guestId={guestContext?.id} />
        {((guestContext?.id) || (!linkStrict && !!to)) && (
          <InvitationOverlay
            guestId={guestContext?.id}
            guestSlug={to || undefined}
            allowFlexibleRsvp={!linkStrict}
            guestName={guestName}
            coupleName={resolveCoupleName(profile)}
            weddingProfileId={profile.id}
            guestQrUrl={
              guestContext?.slug || guestContext?.qr_token
                ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}`
                : undefined
            }
            guestTableNumber={guestContext?.table_number}
            guestRsvpStatus={guestContext?.rsvp_status}
            guestRsvpMessage={guestContext?.rsvp_message}
            rsvpMaxPax={profile.rsvp_max_pax ?? 2}
            qrEnabled={featureSet.has("qr_code_book")}
            language={lang}
          />
        )}
      </>
    )
  }

  // In-house templates have no demo redirect; WP templates without a live post
  // fall back to the master demo iframe (kept for backward compatibility).
  if (!isInhouse && templateDemoUrl && !wpPostAlive) {
    const guestName = guestContext?.name || prettifyGuestSlug(to) || ""
    const wpUrl = guestName
      ? `${templateDemoUrl}?to=${encodeURIComponent(guestName)}`
      : templateDemoUrl
    return (
      <>
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#fff" }}>
          <iframe src={wpUrl} title="Undangan Pernikahan" allow="autoplay; fullscreen" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
        <InvitationOpenedTracker guestId={guestContext?.id} />
        {((guestContext?.id) || (!linkStrict && !!to)) && (
          <InvitationOverlay
            guestId={guestContext?.id}
            guestSlug={to || undefined}
            allowFlexibleRsvp={!linkStrict}
            guestName={guestName}
            coupleName={resolveCoupleName(profile)}
            weddingProfileId={profile.id}
            guestQrUrl={guestContext?.slug || guestContext?.qr_token ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
            guestTableNumber={guestContext?.table_number}
            guestRsvpStatus={guestContext?.rsvp_status}
            guestRsvpMessage={guestContext?.rsvp_message}
            rsvpMaxPax={profile.rsvp_max_pax ?? 2}
            qrEnabled={featureSet.has("qr_code_book")}
            language={lang}
          />
        )}
      </>
    )
  }

  const Template = getTemplateComponent(templateCode)
  if (Template) {
    return (
      <>
        <InvitationOpenedTracker guestId={guestContext?.id} />
        <Template
        bride_name={profile.bride_name}
        groom_name={profile.groom_name}
        estimated_wedding_date={profile.estimated_wedding_date}
        slug={canonicalSlug}
        guest_name={guestName}
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
        children={thumbChildren(resolveChildren(profile), (url) => String(thumbUrl(url, 800)))}
        video_url={profile.video_url || undefined}
        opening_title={profile.opening_title || undefined}
        opening_description={profile.opening_description || undefined}
        template_content={templateContentWithDefaults(templateCode, lang, profile.template_content as Record<string, string> | null)}
        dresscode={(profile.dresscode as any) || undefined}
        livestream={(profile.livestream as any) || undefined}
        dresscode_visible={(profile as any).dresscode_visible !== false}
        livestream_visible={(profile as any).livestream_visible !== false}
        rundown={(profile as any).rundown || undefined}
        contacts={(profile as any).contacts || undefined}
        rundown_visible={(profile as any).rundown_visible !== false}
        contacts_visible={(profile as any).contacts_visible !== false}
        sessions={visibleSessions.length > 0 ? visibleSessions : (profile.sessions || undefined)}
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
        track_url={resolvedTrackUrl}
        inviting_families={rowGates.inviting_families.included ? (profile.inviting_families ? (typeof profile.inviting_families === "string" ? JSON.parse(profile.inviting_families) : profile.inviting_families) : undefined) : undefined}
        wedding_profile_id={profile.id}
        event_type={profile.event_type || "wedding"}
        subject_gender={profile.subject_gender || undefined}
        language={lang}
        event_labels={profileView({ ...profile, language: lang }).labels}
        guest_id={guestContext?.id}
        guest_link_strict={linkStrict}
        guest_slug={to || undefined}
        guest_qr_token={featureSet.has("qr_code_book") ? (guestContext?.qr_token || undefined) : undefined}
        guest_qr_url={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
        guest_qr_content={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/welcome/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
        guest_table_number={guestContext?.table_number || undefined}
        guest_rsvp_status={guestContext?.rsvp_status || undefined}
        guest_rsvp_message={guestContext?.rsvp_message || undefined}
        rsvp_max_pax={profile.rsvp_max_pax ?? undefined}
feature_gates={{
            story: rowGates.story.included,
            gift_address: rowGates.gift_address.included,
            inviting_families: rowGates.inviting_families.included,
            video: rowGates.cinematic_video.included,
            qr_code_book: featureSet.has("qr_code_book"),
          }}
        />
      </>
    )
  }

  // Default fallback layout
  const weddingDate = profile.estimated_wedding_date
    ? new Date(profile.estimated_wedding_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : ""

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      background: "#fdf9f0",
      color: "#1c1c16",
      fontFamily: "'Playfair Display', serif",
    }}>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#8d4d39",
        marginBottom: "16px",
      }}>
        The Wedding of
      </p>
      <h1 style={{
        fontSize: "48px",
        lineHeight: "56px",
        fontWeight: 400,
        margin: "0 0 8px",
      }}>
        {resolveCoupleName(profile)}
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "16px",
        color: "#444748",
        marginBottom: "32px",
      }}>
        {lang === "en" ? "Dear" : "Kepada Yth."} {guestName}
      </p>
      {weddingDate && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#747878",
        }}>
          {weddingDate}
        </p>
      )}
      <div style={{
        marginTop: "48px",
        width: "80px",
        height: "1px",
        background: "#c4c7c7",
      }} />
    </div>
  )
}
