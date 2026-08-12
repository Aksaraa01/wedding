"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type Template = {
  id: string
  code: string
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
  is_active: boolean
  sort_order: number
  category: string | null
  package_eligibility: string[]
  wp_master_slug: string | null
  wp_manifest: Record<string, any> | null
}

type ElementNode = {
  id: string
  elType: string
  widgetType: string | null
  settings: Record<string, any>
  children: ElementNode[]
}

type Employee = { id: string; name: string; role: string; phone_number: string }

const PACKAGES = [
  { code: "essential", label: "Essential" },
  { code: "signature", label: "Signature" },
  { code: "prestige", label: "Prestige" },
]

// Aksara fields that can be mapped to a WP element
const AKSARA_FIELDS = [
  "couple_illustration_url",
  "display_name",
  "groom_full_name",
  "bride_full_name",
  "groom_parents",
  "bride_parents",
  "date_upper",
  "sessions",
  "gallery_photos",
  "gift_accounts",
  "video_url",
  "quote_text",
  "groom_instagram",
  "bride_instagram",
  "hashtag",
]

function useOpsSession() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    const emp = JSON.parse(raw)
    setEmployee(emp)
    if (emp.role !== "admin") {
      router.replace("/ops")
      return
    }
  }, [router])
  return employee
}

function opsHeaders(employee: Employee): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-ops-phone": employee.phone_number,
    "x-ops-role": employee.role,
  }
}

