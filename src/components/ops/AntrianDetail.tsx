"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"
import { renderReminderMessage, getCoupleDisplayName } from "@/lib/reminderTemplates"
import {
  PACKAGE_LABELS,
  FEATURE_LABELS,
  WA_BLAST_LABELS,
  CARD_PRIORITY,
  formatCurrency,
  formatDate,
  formatDateTime,
  getWeddingDate,
  photoList,
  coverPhotos,
  getPackageCategory,
} from "@/lib/opsConstants"
import { PACKAGE_FEATURES } from "@/lib/packages"
import {
  OPS_COLUMNS,
  OPS_STATUS_LABELS,
  allowedNextStatuses,
  resolveDerivedStatus,
} from "@/lib/opsStatus"
import { canChangeStatus, unauthorizedStatusMessage } from "@/lib/opsRoles"

type QueueItem = {
  id: string
  status: string
  sla_started_at: string
  assigned_to: string | null
  assigned_name: string | null
  created_at: string
  wedding_profile: {
    id: string
    bride_name: string
    groom_name: string
    display_name?: string | null
    slug: string
    whatsapp_number: string
    estimated_wedding_date: string
    sessions: any
    estimated_guest_count: number
    package_type: string
    total_project_cost: number
    payment_status: string
    express_service?: boolean | null
  }
}

type FeatureAction = {
  id: string
  ops_queue_id: string
  wedding_profile_id: string
  feature_key: string
  status: string
  client_note: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

type Employee = {
  id: string
  name: string
}

type FeedbackSubmission = {
  id: string
  template_name: string
  area: string | null
  description: string
  image_url: string | null
  round_number: number
  status: string
  created_at: string
}

type StatusLogEntry = {
  id: string
  previous_status: string | null
  new_status: string
  changed_by_employee_id: string | null
  changed_by_name: string | null
  created_at: string
}

type QueueDetail = {
  queue: QueueItem
  wedding_profile: QueueItem["wedding_profile"]
  feature_actions: FeatureAction[]
  employees: Employee[]
  guest_stats: { total: number; with_token: number }
  feature_stats: {
    wish_count: number
    photo_count: number
    account_count: number
    address_count: number
    checked_in_count: number
    template_name: string | null
    track_name: string | null
    web_published?: boolean
  }
  wa_blast_schedule: {
    id: string
    template_type: string
    message_text: string
    scheduled_date: string
    scheduled_time: string
    status: string
    total_guests: number
    created_at: string
  } | null
  wa_blast_quota?: number
  reservation_stats?: {
    total: number
    hadir: number
    belum_respon: number
    belum_dibuka: number
  }
  vip_guests?: { id: string; name: string; phone_number: string; table_number: string; category?: string; created_at: string; added_manually?: boolean; slug?: string | null; qr_token?: string | null }[]
  derived_status: string
  status_log: StatusLogEntry[]
}

type OpsEmployee = { id: string; name: string; role: string; phone_number?: string }

const POLL_MS = 20000

function SlaTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - new Date(startedAt).getTime()
      if (diff < 0) { setElapsed("00:00:00"); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt])
  return <span>{elapsed}</span>
}

