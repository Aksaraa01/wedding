"use client"

import { useState, useEffect, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import { pollWpJob } from "@/lib/wpJobPoll"
import { getTemplateComponent } from "@/components/templates"
import { normalizeTemplateTier, tierBadgeClass } from "@/lib/templateTier"
import { toTransformedUrl } from "@/lib/storageUrl"

const CATEGORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "adat", label: "Adat/Tradisional" },
  { id: "modern", label: "Modern Minimalis" },
  { id: "elegansi", label: "Elegansi Dark" },
  { id: "floral", label: "Floral" },
]

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
  category?: string | null
  tier?: string | null
  source_type?: string | null
  wp_master_slug?: string | null
  // Tanpa-photo group: separate dimension from category/tier (never a badge).
  no_photo?: boolean | null
}

// Same predicate drives filtering and zero-count hiding, so chips never lie.
function matchesCategory(cat: string | null | undefined, filterId: string): boolean {
  const c = (cat || "").trim().toLowerCase()
  switch (filterId) {
    case "semua":
      return true
    case "adat":
      return c.includes("adat") || c.includes("tradisional") || c === "budaya"
    case "modern":
      return c.includes("modern") || c.includes("minimalis") || c === "nasional"
    case "elegansi":
      return c.includes("elegansi") || c.includes("dark")
    case "floral":
      return c.includes("floral")
    default:
      return c === filterId
  }
}

