"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import { PACKAGE_LABELS, formatDate } from "@/lib/opsConstants"
import { OPS_COLUMNS } from "@/lib/opsStatus"

type QueueItem = {
  id: string
  derived_status: string
  registration_date: string | null
  assigned_to: string | null
  assigned_name: string | null
  wedding_profile: {
    id: string
    bride_name: string
    groom_name: string
    whatsapp_number: string
    package_type: string
    express_service?: boolean | null
  }
}

type Employee = { id: string; name: string }
type OpsEmployee = { id: string; name: string; role: string }

const POLL_MS = 20000

export default function OpsBoardPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [petugas, setPetugas] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    setEmployee(JSON.parse(raw))
  }, [router])

  // Restore persisted filters (URL query params win; fall back to sessionStorage).
  useEffect(() => {
    let s = ""
    let p = ""
    const qs = typeof window !== "undefined" ? window.location.search : ""
    if (qs) {
      const q = new URLSearchParams(qs)
      s = q.get("search") || ""
      p = q.get("petugas") || ""
    }
    if (!s && !p) {
      const saved = sessionStorage.getItem("ops_board_filters")
      if (saved) {
        try {
          const q = new URLSearchParams(saved)
          s = q.get("search") || ""
          p = q.get("petugas") || ""
        } catch {}
      }
    }
    setSearch(s)
    setPetugas(p)
  }, [])

  // Persist filters into the URL + sessionStorage so they survive navigation.
  const persistFilters = useCallback(
    (s: string, p: string) => {
      const params = new URLSearchParams()
      if (s) params.set("search", s)
      if (p) params.set("petugas", p)
      const qs = params.toString()
      if (typeof window !== "undefined") sessionStorage.setItem("ops_board_filters", qs)
      router.replace(qs ? `/ops?${qs}` : "/ops", { scroll: false })
    },
    [router],
  )

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/queue")
      const data = await res.json()
      setQueue(data.queue || [])
      setEmployees(data.employees || [])
    } catch (e) {
      console.error("Failed to fetch queue", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (employee) fetchQueue()
  }, [employee, fetchQueue])

  // Live polling + refetch when the tab regains focus.
  useEffect(() => {
    const interval = setInterval(fetchQueue, POLL_MS)
    const onFocus = () => fetchQueue()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [fetchQueue])

  if (!employee) return null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-body-md">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  const filteredQueue = queue.filter((item) => {
    if (petugas === "unassigned") {
      if (item.assigned_to) return false
    } else if (petugas && item.assigned_to !== petugas) {
      return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    const wp = item.wedding_profile
    const name = `${wp.bride_name} ${wp.groom_name}`.toLowerCase()
    const phone = (wp.whatsapp_number || "").toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  const columns = OPS_COLUMNS.map((col) => ({
    ...col,
    items: filteredQueue
      .filter((item) => item.derived_status === col.key)
      .sort((a, b) => {
        const ta = a.registration_date ? new Date(a.registration_date).getTime() : 0
        const tb = b.registration_date ? new Date(b.registration_date).getTime() : 0
        return tb - ta
      }),
  }))

  return (
    <>
      <PageTheme mode="light" />
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f2ede4; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1c1c16; border-radius: 3px; }
      `}</style>

      <div className="flex flex-col h-screen bg-background text-on-surface antialiased font-body-md">
        <OpsHeader employee={employee} activeKey="antrian" />

        <main className="pt-20 flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="px-6 md:px-10 py-6 border-b border-outline-variant bg-surface-container-low">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-headline-md text-2xl text-primary">Antrian Proyek</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {queue.length} total &bull; {filteredQueue.length} tampil &bull; memperbarui otomatis tiap 20 detik
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-[18px]">person_search</span>
                  <select
                    value={petugas}
                    onChange={(e) => { setPetugas(e.target.value); persistFilters(search, e.target.value) }}
                    className="w-full sm:w-48 bg-white border border-outline-variant pl-9 pr-4 py-2.5 text-sm focus:ring-0 focus:border-primary font-body-md outline-none"
                  >
                    <option value="">Semua Petugas</option>
                    <option value="unassigned">Tanpa Petugas</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-[18px]">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); persistFilters(e.target.value, petugas) }}
                    placeholder="Cari nama / no. WA..."
                    className="w-full sm:w-64 bg-white border border-outline-variant pl-9 pr-4 py-2.5 text-sm focus:ring-0 focus:border-primary font-body-md outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="flex h-full min-w-max items-stretch gap-4 p-6 md:p-10">
              {columns.map((col) => (
                <div key={col.key} className="w-72 sm:w-80 flex flex-col bg-surface-container-low border border-outline-variant rounded-lg shadow-sm">
                  <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-secondary">{col.icon}</span>
                      {col.label}
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant bg-white border border-outline-variant px-2 py-0.5 rounded-full">
                      {col.items.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {col.items.length === 0 ? (
                      <div className="text-center italic text-xs text-on-surface-variant/50 py-10">
                        Belum ada antrian
                      </div>
                    ) : (
                      col.items.map((item) => {
                        const wp = item.wedding_profile
                        return (
                          <div
                            key={item.id}
                            onClick={() => router.push(`/ops/antrian/${item.id}`)}
                            className="bg-white border border-outline-variant p-4 shadow-sm hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-display-lg text-base leading-tight">
                                {wp.bride_name} &amp; {wp.groom_name}
                              </p>
                              {wp.express_service && (
                                <span className="material-symbols-outlined text-amber-600 text-base shrink-0" title="Layanan Kilat 24 Jam">bolt</span>
                              )}
                            </div>
                            <div className="space-y-1 text-[11px] text-on-surface-variant font-body-md">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] opacity-60">call</span>
                                {wp.whatsapp_number || "—"}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] opacity-60">event</span>
                                {formatDate(item.registration_date || "")}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] opacity-60">workspace_premium</span>
                                {PACKAGE_LABELS[wp.package_type] || wp.package_type}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] opacity-60">person</span>
                                {item.assigned_name || "—"}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}