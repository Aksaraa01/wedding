import { supabaseAdmin } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { getTemplateComponent } from "@/components/templates"
import InvitationOverlay from "@/components/InvitationOverlay"
import InvitationOpenedTracker from "@/components/InvitationOpenedTracker"
import { getRowGates, getFeatureIncluded } from "@/lib/featureGates"
import { getWpPostAlive } from "@/lib/wpPostCache"
import { cachedRead } from "@/lib/refCache"

export const revalidate = 60

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
    .select("slug, display_name, bride_name, groom_name, bride_full_name, groom_full_name, estimated_wedding_date, couple_illustration_url, cover_photos")
    .ilike("slug", slug)
    .single()

  if (!profile) return {}

  const name1 = (profile.bride_full_name || profile.bride_name || "").trim()
  const name2 = (profile.groom_full_name || profile.groom_name || "").trim()
  const title = `The Wedding of ${name1}-${name2}`

  const tagline = (profile.display_name || `${profile.bride_name} & ${profile.groom_name}`).trim()
  const date = profile.estimated_wedding_date
    ? new Date(profile.estimated_wedding_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""
  const description = [tagline, date, "Mohon doa restu atas pernikahan kami; detail acara dan konfirmasi kehadiran tersedia di tautan undangan."].filter(Boolean).join(" • ")

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
  const image = firstImageUrl(profile.couple_illustration_url) || firstImageUrl(covers) || undefined

  const meta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
  return meta
}

