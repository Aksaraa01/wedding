export type WpJob = {
  id: string
  wedding_profile_id: string
  kind: "duplicate" | "patch"
  status: "queued" | "processing" | "done" | "failed"
  attempts: number
  last_error: string | null
  result: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

const DEFAULT_INTERVAL = 1500
const DEFAULT_TIMEOUT = 3 * 60 * 1000

export async function fetchWpJob(jobId: string): Promise<WpJob | null> {
  const res = await fetch(`/api/wp/jobs/${jobId}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export function pollWpJob(jobId: string, opts?: { interval?: number; timeout?: number }): Promise<WpJob> {
  const interval = opts?.interval ?? DEFAULT_INTERVAL
  const timeout = opts?.timeout ?? DEFAULT_TIMEOUT
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      const job = await fetchWpJob(jobId)
      if (!job) {
        reject(new Error("Job tidak ditemukan"))
        return
      }
      if (job.status === "done") {
        resolve(job)
        return
      }
      if (job.status === "failed") {
        reject(new Error(job.last_error || "Sinkronisasi WordPress gagal"))
        return
      }
      if (Date.now() - startedAt > timeout) {
        reject(new Error("Sinkronisasi WordPress masih berjalan. Coba lagi nanti."))
        return
      }
      setTimeout(tick, interval)
    }
    tick()

    return () => {
      cancelled = true
    }
  })
}