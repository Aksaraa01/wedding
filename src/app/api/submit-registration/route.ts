import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotal, normalizePhone } from "@/lib/packages"

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
      package_type,
      wa_blast_tier,
      express_service,
      undangan_fisik,
    } = body

    if (!bride_name || !groom_name || !slug) {
      return NextResponse.json({ error: "Data pengantin tidak lengkap" }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(whatsapp_number || "")

    const userEmail = `${slug}@aksaraa.com`

    let userId = ""

    if (normalizedPhone) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
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
          phone_number: normalizedPhone || slug,
          role: "CLIENT",
        })
        .select("id")
        .single()

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      userId = user.id
    }

    const total = calcTotal(package_type || "signature", wa_blast_tier || 0, !!express_service)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .insert({
        user_id: userId,
        bride_name,
        groom_name,
        estimated_wedding_date,
        estimated_guest_count,
        slug,
        whatsapp_number: normalizedPhone,
        package_type: package_type || "signature",
        wa_blast_tier: wa_blast_tier || 0,
        express_service: !!express_service,
        undangan_fisik: !!undangan_fisik,
        total_project_cost: total,
        payment_status: "UNPAID",
      })
      .select("id")
      .single()

    if (profileError) {
      if (profileError.code === "23505") {
        return NextResponse.json({ error: "Nama pasangan sudah digunakan" }, { status: 409 })
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, wedding_profile_id: profile.id, slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
