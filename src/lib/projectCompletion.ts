import { supabaseAdmin } from "@/lib/supabase"

// Daily auto-completion of finished projects. A project is finished when the
// wedding day has passed (>= H+1 in WIB), it is fully paid, it has no OPEN
// feedback (resolved feedback does not block), and it is not already Proyek
// Selesai. System-driven, so the audit trail has no employee — we attribute it
// to "Aksaraa Sistem" via ops_queue_status_log.actor_label.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
export const SYSTEM_ACTOR_LABEL = "Aksaraa Sistem"

export function wibDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

// Asia/Jakarta has a fixed UTC+7 offset (no DST), so midnight is exact.
export function msUntilNextWibMidnight(nowMs: number = Date.now()): number {
  const sinceMidnight = (((nowMs + WIB_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS
  return DAY_MS - sinceMidnight
}

// The wedding day is the LAST date across the acara sessions the couple
// entered (a couple can have multiple events; the project is only finished
// once the final one has passed). Sessions are unordered in practice, so take
// the max valid ISO date. Falls back to the registration estimate only when
// the couple never entered an acara session date.
export function weddingDay(sessions: unknown, estimated: string | null): string | null {
  let latest: string | null = null
  if (Array.isArray(sessions)) {
    for (const s of sessions) {
      const d = typeof (s as any)?.date === "string" ? (s as any).date.slice(0, 10) : null
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        if (!latest || d > latest) latest = d
      }
    }
  }
  if (latest) return latest
  return estimated ? estimated.slice(0, 10) : null
}

export type SweepResult = { checked: number; completed: number }

let sweepRunning = false

export async function runProjectCompletionSweep(): Promise<SweepResult> {
  if (sweepRunning) return { checked: 0, completed: 0 }
  sweepRunning = true
  try {
    const todayWib = wibDateString()

    const { data: candidates, error } = await supabaseAdmin
      .from("ops_queue")
      .select("id, status, sla_ended_at, wedding_profile_id, wedding_profiles!inner (id, payment_status, estimated_wedding_date, sessions)")
      .neq("status", "project_selesai")
      .eq("wedding_profiles.payment_status", "FULLY_PAID")

    if (error) throw new Error(error.message)

    const rows = ((candidates || []) as any[]).filter((r) => {
      const p = Array.isArray(r.wedding_profiles) ? r.wedding_profiles[0] : r.wedding_profiles
      const day = weddingDay(p?.sessions, p?.estimated_wedding_date || null)
      return !!day && day < todayWib
    })
    if (rows.length === 0) return { checked: 0, completed: 0 }

    const profileIds = rows.map((r) => r.wedding_profile_id)
    const { data: openFb } = await supabaseAdmin
      .from("feedback_submissions")
      .select("wedding_profile_id")
      .in("wedding_profile_id", profileIds)
      .in("status", ["pending", "in_progress"])

    const blocked = new Set((openFb || []).map((f: any) => f.wedding_profile_id))

    let completed = 0
    for (const row of rows) {
      if (blocked.has(row.wedding_profile_id)) continue

      // Auto-completion is terminal: freeze the SLA clock unless an earlier
      // terminal stage (e.g. feedback_selesai) already froze it.
      const { error: updateError } = await supabaseAdmin
        .from("ops_queue")
        .update({
          status: "project_selesai",
          ...((row as any).sla_ended_at ? {} : { sla_ended_at: new Date().toISOString() }),
        })
        .eq("id", row.id)
      if (updateError) {
        console.error(`[projectCompletion] queue ${row.id} update failed:`, updateError.message)
        continue
      }

      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: row.id,
        previous_status: row.status,
        new_status: "project_selesai",
        actor_label: SYSTEM_ACTOR_LABEL,
        details: "Diselesaikan otomatis oleh sistem (hari acara terakhir terlewati, lunas, tanpa feedback terbuka).",
      })
      if (logError) console.error(`[projectCompletion] queue ${row.id} log failed:`, logError.message)
      completed++
    }

    if (completed > 0) {
      console.log(`[projectCompletion] completed ${completed}/${rows.length} eligible projects`)
    }
    return { checked: rows.length, completed }
  } finally {
    sweepRunning = false
  }
}

let schedulerStarted = false

// Runs once daily at 00:00 Asia/Jakarta. Computed on every boot, so a restart
// never loses the schedule; date-based eligibility means a missed midnight is
// picked up by the next run.
export function startProjectCompletionScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true

  const scheduleNext = () => {
    const delay = msUntilNextWibMidnight()
    console.log(`[projectCompletion] next run in ${Math.round(delay / 60000)} min (00:00 WIB)`)
    setTimeout(async () => {
      try {
        await runProjectCompletionSweep()
      } catch (err) {
        console.error("[projectCompletion] sweep failed", err)
      }
      scheduleNext()
    }, delay)
  }

  if (process.env.PROJECT_COMPLETE_RUN_ON_BOOT === "true") {
    setTimeout(() => {
      runProjectCompletionSweep().catch((err) => console.error("[projectCompletion] boot sweep failed", err))
    }, 15000)
  }

  scheduleNext()
}
