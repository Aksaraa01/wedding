import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      bride_name,
      groom_name,
      estimated_wedding_date,
      estimated_guest_count,
      slug,
      whatsapp_number,
      toggles,
      total_project_cost,
    } = body

    if (!bride_name || !groom_name || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userEmail = `${slug}@aksaraa.com`

    let userId = ""

    if (whatsapp_number) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("phone_number", whatsapp_number)
        .maybeSingle()

      if (existing) {
        userId = existing.id
      }
    }

    if (!userId) {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          email: userEmail,
          password_hash: slug,
          phone_number: whatsapp_number || slug,
          role: "CLIENT",
        })
        .select("id")
        .single()

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      userId = user.id
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .insert({
        user_id: userId,
        bride_name,
        groom_name,
        estimated_wedding_date,
        estimated_guest_count,
        slug,
        whatsapp_number,
        total_project_cost,
        payment_status: "UNPAID",
      })
      .select("id")
      .single()

    if (profileError) {
      if (profileError.code === "23505") {
        return NextResponse.json({ error: "Slug already taken" }, { status: 409 })
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { error: selError } = await supabaseAdmin
      .from("product_selections")
      .insert({
        wedding_profile_id: profile.id,
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

    if (selError) {
      return NextResponse.json({ error: selError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, wedding_profile_id: profile.id, slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
