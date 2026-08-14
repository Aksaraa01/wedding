import { NextResponse } from "next/server"
import { enqueueDuplicate } from "@/lib/wpSyncWorker"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""

export async function POST(req: Request) {
  if (!WP_ORIGIN || !WP_SECRET) {
    return NextResponse.json({ error: "Integrasi WordPress belum dikonfigurasi" }, { status: 501 })
  }

  try {
    const body = await req.json()
    const { template_id, profile_id } = body

    if (!template_id || !profile_id) {
      return NextResponse.json({ error: "template_id dan profile_id wajib diisi" }, { status: 400 })
    }

    const job = await enqueueDuplicate(profile_id, template_id)
    return NextResponse.json({ job_id: job.job_id, status: job.status }, { status: 202 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}