import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params
    const body = await req.json()
    const { toggles, total_project_cost } = body

    const { error: selError } = await supabaseAdmin
      .from("product_selections")
      .update({
        premium_web: toggles.premium_web ?? true,
        wish_wall: toggles.wish_wall ?? true,
        reservation_automation: toggles.reservation_automation ?? true,
        kolom_direct_transfer: toggles.kolom_direct_transfer ?? true,
        gift_marketplace: toggles.gift_marketplace ?? true,
        qr_code_book: toggles.qr_code_book ?? true,
        unique_link_generator: toggles.unique_link_generator ?? true,
        undangan_fisik: toggles.undangan_fisik ?? false,
        wa_blast: toggles.wa_blast ?? true,
      })
      .eq("wedding_profile_id", profile_id)

    if (selError) {
      return NextResponse.json({ error: selError.message }, { status: 500 })
    }

    const { error: costError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({ total_project_cost })
      .eq("id", profile_id)

    if (costError) {
      return NextResponse.json({ error: costError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
