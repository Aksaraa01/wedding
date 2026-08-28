"use client"
import { useEffect, useState } from "react"

type Log = { created_at: string; latency_ms: number; db_status: string }

export default function HealthChart() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const r = await fetch("/api/health/history").then(r => r.json()).catch(() => ({ logs: [] }))
    setLogs(r.logs || [])
    setLoading(false)
  }
  useEffect(() => { load(); const t = setInterval(load, 60 * 60 * 1000); return () => clearInterval(t) }, [])

  const max = Math.max(200, ...logs.map(l => l.latency_ms), 1)
  const avg = logs.length ? Math.round(logs.reduce((s, l) => s + l.latency_ms, 0) / logs.length) : 0
  const okCount = logs.filter(l => l.db_status === "ok").length

  if (loading) return <div className="p-6 text-sm text-on-surface-variant">Memuat...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-headline-md text-xl mb-2">Health — Hourly (24h)</h1>
      <p className="text-sm text-on-surface-variant mb-6">Monitor per jam via cron <code className="bg-surface-container px-1">GET /api/cron/health-log?secret=CRON_SECRET</code> — {okCount}/{logs.length} ok, avg {avg}ms</p>
      <div className="bg-white border border-outline-variant rounded-xl p-4 overflow-x-auto">
        <div className="flex items-end gap-1 h-48 min-w-[600px]">
          {logs.map((l, i) => {
            const h = Math.max(4, Math.round((l.latency_ms / max) * 160))
            const isOk = l.db_status === "ok"
            const dt = new Date(l.created_at)
            const label = dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t ${isOk ? "bg-emerald-500" : "bg-red-500"}`} style={{ height: h }} title={`${label} — ${l.latency_ms}ms — ${l.db_status}`} />
                <span className="text-[9px] text-on-surface-variant whitespace-nowrap">{label}</span>
              </div>
            )
          })}
          {logs.length === 0 && <p className="text-sm text-on-surface-variant m-auto">Belum ada data — jalankan cron hourly</p>}
        </div>
        <div className="mt-4 flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm" /> ok</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm" /> db error</span>
          <span className="ml-auto text-on-surface-variant">max {max}ms</span>
        </div>
      </div>
      <button onClick={load} className="mt-4 px-4 py-2 border border-outline-variant text-sm hover:bg-surface-container">Refresh</button>
    </div>
  )
}
