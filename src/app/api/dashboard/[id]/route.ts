import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Wedding profile not found" }, { status: 404 })
    }

    const { data: selections, error: selError } = await supabaseAdmin
      .from("product_selections")
      .select("*")
      .eq("wedding_profile_id", id)
      .single()

    if (selError) {
      return NextResponse.json({ error: selError.message }, { status: 500 })
    }

    const { count: guestCount, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)

    if (guestError) {
      return NextResponse.json({ error: guestError.message }, { status: 500 })
    }

    return NextResponse.json({ profile, selections, guest_count: guestCount || 0 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
