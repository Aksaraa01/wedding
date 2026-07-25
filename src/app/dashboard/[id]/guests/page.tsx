"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

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
    setModalOpen(true)
  }

  const openEdit = (g: Guest) => {
    setEditingId(g.id)
    setForm({ name: g.name, whatsapp: g.whatsapp || "", relation: g.relation || "", table_number: g.table_number || "" })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return

    if (editingId) {
      await fetch(`/api/guests/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } else {
      await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, wedding_profile_id: weddingProfileId }),
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
    const fd = new FormData()
    fd.set("file", file)
    fd.set("wedding_profile_id", weddingProfileId)
    await fetch("/api/guests/import", { method: "POST", body: fd })
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
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">(Nama, WhatsApp, Relasi, Meja)</span>
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
                  <input
                    className="w-full bg-transparent border-b border-outline-variant py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="+62 812..."
                    value={form.whatsapp}
                    onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                  />
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
