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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type")
      .eq("id", weddingProfileId)
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
      .eq("wedding_profile_id", weddingProfileId)

    const used = existingCount || 0
    const remaining = Math.max(0, maxRevisions - used)

    return NextResponse.json({
      max_revisions: maxRevisions,
      used_revisions: used,
      remaining_revisions: remaining,
      is_locked: remaining <= 0,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
