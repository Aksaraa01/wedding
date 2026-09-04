import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`login:${ip}`, 10)
  if (!rl.ok) return rateLimited(rl.retryAfterMs!)
  try {
    const { phone, pin } = await req.json()

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Nomor handphone dan PIN harus diisi" },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Nomor handphone tidak valid" },
        { status: 400 }
      )
    }

    const cleanPin = String(pin || "").replace(/\D/g, "").slice(0, 6)
    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json({ error: "PIN harus terdiri dari 6 digit angka" }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, pin")
      .eq("phone_number", normalizedPhone)
      .maybeSingle()

    if (!user || !user.pin || String(user.pin) !== cleanPin) {
      return NextResponse.json(
        { error: "Nomor handphone atau PIN tidak sesuai" },
        { status: 401 }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, slug, bride_name, groom_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: "Nomor handphone atau PIN tidak sesuai" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      wedding_profile_id: profile.id,
      slug: profile.slug,
      bride_name: profile.bride_name,
      groom_name: profile.groom_name,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
