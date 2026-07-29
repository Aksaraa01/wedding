import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const guestId = searchParams.get("guest_id")

    if (guestId) {
      const { data } = await supabaseAdmin
        .from("guest_photos")
        .select("id, image_url")
        .eq("guest_id", guestId)
        .maybeSingle()
      return NextResponse.json({ exists: !!data, photo: data || null })
    }

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("guest_photos")
      .select("id, image_url, created_at, guest_id, guests(name, category)")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photos: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
