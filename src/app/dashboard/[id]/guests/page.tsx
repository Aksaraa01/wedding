"use client"

import { useState, useEffect, use, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import * as XLSX from "xlsx"
import { sanitizeGuestName } from "@/lib/nameClean"

type Guest = {
  id: string
  name: string
  phone_number: string
  category: string
  table_number: string
  is_vip: boolean
  added_manually?: boolean
}

type FormData = {
  name: string
  phone_number: string
  category: string
  table_number: string
  is_vip: boolean
}

const EMPTY_FORM: FormData = { name: "", phone_number: "", category: "", table_number: "", is_vip: false }

type VerifyRow = {
  name: string
  phone_number: string
  category: string
  table_number: string
  is_vip: boolean
  duplicate: boolean
}

type VerifySummary = {
  total: number
  valid: number
  duplicate: number
}

function GuestsInner({ weddingProfileId }: { weddingProfileId: string }) {
  const router = useRouter()
  const [guests, setGuests] = useState<Guest[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<"list" | "verify">("list")
  const [verifyRows, setVerifyRows] = useState<VerifyRow[]>([])
  const [verifySummary, setVerifySummary] = useState<VerifySummary | null>(null)
  const [verifySearch, setVerifySearch] = useState("")
  const [showDuplicateOnly, setShowDuplicateOnly] = useState(false)
  const [importing, setImporting] = useState(false)
  const [waDigits, setWaDigits] = useState("")
  const [duplicateError, setDuplicateError] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [waBlastEnabled, setWaBlastEnabled] = useState(false)
  const [chartExpanded, setChartExpanded] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setChartExpanded(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    fetch(`/api/dashboard/${weddingProfileId}`).then(r => r.json()).then(data => {
      setWaBlastEnabled(!!data?.selections?.wa_blast)
    }).catch(() => {})
  }, [weddingProfileId])

  const fetchGuests = async () => {
    const params = new URLSearchParams({ wedding_profile_id: weddingProfileId })
    if (search) params.set("q", search)
    const res = await fetch(`/api/guests?${params}`)
    if (res.ok) {
      const data = await res.json()
      setGuests(data.guests)
    }
  }

  useEffect(() => {
    fetchGuests().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchGuests, 300)
    return () => clearTimeout(timer)
  }, [search])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setWaDigits("")
    setModalOpen(true)
  }

  const openEdit = (g: Guest) => {
    setEditingId(g.id)
    setForm({ name: sanitizeGuestName(g.name), phone_number: g.phone_number || "", category: g.category || "", table_number: g.table_number || "", is_vip: !!g.is_vip })
    setWaDigits((g.phone_number || "").replace(/\D/g, ""))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setDuplicateError("")

    const data = {
      name: sanitizeGuestName(form.name.trim()),
      phone_number: waDigits ? `+62${waDigits}` : "",
      category: form.category.trim(),
      table_number: form.table_number.trim(),
      is_vip: waBlastEnabled && form.is_vip,
    }

    if (editingId) {
      const res = await fetch(`/api/guests/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) return
    } else {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, wedding_profile_id: weddingProfileId }),
      })
      if (res.status === 409) {
        const err = await res.json()
        setDuplicateError(err.error || "Tamu sudah ada")
        return
      }
      if (!res.ok) return
    }

    setModalOpen(false)
    fetchGuests()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/guests/${id}`, { method: "DELETE" })
    fetchGuests()
  }

  const handleReset = async () => {
    setResetConfirmOpen(false)
    await fetch("/api/guests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wedding_profile_id: weddingProfileId }),
    })
    fetchGuests()
  }

  const handleFileUpload = async (file: File) => {
    setUploadError("")
    if (!file.name.endsWith(".xlsx")) {
      setUploadError("Hanya file .xlsx yang diperbolehkan")
      return
    }
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: "array" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const headerRow: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
    const firstRow = headerRow[0] || []
    const hasNama = firstRow.some((h: string) => /nama/i.test(String(h || "")))
    if (!hasNama) {
      setUploadError("Format berkas tidak sesuai. Silakan unduh template terlebih dahulu.")
      return
    }
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { header: ["name", "phone_number", "category", "table_number", "vip"] })
    const rows = raw.slice(1).filter((r) => r.name?.trim())

    const res = await fetch("/api/guests/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wedding_profile_id: weddingProfileId, rows }),
    })

    if (res.ok) {
      const data = await res.json()
      setVerifyRows(data.rows)
      setVerifySummary(data.summary)
      setVerifySearch("")
      setView("verify")
    } else {
      const err = await res.json()
      setUploadError(err.error || "Gagal memproses berkas")
    }
  }

  const handleVerifyImport = async () => {
    setImporting(true)
    const validRows = verifyRows.filter((r) => !r.duplicate)
    await fetch("/api/guests/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wedding_profile_id: weddingProfileId, rows: validRows }),
    })
    setImporting(false)
    setView("list")
    fetchGuests()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) { setImportModalOpen(false); handleFileUpload(file) }
  }

  const handleDownloadTemplate = async () => {
    const res = await fetch("/api/guests/template")
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-import-tamu.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = guests.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone_number?.toLowerCase().includes(search.toLowerCase()) ||
      g.table_number?.toLowerCase().includes(search.toLowerCase())
  )

  const chartData = useMemo(() => {
    const byTable = new Map<string, Map<string, number>>()
    for (const g of guests) {
      const table = g.table_number?.trim() || "Tanpa Meja"
      const category = g.category?.trim() || "Tanpa Kategori"
      if (!byTable.has(table)) byTable.set(table, new Map())
      const cats = byTable.get(table)!
      cats.set(category, (cats.get(category) || 0) + 1)
    }
    const rows = [...byTable.entries()].map(([table, cats]) => ({
      table,
      total: [...cats.values()].reduce((a, b) => a + b, 0),
      cats: [...cats.entries()].sort((a, b) => b[1] - a[1]),
    }))
    rows.sort((a, b) => a.table.localeCompare(b.table, "id", { numeric: true }))
    return rows
  }, [guests])

  const chartCategories = useMemo(() => {
    const set = new Set<string>()
    for (const row of chartData) for (const [cat] of row.cats) set.add(cat)
    return [...set].sort((a, b) => a.localeCompare(b, "id"))
  }, [chartData])

  const CATEGORY_COLORS = ["#b8860b", "#8d4d39", "#4a6f8a", "#5a8a4a", "#8a6a4a", "#7a4a8a", "#4a8a7a", "#a4a4a4"]
  const categoryColor = (cat: string) => CATEGORY_COLORS[chartCategories.indexOf(cat) % CATEGORY_COLORS.length]
  const maxTableTotal = Math.max(1, ...chartData.map((r) => r.total))

  if (view === "verify" && verifySummary) {
    const filteredVerify = verifyRows.filter(
      (r) =>
        (!verifySearch || r.name.toLowerCase().includes(verifySearch.toLowerCase())) &&
        (!showDuplicateOnly || r.duplicate)
    )

    return (
      <>
        <PageTheme mode="light" />
        <header className="w-full top-0 sticky z-40 border-b border-[#E2D9CF]" style={DASH_HERO_BG}>
          <div className="flex justify-between items-center px-6 py-4 w-full">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-3 cursor-pointer active:opacity-70 group min-h-[44px]"
            >
              <span className="material-symbols-outlined text-primary group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Batal &amp; Kembali</span>
            </button>
            <ProfileMenu />
          </div>
        </header>

        <main className="flex flex-col h-screen px-5 md:px-6 pt-6 md:pt-8 pb-28 md:pb-0 max-w-lg mx-auto" style={DASH_SATIN_BG}>
          <section className="mb-6 md:mb-8 shrink-0">
            <h1 className="font-headline-md text-xl md:text-2xl text-[#2C2A29] mb-2">Verifikasi Unggahan</h1>
            <p className="font-body-md text-sm md:text-body-md text-on-surface-variant">Pastikan daftar tamu Anda akurat sebelum diintegrasikan ke narasi acara.</p>
          </section>

          <section className="mb-6 shrink-0 grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#E2D9CF] rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[#2C2A29] leading-none mb-1">{verifySummary.total}</span>
              <span className="font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold">Baris</span>
              <span className="mt-2 w-full h-1 bg-[#E2D9CF] rounded-full" />
            </div>
            <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[#065F46] leading-none mb-1">{verifySummary.valid}</span>
              <span className="font-label-md text-[11px] uppercase tracking-widest text-[#065F46] font-bold">Valid</span>
              <span className="mt-2 w-full h-1 bg-[#10B981] rounded-full" />
            </div>
            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-[28px] font-bold text-[#991B1B] leading-none mb-1">{verifySummary.duplicate}</span>
              <span className="font-label-md text-[11px] uppercase tracking-widest text-[#991B1B] font-bold">Duplikat</span>
              <span className="mt-2 w-full h-1 bg-[#DC2626] rounded-full" />
            </div>
          </section>

          <div className="shrink-0 flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-end">
              <h2 className="font-headline-md text-[18px] md:text-[20px] text-[#2C2A29]">Daftar Tamu Baru</h2>
              <span className="inline-flex items-center gap-1.5 bg-[#B34E3F] text-white px-3 py-1 rounded-full font-label-md text-[11px] font-bold uppercase tracking-widest">{verifySummary.valid} Tamu</span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant/60 text-[20px]">search</span>
              <input
                className="w-full bg-white border border-[#E2D9CF] rounded-full py-3 pl-12 pr-4 font-body-md text-sm text-[#2C2A29] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors"
                placeholder="Cari nama tamu..."
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pb-40">
            <section className="bg-white border border-[#E2D9CF] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E2D9CF] sticky top-0 z-10">
                      <th className="py-3.5 px-4 font-label-md text-[11px] text-[#2C2A29] uppercase tracking-widest whitespace-nowrap">Nama</th>
                      <th className="py-3.5 px-4 font-label-md text-[11px] text-[#2C2A29] uppercase tracking-widest whitespace-nowrap">No. WA</th>
                      <th className="py-3.5 px-4 font-label-md text-[11px] text-[#2C2A29] uppercase tracking-widest text-right whitespace-nowrap">Meja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D9CF]/50">
                    {filteredVerify.map((row, i) => (
                      <tr key={i} className={`group transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#FAF7F2]/50"} hover:bg-[#F5EFE6]`}>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-body-md font-bold text-[14px] md:text-[15px] text-[#2C2A29] leading-tight capitalize flex flex-wrap items-center gap-1.5 break-words">
                            <span>{row.name}</span>
                            {row.is_vip && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#7A5A2E] font-label-md text-[9px] uppercase tracking-wider rounded-full shrink-0">
                                <span className="material-symbols-outlined text-[10px]">star</span>
                                VIP
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {row.category && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] uppercase tracking-wider rounded-full">{row.category}</span>
                            )}
                            {row.duplicate && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] font-label-md text-[10px] font-bold uppercase tracking-wider rounded-full">Duplikat</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-body-md font-medium text-[#2C2A29] text-[13px] md:text-[14px] break-all">{row.phone_number}</td>
                        <td className="py-3.5 px-4 text-right"><span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] font-semibold tracking-wider rounded-full">{row.table_number ? `MEJA ${row.table_number.replace(/^meja\s+/i, "")}` : "—"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-50 lg:left-[var(--dash-sidebar-w)] bg-white border-t border-[#E2D9CF] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] font-label-md uppercase tracking-widest">
              <span className="text-[#2C2A29] font-bold">{verifySummary.valid} Siap</span>
              <span className={verifySummary.duplicate > 0 ? "text-[#991B1B] font-bold" : "text-on-surface-variant"}>{verifySummary.duplicate} Duplikat</span>
              <span className="text-on-surface-variant/60">{verifySummary.total} Baris</span>
            </div>
            {verifySummary.duplicate > 0 && (
              <div className="flex gap-2">
                <button onClick={() => { setVerifyRows((prev) => prev.filter((r) => !r.duplicate)); setVerifySummary((s) => s ? { total: s.valid, valid: s.valid, duplicate: 0 } : s); setShowDuplicateOnly(false) }} className="flex-1 py-2.5 border border-[#DC2626] text-[#DC2626] rounded-full font-label-md text-[11px] uppercase tracking-widest hover:bg-[#FEE2E2] transition-colors">Hapus Duplikat</button>
                <button onClick={() => setShowDuplicateOnly((v) => !v)} className={`flex-1 py-2.5 border rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors ${showDuplicateOnly ? "bg-[#B34E3F] text-white border-[#B34E3F]" : "border-[#E2D9CF] text-[#2C2A29] hover:bg-[#F5EFE6]"}`}>{showDuplicateOnly ? "Lihat Semua" : "Lihat Duplikat"}</button>
              </div>
            )}
            <button
              onClick={handleVerifyImport}
              disabled={importing || verifySummary.valid === 0}
              className={`w-full bg-[#B34E3F] text-white py-4 px-6 rounded-full font-label-md text-[11px] uppercase tracking-[0.2em] hover:bg-[#9E3B2D] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${importing ? "opacity-50" : ""}`}
            >
              {importing ? "Mengimpor..." : `Lanjut (${verifySummary.valid} Tamu)`}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </footer>
      </>
    )
  }

  return (
    <>
      <PageTheme mode="light" />
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 border-b border-[#E2D9CF] px-edge-margin-mobile md:px-edge-margin-desktop py-3 md:py-4 flex items-center justify-between gap-3" style={DASH_HERO_BG}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push(`/dashboard/${weddingProfileId}`)} aria-label="Kembali ke dasbor" className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-label-md text-label-md text-[#2C2A29] uppercase tracking-widest truncate">Manajemen Daftar Tamu</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ProfileMenu />
        </div>
      </header>

      <main className="h-screen pt-16 md:pt-20 pb-28 md:pb-0 px-edge-margin-mobile md:px-edge-margin-desktop max-w-2xl md:max-w-6xl mx-auto flex flex-col" style={DASH_SATIN_BG}>
        <section className="mb-5 md:mb-6 shrink-0">
          <h1 className="font-headline-md text-xl md:text-2xl text-primary mb-1">Manajemen Daftar Tamu</h1>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant leading-relaxed">
            Unggah, verifikasi, dan petakan nomor meja seluruh tamu kehormatan Anda secara terpusat.
          </p>
        </section>

        <div className="flex items-center gap-2 md:gap-3 mb-5 md:mb-6 shrink-0">
          <button onClick={() => setImportModalOpen(true)} data-tour="import-excel" className="hidden md:inline-flex items-center gap-2 bg-white text-[#2C2A29] border border-[#E2D9CF] rounded-full px-5 py-2.5 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#F5EFE6] transition-colors">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Import Excel
          </button>
          <button onClick={() => setImportModalOpen(true)} data-tour="import-excel" className="md:hidden flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#2C2A29] border border-[#E2D9CF] rounded-full px-5 py-2.5 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#F5EFE6] transition-colors">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Import Excel
          </button>
          <button onClick={openAdd} data-tour="tambah-tamu-manual" className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#B34E3F] text-white rounded-full px-5 md:px-6 py-2.5 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span className="hidden sm:inline">Tambah Tamu</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 md:grid md:grid-cols-[320px_minmax(0,1fr)] md:gap-10">
        <aside className="md:overflow-y-auto md:min-h-0 md:pr-1 mb-6 md:mb-0">
        {chartData.length > 0 && (
          <section className="md:mb-0 shrink-0">
            <div className="border border-[#E2D9CF] bg-white rounded-xl overflow-hidden">
              <button
                onClick={() => setChartExpanded(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-[#F5EFE6] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#B34E3F] text-[18px]">bar_chart</span>
                  <h2 className="font-headline-md text-[16px] text-[#2C2A29]">Sebaran Tamu per Meja</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {guests.length} tamu
                  </span>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${chartExpanded ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </div>
              </button>
              {chartExpanded && (
                <div className="px-5 pb-5 space-y-3">
                  {chartData.map((row) => (
                    <div key={row.table} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-[11px] uppercase tracking-wider text-[#2C2A29] truncate">{row.table}</span>
                        <span className="font-body-md text-[11px] font-semibold text-[#2C2A29]">{row.total} tamu</span>
                      </div>
                      <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E2D9CF]/50">
                        <div className="h-full bg-[#B34E3F] rounded-full transition-all" style={{ width: `${(row.total / maxTableTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        </aside>

        <div className="flex flex-col min-h-0">
        {uploadError && (
          <div className="mb-4 p-3 bg-error-container border border-error/30 flex items-center gap-3 rounded-lg">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <p className="font-body-md text-body-md text-on-error-container flex-1">{uploadError}</p>
            <button onClick={() => setUploadError("")} className="text-on-error-container/60 hover:text-on-error-container cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <section className="mb-3 flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-[18px] md:text-[20px] text-primary">
              {loading ? "" : <><span className="text-secondary">{guests.length}</span> Tamu Terverifikasi</>}
            </h2>
          </div>
        </section>

        <div className="bg-white border border-[#E2D9CF] rounded-xl overflow-hidden p-4 md:p-5 flex flex-col gap-4">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant opacity-50 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari Nama, No. HP atau Nomor Meja"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white border border-[#E2D9CF] rounded-full py-3 pl-12 pr-4 font-body-md text-[14px] md:text-body-md text-[#2C2A29] placeholder:text-[13px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-[#B34E3F] transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 scroll-area -mx-4 md:-mx-5 px-4 md:px-5">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border-t border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4" style={{ fontVariationSettings: "'wght' 200" }}>people_outline</span>
            <p className="font-body-md text-on-surface-variant">
              {guests.length === 0 ? "Belum ada tamu. Unggah spreadsheet atau tambah manual." : "Tidak ada hasil untuk pencarian ini."}
            </p>
          </div>
        ) : (
            <section className="border-t border-[#E2D9CF] bg-white">
            <div className="hidden md:grid md:grid-cols-12 py-4 px-4 bg-[#FAF7F2] sticky top-0 z-10 border-b border-[#E2D9CF]">
              <div className="col-span-5 font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29]">Nama</div>
              <div className="col-span-4 font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29]">Kategori</div>
              <div className="col-span-3 font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29] text-right">Meja</div>
            </div>

            {filtered.map((guest) => {
              const nameBadges = (
                <span className="flex flex-wrap items-center gap-1.5 ml-1">
                  {guest.is_vip && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#C5A059] text-[#8B6F2A] font-label-md text-[10px] uppercase tracking-wider rounded-full">
                      <span className="material-symbols-outlined text-[11px]">star</span>
                      VIP
                    </span>
                  )}
                  {guest.added_manually && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-[#FEF3C7] border border-[#D97706] text-[#92400E] font-label-md text-[10px] uppercase tracking-wider rounded-full">
                      Manual
                    </span>
                  )}
                </span>
              )
              const nameBlock = (
                <>
                  <p className="font-body-md font-semibold text-[15px] text-on-surface flex items-start gap-1 leading-snug">
                    <span className="break-words min-w-0">{guest.name}</span>
                    {nameBadges}
                  </p>
                  {guest.phone_number && (
                    <p className="font-label-md text-[12px] text-on-surface-variant opacity-70 mt-0.5">{guest.phone_number}</p>
                  )}
                </>
              )
              return (
                <div key={guest.id} className="py-3.5 md:py-5 px-4 border-b border-[#E2D9CF]/40 hover:bg-[#FAF7F2] transition-colors group">
                  {/* Mobile stacked layout */}
                  <div className="md:hidden flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">{nameBlock}</div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => openEdit(guest)}
                          aria-label="Edit tamu"
                          className="w-10 h-10 min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center text-on-surface-variant active:bg-surface-container rounded-full"
                        >
                          <span className="material-symbols-outlined !text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => { if (confirm("Hapus tamu ini?")) handleDelete(guest.id) }}
                          aria-label="Hapus tamu"
                          className="w-10 h-10 min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center text-error active:bg-error-container/20 rounded-full"
                        >
                          <span className="material-symbols-outlined !text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-1">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[11px] uppercase tracking-wider rounded-full">
                        {guest.category || "Umum"}
                      </span>
                      {guest.table_number ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[11px] rounded-full">
                          Meja {guest.table_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-white border border-[#E2D9CF]/50 text-on-surface-variant/60 font-label-md text-[11px] rounded-full">
                          Meja —
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop grid layout */}
                  <div className="hidden md:grid md:grid-cols-12 md:items-center">
                    <div className="col-span-5 pr-3">{nameBlock}</div>
                    <div className="col-span-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[11px] rounded-full">
                        {guest.category || "—"}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1">
                      {guest.table_number ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[11px] rounded-full">
                          Meja {guest.table_number}
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant opacity-50">—</span>
                      )}
                      <button
                        onClick={() => openEdit(guest)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity leading-none min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"
                      >
                        <span className="material-symbols-outlined !text-[12px]">edit</span>
                      </button>
                      <button
                        onClick={() => { if (confirm("Hapus tamu ini?")) handleDelete(guest.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-error leading-none min-h-[44px] min-w-[44px] flex items-center justify-center md:min-h-0 md:min-w-0"
                      >
                        <span className="material-symbols-outlined !text-[12px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}
        </div>
        </div>
          {guests.length > 0 && (
            <div className="mt-6 flex justify-center md:justify-end">
              <button onClick={() => setResetConfirmOpen(true)} className="text-[11px] font-label-md uppercase tracking-widest text-[#DC2626] hover:text-[#B91C1C] underline underline-offset-4 transition-colors">
                Hapus Semua Data
              </button>
            </div>
          )}
        </div>
        </div>
      </main>

      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImportModalOpen(false); handleFileUpload(file) } e.target.value = "" }} />

      {importModalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setImportModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-[#E2D9CF]">
              <h2 className="font-headline-md text-headline-md text-[#2C2A29] mb-2">Import Daftar Tamu</h2>
              <p className="font-body-md text-sm text-on-surface-variant mb-6">Unggah file Excel (.xlsx) sesuai template. Seret berkas ke area di bawah atau ketuk untuk memilih.</p>
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center transition-all cursor-pointer ${dragOver ? "border-[#B34E3F] bg-[#F5EFE6]" : "border-[#E2D9CF] bg-[#FAF7F2]"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="material-symbols-outlined text-[36px] text-[#B34E3F] mb-3">upload_file</span>
                <p className="font-body-md text-sm text-[#2C2A29] mb-1">Seret berkas Excel di sini</p>
                <p className="text-[11px] text-on-surface-variant mb-4">atau <span className="font-semibold underline">Ketuk untuk Unggah</span></p>
                <p className="text-[10px] text-on-surface-variant/60">Hanya .xlsx</p>
              </div>
              <button onClick={handleDownloadTemplate} className="mt-4 w-full bg-white border border-[#B34E3F] text-[#B34E3F] rounded-full py-3 font-label-md text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F5EFE6] transition-colors">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Unduh Templat
              </button>
              <button onClick={() => setImportModalOpen(false)} className="mt-3 w-full text-center text-[11px] font-label-md uppercase tracking-widest text-on-surface-variant hover:text-[#2C2A29] py-2">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-[#FAF7F2] w-full max-w-md p-8 shadow-2xl border border-[#E2D9CF] rounded-2xl max-h-[92dvh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline-md text-headline-md text-[#2C2A29]">
                  {editingId ? "Edit Tamu" : "Tambah Tamu Baru"}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#78716C] hover:bg-[#E2D9CF]/40 active:scale-95 transition-all shrink-0 -mr-2 -mt-2"
                  aria-label="Tutup"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
              <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Nama</label>
                  <input
                    className="w-full bg-white border border-[#E2D9CF] rounded-xl py-3 px-4 focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors placeholder:text-on-surface-variant/50"
                    placeholder="Contoh: Anindya Pramesti"
                    maxLength={30}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: sanitizeGuestName(e.target.value) }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">No. WhatsApp</label>
                  <div className="flex border border-[#E2D9CF] rounded-xl overflow-hidden focus-within:border-[#B34E3F] focus-within:ring-1 focus-within:ring-[#B34E3F] transition-colors bg-white">
                    <span className="px-4 py-3 bg-[#F5EFE6] font-body-md text-[#2C2A29] border-r border-[#E2D9CF]">+62</span>
                    <input
                      className="w-full px-4 py-3 bg-white font-body-md focus:outline-none placeholder:text-on-surface-variant/50"
                      placeholder="8123456789"
                      type="tel"
                      value={waDigits}
                      onChange={(e) => setWaDigits(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Kategori</label>
                  <select
                    className="w-full bg-white border border-[#E2D9CF] rounded-xl py-3 px-4 focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors"
                    value={["Keluarga", "Kerabat", "Teman", "Kolega", "Lainnya"].includes(form.category) ? form.category : form.category ? "__legacy__" : ""}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "__legacy__") return
                      setForm((p) => ({ ...p, category: v }))
                    }}
                  >
                    <option value="">Pilih kategori</option>
                    {form.category && !["Keluarga", "Kerabat", "Teman", "Kolega", "Lainnya"].includes(form.category) && (
                      <option value="__legacy__">{form.category}</option>
                    )}
                    <option value="Keluarga">Keluarga</option>
                    <option value="Kerabat">Kerabat</option>
                    <option value="Teman">Teman</option>
                    <option value="Kolega">Kolega</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Meja</label>
                  <input
                    className="w-full bg-white border border-[#E2D9CF] rounded-xl py-3 px-4 focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors placeholder:text-on-surface-variant/50"
                    placeholder="Contoh: MEJA 01"
                    value={form.table_number}
                    onChange={(e) => setForm((p) => ({ ...p, table_number: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Reminder Tamu VIP</label>
                  {waBlastEnabled ? (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_vip: !p.is_vip }))}
                      className={`flex items-center gap-3 border rounded-xl py-3 px-4 min-h-[44px] transition-colors ${
                        form.is_vip ? "border-[#FCD34D] bg-[#FEF3C7]" : "border-[#E2D9CF] bg-white"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          form.is_vip ? "bg-[#FCD34D] border-[#FCD34D]" : "border-[#E2D9CF] bg-white"
                        }`}
                      >
                        {form.is_vip && <span className="material-symbols-outlined text-[14px] text-[#92400E]">check</span>}
                      </span>
                      <span className="font-body-md text-sm text-[#2C2A29] text-left">
                        Tandai sebagai tamu VIP (dapat reminder WhatsApp otomatis)
                      </span>
                    </button>
                  ) : (
                    <p className="font-body-md text-[12px] italic text-on-surface-variant/70 leading-relaxed border border-[#E2D9CF] bg-white rounded-xl py-3 px-4">
                      Ubah paket, pengingat tamu VIP
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {duplicateError && (
                    <p className="font-body-md text-sm text-error text-center">{duplicateError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-[#B34E3F] text-white font-bold py-4 min-h-[44px] font-label-md text-label-md uppercase tracking-widest rounded-xl hover:bg-[#9E3B2D] active:scale-95 transition-all"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full bg-transparent border border-[#E2D9CF] text-[#2C2A29] py-4 min-h-[44px] font-label-md text-label-md uppercase tracking-widest rounded-xl hover:bg-[#F5EFE6] transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
      </div>
      </div>
      </div>
      )}

      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResetConfirmOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-background w-full max-w-md p-8 shadow-2xl border border-outline-variant text-center">
              <div className="w-16 h-16 bg-error-container/30 text-error flex items-center justify-center rounded-full mx-auto mb-6">
                <span className="material-symbols-outlined scale-150">delete_sweep</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-3">Hapus Semua Tamu?</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                Semua data tamu akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  className="w-full bg-error text-white py-4 min-h-[44px] font-label-md text-label-md uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Ya, Hapus Semua
                </button>
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="w-full bg-transparent border border-primary text-primary py-4 min-h-[44px] font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <GuestsInner weddingProfileId={id} />
}