export default function AntrianDetail({ id }: { id: string }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [detail, setDetail] = useState<QueueDetail | null>(null)
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [waBlastSchedule, setWaBlastSchedule] = useState<any>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState("")
  const [showRoleGate, setShowRoleGate] = useState(false)
  const [roleGateMessage, setRoleGateMessage] = useState("")
  const [showInvCard, setShowInvCard] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [invLoading, setInvLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [showVipModal, setShowVipModal] = useState(false)
  const [vipSearch, setVipSearch] = useState("")
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrSearch, setQrSearch] = useState("")
  const [qrGuests, setQrGuests] = useState<any[]>([])
  const [qrLoading, setQrLoading] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    setEmployee(JSON.parse(raw))
  }, [router])

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops/queue/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setDetail(data)
      setWaBlastSchedule(data.wa_blast_schedule || null)
      const wpId = data.wedding_profile?.id
      if (wpId) {
        const fbRes = await fetch(`/api/feedback-submissions?wedding_profile_id=${wpId}`)
        if (fbRes.ok) {
          const fbData = await fbRes.json()
          setFeedbackSubmissions(fbData.submissions || [])
        }
      }
    } catch (e) {
      console.error("Failed to fetch detail", e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Live polling + refetch when the tab regains focus.
  useEffect(() => {
    const interval = setInterval(() => fetchAll(), POLL_MS)
    const onFocus = () => fetchAll()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [fetchAll])

  const currentWp = detail?.wedding_profile

  // QR Guest Book (Buku Tamu Digital) module: only active on DGB tiers.
  const qrActive = currentWp?.package_type
    ? (PACKAGE_FEATURES[currentWp.package_type]?.includes("qr_code_book") ?? false)
    : true

  const derived = detail && currentWp
    ? resolveDerivedStatus({
        storedStatus: detail.queue.status,
        paymentStatus: currentWp.payment_status,
        latestFeedbackStatus: feedbackSubmissions[0]?.status || null,
      })
    : null
  const allowed = derived ? allowedNextStatuses(derived) : []
  const roleCanChange = derived && employee ? canChangeStatus(employee.role, derived) : true

  const changeStatus = async (target: string) => {
    if (!employee) return
    if (derived && !canChangeStatus(employee.role, derived)) {
      setRoleGateMessage(unauthorizedStatusMessage(employee.role, derived))
      setShowRoleGate(true)
      return
    }
    setStatusSaving(true)
    setStatusError("")
    try {
      const res = await fetch(`/api/ops/queue/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee.phone_number || "",
          "x-ops-role": employee.role || "",
        },
        body: JSON.stringify({ status: target }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusError(data.error || "Gagal mengubah status")
        return
      }
      await fetchAll()
    } catch (e) {
      setStatusError("Gagal mengubah status")
    } finally {
      setStatusSaving(false)
    }
  }

  const assignConsultant = async (employeeId: string) => {
    if (employee?.role === "creative") {
      setRoleGateMessage("Perubahan petugas hanya dapat dilakukan oleh Admin atau Sales. Peran Anda saat ini: Creative.")
      setShowRoleGate(true)
      return
    }
    await fetch(`/api/ops/queue/${id}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ops-phone": employee?.phone_number || "",
        "x-ops-role": employee?.role || "",
      },
      body: JSON.stringify({ employee_id: employeeId || null }),
    })
    fetchAll()
  }

  const updatePackage = async (packageType: string) => {
    if (employee?.role === "creative") {
      setRoleGateMessage("Perubahan paket hanya dapat dilakukan oleh Admin atau Sales. Peran Anda saat ini: Creative.")
      setShowRoleGate(true)
      return
    }
    const res = await fetch(`/api/ops/queue/${id}/package`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ops-phone": employee?.phone_number || "",
        "x-ops-role": employee?.role || "",
      },
      body: JSON.stringify({ package_type: packageType }),
    })
    const data = await res.json()
    if (data.success) {
      fetchAll()
    } else {
      alert(data.error || "Gagal mengubah paket")
    }
  }

  const fetchInvitationData = async (wpId: string) => {
    setInvLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${wpId}/web-invitation`)
      if (!res.ok) return
      const data = await res.json()
      setInvitationData(data)
      setShowInvCard(true)
    } catch (e) {
      console.error("Failed to fetch invitation", e)
    } finally {
      setInvLoading(false)
    }
  }

  function downloadExcel(filename: string, sheet: string, header: string[], rows: (string | number)[][]) {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, sheet)
    XLSX.writeFile(wb, filename)
  }

  const profileSlug = currentWp?.slug || ""
  const waCustomerUrl = currentWp?.whatsapp_number
    ? `https://wa.me/${currentWp.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo ${currentWp.bride_name} & ${currentWp.groom_name}, saya dari Aksaraa CORE OPS terkait proyek undangan Anda`)}`
    : "#"
  const guestInvUrl = (g: { slug?: string | null; name?: string; qr_token?: string | null }) =>
    g.slug ? `https://${profileSlug}.wedding.aksaraa.com/?to=${g.slug}` : ""
  const guestQrUrl = (g: { slug?: string | null; qr_token?: string | null }) =>
    g.slug || g.qr_token ? `https://${profileSlug}.wedding.aksaraa.com/qr/${g.slug || g.qr_token}` : ""

  const openQrModal = async () => {
    if (!currentWp) return
    setShowQrModal(true)
    setQrSearch("")
    setQrLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${currentWp.id}/qr-guestbook`)
      if (res.ok) {
        const data = await res.json()
        setQrGuests(data.guests || [])
      }
    } finally {
      setQrLoading(false)
    }
  }

  const handleGenerateQr = async () => {
    if (!currentWp || qrGenerating) return
    setQrGenerating(true)
    try {
      await fetch(`/api/dashboard/${currentWp.id}/qr-guestbook`, { method: "POST" })
    } catch {}
    await fetchAll()
    setQrGenerating(false)
  }

  const downloadVipExcel = () => {
    const header = ["Nama Tamu", "No. WhatsApp (nomor saja, tanpa +62/0)", "Kategori", "Meja", "VIP (isi YA jika VIP)", "Sumber", "Pesan"]
    const scheduleText = detail?.wa_blast_schedule?.message_text || ""
    const coupleName = currentWp ? getCoupleDisplayName({ display_name: currentWp.display_name, bride_name: currentWp.bride_name, groom_name: currentWp.groom_name }) : ""
    const sessions = (currentWp?.sessions || []) as Array<{ venue?: string; address?: string }>
    const firstSession = sessions[0] || {}
    const weddingDate = currentWp?.estimated_wedding_date
      ? new Date(currentWp.estimated_wedding_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : ""
    const venue = [firstSession.venue, firstSession.address].filter(Boolean).join(", ") || ""
    const rows = (detail?.vip_guests || []).map((g) => [
      g.name,
      (g.phone_number || "").replace(/[^0-9]/g, ""),
      g.category || "",
      g.table_number || "",
      "YA",
      g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
      scheduleText
        ? renderReminderMessage(scheduleText, {
            NamaTamu: g.name,
            TautanUnik: g.slug ? `https://${profileSlug}.wedding.aksaraa.com/?to=${g.slug}` : "",
            QRAkses: g.slug || g.qr_token ? `https://${profileSlug}.wedding.aksaraa.com/qr/${g.slug || g.qr_token}` : "",
            NamaPengantin: coupleName,
            NomorMeja: g.table_number || "",
            Tanggal: weddingDate,
            Lokasi: venue,
          })
        : "",
    ])
    downloadExcel(`daftar-tamu-vip-${profileSlug}.xlsx`, "Tamu VIP", header, rows)
  }

  const downloadQrExcel = () => {
    const header = qrActive
      ? ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Link QR", "Link Undangan", "Sumber"]
      : ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Link Undangan", "Sumber"]
    const rows = qrGuests.map((g) =>
      qrActive
        ? [
            g.name,
            g.phone_number || "",
            g.category || "",
            g.table_number || "",
            guestQrUrl(g),
            guestInvUrl(g),
            g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
          ]
        : [
            g.name,
            g.phone_number || "",
            g.category || "",
            g.table_number || "",
            guestInvUrl(g),
            g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
          ]
    )
    downloadExcel(`daftar-qr-tamu-${profileSlug}.xlsx`, "QR Tamu", header, rows)
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { mode: "cors" })
      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(url, "_blank")
    }
  }

  if (!employee) return null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-body-md">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  if (!detail || !currentWp) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background font-body-md">
        <span className="material-symbols-outlined text-5xl opacity-30">error</span>
        <p className="italic opacity-60">Data antrian tidak ditemukan.</p>
        <Link href="/ops" className="px-6 py-3 border border-primary text-primary font-label-md text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">
          Kembali ke Antrian
        </Link>
      </div>
    )
  }

  const flowIndex = OPS_COLUMNS.findIndex((c) => c.key === derived)

  return (
    <>
      <PageTheme mode="light" />
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f2ede4; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1c1c16; }
        .animate-pulse { animation: pulse-fade 2s infinite; }
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="flex flex-col h-screen bg-background text-on-surface antialiased font-body-md">
        <OpsHeader employee={employee} activeKey="antrian" />

        <main className="pt-20 flex-1 overflow-y-auto custom-scrollbar bg-background p-4 md:p-12">
          <Link
            href="/ops"
            className="inline-flex items-center gap-2 text-sm font-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Antrian
          </Link>

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-12 border-b border-outline-variant pb-6 md:pb-8">
            <div className="min-w-0">
              <span className="font-label-md text-xs uppercase tracking-[0.2em] text-secondary mb-2 block">
                Ruang Kerja Klien
              </span>
              <h2 className="font-display-lg text-3xl md:text-5xl leading-tight break-words">{currentWp.bride_name} &amp; {currentWp.groom_name}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-body-md text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Tanggal:</span>
                  <span className="font-bold text-primary">{formatDate(getWeddingDate(currentWp))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi:</span>
                  <span className="font-bold text-primary">{currentWp.estimated_guest_count} Tamu</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60 shrink-0">Paket:</span>
                  <select
                    value={currentWp.package_type}
                    onChange={(e) => updatePackage(e.target.value)}
                    disabled={employee?.role === "creative"}
                    className="bg-white border border-outline-variant text-sm font-bold text-primary py-1 px-2 focus:ring-0 focus:border-primary font-body-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <optgroup label="Undangan Digital">
                      {Object.entries(PACKAGE_LABELS)
                        .filter(([code]) => !code.startsWith("dgb_"))
                        .map(([code, label]) => (
                          <option key={code} value={code}>{label} — {getPackageCategory(code)}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Buku Tamu Digital">
                      {Object.entries(PACKAGE_LABELS)
                        .filter(([code]) => code.startsWith("dgb_"))
                        .map(([code, label]) => (
                          <option key={code} value={code}>{label} — {getPackageCategory(code)}</option>
                        ))}
                    </optgroup>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi Biaya:</span>
                  <span className="font-bold text-primary">{formatCurrency(currentWp.total_project_cost)}</span>
                </div>
                {currentWp.express_service && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 font-label-md text-[10px] uppercase tracking-widest rounded-full">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      Layanan Kilat 24 Jam
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end w-full lg:w-auto">
              <a
                href={waCustomerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-colors w-full sm:w-auto text-center"
              >
                Hubungi Customer
              </a>
              <div className="flex flex-col flex-1 sm:flex-none min-w-0">
                <label className="font-label-md text-[10px] uppercase tracking-widest mb-1">Petugas Konsultan</label>
                <select
                  value={detail.queue.assigned_to || ""}
                  onChange={(e) => assignConsultant(e.target.value)}
                  disabled={employee?.role === "creative"}
                  className="bg-surface-container border border-outline-variant text-sm py-2 px-4 focus:ring-0 focus:border-primary font-body-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:min-w-[180px]"
                >
                  <option value="">— Pilih —</option>
                  {detail.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-secondary-container text-on-secondary-container px-6 py-4 border border-secondary flex flex-col items-center justify-center w-full sm:w-auto">
                <span className="font-label-md text-[10px] uppercase tracking-widest opacity-80">Status SLA Aktif</span>
                <span className="font-mono text-xl font-bold">
                  <SlaTimer startedAt={detail.queue.sla_started_at} />
                </span>
              </div>
            </div>
          </div>

          {/* Status Pipeline Panel */}
          <section className="mb-8 md:mb-16 border border-primary p-4 md:p-8 bg-surface-container-low relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">account_tree</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="flex-1">
                <h3 className="font-headline-md text-xl mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined">account_tree</span>
                  Status Proyek
                </h3>
                <div className="flex flex-wrap gap-2">
                  {OPS_COLUMNS.map((col, i) => {
                    const state = derived && flowIndex !== -1
                      ? i < flowIndex ? "done" : i === flowIndex ? "active" : "todo"
                      : "todo"
                    return (
                      <span
                        key={col.key}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest ${
                          state === "done"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : state === "active"
                              ? "border-secondary bg-secondary text-on-secondary"
                              : "border-outline-variant opacity-50"
                        }`}
                      >
                        {state === "done" && <span className="material-symbols-outlined text-[12px]">check</span>}
                        {col.label}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs opacity-50 font-body-md italic mt-4">
                  Kolom posisi otomatis mengikuti data pembayaran dan feedback. Koreksi pembayaran (Belum/Sudah bayar) bisa
                  dilakukan kapan saja; alur feedback berjalan berurutan.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:min-w-[260px] sm:w-auto">
                <label className="font-label-md text-xs uppercase tracking-widest">Ubah Status</label>
                <select
                  value=""
                  onChange={(e) => e.target.value && changeStatus(e.target.value)}
                  disabled={statusSaving}
                  className="bg-white border border-outline-variant text-sm py-3 px-3 focus:ring-0 focus:border-primary font-body-md cursor-pointer disabled:opacity-50 w-full"
                >
                  <option value="">— Pilih status —</option>
                  {OPS_COLUMNS.map((col) => {
                    const valid = allowed.includes(col.key)
                    return (
                      <option key={col.key} value={col.key} disabled={!valid}>
                        {col.label}{!valid ? " (tidak valid)" : ""}
                      </option>
                    )
                  })}
                </select>
                {!roleCanChange && derived && (
                  <p className="text-xs text-amber-600 max-w-[260px] whitespace-normal break-words leading-relaxed">{unauthorizedStatusMessage(employee?.role || "", derived)}</p>
                )}
                {statusSaving && <p className="text-xs text-secondary">Menyimpan...</p>}
                {statusError && <p className="text-xs text-red-600">{statusError}</p>}
              </div>
            </div>
          </section>

          {/* Feature Cards */}
          <div className="mb-12 flex justify-between items-center">
            <h3 className="font-headline-md text-2xl">Fitur Pernikahan</h3>
            <div className="flex gap-2">
              <button className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors opacity-40">
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-16">
            {detail.feature_actions.length === 0 && (
              <div className="col-span-full text-center opacity-30 italic font-body-md text-sm py-12">
                Tidak ada fitur untuk paket ini
              </div>
            )}
            {[...detail.feature_actions]
              .sort((a, b) => {
                const pa = CARD_PRIORITY[a.feature_key] ?? 99
                const pb = CARD_PRIORITY[b.feature_key] ?? 99
                return pa - pb
              })
              .map((fa) => {
                return (
                  <div
                    key={fa.id}
                    className="bg-white border border-outline-variant p-4 md:p-6 flex flex-col hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-display-lg text-base leading-tight">
                        {FEATURE_LABELS[fa.feature_key] || fa.feature_key}
                      </h4>
                    </div>

                    {(() => {
                      const subtitle = fa.feature_key === "premium_web"
                        ? [detail.feature_stats.template_name, detail.feature_stats.track_name].filter(Boolean).join(" / ") || null
                        : fa.feature_key === "unique_link_generator"
                          ? qrActive
                            ? `${detail.guest_stats.with_token} QR Aktif`
                            : null
                          : fa.feature_key === "qr_code_book"
                            ? `${detail.feature_stats.checked_in_count} Tamu Sudah Hadir`
                            : fa.feature_key === "wish_wall"
                              ? `${detail.feature_stats.wish_count} Wish Sudah Masuk`
                              : fa.feature_key === "galeri_foto_tamu"
                                ? `${detail.feature_stats.photo_count} Foto Terunggah`
                                : fa.feature_key === "kolom_direct_transfer"
                                  ? `${detail.feature_stats.account_count} Rek, ${detail.feature_stats.address_count} Alm`
                                  : fa.feature_key === "reservation_automation" && detail.reservation_stats
                                    ? `${detail.reservation_stats.hadir} Hadir • ${detail.reservation_stats.belum_respon} Belum Respon • ${detail.reservation_stats.belum_dibuka} Belum Dibuka`
                                    : fa.feature_key === "wa_blast" && waBlastSchedule
                                      ? `${WA_BLAST_LABELS[waBlastSchedule.template_type] || waBlastSchedule.template_type} • ${formatDate(waBlastSchedule.scheduled_date)} ${waBlastSchedule.scheduled_time?.slice(0, 5) || ""}`
                                      : null
                      return subtitle ? (
                        <div className="mb-4 py-2 px-3 bg-secondary-container/60 border border-secondary/15">
                          <p className="font-body-md text-secondary font-semibold text-xs uppercase tracking-wider">
                            {subtitle}
                          </p>
                        </div>
                      ) : null
                    })()}

                    {(fa.feature_key === "premium_web" || fa.feature_key === "wa_blast") && (() => {
                      const confirmed = fa.feature_key === "premium_web"
                        ? detail.feature_stats.web_published === true
                        : !!waBlastSchedule
                      const label = fa.feature_key === "premium_web"
                        ? (confirmed ? "Undangan Terkonfirmasi dari Editor" : "Undangan Belum Dikonfirmasi dari Editor")
                        : (confirmed ? "Jadwal Reminder Sudah Disimpan" : "Jadwal Reminder Belum Disimpan")
                      return (
                        <div className={`mb-4 inline-flex items-center gap-2 px-2.5 py-1 border text-[9px] font-bold uppercase tracking-widest ${
                          confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${confirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {label}
                        </div>
                      )
                    })()}

                    {fa.feature_key === "unique_link_generator" && (
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={openQrModal}
                          className="px-4 py-2.5 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_2</span>
                          Lihat Daftar Tamu &amp; Link
                        </button>
                        {qrActive ? (
                          <>
                            <button
                              onClick={handleGenerateQr}
                              disabled={qrGenerating}
                              className="px-4 py-2.5 border border-outline-variant text-[9px] font-bold uppercase tracking-widest hover:border-primary transition-all disabled:opacity-50"
                            >
                              {qrGenerating ? "Membuat..." : "Generate QR"}
                            </button>
                            <span className="text-[10px] text-on-surface-variant">{detail.guest_stats.with_token}/{detail.guest_stats.total} QR Aktif</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/70 italic">QR Tamu tidak tersedia untuk paket ini</span>
                        )}
                      </div>
                    )}

                    {fa.feature_key === "wa_blast" && waBlastSchedule?.message_text && (
                      <div className="mb-4 bg-surface rounded-lg p-4 border border-outline-variant/40 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/20">
                          <span className="font-label-md text-[9px] uppercase tracking-widest text-secondary font-semibold">{WA_BLAST_LABELS[waBlastSchedule.template_type] || waBlastSchedule.template_type}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant/50" />
                          <span className="font-label-md text-[8px] uppercase tracking-wider text-on-surface-variant/60">{waBlastSchedule.total_guests} Tamu</span>
                          <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${waBlastSchedule.status === "scheduled" ? "bg-amber-100 text-amber-800" : waBlastSchedule.status === "sent" ? "bg-emerald-100 text-emerald-800" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {waBlastSchedule.status === "scheduled" ? "Terjadwal" : waBlastSchedule.status === "sent" ? "Terkirim" : waBlastSchedule.status}
                          </span>
                        </div>
                        <p className="font-body-md text-sm text-on-surface/90 leading-relaxed whitespace-pre-wrap">
                          {waBlastSchedule.message_text}
                        </p>
                      </div>
                    )}

                    {fa.feature_key === "wa_blast" && (detail.wa_blast_quota || 0) > 0 && (
                      <div className="mb-4 bg-surface rounded-lg p-4 border border-outline-variant/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-secondary font-semibold">Kuota Pengiriman</p>
                            <p className="text-lg font-bold text-primary mt-0.5">{detail.wa_blast_quota}</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              {Math.min((detail.vip_guests || []).length, detail.wa_blast_quota || 0)} dari {(detail.vip_guests || []).length} tamu VIP termasuk kuota
                              {(detail.vip_guests || []).length > (detail.wa_blast_quota || 0) && (
                                <span className="text-red-600"> &bull; {(detail.vip_guests || []).length - (detail.wa_blast_quota || 0)} dikecualikan</span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => setShowVipModal(true)}
                              className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
                            >
                              Lihat Daftar Tamu VIP
                            </button>
                            <button
                              onClick={downloadVipExcel}
                              disabled={(detail.vip_guests || []).length === 0}
                              className="px-4 py-2 border border-outline text-on-surface font-label-md text-[10px] uppercase tracking-widest hover:bg-surface-container transition-colors disabled:opacity-40"
                            >
                              Download Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {fa.client_note && (
                      <p className="text-xs italic font-body-md opacity-60 mb-4 leading-relaxed">
                        &ldquo;{fa.client_note}&rdquo;
                      </p>
                    )}

                    {fa.image_url && (
                      <div className="mb-4 border border-outline-variant overflow-hidden bg-surface-container">
                        <img
                          src={fa.image_url}
                          alt={`Gambar ${FEATURE_LABELS[fa.feature_key]}`}
                          className="w-full h-28 object-cover"
                        />
                      </div>
                    )}

                    {fa.feature_key === "premium_web" && feedbackSubmissions.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <h5 className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">
                          Feedback Terbaru
                        </h5>
                        {feedbackSubmissions.slice(0, 2).map((fb) => {
                          const images = (() => {
                            if (!fb.image_url) return []
                            try { const p = JSON.parse(fb.image_url); return Array.isArray(p) ? p : [fb.image_url] }
                            catch { return [fb.image_url] }
                          })()
                          return (
                            <div key={fb.id} className="bg-surface-container-low p-2.5 border-l-2 border-secondary">
                              <div className="flex justify-between items-start gap-2 mb-0.5">
                                <p className="font-body-md text-[10px] font-semibold">{fb.template_name || "Draf"} <span className="font-label-md text-[8px] text-on-surface-variant/60 font-normal">R{fb.round_number}</span></p>
                                <span className={`text-[7px] font-bold uppercase px-1 py-0.5 shrink-0 ${fb.status === "resolved" ? "bg-emerald-100 text-emerald-800" : fb.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                  {fb.status === "resolved" ? "Selesai" : fb.status === "in_progress" ? "Proses" : "Tunggu"}
                                </span>
                              </div>
                              <p className="font-body-md text-[10px] italic text-on-surface-variant/80 leading-relaxed whitespace-pre-wrap break-words">
                                &ldquo;{fb.description}&rdquo;
                              </p>
                              {images.length > 0 && (
                                <div className="flex gap-1 mt-1.5">
                                  {images.map((imgUrl, imgIdx) => (
                                    <a
                                      key={imgIdx}
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-8 h-8 border border-outline-variant overflow-hidden rounded block hover:opacity-80 transition-opacity"
                                    >
                                      <img src={imgUrl} alt={`img ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {feedbackSubmissions.length > 2 && (
                          <p className="font-label-md text-[8px] text-on-surface-variant/50 text-center">+{feedbackSubmissions.length - 2} lainnya</p>
                        )}
                      </div>
                    )}

                    {fa.feature_key === "premium_web" && (
                      <button
                        onClick={() => fetchInvitationData(fa.wedding_profile_id)}
                        disabled={invLoading}
                        className="w-full mb-4 py-3 border border-secondary text-secondary text-[9px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-on-secondary transition-all disabled:opacity-40"
                      >
                        {invLoading ? "Memuat..." : "Detail Undangan Digital"}
                      </button>
                    )}

                  </div>
                )
              })}
          </div>

          {/* Status Log */}
          <section className="mb-16">
            <h3 className="font-headline-md text-2xl mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">history</span>
              Riwayat Status
            </h3>
            <div className="border border-outline-variant bg-white overflow-x-auto">
              {detail.status_log.length === 0 ? (
                <p className="p-6 text-sm opacity-50 italic text-center">Belum ada perubahan status.</p>
              ) : (
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-left font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Perubahan Status</th>
                      <th className="px-4 py-3">Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {detail.status_log.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{formatDateTime(log.created_at)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {log.previous_status ? OPS_STATUS_LABELS[log.previous_status as keyof typeof OPS_STATUS_LABELS] ?? log.previous_status : "—"}
                          {" → "}
                          {OPS_STATUS_LABELS[log.new_status as keyof typeof OPS_STATUS_LABELS] ?? log.new_status}
                        </td>
                        <td className="px-4 py-3">{log.changed_by_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Workspace Footer */}
          <footer className="w-full py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-outline-variant">
            <div className="flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined animate-pulse text-secondary">sync</span>
              <p className="font-label-md text-xs uppercase tracking-widest">
                Sinkronisasi real-time database pengantin Aksaraa Studio
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* INVITATION CARD MODAL */}
      {showInvCard && invitationData && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant">
              <h2 className="font-display-lg text-lg">Undangan Digital — {invitationData.profile?.bride_name || ""} & {invitationData.profile?.groom_name || ""}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!cardRef.current) return
                    html2canvas(cardRef.current, { scale: 2, useCORS: true }).then((canvas) => {
                      const link = document.createElement("a")
                      link.download = `undangan-${invitationData.profile?.slug || "card"}.png`
                      link.href = canvas.toDataURL("image/png")
                      link.click()
                    })
                  }}
                  className="px-4 py-2 bg-secondary text-on-secondary text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
                <button onClick={() => { setShowInvCard(false); setInvitationData(null) }} className="p-2 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div ref={cardRef} className="max-w-md mx-auto bg-white border border-outline-variant shadow-lg overflow-hidden">
                {invitationData.profile?.couple_illustration_url && (
                  <div className="relative h-64 sm:h-80 bg-surface-dim overflow-hidden">
                    <img
                      src={invitationData.profile.couple_illustration_url}
                      alt="Cover"
                      className={`w-full h-full object-cover ${invitationData.profile.grayscale ? "grayscale" : ""}`}
                      crossOrigin="anonymous"
                    />
                    <button
                      onClick={() => downloadImage(invitationData.profile.couple_illustration_url!, `cover-${invitationData.profile.slug || "photo"}.jpg`)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 border border-outline-variant flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
                      title="Download"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="font-display-lg text-3xl sm:text-4xl">{invitationData.profile.display_name || `${invitationData.profile.bride_name} & ${invitationData.profile.groom_name}`}</h3>
                      <p className="font-body-md text-sm opacity-80 mt-1">We Are Getting Married</p>
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  <div>
                    <p className="font-display-lg text-2xl text-center text-primary">{invitationData.profile.display_name || `${invitationData.profile.bride_name} & ${invitationData.profile.groom_name}`}</p>
                    {invitationData.profile.couple_initials && (
                      <p className="font-display-lg text-sm text-center text-secondary mt-1">{invitationData.profile.couple_initials}</p>
                    )}

                    {(() => {
                      const groomPhotos = photoList(invitationData.profile.groom_photo_url)
                      const bridePhotos = photoList(invitationData.profile.bride_photo_url)
                      if (groomPhotos.length === 0 && bridePhotos.length === 0) return null
                      const pslug = invitationData.profile?.slug || "photo"
                      return (
                        <div className="mt-4 space-y-3">
                          {groomPhotos.length > 0 && (
                            <div className="text-center">
                              <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Foto Pria{groomPhotos.length > 1 ? " (Slideshow)" : ""}</p>
                              <div className="flex justify-center gap-3">
                                {groomPhotos.map((url, i) => (
                                  <div key={i} className="relative group">
                                    <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden bg-surface-dim">
                                      <img src={url} alt={`Groom ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                    <button
                                      onClick={() => downloadImage(url, `groom-${pslug}-${i + 1}.jpg`)}
                                      className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                      title="Download"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">download</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {bridePhotos.length > 0 && (
                            <div className="text-center">
                              <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Foto Wanita{bridePhotos.length > 1 ? " (Slideshow)" : ""}</p>
                              <div className="flex justify-center gap-3">
                                {bridePhotos.map((url, i) => (
                                  <div key={i} className="relative group">
                                    <div className="w-16 h-16 rounded-full border-2 border-secondary overflow-hidden bg-surface-dim">
                                      <img src={url} alt={`Bride ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                    <button
                                      onClick={() => downloadImage(url, `bride-${pslug}-${i + 1}.jpg`)}
                                      className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                      title="Download"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">download</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                      <div>
                        <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Pria</p>
                        {invitationData.profile.groom_name && (
                          <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.groom_name}</p>
                        )}
                        {invitationData.profile.groom_full_name && invitationData.profile.groom_full_name !== invitationData.profile.groom_name && (
                          <p className="font-body-md text-xs mt-0.5">{invitationData.profile.groom_full_name}</p>
                        )}
                        {invitationData.profile.groom_parents && (
                          <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putra dari {invitationData.profile.groom_parents}</p>
                        )}
                        {invitationData.profile.groom_instagram && (
                          <p className="font-body-md text-[10px] text-secondary mt-0.5">@{invitationData.profile.groom_instagram}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Wanita</p>
                        {invitationData.profile.bride_name && (
                          <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.bride_name}</p>
                        )}
                        {invitationData.profile.bride_full_name && invitationData.profile.bride_full_name !== invitationData.profile.bride_name && (
                          <p className="font-body-md text-xs mt-0.5">{invitationData.profile.bride_full_name}</p>
                        )}
                        {invitationData.profile.bride_parents && (
                          <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putri dari {invitationData.profile.bride_parents}</p>
                        )}
                        {invitationData.profile.bride_instagram && (
                          <p className="font-body-md text-[10px] text-secondary mt-0.5">@{invitationData.profile.bride_instagram}</p>
                        )}
                      </div>
                    </div>
                    {Array.isArray(invitationData.profile.inviting_families) && invitationData.profile.inviting_families.filter(Boolean).length > 0 && (
                      <div className="mt-4 text-center border-t border-outline-variant/40 pt-4">
                        <p className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-2">Turut Mengundang</p>
                        {invitationData.profile.inviting_families.filter(Boolean).map((f: string, i: number) => (
                          <p key={i} className="font-body-md text-[10px] italic text-on-surface-variant">Keluarga Besar {f}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {coverPhotos(invitationData.profile.cover_photos).length > 0 && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Foto Sampul</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {coverPhotos(invitationData.profile.cover_photos).map((url, i) => (
                            <div key={i} className="relative group aspect-video bg-surface-dim border border-outline-variant overflow-hidden">
                              <img src={url} alt={`Cover ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button onClick={() => downloadImage(url, `cover-${invitationData.profile.slug || "photo"}-${i + 1}.jpg`)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Download">
                                <span className="material-symbols-outlined text-[11px]">download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {invitationData.profile.video_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-2">Video</h4>
                        <a href={invitationData.profile.video_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-xs text-primary underline break-all">{invitationData.profile.video_url}</a>
                      </div>
                    </>
                  )}

                  <div className="border-t border-outline-variant/40" />

                  <div>
                    <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Acara Pernikahan</h4>
                    {getWeddingDate(invitationData.profile) && (
                      <p className="font-display-lg text-lg text-primary">{formatDate(getWeddingDate(invitationData.profile))}</p>
                    )}
                    {Array.isArray(invitationData.profile.sessions) && invitationData.profile.sessions.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {invitationData.profile.sessions.map((s: any, i: number) => (
                          <div key={i} className="border-l-2 border-secondary pl-4">
                            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">{s.name || `Sesi ${i + 1}`}</p>
                            <p className="font-body-md text-sm mt-0.5">{s.date}{s.time ? ` | ${s.time}` : ""}{s.timezone ? ` ${s.timezone}` : ""}</p>
                            {s.venue && <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{s.venue}</p>}
                            {s.address && <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{s.address}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Batas Maksimum Pax:</span>
                      <span className="font-body-md text-sm font-semibold text-on-surface">{invitationData?.profile?.rsvp_max_pax ?? 2}</span>
                    </div>
                  </div>

                  {invitationData.profile.quote_text && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="text-center italic">
                        <p className="font-body-md text-sm leading-relaxed">&ldquo;{invitationData.profile.quote_text}&rdquo;</p>
                        {invitationData.profile.quote_source && (
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">&mdash; {invitationData.profile.quote_source}</p>
                        )}
                      </div>
                    </>
                  )}

                  {Array.isArray(invitationData.profile.stories) && invitationData.profile.stories.length > 0 && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Our Story</h4>
                        <div className="space-y-4">
                          {invitationData.profile.stories.map((st: any, i: number) => (
                            <div key={i} className="flex gap-4">
                              {st.image_url && (
                                <div className="relative group w-16 h-16 shrink-0 bg-surface-dim border border-outline-variant overflow-hidden">
                                  <img src={st.image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                  <button
                                    onClick={() => downloadImage(st.image_url, `story-${invitationData.profile.slug || "photo"}-${i}.jpg`)}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Download"
                                  >
                                    <span className="material-symbols-outlined text-[11px]">download</span>
                                  </button>
                                </div>
                              )}
                              <div>
                                {st.year && <p className="font-label-md text-[9px] text-secondary uppercase tracking-widest">{st.year}</p>}
                                {st.title && <p className="font-body-md text-sm font-semibold">{st.title}</p>}
                                {st.description && <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{st.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {Array.isArray(invitationData.profile.gallery_photos) && invitationData.profile.gallery_photos.length > 0 && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Galeri</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {invitationData.profile.gallery_photos.map((url: string, i: number) => (
                            <div key={i} className="relative group aspect-square bg-surface-dim border border-outline-variant overflow-hidden">
                              <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button
                                onClick={() => downloadImage(url, `gallery-${invitationData.profile.slug || "photo"}-${i + 1}.jpg`)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                              >
                                <span className="material-symbols-outlined text-[11px]">download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {invitationData.template && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Template</h4>
                        <div className="flex items-center gap-4">
                          {invitationData.template.preview_image_url && (
                            <div className="relative group w-20 h-20 shrink-0 bg-surface-dim border border-outline-variant overflow-hidden">
                              <img src={invitationData.template.preview_image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button
                                onClick={() => downloadImage(invitationData.template.preview_image_url, `template-${invitationData.template.code || "preview"}.jpg`)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                              >
                                <span className="material-symbols-outlined text-[11px]">download</span>
                              </button>
                            </div>
                          )}
                          <div>
                            <p className="font-body-md text-sm font-semibold">{invitationData.template.name}</p>
                            {invitationData.template.description && (
                              <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{invitationData.template.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {invitationData.track && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">music_note</span>
                        <div>
                          <p className="font-body-md text-sm font-semibold">{invitationData.track.title}</p>
                          {invitationData.track.artist && <p className="font-body-md text-[10px] text-on-surface-variant">{invitationData.track.artist}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {((Array.isArray(invitationData.gift_accounts) && invitationData.gift_accounts.length > 0) || invitationData.gift_address) && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Transfer & Kado</h4>
                        {Array.isArray(invitationData.gift_accounts) && invitationData.gift_accounts.length > 0 && (
                          <div className="space-y-2">
                            {invitationData.gift_accounts.map((a: any, i: number) => (
                              <div key={i} className="flex justify-between border-b border-outline-variant/20 pb-2 text-sm">
                                <span className="font-body-md">{a.provider_name}</span>
                                <span className="font-body-md font-semibold">{a.account_number} — {a.account_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {invitationData.gift_address && (
                          <div className="mt-3 bg-surface-container-low p-3 rounded">
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Alamat Pengiriman Kado</p>
                            {invitationData.gift_address_name && <p className="font-body-md text-sm font-semibold">a.n. {invitationData.gift_address_name}</p>}
                            <p className="font-body-md text-xs text-on-surface-variant whitespace-pre-line">{invitationData.gift_address}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {invitationData.profile?.invitation_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="bg-surface-container-low p-4 text-center">
                        <p className="font-label-md text-[8px] uppercase tracking-widest text-on-surface-variant mb-1">Link Undangan</p>
                        <a href={invitationData.profile.invitation_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-primary underline break-all">
                          {invitationData.profile.invitation_url}
                        </a>
                      </div>
                    </>
                  )}

                  {invitationData.profile?.active_wp_post_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="bg-surface-container-low p-4 text-center">
                        <p className="font-label-md text-[8px] uppercase tracking-widest text-on-surface-variant mb-1">Link Post WordPress</p>
                        <a href={invitationData.profile.active_wp_post_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-primary underline break-all">
                          {invitationData.profile.active_wp_post_url}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVipModal && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVipModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/50 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display-lg text-lg font-medium text-primary">Daftar Tamu VIP</h3>
                <p className="text-[11px] text-on-surface-variant">{(detail?.vip_guests || []).length} tamu VIP &bull; Kuota {detail?.wa_blast_quota || 0}</p>
              </div>
              <button onClick={() => setShowVipModal(false)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex gap-3">
              <input
                type="text"
                value={vipSearch}
                onChange={(e) => setVipSearch(e.target.value)}
                placeholder="Cari nama / no. HP / meja..."
                className="flex-1 bg-surface rounded-lg border border-outline-variant/50 px-4 py-2.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
              />
              <button onClick={downloadVipExcel} className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                Download Excel
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-outline-variant/15">
              {(detail?.vip_guests || [])
                .filter((g) => !vipSearch || g.name.toLowerCase().includes(vipSearch.toLowerCase()) || (g.phone_number || "").includes(vipSearch) || (g.table_number || "").toLowerCase().includes(vipSearch.toLowerCase()))
                .map((g, i) => {
                  const isExcluded = (detail?.wa_blast_quota || 0) > 0 && i >= (detail?.wa_blast_quota || 0)
                  return (
                    <div key={g.id} className={`px-6 py-3 flex items-center gap-3 ${isExcluded ? "bg-red-50/60" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                          {g.name}
                          <span className="material-symbols-outlined text-[#b8860b] text-[14px]">star</span>
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70">
                          {g.phone_number || "—"}
                          {g.category ? ` • ${g.category}` : ""}
                          {g.table_number ? ` • ${g.table_number}` : ""}
                        </p>
                      </div>
                      {isExcluded ? (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">Dikecualikan</span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Termasuk</span>
                      )}
                    </div>
                  )
                })}
              {(detail?.vip_guests || []).length === 0 && (
                <p className="py-12 text-center text-sm text-on-surface-variant italic">Belum ada tamu VIP.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowQrModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl border border-outline-variant/50 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display-lg text-lg font-medium text-primary">Daftar Tamu &amp; Link QR</h3>
                <p className="text-[11px] text-on-surface-variant">{qrGuests.length} tamu</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex gap-3">
              <input
                type="text"
                value={qrSearch}
                onChange={(e) => setQrSearch(e.target.value)}
                placeholder="Cari nama / meja..."
                className="flex-1 bg-surface rounded-lg border border-outline-variant/50 px-4 py-2.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
              />
              <button onClick={downloadQrExcel} className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                Download Excel
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-outline-variant/15">
              {qrLoading ? (
                <p className="py-12 text-center text-sm text-on-surface-variant italic">Memuat...</p>
              ) : (
                qrGuests
                  .filter((g) => !qrSearch || g.name?.toLowerCase().includes(qrSearch.toLowerCase()) || (g.table_number || "").toLowerCase().includes(qrSearch.toLowerCase()))
                  .map((g) => (
                    <div key={g.id} className="px-6 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{g.name}</p>
                          <p className="text-[11px] text-on-surface-variant/70">
                            {g.phone_number || "—"}
                            {g.category ? ` • ${g.category}` : ""}
                            {g.table_number ? ` • ${g.table_number}` : ""}
                          </p>
                        </div>
                        {qrActive && (
                          <span className={`shrink-0 text-[10px] font-label-md uppercase tracking-wider px-2 py-0.5 rounded-full ${g.qr_token ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-outline-variant/30 text-on-surface-variant border border-outline-variant"}`}>
                            {g.qr_token ? "QR Aktif" : "Belum QR"}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                        {qrActive && (
                          <a href={guestQrUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-secondary underline break-all">{guestQrUrl(g) || "—"}</a>
                        )}
                        <a href={guestInvUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline break-all">{guestInvUrl(g) || "—"}</a>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {showRoleGate && (
        <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowRoleGate(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">block</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Akses Terbatas</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{roleGateMessage}</p>
            <button onClick={() => setShowRoleGate(false)} className="w-full py-3 bg-primary text-white rounded-lg font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">Mengerti</button>
          </div>
        </div>
      )}
    </>
  )
}
