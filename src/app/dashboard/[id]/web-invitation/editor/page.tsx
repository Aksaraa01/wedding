"use client"

import { useState, useEffect, use, useRef, useCallback, ComponentType } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { getTemplateComponent } from "@/components/templates"
import { RowGates } from "@/lib/featureGates"
import { pollWpJob } from "@/lib/wpJobPoll"
import ProfileMenu from "@/components/ProfileMenu"

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
  couple_illustration_url: string | null
  cover_photos: string[] | null
  couple_initials: string | null
  grayscale: boolean
  is_published: boolean
  published_at?: string | null
  payment_status?: string | null
  groom_full_name: string | null
  bride_full_name: string | null
  groom_photo_url: string | null
  bride_photo_url: string | null
  groom_parents: string | null
  bride_parents: string | null
  groom_instagram: string | null
  bride_instagram: string | null
  video_url: string | null
  estimated_wedding_date: string | null
  sessions: Session[] | null
  display_name: string | null
  inviting_families: string[] | null
  rsvp_max_pax: number | null
  active_wp_post_id: number | null
  active_wp_post_url: string | null
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
  wp_manifest: Record<string, any> | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// Local date & time of the confirmation, e.g. "14 Agu 2026, 09:30".
function formatConfirmedAt(iso?: string | null): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return (
      d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    )
  } catch {
    return ""
  }
}

// Normalize a photo field (string URL, JSON array, or array) to a string array.
function parsePhotoList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean)
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter(Boolean) : [v]
    } catch {
      return [v]
    }
  }
  return []
}

const PACKAGE_NAMES: Record<string, string> = {
  essential: "Essential",
  signature: "Signature",
  prestige: "Prestige",
  cetak_undangan_bonus: "BONUS",
  dgb_sistem: "Sistem",
  dgb_pro: "Pro",
  dgb_premium: "Premium",
  dgb_prestige: "Prestige",
}

const INITIAL_AVAILABLE_IN = ["essential", "signature", "prestige", "cetak_undangan_bonus", "dgb_sistem", "dgb_pro", "dgb_premium", "dgb_prestige"]

function upgradeMessage(availableIn: string[]): string {
  const names = availableIn.map(p => PACKAGE_NAMES[p] || p).join(" & ")
  return `Fitur ini tersedia untuk paket ${names}. Silakan upgrade paket untuk mengakses fitur ini.`
}

function LockedNotice({ availableIn }: { availableIn: string[] }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
      <span className="material-symbols-outlined text-[20px] text-secondary">lock</span>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">Fitur Terkunci</p>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">{upgradeMessage(availableIn)}</p>
      </div>
    </div>
  )
}

function SectionToggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant">{label}</span>
      <label className="inline-flex items-center cursor-pointer shrink-0 gap-2">
        <span className="font-label-md text-[10px] text-on-surface-variant">{checked ? "Tampil" : "Sembunyi"}</span>
        <input type="checkbox" checked={checked} className="sr-only peer" onChange={onChange} disabled={disabled} />
        <div className={`relative w-10 h-5 ${disabled ? "opacity-50" : ""} bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary`} />
      </label>
    </div>
  )
}

function AttentionIcon({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0 text-current" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.5" opacity="0.35">
          <animate attributeName="r" dur="3s" repeatCount="indefinite" values="10;11.5;10" />
          <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.35;0.08;0.35" />
        </circle>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" opacity="0.6">
          <animate attributeName="stroke-dasharray" dur="4s" repeatCount="indefinite" values="0,31.4;31.4,0;0,31.4" />
        </circle>
        <g className="attention-icon">
          <path d="M12 8V13M12 16H12.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
            <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="1;0.4;1" />
          </path>
        </g>
        <style>{`@keyframes subtle-float{0%{transform:translateY(0px)}50%{transform:translateY(-1px)}100%{transform:translateY(0px)}} .attention-icon{transform-origin:center;animation:subtle-float 2s infinite ease-in-out}`}</style>
      </svg>
    </span>
  )
}

