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
  const [guestPreview, setGuestPreview] = useState("")
  const [activeSection, setActiveSection] = useState<string>("sampul")
  const [showMobilePreview, setShowMobilePreview] = useState(false)
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
  const [giftShowAddress, setGiftShowAddress] = useState(false)
  const [giftAddressText, setGiftAddressText] = useState("")
  const [giftAddressId, setGiftAddressId] = useState<string | null>(null)

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
        setGiftShowAddress(true)
        setGiftAddressText(active.full_address)
        setGiftAddressId(active.id)
      }
    }
  }, [id])

  useEffect(() => { loadGiftData() }, [loadGiftData])

  const addGiftAccount = async () => {
    const res = await fetch("/api/gift-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wedding_profile_id: id,
        type: "bank",
        provider_name: "BCA",
        account_number: "",
        account_name: "",
        is_active: true,
      }),
    })
    if (res.ok) {
      const { account } = await res.json()
      setGiftAccounts(prev => [...prev, account])
    }
  }

  const deleteGiftAccount = async (acctId: string) => {
    const res = await fetch(`/api/gift-accounts/${acctId}`, { method: "DELETE" })
    if (res.ok) setGiftAccounts(prev => prev.filter(a => a.id !== acctId))
  }

  const updateGiftAccount = async (acctId: string, field: string, value: string) => {
    setGiftAccounts(prev => prev.map(a => a.id === acctId ? { ...a, [field]: value } : a))
    await fetch(`/api/gift-accounts/${acctId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
  }

  const saveGiftAddress = async (address: string) => {
    setGiftAddressText(address)
    if (giftAddressId) {
      await fetch(`/api/gift-addresses/${giftAddressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_address: address }),
      })
    }
  }

  const toggleGiftAddress = async () => {
    if (giftShowAddress) {
      if (giftAddressId) {
        await fetch(`/api/gift-addresses/${giftAddressId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: false }),
        })
      }
      setGiftShowAddress(false)
    } else {
      if (!giftAddressId) {
        const res = await fetch("/api/gift-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: id,
            label: "Rumah",
            recipient_name: "",
            full_address: "",
            is_active: true,
          }),
        })
        if (res.ok) {
          const { address } = await res.json()
          setGiftAddressId(address.id)
        }
      } else {
        await fetch(`/api/gift-addresses/${giftAddressId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        })
      }
      setGiftShowAddress(true)
    }
  }

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

  const BANK_OPTIONS = ["BCA", "Mandiri", "BNI", "BRI", "CIMB Niaga", "BSI", "Permata", "Danamon", "Maybank", "OCBC NISP", "SeaBank", "Bank Jago", "ShopeePay", "GoPay", "OVO", "DANA", "LinkAja"]

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

            {/* Konfirmasi — desktop only */}
            <button
              onClick={handlePublish}
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
          <aside className="w-full md:w-[440px] bg-surface-container-low border-r border-outline-variant flex flex-col h-full z-40 shrink-0">
            <div className="flex border-b border-outline-variant">
              <button className="flex-1 py-4 font-label-md text-label-md text-primary border-b-2 border-primary text-center">KONTEN</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {/* Mobile preview toggle */}
              {showMobilePreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="iphone-frame w-[390px] h-[780px] bg-white overflow-hidden relative shadow-2xl scale-[0.72] origin-top">
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
                      {(() => {
                        const LiveComp = template?.code ? getTemplateComponent(template.code) : null
                        return LiveComp ? (
                          <LiveComp
                            bride_name={data.bride_name || ""}
                            groom_name={data.groom_name || ""}
                            estimated_wedding_date={data.estimated_wedding_date || ""}
                            slug={data.slug || ""}
                            guest_name={guestPreview || "Tamu Undangan"}
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
                            gift_accounts={giftAccounts.length > 0 ? giftAccounts.map(a => ({ provider_name: a.provider_name, account_number: a.account_number, account_name: a.account_name, type: a.type })) : undefined}
                            gift_address={giftShowAddress ? giftAddressText || undefined : undefined}
                            track_url={selectedTrack?.audio_url || undefined}
                            auto_play={autoPlay || undefined}
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-on-surface-variant font-body-md">
                            Pilih template untuk melihat pratinjau
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
              <>
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
                  <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">DAFTAR REKENING / E-WALLET</label>
                  {giftAccounts.length === 0 && (
                    <p className="font-body-md text-sm text-on-surface-variant">Belum ada rekening ditambahkan.</p>
                  )}
                  {giftAccounts.map(acc => (
                    <div key={acc.id} className="p-3 border border-outline-variant rounded-lg space-y-2 relative">
                      <button
                        onClick={() => deleteGiftAccount(acc.id!)}
                        className="absolute top-2 right-2 text-on-surface-variant hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                      <select
                        className="w-full border-b border-outline-variant py-1 font-body-md text-sm"
                        value={acc.provider_name}
                        onChange={e => updateGiftAccount(acc.id!, "provider_name", e.target.value)}
                      >
                        <option value="">Pilih Bank/E-Wallet</option>
                        {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <input
                        className="w-full border-b border-outline-variant py-1 font-body-md text-sm"
                        placeholder="Nomor Rekening"
                        value={acc.account_number}
                        onChange={e => updateGiftAccount(acc.id!, "account_number", e.target.value)}
                      />
                      <input
                        className="w-full border-b border-outline-variant py-1 font-body-md text-sm"
                        placeholder="Atas Nama"
                        value={acc.account_name}
                        onChange={e => updateGiftAccount(acc.id!, "account_name", e.target.value)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={addGiftAccount}
                    className="text-primary font-label-md text-[11px] tracking-widest uppercase flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    + TAMBAH REKENING
                  </button>
                  <hr className="border-outline-variant" />
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Tampilkan Alamat Pengiriman</span>
                      <button
                        onClick={toggleGiftAddress}
                        className={`w-10 h-5 rounded-full transition-colors relative ${giftShowAddress ? "bg-primary" : "bg-outline-variant"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${giftShowAddress ? "translate-x-5 left-0" : "left-0.5"}`} />
                      </button>
                    </label>
                    {giftShowAddress && (
                      <textarea
                        className="input-editorial w-full font-body-md text-[14px] h-24 resize-none"
                        placeholder="Masukkan alamat pengiriman..."
                        value={giftAddressText}
                        onChange={e => saveGiftAddress(e.target.value)}
                      />
                    )}
                  </div>
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
              {renderCollapsed("mail", "RSVP")}
              </>)}
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
                        gift_accounts={giftAccounts.length > 0 ? giftAccounts.map(a => ({ provider_name: a.provider_name, account_number: a.account_number, account_name: a.account_name, type: a.type })) : undefined}
                        gift_address={giftShowAddress ? giftAddressText || undefined : undefined}
                        track_url={selectedTrack?.audio_url || undefined}
                        auto_play={autoPlay || undefined}
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowMobilePreview(prev => !prev)}
              className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-surface-container-high text-on-surface-variant"
            >
              {showMobilePreview ? "EDIT" : "PRATINJAU"}
            </button>
            <button
              onClick={handlePublish}
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
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <EditorInner id={id} />
}