export default function OpsTemplatesPage() {
  const router = useRouter()
  const employee = useOpsSession()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // form state
  const [editing, setEditing] = useState<Template | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    preview_image_url: "",
    demo_url: "",
    is_active: true,
    sort_order: 0,
    category: "",
    package_eligibility: [] as string[],
    wp_master_slug: "",
  })

  const [uploading, setUploading] = useState(false)
  const previewFileRef = useRef<HTMLInputElement>(null)

  // mapping state
  const [showMapping, setShowMapping] = useState(false)
  const [elements, setElements] = useState<ElementNode[]>([])
  const [manifest, setManifest] = useState<Record<string, any>>({})
  const [wpLoading, setWpLoading] = useState(false)
  const [wpError, setWpError] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchTemplates = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    const res = await fetch("/api/ops/templates", { headers: opsHeaders(employee) })
    const data = await res.json()
    if (res.ok) setTemplates(data.templates)
    else setError(data.error || "Gagal memuat template")
    setLoading(false)
  }, [employee])

  useEffect(() => {
    if (employee) fetchTemplates()
  }, [employee, fetchTemplates])

  const togglePackage = (code: string) => {
    setForm((f) => ({ ...f, package_eligibility: [code] }))
  }

  const startNew = () => {
    setEditing(null)
    setIsNew(true)
    setShowForm(true)
    setShowMapping(false)
    setManifest({})
    setElements([])
    setForm({ code: "", name: "", description: "", preview_image_url: "", demo_url: "", is_active: true, sort_order: templates.length, category: "", package_eligibility: [], wp_master_slug: "" })
  }

  const startEdit = (t: Template, openMapping = false) => {
    setEditing(t)
    setIsNew(false)
    setShowForm(!openMapping)
    setShowMapping(openMapping)
    setManifest(t.wp_manifest || {})
    setElements([])
    setForm({
      code: t.code,
      name: t.name,
      description: t.description || "",
      preview_image_url: t.preview_image_url || "",
      demo_url: t.demo_url || "",
      is_active: t.is_active,
      sort_order: t.sort_order,
      category: t.category || "",
      package_eligibility: t.package_eligibility || [],
      wp_master_slug: t.wp_master_slug || "",
    })
  }

  const handlePreviewUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/template-media/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Gagal mengunggah gambar")
        return
      }
      setForm((f) => ({ ...f, preview_image_url: data.url }))
    } catch {
      setError("Gagal mengunggah gambar")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError("")
    if (!employee) return
    if (!form.name.trim()) {
      setError("Nama template wajib diisi")
      return
    }
    const body = {
      ...form,
      description: form.description || null,
      preview_image_url: form.preview_image_url || null,
      demo_url: form.demo_url || null,
      category: form.category || null,
      wp_master_slug: form.wp_master_slug || null,
    }
    const url = isNew ? "/api/ops/templates" : `/api/ops/templates/${editing!.id}`
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: opsHeaders(employee),
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan template")
      return
    }
    if (isNew) setEditing(data.template)
    setShowForm(false)
    fetchTemplates()
  }

  const handleDelete = async (t: Template) => {
    if (!confirm(`Nonaktifkan template "${t.name}"?`)) return
    if (!employee) return
    await fetch(`/api/ops/templates/${t.id}`, { method: "DELETE", headers: opsHeaders(employee) })
    fetchTemplates()
  }

  const loadWpElements = async () => {
    if (!employee || !editing?.id) return
    setWpLoading(true)
    setWpError("")
    const res = await fetch(`/api/ops/templates/${editing.id}/wp-data`, { headers: opsHeaders(employee) })
    const data = await res.json()
    setWpLoading(false)
    if (!res.ok) {
      setWpError(data.error || "Gagal memuat elemen")
      return
    }
    setElements(data.elements || [])
    setShowMapping(true)
  }

  const saveManifest = async () => {
    if (!employee || !editing?.id) return
    setError("")
    const res = await fetch(`/api/ops/templates/${editing.id}`, {
      method: "PUT",
      headers: opsHeaders(employee),
      body: JSON.stringify({ wp_manifest: manifest }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan mapping")
      return
    }
    setEditing(data.template)
    fetchTemplates()
  }

  const mapField = (field: string, elementId: string, settingsPath: string) => {
    setManifest((m) => ({
      ...m,
      [field]: { elementId, settings: settingsPath.split(".") },
    }))
  }

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const renderElement = (node: ElementNode, depth: number) => {
    const isExpanded = expanded.has(node.id)
    const keyPath = `${node.id}.${node.widgetType || node.elType}`
    return (
      <div key={keyPath} style={{ marginLeft: depth * 18 }}>
        <div className="flex items-center gap-2 py-1 border-b border-outline-variant/30">
          <button onClick={() => toggleExpand(node.id)} className="text-on-surface-variant text-xs w-4">
            {node.children.length ? (isExpanded ? "▾" : "▸") : "·"}
          </button>
          <span className="font-mono text-[11px] text-primary">{node.id}</span>
          <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">{node.elType}</span>
          {node.widgetType && <span className="text-[11px] text-secondary">{node.widgetType}</span>}
        </div>
        {isExpanded && (
          <div className="pl-4">
            <div className="text-[11px] text-on-surface-variant mt-1">
              {Object.keys(node.settings || {}).slice(0, 8).join(", ") || "no settings"}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {AKSARA_FIELDS.map((f) => {
                const mapped = manifest[f]?.elementId === node.id
                return (
                  <button
                    key={f}
                    onClick={() => mapField(f, node.id, "title")}
                    className={`text-[10px] px-2 py-0.5 border ${mapped ? "bg-secondary text-white border-secondary" : "border-outline-variant text-on-surface-variant hover:border-primary"}`}
                    title={`Map ${f} ke elemen ini (settings.title)`}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
            {node.children.map((c) => renderElement(c, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!employee) return null

  return (
    <>
      <PageTheme mode="light" />
      <div className="min-h-screen bg-background text-on-surface font-body-md">
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 bg-background border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-md text-headline-md tracking-widest text-primary uppercase">Aksaraa</h1>
            <span className="text-xs font-label-md tracking-widest bg-primary text-white px-2 py-1 ml-2">CORE OPS</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-10">
              <a href="/ops" className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary">Antrian</a>
              <a href="/ops/music" className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary">Music</a>
              <a className="font-label-md text-label-md uppercase tracking-widest text-primary font-semibold border-b-2 border-primary">Template</a>
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

        <main className="pt-20 px-6 md:px-12 pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-8">
            <div>
              <h2 className="font-headline-md text-[26px] text-primary font-bold">Manajemen Template</h2>
              <p className="text-sm text-on-surface-variant mt-1">Kelola template undangan, eligibilitas paket, dan mapping elemen WordPress.</p>
            </div>
            <button
              onClick={startNew}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 font-label-md text-xs uppercase tracking-widest hover:bg-secondary transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Template
            </button>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-error/10 border border-error text-error font-body-md text-sm">{error}</div>
          )}

          {loading ? (
            <div className="py-12 text-center text-on-surface-variant">Memuat template...</div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              Belum ada template. Klik "Tambah Template" untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((t) => (
                <div key={t.id} className={`bg-white border p-5 flex flex-col gap-3 ${t.is_active ? "border-outline-variant" : "border-outline-variant/40 opacity-60"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-headline-md text-[16px] text-primary font-bold">{t.name}</h3>
                      <p className="font-mono text-[11px] text-on-surface-variant">{t.code}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-surface-dim text-on-surface-variant"}`}>
                      {t.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {t.description && <p className="text-xs text-on-surface-variant line-clamp-2">{t.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {t.package_eligibility?.map((p) => (
                      <span key={p} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-surface-container-low border border-outline-variant">{p}</span>
                    ))}
                  </div>
                  {t.wp_master_slug && (
                    <p className="text-[11px] text-secondary font-mono">WP: /{t.wp_master_slug}/</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-outline-variant/30">
                    <button onClick={() => startEdit(t, false)} className="text-[11px] font-label-md uppercase tracking-wider text-primary hover:underline">Edit</button>
                    <button onClick={() => startEdit(t, true)} className="text-[11px] font-label-md uppercase tracking-wider text-secondary hover:underline">Mapping</button>
                    <button onClick={() => handleDelete(t)} className="text-[11px] font-label-md uppercase tracking-wider text-error hover:underline ml-auto">Nonaktifkan</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center overflow-y-auto py-10">
              <div className="bg-surface w-full max-w-2xl p-8 my-10 shadow-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline-md text-[20px] text-primary font-bold">{isNew ? "Tambah Template" : `Edit: ${form.name || editing?.code}`}</h3>
                  <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Kode</label>
                      <input className="input-editorial w-full font-label-md text-[14px]" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="marry-with-you" disabled={!isNew} />
                    </div>
                    <div>
                      <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Sort Order</label>
                      <input className="input-editorial w-full font-label-md text-[14px]" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Template</label>
                    <input className="input-editorial w-full font-label-md text-[14px]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Marry With You" />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Deskripsi</label>
                    <textarea className="input-editorial w-full font-label-md text-[14px] min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Gambar Preview</label>
                    <div className="flex gap-4 items-end">
                      <div
                        onClick={() => previewFileRef.current?.click()}
                        className="w-40 h-28 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0"
                      >
                        {form.preview_image_url ? (
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${form.preview_image_url})` }} />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => previewFileRef.current?.click()}
                          disabled={uploading}
                          className="w-full py-2.5 border border-dashed border-secondary text-secondary font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary-container/20 transition-colors disabled:opacity-40"
                        >
                          {uploading ? "Mengunggah..." : "Unggah Gambar"}
                        </button>
                        {form.preview_image_url && (
                          <p className="text-[10px] text-on-surface-variant break-all">{form.preview_image_url.slice(-60)}</p>
                        )}
                      </div>
                    </div>
                    <input
                      ref={previewFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePreviewUpload(f); e.target.value = "" }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Demo URL (harus unik)</label>
                    <input className="input-editorial w-full font-label-md text-[14px]" value={form.demo_url} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} placeholder="https://wp.aksaraa.com/marry-with-you/" />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">WP Master Slug</label>
                    <input className="input-editorial w-full font-label-md text-[14px]" value={form.wp_master_slug} onChange={(e) => setForm({ ...form, wp_master_slug: e.target.value })} placeholder="marry-with-you" />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-2">Eligibilitas Paket (pilih satu)</label>
                    <div className="flex flex-wrap gap-3">
                      {PACKAGES.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => togglePackage(p.code)}
                          className={`px-4 py-2 border font-label-md text-[11px] uppercase tracking-wider ${form.package_eligibility[0] === p.code ? "bg-primary text-white border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      Aktif
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-outline-variant">
                    <button onClick={handleSave} className="bg-primary text-white px-8 py-3 font-label-md text-xs uppercase tracking-widest hover:bg-secondary transition-all">Simpan</button>
                    <button onClick={() => setShowForm(false)} className="border border-outline-variant text-on-surface-variant px-8 py-3 font-label-md text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Batal</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showMapping && editing && (
            <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center overflow-y-auto py-10">
              <div className="bg-surface w-full max-w-3xl p-8 my-10 shadow-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-md text-[20px] text-primary font-bold">Mapping Elemen — {editing.name}</h3>
                  <button onClick={() => setShowMapping(false)} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">close</span></button>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">
                  Pilih elemen dari struktur WordPress lalu klik field Aksaraa untuk memetakannya (settings.title). Simpan mapping setelah selesai.
                </p>

                <div className="flex gap-3 mb-4">
                  <button onClick={loadWpElements} disabled={wpLoading} className="bg-secondary text-white px-6 py-2.5 font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50">
                    {wpLoading ? "Memuat..." : "Load dari WordPress"}
                  </button>
                  <button onClick={saveManifest} className="bg-primary text-white px-6 py-2.5 font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary transition-all">
                    Simpan Mapping
                  </button>
                </div>

                {wpError && <div className="mb-4 px-4 py-3 bg-error/10 border border-error text-error text-sm">{wpError}</div>}

                <div className="mb-5 p-3 bg-surface-container-low border border-outline-variant">
                  <p className="text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant mb-2">Mapping Saat Ini</p>
                  {Object.keys(manifest).length === 0 ? (
                    <p className="text-xs text-on-surface-variant">Belum ada mapping.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(manifest).map(([f, m]) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-surface-container-highest border border-outline-variant">
                          {f} → {m.elementId}.{(m.settings || []).join(".")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-outline-variant p-3 max-h-[50vh] overflow-y-auto bg-white">
                  {elements.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">Klik "Load dari WordPress" untuk melihat struktur elemen.</p>
                  ) : (
                    elements.map((n) => renderElement(n, 0))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
