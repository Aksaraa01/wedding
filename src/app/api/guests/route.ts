import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const q = searchParams.get("q") || ""

    if (!weddingProfileId) {
      return NextResponse.json({ error: "Missing wedding_profile_id" }, { status: 400 })
    }

    let query = supabaseAdmin
      .from("guests")
      .select("*")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: true })

    if (q) {
      query = query.or(`name.ilike.%${q}%,table_number.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guests: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, name, phone_number, category, table_number } = body

    if (!wedding_profile_id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const digits = (phone_number || "").replace(/\D/g, "")
    const normalized = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""

    const { data: existing } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("wedding_profile_id", wedding_profile_id)
      .ilike("name", name.trim())
      .gte("phone_number", normalized || "")
      .lte("phone_number", normalized || "")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Tamu dengan nama dan nomor yang sama sudah ada", duplicate: true }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert({ wedding_profile_id, name, phone_number: normalized, category, table_number })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guest: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
