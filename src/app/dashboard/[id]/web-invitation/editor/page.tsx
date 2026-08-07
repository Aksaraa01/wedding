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
  sessions: Session[] | null
  display_name: string | null
  inviting_families: string[] | null
  rsvp_max_pax: number | null
}

type Session = {
  name: string
  date: string
  time: string
  timezone: string
  venue: string
  address: string
  maps_url: string
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
  const [activeSection, setActiveSection] = useState<string>("sampul")
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")
  const [rsvpMaxDraft, setRsvpMaxDraft] = useState<string | null>(null)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showH3Reminder, setShowH3Reminder] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(true)
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
        setData({
          ...p,
          display_name: p.display_name || (p.bride_name && p.groom_name ? `${p.bride_name} & ${p.groom_name}` : ""),
          inviting_families: Array.isArray(p.inviting_families) ? p.inviting_families : [],
        })
        const sessions = Array.isArray(p.sessions) ? p.sessions.map((s: any) => s?.date).filter(Boolean) : []
        const weddingDate = sessions[0] || p.estimated_wedding_date || ""
        if (weddingDate) {
          const days = Math.ceil((new Date(`${weddingDate}T00:00:00`).getTime() - Date.now()) / 86400000)
          if (days >= 0 && days <= 30) setShowH3Reminder(true)
        }
      })
  }, [id])

  useEffect(() => {
    fetch(`/api/feedback-submissions?wedding_profile_id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(res => setFeedbackCount(res?.submissions?.length ?? 0))
      .catch(() => setFeedbackCount(0))
      .finally(() => setFeedbackLoading(false))
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

  const sessions: Session[] = Array.isArray(data.sessions) ? data.sessions : []

  const updateSession = (index: number, field: keyof Session, value: string) => {
    const updated = sessions.map((s, i) => i === index ? { ...s, [field]: value } : s)
    updateField("sessions", updated)
  }

  const addSession = () => {
    updateField("sessions", [...sessions, {
      name: `Sesi ${sessions.length + 1}`,
      date: "",
      time: "",
      timezone: "WIB",
      venue: "",
      address: "",
      maps_url: "",
    }])
  }

  const removeSession = (index: number) => {
    updateField("sessions", sessions.filter((_, i) => i !== index))
  }

  const testMapsLink = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  const stories: any[] = Array.isArray(data.stories) ? data.stories : []

  const updateStory = (index: number, field: string, value: string) => {
    const updated = stories.map((s, i) => i === index ? { ...s, [field]: value } : s)
    updateField("stories", updated)
  }

  const addStory = () => {
    updateField("stories", [...stories, { year: "", title: "", description: "", image_url: "" }])
  }

  const removeStory = (index: number) => {
    updateField("stories", stories.filter((_: any, i: number) => i !== index))
  }

  const handleStoryImageUpload = async (file: File, index: number) => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    updateStory(index, "image_url", url)
  }

  const storyFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const galleryPhotos: string[] = Array.isArray(data.gallery_photos) ? data.gallery_photos : []

  const addGalleryPhoto = async (file: File) => {
    if (galleryPhotos.length >= 10) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    updateField("gallery_photos", [...galleryPhotos, url])
  }

  const removeGalleryPhoto = (index: number) => {
    updateField("gallery_photos", galleryPhotos.filter((_, i) => i !== index))
  }

  const galleryFileRef = useRef<HTMLInputElement>(null)

  type GiftAccount = { id?: string; provider_name: string; account_number: string; account_name: string; type: string }
  const [giftAccounts, setGiftAccounts] = useState<GiftAccount[]>([])
  const [giftAddressText, setGiftAddressText] = useState("")

  const loadGiftData = useCallback(async () => {
    const [acctRes, addrRes] = await Promise.all([
      fetch(`/api/gift-accounts?wedding_profile_id=${id}`),
      fetch(`/api/gift-addresses?wedding_profile_id=${id}`),
    ])
    if (acctRes.ok) {
      const { accounts } = await acctRes.json()
      setGiftAccounts(accounts.filter((a: any) => a.type === "bank" || a.type === "ewallet"))
    }
    if (addrRes.ok) {
      const { addresses } = await addrRes.json()
      const active = addresses.find((a: any) => a.is_active)
      if (active) {
        setGiftAddressText(active.full_address)
      }
    }
  }, [id])

  useEffect(() => { loadGiftData() }, [loadGiftData])

  type Track = { id: string; title: string; artist: string | null; mood_category: string; audio_url: string }
  const [allTracks, setAllTracks] = useState<Track[]>([])
  const [trackSearch, setTrackSearch] = useState("")
  const [autoPlay, setAutoPlay] = useState(false)

  useEffect(() => {
    fetch("/api/tracks").then(r => r.ok && r.json()).then(res => {
      if (res?.tracks) setAllTracks(res.tracks)
    })
  }, [])

  const filteredTracks = allTracks.filter(t =>
    t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
    (t.artist && t.artist.toLowerCase().includes(trackSearch.toLowerCase()))
  )

  const selectedTrack = allTracks.find(t => t.id === data.selected_track_id)

  const handleSelectTrack = (trackId: string) => {
    updateField("selected_track_id", data.selected_track_id === trackId ? null : trackId)
  }

  const handlePublish = async () => {
    await fetch(`/api/dashboard/${id}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: true }),
    })
    setData(prev => ({ ...prev, is_published: true }))
  }

  const getEmptyContent = () => {
    let families: any[] = []
    try {
      const f = typeof data.inviting_families === "string" ? JSON.parse(data.inviting_families) : data.inviting_families
      families = Array.isArray(f) ? f : []
    } catch {}
    const items = [
      { label: "Nama Mempelai (Nama yang ditampilkan)", filled: !!data.display_name },
      { label: "Foto Sampul", filled: !!data.couple_illustration_url },
      { label: "Foto Mempelai", filled: !!(data.groom_photo_url && data.bride_photo_url) },
      { label: "Nama Lengkap Mempelai", filled: !!(data.groom_full_name && data.bride_full_name) },
      { label: "Nama Orang Tua Mempelai", filled: !!(data.groom_parents && data.bride_parents) },
      { label: "Tanggal & Sesi Acara", filled: Array.isArray(data.sessions) && data.sessions.length > 0 },
      { label: "Kisah Cinta", filled: Array.isArray(data.stories) && data.stories.length > 0 },
      { label: "Galeri Foto", filled: Array.isArray(data.gallery_photos) && data.gallery_photos.length > 0 },
      { label: "Turut Mengundang", filled: families.length > 0 },
      { label: "Kutipan", filled: !!data.quote_text },
    ]
    return items.filter(i => !i.filled).map(i => i.label)
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

  const saveStatusLabel = saveStatus === "saving" ? "Menyimpan..." : saveStatus === "error" ? "Gagal menyimpan" : "Tersimpan Otomatis"
  const saveStatusColor = saveStatus === "saving" ? "bg-amber-500" : saveStatus === "error" ? "bg-red-500" : "bg-emerald-500"
  const isPublished = data.is_published === true

  const renderPreviewBody = () => {
    if (template?.demo_url) {
      return <iframe src={template.demo_url} className="w-full h-full border-0" title="Demo" />
    }
    const LiveComp = template?.code ? getTemplateComponent(template.code) : null
    if (!LiveComp) {
      return (
        <div className="h-full flex items-center justify-center text-on-surface-variant font-body-md">
          Pilih template untuk melihat pratinjau
        </div>
      )
    }
    return (
      <LiveComp
        bride_name={data.bride_name || ""}
        groom_name={data.groom_name || ""}
        estimated_wedding_date={data.estimated_wedding_date || ""}
        slug={data.slug || ""}
        guest_name="Tamu Undangan"
        guest_id="preview"
        guest_qr_token="preview"
        guest_table_number="Meja 5"
        guest_qr_url={`/qr/preview?preview=1&slug=${encodeURIComponent(data.slug || "")}&couple=${encodeURIComponent(data.display_name || `${data.bride_name || ""} & ${data.groom_name || ""}`)}&date=${encodeURIComponent(data.estimated_wedding_date || "")}&time=${encodeURIComponent(sessions[0]?.time || "")}&venue=${encodeURIComponent(sessions[0]?.venue || "")}&address=${encodeURIComponent(sessions[0]?.address || "")}`}
        display_name={data.display_name || undefined}
        sessions={sessions.length > 0 ? sessions : undefined}
        quote_text={data.quote_text || undefined}
        quote_source={data.quote_source || undefined}
        stories={stories.length > 0 ? stories : undefined}
        gallery_photos={galleryPhotos.length > 0 ? galleryPhotos : undefined}
        couple_illustration_url={data.couple_illustration_url || undefined}
        grayscale={data.grayscale}
        groom_full_name={data.groom_full_name || undefined}
        bride_full_name={data.bride_full_name || undefined}
        groom_photo_url={data.groom_photo_url || undefined}
        bride_photo_url={data.bride_photo_url || undefined}
        groom_parents={data.groom_parents || undefined}
        bride_parents={data.bride_parents || undefined}
        inviting_families={Array.isArray(data.inviting_families) ? data.inviting_families.filter(Boolean) : undefined}
        gift_accounts={giftAccounts.length > 0 ? giftAccounts.map(a => ({ provider_name: a.provider_name, account_number: a.account_number, account_name: a.account_name, type: a.type })) : undefined}
        gift_address={giftAddressText || undefined}
        track_url={selectedTrack?.audio_url || undefined}
        auto_play={autoPlay || undefined}
        rsvp_max_pax={data.rsvp_max_pax ?? 2}
      />
    )
  }

  return (
    <>
      <PageTheme mode="light" />
      <div className="h-screen flex flex-col bg-surface text-on-surface font-body-md overflow-hidden">

        {/* TOP BAR */}
        <header className="bg-surface border-b border-outline-variant flex justify-between items-center px-6 lg:px-12 w-full h-20 z-50 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => router.push(`/dashboard/${id}`)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
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
            {/* Tool icons */}
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button onClick={() => setPreviewDevice(prev => prev === "mobile" ? "desktop" : "mobile")} className="hover:text-primary transition-colors hidden sm:flex"><span className="material-symbols-outlined">devices</span></button>
            </div>

            {/* Ganti Tema */}
            <button
              onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
              className="flex items-center gap-2 px-6 py-3 border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all font-label-md text-label-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">palette</span>
              <span className="hidden sm:inline">GANTI TEMA</span>
            </button>

            {/* Konfirmasi — desktop only */}
            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isPublished}
              className={`hidden md:flex px-8 py-3 font-label-md text-label-md transition-all active:scale-95 ${
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
          <aside className={`${showMobilePreview ? 'hidden' : 'flex'} md:flex w-full md:w-[440px] bg-surface-container-low border-r border-outline-variant flex-col h-full z-40 shrink-0`}>
            <div className="flex border-b border-outline-variant">
              <button className="flex-1 py-4 font-label-md text-label-md text-primary border-b-2 border-primary text-center">KONTEN</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 space-y-4 md:pb-6">
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
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.groom_parents || ""} onChange={e => updateField("groom_parents", e.target.value)} placeholder="Nama Orang Tua Pria" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Bapak Hendra & Ibu Sari</p>
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
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.bride_parents || ""} onChange={e => updateField("bride_parents", e.target.value)} placeholder="Nama Orang Tua Wanita" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Bapak Wijaya & Ibu Dewi</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Turut Mengundang</label>
                    <p className="text-[11px] text-on-surface-variant italic">Masukkan nama keluarga yang turut mengundang</p>
                    <div className="space-y-3">
                      {(Array.isArray(data.inviting_families) ? data.inviting_families : []).map((f, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            className="input-editorial w-full font-headline-md text-[16px]"
                            type="text"
                            value={f || ""}
                            onChange={e => {
                              const arr = [...(Array.isArray(data.inviting_families) ? data.inviting_families : [])]
                              arr[i] = e.target.value
                              updateField("inviting_families", arr)
                            }}
                            placeholder={`Keluarga ${i + 1}`}
                          />
                          <button
                            onClick={() => {
                              const arr = (Array.isArray(data.inviting_families) ? data.inviting_families : []).filter((_, idx) => idx !== i)
                              updateField("inviting_families", arr)
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    {(Array.isArray(data.inviting_families) ? data.inviting_families : []).length < 5 && (
                      <button
                        onClick={() => {
                          const arr = [...(Array.isArray(data.inviting_families) ? data.inviting_families : []), ""]
                          updateField("inviting_families", arr)
                        }}
                        className="flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-widest hover:opacity-70 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Tambah Keluarga
                      </button>
                    )}
                  </div>
                </div>
              )}

              {renderSection("acara", "calendar_today", "ACARA",
                <div className="mt-6 space-y-8">
                  {sessions.map((session, i) => (
                    <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className="input-editorial font-label-md text-[14px] font-bold uppercase tracking-wider flex-1"
                            style={{ color: "#8D4D39" }}
                            value={session.name}
                            onChange={e => updateSession(i, "name", e.target.value)}
                          />
                        </div>
                        {sessions.length > 1 && (
                          <button onClick={() => removeSession(i)} className="text-red-500 hover:text-red-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                          <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Tanggal</label>
                          <input className="input-editorial w-full font-label-md text-[14px]" type="date" value={session.date} onChange={e => updateSession(i, "date", e.target.value)} />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Waktu</label>
                          <input className="input-editorial w-full font-label-md text-[14px]" type="text" value={session.time} onChange={e => updateSession(i, "time", e.target.value)} placeholder="08:00 - 10:00" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Zona Waktu</label>
                        <select className="input-editorial w-full font-label-md text-[14px] appearance-none" value={session.timezone} onChange={e => updateSession(i, "timezone", e.target.value)}>
                          <option value="WIB">WIB</option>
                          <option value="WITA">WITA</option>
                          <option value="WIT">WIT</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Tempat</label>
                        <input className="input-editorial w-full font-label-md text-[14px]" type="text" value={session.venue} onChange={e => updateSession(i, "venue", e.target.value)} placeholder="Nama venue atau lokasi" />
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Alamat Lengkap</label>
                        <textarea className="input-editorial w-full font-label-md text-[14px] min-h-[60px] resize-none" placeholder="Masukkan alamat lengkap..." value={session.address} onChange={e => updateSession(i, "address", e.target.value)} />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Link Google Maps</label>
                          <input className="input-editorial w-full font-label-md text-[14px]" placeholder="https://maps.google.com/..." type="text" value={session.maps_url} onChange={e => updateSession(i, "maps_url", e.target.value)} />
                        </div>
                        <button onClick={() => testMapsLink(session.maps_url)} className="bg-surface-container-highest px-3 py-1 text-[10px] font-bold text-primary border border-outline-variant mb-2">UJI LINK</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addSession} className="w-full py-4 border border-dashed border-outline-variant text-secondary font-label-md text-label-md uppercase tracking-wider hover:bg-surface-container-lowest transition-colors">
                    + TAMBAH SESI ACARA LAIN
                  </button>
                </div>
              )}

              {renderSection("kutipan", "format_quote", "KUTIPAN",
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Pilih Kutipan Populer</label>
                    <select
                      className="input-editorial w-full font-body-md text-[14px] cursor-pointer"
                      value={data.quote_source || ""}
                      onChange={e => {
                        const source = e.target.value
                        updateField("quote_source", source)
                        if (source === "Ar-Rum: 21") {
                          updateField("quote_text", "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya; dan dijadikan-Nya diantaramu rasa kasih dan sayang.")
                          updateField("quote_source", "QS. Ar-Rum: 21")
                        } else if (source === "Matius 19:6") {
                          updateField("quote_text", "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.")
                          updateField("quote_source", "Matius 19:6")
                        } else if (source === "Custom") {
                          updateField("quote_text", "")
                          updateField("quote_source", "")
                        }
                      }}
                    >
                      <option value="">-- Pilih Kutipan --</option>
                      <option value="Ar-Rum: 21">Ar-Rum: 21</option>
                      <option value="Matius 19:6">Matius 19:6</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Isi Kutipan</label>
                    <textarea
                      className="input-editorial w-full font-body-md text-[14px] h-32 resize-none"
                      value={data.quote_text || ""}
                      onChange={e => updateField("quote_text", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Sumber / Penulis</label>
                    <input
                      className="input-editorial w-full font-body-md text-[14px]"
                      type="text"
                      value={data.quote_source || ""}
                      onChange={e => updateField("quote_source", e.target.value)}
                    />
                  </div>
                </div>
              )}
              {renderSection("story", "auto_stories", "STORY",
                <div className="mt-6 space-y-8">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block">CURATE YOUR LOVE STORY</label>
                  {stories.map((story: any, i: number) => (
                    <div key={i} className="p-4 bg-surface-container-low border border-outline-variant space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[10px] text-secondary uppercase">MILESTONE {i + 1}</span>
                        <button onClick={() => removeStory(i)} className="text-red-500 hover:text-red-700 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <div
                          onClick={() => storyFileRefs.current[i]?.click()}
                          className="w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0"
                        >
                          {story.image_url ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${story.image_url})` }} />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                          )}
                        </div>
                        <input ref={el => { storyFileRefs.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleStoryImageUpload(f, i) }} />
                        <div className="flex-1 space-y-3">
                          <input className="input-editorial w-full font-label-md text-[14px]" placeholder="Tahun" type="text" value={story.year} onChange={e => updateStory(i, "year", e.target.value)} />
                          <input className="input-editorial w-full font-headline-md text-[18px]" placeholder="Judul Cerita" type="text" value={story.title} onChange={e => updateStory(i, "title", e.target.value)} />
                        </div>
                      </div>
                      <textarea className="input-editorial w-full font-body-md text-[14px] h-20 resize-none" placeholder="Ceritakan momen ini..." value={story.description} onChange={e => updateStory(i, "description", e.target.value)} />
                    </div>
                  ))}
                  <button onClick={addStory} className="w-full py-3 border border-dashed border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-highest transition-colors">
                    + TAMBAH MILESTONE BARU
                  </button>
                </div>
              )}
              {renderSection("galeri", "collections", "GALERI",
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">GALERI FOTO (MAKS. 10 FOTO)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {galleryPhotos.map((url, i) => (
                        <div key={i} className="aspect-square bg-surface-dim border border-outline-variant relative group">
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                          <button onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                      {galleryPhotos.length < 10 && (
                        <div onClick={() => galleryFileRef.current?.click()} className="aspect-square border border-dashed border-outline flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest cursor-pointer transition-colors">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          <span className="text-[8px] font-bold mt-1">TAMBAH</span>
                        </div>
                      )}
                    </div>
                    <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { addGalleryPhoto(f); e.target.value = "" } }} />
                  </div>
                </div>
              )}
              {renderSection("gift", "featured_seasonal_and_gifts", "GIFT", <>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">DAFTAR REKENING / E-WALLET</label>
                    {giftAccounts.length === 0 ? (
                      <p className="font-body-md text-sm text-on-surface-variant">Belum ada rekening ditambahkan.</p>
                    ) : (
                      giftAccounts.map(acc => (
                        <div key={acc.id} className="p-3 border border-outline-variant rounded-lg space-y-1">
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">{acc.provider_name}</p>
                          <p className="font-body-md text-sm font-semibold">{acc.account_number}</p>
                          <p className="font-body-md text-[11px] text-on-surface-variant">a.n. {acc.account_name}</p>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/${id}/amplop-digital`)}
                      className="w-full py-3 border border-primary text-primary font-label-md text-[11px] tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Atur Amplop Digital
                    </button>
                  </div>
                  {giftAddressText && (
                    <div className="p-3 border border-outline-variant rounded-lg space-y-1">
                      <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Alamat Pengiriman</p>
                      <p className="font-body-md text-sm whitespace-pre-line">{giftAddressText}</p>
                    </div>
                  )}
                </div>
              </>)}
              {renderSection("music", "music_note", "MUSIC", <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 border border-outline-variant">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
                    <input
                      className="bg-transparent border-none focus:ring-0 font-label-md text-label-md w-full text-on-surface"
                      placeholder="Cari lagu..."
                      value={trackSearch}
                      onChange={e => setTrackSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar -mx-4 px-4">
                    {filteredTracks.map(track => {
                      const isSelected = track.id === data.selected_track_id
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleSelectTrack(track.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-secondary-container/20 border border-secondary"
                              : "border border-transparent hover:bg-surface-container-low"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-label-md text-primary">{track.title}</span>
                            <span className="text-[10px] text-on-surface-variant">{track.artist || "Instrumental"}</span>
                          </div>
                          <span className={`material-symbols-outlined ${isSelected ? "text-secondary" : "text-on-surface-variant"}`}>
                            {isSelected ? "pause" : "play_arrow"}
                          </span>
                        </div>
                      )
                    })}
                    {filteredTracks.length === 0 && (
                      <p className="text-on-surface-variant font-body-md text-sm py-4 text-center">Tidak ada lagu ditemukan.</p>
                    )}
                  </div>
                  <div className="pt-4 border-t border-outline-variant space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-label-md text-label-md">Putar Otomatis</span>
                      <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${autoPlay ? "bg-secondary" : "bg-outline-variant"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoPlay ? "right-1" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </>)}
              {renderSection("rsvp", "mail", "RSVP",
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Batas Maksimum Pax</label>
                    <input
                      className="input-editorial w-full font-body-md"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={rsvpMaxDraft ?? String(data.rsvp_max_pax ?? 2)}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 2)
                        if (raw === "") {
                          setRsvpMaxDraft("")
                          return
                        }
                        const n = Math.min(10, Math.max(1, parseInt(raw, 10)))
                        setRsvpMaxDraft(null)
                        updateField("rsvp_max_pax", n)
                      }}
                      onBlur={() => {
                        if (rsvpMaxDraft === "") {
                          setRsvpMaxDraft(null)
                          updateField("rsvp_max_pax", 2)
                        }
                      }}
                    />
                    <p className="text-[11px] text-on-surface-variant italic">Jumlah maksimum tamu yang dapat hadir dalam satu undangan.</p>
                  </div>
                </div>
              )}
              {renderSection("feedback", "rate_review", "TAMBAH LAINNYA",
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {feedbackLoading ? "Memuat..." : feedbackCount === 0 ? "Belum ada feedback." : `${feedbackCount} feedback tercatat untuk undangan Anda.`}
                      </p>
                      <p className="font-body-md text-body-md text-on-surface-variant/80">Kelola, tambah, dan lihat riwayat masukan dari tim Aksaraa.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback`)}
                    className="w-full inline-flex items-center justify-center gap-2 border border-outline-variant text-on-surface font-label-md text-label-md uppercase tracking-widest py-3.5 hover:border-primary hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    Lihat &amp; Tambah Feedback
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* CANVAS */}
          <section className={`${showMobilePreview ? 'flex' : 'hidden'} md:flex flex-1 bg-surface relative overflow-hidden items-center justify-center`}
            style={{ backgroundImage: "linear-gradient(#e5e1d8 1px, transparent 1px), linear-gradient(90deg, #e5e1d8 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          >
            {previewDevice === "mobile" ? (
              <div className="hidden md:block iphone-frame w-[390px] h-[780px] bg-white overflow-hidden relative shadow-2xl" style={{ transform: "scale(0.95)", transformOrigin: "center" }}>
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
                  {renderPreviewBody()}
                </div>
              </div>
            ) : (
              <div className="hidden md:block w-full h-full p-8 flex items-center justify-center">
                <div className="w-full h-full max-w-[1200px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ transform: "scale(1)" }}>
                  <div className="flex items-center gap-3 px-4 h-11 bg-surface-container-high border-b border-outline-variant shrink-0">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                      <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <span className="text-[11px] font-label-md px-4 py-1 rounded-full bg-surface-container-low border border-outline-variant truncate max-w-[60%] text-on-surface-variant">
                        https://{data.slug || "wedding"}.wedding.aksaraa.com
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {renderPreviewBody()}
                  </div>
                </div>
              </div>
            )}

            {showMobilePreview && (
              <div className="md:hidden w-full h-full overflow-y-auto custom-scrollbar">
                {renderPreviewBody()}
              </div>
            )}
          </section>
        </main>

        {/* MOBILE BOTTOM BAR */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-sm z-50 border-t border-outline-variant">
          <div className="flex gap-3">
            <button
              onClick={() => setShowMobilePreview(prev => !prev)}
              className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-surface-container-high text-on-surface-variant"
            >
              {showMobilePreview ? "EDIT" : "PRATINJAU"}
            </button>
            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isPublished}
              className={`flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform ${
                isPublished
                  ? "bg-surface-container-high text-on-surface-variant cursor-default"
                  : "bg-secondary text-on-secondary"
              }`}
            >
              {isPublished ? "TERKONFIRMASI" : "KONFIRMASI"}
            </button>
          </div>
        </div>

        {/* MOBILE BOTTOM BAR */}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D8; }
        .iphone-frame { box-shadow: 0 0 0 12px #1a1a1a, 0 0 0 13px #333; border-radius: 44px; }
        .input-editorial { border: none; border-bottom: 1px solid #1A1A1A; background: transparent; padding: 8px 0; border-radius: 0; outline: none; transition: border-width 0.1s ease; width: 100%; font-family: 'Playfair Display', serif; font-size: 18px; }
        .input-editorial:focus { border-bottom-width: 2px; box-shadow: none; outline: none; }
      `}</style>

      {showPublishConfirm && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowPublishConfirm(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">check_circle</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Konfirmasi Undangan?</h3>
            {(() => {
              const empty = getEmptyContent()
              return (
                <div className="mb-6">
                  {empty.length > 0 ? (
                    <>
                      <p className="text-sm text-on-surface-variant mb-2">Beberapa konten berikut masih kosong atau belum diisi:</p>
                      <ul className="mb-3 space-y-1">
                        {empty.map((label) => (
                          <li key={label} className="text-sm text-red-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">error</span> {label}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-on-surface-variant">Pastikan seluruh konten terisi sebelum mengonfirmasi undangan.</p>
                    </>
                  ) : (
                    <p className="text-sm text-on-surface-variant">Seluruh konten undangan sudah terisi. Siap untuk dikonfirmasi.</p>
                  )}
                  <p className="text-sm text-secondary font-semibold mt-3">Setelah dikonfirmasi, konten undangan tidak dapat diubah.</p>
                </div>
              )
            })()}
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => { await handlePublish(); setShowPublishConfirm(false) }}
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                Ya, Konfirmasi Undangan
              </button>
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {showH3Reminder && (
        <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowH3Reminder(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">schedule</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Undangan Mendekati Hari H</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Acara pernikahan Anda tinggal <span className="font-semibold text-primary">H-30 atau kurang</span>.
              Pastikan seluruh konten undangan sudah <span className="font-semibold">final dan dikonfirmasi</span> agar dapat
              dieksekusi oleh sistem Aksaraa tepat waktu.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowH3Reminder(false); setShowPublishConfirm(true) }}
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                Finalisasi Sekarang
              </button>
              <button
                onClick={() => setShowH3Reminder(false)}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditorInner id={id} />
}