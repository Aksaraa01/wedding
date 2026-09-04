"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import { pollWpJob } from "@/lib/wpJobPoll"
import ProductJourney from "@/components/onboarding/ProductJourney"

const CATEGORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "nasional", label: "Nasional" },
  { id: "budaya", label: "Budaya" },
]

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
  category?: string | null
}

function TemplatesInner({ id }: { id: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("semua")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const visibleTemplates = templates.filter((t) => {
    const catOk = categoryFilter === "semua" || (t.category || "").toLowerCase() === categoryFilter
    const searchOk = !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    return catOk && searchOk
  })

  useEffect(() => {
    ;(async () => {
      const invData = await fetch(`/api/dashboard/${id}/web-invitation`).then((r) => r.json())
      const pkg = invData.profile?.package_type
      const qs = pkg ? `?package_type=${encodeURIComponent(pkg)}` : ""
      const tplData = await fetch(`/api/web-templates${qs}`).then((r) => r.json())
      setTemplates(tplData.templates || [])
      if (invData.template) setSelectedId(invData.template.id)
    })()
  }, [id])

  const handleSelect = async (templateId: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/wp/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, profile_id: id }),
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
      <main className="pt-8 pb-32 px-edge-margin-mobile max-w-container-max mx-auto bg-background">
        <section className="mb-10 fade-in">
          <h1 className="font-headline-lg text-[18px] sm:text-[28px] leading-tight mb-3">Pilih Undangan Digital Anda</h1>
        </section>

        <ProductJourney profileId={id} />

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-outline-variant bg-surface text-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:border-brand-charcoal focus:ring-1 focus:ring-brand-charcoal"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`shrink-0 rounded-full border px-5 py-2 font-label-md text-[11px] uppercase tracking-widest transition-colors ${
                  categoryFilter === f.id
                    ? "bg-brand-charcoal border-brand-charcoal text-brand-cream"
                    : "border-outline-variant text-on-surface-variant hover:border-brand-charcoal hover:text-on-surface"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-4 lg:gap-y-10 lg:overflow-visible">
          {visibleTemplates.map((tpl, idx) => (
            <article key={tpl.id} className="group flex flex-col shrink-0 snap-start w-[72vw] max-w-[300px] lg:w-auto lg:max-w-none">
              <div
                data-tour={idx === 0 ? "template-preview" : undefined}
                className="relative mb-4 overflow-hidden rounded-2xl border-2 border-brand-charcoal aspect-[9/19] bg-surface-container shadow-sm cursor-pointer"
                onClick={() => setPreviewTpl(tpl)}
              >
                {selectedId === tpl.id && (
                  <div className="absolute top-2 left-2 z-10 bg-secondary/90 px-2 py-0.5">
                    <span className="text-[8px] font-label-md uppercase tracking-widest text-white">Active</span>
                  </div>
                )}
                <img
                  alt={tpl.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={`${tpl.preview_image_url}?width=400&quality=75&format=webp`}
                  loading={idx < 2 ? "eager" : "lazy"}
                  decoding="async"
                  sizes="(max-width: 768px) 72vw, 240px"
                  onMouseEnter={() => {
                    const link = document.createElement("link")
                    link.rel = "prefetch"
                    link.href = tpl.demo_url
                    link.as = "document"
                    document.head.appendChild(link)
                  }}
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
              </div>

              <div className="flex flex-col flex-grow">
                <h2 className="font-headline-md text-[16px] leading-tight mb-3">{tpl.name}</h2>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTpl(tpl)}
                    className="flex-1 py-3 font-label-md text-[10px] uppercase tracking-widest rounded-full border border-brand-charcoal text-brand-charcoal hover:bg-brand-cream transition-colors"
                  >
                    Lihat Template
                  </button>
                  <button
                    data-tour={idx === 0 ? "pilih-koleksi" : undefined}
                    onClick={() => handleSelect(tpl.id)}
                    disabled={saving}
                    className={`flex-1 py-3 font-label-md text-[10px] uppercase tracking-widest rounded-full border transition-all duration-300 ${
                      selectedId === tpl.id
                        ? "bg-secondary border-secondary text-white"
                        : "bg-brand-charcoal border-brand-charcoal text-brand-cream hover:bg-secondary hover:border-secondary hover:text-white"
                    }`}
                  >
                    {saving ? "Menyimpan..." : selectedId === tpl.id ? "Pilih Ulang" : "Pilih"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {error && (
          <div className="mt-8 p-4 border border-error bg-error/10 text-on-surface">
            <p className="font-label-md text-[11px] uppercase tracking-widest text-error mb-1">Sinkronisasi Gagal</p>
            <p className="text-[13px]">{error}</p>
          </div>
        )}
      </main>

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
