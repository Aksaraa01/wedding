import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { pauseWpSyncWorker, resumeWpSyncWorker, wpSyncWorkerState } from "@/lib/wpSyncWorker"

// Internal control surface for the deploy drain.
//
// A PM2 reload kills the process mid-job: any `wp_sync_jobs` row left in
// `processing` then belongs to a process that no longer exists, and
// `claimNext()` only reclaims it after STALE_MS (5 min) — during which that
// couple's template change is refused with a 409. The deploy pauses the worker,
// waits for `processing` to reach 0, reloads, and the new process reclaims any
// stragglers on boot.
//
// Auth mirrors /api/cron/*: X-Aksaraa-Secret or X-Cron-Secret.

function authorized(req: Request): boolean {
  const expected = process.env.WP_INTERNAL_SECRET || process.env.CRON_SECRET || ""
  if (!expected) return false
  const header = req.headers.get("x-aksaraa-secret") || req.headers.get("x-cron-secret") || ""
  return header === expected
}

async function state() {
  const { count, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "processing")
  return { ...wpSyncWorkerState(), processing: error ? -1 : count ?? 0 }
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await state())
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { action?: string }
  if (body.action === "pause") pauseWpSyncWorker()
  else if (body.action === "resume") resumeWpSyncWorker()
  else return NextResponse.json({ error: 'action must be "pause" or "resume"' }, { status: 400 })
  return NextResponse.json(await state())
}
