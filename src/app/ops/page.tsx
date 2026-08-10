"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"

const PACKAGE_LABELS: Record<string, string> = {
  essential: "Essential",
  signature: "Signature",
  prestige: "Prestige",
}

const FEATURE_LABELS: Record<string, string> = {
  premium_web: "Undangan Digital",
  wish_wall: "Wish Wall",
  reservation_automation: "Reservasi Otomatis",
  kolom_direct_transfer: "Amplop Digital & Alamat Kado",
  galeri_foto_tamu: "Galeri Kenangan Tamu",
  qr_code_book: "Buku Tamu QR",
  unique_link_generator: "QR Code Tamu",
  undangan_fisik: "Undangan Fisik",
  wa_blast: "Reminder Otomatis",
}

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PARTIAL_DP: "Parsial (DP)",
  FULLY_PAID: "Lunas",
}

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
  vip_guests?: { id: string; name: string; phone_number: string; table_number: string; category?: string; created_at: string }[]
}

const WA_BLAST_LABELS: Record<string, string> = {
  formal: "Formal & Resmi",
  hangat: "Hangat & Personal",
  singkat: "Singkat & Padat",
  islami: "Islami",
  mewah: "Mewah & Eksklusif",
}

function formatCurrency(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "TBD"
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function getWeddingDate(profile: { estimated_wedding_date?: string; sessions?: any }): string {
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  if (sessions.length > 0 && sessions[0]?.date) return sessions[0].date
  return profile.estimated_wedding_date || ""
}

export default function OpsDashboardPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<{ id: string; name: string; role: string } | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<QueueDetail | null>(null)
  const [search, setSearch] = useState("")
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentTotal, setPaymentTotal] = useState("")
  const slaInegts = useRef<Record<string, NodeJS.Timeout>>({})
  const [waBlastSchedule, setWaBlastSchedule] = useState<any>(null)
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

  const downloadExcel = (filename: string, sheet: string, header: string[], rows: (string | number)[][]) => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, sheet)
    XLSX.writeFile(wb, filename)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    setEmployee(JSON.parse(raw))
  }, [router])

  useEffect(() => {
    if (!employee) return
    fetchQueue()
  }, [employee])

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/ops/queue")
      const data = await res.json()
      setQueue(data.queue || [])
    } catch (e) {
      console.error("Failed to fetch queue", e)
    } finally {
      setLoading(false)
    }
  }

  const selectQueueItem = async (id: string) => {
    setSelectedId(id)
    setDetail(null)
    setFeedbackSubmissions([])
    try {
      const res = await fetch(`/api/ops/queue/${id}`)
      const data = await res.json()
      setDetail(data)
      setPaymentTotal(String(data.wedding_profile.total_project_cost || 0))
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
    }
  }

  const assignConsultant = async (employeeId: string) => {
    if (!selectedId) return
    await fetch(`/api/ops/queue/${selectedId}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId || null }),
    })
    if (detail) {
      setDetail({ ...detail, queue: { ...detail.queue, assigned_to: employeeId || null } })
    }
    fetchQueue()
  }

  const updatePackage = async (packageType: string) => {
    if (!selectedId) return
    const res = await fetch(`/api/ops/queue/${selectedId}/package`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package_type: packageType }),
    })
    const data = await res.json()
    if (data.success) {
      await selectQueueItem(selectedId)
      fetchQueue()
    } else {
      alert(data.error || "Gagal mengubah paket")
    }
  }

  const updatePayment = async (status: string) => {
    if (!selectedId) return
    const res = await fetch(`/api/ops/queue/${selectedId}/payment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_status: status,
        total_cost: paymentTotal ? Number(paymentTotal) : undefined,
      }),
    })
    const data = await res.json()
    if (data.success && detail) {
      setDetail({
        ...detail,
        wedding_profile: { ...detail.wedding_profile, payment_status: data.payment_status },
      })
      fetchQueue()
    }
  }

  const updateFeature = async (key: string, status: string) => {
    if (!selectedId) return
    await fetch(`/api/ops/queue/${selectedId}/feature/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (detail) {
      setDetail({
        ...detail,
        feature_actions: detail.feature_actions.map((f) =>
          f.feature_key === key ? { ...f, status, updated_at: new Date().toISOString() } : f
        ),
      })
      fetchQueue()
    }
  }

  const completeAll = async () => {
    if (!selectedId) return
    await fetch(`/api/ops/queue/${selectedId}/complete-all`, { method: "PUT" })
    if (detail) {
      setDetail({
        ...detail,
        feature_actions: detail.feature_actions.map((f) => ({
          ...f,
          status: "selesai",
          updated_at: new Date().toISOString(),
        })),
      })
      fetchQueue()
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

  const filteredQueue = queue.filter((item) => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${item.wedding_profile.bride_name} ${item.wedding_profile.groom_name}`.toLowerCase()
    return name.includes(q)
  })

  function SlaTimer({ startedAt }: { startedAt: string }) {
    const [elapsed, setElapsed] = useState("")
    useEffect(() => {
      const tick = () => {
        const diff = Date.now() - new Date(startedAt).getTime()
        if (diff < 0) { setElapsed("00:00:00"); return }
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setElapsed(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        )
      }
      tick()
      const interval = setInterval(tick, 1000)
      return () => clearInterval(interval)
    }, [startedAt])
    return <span>{elapsed}</span>
  }

  if (!employee) return null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-body-md">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  const currentWp = detail?.wedding_profile
  const isSelected = selectedId && detail

  const profileSlug = currentWp?.slug || ""
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

  const downloadVipExcel = () => {
    const header = ["Nama Tamu", "No. WhatsApp (nomor saja, tanpa +62/0)", "Kategori", "Meja", "VIP (isi YA jika VIP)"]
    const rows = (detail?.vip_guests || []).map(g => [
      g.name,
      (g.phone_number || "").replace(/[^0-9]/g, ""),
      g.category || "",
      g.table_number || "",
      "YA",
    ])
    downloadExcel(`daftar-tamu-vip-${profileSlug}.xlsx`, "Tamu VIP", header, rows)
  }

  const downloadQrExcel = () => {
    const header = ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Link QR", "Link Undangan"]
    const rows = qrGuests.map(g => [
      g.name,
      g.phone_number || "",
      g.category || "",
      g.table_number || "",
      guestQrUrl(g),
      guestInvUrl(g),
    ])
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
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 bg-background border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <h1 className="font-display-lg text-headline-md tracking-widest text-primary uppercase">Aksaraa</h1>
            <span className="text-xs font-label-md tracking-widest bg-primary text-white px-2 py-1 ml-2">CORE OPS</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-10">
              <a className="font-label-md text-label-md uppercase tracking-widest text-primary font-semibold border-b-2 border-primary">Antrian</a>
              <a href="/ops/music" className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary">Music</a>
            </nav>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-[10px] uppercase opacity-60">Petugas Aktif</p>
                <p className="font-body-md font-semibold text-sm">{employee.name}</p>
              </div>
              <div className="w-10 h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="pt-20 flex flex-1 overflow-hidden">
          {/* LEFT PANEL - ANTRIAN */}
          <aside className="w-80 md:w-96 flex-shrink-0 border-r border-outline-variant bg-surface-container-low flex flex-col">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="font-headline-md text-2xl mb-4 text-primary">Antrian Tindakan Aktif</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama pengantin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-outline-variant px-4 py-3 text-sm focus:ring-0 focus:border-primary outline-none transition-all font-body-md"
                />
                <span className="material-symbols-outlined absolute right-3 top-3 opacity-40">search</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredQueue.length === 0 && (
                <div className="p-12 text-center opacity-30 italic font-body-md text-sm">
                  Tidak ada antrian
                </div>
              )}
              {filteredQueue.map((item) => {
                const wp = item.wedding_profile
                const name = `${wp.bride_name} & ${wp.groom_name}`
                const isActive = selectedId === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => selectQueueItem(item.id)}
                    className={`p-6 border-b border-outline-variant transition-all cursor-pointer hover:bg-surface ${
                      isActive ? "bg-white border-l-4 border-secondary" : "border-l-4 border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display-lg text-xl flex items-center gap-2">
                        {name}
                        {wp.express_service && (
                          <span className="material-symbols-outlined text-amber-600 text-lg" title="Layanan Kilat 24 Jam">bolt</span>
                        )}
                      </h3>
                      <span className={`font-mono text-sm font-bold ${isActive ? "text-secondary" : "text-on-surface-variant"}`}>
                        <SlaTimer startedAt={item.sla_started_at} />
                      </span>
                    </div>
                    <div className="space-y-1 opacity-70">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-label-md">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {wp.whatsapp_number}
                      </div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-label-md">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {formatDate(getWeddingDate(wp))} &bull; {wp.estimated_guest_count} Tamu
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* RIGHT PANEL - DETAIL */}
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-background p-8 md:p-12">
            {!isSelected ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center opacity-30">
                  <span className="material-symbols-outlined text-6xl mb-4">chevron_left</span>
                  <p className="font-body-md italic">Pilih antrian dari panel kiri</p>
                </div>
              </div>
            ) : detail && currentWp ? (
              <>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-outline-variant pb-8">
                  <div>
                    <span className="font-label-md text-xs uppercase tracking-[0.2em] text-secondary mb-2 block">
                      Ruang Kerja Klien
                    </span>
                    <h2 className="font-display-lg text-5xl">{currentWp.bride_name} &amp; {currentWp.groom_name}</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-body-md text-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Tanggal:</span>
                        <span className="font-bold text-primary">{formatDate(getWeddingDate(currentWp))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi:</span>
                        <span className="font-bold text-primary">{currentWp.estimated_guest_count} Tamu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Paket:</span>
                        <select
                          value={currentWp.package_type}
                          onChange={(e) => updatePackage(e.target.value)}
                          className="bg-white border border-outline-variant text-sm font-bold text-primary py-1 px-2 focus:ring-0 focus:border-primary font-body-md cursor-pointer"
                        >
                          <option value="essential">Essential</option>
                          <option value="signature">Signature</option>
                          <option value="prestige">Prestige</option>
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
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col">
                      <label className="font-label-md text-[10px] uppercase tracking-widest mb-1">Petugas Konsultan</label>
                      <select
                        value={detail.queue.assigned_to || ""}
                        onChange={(e) => assignConsultant(e.target.value)}
                        className="bg-surface-container border border-outline-variant text-sm py-2 px-4 focus:ring-0 focus:border-primary font-body-md"
                      >
                        <option value="">— Pilih —</option>
                        {detail.employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-secondary-container text-on-secondary-container px-6 py-4 border border-secondary flex flex-col items-center justify-center">
                      <span className="font-label-md text-[10px] uppercase tracking-widest opacity-80">Status SLA Aktif</span>
                      <span className="font-mono text-xl font-bold">
                        <SlaTimer startedAt={detail.queue.sla_started_at} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Panel */}
                <section className="mb-16 border border-primary p-8 bg-surface-container-low relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
                  </div>
                  <h3 className="font-headline-md text-xl mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined">payments</span>
                    Pusat Hitung Manual &amp; Validasi Keuangan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div>
                      <label className="font-label-md text-xs uppercase tracking-widest mb-3 block">
                        Total Biaya Rekalkulasi Proyek (IDR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-40">Rp</span>
                        <input
                          type="number"
                          value={paymentTotal}
                          onChange={(e) => setPaymentTotal(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 text-2xl font-body-md border-b-2 border-primary bg-transparent focus:ring-0 focus:border-secondary outline-none transition-all"
                        />
                      </div>
                      <p className="mt-3 text-xs opacity-50 font-body-md italic">
                        *Pastikan angka sudah termasuk pajak dan biaya layanan tambahan.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <label className="font-label-md text-xs uppercase tracking-widest block">Status Pembayaran</label>
                      <div className="flex flex-wrap gap-3">
                        {(["UNPAID", "PARTIAL_DP", "FULLY_PAID"] as const).map((st) => {
                          const isActive = currentWp.payment_status === st
                          return (
                            <button
                              key={st}
                              onClick={() => updatePayment(st)}
                              className={`px-6 py-3 text-xs font-label-md uppercase tracking-widest transition-all ${
                                isActive
                                  ? "border border-secondary bg-secondary-container text-on-secondary-container"
                                  : "border border-outline-variant opacity-40 hover:opacity-100"
                              }`}
                            >
                              {PAYMENT_LABELS[st]}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-4 p-4 bg-white border border-outline-variant text-sm font-body-md flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">info</span>
                        Status: <strong>{PAYMENT_LABELS[currentWp.payment_status]}</strong>
                        &nbsp;&bull;&nbsp; QR Tamu: {detail.guest_stats.with_token}/{detail.guest_stats.total}
                      </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
                  {detail.feature_actions.length === 0 && (
                    <div className="col-span-full text-center opacity-30 italic font-body-md text-sm py-12">
                      Tidak ada fitur untuk paket ini
                    </div>
                  )}
                  {detail.feature_actions.map((fa) => {
                    const isSelesai = fa.status === "selesai"
                    const isButuh = fa.status === "butuh_tindakan"
                    const statusBadgeClass = isButuh
                      ? "bg-error-container text-on-error-container"
                      : isSelesai
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-surface-container-highest text-on-surface-variant"
                    const statusLabel = fa.status === "butuh_tindakan"
                      ? "Butuh Tindakan"
                      : fa.status === "selesai"
                      ? "Selesai"
                      : "Aktif"
                    const waUrl = currentWp.whatsapp_number
                      ? `https://wa.me/${currentWp.whatsapp_number.replace(/[^0-9]/g, "")}?text=Halo%20${encodeURIComponent(currentWp.bride_name)}%20%26%20${encodeURIComponent(currentWp.groom_name)}%2C%20saya%20dari%20Aksaraa%20CORE%20OPS%20terkait%20${encodeURIComponent(FEATURE_LABELS[fa.feature_key] || fa.feature_key)}`
                      : "#"

                    return (
                      <div
                        key={fa.id}
                        className="bg-white border border-outline-variant p-6 flex flex-col hover:border-primary/50 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-display-lg text-base leading-tight">
                            {FEATURE_LABELS[fa.feature_key] || fa.feature_key}
                          </h4>
                          <span className={`text-[9px] px-2 py-0.5 uppercase font-bold tracking-widest shrink-0 ml-3 ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {(() => {
                          const subtitle = fa.feature_key === "premium_web"
                            ? [detail.feature_stats.template_name, detail.feature_stats.track_name].filter(Boolean).join(" / ") || null
                            : fa.feature_key === "unique_link_generator"
                            ? `${detail.guest_stats.with_token} QR Aktif`
                            : fa.feature_key === "qr_code_book"
                            ? `${detail.feature_stats.checked_in_count} Tamu Sudah Hadir`
                            : fa.feature_key === "wish_wall"
                            ? `${detail.feature_stats.wish_count} Wish Sudah Masuk`
                            : fa.feature_key === "galeri_foto_tamu"
                            ? `${detail.feature_stats.photo_count} Foto Terunggah`
                            : fa.feature_key === "kolom_direct_transfer"
                            ? `${detail.feature_stats.account_count} Rek, ${detail.feature_stats.address_count} Alm`
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
                              confirmed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${confirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                              {label}
                            </div>
                          )
                        })()}

                        {fa.feature_key === "unique_link_generator" && (
                          <div className="mb-4 flex items-center gap-3">
                            <button
                              onClick={openQrModal}
                              className="px-4 py-2.5 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">qr_code_2</span>
                              Lihat Daftar Tamu &amp; Link
                            </button>
                            <span className="text-[10px] text-on-surface-variant">{detail.guest_stats.with_token}/{detail.guest_stats.total} QR Aktif</span>
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
                                  <p className="font-body-md text-[10px] italic text-on-surface-variant/80 leading-relaxed">
                                    &ldquo;{fb.description.length > 80 ? `${fb.description.slice(0, 80)}...` : fb.description}&rdquo;
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
                            {invLoading ? "Memuat..." : "Lihat Undangan Digital"}
                          </button>
                        )}

                        <div className="mt-auto flex gap-2 pt-4 border-t border-outline-variant/40">
                          {isSelesai ? (
                            <>
                              <button
                                disabled
                                className="flex-1 py-2.5 border border-outline-variant text-[9px] font-bold uppercase tracking-widest opacity-40 cursor-not-allowed"
                              >
                                Hubungi WA
                              </button>
                              <button className="flex-1 py-2.5 bg-primary text-white text-[9px] font-bold uppercase tracking-widest cursor-default">
                                Selesai
                              </button>
                            </>
                          ) : (
                            <>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 border border-primary text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all text-center block"
                              >
                                Hubungi WA
                              </a>
                              <button
                                onClick={() => updateFeature(fa.feature_key, "selesai")}
                                className="flex-1 py-2.5 border border-outline-variant text-[9px] font-bold uppercase tracking-widest hover:border-primary transition-all"
                              >
                                Selesaikan
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Workspace Footer */}
                <footer className="w-full py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-outline-variant">
                  <div className="flex items-center gap-3 opacity-60">
                    <span className="material-symbols-outlined animate-pulse text-secondary">sync</span>
                    <p className="font-label-md text-xs uppercase tracking-widest">
                      Sinkronisasi real-time database pengantin Aksaraa Studio
                    </p>
                  </div>
                  <button
                    onClick={completeAll}
                    className="bg-primary text-white px-12 py-5 font-label-md text-sm uppercase tracking-[0.3em] hover:bg-secondary transition-all active:scale-95 shadow-xl"
                  >
                    Selesaikan Semua Fitur
                  </button>
                </footer>
              </>
            ) : null}
          </section>
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
                {/* Cover */}
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
                  {/* Couple Info */}
                  <div>
                    <p className="font-display-lg text-2xl text-center text-primary">{invitationData.profile.display_name || `${invitationData.profile.bride_name} & ${invitationData.profile.groom_name}`}</p>

                    {(invitationData.profile.groom_photo_url || invitationData.profile.bride_photo_url) && (
                      <div className="flex justify-center gap-6 mt-4">
                        {invitationData.profile.groom_photo_url && (
                          <div className="relative group">
                            <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden bg-surface-dim">
                              <img src={invitationData.profile.groom_photo_url} alt="Groom" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                            <button
                              onClick={() => downloadImage(invitationData.profile.groom_photo_url!, `groom-${invitationData.profile.slug || "photo"}.jpg`)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-[14px]">download</span>
                            </button>
                          </div>
                        )}
                        {invitationData.profile.bride_photo_url && (
                          <div className="relative group">
                            <div className="w-20 h-20 rounded-full border-2 border-secondary overflow-hidden bg-surface-dim">
                              <img src={invitationData.profile.bride_photo_url} alt="Bride" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                            <button
                              onClick={() => downloadImage(invitationData.profile.bride_photo_url!, `bride-${invitationData.profile.slug || "photo"}.jpg`)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-[14px]">download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {(invitationData.profile.bride_full_name || invitationData.profile.groom_full_name) && (
                      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                        <div>
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Pria</p>
                          <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.groom_full_name || invitationData.profile.groom_name}</p>
                          {invitationData.profile.groom_parents && (
                            <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putra dari {invitationData.profile.groom_parents}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Wanita</p>
                          <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.bride_full_name || invitationData.profile.bride_name}</p>
                          {invitationData.profile.bride_parents && (
                            <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putri dari {invitationData.profile.bride_parents}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {Array.isArray(invitationData.profile.inviting_families) && invitationData.profile.inviting_families.filter(Boolean).length > 0 && (
                      <div className="mt-4 text-center border-t border-outline-variant/40 pt-4">
                        <p className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-2">Turut Mengundang</p>
                        {invitationData.profile.inviting_families.filter(Boolean).map((f: string, i: number) => (
                          <p key={i} className="font-body-md text-[10px] italic text-on-surface-variant">Keluarga Besar {f}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-outline-variant/40" />

                  {/* Wedding Date / Sessions */}
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

                  {/* Quote */}
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

                  {/* Love Story */}
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

                  {/* Gallery */}
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

                  {/* Template Info */}
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

                  {/* Music */}
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

                  {/* Gift Info — only if we have additional fields */}
                  {invitationData.gift_accounts && (Array.isArray(invitationData.gift_accounts) && invitationData.gift_accounts.length > 0) && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Transfer & Kado</h4>
                        <div className="space-y-2">
                          {invitationData.gift_accounts.map((a: any, i: number) => (
                            <div key={i} className="flex justify-between border-b border-outline-variant/20 pb-2 text-sm">
                              <span className="font-body-md">{a.provider_name}</span>
                              <span className="font-body-md font-semibold">{a.account_number} — {a.account_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Invitation Link */}
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
                        <span className={`shrink-0 text-[10px] font-label-md uppercase tracking-wider px-2 py-0.5 rounded-full ${g.qr_token ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-outline-variant/30 text-on-surface-variant border border-outline-variant"}`}>
                          {g.qr_token ? "QR Aktif" : "Belum QR"}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                        <a href={guestQrUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-secondary underline break-all">{guestQrUrl(g) || "—"}</a>
                        <a href={guestInvUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline break-all">{guestInvUrl(g) || "—"}</a>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
