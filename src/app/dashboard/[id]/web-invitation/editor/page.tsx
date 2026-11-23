"use client"

import { useState, useEffect, use, useRef, useCallback, useMemo, ComponentType } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { profileView } from "@/lib/profileView"
import { getTemplateComponent, getTemplateContentSpec, hidesOpeningSection } from "@/components/templates"
import { visibleCoverSlotIndexes } from "@/lib/coverSlots"
import { getTemplateExtraFields, groupExtraFields, templateExtrasLabel } from "@/lib/templateExtras"
import type { RowGates } from "@/lib/featureGates"
import { getIncompleteInvitationSections, parseStringList } from "@/lib/invitationCompleteness"
import { pollWpJob } from "@/lib/wpJobPoll"
import ProfileMenu from "@/components/ProfileMenu"
import AutoTextarea from "@/components/AutoTextarea"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import { ASSETS } from "@/lib/assets"
import { OPENING_PRESETS, OPENING_CUSTOM, matchOpeningPreset } from "@/lib/openingPresets"
import { compressImage } from "@/lib/imageCompress"
import { waLink } from "@/lib/contact"
import { resolveCoupleName } from "@/lib/coupleName"
import { coupleUrl } from "@/lib/coupleUrl"
import { MAX_CHILDREN, parseChildren, readChildren, resolveChildren, type InvitationChild } from "@/lib/children"

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
  couple_illustration_url: string | null
  link_thumbnail_url?: string | null
  link_thumbnail_disabled?: boolean | null
  cover_photos: string[] | null
  gallery_photo_url?: string | null
  couple_initials: string | null
  grayscale: boolean
  is_published: boolean
  published_at?: string | null
  payment_status?: string | null
  groom_full_name: string | null
  bride_full_name: string | null
  // Event family. Kids profiles keep the child in the first person slot and
  // leave the second empty, so the editor hides the second person block.
  event_type?: string | null
  subject_gender?: string | null
  groom_photo_url: string | null
  bride_photo_url: string | null
  groom_parents: string | null
  bride_parents: string | null
  groom_instagram: string | null
  bride_instagram: string | null
  // Ceriavite: one ceremony may introduce more than one ananda. The parent line
  // stays shared in `groom_parents`.
  children?: InvitationChild[] | null
  video_url: string | null
  estimated_wedding_date: string | null
  sessions: Session[] | null
  display_name: string | null
  inviting_families: string[] | null
  rsvp_max_pax: number | null
  active_wp_post_id: number | null
  active_wp_post_url: string | null
  gift_section_visible?: boolean
  video_section_visible?: boolean
  inviting_families_visible?: boolean
  story_visible?: boolean
  opening_title?: string | null
  opening_description?: string | null
  rundown?: RundownItem[] | null
  contacts?: ContactItem[] | null
  rundown_visible?: boolean
  contacts_visible?: boolean
  template_content?: Record<string, string> | null
  language?: "id" | "en" | null
}

type RundownItem = {
  time: string
  description: string
}

type ContactItem = {
  name: string
  description: string
  whatsapp: string
}

type Session = {
  name: string
  date: string
  time: string
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
  source_type?: string | null
  wp_master_slug?: string | null
  wp_manifest: Record<string, any> | null
  no_photo?: boolean | null
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
  elite: "Elite",
  cetak_undangan_bonus: "BONUS",
  bonus_full_custom: "BONUS FULL CUSTOM",
  dgb_sistem: "Sistem",
  dgb_pro: "Pro",
  dgb_premium: "Premium",
  dgb_prestige: "Prestige",
}

const INITIAL_AVAILABLE_IN = ["essential", "signature", "prestige", "elite", "cetak_undangan_bonus", "bonus_full_custom", "dgb_sistem", "dgb_pro", "dgb_premium", "dgb_prestige"]

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

