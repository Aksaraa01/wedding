import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { templateSupportsInvitedSessions } from "@/lib/invitedSessionsServer"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, phone_number, category, table_number, is_vip, invited_session_indexes } = body

    const update: Record<string, unknown> = { name, phone_number, category, table_number, is_vip: !!is_vip }
    if (invited_session_indexes !== undefined) {
      const { data: guestRow } = await supabaseAdmin
        .from("guests")
        .select("wedding_profile_id")
        .eq("id", id)
        .maybeSingle()
      const acaraSupported = guestRow?.wedding_profile_id
        ? await templateSupportsInvitedSessions(guestRow.wedding_profile_id)
        : false

      if (acaraSupported && Array.isArray(invited_session_indexes)) {
        const arr = invited_session_indexes
          .map((n: unknown) => Number(n))
          .filter((n: number) => Number.isInteger(n) && n >= 0)
        update.invited_session_indexes = arr.length > 0 ? Array.from(new Set(arr)).sort((a, b) => a - b) : null
      } else {
        update.invited_session_indexes = null
      }
    }

    const { data, error } = await supabaseAdmin
      .from("guests")
      .update(update)
      .eq("id", id)
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from("guests")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