export default async function WeddingInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ to?: string; qr_token?: string }>
}) {
  const { slug } = await params
  const { to, qr_token } = await searchParams

  // Subdomains are lowercased by browsers, so resolve the couple slug
  // case-insensitively (the stored slug is camel: "RafiNamu-NoviKamu").
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, slug, bride_name, groom_name, estimated_wedding_date, selected_template_id, selected_track_id, display_name, couple_illustration_url, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, package_type, active_wp_post_id, active_wp_post_url")
    .ilike("slug", slug)
    .single()

  if (!profile) notFound()

  const canonicalSlug = profile.slug || slug

  const [rowGates, featureSet] = await Promise.all([
    getRowGates(profile.package_type || "signature"),
    getFeatureIncluded(profile.package_type || "signature"),
  ])

  const guestContext = await (async () => {
    const fields = "id, name, slug, table_number, qr_token, rsvp_status, rsvp_pax_count, rsvp_message"
    if (to) {
      // Exact match first (preserves case-sensitive canonical slug).
      const bySlug = await supabaseAdmin
        .from("guests")
        .select(fields)
        .eq("wedding_profile_id", profile.id)
        .eq("slug", to)
        .maybeSingle()
      if (bySlug.data) return bySlug.data

      // Case-insensitive match -> auto-correct to the canonical (cased) slug so the
      // guest name in the link always follows the exact input (uppercase).
      const bySlugInsensitive = await supabaseAdmin
        .from("guests")
        .select(fields)
        .eq("wedding_profile_id", profile.id)
        .ilike("slug", to)
        .maybeSingle()
      if (bySlugInsensitive.data) {
        const qs = new URLSearchParams({ to: bySlugInsensitive.data.slug })
        if (qr_token) qs.set("qr_token", qr_token)
        redirect(`/w/${canonicalSlug}?${qs.toString()}`)
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

  // A provided ?to= must resolve to a real guest of this couple — otherwise 404.
  if (to && !guestContext && !qr_token) notFound()

  const guestName = guestContext?.name || to || "Tamu Undangan"

  const [giftAcctsRes, giftAddrRes, trackRes] = await Promise.all([
    supabaseAdmin.from("gift_accounts").select("provider_name, account_number, account_name, type").eq("wedding_profile_id", profile.id),
    supabaseAdmin.from("gift_addresses").select("full_address").eq("wedding_profile_id", profile.id).single(),
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
  const trackUrl = trackRes.data?.audio_url || undefined

  // Redirect to WP if this couple has an active duplicated WP post.
  // Verify the post still exists (cached for 5 min, so repeat views skip the
  // WP HEAD round-trip that competed with editing); if deleted, fall back to demo URL.
  const wpPostAlive = profile.active_wp_post_url
    ? await getWpPostAlive(profile.active_wp_post_url)
    : false

  if (profile.active_wp_post_url && wpPostAlive) {
    const guestName = guestContext?.name || to || ""
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
        {guestContext?.id && (
          <InvitationOverlay
            guestId={guestContext.id}
            guestName={guestName}
            coupleName={(profile.groom_full_name && profile.bride_full_name ? `${profile.groom_full_name} & ${profile.bride_full_name}` : profile.display_name) || `${profile.groom_name} & ${profile.bride_name}`}
            weddingProfileId={profile.id}
            guestQrUrl={
              guestContext.slug || guestContext.qr_token
                ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}`
                : undefined
            }
            guestTableNumber={guestContext.table_number}
            guestRsvpStatus={guestContext.rsvp_status}
            guestRsvpMessage={guestContext.rsvp_message}
            rsvpMaxPax={profile.rsvp_max_pax ?? 2}
            qrEnabled={featureSet.has("qr_code_book")}
          />
        )}
      </>
    )
  }

  // Resolve template code and render via registry
  let templateCode: string | null = null
  if (profile.selected_template_id) {
    // Static reference data — cached so repeat views skip this read.
    const tmpl = await cachedRead<{ code: string | null; demo_url: string | null } | null>(`template:${profile.selected_template_id}`, 10 * 60_000, async () => {
      const { data, error } = await supabaseAdmin
        .from("web_templates")
        .select("code, demo_url")
        .eq("id", profile.selected_template_id)
        .single()
      if (error) return null
      return { code: data?.code || null, demo_url: data?.demo_url || null }
    })
    if (tmpl) templateCode = tmpl.code
    if (tmpl?.demo_url && !wpPostAlive) {
      const guestName = guestContext?.name || to || ""
      const wpUrl = guestName
        ? `${tmpl.demo_url}?to=${encodeURIComponent(guestName)}`
        : tmpl.demo_url
      return (
        <>
          <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#fff" }}>
            <iframe src={wpUrl} title="Undangan Pernikahan" allow="autoplay; fullscreen" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
          </div>
          <InvitationOpenedTracker guestId={guestContext?.id} />
          {guestContext?.id && (
            <InvitationOverlay
              guestId={guestContext.id}
              guestName={guestName}
              coupleName={(profile.groom_full_name && profile.bride_full_name ? `${profile.groom_full_name} & ${profile.bride_full_name}` : profile.display_name) || `${profile.groom_name} & ${profile.bride_name}`}
              weddingProfileId={profile.id}
              guestQrUrl={guestContext.slug || guestContext.qr_token ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
              guestTableNumber={guestContext.table_number}
              guestRsvpStatus={guestContext.rsvp_status}
              guestRsvpMessage={guestContext.rsvp_message}
              rsvpMaxPax={profile.rsvp_max_pax ?? 2}
              qrEnabled={featureSet.has("qr_code_book")}
            />
          )}
        </>
      )
    }
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
        couple_illustration_url={profile.couple_illustration_url || undefined}
        display_name={profile.display_name || undefined}
        grayscale={profile.grayscale || undefined}
        groom_full_name={profile.groom_full_name || undefined}
        bride_full_name={profile.bride_full_name || undefined}
        groom_photo_url={profile.groom_photo_url || undefined}
        bride_photo_url={profile.bride_photo_url || undefined}
        groom_parents={profile.groom_parents || undefined}
        bride_parents={profile.bride_parents || undefined}
        groom_instagram={profile.groom_instagram || undefined}
        sessions={profile.sessions || undefined}
        quote_text={profile.quote_text || undefined}
        quote_source={profile.quote_source || undefined}
        stories={rowGates.story.included ? profile.stories || undefined : undefined}
        gallery_photos={profile.gallery_photos || undefined}
        gift_accounts={giftAccounts.length > 0 ? giftAccounts : undefined}
        gift_address={rowGates.gift_address.included ? giftAddress : undefined}
        track_url={trackUrl}
        inviting_families={rowGates.inviting_families.included ? (profile.inviting_families ? (typeof profile.inviting_families === "string" ? JSON.parse(profile.inviting_families) : profile.inviting_families) : undefined) : undefined}
        wedding_profile_id={profile.id}
        guest_id={guestContext?.id}
        guest_qr_token={featureSet.has("qr_code_book") ? (guestContext?.qr_token || undefined) : undefined}
        guest_qr_url={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/qr/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
        guest_qr_content={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/welcome/${encodeURIComponent(guestContext.slug || guestContext.qr_token)}` : undefined}
        guest_table_number={guestContext?.table_number || undefined}
        guest_rsvp_status={guestContext?.rsvp_status || undefined}
        rsvp_max_pax={profile.rsvp_max_pax ?? undefined}
        feature_gates={{
          story: rowGates.story.included,
          gift_address: rowGates.gift_address.included,
          inviting_families: rowGates.inviting_families.included,
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
        {profile.bride_name} & {profile.groom_name}
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "16px",
        color: "#444748",
        marginBottom: "32px",
      }}>
        Kepada Yth. {guestName}
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