function describePalette(colors?: { hex?: string; name?: string }[]): string {
  const names = (colors || []).map((c) => (c.name || "").trim()).filter(Boolean)
  if (!names.length) return ""
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} & ${names[1]}`
        : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
  return `Elegant Attire in ${list}.`
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

function SidebarShimmer() {
  return (
    <div className="space-y-3 p-1 animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="border border-outline-variant/30 p-4 space-y-3">
          <div className="h-4 bg-surface-container-high rounded w-1/2" />
          <div className="h-3 bg-surface-container-high rounded w-full" />
          <div className="h-3 bg-surface-container-high rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

function PreviewShimmer() {
  return (
    <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center gap-4 z-10">
      <div className="w-full max-w-sm p-6 space-y-4 animate-pulse">
        <div className="h-48 bg-surface-container-high rounded-xl" />
        <div className="h-6 bg-surface-container-high rounded w-3/4 mx-auto" />
        <div className="h-4 bg-surface-container-high rounded w-1/2 mx-auto" />
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-surface-container-high rounded" />
          <div className="h-3 bg-surface-container-high rounded w-5/6" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-on-surface-variant text-sm">
        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Memuat pratinjau...
      </div>
    </div>
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
    template_content: {},
    language: "id",
  })
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle")
  const [syncError, setSyncError] = useState<string | null>(null)
  const [photoQuota, setPhotoQuota] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<string>("bahasa")
  const [openExtraGroup, setOpenExtraGroup] = useState<string | null>(null)
  const [colorEdit, setColorEdit] = useState<{ index: number; hex: string } | null>(null)
  const [openingCustomMode, setOpeningCustomMode] = useState(false)
  const [showMobileBar, setShowMobileBar] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const wantsPreview = searchParams.get("preview") === "1"
    if (wantsPreview && typeof window !== "undefined" && window.innerWidth < 768) {
      setShowMobilePreview(true)
    }
    const section = searchParams.get("section") || searchParams.get("return_section")
    if (section) {
      setActiveSection(section)
      // An explicit ?preview=1 wins over a section deep-link.
      if (!wantsPreview) setShowMobilePreview(false)
    }
  }, [searchParams])

  useEffect(() => {
    const onShowKonten = () => setShowMobilePreview(false)
    window.addEventListener("tour_show_konten", onShowKonten as EventListener)
    return () => window.removeEventListener("tour_show_konten", onShowKonten as EventListener)
  }, [])

  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [pubState, setPubState] = useState<"ask" | "choose" | "error">("ask")
  const [pubError, setPubError] = useState("")
  const [reviewMode, setReviewMode] = useState(false)
  // Tautan yang dibagikan CS memakai ?review=1 supaya langsung terbuka di
  // layar pratinjau (tombol Konfirmasi), bukan editor konten.
  const autoReviewDone = useRef(false)

  // Collapse the mobile action sheet whenever the editor switches between edit
  // and preview (or enters review), so preview always lands on the floating
  // button only — never the expanded EDIT/PERBARUI/KONFIRMASI sheet.
  useEffect(() => {
    setShowMobileBar(false)
  }, [showMobilePreview, reviewMode])
  const [reviewError, setReviewError] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [preparingReview, setPreparingReview] = useState(false)
  const [giftLoading, setGiftLoading] = useState(true)
  const prevShowMobilePreview = useRef(false)
  const [showH3Reminder, setShowH3Reminder] = useState(false)
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<any[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [showPaymentGate, setShowPaymentGate] = useState(false)
  const [showFeedbackGate, setShowFeedbackGate] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [gates, setGates] = useState<RowGates>({
    gift_address: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    inviting_families: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    story: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
    cinematic_video: { included: true, availableIn: [...INITIAL_AVAILABLE_IN] },
  })
  const [featureSet, setFeatureSet] = useState<Set<string>>(new Set())
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const hasCheckedH3 = useRef(false)

  const pendingUpdates = useRef<Record<string, any>>({})
  // True while a photo is uploading to storage. The window refetch below must
  // not run then: opening the file picker blurs the tab, and a refetch that
  // lands mid-upload replaces the row the couple is still filling in (that is
  // how a freshly added ananda used to disappear).
  const uploadBusyRef = useRef(false)
  const lastSentRef = useRef<string>("")
  const wpAbortRef = useRef<AbortController | null>(null)
  function canonicalize(obj: Record<string, any>): string {
    const keys = Object.keys(obj).sort()
    const sorted: Record<string, any> = {}
    for (const k of keys) sorted[k] = obj[k]
    return JSON.stringify(sorted)
  }
  const [previewVersion, setPreviewVersion] = useState(0)
  const [updatingPreview, setUpdatingPreview] = useState(false)
  // Preview-frame readiness: the canvas skeleton stays up until the frame
  // document itself fires onLoad (the editor's own JSON fetch resolves long
  // before a heavy Elementor/React page finishes painting).
  const [readyKey, setReadyKey] = useState("")
  const [iframeError, setIframeError] = useState("")
  // Chain settle: arriving from template select while the WP
  // duplicate→patch→cleanup chain is still open would preview a stale (or
  // already-cleaned-up) post. The skeleton holds until the chain drains.
  const [chainSettling, setChainSettling] = useState(false)
  const iframeReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [coverReplaceIndex, setCoverReplaceIndex] = useState<number | null>(null)
  const [coverSlideTarget, setCoverSlideTarget] = useState<{ slot: number; slide: number } | null>(null)

  const coverReplaceRef = useRef<HTMLInputElement>(null)
  const coverSlideRef = useRef<HTMLInputElement>(null)
  const linkThumbRef = useRef<HTMLInputElement>(null)
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const hasAutoFocusedFeedback = useRef(false)
  const groomPhotoRef = useRef<HTMLInputElement>(null)
  const bridePhotoRef = useRef<HTMLInputElement>(null)
  const groomPhotoSlotRef = useRef<(HTMLInputElement | null)[]>([])
  const bridePhotoSlotRef = useRef<(HTMLInputElement | null)[]>([])

  const fetchProfile = useCallback(() => {
    return fetch(`/api/dashboard/${id}/web-invitation`, { cache: "no-store" })
      .then(r => r.json())
      .then(res => {
        setProfile(res.profile)
        setTemplate(res.template)
        if (res.profile?.package_gates) setGates(res.profile.package_gates)
        if (res.profile?.feature_set) setFeatureSet(new Set(res.profile.feature_set))
        if (res.photo_quota !== undefined) setPhotoQuota(res.photo_quota)
        const p = res.profile
        setData(prev => ({
          ...prev,
          ...p,
          language: p.language === "en" ? "en" : "id",
          display_name: p.display_name || "",
          link_thumbnail_url: p.link_thumbnail_url || "",
          link_thumbnail_disabled: p.link_thumbnail_disabled === true,
          inviting_families: Array.isArray(p.inviting_families) ? p.inviting_families : [],
          cover_photos: Array.isArray(p.cover_photos) ? p.cover_photos : [],
          groom_photo_url: parsePhotoList(p.groom_photo_url),
          bride_photo_url: parsePhotoList(p.bride_photo_url),
        }))
        if (!hasCheckedH3.current) {
          hasCheckedH3.current = true
          let fromTemplates = false
          try {
            fromTemplates = sessionStorage.getItem('from_templates_' + id) === '1'
            if (fromTemplates) sessionStorage.removeItem('from_templates_' + id)
          } catch {}
          if (fromTemplates) return
          const sessions = Array.isArray(p.sessions) ? p.sessions.map((s: any) => s?.date).filter(Boolean) : []
          const weddingDate = sessions[0] || p.estimated_wedding_date || ""
          if (weddingDate && p.is_published !== true) {
            const days = Math.ceil((new Date(`${weddingDate}T00:00:00`).getTime() - Date.now()) / 86400000)
            if (days >= 0 && days <= 14) setShowH3Reminder(true)
          }
        }
      })
  }, [id])

  useEffect(() => {
    setInitialLoading(true)
    fetchProfile().finally(() => setInitialLoading(false))
  }, [fetchProfile])

  useEffect(() => {
    // Pick up changes made elsewhere — but never while this tab has unsaved
    // edits or an upload in flight. Opening the photo picker blurs the window,
    // and a refetch there would overwrite the ananda the couple just added
    // (still blank, therefore not yet meaningful to the server) with the last
    // saved list.
    const refreshIfIdle = () => {
      if (uploadBusyRef.current) return
      if (saveStatus === "saving") return
      if (Object.keys(pendingUpdates.current).length > 0) return
      fetchProfile()
    }
    const onFocus = () => { if (document.visibilityState === "visible") refreshIfIdle() }
    const onPageShow = () => refreshIfIdle()
    window.addEventListener("focus", onFocus)
    window.addEventListener("pageshow", onPageShow)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pageshow", onPageShow)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [fetchProfile, saveStatus])

  useEffect(() => {
    if (previewVersion > 0) fetchProfile()
  }, [previewVersion, fetchProfile])

  // Chain settle on template-select return (flag set by the templates page):
  // poll the WP job queue until no chain job is open, then re-fetch so the
  // frame mounts the live post. In-house selects commit synchronously, so the
  // first poll finds nothing open and this is a near no-op (no extra fetch).
  useEffect(() => {
    let fromTemplates = false
    try { fromTemplates = sessionStorage.getItem('from_templates_' + id) === '1' } catch {}
    if (!fromTemplates) return
    let cancelled = false
    let waited = false
    const startedAt = Date.now()
    const TIMEOUT_MS = 120000
    setChainSettling(true)
    const tick = async () => {
      if (cancelled) return
      let open = false
      try {
        const res = await fetch(`/api/wp/jobs?profile_id=${id}`, { cache: "no-store" })
        const json = await res.json().catch(() => null)
        const jobs = Array.isArray(json?.jobs) ? json.jobs : []
        open = jobs.some((j: any) => j.status === "queued" || j.status === "processing")
      } catch {
        open = true // transient network error: keep waiting until the timeout
      }
      if (cancelled) return
      if (!open) {
        setChainSettling(false)
        if (waited) fetchProfile()
        return
      }
      waited = true
      if (Date.now() - startedAt > TIMEOUT_MS) {
        setChainSettling(false)
        setSyncError("Sinkronisasi template masih berjalan. Tekan Perbarui Undangan untuk memuat pratinjau terbaru.")
        fetchProfile()
        return
      }
      setTimeout(tick, 1000)
    }
    tick()
    return () => { cancelled = true }
  }, [id, fetchProfile])

  useEffect(() => {
    fetch(`/api/feedback-submissions?wedding_profile_id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(res => setFeedbackSubmissions(res?.submissions || []))
      .catch(() => setFeedbackSubmissions([]))
      .finally(() => setFeedbackLoading(false))
  }, [id])

    // In-house templates render the React component directly and skip WP sync.
  // Detection tolerates rows that predate the source_type column: a registered
  // React code with no WP master is in-house by construction.
  const isInhouse = template?.source_type === "inhouse" ||
    (!!template?.code && !!getTemplateComponent(template.code) && !template?.wp_master_slug)
  const contentSpec = template?.code ? getTemplateContentSpec(template.code) : undefined
  const extraFields = getTemplateExtraFields(template?.code, data.language === "en" ? "en" : "id")
  const extrasLabel = templateExtrasLabel(template?.name, data.language === "en" ? "en" : "id")
  // Bilingual UI is opt-in per environment. The i18n engine stays; this only
  // hides the couple-facing switcher where the feature is not released.
  // An already-English profile still gets the control so it can switch back.
  const languageUiEnabled = process.env.NEXT_PUBLIC_LANGUAGE_UI === "true"
  // Tanpa-photo template: photo fields (cover slots, person photos, gallery,
  // story images) are hidden in editor + ops and excluded from completeness.
  // Stored photos are kept so switching back to a with-photo template restores
  // them — hide must never equal delete.
  const isNoPhoto = template?.no_photo === true
  const kids = profileView(data).kids
  // Cover slots and portraits are separate questions: a design can have none of
  // either but still take a gallery + film (lace). An upload field the template
  // never renders is worse than no field at all. The slot count is the single
  // source of truth: in-house specs declare it, WP templates expose it through
  // the cover mapping in wp_manifest. Zero slots means the couple must choose a
  // separate link thumbnail (see SAMPUL below).
  const coverSlotCount = contentSpec?.cover_slots ?? (Array.isArray(template?.wp_manifest?.cover_photos)
    ? template.wp_manifest.cover_photos.length
    : 0)
  const hasCoverPhotos = !isNoPhoto && coverSlotCount > 0
  const hasPersonPhotos = !isNoPhoto && contentSpec?.person_photos !== false
  // Text-only love story (e.g. piano-garden): hide the milestone photo field
  // while keeping stored image_url data intact.
  const showStoryPhoto = contentSpec?.story_photo !== false && !isNoPhoto

  // Ubah error teknis sinkronisasi WP menjadi pesan Bahasa Indonesia yang
  // bisa ditindaklanjuti pengguna (tampilkan + tombol coba lagi).
  function toIndonesianSyncError(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err ?? "")
    const lower = raw.toLowerCase()
    if (!raw) return "Sinkronisasi ke WordPress gagal. Silakan tekan Perbarui Undangan untuk mencoba lagi."
    if (lower.includes("abort")) return "Sinkronisasi dibatalkan. Silakan tekan Perbarui Undangan untuk mencoba lagi."
    if (lower.includes("masih berjalan") || lower.includes("timeout") || lower.includes("timed out")) {
      return "Sinkronisasi masih berjalan dan melewati batas waktu. Perubahan Anda sudah tersimpan — tekan Perbarui Undangan untuk mencoba lagi."
    }
    if (lower.includes("fetch failed") || lower.includes("failed to fetch") || lower.includes("network") || lower.includes("load failed")) {
      return "Koneksi ke server WordPress gagal. Periksa koneksi internet Anda, lalu tekan Perbarui Undangan untuk mencoba lagi."
    }
    if (lower.includes("belum ada postingan wordpress")) {
      return "Belum ada undangan WordPress yang aktif. Silakan pilih tema terlebih dahulu, lalu tekan Perbarui Undangan."
    }
    if (lower.includes("profil tidak ditemukan") || lower.includes("job tidak ditemukan")) {
      return "Data undangan tidak ditemukan. Muat ulang halaman ini, lalu tekan Perbarui Undangan untuk mencoba lagi."
    }
    if (lower.includes("http")) {
      return `WordPress mengembalikan kesalahan (${raw}). Perubahan Anda sudah tersimpan — tekan Perbarui Undangan untuk mencoba lagi.`
    }
    if (/^[a-z]/.test(raw) && /[a-z]{4,}/.test(raw) && !/[а-я ]/i.test(raw) && /the|and|failed|error|connection/i.test(raw)) {
      return `${raw} Silakan tekan Perbarui Undangan untuk mencoba lagi.`
    }
    return raw.endsWith("lagi.") ? raw : `${raw} Silakan tekan Perbarui Undangan untuk mencoba lagi.`
  }

  // Enqueue a WP patch and poll until it finishes. Coalesced server-side: rapid
  // saves share one job, so polling the same job_id is safe.
  const syncToWp = useCallback(async () => {
    setSyncStatus("syncing")
    setSyncError(null)
    if (wpAbortRef.current) wpAbortRef.current.abort()
    const ctrl = new AbortController()
    wpAbortRef.current = ctrl
    try {
      const res = await fetch(`/api/wp/patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: id, source: "dashboard" }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      const { job_id } = await res.json()
      await pollWpJob(job_id, { interval: 800 })
      setSyncStatus("idle")
    } catch (err: any) {
      if (err?.name === "AbortError") return
      console.error("[editor] wp sync failed", err)
      setSyncStatus("error")
      setSyncError(toIndonesianSyncError(err))
      throw err
    }
  }, [id])

  const save = useCallback((updates: Record<string, any>) => {
    setSaveStatus("saving")
    pendingUpdates.current = { ...pendingUpdates.current, ...updates }
    scheduleSave()
  }, [id])

  // Scheduler extracted from save() so state-computed updates can share it.
  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const all = pendingUpdates.current
      pendingUpdates.current = {}
      const canon = canonicalize(all)
      if (canon === lastSentRef.current || Object.keys(all).length === 0) {
        setSaveStatus("saved")
        return
      }
      lastSentRef.current = canon
      try {
        const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(all),
        })
        if (!res.ok) throw new Error("Gagal menyimpan perubahan. Silakan coba lagi.")
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }, 1200)
  }

  // Manual preview update: flush pending save + sync to WP, then refresh the iframe.
  const handleUpdatePreview = useCallback(async () => {
    setShowMobileBar(false)
    setSaveStatus("saving")
    setUpdatingPreview(true)
    setSyncError(null)
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
        if (!res.ok) throw new Error("Gagal menyimpan perubahan. Silakan coba lagi.")
      }
      setSaveStatus("saved")
      // Refresh the preview: in-house renders live from the profile, so reload
      // fresh server data into it; for WP, sync the patch first, then refresh.
      if (isInhouse) {
        await fetchProfile()
        setPreviewVersion(v => v + 1)
      } else {
        await syncToWp()
        setPreviewVersion(v => v + 1)
      }
      const mobile = typeof window !== "undefined" ? window.innerWidth < 768 : isMobile
      if (mobile) setShowMobilePreview(true)
    } catch {
      setSaveStatus("error")
    } finally {
      setUpdatingPreview(false)
    }
  }, [id, syncToWp, isMobile, isInhouse, fetchProfile])

  // Latest frame key, readable inside the stable onLoad handler below.
  const iframeKeyRef = useRef("")
  const handleIframeLoad = useCallback(() => {
    setIframeError("")
    if (iframeReadyTimer.current) clearTimeout(iframeReadyTimer.current)
    // Small settle delay so Elementor's first paint + webfonts land before
    // the skeleton lifts; repeat views are fully cached anyway.
    const key = iframeKeyRef.current
    iframeReadyTimer.current = setTimeout(() => setReadyKey(key), 600)
  }, [])
  const handleIframeError = useCallback(() => {
    if (iframeReadyTimer.current) clearTimeout(iframeReadyTimer.current)
    setIframeError("Pratinjau gagal dimuat. Periksa koneksi Anda, lalu coba lagi.")
  }, [])
  const retryPreview = useCallback(() => {
    setIframeError("")
    setReadyKey("")
    setPreviewVersion(v => v + 1)
  }, [])

  const updateField = (field: string, value: any) => {
    if (data.is_published === true || reviewMode) return
    setData(prev => ({ ...prev, [field]: value }))
    save({ [field]: value })
  }

  const updateTemplateContent = (key: string, value: string) => {
    updateField("template_content", { ...(data.template_content || {}), [key]: value })
  }

  // Race-free variant: compute updates from the LATEST state inside the
  // functional updater, and feed the exact same values to the debounced
  // save. Use this whenever several async uploads each contribute to one
  // array field (cover slots, gallery) — sequential awaits otherwise read
  // stale state and stomp each other's results.
  const applyFields = (build: (prev: Record<string, any>) => Record<string, any>) => {
    if (data.is_published === true || reviewMode) return
    setSaveStatus("saving")
    setData(prev => {
      const updates = build(prev)
      pendingUpdates.current = { ...pendingUpdates.current, ...updates }
      scheduleSave()
      return { ...prev, ...updates }
    })
  }

  const firstCoverUrl = (covers: any[]): string => {
    const first = covers[0]
    if (typeof first === "string") return first || ""
    if (Array.isArray(first)) return first[0] || ""
    return ""
  }

  const handleImageUpload = async (file: File, field: string) => {
    if (data.is_published === true || reviewMode) return
    setPhotoUploading(field)
    try {
      const url = await uploadImageFile(file)
      if (url) updateField(field, [url])
    } finally {
      setPhotoUploading(null)
    }
  }

  const handlePhotoSlideUpload = async (file: File, field: string, index: number) => {
    if (data.is_published === true || reviewMode) return
    const key = `${field}-${index}`
    setPhotoUploading(key)
    try {
      const url = await uploadImageFile(file)
      if (!url) return
      const arr = Array.isArray(data[field]) ? [...data[field]] : (data[field] ? [data[field]] : [])
      while (arr.length <= index) arr.push("")
      arr[index] = url
      updateField(field, arr)
    } finally {
      setPhotoUploading(null)
    }
  }

  // Batch cover upload: uploads run sequentially (per-slot spinners stay
  // accurate), then all results land in ONE state update + ONE save, so
  // multi-select can no longer stomp earlier slots with stale reads.
  const runCoverUploads = async (pairs: { index: number; file: File }[]) => {
    if (data.is_published === true || reviewMode || pairs.length === 0) return
    const done: { index: number; url: string }[] = []
    for (const p of pairs) {
      setCoverUploading(`cover-${p.index}`)
      try {
        const url = await uploadImageFile(p.file)
        if (url) done.push({ index: p.index, url })
      } finally {
        setCoverUploading(null)
      }
    }
    if (done.length === 0) return
    applyFields((prev) => {
      const covers = [...(Array.isArray(prev.cover_photos) ? prev.cover_photos : [])]
      for (const d of done) {
        while (covers.length <= d.index) covers.push("")
        covers[d.index] = d.url
      }
      const first = firstCoverUrl(covers)
      return {
        cover_photos: covers,
        couple_illustration_url: first || prev.couple_illustration_url,
      }
    })
  }

  // Batch slideshow-slide upload: same single-commit pattern as runCoverUploads.
  const runCoverSlideUploads = async (pairs: { slot: number; slide: number; file: File }[]) => {
    if (data.is_published === true || reviewMode || pairs.length === 0) return
    const done: { slot: number; slide: number; url: string }[] = []
    for (const p of pairs) {
      setCoverUploading(`cover-${p.slot}-${p.slide}`)
      try {
        const url = await uploadImageFile(p.file)
        if (url) done.push({ ...p, url })
      } finally {
        setCoverUploading(null)
      }
    }
    if (done.length === 0) return
    applyFields((prev) => {
      const covers = [...(Array.isArray(prev.cover_photos) ? prev.cover_photos : [])]
      for (const d of done) {
        while (covers.length <= d.slot) covers.push("")
        const cur = covers[d.slot]
        const arr = Array.isArray(cur) ? [...cur] : (typeof cur === "string" && cur !== "" ? [cur] : [])
        while (arr.length <= d.slide) arr.push("")
        arr[d.slide] = d.url
        covers[d.slot] = arr
      }
      const first = firstCoverUrl(covers)
      return {
        cover_photos: covers,
        couple_illustration_url: first || prev.couple_illustration_url,
      }
    })
  }

  // Upload a cover into a specific slot (pads empty slots so the couple can fill
  // any of the template's cover slots in any order).
  const setCoverAt = async (index: number, file: File) => {
    await runCoverUploads([{ index, file }])
  }

  const clearCoverAt = (index: number) => {
    if (data.is_published === true || reviewMode) return
    const covers = (Array.isArray(data.cover_photos) ? data.cover_photos : []).filter((_, i) => i !== index)
    setData(prev => ({ ...prev, cover_photos: covers, couple_illustration_url: (typeof covers[0] === 'string' ? covers[0] : Array.isArray(covers[0]) ? covers[0][0] : '') || "" }))
    save({ cover_photos: covers, couple_illustration_url: (typeof covers[0] === 'string' ? covers[0] : Array.isArray(covers[0]) ? covers[0][0] : '') || "" })
  }

  // Upload a photo into a slide of a slideshow cover slot (2 slides per slot).
  const setCoverSlideAt = async (slotIndex: number, slideIndex: number, file: File) => {
    await runCoverSlideUploads([{ slot: slotIndex, slide: slideIndex, file }])
  }

  const sessions: Session[] = Array.isArray(data.sessions) ? data.sessions : []

  const updateSession = (index: number, field: keyof Session, value: string) => {
    const updated = sessions.map((s, i) => i === index ? { ...s, [field]: value } : s)
    updateField("sessions", updated)
  }

  const addSession = () => {
    if (data.is_published === true || reviewMode) return
    // Weddings on WP templates keep the classic two-session shape (akad + resepsi).
    // In-house templates and Ceriavite ceremonies can add more sessions.
    if (!kids && !isInhouse && sessions.length >= 2) return
    updateField("sessions", [...sessions, {
      name: "", // required (Nama Acara): must be filled before the invitation can be confirmed
      date: "",
      time: "",
      venue: "",
      address: "",
      maps_url: "",
    }])
  }

  const removeSession = (index: number) => {
    updateField("sessions", sessions.filter((_, i) => i !== index))
  }

  // Ceriavite: one ceremony may introduce several ananda (siblings). This list is
  // the source of truth; the first child is mirrored into the legacy
  // first-person slot so the dashboard, OG copy and the ops queue keep reading
  // groom_* exactly as before. The parent line stays single and shared.
  //
  // `readChildren` (not `parseChildren`): a row the couple just added is still
  // blank, and dropping it would make "Tambah Ananda" look like a no-op.
  const childrenList: InvitationChild[] = useMemo(() => {
    const stored = readChildren(data.children)
    return stored.length > 0 ? stored : resolveChildren(data)
  }, [data.children, data.groom_name, data.groom_full_name, data.groom_photo_url, data.groom_instagram])

  // Builds from the LATEST state inside the functional updater, so a second
  // click can never append to a stale list.
  const applyChildren = (build: (list: InvitationChild[]) => InvitationChild[]) => {
    if (data.is_published === true || reviewMode) return
    applyFields((prev) => {
      const stored = readChildren(prev.children)
      const base = stored.length > 0 ? stored : resolveChildren(prev)
      const next = build(base).slice(0, MAX_CHILDREN)
      const first = next[0]
      return {
        children: next,
        // A child may be entered with only one of the two names; the legacy slot
        // needs a usable value in both (dashboard label, OG copy, ops queue).
        groom_name: first ? first.name || first.full_name : "",
        groom_full_name: first ? first.full_name || first.name : "",
        groom_photo_url: first?.photo_url ? [first.photo_url] : [],
        groom_instagram: first?.instagram || null,
      }
    })
  }

  const updateChild = (index: number, patch: Partial<InvitationChild>) => {
    applyChildren((list) => list.map((child, i) => (i === index ? { ...child, ...patch } : child)))
  }

  const addChild = () => {
    applyChildren((list) => [...list, { name: "", full_name: "", photo_url: "", instagram: "" }])
  }

  const removeChild = (index: number) => {
    applyChildren((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)))
  }

  const uploadChildPhoto = async (file: File, index: number) => {
    if (data.is_published === true || reviewMode) return
    setPhotoUploading(`child-${index}`)
    try {
      const url = await uploadImageFile(file)
      if (url) updateChild(index, { photo_url: url })
    } finally {
      setPhotoUploading(null)
    }
  }

  const childPhotoRefs = useRef<(HTMLInputElement | null)[]>([])

  const rundown: RundownItem[] = Array.isArray(data.rundown) ? data.rundown : []
  const updateRundown = (index: number, field: keyof RundownItem, value: string) => {
    updateField("rundown", rundown.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }
  const addRundown = () => updateField("rundown", [...rundown, { time: "", description: "" }])
  const removeRundown = (index: number) => updateField("rundown", rundown.filter((_, i) => i !== index))

  const contacts: ContactItem[] = Array.isArray(data.contacts) ? data.contacts : []
  const updateContact = (index: number, field: keyof ContactItem, value: string) => {
    updateField("contacts", contacts.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }
  const addContact = () => updateField("contacts", [...contacts, { name: "", description: "", whatsapp: "" }])
  const removeContact = (index: number) => updateField("contacts", contacts.filter((_, i) => i !== index))

  const testMapsLink = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  const stories: any[] = Array.isArray(data.stories) ? data.stories : []

  const updateStory = (index: number, field: string, value: string) => {
    const updated = stories.map((s, i) => i === index ? { ...s, [field]: value } : s)
    updateField("stories", updated)
  }

  const addStory = () => {
    if (data.is_published === true || reviewMode) return
    updateField("stories", [...stories, { title: "", description: "", image_url: "" }])
  }

  const removeStory = (index: number) => {
    updateField("stories", stories.filter((_: any, i: number) => i !== index))
  }

  const handleStoryImageUpload = async (file: File, index: number) => {
    if (data.is_published === true || reviewMode) return
    setStoryUploading(index)
    try {
      const url = await uploadImageFile(file)
      if (url) updateStory(index, "image_url", url)
    } finally {
      setStoryUploading(null)
    }
  }

  const storyFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const galleryPhotos: string[] = Array.isArray(data.gallery_photos) ? data.gallery_photos : []

  // Photo quota ("Kuota Foto"): gallery's own cap = quota − groom − bride (cover excluded).
  // Each slideshow (groom / bride) counts as 1.
  const groomPhotoCount = Array.isArray(data.groom_photo_url) && data.groom_photo_url.length > 0 ? 1 : 0
  const bridePhotoCount = Array.isArray(data.bride_photo_url) && data.bride_photo_url.length > 0 ? 1 : 0
  const galleryMax = photoQuota == null ? null : Math.max(0, photoQuota - groomPhotoCount - bridePhotoCount)
  const canAddGallery = galleryMax == null || galleryPhotos.length < galleryMax

  const coverSlotLabel = (i: number) => contentSpec?.cover_slot_labels?.[i] || `Slot ${i + 1}`
  // Slots tied to a hidden section (video off, no rundown, …) are not offered.
  const coverSlotIndexes = visibleCoverSlotIndexes(contentSpec, data, coverSlotCount)

  // Whether a field maps to a background slideshow (which needs 2 photos/slides).
  const isSlideshowField = (field: string): boolean => {
    if (contentSpec) {
      if (field === "groom_photo_url") return contentSpec.groom_photo === "slideshow"
      if (field === "bride_photo_url") return contentSpec.bride_photo === "slideshow"
      return false
    }
    const mapping = template?.wp_manifest?.[field]
    const m = Array.isArray(mapping) ? mapping[0] : mapping
    return Array.isArray(m?.settings) && m.settings.join(".") === "background_slideshow_gallery"
  }

  const isCoverSlideshowSlot = (i: number): boolean => {
    if (contentSpec) return !!contentSpec.cover_slideshows?.includes(i)
    const mapping = template?.wp_manifest?.cover_photos?.[i]
    return Array.isArray(mapping?.settings) && mapping.settings.join(".") === "background_slideshow_gallery"
  }

  function normalizeVideoUrl(url: string): string {
    if (!url || typeof url !== "string") return url
    const t = url.trim()
    try {
      const u = new URL(t)
      if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
        const id = u.searchParams.get("v")?.split("&")[0]?.split("?")[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
      }
      if (u.hostname === "youtu.be") {
        const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
      }
      return t
    } catch { return t }
  }

  const [galleryUploading, setGalleryUploading] = useState(false)
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState<string | null>(null)
  const [storyUploading, setStoryUploading] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState("")

  // Shared upload helper: compress large phone photos client-side, then POST.
  // Returns the public URL, or null after surfacing the server's message.
  const uploadImageFile = useCallback(async (file: File): Promise<string | null> => {
    uploadBusyRef.current = true
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append("file", compressed)
      const res = await fetch("/api/template-media/upload", { method: "POST", body: formData })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.url) {
        setUploadError(payload.error || "Gagal mengunggah gambar. Coba lagi.")
        return null
      }
      setUploadError("")
      return payload.url as string
    } catch {
      setUploadError("Gagal mengunggah gambar. Periksa koneksi lalu coba lagi.")
      return null
    } finally {
      uploadBusyRef.current = false
    }
  }, [])

  // Link-preview thumbnail for templates that render no cover slot. The image
  // drives og:image; "tanpa foto thumbnail" opts out and uses the generic
  // default instead of the couple portrait.
  const uploadLinkThumbnail = async (file: File) => {
    if (data.is_published === true || reviewMode) return
    setCoverUploading("link-thumb")
    try {
      const url = await uploadImageFile(file)
      if (!url) return
      setData(prev => ({ ...prev, link_thumbnail_url: url, link_thumbnail_disabled: false }))
      save({ link_thumbnail_url: url, link_thumbnail_disabled: false })
    } finally {
      setCoverUploading(null)
    }
  }

  const toggleLinkThumbnailDisabled = (next: boolean) => {
    if (data.is_published === true || reviewMode) return
    setData(prev => ({ ...prev, link_thumbnail_disabled: next }))
    save({ link_thumbnail_disabled: next })
  }

  const uploadGalleryFiles = async (files: FileList | File[]) => {    if (data.is_published === true || reviewMode) return
    if (galleryUploading) return
    const list = Array.from(files).filter(f => f.type.startsWith("image/"))
    if (list.length === 0) return
    const quota = galleryMax == null ? list.length : Math.max(0, galleryMax - galleryPhotos.length)
    const toUpload = list.slice(0, quota)
    if (toUpload.length === 0) return
    setGalleryUploading(true)
    const uploaded: string[] = []
    for (const file of toUpload) {
      const url = await uploadImageFile(file)
      if (url) uploaded.push(url)
    }
    if (uploaded.length > 0) {
      applyFields((prev) => {
        const existing = Array.isArray(prev.gallery_photos) ? prev.gallery_photos : []
        return { gallery_photos: [...existing, ...uploaded] }
      })
    }
    setGalleryUploading(false)
  }

  const removeGalleryPhoto = (index: number) => {
    updateField("gallery_photos", galleryPhotos.filter((_, i) => i !== index))
  }

  type GiftAccount = { id?: string; provider_name: string; account_number: string; account_name: string; type: string }
  const [giftAccounts, setGiftAccounts] = useState<GiftAccount[]>([])
  const [giftAddressText, setGiftAddressText] = useState("")
  const [giftAddressName, setGiftAddressName] = useState("")

  const loadGiftData = useCallback(async () => {
    try {
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
    } finally {
      setGiftLoading(false)
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
    if (data.is_published === true || reviewMode) return
    const newId = data.selected_track_id === trackId ? null : trackId
    setData(prev => ({ ...prev, selected_track_id: newId }))
    pendingUpdates.current = { ...pendingUpdates.current, selected_track_id: newId }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    fetch(`/api/dashboard/${id}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_track_id: newId }),
    }).then(() => setSaveStatus("saved")).catch(() => setSaveStatus("error"))
  }

  const handleMusicFilePick = (file: File) => {
    if (data.is_published === true || reviewMode || musicUploading) return
    setMusicUploadError("")
    if (myCustomTrack) {
      setPendingMusicFile(file)
      setShowMusicConfirm(true)
    } else {
      uploadMusic(file)
    }
  }

  const uploadMusic = async (file: File) => {
    if (data.is_published === true || reviewMode || musicUploading) return
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

  // Flush any pending (debounced) edits immediately. Returns ok:false when the
  // save fails so callers can abort instead of previewing stale data.
  const flushPendingSave = useCallback(async (): Promise<{ ok: boolean; saved: Record<string, any> }> => {
    const all = { ...pendingUpdates.current }
    pendingUpdates.current = {}
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (Object.keys(all).length === 0) return { ok: true, saved: {} }
    try {
      const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all),
      })
      if (!res.ok) return { ok: false, saved: {} }
      return { ok: true, saved: all }
    } catch {
      return { ok: false, saved: {} }
    }
  }, [id])

  const scrollCanvasToTop = useCallback(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".review-scroll").forEach(el => {
        (el as HTMLElement).scrollTo({ top: 0 })
      })
    })
  }, [])

  // Enter fullscreen preview-review: patch (flush + WP sync) first so the
  // preview shows the couple's latest data. Nothing is published yet.
  const enterReview = useCallback(async () => {
    if (reviewMode) return
    setReviewError("")
    setSaveStatus("saving")
    setPreparingReview(true)
    try {
      const flush = await flushPendingSave()
      if (!flush.ok) {
        setSaveStatus("error")
        setReviewError("Gagal menyimpan perubahan. Periksa koneksi Anda, lalu coba lagi.")
        setUploadError("Gagal menyimpan perubahan. Periksa koneksi Anda, lalu coba lagi.")
        return
      }
      if (Object.keys(flush.saved).length > 0) {
        setData(prev => ({ ...prev, ...flush.saved }))
      }
      setSaveStatus("saved")
      // In-house templates render from wedding_profiles already; only WP needs sync.
      if (isInhouse) {
        await fetchProfile()
        setPreviewVersion(v => v + 1)
      } else {
        await syncToWp()
        setPreviewVersion(v => v + 1)
      }
      prevShowMobilePreview.current = showMobilePreview
      if (typeof window !== "undefined" && window.innerWidth < 768) setShowMobilePreview(true)
      setReviewMode(true)
      scrollCanvasToTop()
    } catch {
      setSaveStatus("error")
      setReviewError("Gagal menyiapkan pratinjau. Periksa koneksi Anda, lalu coba lagi.")
      setUploadError("Gagal menyiapkan pratinjau. Periksa koneksi Anda, lalu coba lagi.")
    } finally {
      setPreparingReview(false)
    }
  }, [reviewMode, flushPendingSave, isInhouse, fetchProfile, syncToWp, showMobilePreview, scrollCanvasToTop])

  useEffect(() => {
    if (autoReviewDone.current) return
    if (initialLoading) return
    if (searchParams.get("review") !== "1") return
    autoReviewDone.current = true
    setReviewMode(true)
    if (typeof window !== "undefined" && window.innerWidth < 768) setShowMobilePreview(true)
    scrollCanvasToTop()
  }, [initialLoading, searchParams, scrollCanvasToTop])

  const exitReview = useCallback(() => {
    setReviewError("")
    setShowMobilePreview(prevShowMobilePreview.current)
    setReviewMode(false)
  }, [])

  // Final confirmation from the review screen: mark published, then show the
  // feedback upsell popup (choose). No re-sync needed — edits are locked
  // during review so the preview already matches the server data.
  const finalizePublish = useCallback(async () => {
    setPublishing(true)
    setReviewError("")
    try {
      const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: true }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as any))
        const blocked = Array.isArray((payload as any)?.incomplete) ? (payload as any).incomplete : []
        if (res.status === 422 && blocked.length > 0) {
          setReviewError(`Masih ada konten yang belum lengkap: ${blocked.map((s: any) => s.label).join(", ")}. Kembali ke edit untuk melengkapi.`)
        } else {
          setReviewError("Gagal mengonfirmasi undangan. Periksa koneksi Anda, lalu coba lagi.")
        }
        return
      }
      setData(prev => ({ ...prev, is_published: true, published_at: new Date().toISOString() }))
      setReviewMode(false)
      setShowMobilePreview(prevShowMobilePreview.current)
      setPubError("")
      setPubState("choose")
      setShowPublishConfirm(true)
    } catch {
      setReviewError("Gagal mengonfirmasi undangan. Periksa koneksi Anda, lalu coba lagi.")
    } finally {
      setPublishing(false)
    }
  }, [id])

  const openPublishConfirm = () => {
    if (isPublished || reviewMode) return
    if (giftLoading || galleryUploading || coverUploading || photoUploading || storyUploading || musicUploading) {
      setUploadError("Mohon tunggu hingga unggahan dan pemuatan data selesai, lalu coba lagi.")
      return
    }
    const incomplete = getIncompleteSections()
    if (incomplete.length > 0) {
      setPubError("")
      setPubState("ask")
      setShowPublishConfirm(true)
      return
    }
    // Content complete: skip the popup and go straight to fullscreen preview-review.
    enterReview()
  }

  // Canonical completeness input (single source of truth, shared with the API
  // gate in src/lib/invitationCompleteness.ts). Hidden or package-locked
  // sections count as complete.
  const completenessInput = useMemo(() => ({
    has_template: !!template,
    cover_photos: data.cover_photos,
    couple_illustration_url: data.couple_illustration_url,
    link_thumbnail_url: data.link_thumbnail_url,
    link_thumbnail_disabled: data.link_thumbnail_disabled === true,
    has_cover_slots: hasCoverPhotos,
    opening_title: data.opening_title,
    opening_description: data.opening_description,
    display_name: data.display_name,
    // Kids profiles carry one person: without this the editor demanded a second
    // full name and the section could never be completed.
    event_type: data.event_type,
    groom_full_name: data.groom_full_name,
    bride_full_name: data.bride_full_name,
    sessions: data.sessions,
    gallery_photos: data.gallery_photos,
    inviting_families: parseStringList(data.inviting_families),
    inviting_families_visible: data.inviting_families_visible,
    quote_text: data.quote_text,
    video_url: data.video_url,
    video_section_visible: data.video_section_visible,
    stories: data.stories,
    story_visible: data.story_visible,
    gift_section_visible: data.gift_section_visible,
    gift_has_address: typeof giftAddressText === "string" && giftAddressText.trim() !== "",
    gift_account_count: giftAccounts.length,
    // Tanpa-photo template: photo fields are hidden, so the gallery section
    // never counts as incomplete (stored photos are kept for a switch back).
    no_photo_template: template?.no_photo === true,
    // Templates whose design has no Kalimat Pembuka block never block publish.
    no_opening_section: hidesOpeningSection(template?.code),
    gates: {
      inviting_families: gates.inviting_families.included,
      cinematic_video: gates.cinematic_video.included,
      story: gates.story.included,
    },
  }), [data, gates, giftAddressText, giftAccounts, template])

  const getIncompleteSections = useCallback(
    () => getIncompleteInvitationSections(completenessInput),
    [completenessInput]
  )

  // Per-accordion completeness badge: a section shows "!" while its core
  // content is empty.
  const sectionIncomplete = (key: string): boolean => {
    return getIncompleteInvitationSections(completenessInput).some(s => s.key === key)
  }

  const scrollSectionIntoView = (section: string) => {
    requestAnimationFrame(() => {
      const container = sidebarScrollRef.current
      const el = (container?.querySelector(`[data-section="${section}"]`) ??
        document.querySelector(`[data-section="${section}"]`)) as HTMLElement | null
      if (!el) return
      if (section === "feedback" && container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
        return
      }
      if (container) {
        // offsetTop is measured against the nearest positioned ancestor (the
        // body here), not the scroll container, so it overshoots by the pane's
        // own top offset and leaves the header above the fold. Use rect math.
        const containerRect = container.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const top = container.scrollTop + (elRect.top - containerRect.top) - 24
        container.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }

  const handleSectionToggle = (section: string) => {
    if (section === "feedback" && !isPublished) {
      setShowFeedbackGate(true)
      return
    }
    setActiveSection(prev => {
      if (prev === section) scrollSectionIntoView(section)
      return prev === section ? prev : section
    })
  }

  // When the open accordion changes, scroll it into view inside the sidebar so a
  // long accordion above doesn't leave the newly-opened one hidden above the fold.
  // Depends on searchParams + initialLoading too so back-nav with the same
  // ?section= value still re-scrolls after the sidebar finishes loading.
  useEffect(() => {
    if (initialLoading || !activeSection) return
    scrollSectionIntoView(activeSection)
  }, [activeSection, initialLoading, searchParams])

  useEffect(() => {
    if (initialLoading || hasAutoFocusedFeedback.current) return
    if (data.is_published !== true) return
    const section = searchParams.get("section") || searchParams.get("return_section")
    if (!section) {
      hasAutoFocusedFeedback.current = true
      setActiveSection("feedback")
    }
  }, [initialLoading, data.is_published, searchParams])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === "string") {
        setActiveSection(detail)
        setShowMobilePreview(false)
      }
    }
    window.addEventListener("tour_open_section", handler as EventListener)
    return () => window.removeEventListener("tour_open_section", handler as EventListener)
  }, [])

  const isSectionHidden = (key: string) => {
    switch (key) {
      case "inviting": return data.inviting_families_visible === false
      // Ceriavite (kids) invitations ship no cinematic video and no love story.
      case "video": return data.video_section_visible === false || kids
      case "story": return data.story_visible === false || kids
      case "gift": return data.gift_section_visible === false
      case "dresscode": return data.dresscode_visible === false
      case "livestream": return data.livestream_visible === false
      case "rundown": return data.rundown_visible === false
      case "contacts": return data.contacts_visible === false
      default: return false
    }
  }

  const renderSection = (key: string, icon: string, label: string, content: React.ReactNode) => {
    const isActive = activeSection === key
    const hidden = isSectionHidden(key)
    const lockedInfo: string[] | null = (() => {
      if (key === "inviting" && !gates.inviting_families.included) return gates.inviting_families.availableIn
      if (key === "video" && !gates.cinematic_video.included) return gates.cinematic_video.availableIn
      if (key === "story" && !gates.story.included) return gates.story.availableIn
      return null
    })()
    const isLocked = lockedInfo !== null
    return (
      <div data-section={key} data-tour={key} className={`scroll-mt-6 border rounded-xl overflow-visible ${isActive ? "bg-[#B34E3F] border-[#B34E3F]" : "bg-white border-[#B34E3F]"} `}>
        <button
          onClick={() => handleSectionToggle(key)}
          className={`w-full flex justify-between items-center py-4 px-4 transition-colors ${isActive ? "text-white hover:text-white/90" : "text-[#2C2A29] hover:text-[#B34E3F]"} ${!isActive ? "rounded-xl" : "rounded-t-xl"}`}
        >
          <span className="font-label-md text-label-md flex items-center gap-3 min-h-[24px]">
            <span className="material-symbols-outlined text-[18px] leading-none">{icon}</span>
            {label}
            {isLocked && (
              <span className="group relative inline-flex ml-1">
                <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-white" : "text-[#6B7280]"}`}>lock</span>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">{upgradeMessage(lockedInfo!)}</span>
              </span>
            )}
            {hidden && !isLocked && (
              <span className="group relative inline-flex">
                <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-white/90" : "text-[#6B7280]"}`}>visibility_off</span>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">Konten<br/>disembunyikan - tidak<br/>tampil di undangan</span>
              </span>
            )}
            {!hidden && !isLocked && sectionIncomplete(key) && (
              <span className="group relative inline-flex ml-1 items-center" tabIndex={0}>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D97706] text-white text-[11px] font-bold leading-none">!</span>
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus-within:block group-active:block active:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[180px] whitespace-normal text-center leading-tight z-50 shadow-lg pointer-events-none">Konten belum<br/>lengkap — silakan<br/>lengkapi bagian {label}</span>
              </span>
            )}
          </span>
          <span className={`material-symbols-outlined leading-none ${isActive ? "text-white" : "text-[#2C2A29]"}`}>{isActive ? "expand_less" : "expand_more"}</span>
        </button>
        {isActive && <div className="px-4 pb-6 bg-white rounded-b-xl overflow-hidden border-t border-[#E2D9CF]">{content}</div>}
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

  // Single source of truth for the preview frame: which frame to show, its
  // src, and a remount identity (template/post id + version). The identity is
  // part of the React key so every template switch deterministically remounts
  // the frame instead of reusing a stale one. The canvas overlay keys off
  // `kind === "iframe" && readyKey !== key` so a half-painted frame is never
  // presented as final.
  const previewFrame = useMemo(() => {
    if (isInhouse) {
      const LiveComp = template?.code ? getTemplateComponent(template.code) : null
      if (!LiveComp) return { kind: "placeholder" as const }
      return {
        kind: "iframe" as const,
        src: `/preview/${id}?v=${previewVersion}`,
        // Template identity forces a remount on every template switch, even
        // when previewVersion is still 0 on a fresh editor mount.
        key: `inh-${template?.id || template?.code || "none"}-v${previewVersion}`,
      }
    }
    // Prefer the couple's own duplicated WP post; fall back to the master demo.
    // aksaraa_preview=1 tells wp.aksaraa.com to render preview-light: no audio
    // preload/autoplay (each reload would otherwise re-download the full MP3
    // from Supabase), lazy below-fold media. Render-time only, guests unaffected.
    const previewUrl = data.active_wp_post_url || template?.demo_url
    if (previewUrl) {
      const previewSrc = previewUrl.includes("aksaraa_preview=")
        ? previewUrl
        : `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}aksaraa_preview=1`
      return {
        kind: "iframe" as const,
        src: previewSrc,
        // Post identity forces a remount when the duplicate chain flips the
        // active post (or a re-pick lands on a new duplicate).
        key: `wp-${data.active_wp_post_id || "demo"}-${template?.id || "none"}-v${previewVersion}`,
      }
    }
    const LiveComp = template?.code ? getTemplateComponent(template.code) : null
    if (!LiveComp) return { kind: "placeholder" as const }
    return { kind: "direct" as const }
  }, [isInhouse, template, data.active_wp_post_url, data.active_wp_post_id, previewVersion, id])

  const previewFrameKey = previewFrame.kind === "iframe" ? previewFrame.key : ""
  iframeKeyRef.current = previewFrameKey
  const iframeReady = previewFrame.kind !== "iframe" || (readyKey !== "" && readyKey === previewFrameKey)

  // A new frame identity starts unready with no stale error.
  useEffect(() => { setIframeError("") }, [previewFrameKey])
  // Fallback: if the iframe never fires onLoad (e.g. preview blocked or
  // very slow), lift the skeleton after 5s so the editor is not stuck.
  useEffect(() => {
    if (previewFrame.kind !== "iframe" || !previewFrameKey) return
    const t = setTimeout(() => {
      if (iframeKeyRef.current === previewFrameKey && readyKey !== previewFrameKey) {
        setReadyKey(previewFrameKey)
      }
    }, 5000)
    return () => clearTimeout(t)
  }, [previewFrameKey, previewFrame.kind, readyKey])

  const renderPreviewBody = () => {
    // In-house templates preview through the per-couple preview route inside a
    // real iframe sized like a device, so the editor shows exactly what guests
    // see on a real phone. "Perbarui Undangan" saves, then remounts it.
    if (previewFrame.kind === "iframe") {
      return (
        <iframe
          key={previewFrame.key}
          src={previewFrame.src}
          className="w-full h-full border-0"
          title="Pratinjau"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )
    }
    if (previewFrame.kind !== "direct") {
      return (
        <div className="h-full flex items-center justify-center text-on-surface-variant font-body-md">
          Pilih template untuk melihat pratinjau
        </div>
      )
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
        guest_qr_url={featureSet.has("qr_code_book") ? `/qr/preview?preview=1&slug=${encodeURIComponent(data.slug || "")}&couple=${encodeURIComponent(resolveCoupleName(data))}&date=${encodeURIComponent(data.estimated_wedding_date || "")}&time=${encodeURIComponent(sessions[0]?.time || "")}&venue=${encodeURIComponent(sessions[0]?.venue || "")}&address=${encodeURIComponent(sessions[0]?.address || "")}&photo=${encodeURIComponent(data.gallery_photo_url || "")}&hashtag=${encodeURIComponent(data.display_name || "")}` : undefined}
        display_name={data.display_name || undefined}
        cover_photos={data.cover_photos || undefined}
        couple_initials={data.couple_initials || undefined}
        opening_title={data.opening_title || undefined}
        opening_description={data.opening_description || undefined}
        video_url={data.video_url || undefined}
        bride_instagram={data.bride_instagram || undefined}
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
        children={childrenList}
        groom_parents={data.groom_parents || undefined}
        bride_parents={data.bride_parents || undefined}
        inviting_families={gates.inviting_families.included && Array.isArray(data.inviting_families) ? data.inviting_families.filter(Boolean) : undefined}
        gift_accounts={giftAccounts.length > 0 ? giftAccounts.map(a => ({ provider_name: a.provider_name, account_number: a.account_number, account_name: a.account_name, type: a.type })) : undefined}
        gift_address={gates.gift_address.included ? giftAddressText || undefined : undefined}
        gift_address_name={giftAddressName || undefined}
        gift_section_visible={data.gift_section_visible !== false}
        video_section_visible={data.video_section_visible !== false}
        inviting_families_visible={data.inviting_families_visible !== false}
        story_visible={data.story_visible !== false}
        rundown={data.rundown || undefined}
        contacts={data.contacts || undefined}
        rundown_visible={data.rundown_visible !== false}
        contacts_visible={data.contacts_visible !== false}
        track_url={selectedTrack?.audio_url || (isInhouse ? ASSETS.defaultMusic : undefined)}
        auto_play={autoPlay || undefined}
        rsvp_max_pax={data.rsvp_max_pax ?? 2}
        event_type={data.event_type || profile?.event_type || "wedding"}
        subject_gender={data.subject_gender || profile?.subject_gender || undefined}
        language={data.language === "en" ? "en" : "id"}
        event_labels={profileView({ ...data, event_type: data.event_type || profile?.event_type, subject_gender: data.subject_gender || profile?.subject_gender, language: data.language }).labels}
        feature_gates={{
          story: gates.story.included,
          gift_address: gates.gift_address.included,
          inviting_families: gates.inviting_families.included,
          video: gates.cinematic_video.included,
          qr_code_book: featureSet.has("qr_code_book"),
        }}
      />
    )
  }

  const openingMatch = matchOpeningPreset(data.opening_title)
  const isOpeningCustom = openingCustomMode || (!!data.opening_title && !openingMatch)
  const openingSelectValue =
    openingMatch && !openingCustomMode
      ? (data.opening_title as string)
      : data.opening_title || openingCustomMode
        ? OPENING_CUSTOM
        : ""

  return (
    <>
      <PageTheme mode="light" />
      {/* Fixed to the viewport, not 100dvh: on mobile the dynamic toolbar makes
          dvh lag behind the visible height, which leaves the cream body showing
          below the shell after a re-render and makes the layout look shifted up. */}
      <div className="fixed inset-0 flex flex-col text-on-surface font-body-md overflow-hidden" style={DASH_SATIN_BG}>

        {/* TOP BAR */}
        <header className="border-b border-outline-variant flex items-center px-6 lg:px-8 w-full h-20 z-50 shrink-0 gap-4" style={DASH_HERO_BG}>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => (reviewMode ? exitReview() : router.push(`/dashboard/${id}`))}
              disabled={publishing}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
              aria-label={reviewMode ? "Kembali edit" : "Kembali ke dashboard"}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-label-md text-label-md hidden sm:inline">{reviewMode ? "KEMBALI EDIT" : "DASHBOARD"}</span>
            </button>
            <div className="h-8 w-px bg-outline-variant hidden sm:block" />
            <div className="hidden sm:block min-w-0">
              {initialLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-5 w-32 bg-surface-container-high rounded" />
                  <div className="h-3 w-24 bg-surface-container-high rounded" />
                </div>
              ) : (
                <>
                  <h1 className="font-headline-md text-[18px] lg:text-[20px] text-primary tracking-tight font-bold truncate max-w-[180px] xl:max-w-none">{resolveCoupleName(data) || "Undangan"}</h1>
                  <p className="font-label-md text-[10px] text-on-surface-variant flex items-center gap-1" title={syncStatus === "error" && syncError ? syncError : undefined}>
                    <span className={`w-1.5 h-1.5 rounded-full ${saveStatusColor}`} />
                    {saveStatusLabel}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center gap-2 lg:gap-3">
            {initialLoading ? (
              <div className="hidden md:flex items-center gap-2 animate-pulse">
                <div className="h-10 w-32 bg-surface-container-high rounded-full" />
                <div className="h-10 w-28 bg-surface-container-high rounded-full" />
                <div className="h-10 w-10 bg-surface-container-high rounded-full" />
                <div className="h-10 w-28 bg-surface-container-high rounded-full" />
              </div>
            ) : reviewMode ? (
              <>
                <span className="md:hidden font-label-md text-[10px] uppercase tracking-widest text-primary">Pratinjau Final</span>
                <span className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2C2A29] text-white font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>PRATINJAU FINAL</span>
                </span>
                <span className="hidden md:inline-flex relative group">
                  <button role="switch" aria-checked={previewDevice === "desktop"} onClick={() => { setPreviewDevice(prev => prev === "mobile" ? "desktop" : "mobile"); scrollCanvasToTop() }} disabled={initialLoading} className="relative inline-flex items-center w-[72px] h-9 rounded-full border border-outline-variant bg-white px-1 transition-colors disabled:opacity-50" aria-label="Ganti tampilan pratinjau">
                    <span className={`material-symbols-outlined text-[18px] z-10 flex-1 text-center transition-colors ${previewDevice === "mobile" ? "text-white" : "text-on-surface-variant"}`}>smartphone</span>
                    <span className={`material-symbols-outlined text-[18px] z-10 flex-1 text-center transition-colors ${previewDevice === "desktop" ? "text-white" : "text-on-surface-variant"}`}>desktop_mac</span>
                    <span className={`absolute top-1 bottom-1 left-1 w-[30px] rounded-full bg-[#B34E3F] transition-transform duration-300 ${previewDevice === "desktop" ? "translate-x-8" : "translate-x-0"}`} />
                  </button>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[160px] whitespace-normal text-center leading-tight z-50 shadow-lg pointer-events-none">Ganti<br/>tampilan pratinjau</span>
                </span>
              </>
            ) : (
              <>
            <div data-tour="ganti-tema" className="inline-flex items-center">
              <span className="inline-flex md:hidden flex-col items-center gap-1">
              <button
                onClick={() => {
                  try { sessionStorage.setItem('from_templates_' + id, '1') } catch {}
                  router.push(`/dashboard/${id}/web-invitation/templates`)
                }}
                disabled={isPublished || initialLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 border font-label-md text-label-md rounded-full transition-all active:scale-95 border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary bg-white disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>PILIH TEMA</span>
              </button>
              {template?.name && (
                <span className="font-headline-md text-[12px] leading-tight text-primary text-center px-2">
                  {template.name}
                </span>
              )}
              </span>
              <button
                onClick={() => {
                  try { sessionStorage.setItem('from_templates_' + id, '1') } catch {}
                  router.push(`/dashboard/${id}/web-invitation/templates`)
                }}
                disabled={isPublished || initialLoading}
                className={`hidden md:inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 border font-label-md text-label-md rounded-full transition-all active:scale-95 ${
                  isPublished
                    ? "border-outline-variant text-on-surface-variant/50 cursor-not-allowed bg-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary bg-white"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">palette</span>
                <span>PILIH TEMA</span>
              </button>
            </div>

            <span className="hidden md:inline-flex relative group">
              <button role="switch" aria-checked={previewDevice === "desktop"} onClick={() => setPreviewDevice(prev => prev === "mobile" ? "desktop" : "mobile")} disabled={initialLoading} className="relative inline-flex items-center w-[72px] h-9 rounded-full border border-outline-variant bg-white px-1 transition-colors disabled:opacity-50" aria-label="Ganti tampilan pratinjau">
                <span className={`material-symbols-outlined text-[18px] z-10 flex-1 text-center transition-colors ${previewDevice === "mobile" ? "text-white" : "text-on-surface-variant"}`}>smartphone</span>
                <span className={`material-symbols-outlined text-[18px] z-10 flex-1 text-center transition-colors ${previewDevice === "desktop" ? "text-white" : "text-on-surface-variant"}`}>desktop_mac</span>
                <span className={`absolute top-1 bottom-1 left-1 w-[30px] rounded-full bg-[#B34E3F] transition-transform duration-300 ${previewDevice === "desktop" ? "translate-x-8" : "translate-x-0"}`} />
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[160px] whitespace-normal text-center leading-tight z-50 shadow-lg pointer-events-none">Ganti<br/>tampilan pratinjau</span>
            </span>

            <button
              data-tour="konfirmasi"
              onClick={openPublishConfirm}
              disabled={isPublished || initialLoading}
              className={`hidden md:inline-flex px-5 py-2.5 font-label-md text-label-md rounded-full transition-all active:scale-95 shadow-sm ${
                isPublished
                  ? "flex-col items-center justify-center bg-emerald-600 text-white cursor-default border border-emerald-600 py-1.5 px-4 leading-none"
                  : "items-center bg-[#9E3B2D] text-white hover:bg-[#8d2e20] border border-[#9E3B2D]"
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
              </>
            )}
          </div>

          <div className="flex items-center shrink-0 gap-2">
            {reviewMode && (
              <button
                onClick={finalizePublish}
                disabled={publishing || updatingPreview}
                className="md:hidden inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-secondary text-on-secondary font-label-md text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                <span className={`material-symbols-outlined text-[18px] ${publishing ? "animate-spin" : ""}`}>{publishing ? "progress_activity" : "check_circle"}</span>
                {publishing ? "Memproses..." : "Konfirmasi"}
              </button>
            )}
            <div className={reviewMode ? "hidden md:block" : ""}>
              <ProfileMenu />
            </div>
          </div>
        </header>

        {reviewMode && (
          <div className="md:hidden shrink-0 px-6 py-2.5 bg-surface-container-low border-b border-outline-variant">
            {reviewError ? (
              <p className="flex items-start gap-2 text-[11px] text-red-700 leading-snug">
                <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                <span>{reviewError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Scroll undangan hingga akhir dan pastikan semuanya benar. Setelah dikonfirmasi, konten tidak dapat diubah.
              </p>
            )}
          </div>
        )}

        {syncStatus === "error" && syncError && (
          <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 bg-red-50 border-b border-red-200 flex items-start sm:items-center gap-3">
            <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5 sm:mt-0">error</span>
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-[11px] uppercase tracking-widest text-red-700">Sinkronisasi Gagal</p>
              <p className="text-[13px] text-[#2C2A29] leading-snug">{syncError}</p>
            </div>
            <button
              onClick={handleUpdatePreview}
              disabled={updatingPreview || isPublished}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B34E3F] text-white font-label-md text-[12px] hover:bg-[#9E3B2D] disabled:opacity-50 transition-colors"
            >
              <span className={`material-symbols-outlined text-[16px] ${updatingPreview ? "animate-spin" : ""}`}>{updatingPreview ? "progress_activity" : "refresh"}</span>
              {updatingPreview ? "Mencoba..." : "Coba Lagi"}
            </button>
          </div>
        )}

        {/* MAIN */}
        <main className="flex-1 min-h-0 flex overflow-hidden">
          {/* SIDEBAR */}
            <aside data-tour="konten" className={reviewMode ? "hidden" : `${showMobilePreview ? 'hidden' : 'flex'} md:flex w-full md:w-[440px] bg-[#F3F4F6] border-r border-outline-variant flex-col h-full min-h-0 z-40 shrink-0`}>
            <div className="flex border-b border-outline-variant">
              <button className="flex-1 py-4 font-label-md text-label-md text-primary border-b-2 border-primary text-center">KONTEN</button>
            </div>

            {isPublished && (
              <div className="px-4 py-3 bg-surface-container-high border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                <p className="font-label-md text-[11px] text-on-surface-variant leading-snug">Undangan sudah dikonfirmasi. Konten bersifat <span className="font-semibold text-primary">hanya lihat</span> — tidak dapat diubah.</p>
              </div>
            )}

            <div ref={sidebarScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-6 pb-32 space-y-4 md:pb-6">
              {initialLoading ? (
                <SidebarShimmer />
              ) : (
                <>
              {(languageUiEnabled || data.language === "en") && renderSection("bahasa", "language", "BAHASA UNDANGAN",
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block font-label-md text-[10px] tracking-widest text-on-surface-variant mb-2">BAHASA UNDANGAN</label>
                    <div className="relative">
                      <select
                        className="input-editorial w-full font-body-md text-[14px] cursor-pointer appearance-none pr-10 bg-white"
                        value={data.language === "en" ? "en" : "id"}
                        onChange={(e) => updateField("language", e.target.value === "en" ? "en" : "id")}
                        disabled={isPublished || reviewMode}
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <p className="font-body-md text-[12px] text-on-surface-variant leading-relaxed">
                    Seluruh undangan akan tampil dalam bahasa ini untuk semua tamu.
                  </p>
                </div>
              )}

              {renderSection("sampul", "photo_album", "SAMPUL",
                <div className="mt-6 space-y-8">
                  {/* Tanpa-photo: cover slots hidden, initials/date stay */}
                  {hasCoverPhotos && (
                  <div className="space-y-3">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Foto Sampul</label>
                    <p className="text-[11px] text-on-surface-variant italic">
                      {`${coverSlotIndexes.length} slot foto tersedia pada template${coverSlotIndexes.length ? ` (${coverSlotIndexes.map(coverSlotLabel).join(" · ")})` : ""}. Isi setiap slot untuk mengganti foto.`}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {coverSlotIndexes.map((i) => {
                        const slotValue = (Array.isArray(data.cover_photos) ? data.cover_photos : [])[i]
                        if (isCoverSlideshowSlot(i)) {
                          const slides = Array.isArray(slotValue) ? slotValue : (typeof slotValue === "string" && slotValue !== "" ? [slotValue] : [])
                          return (
                            <div key={i} className="col-span-2 border border-outline-variant rounded p-2 bg-surface-container-lowest">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{coverSlotLabel(i)} — Slideshow (2 foto)</span>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[0, 1].map(s => {
                                  const key = `cover-${i}-${s}`
                                  const uploading = coverUploading === key
                                  const url = slides[s]
                                  if (uploading) {
                                    return (
                                      <div key={s} className="relative aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                      </div>
                                    )
                                  }
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
                        const key = `cover-${i}`
                        const uploading = coverUploading === key
                        if (uploading) {
                          return (
                            <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center">
                              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                            </div>
                          )
                        }
                        const url = typeof slotValue === "string" ? slotValue : (Array.isArray(slotValue) ? slotValue[0] : "")
                        if (url) {
                          return (
                            <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                              <div className={`absolute inset-0 bg-cover bg-center ${data.grayscale ? "grayscale" : ""}`} style={{ backgroundImage: `url(${url})` }} />
                              <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                              <span className="absolute bottom-1 left-1 right-1 bg-black/55 text-white text-[9px] px-1 py-0.5 rounded-sm truncate">{coverSlotLabel(i)}</span>
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
                            <span className="text-[9px] text-on-surface-variant mt-1">{coverSlotLabel(i)}</span>
                          </div>
                        )
                      })}
                    </div>
                    <input ref={coverReplaceRef} type="file" accept="image/*" multiple className="hidden" onChange={async e => { const files = e.target.files ? Array.from(e.target.files).filter(f => f.type.startsWith("image/")) : []; const pairs: { index: number; file: File }[] = []; const start = coverReplaceIndex !== null ? Math.max(0, coverSlotIndexes.indexOf(coverReplaceIndex)) : 0; if (files.length) { for (let k = 0; k < files.length; k++) { const idx = coverSlotIndexes[start + k]; if (idx === undefined) break; if (isCoverSlideshowSlot(idx)) continue; pairs.push({ index: idx, file: files[k] }) } if (coverReplaceIndex !== null) setCoverReplaceIndex(null) } e.target.value = ""; if (pairs.length) { setCoverReplaceIndex(null); await runCoverUploads(pairs) } }} />
                    <input ref={coverSlideRef} type="file" accept="image/*" multiple className="hidden" onChange={async e => { const files = e.target.files ? Array.from(e.target.files).filter(f => f.type.startsWith("image/")) : []; const pairs: { slot: number; slide: number; file: File }[] = []; if (files.length && coverSlideTarget !== null) { let si = coverSlideTarget.slot, sl = coverSlideTarget.slide; for (const f of files) { pairs.push({ slot: si, slide: sl, file: f }); sl++; if (sl > 1) { sl = 0; si++; while (si < coverSlotCount && !isCoverSlideshowSlot(si)) si++; if (si >= coverSlotCount) break } } setCoverSlideTarget(null) } e.target.value = ""; if (pairs.length) await runCoverSlideUploads(pairs) }} />
                  </div>
                  )}
                  {hasCoverPhotos ? (
                    <div className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5">
                      <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
                      <p className="text-[11px] text-on-surface-variant leading-snug">
                        Foto sampul pertama juga dipakai sebagai thumbnail tautan undangan (WhatsApp dan media sosial).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-outline-variant p-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                          Thumbnail Tautan Undangan
                        </label>
                        {!data.link_thumbnail_disabled && (
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                            Wajib
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-snug">
                        Template ini tidak punya foto sampul. Unggah gambar yang tampil saat tautan undangan dibagikan
                        (WhatsApp, media sosial). Rasio ideal 1.91:1.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => linkThumbRef.current?.click()}
                          disabled={data.is_published === true}
                          className="relative w-24 aspect-[1.91/1] shrink-0 overflow-hidden rounded border border-dashed border-outline-variant bg-surface-dim flex items-center justify-center disabled:opacity-50"
                          title={data.link_thumbnail_url ? "Ganti thumbnail" : "Unggah thumbnail"}
                        >
                          {coverUploading === "link-thumb" ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                          ) : data.link_thumbnail_url ? (
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.link_thumbnail_url})` }} />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                          )}
                        </button>
                        <div className="min-w-0 space-y-1">
                          <button
                            type="button"
                            onClick={() => linkThumbRef.current?.click()}
                            disabled={data.is_published === true || coverUploading === "link-thumb"}
                            className="rounded-full bg-secondary px-4 py-2 font-label-md text-[10px] uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {data.link_thumbnail_url ? "Ganti Gambar" : "Unggah Gambar"}
                          </button>
                          <p className="text-[10px] text-on-surface-variant">JPG atau PNG. Rekomendasi 1200 × 630 px.</p>
                        </div>
                      </div>
                      <input
                        ref={linkThumbRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          e.target.value = ""
                          if (file) await uploadLinkThumbnail(file)
                        }}
                      />
                      <label className="flex items-start gap-2 pt-1">
                        <input
                          type="checkbox"
                          checked={data.link_thumbnail_disabled === true}
                          onChange={e => toggleLinkThumbnailDisabled(e.target.checked)}
                          disabled={data.is_published === true}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#B34E3F]"
                        />
                        <span className="text-[11px] leading-snug text-on-surface-variant">
                          Tanpa gambar thumbnail (tautan tampil tanpa foto)
                        </span>
                      </label>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Tanggal Acara</label>
                    <input className="input-editorial w-full font-headline-md text-[16px]" type="date" value={data.estimated_wedding_date || ""} onChange={e => updateField("estimated_wedding_date", e.target.value)} />
                    <p className="text-[11px] text-on-surface-variant mt-1 italic">Tanggal utama yang tampil pada sampul undangan.</p>
                  </div>
                  <div className="space-y-2">
                    {!kids && (
                      <>
                        <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Hashtag Instagram Post</label>
                        <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.display_name || ""} onChange={e => updateField("display_name", e.target.value)} placeholder="#RiaYusufBersatu" />
                        <p className="text-[11px] text-on-surface-variant mt-1 italic">Tampil pada undangan sebagai hashtag. Contoh: #RiaYusufWedding. Kosongkan untuk menyembunyikan.</p>
                      </>
                    )}
                  </div>
                  {contentSpec?.initials !== false && (
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Singkatan Pasangan</label>
                    <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={data.couple_initials || ""} onChange={e => updateField("couple_initials", e.target.value)} placeholder="WD" />
                    <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: WD, AC — semua karakter yang ditulis tampil pada monogram sampul; otomatis mengecil bila lebih dari 2.</p>
                  </div>
                  )}
                </div>
              )}

              {!hidesOpeningSection(template?.code) && renderSection("pembuka", "chat_bubble", "KALIMAT PEMBUKA",
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Judul</label>
                    <select
                      className="input-editorial w-full font-body-md text-[14px] cursor-pointer"
                      value={openingSelectValue}
                      onChange={e => {
                        const value = e.target.value
                        if (value === "" || value === OPENING_CUSTOM) {
                          setOpeningCustomMode(true)
                          return
                        }
                        const preset = matchOpeningPreset(value)
                        if (!preset) return
                        setOpeningCustomMode(false)
                        updateField("opening_title", preset.title)
                        updateField("opening_description", preset.description)
                      }}
                    >
                      <option value="">-- Pilih Judul --</option>
                      {OPENING_PRESETS.map(p => (
                        <option key={p.title} value={p.title}>{p.title}</option>
                      ))}
                      <option value={OPENING_CUSTOM}>{OPENING_CUSTOM}</option>
                    </select>
                  </div>
                  {isOpeningCustom && (
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Judul Custom</label>
                      <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.opening_title || ""} onChange={v => updateField("opening_title", v)} placeholder="Perkenankanlah kami mengundang" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Deskripsi</label>
                    <AutoTextarea className="input-editorial w-full font-body-md text-[14px] resize-none disabled:opacity-60 overflow-hidden" value={data.opening_description || ""} onChange={v => updateField("opening_description", v)} placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami…" disabled={!isOpeningCustom} minRows={3} />
                    {!template?.wp_manifest?.opening_description && (
                      <p className="text-[11px] text-on-surface-variant/70 mt-1 italic">Catatan: Template ini hanya menampilkan Judul. Deskripsi tidak akan tampil di undangan.</p>
                    )}
                  </div>
                </div>
              )}

              {renderSection("profile", "group", kids ? "PROFILE ANANDA" : "PROFILE MEMPELAI",
                kids ? (
                  <div className="mt-6 space-y-6">
                    <p className="text-[11px] text-on-surface-variant italic">
                      Satu undangan boleh memuat lebih dari satu ananda (saudara). Nama orang tua ditulis sekali untuk semuanya.
                    </p>

                    {childrenList.map((child, index) => {
                      const uploading = photoUploading === `child-${index}`
                      return (
                        <div key={`ananda-${index}`} className="bg-surface-container-low border border-outline-variant p-4 space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                              Ananda {index + 1}
                            </span>
                            {childrenList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChild(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                aria-label={`Hapus ananda ${index + 1}`}
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>

                          <div className="flex gap-4 items-start">
                            {hasPersonPhotos && (
                              <>
                                <div
                                  onClick={() => { if (!uploading) childPhotoRefs.current[index]?.click() }}
                                  className={`w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center relative overflow-hidden shrink-0 ${uploading ? "cursor-wait" : "cursor-pointer hover:bg-surface-container-highest"} transition-colors`}
                                >
                                  {uploading ? (
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                  ) : child.photo_url ? (
                                    <>
                                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${child.photo_url})` }} />
                                      <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>
                                    </>
                                  ) : (
                                    <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                                  )}
                                </div>
                                <input
                                  ref={el => { childPhotoRefs.current[index] = el }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadChildPhoto(f, index); e.target.value = "" }}
                                />
                              </>
                            )}
                            <div className="flex-1 space-y-2">
                              <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={child.name} onChange={v => updateChild(index, { name: v })} placeholder="Nama panggilan ananda" />
                              <p className="text-[11px] text-on-surface-variant italic">Nama panggilan ananda</p>
                              <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={child.full_name} onChange={v => updateChild(index, { full_name: v })} placeholder="Nama lengkap ananda" />
                              <p className="text-[11px] text-on-surface-variant italic">Nama lengkap ananda</p>
                            </div>
                          </div>

                          <div>
                            <input
                              className="input-editorial w-full font-headline-md text-[16px]"
                              type="text"
                              value={child.instagram}
                              onChange={e => updateChild(index, { instagram: e.target.value })}
                              placeholder="Instagram (opsional)"
                            />
                            <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @raka</p>
                          </div>
                        </div>
                      )
                    })}

                    {childrenList.length < MAX_CHILDREN && (
                      <button
                        type="button"
                        onClick={addChild}
                        className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        TAMBAH ANANDA
                      </button>
                    )}

                    <div className="border-t border-outline-variant pt-6">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama Orang Tua</label>
                      <div className="mt-3">
                        <AutoTextarea className="input-editorial w-full font-headline-md text-[16px] resize-none overflow-hidden" value={data.groom_parents || ""} onChange={v => updateField("groom_parents", v)} placeholder="Bapak ... & Ibu ..." />
                        <p className="text-[11px] text-on-surface-variant mt-1 italic">Ditampilkan satu kali untuk semua ananda. Contoh: Bapak Hendra &amp; Ibu Sari</p>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="mt-6 space-y-8">
                  <div className="space-y-4">
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Pertama</label>
                    {isSlideshowField("groom_photo_url") ? (
                      <div className="space-y-3">
                        {/* Tanpa-photo: slideshow grid hidden, names stay */}
                        {hasPersonPhotos && (
                        <div className="border border-outline-variant rounded p-2 bg-surface-container-lowest">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slideshow (harus 2 foto)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[0, 1].map(i => {
                              const url = data.groom_photo_url[i]
                              const uploading = photoUploading === `groom_photo_url-${i}`
                              if (uploading) {
                                return (
                                  <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    <input ref={el => { groomPhotoSlotRef.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSlideUpload(f, "groom_photo_url", i); e.target.value = "" }} />
                                  </div>
                                )
                              }
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
                        )}
                        <div className="space-y-2">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.groom_name || ""} onChange={v => updateField("groom_name", v)} placeholder={kids ? "Nama panggilan ananda" : "Nama Mempelai Pertama"} />
                          <p className="text-[11px] text-on-surface-variant italic">{kids ? "Nama panggilan ananda" : "Nama Mempelai Pertama"}</p>
                        </div>
                        <div className="space-y-2">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.groom_full_name || ""} onChange={v => updateField("groom_full_name", v)} placeholder={kids ? "Nama lengkap ananda" : "Nama Lengkap Mempelai Pertama"} />
                          <p className="text-[11px] text-on-surface-variant italic">{kids ? "Nama lengkap ananda" : "Nama Lengkap Mempelai Pertama"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-end">
                        {/* Tanpa-photo: person photo hidden, names stay */}
                        {hasPersonPhotos && (
                        <>
                        <div onClick={() => { if (photoUploading !== "groom_photo_url") groomPhotoRef.current?.click() }} className={`w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center relative overflow-hidden shrink-0 ${photoUploading === "groom_photo_url" ? "cursor-wait" : "cursor-pointer hover:bg-surface-container-highest"} transition-colors`}>
                          {photoUploading === "groom_photo_url" ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                          ) : data.groom_photo_url[0] ? (
                            <>
                              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.groom_photo_url[0]})` }} />
                              <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>
                            </>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                          )}
                        </div>
                        <input ref={groomPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "groom_photo_url") }} />
                        </>
                        )}
                        <div className="flex-1">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.groom_name || ""} onChange={v => updateField("groom_name", v)} placeholder={kids ? "Nama panggilan ananda" : "Nama Mempelai Pertama"} />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">{kids ? "Nama panggilan ananda" : "Nama Mempelai Pertama"}</p>
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] mt-3 resize-none overflow-hidden" value={data.groom_full_name || ""} onChange={v => updateField("groom_full_name", v)} placeholder={kids ? "Nama lengkap ananda" : "Nama Lengkap Mempelai Pertama"} />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">{kids ? "Nama lengkap ananda" : "Nama Lengkap Mempelai Pertama"}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <AutoTextarea className="input-editorial w-full font-headline-md text-[16px] resize-none overflow-hidden" value={data.groom_parents || ""} onChange={v => updateField("groom_parents", v)} placeholder={kids ? "Bapak ... & Ibu ..." : "Nama Orang Tua Mempelai Pertama"} />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Putra dari Bapak Hendra & Ibu Sari</p>
                    </div>
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.groom_instagram || ""} onChange={e => updateField("groom_instagram", e.target.value)} placeholder={kids ? "Instagram (opsional)" : "Instagram Mempelai Pertama"} />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @amospurba</p>
                    </div>
                  </div>
                  <div className={kids ? "hidden" : "space-y-4"}>
                    <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Mempelai Kedua</label>
                    {isSlideshowField("bride_photo_url") ? (
                      <div className="space-y-3">
                        {/* Tanpa-photo: slideshow grid hidden, names stay */}
                        {hasPersonPhotos && (
                        <div className="border border-outline-variant rounded p-2 bg-surface-container-lowest">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slideshow (harus 2 foto)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[0, 1].map(i => {
                              const url = data.bride_photo_url[i]
                              const uploading = photoUploading === `bride_photo_url-${i}`
                              if (uploading) {
                                return (
                                  <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    <input ref={el => { bridePhotoSlotRef.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSlideUpload(f, "bride_photo_url", i); e.target.value = "" }} />
                                  </div>
                                )
                              }
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
                        )}
                        <div className="space-y-2">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.bride_name || ""} onChange={v => updateField("bride_name", v)} placeholder="Nama Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Mempelai Kedua</p>
                        </div>
                        <div className="space-y-2">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.bride_full_name || ""} onChange={v => updateField("bride_full_name", v)} placeholder="Nama Lengkap Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant italic">Nama Lengkap Mempelai Kedua</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-end">
                        {/* Tanpa-photo: person photo hidden, names stay */}
                        {hasPersonPhotos && (
                        <>
                        <div onClick={() => { if (photoUploading !== "bride_photo_url") bridePhotoRef.current?.click() }} className={`w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center relative overflow-hidden shrink-0 ${photoUploading === "bride_photo_url" ? "cursor-wait" : "cursor-pointer hover:bg-surface-container-highest"} transition-colors`}>
                          {photoUploading === "bride_photo_url" ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                          ) : data.bride_photo_url[0] ? (
                            <>
                              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.bride_photo_url[0]})` }} />
                              <span className="material-symbols-outlined text-white relative z-10 drop-shadow-md">edit</span>
                            </>
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                          )}
                        </div>
                        <input ref={bridePhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "bride_photo_url") }} />
                        </>
                        )}
                        <div className="flex-1">
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={data.bride_name || ""} onChange={v => updateField("bride_name", v)} placeholder="Nama Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Mempelai Kedua</p>
                          <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] mt-3 resize-none overflow-hidden" value={data.bride_full_name || ""} onChange={v => updateField("bride_full_name", v)} placeholder="Nama Lengkap Mempelai Kedua" />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">Nama Lengkap Mempelai Kedua</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <AutoTextarea className="input-editorial w-full font-headline-md text-[16px] resize-none overflow-hidden" value={data.bride_parents || ""} onChange={v => updateField("bride_parents", v)} placeholder="Nama Orang Tua Mempelai Kedua" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: Putri dari Bapak Wijaya & Ibu Dewi</p>
                    </div>
                    <div className="mt-3">
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={data.bride_instagram || ""} onChange={e => updateField("bride_instagram", e.target.value)} placeholder="Instagram Mempelai Kedua" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @claudiamnrg</p>
                    </div>
                  </div>
                  
                </div>
                )
              )}

              {renderSection("acara", "calendar_today", "ACARA",
                <div className="mt-6 space-y-8">
                  {sessions.map((session, i) => (
                    <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-6">
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Acara</label>
                          <AutoTextarea
                            className="input-editorial font-label-md text-[14px] font-bold w-full resize-none overflow-hidden"
                            style={session.name ? { color: "#8D4D39" } : undefined}
                            placeholder={kids ? "Contoh: Walimatul Khitan" : i === 0 ? "Contoh: Akad Nikah / Pemberkatan" : "Contoh: Resepsi"}
                            value={session.name}
                            onChange={v => updateSession(i, "name", v)}
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
                        <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Tempat</label>
                        <AutoTextarea className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden" value={session.venue} onChange={v => updateSession(i, "venue", v)} placeholder="Nama venue atau lokasi" />
                      </div>
                      <div>
                        <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Alamat Lengkap</label>
                        <AutoTextarea className="input-editorial w-full font-label-md text-[14px] min-h-[60px] resize-none overflow-hidden" placeholder="Masukkan alamat lengkap..." value={session.address} onChange={v => updateSession(i, "address", v)} />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Link Google Maps</label>
                          <input className="input-editorial w-full font-label-md text-[14px]" placeholder="https://maps.google.com/..." type="text" value={session.maps_url} onChange={e => updateSession(i, "maps_url", e.target.value)} />
                        </div>
                        <button onClick={() => testMapsLink(session.maps_url)} className="bg-secondary text-white rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all mb-2">UJI LINK</button>
                      </div>
                    </div>
                  ))}
                  {(kids || isInhouse || sessions.length < 2) && (
                    <button onClick={addSession} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      TAMBAH SESI ACARA LAIN
                    </button>
                  )}
                </div>
              )}

              {/* Tanpa-photo: whole gallery section removed (photos-only) */}
              {!isNoPhoto && renderSection("galeri", "photo_library", "GALERI",
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
                      {galleryUploading && (
                        <div className="aspect-square border border-outline flex items-center justify-center bg-surface-dim">
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        </div>
                      )}
                      {canAddGallery && !galleryUploading && (
                        <div onClick={() => galleryFileRef.current?.click()} className="aspect-square border border-dashed border-outline flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest cursor-pointer transition-colors">
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          <span className="text-[8px] font-bold mt-1">TAMBAH</span>
                        </div>
                      )}
                      {!canAddGallery && galleryUploading && (
                        <div className="aspect-square border border-outline flex items-center justify-center bg-surface-dim">
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        </div>
                      )}
                    </div>
                    <input ref={galleryFileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = e.target.files; if (f && f.length) { uploadGalleryFiles(f); e.target.value = "" } }} />
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
                      <p className="text-[11px] text-on-surface-variant italic">Masukkan nama keluarga yang turut mengundang, pisahkan dengan enter</p>
                      <textarea
                        className="input-editorial w-full font-headline-md text-[16px] min-h-[120px] resize-none"
                        value={(Array.isArray(data.inviting_families) ? data.inviting_families : []).join("\n")}
                        onChange={e => {
                          const lines = e.target.value.split("\n").map(s => s.trim()).filter(Boolean)
                          const originalLines = e.target.value.split("\n")
                          const hasTrailingEmpty = originalLines.length > 0 && originalLines[originalLines.length - 1] === ""
                          const result = hasTrailingEmpty ? [...lines, ""] : lines
                          if (e.target.value === "") {
                            updateField("inviting_families", [])
                          } else {
                            const arr = e.target.value.split("\n")
                            updateField("inviting_families", arr)
                          }
                        }}
                        onBlur={e => {
                          const arr = e.target.value.split("\n").map(s => s.trim()).filter(Boolean)
                          updateField("inviting_families", arr)
                        }}
                        placeholder={"Keluarga Bapak H. Sulaiman & Ibu Hj. Fatimah\nKeluarga Bapak Drs. Wijaya & Ibu Dra. Siti\nKeluarga Besar Kedua Mempelai"}
                        rows={4}
                      />
                    </>
                  ) : (
                    <LockedNotice availableIn={gates.inviting_families.availableIn} />
                  )}
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
                        if (kids && source === "Ash-Shaffat: 100") {
                          updateField("quote_text", "Ya Tuhanku, anugerahkanlah kepadaku (seorang anak) yang termasuk orang-orang yang saleh.")
                          updateField("quote_source", "QS. Ash-Shaffat: 100")
                        } else if (kids && source === "Custom") {
                          updateField("quote_text", "")
                          updateField("quote_source", "")
                        } else if (source === "Ar-Rum: 21") {
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
                      {kids ? (
                        <>
                          <option value="Ash-Shaffat: 100">Ash-Shaffat: 100</option>
                          <option value="Custom">Custom</option>
                        </>
                      ) : (
                        <>
                          <option value="Ar-Rum: 21">Ar-Rum: 21</option>
                          <option value="Matius 19:6">Matius 19:6</option>
                          <option value="Custom">Custom</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Isi Kutipan</label>
                    <AutoTextarea
                      className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden"
                      value={data.quote_text || ""}
                      onChange={v => updateField("quote_text", v)} minRows={4} />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Sumber / Penulis</label>
                    <AutoTextarea
                      className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden"
                      value={data.quote_source || ""}
                      onChange={v => updateField("quote_source", v)}
                    />
                  </div>
                </div>
              )}
              {!isNoPhoto && gates.cinematic_video.included && renderSection("video", "movie", "VIDEO",
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
                        onChange={e => updateField("video_url", normalizeVideoUrl(e.target.value))}
                        onBlur={e => { const v = normalizeVideoUrl(e.target.value); if (v !== e.target.value) updateField("video_url", v) }}
                        placeholder="https://youtu.be/..."
                      />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Tautan video (mis. "OUR FOOTAGE") yang tampil pada undangan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6"><LockedNotice availableIn={gates.cinematic_video.availableIn} /></div>
                )
              )}
              {contentSpec?.sections?.dresscode && renderSection("dresscode", "checkroom", "DRESS CODE", (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                    <SectionToggle
                      label="Tampilkan Dress Code"
                      checked={data.dresscode_visible !== false}
                      disabled={data.is_published === true}
                      onChange={() => handleToggleVisibility("dresscode_visible", data.dresscode_visible === false)}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant italic">
                    Judul selalu “Dress Code”. Deskripsi otomatis dari nama palet warna.
                  </p>
                  <div className="space-y-2">
                    <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Palet Warna</label>
                    <div className="space-y-2">
                      {(data.dresscode?.colors || []).map((c: { hex?: string; name?: string }, i: number) => (
                        <div key={i} className="flex gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => setColorEdit({ index: i, hex: c.hex || "#CCCCCC" })}
                            className="relative h-9 w-10 shrink-0 rounded border border-outline-variant overflow-hidden"
                            style={{ backgroundColor: c.hex || "#CCCCCC" }}
                            title="Ubah kode warna"
                            aria-label={`Ubah kode warna ${c.name || i + 1}`}
                          />
                          <AutoTextarea className="input-editorial flex-1 font-body-md text-[14px] resize-none overflow-hidden" value={c.name || ""} onChange={v => { const colors = [...(data.dresscode?.colors || [])]; colors[i] = { ...colors[i], name: v }; updateField("dresscode", { ...(data.dresscode || {}), colors }) }} placeholder="Nama warna (mis. Ivory)" />
                          <button onClick={() => { const colors = (data.dresscode?.colors || []).filter((_: unknown, idx: number) => idx !== i); updateField("dresscode", { ...(data.dresscode || {}), colors }) }} className="text-red-500 hover:text-red-700">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => updateField("dresscode", { ...(data.dresscode || {}), colors: [...(data.dresscode?.colors || []), { hex: "#CCCCCC", name: "" }] })} className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-secondary font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container-low transition-colors">
                        + Tambah Warna
                      </button>
                    </div>
                  </div>
                  {colorEdit && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={() => setColorEdit(null)}>
                      <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <p className="font-label-md text-[11px] uppercase tracking-widest text-secondary mb-4">Kode Warna</p>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            className="h-16 w-16 shrink-0 cursor-pointer rounded-lg border border-outline-variant bg-transparent p-1"
                            value={/^#[0-9a-fA-F]{6}$/.test(colorEdit.hex) ? colorEdit.hex : "#CCCCCC"}
                            onChange={e => setColorEdit({ ...colorEdit, hex: e.target.value })}
                            aria-label="Pilih warna"
                          />
                          <input
                            className="input-editorial flex-1 font-body-md text-[15px]"
                            type="text"
                            value={colorEdit.hex}
                            onChange={e => setColorEdit({ ...colorEdit, hex: e.target.value })}
                            onBlur={() => {
                              const raw = colorEdit.hex.trim()
                              const hex = /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw}` : raw
                              if (hex !== colorEdit.hex) setColorEdit({ ...colorEdit, hex })
                            }}
                            placeholder="#CCCCCC"
                            aria-label="Kode warna heksadesimal"
                            autoFocus
                          />
                        </div>
                        <div className="mt-3 h-10 w-full rounded-lg border border-outline-variant" style={{ backgroundColor: colorEdit.hex }} />
                        <div className="mt-5 flex justify-end gap-2">
                          <button type="button" onClick={() => setColorEdit(null)} className="rounded-full border border-outline-variant px-4 py-2 font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Batal</button>
                          <button
                            type="button"
                            onClick={() => {
                              const raw = colorEdit.hex.trim()
                              const hex = /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw}` : raw
                              const colors = [...(data.dresscode?.colors || [])]
                              colors[colorEdit.index] = { ...colors[colorEdit.index], hex }
                              updateField("dresscode", { ...(data.dresscode || {}), colors })
                              setColorEdit(null)
                            }}
                            className="rounded-full bg-[#B34E3F] px-4 py-2 font-label-md text-[10px] uppercase tracking-widest text-white"
                          >Simpan</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {contentSpec?.sections?.livestream && renderSection("livestream", "live_tv", "LIVE STREAMING", (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                    <SectionToggle
                      label="Tampilkan Live Streaming"
                      checked={data.livestream_visible !== false}
                      disabled={data.is_published === true}
                      onChange={() => handleToggleVisibility("livestream_visible", data.livestream_visible === false)}
                    />
                  </div>
                  <div className="space-y-2">
                  <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">URL Live Streaming</label>
                  <input
                    className="input-editorial w-full font-body-md text-[14px]"
                    type="url"
                    value={data.livestream?.url || ""}
                    onChange={e => updateField("livestream", { url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1 italic">
                    Tautan tayangan langsung. Judul, deskripsi, dan tombol mengikuti template.
                  </p>
                  </div>
                </div>
              ))}
              {contentSpec?.sections?.rundown && renderSection("rundown", "schedule", "RUNDOWN ACARA", (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                    <SectionToggle
                      label="Tampilkan Rundown Acara"
                      checked={data.rundown_visible !== false}
                      disabled={data.is_published === true}
                      onChange={() => handleToggleVisibility("rundown_visible", data.rundown_visible === false)}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant italic">
                    Susunan acara yang tampil di undangan. Kosongkan untuk menyembunyikan bagian ini.
                  </p>
                  {rundown.map((item, i) => (
                    <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Rundown {i + 1}</span>
                        <button onClick={() => removeRundown(i)} className="text-red-500 hover:text-red-700 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <input
                        className="input-editorial w-full font-label-md text-[14px]"
                        type="text"
                        value={item.time || ""}
                        onChange={e => updateRundown(i, "time", e.target.value)}
                        placeholder="Contoh: 11.30 pagi"
                      />
                      <AutoTextarea
                        className="input-editorial w-full font-label-md text-[14px] min-h-[60px] resize-none overflow-hidden"
                        value={item.description || ""}
                        onChange={v => updateRundown(i, "description", v)}
                        placeholder="Contoh: Tamu tiba ke venue"
                      />
                    </div>
                  ))}
                  <button onClick={addRundown} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    TAMBAH RUNDOWN
                  </button>
                </div>
              ))}
              {contentSpec?.sections?.contacts && renderSection("contacts", "contact_phone", "HUBUNGI KAMI", (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                    <SectionToggle
                      label="Tampilkan Kontak Keluarga"
                      checked={data.contacts_visible !== false}
                      disabled={data.is_published === true}
                      onChange={() => handleToggleVisibility("contacts_visible", data.contacts_visible === false)}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant italic">
                    Kontak keluarga mempelai. Nomor WhatsApp akan dibuka melalui tautan wa.me.
                  </p>
                  {contacts.map((contact, i) => (
                    <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Kontak {i + 1}</span>
                        <button onClick={() => removeContact(i)} className="text-red-500 hover:text-red-700 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      <AutoTextarea
                        className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden"
                        value={contact.name || ""}
                        onChange={v => updateContact(i, "name", v)}
                        placeholder="Nama kontak"
                      />
                      <AutoTextarea
                        className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden"
                        value={contact.description || ""}
                        onChange={v => updateContact(i, "description", v)}
                        placeholder="Hubungan, mis. Keluarga Mempelai Pria"
                      />
                      <input
                        className="input-editorial w-full font-label-md text-[14px]"
                        type="text"
                        value={contact.whatsapp || ""}
                        onChange={e => updateContact(i, "whatsapp", e.target.value)}
                        placeholder="Nomor WhatsApp, mis. +62 812 3456 7890"
                      />
                    </div>
                  ))}
                  <button onClick={addContact} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    TAMBAH KONTAK
                  </button>
                </div>
              ))}
              {gates.story.included && renderSection("story", "auto_stories", "STORY",
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
                          {/* Text-only story templates hide the milestone photo */}
                          {showStoryPhoto && (
                          <>
                          <div
                            onClick={() => { if (storyUploading !== i) storyFileRefs.current[i]?.click() }}
                            className={`w-20 h-20 bg-surface-dim border border-outline-variant flex items-center justify-center relative overflow-hidden shrink-0 ${storyUploading === i ? "cursor-wait" : "cursor-pointer hover:bg-surface-container-highest"} transition-colors`}
                          >
                            {storyUploading === i ? (
                              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                            ) : story.image_url ? (
                              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${story.image_url})` }} />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
                            )}
                          </div>
                          <input ref={el => { storyFileRefs.current[i] = el }} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleStoryImageUpload(f, i) }} />
                          </>
                          )}
                          <div className="flex-1 space-y-3">
                            <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" placeholder="Judul Cerita" value={story.title} onChange={v => updateStory(i, "title", v)} />
                          </div>
                        </div>
                        <AutoTextarea className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden" placeholder="Ceritakan momen ini..." value={story.description} onChange={v => updateStory(i, "description", v)} minRows={2} />
                      </div>
                    ))}
                    <button onClick={addStory} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      TAMBAH MILESTONE BARU
                    </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6"><LockedNotice availableIn={gates.story.availableIn} /></div>
                )
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
                    className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                      className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                            {(() => {
                              const subtitle = isMine ? "★ Lagu Saya" : (track.artist?.trim() || "")
                              return subtitle ? (
                                <span className="text-[10px] text-on-surface-variant">
                                  {subtitle}
                                </span>
                              ) : null
                            })()}
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
              {contentSpec?.extras && renderSection("extras", "auto_awesome", extrasLabel, (
                <div className="mt-6 space-y-4">
                  <p className="text-[11px] text-on-surface-variant italic">
                    Copy khusus template {template?.name}. Kosongkan untuk memakai teks bawaan.
                  </p>
                  {groupExtraFields(extraFields, data.language === "en" ? "en" : "id").map((group) => {
                    const isOpen = openExtraGroup === group.section
                    return (
                      <div key={group.section} className="border border-outline-variant/40 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenExtraGroup((prev) => (prev === group.section ? null : group.section))}
                          className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container transition-colors"
                        >
                          <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">{group.label}</span>
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{isOpen ? "expand_less" : "expand_more"}</span>
                        </button>
                        {isOpen && (
                          <div className="px-3 py-3 space-y-4 bg-white">
                            {group.fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">{field.label}</label>
                                <AutoTextarea
                                  className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden"
                                  value={data.template_content?.[field.key] || ""}
                                  onChange={(v) => updateTemplateContent(field.key, v)}
                                  placeholder={field.placeholder}
                                  minRows={field.rows ?? 1}
                                  disabled={data.is_published === true}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              {renderSection("feedback", "rate_review", "TAMBAH LAINNYA",
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {feedbackLoading ? "Memuat..." : feedbackSubmissions.length === 0 ? "Belum ada feedback." : (() => {
                          const total = feedbackSubmissions.length
                          const resolved = feedbackSubmissions.filter((s: any) => s.status === "resolved").length
                          const inProgress = feedbackSubmissions.filter((s: any) => s.status === "in_progress").length
                          const pending = feedbackSubmissions.filter((s: any) => s.status === "pending").length
                          const parts = [`${total} Feedback tercatat`]
                          if (resolved > 0) parts.push(`${resolved} Selesai`)
                          if (inProgress > 0) parts.push(`${inProgress} Dalam Proses`)
                          if (pending > 0) parts.push(`${pending} Menunggu`)
                          return parts.join(", ")
                        })()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFeedbackClick}
                    className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest py-3.5 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    Lihat &amp; Tambah Feedback
                  </button>
                </div>
              )}
                </>
              )}
            </div>
            <div className="hidden md:block shrink-0 p-6 pt-3 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6] to-transparent border-t border-outline-variant/50">
              <button
                data-tour="perbarui"
                onClick={handleUpdatePreview}
                disabled={updatingPreview || isPublished || initialLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 font-label-md text-label-md bg-[#B34E3F] text-white rounded-full transition-all active:scale-[0.98] hover:bg-[#9E3B2D] disabled:opacity-50 disabled:hover:bg-[#B34E3F] shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">{updatingPreview ? "hourglass_top" : "refresh"}</span>
                <span>{updatingPreview ? "Memperbarui..." : "Perbarui Undangan"}</span>
              </button>
            </div>
          </aside>

          {/* REVIEW GUIDE — side sheet on desktop, laid out beside the canvas
              (never floating above the invitation) */}
          {reviewMode && (
            <aside className="hidden md:flex w-[360px] shrink-0 bg-white border-r border-outline-variant flex-col h-full z-40">
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[28px] text-secondary shrink-0">visibility</span>
                  <div>
                    <h2 className="font-headline-md text-[18px] text-primary font-medium">Periksa Pratinjau Final</h2>
                    <p className="text-[13px] text-on-surface-variant leading-relaxed mt-1">
                      Ini tampilan undangan Anda dengan data terbaru. Scroll dari sampul hingga akhir dan pastikan nama, foto, jadwal, lokasi, dan galeri sudah benar.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  <p className="text-[12px] text-emerald-800 leading-snug">Pratinjau sudah memakai data terbaru hasil sinkronisasi.</p>
                </div>
                {reviewError && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                    <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
                    <p className="text-[12px] text-red-800 leading-snug">{reviewError}</p>
                  </div>
                )}
                <div className="space-y-3 pt-1">
                  <button
                    onClick={finalizePublish}
                    disabled={publishing || updatingPreview}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 font-label-md text-label-md bg-[#9E3B2D] text-white rounded-full transition-all active:scale-[0.98] hover:bg-[#8d2e20] disabled:opacity-50 shadow-sm"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${publishing ? "animate-spin" : ""}`}>{publishing ? "progress_activity" : "check_circle"}</span>
                    <span>{publishing ? "Mengonfirmasi..." : "Lanjut — Konfirmasi"}</span>
                  </button>
                  <button
                    onClick={exitReview}
                    disabled={publishing}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span>Kembali Edit</span>
                  </button>
                </div>
                <p className="text-[12px] text-secondary font-semibold text-center leading-snug">Setelah dikonfirmasi, konten undangan tidak dapat diubah.</p>
              </div>
            </aside>
          )}

          {/* CANVAS */}
          <section className={`${(showMobilePreview || reviewMode) ? 'flex' : 'hidden'} md:flex flex-1 bg-surface relative overflow-hidden items-center justify-center`}
            style={{ backgroundImage: "linear-gradient(#e5e1d8 1px, transparent 1px), linear-gradient(90deg, #e5e1d8 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          >
            {(initialLoading || updatingPreview || syncStatus === "syncing" || chainSettling || (previewFrame.kind === "iframe" && !iframeReady)) && (
              <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-30 flex items-center justify-center">
                {iframeError ? (
                  <div className="flex flex-col items-center gap-3 px-6 text-center">
                    <span className="material-symbols-outlined text-[32px] text-red-500">error</span>
                    <p className="font-label-md text-label-md text-on-surface-variant">{iframeError}</p>
                    <button
                      onClick={retryPreview}
                      className="px-5 py-2.5 rounded-full bg-secondary text-white font-label-md text-label-md hover:opacity-90 transition-opacity"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-label-md text-label-md text-on-surface-variant animate-pulse">
                      {initialLoading ? "Memuat pratinjau..." : chainSettling ? "Menyinkronkan template..." : updatingPreview || syncStatus === "syncing" ? "Menyinkronkan..." : "Memuat pratinjau..."}
                    </span>
                  </div>
                )}
              </div>
            )}
            {template?.name && (
              <div className="hidden md:inline-flex absolute top-4 left-4 z-20 items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-outline-variant shadow-sm backdrop-blur-sm max-w-[320px]">
                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">palette</span>
                <span className="font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant shrink-0">Tema</span>
                <span className="font-headline-md text-[14px] text-primary truncate">{template.name}</span>
              </div>
            )}
            {!isMobile && previewDevice === "mobile" ? (
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

                <div className="h-full w-full overflow-y-auto custom-scrollbar review-scroll">
                  {renderPreviewBody()}
                </div>
              </div>
            ) : !isMobile ? (
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
                        {coupleUrl(data.slug || "wedding", "")}
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
                  <div className="flex-1 overflow-y-auto custom-scrollbar review-scroll">
                    {renderPreviewBody()}
                  </div>
                </div>
              </div>
            ) : null}

            {isMobile && (showMobilePreview || reviewMode) && (
          <div
            className="md:hidden w-full h-full overflow-y-auto custom-scrollbar review-scroll"
          >
                {renderPreviewBody()}
              </div>
            )}
          </section>
        </main>

        {/* MOBILE BOTTOM BAR — docked while editing */}
        {!showMobilePreview && !reviewMode && (
          <div className="md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-sm z-50 border-t border-outline-variant">
            <div className="flex gap-3">
              <button
                data-tour="konten-mobile"
                onClick={() => setShowMobilePreview(prev => !prev)}
                className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-surface-container-high text-on-surface-variant rounded-full flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                PRATINJAU
              </button>
              {!isPublished && (
              <button
                data-tour="perbarui"
                onClick={handleUpdatePreview}
                disabled={updatingPreview || isPublished}
                className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-brand-gold text-white disabled:opacity-50 rounded-full flex items-center justify-center gap-1.5"
              >
                <span className={`material-symbols-outlined text-[18px] ${updatingPreview ? "animate-spin" : ""}`}>{updatingPreview ? "progress_activity" : "refresh"}</span>
                {updatingPreview ? "MEMPERBARUI..." : "PERBARUI"}
              </button>
              )}
              <button
                data-tour="konfirmasi"
                onClick={openPublishConfirm}
                disabled={isPublished}
                className={`flex-1 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 rounded-full ${
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
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    KONFIRMASI
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MOBILE FLOATING CONTROLS — floating button while previewing
            (any entry point: ?preview=1, PRATINJAU toggle, PERBARUI). Review
            mode uses its own bottom sheet instead. */}
        {showMobilePreview && !reviewMode && (
          <>
            <button
              onClick={() => setShowMobileBar(!showMobileBar)}
              className="md:hidden fixed bottom-4 right-4 z-[60] p-3 bg-brand-gold text-white rounded-full shadow-2xl active:scale-[0.95] transition-transform"
              aria-label={showMobileBar ? "Tutup menu" : "Buka menu"}
            >
              <span className="material-symbols-outlined text-[24px]">
                {showMobileBar ? "close" : "menu"}
              </span>
            </button>

            <div
              className={`md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-surface/90 backdrop-blur-sm z-[60] border-t border-outline-variant transition-all duration-300 ease-out ${
                showMobileBar ? "opacity-100 translate-y-0 max-h-[60vh]" : "opacity-0 translate-y-full max-h-0 pointer-events-none"
              }`}
              style={{ overflow: "hidden" }}
            >
              <div className="flex gap-3">
                <button
                  data-tour="konten-mobile"
                  onClick={() => setShowMobilePreview(prev => !prev)}
                  className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-surface-container-high text-on-surface-variant rounded-full flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  {isPublished ? "KONTEN" : "EDIT"}
                </button>
                {!isPublished && (
                <button
                  data-tour="perbarui"
                  onClick={handleUpdatePreview}
                  disabled={updatingPreview || isPublished}
                  className="flex-1 py-4 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform bg-brand-gold text-white disabled:opacity-50 rounded-full flex items-center justify-center gap-1.5"
                >
                  <span className={`material-symbols-outlined text-[18px] ${updatingPreview ? "animate-spin" : ""}`}>{updatingPreview ? "progress_activity" : "refresh"}</span>
                  {updatingPreview ? "MEMPERBARUI..." : "PERBARUI"}
                </button>
                )}
                <button
                  data-tour="konfirmasi"
                  onClick={openPublishConfirm}
                  disabled={isPublished}
                  className={`flex-1 font-label-md text-label-md tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 rounded-full ${
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
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      KONFIRMASI
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* PREPARING REVIEW — dedicated fullscreen loading while patching, so it
            never blends into the invitation preview */}
        {preparingReview && !reviewMode && (
          <div className="fixed inset-0 z-[80] bg-[#2C2A29]/70 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center">
              <span className="w-12 h-12 rounded-full border-[3px] border-secondary border-t-transparent animate-spin block mx-auto" />
              <h3 className="font-headline-md text-xl font-medium text-primary mt-5">Menyiapkan Pratinjau Final…</h3>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">Menyimpan perubahan dan menyinkronkan data terbaru Anda. Mohon tunggu sebentar.</p>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .custom-scrollbar { scrollbar-width: auto; scrollbar-color: #CFC6B8 transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CFC6B8; border-radius: 8px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B34E3F; background-clip: content-box; }
        .iphone-frame { box-shadow: 0 0 0 12px #1a1a1a, 0 0 0 13px #333; border-radius: 44px; }
        .input-editorial { border: none; border-bottom: 1px solid #1A1A1A; background: transparent; padding: 8px 0; border-radius: 0; outline: none; transition: border-width 0.1s ease; width: 100%; font-family: 'Playfair Display', serif; font-size: 18px; }
        .input-editorial:focus { border-bottom-width: 2px; box-shadow: none; outline: none; }
        .input-editorial::placeholder { color: rgba(26,26,26,.34); font-size: .8em; font-style: italic; font-family: 'Inter', sans-serif; font-weight: 400; }
        .input-editorial::-webkit-input-placeholder { color: rgba(26,26,26,.34); font-size: .8em; font-style: italic; font-family: 'Inter', sans-serif; font-weight: 400; }
      `}</style>

      {showFeedbackGate && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowFeedbackGate(false)}
        >
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">rate_review</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Konfirmasi Undangan Dulu</h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Fitur Tambah Lainnya &amp; feedback tersedia setelah undangan dikonfirmasi. Konfirmasi undangan Anda terlebih dahulu untuk melihat dan menambah feedback.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowFeedbackGate(false); openPublishConfirm() }}
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                Konfirmasi Undangan
              </button>
              <button
                onClick={() => setShowFeedbackGate(false)}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishConfirm && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => { if (pubState === "ask" || pubState === "error" || pubState === "choose") setShowPublishConfirm(false) }}
        >
          <div className="relative bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            {pubState === "ask" && (() => {
              const incomplete = getIncompleteSections()
              const goToSection = (key: string) => {
                setShowPublishConfirm(false)
                setShowMobilePreview(false)
                setActiveSection(key)
                scrollSectionIntoView(key)
              }
              const goToTemplates = () => {
                setShowPublishConfirm(false)
                try { sessionStorage.setItem('from_templates_' + id, '1') } catch {}
                router.push(`/dashboard/${id}/web-invitation/templates`)
              }
              return (
                <>
                  <button
                    onClick={() => setShowPublishConfirm(false)}
                    aria-label="Tutup"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">assignment_late</span>
                  <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Konten Belum Lengkap</h3>
                  <div className="mb-2 text-left">
                    <p className="text-sm text-on-surface-variant mb-2">Bagian berikut masih kosong atau belum diisi. Undangan tidak dapat dikonfirmasi sebelum semuanya lengkap:</p>
                    <ul className="mb-3 space-y-2">
                      {incomplete.map((s) => (
                        <li key={s.key} className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                          <span className="text-sm text-red-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">error</span> {s.label}
                          </span>
                          {s.action === "templates" ? (
                            <button
                              onClick={goToTemplates}
                              className="shrink-0 px-3 py-1.5 rounded-full bg-secondary text-white text-[11px] font-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
                            >
                              Pilih Tema
                            </button>
                          ) : (
                            <button
                              onClick={() => goToSection(s.key)}
                              className="shrink-0 px-3 py-1.5 rounded-full bg-secondary text-white text-[11px] font-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
                            >
                              Lengkapi
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-secondary font-semibold mt-3">Setelah dikonfirmasi, konten undangan tidak dapat diubah.</p>
                  </div>
                </>
              )
            })()}

            {pubState === "choose" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <span className="material-symbols-outlined text-4xl text-emerald-500 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <h3 className="font-headline-md text-xl font-medium text-primary">Undangan Terkonfirmasi</h3>
                <p className="text-sm text-on-surface-variant text-center">Ingin menambah masukan lainnya untuk undangan Anda?</p>
                <div className="flex flex-col gap-3 w-full mt-2">
                  <button
                    onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback/new?return_section=feedback`)}
                    className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
                  >
                    Tambah Masukan Lainnya
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/${id}/qr-guestbook`)}
                    className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                  >
                    Sudah Ok, Lanjut
                  </button>
                </div>
              </div>
            )}

            {pubState === "error" && (
              <div className="flex flex-col items-center gap-4 py-2">
                <span className="material-symbols-outlined text-5xl text-red-500 block">error</span>
                <h3 className="font-headline-md text-xl font-medium text-primary">Konfirmasi Gagal</h3>
                <p className="text-sm text-on-surface-variant text-left">{pubError || "Terjadi kesalahan. Silakan coba lagi."}</p>
                <div className="flex flex-col gap-3 w-full mt-2">
                  <button
                    onClick={() => { setPubError(""); setPubState("ask") }}
                    className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={() => setShowPublishConfirm(false)}
                    className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}
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
                onClick={() => { setShowH3Reminder(false); openPublishConfirm() }}
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
                href={waLink("Halo Aksaraa, saya ingin menyelesaikan pembayaran untuk membuka fitur Feedback")}
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
      {uploadError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] max-w-[92vw] sm:max-w-md">
          <div className="flex items-start gap-3 bg-[#2C2A29] text-white rounded-lg shadow-2xl px-4 py-3 border border-white/10">
            <span className="material-symbols-outlined text-[20px] text-red-400 shrink-0">error</span>
            <p className="font-body-md text-[13px] leading-snug flex-1">{uploadError}</p>
            <button onClick={() => setUploadError("")} className="text-white/60 hover:text-white shrink-0" aria-label="Tutup">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
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