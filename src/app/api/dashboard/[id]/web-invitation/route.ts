import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, bride_name, groom_name, slug, selected_template_id, selected_track_id")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    let template = null
    if (profile.selected_template_id) {
      const { data: t } = await supabaseAdmin
        .from("web_templates")
        .select("*")
        .eq("id", profile.selected_template_id)
        .single()
      template = t
    }

    let track = null
    if (profile.selected_track_id) {
      const { data: tr } = await supabaseAdmin
        .from("web_tracks")
        .select("*")
        .eq("id", profile.selected_track_id)
        .single()
      track = tr
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        bride_name: profile.bride_name,
        groom_name: profile.groom_name,
        slug: profile.slug,
        invitation_url: `https://${profile.slug}.aksaraa.com`,
      },
      template,
      track,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { selected_template_id, selected_track_id } = body

    const updates: Record<string, string | null> = {}
    if (selected_template_id !== undefined) updates.selected_template_id = selected_template_id
    if (selected_track_id !== undefined) updates.selected_track_id = selected_track_id

    const { error } = await supabaseAdmin
      .from("wedding_profiles")
      .update(updates)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
