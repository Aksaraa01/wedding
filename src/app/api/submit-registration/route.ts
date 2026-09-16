import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotal, deriveSelections, normalizePhone, PACKAGE_CODES } from "@/lib/packages"
import { slugifyCouple } from "@/lib/slug"
import { notifyNewAccountGroup } from "@/lib/notifyGroup"

function validPin(pin: string): boolean {
  return /^\d{6}$/.test(pin || "")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      bride_name,
      groom_name,
      estimated_wedding_date,
      estimated_guest_count,
      whatsapp_number,
      pin,
      package_type,
      wa_blast_tier,
      express_service,
      undangan_fisik,
    } = body

    if (!bride_name || !groom_name) {
      return NextResponse.json({ error: "Data pengantin tidak lengkap" }, { status: 400 })
    }

    if (!validPin(pin)) {
      return NextResponse.json({ error: "PIN harus terdiri dari 6 digit angka" }, { status: 400 })
    }

    if (package_type && !PACKAGE_CODES.includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    // Canonical slug built from FULL names (all input words, not just the first).
    const slug = slugifyCouple(bride_name, groom_name)
    if (!slug) {
      return NextResponse.json({ error: "Data pengantin tidak lengkap" }, { status: 400 })
    }

    const { data: dupCouple } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (dupCouple) {
      return NextResponse.json({ error: "Nama pasangan sudah digunakan" }, { status: 409 })
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
          pin,
        })
        .select("id")
        .single()

      if (userError) {
        if (userError.code === "23505") {
          return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar" }, { status: 409 })
        }
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

    const selections = deriveSelections(package_type || "signature", !!undangan_fisik)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .insert({
        wedding_profile_id: profile.id,
        status: "belum_bayar",
        sla_started_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (queueError) {
      return NextResponse.json({ error: queueError.message }, { status: 500 })
    }

    if (enabledFeatures.length > 0) {
      const featureRows = enabledFeatures.map((key) => ({
        ops_queue_id: queueItem.id,
        wedding_profile_id: profile.id,
        feature_key: key,
        status: "butuh_tindakan",
      }))

      const { error: featuresError } = await supabaseAdmin
        .from("feature_actions")
        .insert(featureRows)

      if (featuresError) {
        return NextResponse.json({ error: featuresError.message }, { status: 500 })
      }
    }

    void notifyNewAccountGroup({
      wedding_profile_id: profile.id,
      slug,
      bride_name,
      groom_name,
      whatsapp_number: normalizedPhone,
      package_type: package_type || "signature",
      wa_blast_tier: wa_blast_tier || 0,
      total,
    }).catch((e) => console.error("[notifyGroup] failed", e))

    return NextResponse.json({ success: true, wedding_profile_id: profile.id, slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
