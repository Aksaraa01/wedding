"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { eventLabels, isKidsEvent } from "@/lib/eventType"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import { PACKAGE_LABELS, formatDate, getPackageCategory } from "@/lib/opsConstants"
import { OPS_COLUMNS } from "@/lib/opsStatus"
import { useVisiblePoll } from "@/lib/useVisiblePoll"
import { resolveCoupleName } from "@/lib/coupleName"

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
    event_type?: string | null
    bride_full_name?: string | null
    groom_full_name?: string | null
    whatsapp_number: string
    package_type: string
    express_service?: boolean | null
  }
}

type Employee = { id: string; name: string }
type OpsEmployee = { id: string; name: string; role: string; phone_number?: string }

const POLL_MS = 20000

export default function OpsBoardPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [petugas, setPetugas] = useState("")
  const [mobileColumn, setMobileColumn] = useState<string>("belum_bayar")

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
      const res = await fetch("/api/ops/queue", {
        headers: {
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
      })
      const data = await res.json()
      setQueue(data.queue || [])
      setEmployees(data.employees || [])
    } catch (e) {
      console.error("Failed to fetch queue", e)
    } finally {
      setLoading(false)
    }
  }, [employee])

  useEffect(() => {
    if (employee) fetchQueue()
  }, [employee, fetchQueue])

  // Live polling, paused while the tab is hidden (a background ops tab must
  // not generate traffic or Supabase log volume). Refetch-on-focus behavior
  // is preserved via useVisiblePoll's visibility refetch.
  useVisiblePoll(fetchQueue, POLL_MS, !!employee)
  useEffect(() => {
    const onFocus = () => {
      if (!document.hidden) fetchQueue()
    }
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
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
    const name = `${wp.groom_name} ${wp.bride_name}`.toLowerCase()
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
          <div className="px-4 md:px-10 py-4 md:py-6 border-b border-outline-variant bg-surface-container-low">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h2 className="font-headline-md text-xl md:text-2xl text-primary leading-tight">Antrian Proyek</h2>
                  <p className="text-[11px] md:text-xs text-on-surface-variant mt-1">
                    {queue.length} total &bull; {filteredQueue.length} tampil &bull; auto 20s
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-[18px]">person_search</span>
                    <select
                      value={petugas}
                      onChange={(e) => { setPetugas(e.target.value); persistFilters(search, e.target.value) }}
                      className="w-full sm:w-44 bg-white border border-outline-variant pl-9 pr-3 py-2.5 text-sm focus:ring-0 focus:border-primary font-body-md outline-none"
                    >
                      <option value="">Semua Petugas</option>
                      <option value="unassigned">Tanpa Petugas</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1 sm:flex-none">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-[18px]">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); persistFilters(e.target.value, petugas) }}
                      placeholder="Cari nama / WA..."
                      className="w-full sm:w-56 bg-white border border-outline-variant pl-9 pr-3 py-2.5 text-sm focus:ring-0 focus:border-primary font-body-md outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:hidden">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
                  {columns.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => setMobileColumn(col.key)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${mobileColumn === col.key ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant"}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{col.icon}</span>
                      {col.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${mobileColumn === col.key ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{col.items.length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Board — desktop horizontal scroll */}
          <div className="hidden lg:flex flex-1 overflow-x-auto custom-scrollbar">
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
                                {resolveCoupleName(wp)}
                              </p>
                              {wp.express_service && (
                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0" title="Layanan Kilat 24 Jam">Kilat</span>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="material-symbols-outlined text-[13px] opacity-60">workspace_premium</span>
                                <span>{PACKAGE_LABELS[wp.package_type] || wp.package_type}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border shrink-0 ${wp.package_type.startsWith("dgb_") ? "bg-surface-container-low text-secondary border-secondary/20" : "bg-surface-container-low text-primary border-primary/20"}`}>
                                  {getPackageCategory(wp.package_type)}
                                </span>
                              </div>
                              {((wp as any).wa_blast_tier > 0 || (wp as any).galeri_addon) && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="material-symbols-outlined text-[13px] opacity-60">add_circle</span>
                                  {(wp as any).wa_blast_tier > 0 && (
                                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-300 text-blue-800 px-1.5 py-0.5 rounded-full">
                                      WA +{(wp as any).wa_blast_tier}
                                    </span>
                                  )}
                                  {(wp as any).galeri_addon && (
                                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-purple-50 border border-purple-300 text-purple-800 px-1.5 py-0.5 rounded-full">
                                      {(wp as any).galeri_tier || "Galeri"}
                                    </span>
                                  )}
                                </div>
                              )}
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
          {/* Board — mobile single column */}
          <div className="lg:hidden flex-1 overflow-y-auto">
            {(() => {
              const activeCol = columns.find((c) => c.key === mobileColumn) || columns[0]
              if (!activeCol) return null
              return (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[16px] text-secondary">{activeCol.icon}</span>
                      {activeCol.label}
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant bg-white border border-outline-variant px-2 py-0.5 rounded-full">{activeCol.items.length}</span>
                  </div>
                  {activeCol.items.length === 0 ? (
                    <div className="text-center italic text-xs text-on-surface-variant/50 py-12 bg-surface-container-low border border-dashed border-outline-variant rounded-lg">
                      Belum ada antrian di tahap ini
                    </div>
                  ) : (
                    activeCol.items.map((item) => {
                      const wp = item.wedding_profile
                      return (
                        <div
                          key={item.id}
                          onClick={() => router.push(`/ops/antrian/${item.id}`)}
                          className="bg-white border border-outline-variant p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-display-lg text-[15px] leading-tight">
                              {wp.groom_name}
                              {wp.bride_name ? <> &amp; {wp.bride_name}</> : null}
                              {isKidsEvent(wp.event_type) && (
                                <span className="ml-1.5 inline-flex items-center rounded-full border border-[#c9a45c]/50 bg-[#f7f0e2] px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase tracking-wider text-[#8a6d2f]">
                                  {eventLabels(wp.event_type).eventNoun}
                                </span>
                              )}
                            </p>
                              {wp.express_service && (
                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">Kilat</span>
                              )}
                          </div>
                          <div className="space-y-1 text-[11px] text-on-surface-variant">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] opacity-60">call</span>
                              <span className="truncate">{wp.whatsapp_number || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] opacity-60">event</span>
                              {formatDate(item.registration_date || "")}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="material-symbols-outlined text-[13px] opacity-60">workspace_premium</span>
                              <span>{PACKAGE_LABELS[wp.package_type] || wp.package_type}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border shrink-0 ${wp.package_type.startsWith("dgb_") ? "bg-surface-container-low text-secondary border-secondary/20" : "bg-surface-container-low text-primary border-primary/20"}`}>
                                {getPackageCategory(wp.package_type)}
                              </span>
                            </div>
                            {((wp as any).wa_blast_tier > 0 || (wp as any).galeri_addon) && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="material-symbols-outlined text-[13px] opacity-60">add_circle</span>
                                {(wp as any).wa_blast_tier > 0 && (
                                  <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-300 text-blue-800 px-1.5 py-0.5 rounded-full">
                                    WA +{(wp as any).wa_blast_tier}
                                  </span>
                                )}
                                {(wp as any).galeri_addon && (
                                  <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider bg-purple-50 border border-purple-300 text-purple-800 px-1.5 py-0.5 rounded-full">
                                    {(wp as any).galeri_tier || "Galeri"}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] opacity-60">person</span>
                              <span className="truncate">{item.assigned_name || "—"}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )
            })()}
          </div>
        </main>
      </div>
    </>
  )
}