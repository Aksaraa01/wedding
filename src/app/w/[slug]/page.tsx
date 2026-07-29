import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { getTemplateComponent } from "@/components/templates"

export default async function WeddingInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ to?: string }>
}) {
  const { slug } = await params
  const { to } = await searchParams

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, bride_name, groom_name, estimated_wedding_date, selected_template_id, display_name, couple_illustration_url, grayscale, groom_full_name, bride_full_name, groom_photo_url, bride_photo_url, groom_parents, bride_parents, groom_instagram")
    .eq("slug", slug)
    .single()

  if (!profile) notFound()

  const guestName = to || "Tamu Undangan"

  // Resolve template code and render via registry
  let templateCode: string | null = null
  if (profile.selected_template_id) {
    const { data: tmpl } = await supabaseAdmin
      .from("web_templates")
      .select("code")
      .eq("id", profile.selected_template_id)
      .single()
    if (tmpl) templateCode = tmpl.code
  }

  const Template = getTemplateComponent(templateCode)
  if (Template) {
    return (
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
      />
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
