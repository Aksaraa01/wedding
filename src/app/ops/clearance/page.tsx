"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import OpsHeader from "@/components/ops/OpsHeader"

type Employee = { id: string; name: string; role: string; phone_number: string }

type Row = {
  kind: "invitation" | "photos"
  profile_id: string
  couple: string
  slug: string | null
  package_type: string | null
  package_label: string
  addons: string[]
  whatsapp_number: string | null
  event_date: string | null
  due_date: string
  days_left: number
  invitation_date: string | null
  photo_date: string | null
  photo_count: number
  status: string
  reminded_at: string | null
  executed_at: string | null
  last_error: string | null
  message: string
  wa_url: string
  already_disabled: boolean
}

type Board = {
  today: string
  settings: { retentionDays: number; reminderDays: number }
  tabs: {
    invitation: { reminder: Row[]; execute: Row[] }
    photos: { reminder: Row[]; execute: Row[] }
  }
}

type LogRow = {
  id: string
  kind: "invitation" | "photos"
  status: string
  due_at: string
  couple: string
  slug: string | null
  whatsapp_number: string | null
  package_label: string
  actor: string | null
  reminded_at: string | null
  executed_at: string | null
  updated_at: string
  last_error: string | null
  photo_count: number
  asset_count: number
  wp_post_id: number | null
}

type TabKey = "invitation" | "photos"

