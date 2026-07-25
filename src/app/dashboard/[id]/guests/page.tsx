"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import * as XLSX from "xlsx"

type Guest = {
  id: string
  name: string
  whatsapp: string
  relation: string
  table_number: string
}

type FormData = {
  name: string
  whatsapp: string
  relation: string
  table_number: string
}

const EMPTY_FORM: FormData = { name: "", whatsapp: "", relation: "", table_number: "" }

type VerifyRow = {
  name: string
  whatsapp: string
  relation: string
  table_number: string
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
    setForm({ name: g.name, whatsapp: g.whatsapp || "", relation: g.relation || "", table_number: g.table_number || "" })
    setWaDigits((g.whatsapp || "").replace(/\D/g, ""))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return

    const data = {
      name: form.name.trim(),
      whatsapp: waDigits ? `+62${waDigits}` : "",
      relation: form.relation.trim(),
      table_number: form.table_number.trim(),
    }

    if (editingId) {
      await fetch(`/api/guests/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } else {
      await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, wedding_profile_id: weddingProfileId }),
      })
    }

    setModalOpen(false)
    fetchGuests()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/guests/${id}`, { method: "DELETE" })
    fetchGuests()
  }

  const handleFileUpload = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: "array" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { header: ["name", "whatsapp", "relation", "table_number"] })
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
      g.table_number?.toLowerCase().includes(search.toLowerCase())
  )

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
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-on-primary-container text-sm">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-screen pb-40 px-6 pt-8 max-w-lg mx-auto overflow-x-hidden">
          <section className="mb-10">
            <h1 className="font-headline-md text-headline-md text-primary mb-2">Verifikasi Unggahan</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Pastikan daftar tamu Anda akurat sebelum diintegrasikan ke narasi acara.</p>
          </section>

          <section className="mb-8 grid grid-cols-3 gap-px bg-outline-variant/50 border border-outline-variant/50 overflow-hidden">
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

          <div className="flex flex-col gap-6 mb-4">
            <div className="flex justify-between items-end">
              <h2 className="font-headline-md text-[24px] text-primary">Daftar Tamu Baru</h2>
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

          <section className="mt-8 border-t border-outline-variant/30">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30">
                    <th className="py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama</th>
                    <th className="py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">WhatsApp</th>
                    <th className="py-5 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Meja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredVerify.map((row, i) => (
                    <tr key={i} className="group hover:bg-surface-container-low transition-colors duration-200">
                      <td className="py-6 pr-4">
                        <p className="font-headline-md text-[18px] text-primary leading-none">{row.name}</p>
                        {row.relation && (
                          <span className="font-label-md text-[10px] text-secondary-fixed-dim bg-secondary/5 px-1 rounded uppercase mt-1 inline-block">{row.relation}</span>
                        )}
                        {row.duplicate && (
                          <span className="font-label-md text-[10px] text-error bg-error-container/20 px-1 rounded uppercase mt-1 inline-block ml-1">Duplikat</span>
                        )}
                      </td>
                      <td className="py-6 font-body-md text-on-surface-variant text-[14px]">{row.whatsapp}</td>
                      <td className="py-6 font-headline-md text-[18px] text-primary text-right italic">{row.table_number || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant/20 shadow-2xl shadow-primary/10">
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
      <header className="fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-md px-edge-margin-mobile py-6 flex items-center">
        <button
          onClick={() => router.push(`/dashboard/${weddingProfileId}`)}
          className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-body-md">arrow_back</span>
          <span className="font-label-md text-label-md">KEMBALI</span>
        </button>
      </header>

      <main className="pt-24 pb-40 px-edge-margin-mobile max-w-2xl mx-auto">
        <section className="mb-12">
          <h1 className="font-headline-md text-headline-md text-primary mb-3">Manajemen Daftar Tamu</h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Unggah, verifikasi, dan petakan nomor meja seluruh tamu kehormatan Anda secara terpusat.
          </p>
        </section>

        <section className="mb-8">
          <div
            className={`border-2 border-dashed p-10 flex flex-col items-center text-center transition-all duration-300 ${
              dragOver ? "drag-active border-secondary bg-surface-container-low" : "border-outline-variant bg-surface-container-low"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="material-symbols-outlined text-4xl mb-4 text-outline" style={{ fontVariationSettings: "'wght' 200" }}>description</span>
            <p className="font-body-md text-body-md text-on-surface mb-6 px-4">
              Seret berkas Excel / Spreadsheet Anda di sini atau{" "}
              <span className="font-semibold underline cursor-pointer">Ketuk untuk Unggah</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDownloadTemplate() }}
              className="flex items-center gap-2 px-6 py-3 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Unduh Templat
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">(Nama Tamu, No. WhatsApp — nomor saja tanpa +62/0, Relasi, Meja)</span>
          </div>
        </section>

        <section className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-[24px] text-primary">
              {loading ? "" : `${guests.length} Tamu Terverifikasi`}
            </h2>
          </div>
        </section>

        <div className="mb-8 px-2">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-on-surface-variant opacity-50 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Cari nama tamu atau nomor meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-[#eae3d5] py-4 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
        </div>

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
            <div className="grid grid-cols-12 py-4 px-2 bg-surface-container-lowest">
              <div className="col-span-4 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Nama</div>
              <div className="col-span-3 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Relasi</div>
              <div className="col-span-3 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Meja</div>
              <div className="col-span-2" />
            </div>

            {filtered.map((guest) => (
              <div key={guest.id} className="grid grid-cols-12 py-5 px-2 items-center hairline-divider group">
                <div className="col-span-4">
                  <p className="font-body-md font-semibold text-on-surface">{guest.name}</p>
                  {guest.whatsapp && (
                    <p className="font-label-md text-[11px] text-on-surface-variant opacity-70">{guest.whatsapp}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">
                    {guest.relation || "—"}
                  </span>
                </div>
                <div className="col-span-3">
                  {guest.table_number ? (
                    <span className="font-label-md text-[11px] px-2 py-1 bg-surface-container border border-outline-variant text-on-surface">
                      {guest.table_number}
                    </span>
                  ) : (
                    <span className="text-[10px] text-on-surface-variant opacity-50">—</span>
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(guest)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-body-md">edit</span>
                  </button>
                  <button
                    onClick={() => { if (confirm("Hapus tamu ini?")) handleDelete(guest.id) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-error"
                  >
                    <span className="material-symbols-outlined text-body-md">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {filtered.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button className="px-8 py-3 border border-outline text-on-surface-variant font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors">
              Lihat Semua Tamu
            </button>
          </div>
        )}
      </main>

      <button
        onClick={openAdd}
        className="fixed bottom-44 right-6 w-14 h-14 bg-primary text-white flex items-center justify-center shadow-lg z-40 active:scale-95 transition-transform duration-200"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      <footer className="fixed bottom-0 left-0 w-full z-50 bg-background border-t border-outline-variant px-edge-margin-mobile py-6 flex flex-col gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => { setForm(EMPTY_FORM); setSearch(""); fetchGuests() }}
          className="w-full bg-transparent border border-primary text-primary py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container transition-colors"
        >
          Batal &amp; Reset
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
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Nomor WhatsApp</label>
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
                  <label className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Relasi</label>
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Contoh: Keluarga, Teman, Kerabat"
                    value={form.relation}
                    onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))}
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
                <div className="flex flex-col gap-3 mt-4">
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
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <GuestsInner weddingProfileId={id} />
}
