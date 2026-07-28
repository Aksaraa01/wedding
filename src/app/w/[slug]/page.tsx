import { supabaseAdmin } from "@/lib/supabase"
import { notFound } from "next/navigation"

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
    .select("id, bride_name, groom_name, estimated_wedding_date, selected_template_id")
    .eq("slug", slug)
    .single()

  if (!profile) notFound()

  const guestName = to || "Tamu Undangan"

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
