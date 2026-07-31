import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data: approved, error } = await supabaseAdmin
      .from("wishes")
      .select("id, name, message, is_pinned, status, created_at, guest_id, guests(category)")
      .eq("wedding_profile_id", weddingProfileId)
      .eq("status", "approved")
      .eq("source", "invitation")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const pinned = approved?.filter((w) => w.is_pinned) || []
    const others = approved?.filter((w) => !w.is_pinned) || []

    return NextResponse.json({ pinned, others })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
