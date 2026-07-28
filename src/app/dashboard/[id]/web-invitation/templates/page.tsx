"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"

type Template = {
  id: string
  code: string
  name: string
  description: string
  category: string | null
  preview_image_url: string
  demo_url: string
}

function TemplatesInner({ id }: { id: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)
  const [activeCategory, setActiveCategory] = useState("Semua")

  useEffect(() => {
    Promise.all([
      fetch("/api/web-templates").then(r => r.json()),
      fetch(`/api/dashboard/${id}/web-invitation`).then(r => r.json()),
    ]).then(([tplData, invData]) => {
      setTemplates(tplData.templates || [])
      if (invData.template) setSelectedId(invData.template.id)
    })
  }, [id])

  const categories = ["Semua", ...new Set(
    templates.map(t => t.category).filter((c): c is string => !!c)
  )]

  const filtered = activeCategory === "Semua"
    ? templates
    : templates.filter(t => t.category === activeCategory)

  const handleSelect = async (templateId: string) => {
    setSaving(true)
    await fetch(`/api/dashboard/${id}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_template_id: templateId }),
    })
    setSelectedId(templateId)
    setSaving(false)
    router.back()
  }

  return (
    <>
      <PageTheme mode="light" />
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm h-16 flex items-center justify-between px-edge-margin-mobile border-b border-outline-variant/30">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-on-surface hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Kembali</span>
        </button>
        <div className="w-8" />
      </header>

      <main className="pt-24 pb-32 px-edge-margin-mobile max-w-container-max mx-auto bg-background">
        <section className="mb-10 fade-in">
          <h1 className="font-headline-lg text-[28px] leading-tight mb-3">Pilih Undangan Digital Anda</h1>
        </section>

        <section className="mb-8 fade-in -mx-edge-margin-mobile">
          <div className="flex overflow-x-auto no-scrollbar gap-2 px-edge-margin-mobile pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 font-label-md text-[11px] uppercase tracking-wider transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10">
          {filtered.map(tpl => (
            <article key={tpl.id} className="group flex flex-col">
              <div
                className="relative mb-4 overflow-hidden aspect-[3/4] bg-surface-container shadow-sm cursor-pointer"
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
                  src={tpl.preview_image_url}
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
              </div>

              <div className="flex flex-col flex-grow">
                {tpl.category && (
                  <span className="font-label-md text-[9px] uppercase tracking-[0.15em] text-on-surface-variant mb-1">
                    {tpl.category}
                  </span>
                )}
                <h2 className="font-headline-md text-[16px] leading-tight mb-3">{tpl.name}</h2>
                <button
                  onClick={() => handleSelect(tpl.id)}
                  disabled={saving || selectedId === tpl.id}
                  className={`mt-auto w-full py-3 font-label-md text-[10px] uppercase tracking-widest border transition-all duration-300 ${
                    selectedId === tpl.id
                      ? "border-primary/30 text-on-surface-variant bg-surface-container cursor-default"
                      : "border-primary text-primary hover:bg-primary hover:text-on-primary"
                  }`}
                >
                  {selectedId === tpl.id ? "Terpilih" : saving ? "Menyimpan..." : "Pilih"}
                </button>
              </div>
            </article>
          ))}
        </div>
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
