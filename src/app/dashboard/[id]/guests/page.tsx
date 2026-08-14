"use client"

import { useState, useEffect, use, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"
import * as XLSX from "xlsx"

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
  const [importing, setImporting] = useState(false)
  const [waDigits, setWaDigits] = useState("")
  const [duplicateError, setDuplicateError] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [waBlastEnabled, setWaBlastEnabled] = useState(false)
  const [chartExpanded, setChartExpanded] = useState(false)

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
    setForm({ name: g.name, phone_number: g.phone_number || "", category: g.category || "", table_number: g.table_number || "", is_vip: !!g.is_vip })
    setWaDigits((g.phone_number || "").replace(/\D/g, ""))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setDuplicateError("")

    const data = {
      name: form.name.trim(),
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
    if (file) handleFileUpload(file)
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
        !verifySearch ||
        r.name.toLowerCase().includes(verifySearch.toLowerCase())
    )

    return (
      <>
        <PageTheme mode="light" />
        <header className="w-full top-0 sticky z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30">
          <div className="flex justify-between items-center px-6 py-4 w-full max-w-container-max mx-auto">
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-3 cursor-pointer active:opacity-70 group"
            >
              <span className="material-symbols-outlined text-primary group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Batal &amp; Kembali</span>
            </button>
            <ProfileMenu />
          </div>
        </header>

        <main className="flex flex-col h-screen px-6 pt-8 max-w-lg mx-auto">
          <section className="mb-8 shrink-0">
            <h1 className="font-headline-md text-headline-md text-primary mb-2">Verifikasi Unggahan</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Pastikan daftar tamu Anda akurat sebelum diintegrasikan ke narasi acara.</p>
          </section>

          <section className="mb-6 shrink-0 grid grid-cols-3 gap-px bg-outline-variant/50 border border-outline-variant/50 overflow-hidden">
            <div className="bg-surface p-4 flex flex-col items-center text-center">
              <span className="text-[24px] font-headline-md text-primary mb-1">{verifySummary.total}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Baris</span>
            </div>
            <div className="bg-surface p-4 flex flex-col items-center text-center border-x border-outline-variant/20">
              <span className="text-[24px] font-headline-md text-secondary mb-1">{verifySummary.valid}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Valid</span>
            </div>
            <div className="bg-surface p-4 flex flex-col items-center text-center">
              <span className="text-[24px] font-headline-md text-error mb-1">{verifySummary.duplicate}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Duplikat</span>
            </div>
          </section>

          <div className="shrink-0 flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-end">
              <h2 className="font-headline-md text-[20px] text-primary">Daftar Tamu Baru</h2>
              <span className="font-label-md text-label-md text-on-surface-variant border-b border-outline-variant/50 pb-1">{verifySummary.valid} Tamu</span>
            </div>
            <div className="relative group">
              <span className="absolute left-0 bottom-3 material-symbols-outlined text-on-surface-variant">search</span>
              <input
                className="w-full bg-transparent border-0 border-b border-primary/20 py-3 pl-8 focus:ring-0 focus:border-primary transition-colors font-label-md text-label-md tracking-widest placeholder:text-outline/60 uppercase"
                placeholder="CARI NAMA TAMU..."
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pb-40">
            <section className="border-t border-outline-variant/30">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 sticky top-0 z-10 bg-surface">
                      <th className="py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama</th>
                      <th className="py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">No. WA</th>
                      <th className="py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Meja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filteredVerify.map((row, i) => (
                      <tr key={i} className="group hover:bg-surface-container-low transition-colors duration-200">
                        <td className="py-5 pr-4">
                          <p className="font-headline-md text-[18px] text-primary leading-none flex items-center gap-2">
                            {row.name}
                            {row.is_vip && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#574500] font-label-md text-[9px] uppercase tracking-wider rounded-full">
                                <span className="material-symbols-outlined text-[10px]">star</span>
                                VIP
                              </span>
                            )}
                          </p>
                          {row.category && (
                            <span className="font-label-md text-[10px] text-secondary-fixed-dim bg-secondary/5 px-1 rounded uppercase mt-1 inline-block">{row.category}</span>
                          )}
                          {row.duplicate && (
                            <span className="font-label-md text-[10px] text-error bg-error-container/20 px-1 rounded uppercase mt-1 inline-block ml-1">Duplikat</span>
                          )}
                        </td>
                        <td className="py-5 font-body-md text-on-surface-variant text-[14px]">{row.phone_number}</td>
                        <td className="py-5 font-headline-md text-[18px] text-primary text-right italic">{row.table_number || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-50 lg:left-[var(--dash-sidebar-w)] bg-surface border-t border-outline-variant/20 shadow-2xl shadow-primary/10">
          <div className="max-w-lg mx-auto p-6 flex flex-col gap-4">
            <button
              onClick={handleVerifyImport}
              disabled={importing || verifySummary.valid === 0}
              className={`w-full bg-primary text-white py-5 px-6 font-label-md text-label-md uppercase tracking-[0.2em] transition-all hover:bg-secondary active:scale-[0.98] duration-300 flex items-center justify-center gap-3 ${
                importing ? "opacity-50" : ""
              }`}
            >
              {importing ? "Mengimpor..." : `Verifikasi & Impor ${verifySummary.valid} Tamu`}
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
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md px-edge-margin-mobile py-6 flex items-center justify-between">
        <button
          onClick={() => router.push(`/dashboard/${weddingProfileId}`)}
          className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-body-md">arrow_back</span>
          <span className="font-label-md text-label-md">KEMBALI</span>
        </button>
        <ProfileMenu />
      </header>

      <main className="h-screen pt-20 px-edge-margin-mobile md:px-edge-margin-desktop max-w-2xl md:max-w-6xl mx-auto flex flex-col">
        <section className="mb-6 shrink-0">
          <h1 className="font-headline-md text-headline-md text-primary mb-1">Manajemen Daftar Tamu</h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Unggah, verifikasi, dan petakan nomor meja seluruh tamu kehormatan Anda secara terpusat.
          </p>
        </section>

        <div className="flex-1 min-h-0 md:grid md:grid-cols-[320px_minmax(0,1fr)] md:gap-10">
        <aside className="md:overflow-y-auto md:min-h-0 md:pr-1 mb-6 md:mb-0">
        {chartData.length > 0 && (
          <section className="md:mb-0 shrink-0">
            <div className="border border-outline-variant bg-surface-container-low rounded-lg overflow-hidden">
              <button
                onClick={() => setChartExpanded(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[18px]">bar_chart</span>
                  <h2 className="font-headline-md text-[16px] text-primary">Sebaran Tamu per Meja</h2>
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
                <div className="px-5 pb-5">
                  <div className="flex flex-col gap-3">
                    {chartData.map((row) => (
                      <div key={row.table} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant truncate">
                          {row.table}
                        </span>
                        <div className="flex-1 h-4 bg-surface-container-highest rounded-sm overflow-hidden flex">
                          {row.cats.map(([cat, count]) => (
                            <div
                              key={cat}
                              style={{ width: `${(count / maxTableTotal) * 100}%`, backgroundColor: categoryColor(cat) }}
                              title={`${cat}: ${count}`}
                              className="h-full min-w-[4px]"
                            />
                          ))}
                        </div>
                        <span className="w-7 shrink-0 text-right font-body-md text-[12px] font-semibold text-primary">
                          {row.total}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-outline-variant/40 pt-3">
                    {chartCategories.map((cat) => (
                      <span key={cat} className="flex items-center gap-1.5 font-label-md text-[9px] uppercase tracking-wider text-on-surface-variant">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: categoryColor(cat) }} />
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        </aside>

        <div className="flex flex-col min-h-0">
        <section className="mb-6 shrink-0">
          {uploadError && (
            <div className="mb-3 p-3 bg-error-container border border-error/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-sm">error</span>
              <p className="font-body-md text-body-md text-on-error-container flex-1">{uploadError}</p>
              <button onClick={() => setUploadError("")} className="text-on-error-container/60 hover:text-on-error-container cursor-pointer">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          <div
            className={`border-2 border-dashed p-4 flex flex-col items-center text-center transition-all duration-300 ${
              dragOver ? "drag-active border-secondary bg-surface-container-low" : "border-outline-variant bg-surface-container-low"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="material-symbols-outlined text-xl mb-1.5 text-outline" style={{ fontVariationSettings: "'wght' 200" }}>description</span>
            <p className="font-body-md text-body-sm text-on-surface mb-2.5 px-2">
              Seret berkas Excel di sini atau{" "}
              <span className="font-semibold underline cursor-pointer">Ketuk untuk Unggah</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDownloadTemplate() }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-primary text-primary font-label-md text-label-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              Unduh Templat
            </button>
          </div>
        </section>

        <section className="mb-3 flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-[20px] text-primary">
              {loading ? "" : <><span className="text-secondary">{guests.length}</span> Tamu Terverifikasi</>}
            </h2>
          </div>
        </section>

        <div className="mb-4 px-0">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant opacity-50 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari Nama, No. HP atau Nomor Meja"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-[#eae3d5] py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-[12px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-48 scroll-area">
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
          <section className="border-t border-outline-variant">
            <div className="grid grid-cols-12 py-4 px-2 bg-surface-container-lowest sticky top-0 z-10">
              <div className="col-span-4 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Nama</div>
              <div className="col-span-4 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Kategori</div>
              <div className="col-span-4 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Meja</div>
            </div>

            {filtered.map((guest) => (
              <div key={guest.id} className="grid grid-cols-12 py-5 px-2 items-center hairline-divider group">
                <div className="col-span-4">
                  <p className="font-body-md font-semibold text-on-surface flex items-center gap-2">
                    {guest.name}
                    {guest.is_vip && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f2ca50]/20 border border-[#f2ca50]/40 text-[#574500] font-label-md text-[9px] uppercase tracking-wider rounded-full">
                        <span className="material-symbols-outlined text-[10px]">star</span>
                        VIP
                      </span>
                    )}
                    {guest.added_manually && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-700 font-label-md text-[9px] uppercase tracking-wider rounded-full">
                        Ditambahkan Manual
                      </span>
                    )}
                  </p>
                  {guest.phone_number && (
                    <p className="font-label-md text-[11px] text-on-surface-variant opacity-70">{guest.phone_number}</p>
                  )}
                </div>
                <div className="col-span-4">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                    {guest.category || "—"}
                  </span>
                </div>
                <div className="col-span-4 flex items-center justify-between gap-2">
                  <div>
                    {guest.table_number ? (
                      <span className="font-label-md text-[11px] px-2 py-1 bg-surface-container border border-outline-variant text-on-surface">
                        {guest.table_number}
                      </span>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant opacity-50">—</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(guest)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    >
                      <span className="material-symbols-outlined !text-[12px]">edit</span>
                    </button>
                    <button
                      onClick={() => { if (confirm("Hapus tamu ini?")) handleDelete(guest.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-error leading-none"
                    >
                      <span className="material-symbols-outlined !text-[12px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
        </div>
        </div>
        </div>
      </main>

      <button
        onClick={openAdd}
        className="fixed bottom-44 right-6 w-14 h-14 bg-primary text-white flex items-center justify-center shadow-lg z-40 active:scale-95 transition-transform duration-200"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      <footer className="fixed bottom-0 left-0 right-0 z-50 lg:left-[var(--dash-sidebar-w)] bg-background border-t border-outline-variant px-edge-margin-mobile py-6 flex flex-col gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => setResetConfirmOpen(true)}
          className="w-full bg-transparent border border-error text-error py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-error-container transition-colors"
        >
          Hapus Semua Data Tamu
        </button>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-background w-full max-w-md p-8 shadow-2xl border border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary mb-8">
                {editingId ? "Edit Tamu" : "Tambah Tamu Baru"}
              </h2>
              <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Nama</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Contoh: Anindya Pramesti"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">No. WhatsApp</label>
                  <div className="flex border border-outline-variant/30 focus-within:border-primary transition-colors">
                    <span className="px-4 py-3 bg-surface-container-highest font-body-md border-r border-outline-variant/30">+62</span>
                    <input
                      className="w-full px-4 py-3 bg-transparent font-body-md focus:outline-none"
                      placeholder="8123456789"
                      type="tel"
                      value={waDigits}
                      onChange={(e) => setWaDigits(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Kategori</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Contoh: Keluarga, Teman, Kerabat"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Meja</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors"
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
                      className={`flex items-center gap-3 border py-2.5 px-3 transition-colors ${
                        form.is_vip ? "border-[#f2ca50] bg-[#f2ca50]/10" : "border-outline-variant"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                          form.is_vip ? "bg-[#f2ca50] border-[#f2ca50]" : "border-outline"
                        }`}
                      >
                        {form.is_vip && <span className="material-symbols-outlined text-[12px] text-[#574500]">check</span>}
                      </span>
                      <span className="font-body-md text-sm text-on-surface">
                        Tandai sebagai tamu VIP (dapat reminder WhatsApp otomatis)
                      </span>
                    </button>
                  ) : (
                    <p className="font-body-md text-[12px] italic text-on-surface-variant/70 leading-relaxed border border-outline-variant/40 bg-surface-container/60 py-3 px-3">
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
                    className="w-full bg-primary text-white py-4 font-label-md text-label-md uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full bg-transparent border border-primary text-primary py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
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
                  className="w-full bg-error text-white py-4 font-label-md text-label-md uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Ya, Hapus Semua
                </button>
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="w-full bg-transparent border border-primary text-primary py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
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
