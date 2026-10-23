import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireProfileAccess } from "@/lib/requireProfileAccess"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireProfileAccess(req, id)
  if (auth) return auth

  try {
    const body = await req.json().catch(() => ({}))
    const guestId = typeof body.guest_id === "string" ? body.guest_id : ""

    if (!guestId) {
      return NextResponse.json({ error: "guest_id wajib diisi" }, { status: 400 })
    }

    const clickedAt = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("guests")
      .update({ wa_invite_clicked_at: clickedAt })
      .eq("id", guestId)
      .eq("wedding_profile_id", id)
      .select("id, wa_invite_clicked_at")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, wa_invite_clicked_at: data.wa_invite_clicked_at })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
