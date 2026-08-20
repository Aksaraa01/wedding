import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { matrixColumnForPackage } from "@/lib/packages"

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

    const { data: matrixRow } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .eq("label", "Batas Revisi")
      .single()

    const packageCol = matrixColumnForPackage(profile.package_type, "value")

    const limitRaw = matrixRow?.[packageCol] as string || "2 Round"
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

    return NextResponse.json({ submission: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
