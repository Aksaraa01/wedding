import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("gift_accounts")
      .select("*")
      .eq("wedding_profile_id", weddingProfileId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wedding_profile_id, type, provider_name, provider_logo_url, account_number, account_name, qris_image_url } = body

    if (!wedding_profile_id || !type) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (!["bank", "ewallet", "qris"].includes(type)) {
      return NextResponse.json({ error: "Tipe rekening tidak valid" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("gift_accounts")
      .insert({ wedding_profile_id, type, provider_name, provider_logo_url, account_number, account_name, qris_image_url })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