function opsHeaders(employee: Employee): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-ops-phone": employee.phone_number,
    "x-ops-role": employee.role,
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Belum", cls: "bg-surface-container-highest text-on-surface-variant" },
    reminded: { label: "Dingatkan", cls: "bg-[#fdf0d5] text-[#7a5b00]" },
    executing: { label: "Proses", cls: "bg-[#dbe7f6] text-[#1c3d66]" },
    partial: { label: "Gagal sebagian", cls: "bg-[#f7dfdc] text-[#8a2b26]" },
    failed: { label: "Gagal", cls: "bg-[#f7dfdc] text-[#8a2b26]" },
    done: { label: "Selesai", cls: "bg-[#d7e7d1] text-[#3c4b3a]" },
  }
  const s = map[status] || map.pending
  return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${s.cls}`}>{s.label}</span>
}

export default function OpsClearancePage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<TabKey>("invitation")
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<Row | null>(null)
  const [notice, setNotice] = useState("")
  const [noticeOk, setNoticeOk] = useState(false)
  const [log, setLog] = useState<LogRow[]>([])
  const [logQuery, setLogQuery] = useState("")
  const [logLoading, setLogLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    try {
      const emp = JSON.parse(raw)
      if (!["admin", "sales"].includes(emp.role)) {
        router.replace("/ops")
        return
      }
      setEmployee(emp)
    } catch {
      router.replace("/ops/login")
    }
  }, [router])

  const fetchBoard = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    setError("")
    const res = await fetch("/api/ops/clearance", { headers: opsHeaders(employee) })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setBoard(data)
    else setError(data.error || "Gagal memuat data clearance")
    setLoading(false)
  }, [employee])

  const fetchLog = useCallback(
    async (q: string) => {
      if (!employee) return
      setLogLoading(true)
      try {
        const url = q.trim()
          ? `/api/ops/clearance/log?q=${encodeURIComponent(q.trim())}`
          : "/api/ops/clearance/log"
        const res = await fetch(url, { headers: opsHeaders(employee) })
        const data = await res.json().catch(() => ({}))
        if (res.ok) setLog(data.log || [])
      } finally {
        setLogLoading(false)
      }
    },
    [employee]
  )

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  // Debounced log search (couple name or WhatsApp number).
  useEffect(() => {
    if (!employee) return
    const t = setTimeout(() => fetchLog(logQuery), 350)
    return () => clearTimeout(t)
  }, [logQuery, fetchLog, employee])

  const remind = async (row: Row) => {
    setBusy(`${row.profile_id}:${row.kind}`)
    setNotice("")
    try {
      window.open(row.wa_url, "_blank", "noopener")
      const res = await fetch("/api/ops/clearance/remind", {
        method: "POST",
        headers: opsHeaders(employee!),
        body: JSON.stringify({ profileId: row.profile_id, kind: row.kind, dueAt: row.due_date }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setNotice(d.error || "Gagal menandai pengingat")
      }
      await Promise.all([fetchBoard(), fetchLog(logQuery)])
    } finally {
      setBusy(null)
    }
  }

  const execute = async (row: Row) => {
    setBusy(`${row.profile_id}:${row.kind}`)
    setNotice("")
    setConfirmRow(null)
    try {
      const res = await fetch("/api/ops/clearance/execute", {
        method: "POST",
        headers: opsHeaders(employee!),
        body: JSON.stringify({ profileId: row.profile_id, kind: row.kind, dueAt: row.due_date }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) {
        setNoticeOk(false)
        setNotice(d.error || "Eksekusi gagal sebagian. Coba lagi lewat tombol Ulangi.")
      } else {
        const labels = (d.results || []).map((r: { kind: string }) =>
          r.kind === "photos" ? "Foto Tamu" : "Masa Aktif"
        )
        setNoticeOk(true)
        setNotice(`Selesai: ${labels.join(" + ")} dihapus.`)
      }
      await Promise.all([fetchBoard(), fetchLog(logQuery)])
    } finally {
      setBusy(null)
    }
  }

  const renderRow = (row: Row, column: "reminder" | "execute") => {
    const key = `${row.profile_id}:${row.kind}`
    const isBusy = busy === key
    const canRemind = !row.already_disabled
    const failed = row.status === "partial" || row.status === "failed"
    return (
      <div key={key} className="border border-outline-variant bg-white p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-on-surface truncate">{row.couple || "-"}</p>
            <p className="text-[12px] text-on-surface-variant">
              {row.package_label}
              {row.addons.length > 0 ? ` + ${row.addons.join(", ")}` : ""}
            </p>
          </div>
          <StatusBadge status={row.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div>
            <p className="text-on-surface-variant">Acara</p>
            <p className="font-medium">{fmtDate(row.event_date)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">{row.kind === "photos" ? "Hapus foto" : "Masa aktif berakhir"}</p>
            <p className="font-medium">{fmtDate(row.due_date)}</p>
          </div>
          {row.kind === "photos" ? (
            <div>
              <p className="text-on-surface-variant">Jumlah foto tamu</p>
              <p className="font-medium">{row.photo_count}</p>
            </div>
          ) : null}
          <div>
            <p className="text-on-surface-variant">{row.days_left <= 0 ? "Lewat" : "Sisa"}</p>
            <p className="font-medium text-primary">
              {Math.abs(row.days_left)} hari{row.days_left <= 0 ? " lalu" : ""}
            </p>
          </div>
        </div>

        {row.last_error ? (
          <p className="text-[11px] text-[#8a2b26] bg-[#f7dfdc]/50 px-2 py-1">Error: {row.last_error}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 mt-auto pt-1">
          <button
            disabled={isBusy || !canRemind}
            onClick={() => remind(row)}
            className="flex-1 min-w-[120px] py-2 border border-outline-variant font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container-low disabled:opacity-40"
          >
            {canRemind ? "Ingatkan (WA)" : "Link nonaktif"}
          </button>
          <button
            disabled={isBusy}
            onClick={() => setConfirmRow(row)}
            className={`flex-1 min-w-[120px] py-2 font-label-md text-[11px] uppercase tracking-widest text-white disabled:opacity-40 ${failed ? "bg-[#8a2b26]" : "bg-primary"}`}
          >
            {failed ? "Ulangi" : column === "execute" ? "Eksekusi" : "Eksekusi"}
          </button>
        </div>
      </div>
    )
  }

  const renderColumn = (rows: Row[], column: "reminder" | "execute", emptyText: string) => (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <div className="border border-dashed border-outline-variant p-6 text-center text-[12px] text-on-surface-variant">
          {emptyText}
        </div>
      ) : (
        rows.map((r) => renderRow(r, column))
      )}
    </div>
  )

  const active = board?.tabs[tab] || { reminder: [], execute: [] }
  const reminderLabel = board ? `H-${board.settings.reminderDays}` : "H-3"

  return (
    <div className="min-h-screen bg-background pb-20">
      <OpsHeader employee={employee || { name: "", role: "" }} activeKey="clearance" />

      <main className="pt-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-display-lg text-headline-md text-primary uppercase tracking-widest">Clearance</h2>
          <p className="text-[13px] text-on-surface-variant mt-2">
            Daur hidup layanan: pengingat {reminderLabel} dan eksekusi penghapusan (undangan digital &amp; galeri foto tamu).
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-outline-variant">
          {([
            ["invitation", "Masa Aktif"],
            ["photos", "Foto Tamu"],
          ] as [TabKey, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2.5 font-label-md text-xs uppercase tracking-widest border-b-2 -mb-px ${
                tab === k ? "border-primary text-primary font-semibold" : "border-transparent text-on-surface-variant"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {notice ? (
          <div
            className={`mb-4 border px-4 py-3 text-[13px] ${
              noticeOk
                ? "border-[#bcd9b2] bg-[#d7e7d1]/60 text-[#3c4b3a]"
                : "border-[#f0b8b3] bg-[#f7dfdc]/60 text-[#8a2b26]"
            }`}
          >
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 border border-[#f0b8b3] bg-[#f7dfdc]/60 text-[#8a2b26] px-4 py-3 text-[13px]">{error}</div>
        ) : null}
        {loading ? (
          <p className="text-[13px] text-on-surface-variant">Memuat…</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h3 className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                Pengingat ({reminderLabel})
              </h3>
              {renderColumn(active.reminder, "reminder", "Tidak ada yang mendekati tenggat.")}
            </section>
            <section>
              <h3 className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant mb-3">
                Hari H / Terlambat
              </h3>
              {renderColumn(
                active.execute,
                "execute",
                tab === "photos" ? "Tidak ada foto tamu yang jatuh tempo." : "Tidak ada masa aktif yang jatuh tempo."
              )}
            </section>
          </div>
        )}

        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">
              Log Clearance
            </h3>
            <input
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder="Cari nama pasangan / no. WhatsApp…"
              className="w-full sm:max-w-xs px-3 py-2 border border-outline-variant bg-white text-[13px] outline-none focus:border-primary"
            />
          </div>
          <div className="border border-outline-variant bg-white overflow-x-auto">
            <table className="w-full text-[13px] min-w-[820px]">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Pasangan</th>
                  <th className="px-3 py-2 font-medium">Paket</th>
                  <th className="px-3 py-2 font-medium">Jenis</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Tenggat</th>
                  <th className="px-3 py-2 font-medium">Diingatkan</th>
                  <th className="px-3 py-2 font-medium">Dieksekusi</th>
                  <th className="px-3 py-2 font-medium">Oleh</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logLoading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-on-surface-variant">
                      Memuat…
                    </td>
                  </tr>
                ) : log.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-on-surface-variant">
                      {logQuery.trim() ? "Tidak ada hasil." : "Belum ada aktivitas clearance."}
                    </td>
                  </tr>
                ) : (
                  log.map((l) => (
                    <tr key={l.id} className="border-t border-outline-variant/60 align-top">
                      <td className="px-3 py-2">
                        <p className="font-medium text-on-surface">{l.couple || "-"}</p>
                        {l.whatsapp_number ? (
                          <p className="text-[11px] text-on-surface-variant">{l.whatsapp_number}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{l.package_label}</td>
                      <td className="px-3 py-2">{l.kind === "photos" ? "Foto Tamu" : "Masa Aktif"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-3 py-2">{fmtDate(l.due_at)}</td>
                      <td className="px-3 py-2">{fmtDateTime(l.reminded_at)}</td>
                      <td className="px-3 py-2">{fmtDateTime(l.executed_at)}</td>
                      <td className="px-3 py-2">{l.actor || "-"}</td>
                      <td className="px-3 py-2 text-on-surface-variant">
                        {l.last_error ? (
                          <span className="text-[#8a2b26]">Error: {l.last_error}</span>
                        ) : l.kind === "photos" ? (
                          `${l.photo_count} foto`
                        ) : (
                          `${l.asset_count} media${l.wp_post_id ? ` · post #${l.wp_post_id}` : ""}`
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {confirmRow ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-outline-variant">
            <h3 className="font-semibold text-[17px] text-on-surface mb-2">
              Eksekusi clearance: {confirmRow.couple}
            </h3>
            <p className="text-[13px] text-on-surface-variant mb-2">
              {confirmRow.kind === "photos"
                ? `Menghapus permanen ${confirmRow.photo_count} foto tamu beserta berkas medianya.`
                : "Menonaktifkan link undangan, menghapus postingan WordPress beserta lampirannya, dan menghapus media terunggah. Tindakan ini tidak dapat dibatalkan."}
            </p>
            {(() => {
              const otherDue = confirmRow.kind === "photos" ? confirmRow.invitation_date : confirmRow.photo_date
              if (!otherDue || !board || otherDue > board.today) return null
              return (
                <p className="text-[13px] text-[#8a2b26] mb-2">
                  Catatan: undangan &amp; galeri jatuh tempo bersamaan — keduanya akan dihapus sekaligus.
                </p>
              )
            })()}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRow(null)}
                className="px-4 py-2 border border-outline-variant font-label-md text-xs uppercase tracking-widest"
              >
                Batal
              </button>
              <button
                onClick={() => execute(confirmRow)}
                className="px-4 py-2 bg-primary text-white font-label-md text-xs uppercase tracking-widest"
              >
                Ya, eksekusi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
