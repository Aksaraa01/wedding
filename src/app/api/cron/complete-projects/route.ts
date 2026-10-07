import { NextResponse } from "next/server"
import { runProjectCompletionSweep } from "@/lib/projectCompletion"

// Manual / scheduled trigger for the Proyek Selesai auto-completion sweep.
// The in-process scheduler runs it daily at 00:00 WIB; this endpoint exists for
// cron/manual runs and testing.
function authorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET || process.env.WP_INTERNAL_SECRET || ""
  if (!expected) return false
  const header = req.headers.get("x-cron-secret") || req.headers.get("x-aksaraa-secret") || ""
  if (header === expected) return true
  const url = new URL(req.url)
  return url.searchParams.get("secret") === expected
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await runProjectCompletionSweep()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req: Request) {
  return POST(req)
}