function TemplatesInner({ id }: { id: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("semua")
  const [photoFilter, setPhotoFilter] = useState<"semua" | "tanpa">("semua")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const allFilters = useMemo(() => {
    const distinct = [...new Set(templates.map((t) => (t.category || "").trim()).filter(Boolean))]
    const baseIds = new Set(CATEGORY_FILTERS.map((f) => f.id))
    const extra = distinct
      .filter((c) => {
        const lower = c.toLowerCase()
        return !baseIds.has(lower) && !["nasional", "budaya"].includes(lower)
      })
      .map((c) => ({ id: c.toLowerCase(), label: c }))
    return [...CATEGORY_FILTERS, ...extra]
  }, [templates])

  const visibleTemplates = templates.filter((t) => {
    const catOk = matchesCategory(t.category, categoryFilter)
    const photoOk = photoFilter !== "tanpa" || t.no_photo === true
    const q = searchQuery.trim().toLowerCase()
    const searchOk = !q || [t.name, t.category, t.description, t.code]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q)
    return catOk && photoOk && searchOk
  })

  // Independent photo group (not a category): always visible, even while no
  // template carries the flag yet — the empty state below covers zero matches.
  // Filters with no matching templates are hidden (except "Semua"), so empty
  // categories like "Elegansi Dark" never appear as dead filter chips.
  const shownFilters = allFilters
    .map((f) => ({ ...f, count: templates.filter((t) => matchesCategory(t.category, f.id)).length }))
    .filter((f) => f.id === "semua" || f.count > 0 || f.id === categoryFilter)

  useEffect(() => {
    if (categoryFilter !== "semua" && !templates.some((t) => matchesCategory(t.category, categoryFilter))) {
      setCategoryFilter("semua")
    }
  }, [templates, categoryFilter])

  useEffect(() => {
    ;(async () => {
      const invData = await fetch(`/api/dashboard/${id}/web-invitation`).then((r) => r.json())
      // All templates are available to all packages — fetch unfiltered.
      const tplData = await fetch(`/api/web-templates`).then((r) => r.json())
      setTemplates(tplData.templates || [])
      if (invData.template) setSelectedId(invData.template.id)
    })()
  }, [id])

  const handleSelect = async (templateId: string) => {
    setSaving(true)
    setError(null)
    try {
      const tpl = templates.find((t) => t.id === templateId)
      const inhouse = tpl?.source_type === "inhouse" ||
        (!!tpl?.code && !!getTemplateComponent(tpl.code) && !tpl?.wp_master_slug)

      // In-house template: assign + clear any prior WP duplicate — no job to poll.
      if (inhouse) {
        const res = await fetch(`/api/web-invitation/template-select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: id, template_id: templateId, source: "dashboard" }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || res.statusText)
        }
        setSelectedId(templateId)
        router.push(`/dashboard/${id}/web-invitation/editor?preview=1`)
        return
      }

      // WP template: duplicate the master and poll until applied.
      const res = await fetch(`/api/wp/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, profile_id: id, source: "dashboard" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      const { job_id } = await res.json()
      await pollWpJob(job_id, { interval: 800 })
      setSelectedId(templateId)
      router.push(`/dashboard/${id}/web-invitation/editor?preview=1`)
    } catch (err) {
      console.error("[templates] duplicate failed", err)
      setError(err instanceof Error ? err.message : "Gagal menyimpan template")
      setSaving(false)
    }
  }

  return (
    <>
      <PageTheme mode="light" />
      <main className="pt-8 pb-32 px-edge-margin-mobile max-w-container-max mx-auto bg-[#FAF7F2]">
        <section className="mb-10 fade-in">
          <h1 className="font-headline-lg text-[18px] sm:text-[28px] leading-tight mb-3">Pilih Undangan Digital Anda</h1>
        </section>

        <div className="flex flex-col gap-3 mb-8">
          <div className="relative w-full max-w-xl min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template, kategori…"
              aria-label="Cari template"
              className="w-full pl-10 pr-10 py-2.5 rounded-full border border-outline-variant bg-surface text-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-brand-charcoal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {shownFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`shrink-0 rounded-full border px-5 py-2 font-label-md text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                  categoryFilter === f.id
                    ? "bg-[#B34E3F] border-[#B34E3F] text-white"
                    : "bg-white border-[#E2D9CF] text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant">Foto:</span>
            {([
              { id: "semua", label: "Semua" },
              { id: "tanpa", label: "Tanpa Photo" },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setPhotoFilter(f.id)}
                className={`shrink-0 rounded-full border px-5 py-2 font-label-md text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                  photoFilter === f.id
                    ? "bg-[#2C2A29] border-[#2C2A29] text-white"
                    : "bg-white border-[#E2D9CF] text-[#2C2A29] hover:border-[#2C2A29] hover:text-[#2C2A29]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visibleTemplates.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-body-md text-sm text-on-surface-variant mb-4">
              {photoFilter === "tanpa" ? "Belum ada template Tanpa Photo yang cocok." : searchQuery.trim() ? `Tidak ada template untuk “${searchQuery.trim()}”.` : "Tidak ada template yang cocok dengan filter."}
            </p>
            <button
              onClick={() => { setPhotoFilter("semua"); setCategoryFilter("semua"); setSearchQuery("") }}
              className="rounded-full border border-[#B34E3F] text-[#B34E3F] px-5 py-2 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#B34E3F] hover:text-white transition-colors"
            >
              Tampilkan Semua
            </button>
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-4 lg:gap-y-10 lg:overflow-visible">
          {visibleTemplates.map((tpl, idx) => {
            const styleTag = (tpl.category || "Modern").toUpperCase()
            const tierTag = normalizeTemplateTier(tpl.tier)?.toUpperCase() ?? null
            return (
            <article key={tpl.id} className="group flex flex-col shrink-0 snap-start w-[72vw] max-w-[300px] lg:w-auto lg:max-w-none bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <div
                data-tour={idx === 0 ? "template-preview" : undefined}
                className="relative overflow-hidden aspect-[9/19] bg-[#FAF7F2] cursor-pointer"
                onClick={() => setPreviewTpl(tpl)}
              >
                {selectedId === tpl.id && (
                  <div className="absolute top-2 left-2 z-10 bg-[#10B981] px-2.5 py-1 rounded-full">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white">Active</span>
                  </div>
                )}
                {tierTag && selectedId !== tpl.id && (
                  <span className={`absolute top-2 left-2 z-10 text-white text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm ${tierBadgeClass(tpl.tier)}`}>{tierTag}</span>
                )}
                <img
                  alt={tpl.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  src={toTransformedUrl(tpl.preview_image_url, { width: 400 })}
                  loading={idx < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 768px) 72vw, 240px"
                  data-original={tpl.preview_image_url}
                  onError={(e) => {
                    const img = e.currentTarget
                    if (img.dataset.fellBack) return
                    img.dataset.fellBack = "1"
                    if (img.dataset.original) img.src = img.dataset.original
                  }}
                  onMouseEnter={() => {
                    const link = document.createElement("link")
                    link.rel = "prefetch"
                    link.href = tpl.demo_url
                    link.as = "document"
                    document.head.appendChild(link)
                  }}
                />
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-headline-md text-[14px] leading-tight text-[#2C2A29] flex-1">{tpl.name}</h2>
                  <span className="shrink-0 px-2 py-0.5 bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] text-[8px] font-bold tracking-widest uppercase rounded-full">{styleTag}</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setPreviewTpl(tpl)}
                    className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] hover:bg-[#E2D9CF] transition-colors"
                  >
                    Lihat Template
                  </button>
                  <button
                    data-tour={idx === 0 ? "pilih-koleksi" : undefined}
                    onClick={() => handleSelect(tpl.id)}
                    disabled={saving}
                    className={`flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full border transition-colors ${
                      selectedId === tpl.id
                        ? "bg-[#B34E3F] border-[#B34E3F] text-white"
                        : "bg-[#B34E3F] border-[#B34E3F] text-white hover:bg-[#9E3B2D]"
                    }`}
                  >
                    {saving ? "Menyimpan..." : selectedId === tpl.id ? "Terpilih" : "Pilih"}
                  </button>
                </div>
              </div>
            </article>
          )})}
        </div>

        {error && (
          <div className="mt-8 p-4 border border-error bg-error/10 text-on-surface">
            <p className="font-label-md text-[11px] uppercase tracking-widest text-error mb-1">Sinkronisasi Gagal</p>
            <p className="text-[13px]">{error}</p>
          </div>
        )}
      </main>

      {saving && (
        <div className="fixed inset-0 z-[80] bg-[#2C2A29]/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl px-8 py-10 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full text-center">
            <span className="w-10 h-10 border-[3px] border-[#B34E3F] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2C2A29] font-medium">Undangan Anda sedang diproses..</p>
          </div>
        </div>
      )}

      {previewTpl && (
        <TemplatePreviewModal
          name={previewTpl.name}
          demoUrl={previewTpl.demo_url}
          onClose={() => setPreviewTpl(null)}
        />
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <TemplatesInner id={id} />
}
