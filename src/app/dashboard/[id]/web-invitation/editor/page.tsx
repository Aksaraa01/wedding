"use client"

import { useState, useEffect, use, useRef, useCallback, ComponentType } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { getTemplateComponent } from "@/components/templates"

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
  couple_illustration_url: string | null
  grayscale: boolean
  is_published: boolean
  groom_full_name: string | null
  bride_full_name: string | null
  groom_photo_url: string | null
  bride_photo_url: string | null
  groom_parents: string | null
  bride_parents: string | null
  groom_instagram: string | null
  estimated_wedding_date: string | null
}

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function EditorInner({ id }: { id: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [data, setData] = useState<Record<string, any>>({})
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [guestPreview, setGuestPreview] = useState("")
  const [activeSection, setActiveSection] = useState<string>("sampul")
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const coverFileRef = useRef<HTMLInputElement>(null)
  const groomPhotoRef = useRef<HTMLInputElement>(null)
  const bridePhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/dashboard/${id}/web-invitation`)
      .then(r => r.json())
      .then(res => {
        setProfile(res.profile)
        setTemplate(res.template)
        const p = res.profile
        const display = p.bride_name && p.groom_name ? `${p.bride_name} & ${p.groom_name}` : ""
        setData({
          ...p,
          display_name: display,
        })
      })
  }, [id])

  const save = useCallback((updates: Record<string, any>) => {
    setSaveStatus("saving")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error("Save failed")
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 600)
  }, [id])

  const updateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    save({ [field]: value })
  }

  const handleImageUpload = async (file: File, field: string) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    updateField(field, url)
  }

  const handlePublish = async () => {
    await fetch(`/api/dashboard/${id}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: true }),
    })
    setData(prev => ({ ...prev, is_published: true }))
  }

  const handleSectionToggle = (section: string) => {
    setActiveSection(prev => prev === section ? prev : section)
  }

  const renderSection = (key: string, icon: string, label: string, content: React.ReactNode) => {
    const isActive = activeSection === key
    return (
      <div className={` border border-outline-variant ${isActive ? "bg-white" : "opacity-60"}`}>
        <button
          onClick={() => handleSectionToggle(key)}
          className={`w-full flex justify-between items-center py-4 px-4 transition-colors ${isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
        >
          <span className="font-label-md text-label-md flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </span>
          <span className="material-symbols-outlined">{isActive ? "expand_less" : "expand_more"}</span>
        </button>
        {isActive && <div className="px-4 pb-6">{content}</div>}
      </div>
    )
  }

  const renderCollapsed = (icon: string, label: string) => {
    const key = label.toLowerCase()
    return (
      <button
        onClick={() => handleSectionToggle(key)}
        className="w-full flex justify-between items-center py-4 px-2 border-b border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="font-label-md text-label-md flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          {label}
        </span>
        <span className="material-symbols-outlined">expand_more</span>
      </button>
    )
  }

  const saveStatusLabel = saveStatus === "saving" ? "Menyimpan..." : saveStatus === "error" ? "Gagal menyimpan" : "Tersimpan Otomatis"
  const saveStatusColor = saveStatus === "saving" ? "bg-amber-500" : saveStatus === "error" ? "bg-red-500" : "bg-emerald-500"
  const isPublished = data.is_published === true

  return (
    <>
      <PageTheme mode="light" />
      <div className="h-screen flex flex-col bg-surface text-on-surface font-body-md overflow-hidden">

        {/* TOP BAR */}
        <header className="bg-surface border-b border-outline-variant flex justify-between items-center px-6 lg:px-12 w-full h-20 z-50 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push(`/dashboard/${id}/web-invitation`)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-label-md text-label-md hidden sm:inline">DASHBOARD</span>
            </button>
            <div className="h-8 w-px bg-outline-variant hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="font-headline-md text-[20px] text-primary tracking-tight font-bold">{data.display_name || "Undangan"}</h1>
              <p className="font-label-md text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${saveStatusColor}`} />
                {saveStatusLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Guest preview — desktop only */}
            <div className="hidden xl:flex items-center gap-2 bg-surface-container-low px-4 py-2 border border-outline-variant">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
              <input
                className="bg-transparent border-none focus:ring-0 font-label-md text-label-md w-40 text-on-surface"
                placeholder="Tes Nama Tamu..."
                value={guestPreview}
                onChange={e => setGuestPreview(e.target.value)}
              />
            </div>

            {/* Tool icons */}
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button className="hover:text-primary transition-colors hidden sm:flex"><span className="material-symbols-outlined">devices</span></button>
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">undo</span></button>
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">redo</span></button>
            </div>

            {/* Ganti Tema */}
            <button
              onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
              className="hidden md:flex items-center gap-2 px-6 py-3 border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all font-label-md text-label-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">palette</span>
              GANTI TEMA
            </button>

            {/* Konfirmasi */}
            <button
              onClick={handlePublish}
              disabled={isPublished}
              className={`px-8 py-3 font-label-md text-label-md transition-all active:scale-95 ${
                isPublished
                  ? "bg-surface-container-high text-on-surface-variant cursor-default border border-outline-variant"
                  : "bg-secondary text-on-secondary hover:opacity-90 border border-secondary"
              }`}
            >
              {isPublished ? "TERKONFIRMASI" : "KONFIRMASI"}
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-full md:w-[440px] bg-surface-container-low border-r border-outline-variant flex flex-col h-full z-40 shrink-0">
            <div className="flex border-b border-outline-variant">
              <button className="flex-1 py-4 font-label-md text-label-md text-primary border-b-2 border-primary text-center">KONTEN</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {renderSection("sampul", "photo_album", "SAMPUL",
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Foto Sampul Utama</label>
                    <div
                      onClick={() => coverFileRef.current?.click()}
                      className="w-full aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden"
                    >
                      {(data.couple_illustration_url) && (
                        <div className={`absolute inset-0 bg-cover bg-center ${data.grayscale ? "grayscale" : ""}`} style={{ backgroundImage: `url(${data.couple_illustration_url})` }} />
                      )}
                      <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>
                    </div>
                    <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "couple_illustration_url") }} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama Mempelai</label>
                    <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.display_name || ""} onChange={e => updateField("display_name", e.target.value)} />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-outline-variant">
                    <div className="flex justify-between items-center">
                      <span className="font-label-md text-label-md">Filter Black &amp; White</span>
                      <button onClick={() => updateField("grayscale", !data.grayscale)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${data.grayscale ? "bg-secondary" : "bg-outline-variant"}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${data.grayscale ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {renderSection("profile", "group", "PROFILE MEMPELAI",
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Pria</label>
                    <div className="flex gap-4 items-end">
                      <div onClick={() => groomPhotoRef.current?.click()} className="w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0">
                        {data.groom_photo_url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.groom_photo_url})` }} />}
                        {!data.groom_photo_url && <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>}
                        {data.groom_photo_url && <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>}
                      </div>
                      <input ref={groomPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "groom_photo_url") }} />
                      <div className="flex-1">
                        <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.groom_full_name || ""} onChange={e => updateField("groom_full_name", e.target.value)} placeholder="Nama Lengkap Pria" />
                        <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Lengkap Pria</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Wanita</label>
                    <div className="flex gap-4 items-end">
                      <div onClick={() => bridePhotoRef.current?.click()} className="w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0">
                        {data.bride_photo_url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.bride_photo_url})` }} />}
                        {!data.bride_photo_url && <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>}
                        {data.bride_photo_url && <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>}
                      </div>
                      <input ref={bridePhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "bride_photo_url") }} />
                      <div className="flex-1">
                        <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.bride_full_name || ""} onChange={e => updateField("bride_full_name", e.target.value)} placeholder="Nama Lengkap Wanita" />
                        <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Lengkap Wanita</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {renderCollapsed("calendar_today", "ACARA")}
              {renderCollapsed("format_quote", "KUTIPAN")}
              {renderCollapsed("auto_stories", "STORY")}
              {renderCollapsed("collections", "GALERI")}
              {renderCollapsed("featured_seasonal_and_gifts", "GIFT")}
              {renderCollapsed("music_note", "MUSIC")}
              {renderCollapsed("mail", "RSVP")}
            </div>
          </aside>

          {/* CANVAS */}
          <section className="hidden md:flex flex-1 bg-surface relative overflow-hidden items-center justify-center p-12"
            style={{ backgroundImage: "linear-gradient(#e5e1d8 1px, transparent 1px), linear-gradient(90deg, #e5e1d8 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          >
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-10">
              <button className="w-12 h-12 bg-white border border-outline-variant shadow-sm flex items-center justify-center hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">zoom_in</span></button>
              <button className="w-12 h-12 bg-white border border-outline-variant shadow-sm flex items-center justify-center hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">zoom_out</span></button>
              <button className="w-12 h-12 bg-white border border-outline-variant shadow-sm flex items-center justify-center hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">center_focus_strong</span></button>
            </div>

            <div className="iphone-frame w-[390px] h-[780px] bg-white overflow-hidden relative shadow-2xl scale-95 origin-center">
              <div className="absolute top-0 inset-x-0 h-10 px-8 flex justify-between items-end pb-1 z-[100] text-black pointer-events-none">
                <span className="text-[12px] font-bold">9:41</span>
                <div className="flex gap-1 items-center">
                  <span className="material-symbols-outlined text-[14px]">signal_cellular_4_bar</span>
                  <span className="material-symbols-outlined text-[14px]">wifi</span>
                  <span className="material-symbols-outlined text-[14px]">battery_full</span>
                </div>
              </div>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-tertiary rounded-full z-[101]" />

              <div className="h-full w-full overflow-y-auto custom-scrollbar">
                {template?.demo_url ? (
                  <iframe src={template.demo_url} className="w-full h-full border-0" title="Demo" />
                ) : (() => {
                  const LiveComp = template?.code ? getTemplateComponent(template.code) : null
                  return LiveComp ? (
                    <LiveComp
                      bride_name={data.bride_name || ""}
                      groom_name={data.groom_name || ""}
                      estimated_wedding_date={data.estimated_wedding_date || ""}
                      slug={data.slug || ""}
                      guest_name={guestPreview || "Tamu Undangan"}
                      couple_illustration_url={data.couple_illustration_url || undefined}
                      grayscale={data.grayscale}
                      groom_full_name={data.groom_full_name || undefined}
                      bride_full_name={data.bride_full_name || undefined}
                      groom_photo_url={data.groom_photo_url || undefined}
                      bride_photo_url={data.bride_photo_url || undefined}
                      groom_parents={data.groom_parents || undefined}
                      bride_parents={data.bride_parents || undefined}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-on-surface-variant font-body-md">
                      Pilih template untuk melihat pratinjau
                    </div>
                  )
                })()}
              </div>
            </div>
          </section>
        </main>

        {/* MOBILE BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-sm z-50 border-t border-outline-variant">
          <button
            onClick={handlePublish}
            disabled={isPublished}
            className={`w-full py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform ${
              isPublished
                ? "bg-surface-container-high text-on-surface-variant cursor-default"
                : "bg-secondary text-on-secondary"
            }`}
          >
            {isPublished ? "TERKONFIRMASI" : "KONFIRMASI"}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D8; }
        .iphone-frame { box-shadow: 0 0 0 12px #1a1a1a, 0 0 0 13px #333; border-radius: 44px; }
        .input-editorial { border: none; border-bottom: 1px solid #1A1A1A; background: transparent; padding: 8px 0; border-radius: 0; outline: none; transition: border-width 0.1s ease; width: 100%; font-family: 'Playfair Display', serif; font-size: 18px; }
        .input-editorial:focus { border-bottom-width: 2px; box-shadow: none; outline: none; }
      `}</style>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditorInner id={id} />
}