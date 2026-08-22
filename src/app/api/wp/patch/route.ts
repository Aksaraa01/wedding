import { NextResponse } from "next/server"
import { enqueuePatch, enqueueDuplicate } from "@/lib/wpSyncWorker"
import { supabaseAdmin } from "@/lib/supabase"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

export async function POST(req: Request) {
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi" }, { status: 501 })
  }

  try {
    const body = await req.json()
    const { profile_id } = body

    if (!profile_id) {
      return NextResponse.json({ error: "profile_id wajib diisi" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("active_wp_post_id, selected_template_id")
      .eq("id", profile_id)
      .maybeSingle()

    if (!profile?.active_wp_post_id && profile?.selected_template_id) {
      const job = await enqueueDuplicate(profile_id, profile.selected_template_id)
      return NextResponse.json({ job_id: job.job_id, status: job.status, fallback: "duplicate" }, { status: 202 })
    }

    const job = await enqueuePatch(profile_id)
    return NextResponse.json({ job_id: job.job_id, status: job.status }, { status: 202 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}