import { NextResponse } from "next/server"
import { enqueueDuplicate, hasOpenWpChain } from "@/lib/wpSyncWorker"
import { supabaseAdmin } from "@/lib/supabase"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

export async function POST(req: Request) {
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi" }, { status: 501 })
  }

  try {
    const body = await req.json()
    const { template_id, profile_id, source } = body

    if (!template_id || !profile_id) {
      return NextResponse.json({ error: "template_id dan profile_id wajib diisi" }, { status: 400 })
    }

    // Clearance ran: masa aktif ended, the WP post was deleted. Do not let the
    // couple spin up a fresh invitation — only Ops can reopen the profile.
    const { data: gate } = await supabaseAdmin
      .from("wedding_profiles")
      .select("invitation_disabled_at")
      .eq("id", profile_id)
      .maybeSingle()
    if ((gate as { invitation_disabled_at?: string | null } | null)?.invitation_disabled_at) {
      return NextResponse.json(
        { error: "Masa aktif undangan ini telah berakhir. Hubungi tim Aksaraa untuk mengaktifkan kembali." },
        { status: 409 }
      )
    }

    if (await hasOpenWpChain(profile_id)) {
      return NextResponse.json({ error: "Sinkronisasi template masih berjalan. Tunggu selesai sebelum mengganti template lagi." }, { status: 409 })
    }

    const job = await enqueueDuplicate(profile_id, template_id, typeof source === "string" ? source : null)
    return NextResponse.json({ job_id: job.job_id, status: job.status }, { status: 202 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}