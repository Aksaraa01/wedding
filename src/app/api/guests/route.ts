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
    const { wedding_profile_id, name, whatsapp, relation, table_number } = body

    if (!wedding_profile_id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert({ wedding_profile_id, name, whatsapp, relation, table_number })
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
