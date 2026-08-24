"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import { pollWpJob } from "@/lib/wpJobPoll"

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
}

function TemplatesInner({ id }: { id: string }) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/${id}/web-invitation`).then(r => r.json()),
    ]).then(([invData]) => {
      const pkg = invData.profile?.package_type
      const qs = pkg ? `?package_type=${encodeURIComponent(pkg)}` : ""
      return fetch(`/api/web-templates${qs}`).then(r => r.json()).then(tplData => {
        setTemplates(tplData.templates || [])
        if (invData.template) setSelectedId(invData.template.id)
      })
    })
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
      await pollWpJob(job_id)
      setSelectedId(templateId)
      router.refresh()
      router.back()
    } catch (err) {
      console.error("[templates] duplicate failed", err)
      setError(err instanceof Error ? err.message : "Gagal menyimpan template")
      setSaving(false)
    }
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
          {templates.map(tpl => (
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
                  className="w-full h-full object-contain bg-surface-container-lowest p-2 transition-transform duration-700 group-hover:scale-105"
                  src={tpl.preview_image_url}
                />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
              </div>

              <div className="flex flex-col flex-grow">
                <h2 className="font-headline-md text-[16px] leading-tight mb-3">{tpl.name}</h2>
                <button
                  onClick={() => handleSelect(tpl.id)}
                  disabled={saving}
                  className={`mt-auto w-full py-3 font-label-md text-[10px] uppercase tracking-widest border transition-all duration-300 ${
                    selectedId === tpl.id
                      ? "border-secondary text-secondary hover:bg-secondary hover:text-white"
                      : "border-primary text-primary hover:bg-primary hover:text-on-primary"
                  }`}
                >
                  {saving ? "Menyimpan..." : selectedId === tpl.id ? "Pilih Ulang" : "Pilih"}
                </button>
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
          code={previewTpl.code}
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