function EditorInner({ id }: { id: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [data, setData] = useState<Record<string, any>>({
    groom_photo_url: [],
    bride_photo_url: [],
    cover_photos: [],
    inviting_families: [],
  })
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle")
  const [photoQuota, setPhotoQuota] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<string>("sampul")
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showH3Reminder, setShowH3Reminder] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [showPaymentGate, setShowPaymentGate] = useState(false)
  const [gates, setGates] = useState<RowGates>({
    gift_address: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    inviting_families: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    story: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    cinematic_video: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
  })
  const [featureSet, setFeatureSet] = useState<Set<string>>(new Set())
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const pendingUpdates = useRef<Record<string, any>>({})
  const [previewVersion, setPreviewVersion] = useState(0)
  const [updatingPreview, setUpdatingPreview] = useState(false)
  const [coverReplaceIndex, setCoverReplaceIndex] = useState<number | null>(null)
  const [coverSlideTarget, setCoverSlideTarget] = useState<{ slot: number; slide: number } | null>(null)

  const coverReplaceRef = useRef<HTMLInputElement>(null)
  const coverSlideRef = useRef<HTMLInputElement>(null)
  const groomPhotoRef = useRef<HTMLInputElement>(null)
  const bridePhotoRef = useRef<HTMLInputElement>(null)
  const groomPhotoSlotRef = useRef<(HTMLInputElement | null)[]>([])
  const bridePhotoSlotRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fetch(`/api/dashboard/${id}/web-invitation`)
      .then(r => r.json())
      .then(res => {
        setProfile(res.profile)
        setTemplate(res.template)
        if (res.profile?.package_gates) setGates(res.profile.package_gates)
        if (res.profile?.feature_set) setFeatureSet(new Set(res.profile.feature_set))
        if (res.photo_quota !== undefined) setPhotoQuota(res.photo_quota)
        const p = res.profile
        setData({
          ...p,
          display_name: p.display_name || (p.bride_name && p.groom_name ? `${p.bride_name} & ${p.groom_name}` : ""),
          inviting_families: Array.isArray(p.inviting_families) ? p.inviting_families : [],
          cover_photos: Array.isArray(p.cover_photos) ? p.cover_photos : [],
          groom_photo_url: parsePhotoList(p.groom_photo_url),
          bride_photo_url: parsePhotoList(p.bride_photo_url),
        })
        const sessions = Array.isArray(p.sessions) ? p.sessions.map((s: any) => s?.date).filter(Boolean) : []
        const weddingDate = sessions[0] || p.estimated_wedding_date || ""
        if (weddingDate && p.is_published !== true) {
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

  // Enqueue a WP patch and poll until it finishes. Coalesced server-side: rapid
  // saves share one job, so polling the same job_id is safe.
  const syncToWp = useCallback(async () => {
    setSyncStatus("syncing")
    try {
      const res = await fetch(`/api/wp/patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      const { job_id } = await res.json()
      await pollWpJob(job_id)
      setSyncStatus("idle")
    } catch (err) {
      console.error("[editor] wp sync failed", err)
      setSyncStatus("error")
      throw err
    }
  }, [id])

  const save = useCallback((updates: Record<string, any>) => {
    setSaveStatus("saving")
    // Accumulate changes within the debounce window so multi-field edits
    // (e.g. the quote picker setting quote_text + quote_source) are not lost.
    pendingUpdates.current = { ...pendingUpdates.current, ...updates }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const all = pendingUpdates.current
      pendingUpdates.current = {}
      try {
        const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(all),
        })
        if (!res.ok) throw new Error("Save failed")
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 600)
  }, [id])

  // Manual preview update: flush pending save + sync to WP, then refresh the iframe.
  const handleUpdatePreview = useCallback(async () => {
    setSaveStatus("saving")
    setUpdatingPreview(true)
    // Flush any pending (debounced) changes immediately.
    const all = { ...pendingUpdates.current }
    pendingUpdates.current = {}
    if (saveTimer.current) clearTimeout(saveTimer.current)
    try {
      if (Object.keys(all).length > 0) {
        const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(all),
        })
        if (!res.ok) throw new Error("Save failed")
      }
      setSaveStatus("saved")
      // Sync to the couple's WP post and refresh the iframe once it's done.
      await syncToWp()
      setPreviewVersion(v => v + 1)
    } catch {
      setSaveStatus("error")
    } finally {
      setUpdatingPreview(false)
    }
  }, [id, syncToWp])

  const updateField = (field: string, value: any) => {
    if (data.is_published === true) return
    setData(prev => ({ ...prev, [field]: value }))
    save({ [field]: value })
  }

  const handleImageUpload = async (file: File, field: string) => {
    if (data.is_published === true) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    updateField(field, [url])
  }

  // Upload a photo into a specific slide slot (index 0/1) for slideshow fields.
  const handlePhotoSlideUpload = async (file: File, field: string, index: number) => {
    if (data.is_published === true) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    const arr = Array.isArray(data[field]) ? [...data[field]] : (data[field] ? [data[field]] : [])
    while (arr.length <= index) arr.push("")
    arr[index] = url
    updateField(field, arr)
  }

  // Upload a cover into a specific slot (pads empty slots so the couple can fill
  // any of the template's cover slots in any order).
  const setCoverAt = async (index: number, file: File) => {
    if (data.is_published === true) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    const covers = [...(Array.isArray(data.cover_photos) ? data.cover_photos : [])]
    while (covers.length <= index) covers.push("")
    covers[index] = url
    setData(prev => ({ ...prev, cover_photos: covers, couple_illustration_url: covers[0] || prev.couple_illustration_url }))
    save({ cover_photos: covers, couple_illustration_url: covers[0] || data.couple_illustration_url })
  }

  const clearCoverAt = (index: number) => {
    if (data.is_published === true) return
    const covers = (Array.isArray(data.cover_photos) ? data.cover_photos : []).map((c, i) => i === index ? "" : c)
    setData(prev => ({ ...prev, cover_photos: covers, couple_illustration_url: covers[0] || "" }))
    save({ cover_photos: covers, couple_illustration_url: covers[0] || "" })
  }

  // Upload a photo into a slide of a slideshow cover slot (2 slides per slot).
  const setCoverSlideAt = async (slotIndex: number, slideIndex: number, file: File) => {
    if (data.is_published === true) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    const covers = [...(Array.isArray(data.cover_photos) ? data.cover_photos : [])]
    while (covers.length <= slotIndex) covers.push("")
    const cur = covers[slotIndex]
    const arr = Array.isArray(cur) ? [...cur] : (typeof cur === "string" && cur !== "" ? [cur] : [])
    while (arr.length <= slideIndex) arr.push("")
    arr[slideIndex] = url
    covers[slotIndex] = arr
    const firstUrl = typeof covers[0] === "string" ? covers[0] : (Array.isArray(covers[0]) ? covers[0][0] || "" : "")
    setData(prev => ({ ...prev, cover_photos: covers, couple_illustration_url: firstUrl || prev.couple_illustration_url }))
    save({ cover_photos: covers, couple_illustration_url: firstUrl || data.couple_illustration_url })
  }

  const sessions: Session[] = Array.isArray(data.sessions) ? data.sessions : []

  const updateSession = (index: number, field: keyof Session, value: string) => {
    const updated = sessions.map((s, i) => i === index ? { ...s, [field]: value } : s)
    updateField("sessions", updated)
  }

  const addSession = () => {
    if (data.is_published === true) return
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
    if (data.is_published === true) return
    updateField("stories", [...stories, { year: "", title: "", description: "", image_url: "" }])
  }

  const removeStory = (index: number) => {
    updateField("stories", stories.filter((_: any, i: number) => i !== index))
  }

  const handleStoryImageUpload = async (file: File, index: number) => {
    if (data.is_published === true) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    updateStory(index, "image_url", url)
  }

  const storyFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const galleryPhotos: string[] = Array.isArray(data.gallery_photos) ? data.gallery_photos : []

  // Photo quota ("Kuota Foto"): gallery's own cap = quota − cover − groom − bride.
  // Each slideshow (cover slot / groom / bride) counts as 1.
  const coverPhotoCount = Array.isArray(data.cover_photos) ? data.cover_photos.length : 0
  const groomPhotoCount = Array.isArray(data.groom_photo_url) && data.groom_photo_url.length > 0 ? 1 : 0
  const bridePhotoCount = Array.isArray(data.bride_photo_url) && data.bride_photo_url.length > 0 ? 1 : 0
  const galleryMax = photoQuota == null ? null : Math.max(0, photoQuota - coverPhotoCount - groomPhotoCount - bridePhotoCount)
  const canAddGallery = galleryMax == null || galleryPhotos.length < galleryMax

  // Number of cover slots the template expects (from the /ops mapping). Falls back
  // to the couple's current cover count for legacy templates without a manifest.
  const coverSlotCount = Array.isArray(template?.wp_manifest?.cover_photos)
    ? template.wp_manifest.cover_photos.length
    : (Array.isArray(data.cover_photos) ? data.cover_photos.length : 0)
  const coverSlots = Array.from({ length: coverSlotCount })

  // Whether a field maps to a background slideshow (which needs 2 photos/slides).
  const isSlideshowField = (field: string): boolean => {
    const mapping = template?.wp_manifest?.[field]
    const m = Array.isArray(mapping) ? mapping[0] : mapping
    return Array.isArray(m?.settings) && m.settings.join(".") === "background_slideshow_gallery"
  }

  const isCoverSlideshowSlot = (i: number): boolean => {
    const mapping = template?.wp_manifest?.cover_photos?.[i]
    return Array.isArray(mapping?.settings) && mapping.settings.join(".") === "background_slideshow_gallery"
  }

  const addGalleryPhoto = async (file: File) => {
    if (data.is_published === true) return
    if (galleryMax != null && galleryPhotos.length >= galleryMax) return
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
  const [giftAddressName, setGiftAddressName] = useState("")

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
      const active = addresses?.[0]
      if (active) {
        setGiftAddressText(active.full_address)
        setGiftAddressName(active.recipient_name || "")
      }
    }
  }, [id])

  useEffect(() => { loadGiftData() }, [loadGiftData])

  // Visibility toggles only persist to Supabase (debounced save). The WP patch is
  // NOT triggered here — it fires only when the user clicks "Perbarui undangan".
  const handleToggleVisibility = (field: string, next: boolean) => {
    setData(prev => ({ ...prev, [field]: next }))
    save({ [field]: next })
  }

  type Track = { id: string; title: string; artist: string | null; mood_category: string; audio_url: string; is_custom?: boolean; is_public?: boolean; uploaded_by?: string | null }
  const [allTracks, setAllTracks] = useState<Track[]>([])
  const [trackSearch, setTrackSearch] = useState("")
  const [autoPlay, setAutoPlay] = useState(false)
  const [musicUploading, setMusicUploading] = useState(false)
  const [musicUploadError, setMusicUploadError] = useState("")
  const [showMusicConfirm, setShowMusicConfirm] = useState(false)
  const [pendingMusicFile, setPendingMusicFile] = useState<File | null>(null)
  const musicFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/tracks?wedding_profile_id=${id}`).then(r => r.ok && r.json()).then(res => {
      if (res?.tracks) setAllTracks(res.tracks)
    })
  }, [id])

  const filteredTracks = [...allTracks]
    .filter(t =>
      t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
      (t.artist && t.artist.toLowerCase().includes(trackSearch.toLowerCase()))
    )
    .sort((a, b) => {
      const aSel = a.id === data.selected_track_id ? 0 : 1
      const bSel = b.id === data.selected_track_id ? 0 : 1
      return aSel - bSel
    })

  const selectedTrack = allTracks.find(t => t.id === data.selected_track_id)

  const myCustomTrack = allTracks.find(t => t.is_custom === true && t.uploaded_by === id && t.is_public !== true)

  const handleSelectTrack = (trackId: string) => {
    if (data.is_published === true) return
    updateField("selected_track_id", data.selected_track_id === trackId ? null : trackId)
  }

  const handleMusicFilePick = (file: File) => {
    if (data.is_published === true) return
    setMusicUploadError("")
    if (myCustomTrack) {
      setPendingMusicFile(file)
      setShowMusicConfirm(true)
    } else {
      uploadMusic(file)
    }
  }

  const uploadMusic = async (file: File) => {
    if (data.is_published === true) return
    setMusicUploading(true)
    setMusicUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("wedding_profile_id", id)
      const res = await fetch("/api/tracks", { method: "POST", body: formData })
      const dataRes = await res.json()
      if (!res.ok) {
        setMusicUploadError(dataRes.error || "Gagal mengunggah lagu")
        return
      }
      const track: Track = dataRes.track
      setAllTracks(prev => [track, ...prev.filter(t => !(t.is_custom === true && t.uploaded_by === id && t.is_public !== true))])
      updateField("selected_track_id", track.id)
    } catch {
      setMusicUploadError("Gagal mengunggah lagu. Periksa koneksi.")
    } finally {
      setMusicUploading(false)
    }
  }

  const confirmMusicReplace = async () => {
    setShowMusicConfirm(false)
    if (pendingMusicFile) uploadMusic(pendingMusicFile)
    setPendingMusicFile(null)
  }

  const cancelMusicReplace = () => {
    setShowMusicConfirm(false)
    setPendingMusicFile(null)
  }

  const handleFeedbackClick = () => {
    if ((profile as any)?.payment_status === "UNPAID") {
      setShowPaymentGate(true)
      return
    }
    if ((data as any)?.payment_status === "UNPAID") {
      setShowPaymentGate(true)
      return
    }
    router.push(`/dashboard/${id}/web-invitation/feedback`)
  }

  const handlePublish = async () => {
    setSaveStatus("saving")
    setUpdatingPreview(true)
    // Flush any pending (debounced) edits together with the confirmation.
    const all = { ...pendingUpdates.current }
    pendingUpdates.current = {}
    if (saveTimer.current) clearTimeout(saveTimer.current)
    try {
      const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: true, ...all }),
      })
      if (!res.ok) throw new Error("Save failed")
      setData(prev => ({ ...prev, ...all, is_published: true }))
      setSaveStatus("saved")
      // Ensure the couple's WP post carries everything from the editor.
      await syncToWp()
      setPreviewVersion(v => v + 1)
    } catch {
      setSaveStatus("error")
    } finally {
      setUpdatingPreview(false)
    }
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
      { label: "Kisah Cinta", filled: !(gates.story.included) || (Array.isArray(data.stories) && data.stories.length > 0) },
      { label: "Galeri Foto", filled: Array.isArray(data.gallery_photos) && data.gallery_photos.length > 0 },
      { label: "Turut Mengundang", filled: !(gates.inviting_families.included) || families.length > 0 },
      { label: "Kutipan", filled: !!data.quote_text },
    ]
    return items.filter(i => !i.filled).map(i => i.label)
  }

  // Per-accordion completeness: a section is incomplete when its core content is
  // empty. Hidden (toggle off) or locked (not in package) sections count as complete.
  const sectionIncomplete = (key: string): boolean => {
    const hasArr = (v: any) => Array.isArray(v) && v.filter(Boolean).length > 0
    const hasStr = (v: any) => typeof v === "string" && v.trim() !== ""
    switch (key) {
      case "sampul":
        return !hasArr(data.cover_photos) && !hasStr(data.couple_illustration_url)
      case "pembuka":
        return !hasStr(data.opening_title) && !hasStr(data.opening_description)
      case "profile":
        return !hasStr(data.display_name) || !hasStr(data.groom_full_name) || !hasStr(data.bride_full_name)
      case "inviting":
        if (!gates.inviting_families.included) return false
        if (data.inviting_families_visible === false) return false
        return !hasArr(data.inviting_families)
      case "acara":
        return !hasArr(data.sessions)
      case "kutipan":
        return !hasStr(data.quote_text)
      case "video":
        if (!gates.cinematic_video.included) return false
        if (data.video_section_visible === false) return false
        return !hasStr(data.video_url)
      case "story":
        if (!gates.story.included) return false
        if (data.story_visible === false) return false
        return !hasArr(data.stories)
      case "galeri":
        return !hasArr(data.gallery_photos)
      case "gift":
        if (data.gift_section_visible === false) return false
        return !hasStr(giftAddressText) && giftAccounts.length === 0
      default:
        return false
    }
  }

  const handleSectionToggle = (section: string) => {
    setActiveSection(prev => prev === section ? prev : section)
  }

  // When the open accordion changes, scroll it into view inside the sidebar so a
  // long accordion above doesn't leave the newly-opened one hidden above the fold.
  useEffect(() => {
    if (!activeSection) return
    const el = document.querySelector(`[data-section="${activeSection}"]`)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [activeSection])

  const renderSection = (key: string, icon: string, label: string, content: React.ReactNode) => {
    const isActive = activeSection === key
    return (
      <div data-section={key} className={`scroll-mt-6 border ${isActive ? "bg-white border-outline-variant" : "bg-[#8d4d39] border-[#8d4d39]"}`}>
        <button
          onClick={() => handleSectionToggle(key)}
          className={`w-full flex justify-between items-center py-4 px-4 transition-colors ${isActive ? "text-primary" : "text-white/90 hover:text-white"}`}
        >
          <span className="font-label-md text-label-md flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
            {sectionIncomplete(key) && (
              <span title="Konten belum lengkap" className={`inline-flex ${isActive ? "text-[#8d4d39]" : "text-white"}`}>
                <AttentionIcon size={36} />
              </span>
            )}
          </span>
          <span className="material-symbols-outlined">{isActive ? "expand_less" : "expand_more"}</span>
        </button>
        {isActive && <div className="px-4 pb-6 bg-white">{content}</div>}
      </div>
    )
  }

  const saveStatusLabel =
    syncStatus === "syncing" ? "Menyinkronkan..." :
    syncStatus === "error" ? "Sinkronisasi gagal" :
    saveStatus === "saving" ? "Menyimpan..." :
    saveStatus === "error" ? "Gagal menyimpan" : "Tersimpan Otomatis"
  const saveStatusColor =
    syncStatus === "syncing" ? "bg-brand-gold" :
    syncStatus === "error" ? "bg-red-500" :
    saveStatus === "saving" ? "bg-amber-500" :
    saveStatus === "error" ? "bg-red-500" : "bg-emerald-500"
  const isPublished = data.is_published === true

  const renderPreviewBody = () => {
    // Prefer the couple's own duplicated WP post; fall back to the master demo.
    const previewUrl = data.active_wp_post_url || template?.demo_url
    if (previewUrl) {
      return <iframe key={`${previewUrl}-${previewVersion}`} src={previewUrl} className="w-full h-full border-0" title="Pratinjau" />
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
        guest_qr_token={featureSet.has("qr_code_book") ? "preview" : undefined}
        guest_table_number="Meja 5"
        guest_qr_url={featureSet.has("qr_code_book") ? `/qr/preview?preview=1&slug=${encodeURIComponent(data.slug || "")}&couple=${encodeURIComponent(data.display_name || `${data.bride_name || ""} & ${data.groom_name || ""}`)}&date=${encodeURIComponent(data.estimated_wedding_date || "")}&time=${encodeURIComponent(sessions[0]?.time || "")}&venue=${encodeURIComponent(sessions[0]?.venue || "")}&address=${encodeURIComponent(sessions[0]?.address || "")}` : undefined}
        display_name={data.display_name || undefined}
        sessions={sessions.length > 0 ? sessions : undefined}
        quote_text={data.quote_text || undefined}
        quote_source={data.quote_source || undefined}
        stories={gates.story.included && stories.length > 0 ? stories : undefined}
        gallery_photos={galleryPhotos.length > 0 ? galleryPhotos : undefined}
        couple_illustration_url={data.couple_illustration_url || undefined}
        grayscale={data.grayscale}
        groom_full_name={data.groom_full_name || undefined}
        bride_full_name={data.bride_full_name || undefined}
        groom_photo_url={data.groom_photo_url || undefined}
        bride_photo_url={data.bride_photo_url || undefined}
        groom_parents={data.groom_parents || undefined}
        bride_parents={data.bride_parents || undefined}
        inviting_families={gates.inviting_families.included && Array.isArray(data.inviting_families) ? data.inviting_families.filter(Boolean) : undefined}
        gift_accounts={giftAccounts.length > 0 ? giftAccounts.map(a => ({ provider_name: a.provider_name, account_number: a.account_number, account_name: a.account_name, type: a.type })) : undefined}
        gift_address={gates.gift_address.included ? giftAddressText || undefined : undefined}
        track_url={selectedTrack?.audio_url || undefined}
        auto_play={autoPlay || undefined}
        rsvp_max_pax={data.rsvp_max_pax ?? 2}
        feature_gates={{
          story: gates.story.included,
          gift_address: gates.gift_address.included,
          inviting_families: gates.inviting_families.included,
          qr_code_book: featureSet.has("qr_code_book"),
        }}
      />
    )
  }

  return (
    <>
      <PageTheme mode="light" />
      <div className="h-screen flex flex-col bg-surface text-on-surface font-body-md overflow-hidden">

        {/* TOP BAR */}
        <header className="bg-surface border-b border-outline-variant flex items-center px-6 lg:px-8 w-full h-20 z-50 shrink-0 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => router.push(`/dashboard/${id}`)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-label-md text-label-md hidden sm:inline">DASHBOARD</span>
            </button>
            <div className="h-8 w-px bg-outline-variant hidden sm:block" />
            <div className="hidden sm:block min-w-0">
              <h1 className="font-headline-md text-[18px] lg:text-[20px] text-primary tracking-tight font-bold truncate max-w-[180px] xl:max-w-none">{data.display_name || "Undangan"}</h1>
              <p className="font-label-md text-[10px] text-on-surface-variant flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${saveStatusColor}`} />
                {saveStatusLabel}
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center gap-2 lg:gap-3">
            <button
              onClick={handleUpdatePreview}
              disabled={updatingPreview || isPublished}
              className="hidden md:inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 font-label-md text-label-md bg-brand-gold text-white rounded-full transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">{updatingPreview ? "hourglass_top" : "refresh"}</span>
              <span>{updatingPreview ? "Memperbarui..." : "Perbarui undangan"}</span>
            </button>

            <button
              onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
              disabled={isPublished}
              className={`hidden md:inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 border font-label-md text-label-md rounded-full transition-all active:scale-95 ${
                isPublished
                  ? "border-outline-variant text-on-surface-variant/50 cursor-not-allowed bg-surface"
                  : "border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary bg-white"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">palette</span>
              <span>GANTI TEMA</span>
            </button>

            <button onClick={() => setPreviewDevice(prev => prev === "mobile" ? "desktop" : "mobile")} className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full border border-outline-variant bg-white text-on-surface-variant hover:text-primary hover:border-primary transition-colors" title="Ganti tampilan pratinjau"><span className="material-symbols-outlined text-[20px]">devices</span></button>

            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isPublished}
              className={`hidden md:inline-flex px-5 py-2.5 font-label-md text-label-md rounded-full transition-all active:scale-95 shadow-sm ${
                isPublished
                  ? "flex-col items-center justify-center bg-emerald-600 text-white cursor-default border border-emerald-600 py-1.5 px-4 leading-none"
                  : "items-center bg-secondary text-on-secondary hover:opacity-90 border border-secondary"
              }`}
            >
              {isPublished ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    TERKONFIRMASI
                  </span>
                  <span className="text-[9px] opacity-90 font-normal tracking-normal">
                    {formatConfirmedAt(data.published_at)}
                  </span>
                </>
              ) : (
                "KONFIRMASI"
              )}
            </button>
          </div>

          <div className="flex items-center shrink-0">
            <ProfileMenu />
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 flex overflow-hidden">
          {/* SIDEBAR */}
          <aside className={`${showMobilePreview ? 'hidden' : 'flex'} md:flex w-full md:w-[440px] bg-surface-container-low border-r border-outline-variant flex-col h-full z-40 shrink-0`}>
            <div className="flex border-b border-outline-variant">
              <button className="flex-1 py-4 font-label-md text-label-md text-primary border-b-2 border-primary text-center">KONTEN</button>
            </div>

            {isPublished && (
              <div className="px-4 py-3 bg-surface-container-high border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                <p className="font-label-md text-[11px] text-on-surface-variant leading-snug">Undangan sudah dikonfirmasi. Konten bersifat <span className="font-semibold text-primary">hanya lihat</span> — tidak dapat diubah.</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 space-y-4 md:pb-6">
              {renderSection("sampul", "photo_album", "SAMPUL",
                <div className="mt-6 space-y-8">
                  <div className="space-y-3">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Foto Sampul</label>
                    <p className="text-[11px] text-on-surface-variant italic">
                      {coverSlotCount > 0
                        ? `${coverSlotCount} slot foto sampul tersedia pada template. Isi setiap slot untuk mengganti foto.`
                        : "Unggah satu atau lebih foto sampul."}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {coverSlots.map((_, i) => {
                        const slotValue = (Array.isArray(data.cover_photos) ? data.cover_photos : [])[i]
                        if (isCoverSlideshowSlot(i)) {
                          const slides = Array.isArray(slotValue) ? slotValue : (typeof slotValue === "string" && slotValue !== "" ? [slotValue] : [])
                          return (
                            <div key={i} className="col-span-2 border border-outline-variant rounded p-2 bg-surface-container-lowest">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slot {i + 1} — Slideshow (2 foto)</span>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[0, 1].map(s => {
                                  const url = slides[s]
                                  return url ? (
                                    <div key={s} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                                      <div className={`absolute inset-0 bg-cover bg-center ${data.grayscale ? "grayscale" : ""}`} style={{ backgroundImage: `url(${url})` }} />
                                      <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}.{s === 0 ? "a" : "b"}</span>
                                      <button onClick={() => { setCoverSlideTarget({ slot: i, slide: s }); coverSlideRef.current?.click() }} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100" title="Ganti foto">
                                        <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div key={s} onClick={() => { setCoverSlideTarget({ slot: i, slide: s }); coverSlideRef.current?.click() }} className="relative aspect-video bg-surface-dim border border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
                                      <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}.{s === 0 ? "a" : "b"}</span>
                                      <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }
                        const url = typeof slotValue === "string" ? slotValue : (Array.isArray(slotValue) ? slotValue[0] : "")
                        if (url) {
                          return (
                            <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                              <div className={`absolute inset-0 bg-cover bg-center ${data.grayscale ? "grayscale" : ""}`} style={{ backgroundImage: `url(${url})` }} />
                              <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                              <button
                                onClick={() => { setCoverReplaceIndex(i); coverReplaceRef.current?.click() }}
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                title="Ganti foto ini"
                              >
                                <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                              </button>
                              <button
                                onClick={() => clearCoverAt(i)}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Hapus foto ini"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </div>
                          )
                        }
                        return (
                          <div
                            key={i}
                            onClick={() => { setCoverReplaceIndex(i); coverReplaceRef.current?.click() }}
                            className="relative aspect-video bg-surface-dim border border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors"
                          >
                            <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                            <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                            <span className="text-[9px] text-on-surface-variant mt-1">Slot {i + 1}</span>
                          </div>
                        )
                      })}
                    </div>
                    <input ref={coverReplaceRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && coverReplaceIndex !== null) { setCoverAt(coverReplaceIndex, f); setCoverReplaceIndex(null) } e.target.value = "" }} />
                    <input ref={coverSlideRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && coverSlideTarget !== null) { setCoverSlideAt(coverSlideTarget.slot, coverSlideTarget.slide, f); setCoverSlideTarget(null) } e.target.value = "" }} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Tanggal Acara</label>
                    <input className="input-editorial w-full font-headline-md text-[16px]" type="date" value={data.estimated_wedding_date || ""} onChange={e => updateField("estimated_wedding_date", e.target.value)} />
                    <p className="text-[11px] text-on-surface-variant mt-1 italic">Tanggal utama yang tampil pada sampul undangan.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama Mempelai</label>
                    <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.display_name || ""} onChange={e => updateField("display_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Singkatan Pasangan</label>
                    <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.couple_initials || ""} onChange={e => updateField("couple_initials", e.target.value)} placeholder="WD" />
                    <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: WD, AC — inisial singkat pasangan pada sampul.</p>
                  </div>
                </div>
              )}

              {renderSection("pembuka", "chat_bubble_outline", "KALIMAT PEMBUKA",
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Judul</label>
                    <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.opening_title || ""} onChange={e => updateField("opening_title", e.target.value)} placeholder="Perkenankanlah kami mengundang" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Deskripsi</label>
                    <textarea className="input-editorial w-full font-body-md text-[14px] h-24 resize-none" value={data.opening_description || ""} onChange={e => updateField("opening_description", e.target.value)} placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami…" />
                  </div>
                </div>
              )}

              {renderSection("profile", "group", "PROFILE MEMPELAI",
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Pertama</label>
                    {isSlideshowField("groom_photo_url") ? (
                      <div className="space-y-3">
                        <div className="border border-outline-variant rounded p-2 bg-surface-container-lowest">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slideshow (harus 2 foto)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[0, 1].map(i => {
                              const url = data.groom_photo_url[i]
                              return (
                                <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                                  {url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />}
                                  <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i === 0 ? "a" : "b"}</span>
                                  {url ? (
                                    <button onClick={() => groomPhotoSlotRef.current[i]?.click()} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100" title="Ganti foto">
                                      <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                                    </button>
                                  ) : (
                                    <button onClick={() => groomPhotoSlotRef.current[i]?.click()} className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
                                      <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                                    </button>
                                  )}
                                  <input ref={el => { groomPhotoSlotRef.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSlideUpload(f, "groom_photo_url", i); e.target.value = "" }} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.groom_name || ""} onChange={e => updateField("groom_name", e.target.value)} placeholder="Nama Mempelai Pertama" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Mempelai Pertama</p>
                        </div>
                        <div className="space-y-2">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.groom_full_name || ""} onChange={e => updateField("groom_full_name", e.target.value)} placeholder="Nama Lengkap Mempelai Pertama" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Lengkap Mempelai Pertama</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-end">
                        <div onClick={() => groomPhotoRef.current?.click()} className="w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0">
                          {data.groom_photo_url[0] ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.groom_photo_url[0]})` }} /> : <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>}
                          {data.groom_photo_url[0] && <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>}
                        </div>
                        <input ref={groomPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "groom_photo_url") }} />
                        <div className="flex-1">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.groom_name || ""} onChange={e => updateField("groom_name", e.target.value)} placeholder="Nama Mempelai Pertama" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Mempelai Pertama</p>
                          <input className="input-editorial w-full font-headline-md text-[18px] mt-3" type="text" value={data.groom_full_name || ""} onChange={e => updateField("groom_full_name", e.target.value)} placeholder="Nama Lengkap Mempelai Pertama" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Lengkap Mempelai Pertama</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.groom_parents || ""} onChange={e => updateField("groom_parents", e.target.value)} placeholder="Nama Orang Tua Pria" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Bapak Hendra & Ibu Sari</p>
                    </div>
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.groom_instagram || ""} onChange={e => updateField("groom_instagram", e.target.value)} placeholder="Instagram Pria" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @amospurba</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Kedua</label>
                    {isSlideshowField("bride_photo_url") ? (
                      <div className="space-y-3">
                        <div className="border border-outline-variant rounded p-2 bg-surface-container-lowest">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slideshow (harus 2 foto)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[0, 1].map(i => {
                              const url = data.bride_photo_url[i]
                              return (
                                <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                                  {url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />}
                                  <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i === 0 ? "a" : "b"}</span>
                                  {url ? (
                                    <button onClick={() => bridePhotoSlotRef.current[i]?.click()} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100" title="Ganti foto">
                                      <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                                    </button>
                                  ) : (
                                    <button onClick={() => bridePhotoSlotRef.current[i]?.click()} className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
                                      <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                                    </button>
                                  )}
                                  <input ref={el => { bridePhotoSlotRef.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSlideUpload(f, "bride_photo_url", i); e.target.value = "" }} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.bride_name || ""} onChange={e => updateField("bride_name", e.target.value)} placeholder="Nama Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Mempelai Kedua</p>
                        </div>
                        <div className="space-y-2">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.bride_full_name || ""} onChange={e => updateField("bride_full_name", e.target.value)} placeholder="Nama Lengkap Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Lengkap Mempelai Kedua</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-end">
                        <div onClick={() => bridePhotoRef.current?.click()} className="w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden shrink-0">
                          {data.bride_photo_url[0] ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.bride_photo_url[0]})` }} /> : <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>}
                          {data.bride_photo_url[0] && <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>}
                        </div>
                        <input ref={bridePhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "bride_photo_url") }} />
                        <div className="flex-1">
                          <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.bride_name || ""} onChange={e => updateField("bride_name", e.target.value)} placeholder="Nama Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Mempelai Kedua</p>
                          <input className="input-editorial w-full font-headline-md text-[18px] mt-3" type="text" value={data.bride_full_name || ""} onChange={e => updateField("bride_full_name", e.target.value)} placeholder="Nama Lengkap Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Lengkap Mempelai Kedua</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.bride_parents || ""} onChange={e => updateField("bride_parents", e.target.value)} placeholder="Nama Orang Tua Wanita" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Bapak Wijaya & Ibu Dewi</p>
                    </div>
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.bride_instagram || ""} onChange={e => updateField("bride_instagram", e.target.value)} placeholder="Instagram Wanita" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @claudiamnrg</p>
                    </div>
                  </div>
                  
                </div>
              )}

              {renderSection("inviting", "group", "TURUT MENGUNDANG",
                <div className="mt-6 space-y-4">
                  {gates.inviting_families.included ? (
                    <>
                      <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                        <SectionToggle
                          label="Tampilkan Turut Mengundang"
                          checked={data.inviting_families_visible !== false}
                          disabled={data.is_published === true}
                          onChange={() => handleToggleVisibility("inviting_families_visible", data.inviting_families_visible === false)}
                        />
                      </div>
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
                    </>
                  ) : (
                    <LockedNotice availableIn={gates.inviting_families.availableIn} />
                  )}
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
              {renderSection("video", "movie", "VIDEO",
                gates.cinematic_video.included ? (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                      <SectionToggle
                        label="Tampilkan Video"
                        checked={data.video_section_visible !== false}
                        disabled={data.is_published === true}
                        onChange={() => handleToggleVisibility("video_section_visible", data.video_section_visible === false)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">URL Video (YouTube)</label>
                      <input
                        className="input-editorial w-full font-body-md text-[14px]"
                        type="url"
                        value={data.video_url || ""}
                        onChange={e => updateField("video_url", e.target.value)}
                        placeholder="https://youtu.be/..."
                      />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Tautan video (mis. "OUR FOOTAGE") yang tampil pada undangan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6"><LockedNotice availableIn={gates.cinematic_video.availableIn} /></div>
                )
              )}
              {renderSection("story", "auto_stories", "STORY",
                gates.story.included ? (
                  <div className="mt-6 space-y-6">
                    <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                      <SectionToggle
                        label="Tampilkan Kisah Cinta"
                        checked={data.story_visible !== false}
                        disabled={data.is_published === true}
                        onChange={() => handleToggleVisibility("story_visible", data.story_visible === false)}
                      />
                    </div>
                    <div className="space-y-8">
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
                  </div>
                ) : (
                  <div className="mt-6"><LockedNotice availableIn={gates.story.availableIn} /></div>
                )
              )}
              {renderSection("galeri", "collections", "GALERI",
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                      {galleryMax == null ? "GALERI FOTO" : `GALERI FOTO (MAKS. ${galleryMax} FOTO)`}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {galleryPhotos.map((url, i) => (
                        <div key={i} className="aspect-square bg-surface-dim border border-outline-variant relative group">
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                          <button onClick={() => removeGalleryPhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                      {canAddGallery && (
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
                <div className="space-y-6">
                  <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                    <SectionToggle
                      label="Tampilkan Bagian Hadiah"
                      checked={data.gift_section_visible !== false}
                      disabled={data.is_published === true}
                      onChange={() => handleToggleVisibility("gift_section_visible", data.gift_section_visible === false)}
                    />
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/${id}/amplop-digital`)}
                    className="w-full py-3 border border-primary text-primary font-label-md text-[11px] tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Atur Amplop Digital
                  </button>

                  <div className="space-y-3">
                    <p className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Daftar Rekening / E-Wallet</p>
                    {giftAccounts.length === 0 ? (
                      <p className="font-body-md text-sm text-on-surface-variant">Belum ada rekening ditambahkan.</p>
                    ) : (
                      giftAccounts.map(acc => (
                        <div key={acc.id} className="p-3 border border-outline-variant rounded-lg space-y-1 bg-surface-container-lowest">
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">{acc.provider_name}</p>
                          <p className="font-body-md text-sm font-semibold">{acc.account_number}</p>
                          <p className="font-body-md text-[11px] text-on-surface-variant">a.n. {acc.account_name}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Alamat Pengiriman Kado</p>
                    {gates.gift_address.included ? (
                      <div className="p-3 border border-outline-variant rounded-lg space-y-2 bg-surface-container-lowest">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Atas Nama</p>
                          <p className="font-body-md text-sm font-semibold">{giftAddressName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Alamat</p>
                          <p className="font-body-md text-sm whitespace-pre-line">{giftAddressText || "—"}</p>
                        </div>
                      </div>
                    ) : (
                      <LockedNotice availableIn={gates.gift_address.availableIn} />
                    )}
                  </div>
                </div>
              </>)}
              {renderSection("music", "music_note", "MUSIC", <>
                <div className="space-y-4">
                  {musicUploadError && (
                    <p className="text-[11px] text-error font-medium">{musicUploadError}</p>
                  )}
                  <div>
                    <button
                      onClick={() => musicFileRef.current?.click()}
                      disabled={data.is_published === true || musicUploading}
                      className="w-full py-3 border border-dashed border-secondary text-secondary font-label-md text-[11px] tracking-widest uppercase hover:bg-secondary-container/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${musicUploading ? "animate-spin" : ""}`}>
                        {musicUploading ? "progress_activity" : "upload_file"}
                      </span>
                      {musicUploading ? "Mengunggah..." : "Unggah MP3"}
                    </button>
                    <input
                      ref={musicFileRef}
                      type="file"
                      accept="audio/*,.mp3"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleMusicFilePick(file)
                        e.target.value = ""
                      }}
                    />
                    <p className="text-[10px] text-on-surface-variant mt-2">
                      {myCustomTrack
                        ? "Kamu memiliki 1 lagu unggahan. Unggah lagi akan mengganti lagu tersebut."
                        : "Maksimal 1 lagu unggahan. Lagu unggahan akan tampil di atas daftar."}
                    </p>
                  </div>
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
                      const isCustom = track.is_custom === true
                      const isMine = isCustom && track.uploaded_by === id && track.is_public !== true
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleSelectTrack(track.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-secondary-container/30 border border-secondary ring-1 ring-secondary"
                              : "border border-transparent hover:bg-surface-container-low"
                          } ${isMine ? "border-l-2 border-l-secondary" : ""}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-label-md text-primary flex items-center gap-2">
                              {track.title}
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 bg-secondary text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                                  <span className="material-symbols-outlined text-[11px]">check</span>
                                  Dipilih
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              {isMine ? "★ Lagu Saya" : (track.artist || "Instrumental")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined ${isSelected ? "text-secondary" : "text-on-surface-variant"}`}>
                              {isSelected ? "pause" : "play_arrow"}
                            </span>
                          </div>
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
                    </div>
                  </div>
                  <button
                    onClick={handleFeedbackClick}
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
                    <button
                      onClick={handleUpdatePreview}
                      disabled={updatingPreview}
                      className="shrink-0 flex items-center gap-1.5 text-[11px] font-label-md px-3 py-1.5 rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">{updatingPreview ? "hourglass_top" : "refresh"}</span>
                      {updatingPreview ? "Memperbarui..." : "Perbarui"}
                    </button>
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
              onClick={handleUpdatePreview}
              disabled={updatingPreview || isPublished}
              className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-brand-gold text-white disabled:opacity-50"
            >
              {updatingPreview ? "MEMPERBARUI..." : "PERBARUI"}
            </button>
            <button
              onClick={() => setShowPublishConfirm(true)}
              disabled={isPublished}
              className={`flex-1 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center ${
                isPublished
                  ? "py-2 flex-col gap-0.5 bg-emerald-600 text-white cursor-default"
                  : "py-4 bg-secondary text-on-secondary"
              }`}
            >
              {isPublished ? (
                <>
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    TERKONFIRMASI
                  </span>
                  <span className="text-[8px] opacity-90 font-normal tracking-normal">
                    {formatConfirmedAt(data.published_at)}
                  </span>
                </>
              ) : (
                "KONFIRMASI"
              )}
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

      {showMusicConfirm && (
        <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8">
            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">music_note</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Ganti Lagu?</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Upload hanya mendukung satu lagu. Lagu yang kamu unggah sebelumnya akan dihapus dan digantikan dengan lagu yang baru.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmMusicReplace}
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                Ganti &amp; Upload
              </button>
              <button
                onClick={cancelMusicReplace}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Batal
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

      {showPaymentGate && (
        <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowPaymentGate(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">payments</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Pembayaran Diperlukan</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Silakan selesaikan pembayaran terlebih dahulu untuk membuka fitur <span className="font-semibold text-primary">Feedback</span>. Setelah pembayaran terverifikasi, fitur ini akan otomatis terbuka.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/6281224459435?text=Halo%20Aksaraa%2C%20saya%20ingin%20menyelesaikan%20pembayaran%20untuk%20membuka%20fitur%20Feedback"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#8d4d39] text-white rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity text-center"
              >
                Kontak Konsultan
              </a>
              <button
                onClick={() => setShowPaymentGate(false)}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Tutup
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