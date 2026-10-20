"use client"
import { useCallback, useEffect, useState } from "react"

type Log = { created_at: string; latency_ms: number; db_status: string }
type Employee = { id: string; name: string; role: string; phone_number: string }
type FolderRow = { folder: string; objects: number; bytes: number }
type Usage = {
  source: "db" | "api"
  partial: boolean
  objects: number
  bytes: number
  thumbObjects: number
  thumbBytes: number
  guestBytes: number
  folders: FolderRow[]
  quotaBytes: number
  manual?: { dashboardUrl: string | null; note: string }
}
type ClearanceRow = { status: string }
type ClearanceBoard = {
  settings: { retentionDays: number; reminderDays: number }
  tabs: {
    invitation: { reminder: ClearanceRow[]; execute: ClearanceRow[] }
    photos: { reminder: ClearanceRow[]; execute: ClearanceRow[] }
  }
}

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 MB"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let v = n
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 || i < 2 ? 0 : 1)} ${units[i]}`
}

export default function HealthChart() {
  const [logs, setLogs] = useState<Log[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [clearance, setClearance] = useState<ClearanceBoard | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ops_employee")
      if (raw) setEmployee(JSON.parse(raw))
    } catch {}
  }, [])

  const load = useCallback(async () => {
    const r = await fetch("/api/health/history").then(r => r.json()).catch(() => ({ logs: [] }))
    setLogs(r.logs || [])
    if (employee) {
      const headers = { "x-ops-phone": employee.phone_number, "x-ops-role": employee.role }
      await Promise.all([
        fetch("/api/ops/usage", { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => setUsage(data))
          .catch(() => setUsage(null)),
        fetch("/api/ops/clearance", { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => setClearance(data))
          .catch(() => setClearance(null)),
      ])
    }
    setLoading(false)
  }, [employee])

  useEffect(() => {
    load()
    const t = setInterval(load, 60 * 60 * 1000)
    return () => clearInterval(t)
  }, [load])

  const max = Math.max(200, ...logs.map(l => l.latency_ms), 1)
  const avg = logs.length ? Math.round(logs.reduce((s, l) => s + l.latency_ms, 0) / logs.length) : 0
  const okCount = logs.filter(l => l.db_status === "ok").length
  const usedPct = usage && usage.quotaBytes ? Math.min(100, (usage.bytes / usage.quotaBytes) * 100) : 0
  const photoDue = clearance ? clearance.tabs.photos.execute.length : 0
  const invitationDue = clearance ? clearance.tabs.invitation.execute.length : 0

  if (loading) return <div className="p-6 text-sm text-on-surface-variant">Memuat...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-headline-md text-xl mb-2">Health — Hourly (24h)</h1>
      <p className="text-sm text-on-surface-variant mb-6">Monitor per jam via cron <code className="bg-surface-container px-1">GET /api/cron/health-log?secret=CRON_SECRET</code> — {okCount}/{logs.length} ok, avg {avg}ms</p>

      {usage && (
        <div className="bg-white border border-outline-variant rounded-xl p-4 mb-4">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="font-semibold text-sm">Storage</h2>
            <span className="text-xs text-on-surface-variant">{usage.source === "db" ? "DB exact" : "Storage API"}{usage.partial ? " (partial)" : ""}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm mb-1">
            <span className="font-semibold">{fmtBytes(usage.bytes)}</span>
            <span className="text-on-surface-variant">of {fmtBytes(usage.quotaBytes)} · {usage.objects.toLocaleString("id-ID")} objects</span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-3">
            <div className={`h-full ${usedPct > 85 ? "bg-red-500" : usedPct > 65 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(1, usedPct)}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div><div className="text-on-surface-variant">Thumbnails</div><div className="font-semibold">{fmtBytes(usage.thumbBytes)} · {usage.thumbObjects.toLocaleString("id-ID")}</div></div>
            <div><div className="text-on-surface-variant">Guest photos</div><div className="font-semibold">{fmtBytes(usage.guestBytes)}</div></div>
            <div><div className="text-on-surface-variant">Retention</div><div className="font-semibold">{clearance ? `${clearance.settings.retentionDays} hari · ${photoDue} foto due` : "—"}</div></div>
          </div>
          {usage.folders.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
              {usage.folders.slice(0, 6).map((f) => <span key={f.folder}>{f.folder}: {fmtBytes(f.bytes)}</span>)}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {clearance && invitationDue > 0 && <span className="text-amber-700">{invitationDue} undangan due clearance</span>}
            {usage.manual?.dashboardUrl && <a className="underline text-on-surface-variant" href={usage.manual.dashboardUrl} target="_blank" rel="noreferrer">Egress & transformations (dashboard)</a>}
          </div>
          {usage.manual?.note && <p className="mt-2 text-[11px] text-on-surface-variant">{usage.manual.note}</p>}
        </div>
      )}

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
