import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotal } from "@/lib/packages"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params
    const body = await req.json()
    const { package_type, wa_blast_tier, express_service, undangan_fisik } = body

    const total = calcTotal(
      package_type || "signature",
      wa_blast_tier || 0,
      !!express_service
    )

    const { error } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        package_type: package_type || "signature",
        wa_blast_tier: wa_blast_tier || 0,
        express_service: !!express_service,
        undangan_fisik: !!undangan_fisik,
        total_project_cost: total,
      })
      .eq("id", profile_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
