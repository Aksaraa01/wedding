import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"

export async function POST(req: Request) {
  try {
    const { phone, slug } = await req.json()

    if (!phone || !slug) {
      return NextResponse.json(
        { error: "Nomor handphone dan nama pasangan harus diisi" },
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

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .trim()

    if (!cleanSlug) {
      return NextResponse.json(
        { error: "Nama pasangan tidak valid" },
        { status: 400 }
      )
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone_number", normalizedPhone)
      .maybeSingle()

    if (!user) {
      return NextResponse.json(
        { error: "Nomor handphone atau nama pasangan tidak sesuai" },
        { status: 401 }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, slug, bride_name, groom_name")
      .eq("user_id", user.id)
      .eq("slug", cleanSlug)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: "Nomor handphone atau nama pasangan tidak sesuai" },
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
