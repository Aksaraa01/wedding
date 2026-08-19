"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { FIELD_LABELS, WIDGET_SETTINGS } from "@/lib/fieldLabels"
import { OBJECT_ARRAY_FIELDS, SIMPLE_ARRAY_FIELDS, SUBFIELD_LABELS } from "@/lib/manifest"
import ElementSelect from "@/components/ops/ElementSelect"

type Template = {
  id: string
  code: string
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
  is_active: boolean
  sort_order: number
  package_eligibility: string[]
  wp_master_slug: string | null
  wp_manifest: Record<string, any> | null
}

type ElementNode = {
  id: string
  elType: string
  widgetType: string | null
  settings: Record<string, any>
  settings_keys?: string[]
  _preview?: string
  children: ElementNode[]
}

type Employee = { id: string; name: string; role: string; phone_number: string }

const PACKAGES = [
  { code: "essential", label: "Essential" },
  { code: "signature", label: "Signature" },
  { code: "prestige", label: "Prestige" },
]

const ALL_PACKAGES = PACKAGES.map(p => p.code)

// Aksara fields that can be mapped to a WP element
const AKSARA_FIELDS = [
  "guest_name",
  "cover_photos",
  "couple_initials",
  "display_name",
  "groom_name",
  "bride_name",
  "groom_full_name",
  "bride_full_name",
  "groom_photo_url",
  "bride_photo_url",
  "groom_parents",
  "bride_parents",
  "date_upper",
  "sessions",
  "gallery_photos",
  "gift_accounts",
  "gift_address",
  "gift_address_name",
  "gift_section",
  "video_section",
  "inviting_families_section",
  "story_section",
  "stories",
  "video_url",
  "quote_text",
  "quote_source",
  "groom_instagram",
  "bride_instagram",
  "inviting_families",
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
    package_eligibility: [] as string[],
    wp_master_slug: "",
  })

  const [uploading, setUploading] = useState(false)
  const previewFileRef = useRef<HTMLInputElement>(null)
  const [wpCheck, setWpCheck] = useState<{ checking: boolean; ok?: boolean; title?: string; msg?: string }>({ checking: false })

  // mapping state — simple fields: {field: [{elementId, settings}]},
  // object-array fields (sessions/gift/stories): {field: [{subfield: {elementId, settings}}]}
  const [showMapping, setShowMapping] = useState(false)
  const [elements, setElements] = useState<ElementNode[]>([])
  const [popups, setPopups] = useState<{ popup_title: string; popup_id: number; elements: ElementNode[] }[]>([])
  const [manifest, setManifest] = useState<Record<string, any>>({})
  const [wpLoading, setWpLoading] = useState(false)
  const [wpError, setWpError] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingField, setAddingField] = useState<string | null>(null)

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

  // Auto-load WP elements when mapping modal opens
  useEffect(() => {
    if (showMapping && editing?.wp_master_slug && elements.length === 0 && popups.length === 0) {
      loadWpElements()
    }
  }, [showMapping])

  const togglePackage = (code: string) => {
    setForm((f) => {
      const cur = Array.isArray(f.package_eligibility) ? f.package_eligibility : []
      if (cur.includes(code)) return { ...f, package_eligibility: cur.filter(c => c !== code) }
      return { ...f, package_eligibility: [...cur, code] }
    })
  }

  const normalizeManifest = (raw: any): Record<string, any> => {
    if (!raw || typeof raw !== "object") return {}
    const out: Record<string, any> = {}
    const objectArray = Object.keys(OBJECT_ARRAY_FIELDS)
    // Migrate legacy "couple_illustration_url" (single cover) into "cover_photos" (array).
    if (Array.isArray(raw.couple_illustration_url)) {
      const merged = [...(Array.isArray(raw.cover_photos) ? raw.cover_photos : []), ...raw.couple_illustration_url]
      raw = { ...raw, cover_photos: merged }
    }
    for (const [key, val] of Object.entries(raw)) {
      if (key === "couple_illustration_url") continue
      if (objectArray.includes(key)) {
        // object-array field: array of slot objects — keep as-is
        if (Array.isArray(val)) out[key] = val
        continue
      }
      if (Array.isArray(val)) {
        const rows = (val as any[]).filter((v: any) => v && v.elementId).map((v: any) => ({
          elementId: v.elementId as string,
          settings: Array.isArray(v.settings) ? v.settings : [],
        }))
        if (rows.length > 0) out[key] = rows
      } else if (val && typeof val === "object" && "elementId" in val) {
        const v = val as any
        out[key] = [{ elementId: v.elementId as string, settings: Array.isArray(v.settings) ? v.settings : [] }]
      }
    }
    return out
  }

  const startNew = () => {
    setEditing(null)
    setIsNew(true)
    setShowForm(true)
    setShowMapping(false)
    setManifest({})
    setElements([])
    setPopups([])
    setForm({ code: "", name: "", description: "", preview_image_url: "", demo_url: "", is_active: true, sort_order: templates.length, package_eligibility: [...ALL_PACKAGES], wp_master_slug: "" })
  }

  const startEdit = (t: Template, openMapping = false) => {
    setEditing(t)
    setIsNew(false)
    setShowForm(!openMapping)
    setShowMapping(openMapping)
    setManifest(normalizeManifest(t.wp_manifest))
    setElements([])
    setPopups([])
    setForm({
      code: t.code,
      name: t.name,
      description: t.description || "",
      preview_image_url: t.preview_image_url || "",
      demo_url: t.demo_url || "",
      is_active: t.is_active,
      sort_order: t.sort_order,
      package_eligibility: t.package_eligibility && t.package_eligibility.length > 0 ? t.package_eligibility : [...ALL_PACKAGES],
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

  const handleCheckWpSlug = async () => {
    if (!employee) return
    if (!form.wp_master_slug.trim()) {
      setWpCheck({ checking: false, ok: false, msg: "Isi WP Master Slug terlebih dahulu." })
      return
    }
    setWpCheck({ checking: true })
    const res = await fetch(`/api/ops/templates/check-wp-slug?slug=${encodeURIComponent(form.wp_master_slug)}`, { headers: opsHeaders(employee) })
    const data = await res.json()
    setWpCheck({ checking: false, ...data })
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
    const allEls = [...(data.elements || [])]
    for (const p of data.popups || []) allEls.push(...(p.elements || []))
    setElements(data.elements || [])
    setPopups(data.popups || [])
    // Auto-expand all containers
    const expandAll = new Set<string>()
    const markExpand = (elms: ElementNode[]) => {
      for (const el of elms) {
        if (el.children?.length) { expandAll.add(el.id); markExpand(el.children) }
      }
    }
    markExpand(allEls)
    setExpanded(expandAll)
    setShowMapping(true)
  }

  const saveManifest = async () => {
    if (!employee || !editing?.id) return
    setError("")
    // Auto-sort simple-array fields (cover_photos, gallery_photos, inviting_families)
    // by the element's position in the template (top-to-bottom), so manual order
    // mistakes can't produce shifted images.
    const sorted = { ...manifest }
    for (const field of SIMPLE_ARRAY_FIELDS) {
      const rows = sorted[field]
      if (Array.isArray(rows)) {
        sorted[field] = [...rows].sort((a: any, b: any) => {
          const ia = mappable.findIndex(el => el.id === a?.elementId)
          const ib = mappable.findIndex(el => el.id === b?.elementId)
          return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib)
        })
      }
    }
    // Safety net: URL sub-fields mapped to a button must target the button's link
    // (link.url), never its label (text). Otherwise the couple's maps link would
    // overwrite the "Buka Lokasi" / "Google Maps" button title.
    for (const field of Object.keys(OBJECT_ARRAY_FIELDS)) {
      const slots = sorted[field]
      if (!Array.isArray(slots)) continue
      for (const slot of slots) {
        if (!slot || typeof slot !== "object") continue
        for (const subField of Object.keys(slot)) {
          const sm = slot[subField]
          if (!sm || typeof sm !== "object" || !sm.elementId) continue
          if (subField !== "maps_url") continue
          const el = mappable.find(x => x.id === sm.elementId)
          if (el && el.widgetType === "button" && (sm.settings || []).join(".") !== "link.url") {
            sm.settings = ["link", "url"]
          }
        }
      }
    }
    // Safety net: any field mapped to a slideshow element must target
    // background_slideshow_gallery (not background_image.url) — otherwise the couple's
    // photo would patch the leftover background_image and the slideshow stays static.
    const objectArray = Object.keys(OBJECT_ARRAY_FIELDS)
    for (const [field, val] of Object.entries(sorted)) {
      if (objectArray.includes(field)) continue
      const mappings = Array.isArray(val) ? val : []
      for (const m of mappings) {
        if (!m || !m.elementId) continue
        const el = mappable.find(x => x.id === m.elementId)
        if (el && el.widgetType === "container-slideshow" && (m.settings || []).join(".") !== "background_slideshow_gallery") {
          m.settings = ["background_slideshow_gallery"]
        }
      }
    }
    const res = await fetch(`/api/ops/templates/${editing.id}`, {
      method: "PUT",
      headers: opsHeaders(employee),
      body: JSON.stringify({ wp_manifest: sorted }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan mapping")
      return
    }
    setEditing(data.template)
    setManifest(normalizeManifest(data.template.wp_manifest))
    fetchTemplates()
  }

  const isSectionField = (field: string) =>
    field === "gift_section" || field === "video_section" || field === "inviting_families_section" || field === "story_section"

  const defaultSettingsPath = (widgetType: string | null, field?: string): string => {
    if (!widgetType) return "title"
    if (widgetType === "container-bg") return "background_image.url"
    if (widgetType === "container-slideshow") return "background_slideshow_gallery"
    // Whole-section container has no content field to patch; hide/show is driven
    // by a _css_classes marker in the mu-plugin.
    if (widgetType === "container" && field && isSectionField(field)) return ""
    // URL/link fields on a button map to the button's link URL, not its label.
    if (widgetType === "button" && field && (field.includes("url") || field === "maps_url")) {
      return "link.url"
    }
    return WIDGET_SETTINGS[widgetType] || "title"
  }

  const addMapping = (field: string, elementId: string, widgetType: string) => {
    if (!elementId || !widgetType) return
    setManifest((m) => ({
      ...m,
      [field]: [...(m[field] || []), { elementId, settings: defaultSettingsPath(widgetType, field).split(".").filter(Boolean) }],
    }))
  }

  const removeMapping = (field: string, idx: number) => {
    setManifest((m) => {
      const rows = m[field] || []
      if (rows.length <= 1) {
        const n = { ...m }
        delete n[field]
        return n
      }
      return { ...m, [field]: rows.filter((_: any, i: number) => i !== idx) }
    })
  }

  const updateSettingsPath = (field: string, idx: number, pathStr: string) => {
    setManifest((m) => ({
      ...m,
      [field]: (m[field] || []).map((row: any, i: number) => i === idx ? { ...row, settings: pathStr.split(".") } : row),
    }))
  }

  const isObjectArrayField = (field: string) => Object.prototype.hasOwnProperty.call(OBJECT_ARRAY_FIELDS, field)

  const addSlot = (field: string) => {
    setManifest((m) => ({ ...m, [field]: [...(m[field] || []), {}] }))
  }

  const removeSlot = (field: string, slotIdx: number) => {
    setManifest((m) => {
      const slots = m[field] || []
      if (slots.length <= 1) { const n = { ...m }; delete n[field]; return n }
      return { ...m, [field]: slots.filter((_: any, i: number) => i !== slotIdx) }
    })
  }

  const setSubMapping = (field: string, slotIdx: number, subField: string, elementId: string, widgetType: string) => {
    if (!elementId || !widgetType) return
    setManifest((m) => {
      const slots = [...(m[field] || [])]
      slots[slotIdx] = {
        ...(slots[slotIdx] || {}),
        [subField]: { elementId, settings: defaultSettingsPath(widgetType, subField).split(".").filter(Boolean) },
      }
      return { ...m, [field]: slots }
    })
  }

  const removeSubMapping = (field: string, slotIdx: number, subField: string) => {
    setManifest((m) => {
      const slots = [...(m[field] || [])]
      const slot = { ...(slots[slotIdx] || {}) }
      delete slot[subField]
      slots[slotIdx] = slot
      return { ...m, [field]: slots }
    })
  }

  const updateSubSettingsPath = (field: string, slotIdx: number, subField: string, pathStr: string) => {
    setManifest((m) => {
      const slots = [...(m[field] || [])]
      const slot = { ...(slots[slotIdx] || {}) }
      if (slot[subField]) slot[subField] = { ...slot[subField], settings: pathStr.split(".") }
      slots[slotIdx] = slot
      return { ...m, [field]: slots }
    })
  }

  // Get set of all currently-mapped element IDs (for dedup)
  const mappedElementIds = useCallback(() => {
    const ids = new Set<string>()
    const objectArray = Object.keys(OBJECT_ARRAY_FIELDS)
    for (const [field, val] of Object.entries(manifest)) {
      if (objectArray.includes(field)) {
        // val = array of slots, each slot = {subfield: {elementId, settings}}
        for (const slot of val || []) {
          for (const sub of Object.values(slot || {})) {
            const sm = sub as any
            if (sm && typeof sm === "object" && sm.elementId) ids.add(sm.elementId)
          }
        }
      } else {
        for (const r of val || []) {
          if (r && r.elementId) ids.add(r.elementId)
        }
      }
    }
    return ids
  }, [manifest])

  // Build flat list of mappable elements (widgets + containers with background images).
  // Exclude structural/no-content widgets: spacer, divider, and empty containers.
  const EXCLUDED_WIDGETS = new Set(["spacer", "divider", "icon", "icon-box"])
  const mappableElements = useCallback(() => {
    const result: { id: string; widgetType: string; source: string; settingsKeys: string[]; _preview?: string }[] = []
    const collect = (elms: ElementNode[], source: string) => {
      for (const el of elms) {
        const keys = el.settings_keys || []
        const preview = el._preview || ""
        const hasBackground = preview.startsWith("bg: ")
        const hasSlideshow = preview.startsWith("slideshow")
        const isWidget = !!el.widgetType
        const excluded = isWidget && EXCLUDED_WIDGETS.has(el.widgetType!)
        // Order matters: bg/slideshow containers must be classified BEFORE plain
        // containers, otherwise a cover/photo container (which is also a section/
        // container) would fall through to `container` and default to `title`.
        if (isWidget && !excluded) {
          result.push({
            id: el.id,
            widgetType: el.widgetType || "",
            source,
            settingsKeys: keys,
            _preview: el._preview,
          })
        } else if (!isWidget && hasBackground) {
          result.push({
            id: el.id,
            widgetType: "container-bg",
            source,
            settingsKeys: keys,
            _preview: el._preview,
          })
        } else if (!isWidget && hasSlideshow) {
          result.push({
            id: el.id,
            widgetType: "container-slideshow",
            source,
            settingsKeys: keys,
            _preview: el._preview,
          })
        } else if (!isWidget && (el.elType === "section" || el.elType === "container")) {
          // Plain sections/containers (no bg) — only selectable for whole-section
          // targets (e.g. gift_section). ElementSelect gates their visibility via
          // `allowContainers`; here we just make them resolvable for defaultSettings.
          result.push({
            id: el.id,
            widgetType: "container",
            source,
            settingsKeys: keys,
            _preview: el._preview,
          })
        }
        if (el.children?.length) collect(el.children, source)
      }
    }
    collect(elements, "Post")
    for (const p of popups) collect(p.elements, `Popup: ${p.popup_title}`)
    return result
  }, [elements, popups])

  const mappable = mappableElements()
  const usedIds = mappedElementIds()

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
    const hasWidget = !!node.widgetType
    const isMapped = usedIds.has(node.id)
    const keyPath = `${node.id}.${node.widgetType || node.elType}`
    return (
      <div key={keyPath} style={{ marginLeft: depth * 18 }}>
        <div className={`flex items-center gap-2 py-1 border-b border-outline-variant/30 ${isMapped ? "bg-green-50" : ""}`}>
          <button onClick={() => toggleExpand(node.id)} className="text-on-surface-variant text-xs w-4">
            {node.children?.length ? (isExpanded ? "▾" : "▸") : "·"}
          </button>
          <span className={`font-mono text-[11px] ${hasWidget ? "text-primary font-semibold" : "text-on-surface-variant/50"}`}>{node.id}</span>
          <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">{node.elType}</span>
          {node.widgetType && <span className="text-[11px] text-secondary font-semibold">{node.widgetType}</span>}
          {node._preview && (
            <span className="text-[11px] text-on-surface truncate max-w-[300px]" title={node._preview}>» {node._preview}</span>
          )}
          {isMapped && <span className="text-[9px] text-green-600 ml-auto">✓</span>}
        </div>
        {isExpanded && (
          <div className="pl-4">
            <div className="text-[11px] text-on-surface-variant mt-1">
              {node.settings_keys?.slice(0, 8).join(", ") || "no settings"}
            </div>
            {node.children?.length > 0 && node.children.map((c) => renderElement(c, depth + 1))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {templates.map((t) => (
                <div key={t.id} className={`bg-white border p-3 flex flex-col gap-2 ${t.is_active ? "border-outline-variant" : "border-outline-variant/40 opacity-60"}`}>
                  {t.preview_image_url && (
                    <div className="aspect-[3/4] overflow-hidden bg-surface-container-low border border-outline-variant/30 rounded-sm">
                      <img src={t.preview_image_url} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-headline-md text-[13px] text-primary font-bold leading-tight">{t.name}</h3>
                      <p className="font-mono text-[10px] text-on-surface-variant">{t.code}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 shrink-0 ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-surface-dim text-on-surface-variant"}`}>
                      {t.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {t.description && <p className="text-[11px] text-on-surface-variant line-clamp-2">{t.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {t.package_eligibility?.map((p) => (
                      <span key={p} className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-surface-container-low border border-outline-variant">{p}</span>
                    ))}
                  </div>
                  {t.wp_master_slug && (
                    <p className="text-[10px] text-secondary font-mono truncate">WP: /{t.wp_master_slug}/</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-outline-variant/30">
                    {t.demo_url && (
                      <a href={t.demo_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary">
                        Preview
                      </a>
                    )}
                    <button onClick={() => startEdit(t, false)} className="text-[10px] font-label-md uppercase tracking-wider text-primary hover:underline">Edit</button>
                    <button onClick={() => startEdit(t, true)} className="text-[10px] font-label-md uppercase tracking-wider text-secondary hover:underline">Mapping</button>
                    <button onClick={() => handleDelete(t)} className="text-[10px] font-label-md uppercase tracking-wider text-error hover:underline ml-auto">Nonaktifkan</button>
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
                      <input className="input-editorial w-full font-label-md text-[14px]" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="marry-with-you" />
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
                    <div className="flex gap-2">
                      <input className="input-editorial w-full font-label-md text-[14px]" value={form.wp_master_slug} onChange={(e) => setForm({ ...form, wp_master_slug: e.target.value })} placeholder="marry-with-you" />
                      <button
                        type="button"
                        onClick={handleCheckWpSlug}
                        disabled={wpCheck.checking}
                        className="px-4 py-2 border border-secondary text-secondary font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary-container/20 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {wpCheck.checking ? "Mengecek..." : "Cek ke WP"}
                      </button>
                    </div>
                    {wpCheck.msg && (
                      <p className={`text-[11px] mt-1 ${wpCheck.ok ? "text-emerald-600" : "text-error"}`}>{wpCheck.msg}</p>
                    )}
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Slug postingan master template di WordPress — bagian dari URL, contoh: <span className="font-mono">https://wp.aksaraa.com/marry-with-you/</span> → slug <span className="font-mono">marry-with-you</span>.
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-2">Eligibilitas Paket (pilih semua yang berlaku)</label>
                    <div className="flex flex-wrap gap-3">
                      {PACKAGES.map((p) => (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => togglePackage(p.code)}
                          className={`px-4 py-2 border font-label-md text-[11px] uppercase tracking-wider ${form.package_eligibility.includes(p.code) ? "bg-primary text-white border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1">Template tampil untuk semua paket yang dipilih.</p>
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
            <div className="fixed inset-0 z-40 bg-black/50 flex items-start justify-center overflow-y-auto py-10 px-4">
              <div className="bg-surface w-full max-w-5xl p-6 md:p-8 my-10 shadow-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-md text-[20px] text-primary font-bold">Mapping Elemen — {editing.name}</h3>
                  <button onClick={() => setShowMapping(false)} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">close</span></button>
                </div>
                <p className="text-xs text-on-surface-variant mb-4">
                  Pilih elemen WordPress dari dropdown di samping setiap field Aksaraa.
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

                {elements.length === 0 && popups.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">Klik "Load dari WordPress" untuk memuat struktur elemen.</p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Element reference tree */}
                    <div className="border border-outline-variant p-3 max-h-40 overflow-y-auto bg-white">
                      <p className="text-[10px] font-label-md uppercase tracking-wider text-on-surface-variant mb-2">Struktur Elemen (referensi)</p>
                      {elements.map((n) => renderElement(n, 0))}
                      {popups.map((p) => (
                        <div key={p.popup_id}>
                          <span className="font-label-md text-[10px] uppercase text-secondary tracking-wider">Popup: {p.popup_title}</span>
                          {p.elements.map((n) => renderElement(n, 0))}
                        </div>
                      ))}
                    </div>

                    {/* Field mapping table */}
                    <div className="border border-outline-variant bg-white">
                      <div className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_minmax(100px,140px)_24px] gap-2 px-3 py-2 border-b border-outline-variant bg-surface-container-lowest text-[10px] font-label-md uppercase tracking-wider text-on-surface-variant">
                        <span>Konten Aksaraa</span>
                        <span>Elemen WP</span>
                        <span title="Path properti Elementor yg akan di-update (contoh: image.url, title, html)">Settings ⓘ</span>
                        <span></span>
                      </div>
                      {AKSARA_FIELDS.map((field) => {
                        if (isObjectArrayField(field)) {
                          const slots = manifest[field] || []
                          const subFields = OBJECT_ARRAY_FIELDS[field]
                          return (
                            <div key={field} className="border-b border-outline-variant/30 bg-surface-container-lowest/20">
                              <div className="px-3 py-2 flex items-center justify-between border-b border-outline-variant/20">
                                <span className="text-[11px] font-body-md font-semibold text-on-surface">{FIELD_LABELS[field] || field}</span>
                                <button onClick={() => addSlot(field)} className="text-[11px] text-primary hover:text-secondary">+ Tambah Slot</button>
                              </div>
                              {slots.length === 0 ? (
                                <p className="px-3 py-2 text-[10px] text-on-surface-variant/50">Belum ada slot. Klik "+ Tambah Slot" untuk memetakan satu kartu (mis. Sesi 1).</p>
                              ) : (
                                slots.map((slot: any, slotIdx: number) => (
                                  <div key={slotIdx} className="px-3 pb-2 border-b border-outline-variant/10">
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-[10px] font-label-md uppercase text-secondary tracking-wider">Slot {slotIdx + 1}</span>
                                      <button onClick={() => removeSlot(field, slotIdx)} className="text-[10px] text-error hover:opacity-70">Hapus Slot</button>
                                    </div>
                                    {subFields.map(subField => {
                                      const sub = slot?.[subField]
                                      return (
                                        <div key={subField} className="grid grid-cols-[90px_1fr_90px_24px] gap-2 px-1 py-1 items-start">
                                          <span className="text-[10px] text-on-surface-variant pt-1.5 truncate" title={subField}>{SUBFIELD_LABELS[subField] || subField}</span>
                                          <div className="min-w-0">
                                            <ElementSelect
                                              value={sub?.elementId || ""}
                                              elements={elements}
                                              popups={popups}
                                              usedIds={usedIds}
                                              placeholder="— belum —"
                                              onChange={(elId) => {
                                                if (!elId) { removeSubMapping(field, slotIdx, subField); return }
                                                const el = mappable.find(x => x.id === elId)
                                                if (el) setSubMapping(field, slotIdx, subField, elId, el.widgetType)
                                              }}
                                            />
                                          </div>
                                          {sub ? (
                                            <input
                                              className="text-[10px] font-mono border border-outline-variant px-1 py-0.5 w-full bg-background"
                                              value={(sub.settings || []).join(".")}
                                              onChange={(e) => updateSubSettingsPath(field, slotIdx, subField, e.target.value)}
                                            />
                                          ) : (
                                            <span className="text-[10px] text-on-surface-variant/40 pt-1.5">—</span>
                                          )}
                                          <button onClick={() => removeSubMapping(field, slotIdx, subField)} disabled={!sub} className={`text-xs pt-1.5 ${sub ? "text-on-surface-variant hover:text-error" : "text-on-surface-variant/20 cursor-default"}`}>×</button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ))
                              )}
                            </div>
                          )
                        }
                        const rows = manifest[field] || []
                        return (
                          <div key={field}>
                            {rows.length === 0 ? (
                              <div className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_minmax(100px,140px)_24px] gap-2 px-3 py-1.5 border-b border-outline-variant/30 items-start">
                                <span className="text-[11px] font-body-md text-on-surface truncate pt-1.5" title={field}>{FIELD_LABELS[field] || field}</span>
                                <div className="min-w-0">
                                  <ElementSelect
                                    value=""
                                    elements={elements}
                                    popups={popups}
                                    usedIds={usedIds}
                                    placeholder="— belum dipetakan —"
                                    allowContainers={isSectionField(field)}
                                    onChange={(elId) => {
                                      if (!elId) return
                                      const el = mappable.find(x => x.id === elId)
                                      if (el) addMapping(field, elId, el.widgetType)
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-on-surface-variant/40 pt-1.5">—</span>
                                <button disabled className="text-xs pt-1.5 text-on-surface-variant/20 cursor-default">+</button>
                              </div>
                            ) : (
                              rows.map((mapped: any, idx: number) => (
                                <div key={`${field}-${idx}`} className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_minmax(100px,140px)_24px] gap-2 px-3 py-1.5 border-b border-outline-variant/30 items-start hover:bg-surface-container-lowest/50">
                                  {SIMPLE_ARRAY_FIELDS.includes(field) ? (
                                    <span className="text-[10px] font-body-md text-on-surface truncate pt-1.5">
                                      {idx === 0 ? `${FIELD_LABELS[field] || field} 1` : `${FIELD_LABELS[field] || field} ${idx + 1}`}
                                    </span>
                                  ) : idx === 0 ? (
                                    <span className="text-[11px] font-body-md text-on-surface truncate pt-1.5" title={field}>{FIELD_LABELS[field] || field}</span>
                                  ) : (
                                    <span className="text-[10px] text-on-surface-variant/40 pt-1.5">↳</span>
                                  )}
<div className="min-w-0">
                                  <ElementSelect
                                    value={mapped.elementId}
                                    elements={elements}
                                    popups={popups}
                                    usedIds={usedIds}
                                    allowContainers={isSectionField(field)}
                                    onChange={(elId) => {
                                      if (!elId) { removeMapping(field, idx); return }
                                      const el = mappable.find(x => x.id === elId)
                                      if (el) {
                                        setManifest((m) => ({
                                          ...m,
                                          [field]: (m[field] || []).map((row: any, i: number) => i === idx ? { elementId: elId, settings: defaultSettingsPath(el.widgetType, field).split(".") } : row),
                                        }))
                                      }
                                    }}
                                  />
                                </div>
                                  <div className="flex items-center gap-0.5 pt-0.5">
                                    <input
                                      className="text-[10px] font-mono border border-outline-variant px-1 py-0.5 w-full bg-background"
                                      value={mapped.settings.join(".")}
                                      onChange={(e) => updateSettingsPath(field, idx, e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-0.5 pt-1.5">
                                    <button onClick={() => removeMapping(field, idx)} className="text-xs text-on-surface-variant hover:text-error" title="Hapus">×</button>
                                    {idx === rows.length - 1 && (
                                      <button onClick={() => setAddingField(field === addingField ? null : field)} className={`text-xs ${field === addingField ? "text-error" : "text-primary hover:text-secondary"}`} title="Tambah elemen">{field === addingField ? "−" : "+"}</button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                            {addingField === field && (
                              <div className="grid grid-cols-[minmax(150px,220px)_minmax(0,1fr)_minmax(100px,140px)_24px] gap-2 px-3 py-1.5 border-b border-outline-variant/30 items-start bg-surface-container-lowest/30">
                                <span className="text-[10px] text-on-surface-variant/40 pt-1.5">↳ tambah</span>
                                <div className="min-w-0">
                                  <ElementSelect
                                    value=""
                                    elements={elements}
                                    popups={popups}
                                    usedIds={usedIds}
                                    placeholder="— pilih elemen —"
                                    allowContainers={isSectionField(field)}
                                    onChange={(elId) => {
                                      if (!elId) return
                                      const el = mappable.find(x => x.id === elId)
                                      if (el) { addMapping(field, elId, el.widgetType); setAddingField(null) }
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-on-surface-variant/40 pt-1.5">—</span>
                                <span></span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
