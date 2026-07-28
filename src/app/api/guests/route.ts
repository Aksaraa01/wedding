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
    const { wedding_profile_id, name, phone_number, category, table_number, guest_count } = body

    if (!wedding_profile_id || !name) {
      return NextResponse.json({ error: "Nama tamu wajib diisi" }, { status: 400 })
    }

    const digits = (phone_number || "").replace(/\D/g, "").replace(/^0+/, "")
    const normalized = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""

    const nameMatch = name.trim()
    let dupQuery = supabaseAdmin
      .from("guests")
      .select("id")
      .eq("wedding_profile_id", wedding_profile_id)
      .ilike("name", nameMatch)

    if (normalized) {
      dupQuery = dupQuery.eq("phone_number", normalized)
    }

    const { data: existing } = await dupQuery.maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Tamu dengan nama dan nomor yang sama sudah ada", duplicate: true }, { status: 409 })
    }

    const pax = Math.max(1, Number(guest_count) || 1)
    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert({ wedding_profile_id, name, phone_number: normalized, category, table_number, guest_count: pax })
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

export async function DELETE(req: Request) {
  try {
    const { wedding_profile_id } = await req.json()

    if (!wedding_profile_id) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("guests")
      .delete()
      .eq("wedding_profile_id", wedding_profile_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
