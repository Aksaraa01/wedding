import { supabaseAdmin } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { getTemplateComponent } from "@/components/templates"
import InvitationOpenedTracker from "@/components/InvitationOpenedTracker"
import { getRowGates, getFeatureIncluded } from "@/lib/featureGates"

export default async function WeddingInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ to?: string; qr_token?: string }>
}) {
  const { slug } = await params
  const { to, qr_token } = await searchParams

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, bride_name, groom_name, estimated_wedding_date, selected_template_id, selected_track_id, display_name, couple_illustration_url, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax, package_type, active_wp_post_id, active_wp_post_url")
    .eq("slug", slug)
    .single()

  if (!profile) notFound()

  const [rowGates, featureSet] = await Promise.all([
    getRowGates(profile.package_type || "signature"),
    getFeatureIncluded(profile.package_type || "signature"),
  ])

  const guestContext = await (async () => {
    const fields = "id, name, slug, table_number, qr_token, rsvp_status, rsvp_pax_count, rsvp_message"
    if (to) {
      const bySlug = await supabaseAdmin
        .from("guests")
        .select(fields)
        .eq("wedding_profile_id", profile.id)
        .eq("slug", to)
        .maybeSingle()
      if (bySlug.data) return bySlug.data
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

  const guestName = guestContext?.name || to || "Tamu Undangan"

  const [giftAcctsRes, giftAddrRes, trackRes] = await Promise.all([
    supabaseAdmin.from("gift_accounts").select("provider_name, account_number, account_name, type").eq("wedding_profile_id", profile.id).eq("is_active", true),
    supabaseAdmin.from("gift_addresses").select("full_address").eq("wedding_profile_id", profile.id).eq("is_active", true).single(),
    profile.selected_track_id
      ? supabaseAdmin.from("web_tracks").select("audio_url").eq("id", profile.selected_track_id).single()
      : Promise.resolve({ data: null }),
  ])
  const giftAccounts = giftAcctsRes.data?.filter(a => a.type === "bank" || a.type === "ewallet") || []
  const giftAddress = giftAddrRes.data?.full_address || undefined
  const trackUrl = trackRes.data?.audio_url || undefined

  // Redirect to WP if this couple has an active duplicated WP post.
  // Verify the post still exists first; if it was deleted, fall back to demo URL.
  const wpPostAlive = await (async () => {
    if (!profile.active_wp_post_url) return false
    try {
      const check = await fetch(profile.active_wp_post_url, { method: "HEAD", cache: "no-store" })
      return check.status < 400
    } catch {
      return false
    }
  })()

  if (profile.active_wp_post_url && wpPostAlive) {
    const guestName = guestContext?.name || to || ""
    const wpUrl = guestName
      ? `${profile.active_wp_post_url}?to=${encodeURIComponent(guestName)}`
      : profile.active_wp_post_url
    // Embed the couple's WP invitation in a full-viewport iframe so the guest
    // URL stays on wedding.aksaraa.com instead of redirecting to wp.aksaraa.com.
    return (
      <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#fff" }}>
        <iframe
          src={wpUrl}
          title="Undangan Pernikahan"
          allow="autoplay; fullscreen"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
    )
  }

  // Resolve template code and render via registry
  let templateCode: string | null = null
  if (profile.selected_template_id) {
    const { data: tmpl } = await supabaseAdmin
      .from("web_templates")
      .select("code, demo_url")
      .eq("id", profile.selected_template_id)
      .single()
    if (tmpl) templateCode = tmpl.code
    // Fallback: redirect to WP template demo URL (for templates without a live active dup)
    if (tmpl?.demo_url && !wpPostAlive) {
      const guestName = guestContext?.name || to || ""
      const wpUrl = guestName
        ? `${tmpl.demo_url}?to=${encodeURIComponent(guestName)}`
        : tmpl.demo_url
      redirect(wpUrl)
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
        slug={slug}
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
        guest_qr_url={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/qr/${guestContext.slug || guestContext.qr_token}` : undefined}
        guest_qr_content={featureSet.has("qr_code_book") && guestContext?.qr_token ? `/welcome/${guestContext.slug || guestContext.qr_token}` : undefined}
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
