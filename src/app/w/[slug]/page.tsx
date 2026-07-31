import { supabaseAdmin } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { getTemplateComponent } from "@/components/templates"
import InvitationOpenedTracker from "@/components/InvitationOpenedTracker"

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
    .select("id, bride_name, groom_name, estimated_wedding_date, selected_template_id, selected_track_id, display_name, couple_illustration_url, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram, sessions, quote_text, quote_source, stories, gallery_photos, inviting_families, rsvp_max_pax")
    .eq("slug", slug)
    .single()

  if (!profile) notFound()

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

  // Resolve template code and render via registry
  let templateCode: string | null = null
  if (profile.selected_template_id) {
    const { data: tmpl } = await supabaseAdmin
      .from("web_templates")
      .select("code, demo_url")
      .eq("id", profile.selected_template_id)
      .single()
    if (tmpl) templateCode = tmpl.code
    if (tmpl?.demo_url) {
      redirect(tmpl.demo_url)
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
        stories={profile.stories || undefined}
        gallery_photos={profile.gallery_photos || undefined}
        gift_accounts={giftAccounts.length > 0 ? giftAccounts : undefined}
        gift_address={giftAddress}
        track_url={trackUrl}
        inviting_families={profile.inviting_families ? (typeof profile.inviting_families === "string" ? JSON.parse(profile.inviting_families) : profile.inviting_families) : undefined}
        wedding_profile_id={profile.id}
        guest_id={guestContext?.id}
        guest_qr_token={guestContext?.qr_token || undefined}
        guest_qr_url={guestContext?.qr_token ? `/qr/${guestContext.slug || guestContext.qr_token}` : undefined}
        guest_qr_content={guestContext?.qr_token ? `/welcome/${guestContext.slug || guestContext.qr_token}` : undefined}
        guest_table_number={guestContext?.table_number || undefined}
        guest_rsvp_status={guestContext?.rsvp_status || undefined}
        rsvp_max_pax={profile.rsvp_max_pax ?? undefined}
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
