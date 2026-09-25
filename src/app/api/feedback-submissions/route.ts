import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { matrixColumnForPackage } from "@/lib/packages"
import { notifyFeedbackBaruGroup } from "@/lib/notifyGroup"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("feedback_submissions")
      .select("*")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submissions: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wedding_profile_id, template_id, template_name, area, description, image_url } = body

    if (!wedding_profile_id || !description) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type")
      .eq("id", wedding_profile_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }

    if (area === "Full Custom / Penuh Design Baru" && !["bonus_full_custom", "elite"].includes(profile.package_type)) {
      return NextResponse.json({ error: "Area Full Custom hanya tersedia untuk paket Bonus Full Custom dan Elite" }, { status: 403 })
    }

    const { data: matrixRow } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .eq("label", "Batas Revisi")
      .single()

    const packageCol = matrixColumnForPackage(profile.package_type, "value")

    let limitRaw = matrixRow?.[packageCol] as string | undefined
    if (!limitRaw && ["bonus_full_custom", "elite"].includes(profile.package_type)) {
      limitRaw = matrixRow?.[matrixColumnForPackage("prestige", "value")] as string | undefined
    }
    limitRaw = limitRaw || "2 Round"
    const maxRevisions = parseInt(limitRaw) || 2

    const { count: existingCount } = await supabaseAdmin
      .from("feedback_submissions")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", wedding_profile_id)

    if (existingCount !== null && existingCount >= maxRevisions) {
      return NextResponse.json({
        error: `Anda telah mencapai batas maksimal revisi (${maxRevisions} putaran). Silakan hubungi konsultan Aksaraa untuk opsi penambahan revisi.`
      }, { status: 403 })
    }

    const roundNumber = (existingCount || 0) + 1

    const { data, error } = await supabaseAdmin
      .from("feedback_submissions")
      .insert({
        wedding_profile_id,
        template_id: template_id || null,
        template_name: template_name || "",
        area: area || null,
        description,
        image_url: image_url || null,
        round_number: roundNumber,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire-and-forget WA group notification (never blocks the couple's submit).
    try {
      const [profRes, queueRes] = await Promise.all([
        supabaseAdmin
          .from("wedding_profiles")
          .select("bride_name, groom_name, package_type, payment_status")
          .eq("id", wedding_profile_id)
          .maybeSingle(),
        supabaseAdmin
          .from("ops_queue")
          .select("id")
          .eq("wedding_profile_id", wedding_profile_id)
          .maybeSingle(),
      ])
      const prof = profRes.data
      if (prof && queueRes.data) {
        notifyFeedbackBaruGroup({
          wedding_profile_id,
          feedback_id: data.id,
          couple: `${prof.groom_name} & ${prof.bride_name}`,
          package_type: prof.package_type,
          payment_status: prof.payment_status,
          round_number: data.round_number ?? roundNumber,
          area: data.area,
          description: data.description,
          queue_id: queueRes.data.id,
        }).catch((e) => console.error("[feedback-notify] failed", e))
      }
    } catch (e) {
      console.error("[feedback-notify] failed", e)
    }

    return NextResponse.json({ submission: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
