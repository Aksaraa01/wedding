import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const status = searchParams.get("status")
    const guestId = searchParams.get("guest_id")
    const source = searchParams.get("source")

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    let query = supabaseAdmin
      .from("wishes")
      .select("*, guests(category, is_vip)")
      .eq("wedding_profile_id", weddingProfileId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (guestId) {
      query = query.eq("guest_id", guestId)
    }

    if (source) {
      query = query.eq("source", source)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wishes: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let { wedding_profile_id, guest_id, name, message, source } = await req.json()

    if (guest_id === "" || guest_id === "null" || guest_id === "undefined") guest_id = null
    if (guest_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(guest_id))) guest_id = null
    name = (name || "").toString().trim()
    message = (message || "").toString().trim()
    if (!name) name = "Tamu Undangan"

    if (!wedding_profile_id || !message) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const rl = checkRateLimit(`wish:${getClientIp(req)}:${wedding_profile_id}`, 30, 60_000)
    if (!rl.ok) return rateLimited(rl.retryAfterMs!)

    const wishSource = source === "welcome" ? "welcome" : "invitation"

    if (guest_id) {
      const { count: existing } = await supabaseAdmin
        .from("wishes")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", guest_id)
        .eq("source", wishSource)

      if (existing && existing > 0) {
        return NextResponse.json({ error: "Anda sudah mengirimkan doa dan harapan sebelumnya. Setiap tamu hanya dapat mengirim satu kali." }, { status: 409 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from("wishes")
      .insert({ wedding_profile_id, guest_id, name, message, status: "pending", source: wishSource })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wish: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
