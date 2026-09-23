"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"
import { renderReminderMessage, getCoupleDisplayName } from "@/lib/reminderTemplates"
import { MSG_TEMPLATES, cleanMessageForCell, isValidMsgCategory, renderMessage } from "@/lib/messageTemplates"
import {
  PACKAGE_LABELS,
  FEATURE_LABELS,
  WA_BLAST_LABELS,
  CARD_PRIORITY,
  formatCurrency,
  formatDate,
  formatDateTime,
  getWeddingDate,
  photoList,
  coverPhotos,
  getPackageCategory,
} from "@/lib/opsConstants"
import { PACKAGE_FEATURES } from "@/lib/packages"
import {
  OPS_COLUMNS,
  OPS_STATUS_LABELS,
  allowedNextStatuses,
  resolveDerivedStatus,
} from "@/lib/opsStatus"
import { canChangeStatus, unauthorizedStatusMessage } from "@/lib/opsRoles"
import { compressImage } from "@/lib/imageCompress"

type QueueItem = {
  id: string
  status: string
  sla_started_at: string
  assigned_to: string | null
  assigned_name: string | null
  created_at: string
  wedding_profile: {
    id: string
    bride_name: string
    groom_name: string
    display_name?: string | null
    slug: string
    whatsapp_number: string
    estimated_wedding_date: string
    sessions: any
    estimated_guest_count: number
    package_type: string
    total_project_cost: number
    payment_status: string
    express_service?: boolean | null
    message_category?: string | null
  }
}

type FeatureAction = {
  id: string
  ops_queue_id: string
  wedding_profile_id: string
  feature_key: string
  status: string
  client_note: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

type Employee = {
  id: string
  name: string
}

type FeedbackSubmission = {
  id: string
  template_name: string
  area: string | null
  description: string
  image_url: string | null
  round_number: number
  status: string
  created_at: string
}

type StatusLogEntry = {
  id: string
  kind: "status" | "package" | "invitation"
  previous_status: string | null
  new_status: string | null
  previous_package: string | null
  new_package: string | null
  details: string | null
  changed_by_employee_id: string | null
  changed_by_name: string | null
  created_at: string
}

type QueueDetail = {
  queue: QueueItem
  wedding_profile: QueueItem["wedding_profile"]
  feature_actions: FeatureAction[]
  employees: Employee[]
  guest_stats: { total: number; with_token: number }
  feature_stats: {
    wish_count: number
    photo_count: number
    account_count: number
    address_count: number
    checked_in_count: number
    template_name: string | null
    track_name: string | null
    web_published?: boolean
  }
  wa_blast_schedule: {
    id: string
    template_type: string
    message_text: string
    scheduled_date: string
    scheduled_time: string
    status: string
    total_guests: number
    created_at: string
  } | null
  wa_blast_quota?: number
  reservation_stats?: {
    total: number
    hadir: number
    belum_respon: number
    belum_dibuka: number
  }
  vip_guests?: { id: string; name: string; phone_number: string; table_number: string; category?: string; created_at: string; added_manually?: boolean; slug?: string | null; qr_token?: string | null }[]
  derived_status: string
  status_log: StatusLogEntry[]
}

type OpsEmployee = { id: string; name: string; role: string; phone_number?: string }

const POLL_MS = 20000

function SlaTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - new Date(startedAt).getTime()
      if (diff < 0) { setElapsed("00:00:00"); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt])
  return <span>{elapsed}</span>
}

// ---------- Detail Undangan Digital: editor-mirroring section helpers ----------
// Labels, lock tooltips, and completeness rules mirror the couple editor
// (dashboard/[id]/web-invitation/editor/page.tsx) so ops sees the same
// structure: locked by package / hidden by couple / filled / still empty.

const INV_PACKAGE_NAMES: Record<string, string> = {
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

function invUpgradeMessage(availableIn: string[] | undefined): string {
  const list = (availableIn || []).filter(Boolean)
  const names = list.length > 0 ? list.map((c) => INV_PACKAGE_NAMES[c] || c).join(" & ") : "paket yang mendukung"
  return `Fitur ini tersedia untuk paket ${names}. Silakan upgrade paket untuk mengakses fitur ini.`
}

type InvSectionState = "ok" | "locked" | "hidden" | "empty"

const invHasArr = (v: any) => Array.isArray(v) && v.filter(Boolean).length > 0
const invHasStr = (v: any) => typeof v === "string" && v.trim() !== ""

function invSectionState(p: any, key: string, gift?: { accounts: any[]; address: string }): InvSectionState {
  const gates = p?.package_gates || {}
  switch (key) {
    case "sampul":
      return !invHasArr(p?.cover_photos) && !invHasStr(p?.couple_illustration_url) ? "empty" : "ok"
    case "pembuka":
      return !invHasStr(p?.opening_title) && !invHasStr(p?.opening_description) ? "empty" : "ok"
    case "profil":
      return !invHasStr(p?.display_name) || !invHasStr(p?.groom_full_name) || !invHasStr(p?.bride_full_name) ? "empty" : "ok"
    case "acara": {
      const ss = Array.isArray(p?.sessions) ? p.sessions : []
      if (ss.length === 0) return "empty"
      const bad = ss.some((s: any) => !invHasStr(s?.name) || !invHasStr(s?.date) || !invHasStr(s?.venue) || !invHasStr(s?.address) || !invHasStr(s?.maps_url))
      return bad ? "empty" : "ok"
    }
    case "galeri":
      return !invHasArr(p?.gallery_photos) ? "empty" : "ok"
    case "inviting":
      if (gates.inviting_families?.included === false) return "locked"
      if (p?.inviting_families_visible === false) return "hidden"
      return !invHasArr(p?.inviting_families) ? "empty" : "ok"
    case "kutipan":
      return !invHasStr(p?.quote_text) ? "empty" : "ok"
    case "video":
      if (gates.cinematic_video?.included === false) return "locked"
      if (p?.video_section_visible === false) return "hidden"
      return !invHasStr(p?.video_url) ? "empty" : "ok"
    case "story":
      if (gates.story?.included === false) return "locked"
      if (p?.story_visible === false) return "hidden"
      return !invHasArr(p?.stories) ? "empty" : "ok"
    case "gift":
      if (p?.gift_section_visible === false) return "hidden"
      return (gift && (invHasArr(gift.accounts) || invHasStr(gift.address))) ? "ok" : "empty"
    case "musik":
      return p?.selected_track_id ? "ok" : "empty"
    default:
      return "ok"
  }
}

function invAvailableIn(p: any, gateKey: string): string[] {
  return p?.package_gates?.[gateKey]?.availableIn || []
}

function InvBadge({ state, label, tip }: { state: InvSectionState; label: string; tip?: string }) {
  if (state === "locked") {
    return (
      <span className="group relative inline-flex">
        <span className="material-symbols-outlined text-[16px] text-[#6B7280]">lock</span>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">{tip}</span>
      </span>
    )
  }
  if (state === "hidden") {
    return (
      <span className="group relative inline-flex">
        <span className="material-symbols-outlined text-[16px] text-[#6B7280]">visibility_off</span>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">Konten disembunyikan - tidak tampil di undangan</span>
      </span>
    )
  }
  if (state === "empty") {
    return (
      <span className="group relative inline-flex">
        <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-[12px] font-bold flex items-center justify-center">!</span>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">Konten belum lengkap — silakan lengkapi bagian {label}</span>
      </span>
    )
  }
  return null
}

function InvField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const invInputCls = "w-full bg-white border border-outline-variant rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-secondary"

function InvText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={invInputCls} />
}

function InvArea({ value, onChange, rows, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows || 3} placeholder={placeholder} className={`${invInputCls} resize-y`} />
}

function InvCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 py-1">
      <span className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-secondary" : "bg-outline-variant"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "right-0.5" : "left-0.5"}`} />
      </span>
      <span className="font-label-md text-[11px] text-on-surface text-left">{label}</span>
    </button>
  )
}

function InvStringList({ items, onChange, placeholder, addLabel }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  const [draft, setDraft] = useState("")
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
            className={`${invInputCls} flex-1`}
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Hapus" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:text-red-600 hover:border-red-300 transition-colors">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (draft.trim()) { onChange([...items, draft.trim()]); setDraft("") } } }}
          placeholder={placeholder}
          className={`${invInputCls} flex-1`}
        />
        <button
          type="button"
          onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft("") } }}
          className="h-9 px-3 shrink-0 rounded-lg bg-secondary text-white font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {addLabel || "Tambah"}
        </button>
      </div>
    </div>
  )
}

function InvPhotoList({ urls, onChange, onUpload, uploading, uploadKey }: {
  urls: string[]
  onChange: (v: string[]) => void
  onUpload: (key: string, file: File) => Promise<string | null>
  uploading: string | null
  uploadKey: string
}) {
  const busy = uploading === uploadKey
  return (
    <div className="space-y-2">
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group w-16 h-16 bg-surface-dim border border-outline-variant overflow-hidden rounded-lg">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                aria-label="Hapus foto"
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/90 border border-outline-variant flex items-center justify-center text-red-600"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant font-label-md text-[11px] uppercase tracking-widest cursor-pointer transition-colors ${busy ? "opacity-50 pointer-events-none" : "hover:border-secondary hover:text-secondary"}`}>
        <span className={`material-symbols-outlined text-[16px] ${busy ? "animate-spin" : ""}`}>{busy ? "progress_activity" : "upload"}</span>
        {busy ? "Mengunggah..." : "Unggah Foto"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            const url = await onUpload(uploadKey, f)
            if (url) onChange([...urls, url])
          }}
        />
      </label>
    </div>
  )
}

const INV_EMPTY_SESSION = { name: "", date: "", time: "", timezone: "WIB", venue: "", address: "", maps_url: "" }

function InvSessionList({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, patch: any) => onChange(items.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="space-y-3">
      {items.map((s, i) => (
        <div key={i} className="border border-outline-variant rounded-xl p-3 space-y-2 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Sesi {i + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[11px] font-label-md uppercase tracking-widest text-red-600 hover:underline">Hapus</button>
          </div>
          <InvField label="Nama Sesi"><InvText value={s.name || ""} onChange={(v) => set(i, { name: v })} placeholder="Akad Nikah" /></InvField>
          <div className="grid grid-cols-2 gap-2">
            <InvField label="Tanggal"><InvText value={s.date || ""} onChange={(v) => set(i, { date: v })} placeholder="2026-10-10" /></InvField>
            <InvField label="Waktu"><InvText value={s.time || ""} onChange={(v) => set(i, { time: v })} placeholder="08:00" /></InvField>
          </div>
          <InvField label="Tempat"><InvText value={s.venue || ""} onChange={(v) => set(i, { venue: v })} placeholder="Gedung ..." /></InvField>
          <InvField label="Alamat"><InvArea value={s.address || ""} onChange={(v) => set(i, { address: v })} rows={2} /></InvField>
          <InvField label="Link Maps"><InvText value={s.maps_url || ""} onChange={(v) => set(i, { maps_url: v })} placeholder="https://maps..." /></InvField>
        </div>
      ))}
      {items.length < 5 && (
        <button type="button" onClick={() => onChange([...items, { ...INV_EMPTY_SESSION }])} className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">
          + Tambah Sesi
        </button>
      )}
    </div>
  )
}

function InvStoryList({ items, onChange, onUpload, uploading }: {
  items: any[]
  onChange: (v: any[]) => void
  onUpload: (key: string, file: File) => Promise<string | null>
  uploading: string | null
}) {
  const set = (i: number, patch: any) => onChange(items.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  return (
    <div className="space-y-3">
      {items.map((s, i) => (
        <div key={i} className="border border-outline-variant rounded-xl p-3 space-y-2 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Kisah {i + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[11px] font-label-md uppercase tracking-widest text-red-600 hover:underline">Hapus</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InvField label="Tahun"><InvText value={s.year || ""} onChange={(v) => set(i, { year: v })} placeholder="2020" /></InvField>
            <InvField label="Judul"><InvText value={s.title || ""} onChange={(v) => set(i, { title: v })} placeholder="Awal bertemu" /></InvField>
          </div>
          <InvField label="Cerita"><InvArea value={s.description || ""} onChange={(v) => set(i, { description: v })} rows={3} /></InvField>
          <InvField label="Foto">
            <InvPhotoList urls={s.image_url ? [s.image_url] : []} onChange={(v) => set(i, { image_url: v[0] || "" })} onUpload={onUpload} uploading={uploading} uploadKey={`story-${i}`} />
          </InvField>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { year: "", title: "", description: "", image_url: "" }])} className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">
        + Tambah Kisah
      </button>
    </div>
  )
}

function InvGiftAccounts({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, patch: any) => onChange(items.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <div key={a.id || `new-${i}`} className="border border-outline-variant rounded-xl p-3 space-y-2 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Rekening {i + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[11px] font-label-md uppercase tracking-widest text-red-600 hover:underline">Hapus</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InvField label="Bank / E-Wallet"><InvText value={a.provider_name || ""} onChange={(v) => set(i, { provider_name: v })} placeholder="BCA" /></InvField>
            <label className="block">
              <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Jenis</span>
              <select value={a.type || "bank"} onChange={(e) => set(i, { type: e.target.value })} className={`${invInputCls} mt-1`}>
                <option value="bank">Bank</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </label>
          </div>
          <InvField label="Nomor Rekening"><InvText value={a.account_number || ""} onChange={(v) => set(i, { account_number: v })} placeholder="1234567890" /></InvField>
          <InvField label="Atas Nama"><InvText value={a.account_name || ""} onChange={(v) => set(i, { account_name: v })} placeholder="Nama pemilik" /></InvField>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { provider_name: "", account_number: "", account_name: "", type: "bank" }])} className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">
        + Tambah Rekening
      </button>
    </div>
  )
}

function InvSection({ title, state, lockTip, first, noEmptyBadge, emptyText, editing, children }: {
  title: string
  state: InvSectionState
  lockTip?: string
  first?: boolean
  noEmptyBadge?: boolean
  emptyText?: string
  editing?: boolean
  children: ReactNode
}) {
  const badgeState = state === "empty" && noEmptyBadge ? "ok" : state
  const showEmptyPlaceholder = state === "empty" && !editing
  return (
    <>
      {!first && <div className="border-t border-outline-variant/40" />}
      <div className={state === "hidden" || state === "locked" ? "opacity-80" : ""}>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary">{title}</h4>
          <InvBadge state={badgeState} label={title} tip={lockTip} />
        </div>
        {showEmptyPlaceholder ? (
          <p className="font-body-md text-xs italic text-on-surface-variant/70">{emptyText || "Belum diisi."}</p>
        ) : (
          children
        )}
      </div>
    </>
  )
}

export default function AntrianDetail({ id }: { id: string }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [detail, setDetail] = useState<QueueDetail | null>(null)
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [waBlastSchedule, setWaBlastSchedule] = useState<any>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState("")
  const [showRoleGate, setShowRoleGate] = useState(false)
  const [roleGateMessage, setRoleGateMessage] = useState("")
  const [showInvCard, setShowInvCard] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [invEditing, setInvEditing] = useState(false)
  const [invForm, setInvForm] = useState<any>(null)
  const [invSaving, setInvSaving] = useState(false)
  const [invSaveError, setInvSaveError] = useState("")
  const [invTrackOptions, setInvTrackOptions] = useState<any[]>([])
  const [invUploading, setInvUploading] = useState<string | null>(null)
  const [invGiftAddrId, setInvGiftAddrId] = useState<string | null>(null)
  const [invLoading, setInvLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [showVipModal, setShowVipModal] = useState(false)
  const [vipSearch, setVipSearch] = useState("")
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrSearch, setQrSearch] = useState("")
  const [qrGuests, setQrGuests] = useState<any[]>([])
  const [qrLoading, setQrLoading] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    setEmployee(JSON.parse(raw))
  }, [router])

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/ops/queue/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setDetail(data)
      setWaBlastSchedule(data.wa_blast_schedule || null)
      const wpId = data.wedding_profile?.id
      if (wpId) {
        const fbRes = await fetch(`/api/feedback-submissions?wedding_profile_id=${wpId}`)
        if (fbRes.ok) {
          const fbData = await fbRes.json()
          setFeedbackSubmissions(fbData.submissions || [])
        }
      }
    } catch (e) {
      console.error("Failed to fetch detail", e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Live polling + refetch when the tab regains focus.
  useEffect(() => {
    const interval = setInterval(() => fetchAll(), POLL_MS)
    const onFocus = () => fetchAll()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [fetchAll])

  const currentWp = detail?.wedding_profile

  // QR Guest Book (Buku Tamu Digital) module: only active on DGB tiers.
  const qrActive = currentWp?.package_type
    ? (PACKAGE_FEATURES[currentWp.package_type]?.includes("qr_code_book") ?? false)
    : true

  const derived = detail && currentWp
    ? resolveDerivedStatus({
        storedStatus: detail.queue.status,
        paymentStatus: currentWp.payment_status,
        latestFeedbackStatus: feedbackSubmissions[0]?.status || null,
      })
    : null
  const allowed = derived ? allowedNextStatuses(derived) : []
  const roleCanChange = derived && employee ? canChangeStatus(employee.role, derived) : true

  const changeStatus = async (target: string) => {
    if (!employee) return
    if (derived && !canChangeStatus(employee.role, derived)) {
      setRoleGateMessage(unauthorizedStatusMessage(employee.role, derived))
      setShowRoleGate(true)
      return
    }
    setStatusSaving(true)
    setStatusError("")
    try {
      const res = await fetch(`/api/ops/queue/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee.phone_number || "",
          "x-ops-role": employee.role || "",
        },
        body: JSON.stringify({ status: target }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusError(data.error || "Gagal mengubah status")
        return
      }
      await fetchAll()
    } catch (e) {
      setStatusError("Gagal mengubah status")
    } finally {
      setStatusSaving(false)
    }
  }

  const assignConsultant = async (employeeId: string) => {
    if (employee?.role === "creative") {
      setRoleGateMessage("Perubahan petugas hanya dapat dilakukan oleh Admin atau Sales. Peran Anda saat ini: Creative.")
      setShowRoleGate(true)
      return
    }
    await fetch(`/api/ops/queue/${id}/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ops-phone": employee?.phone_number || "",
        "x-ops-role": employee?.role || "",
      },
      body: JSON.stringify({ employee_id: employeeId || null }),
    })
    fetchAll()
  }

  const updatePackage = async (packageType: string) => {
    if (employee?.role === "creative") {
      setRoleGateMessage("Perubahan paket hanya dapat dilakukan oleh Admin atau Sales. Peran Anda saat ini: Creative.")
      setShowRoleGate(true)
      return
    }
    const res = await fetch(`/api/ops/queue/${id}/package`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ops-phone": employee?.phone_number || "",
        "x-ops-role": employee?.role || "",
      },
      body: JSON.stringify({ package_type: packageType }),
    })
    const data = await res.json()
    if (data.success) {
      fetchAll()
    } else {
      alert(data.error || "Gagal mengubah paket")
    }
  }

  const fetchInvitationData = async (wpId: string) => {
    setInvLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${wpId}/web-invitation`)
      if (!res.ok) return
      const data = await res.json()
      setInvitationData(data)
      setShowInvCard(true)
      setInvEditing(false)
      setInvForm(null)
    } catch (e) {
      console.error("Failed to fetch invitation", e)
    } finally {
      setInvLoading(false)
    }
  }

  const photoStrArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.filter(Boolean)
    if (typeof v === "string" && v) {
      try {
        const parsed = JSON.parse(v)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [v]
      } catch {
        return [v]
      }
    }
    return []
  }

  const startInvEdit = async () => {
    const p = invitationData?.profile
    if (!p) return
    setInvSaveError("")
    setInvForm({
      display_name: p.display_name || "",
      couple_initials: p.couple_initials || "",
      opening_title: p.opening_title || "",
      opening_description: p.opening_description || "",
      groom_name: p.groom_name || "",
      groom_full_name: p.groom_full_name || "",
      groom_parents: p.groom_parents || "",
      groom_instagram: p.groom_instagram || "",
      bride_name: p.bride_name || "",
      bride_full_name: p.bride_full_name || "",
      bride_parents: p.bride_parents || "",
      bride_instagram: p.bride_instagram || "",
      couple_illustration_url: p.couple_illustration_url || "",
      cover_photos: photoStrArr(p.cover_photos),
      groom_photo_url: photoList(p.groom_photo_url),
      bride_photo_url: photoList(p.bride_photo_url),
      gallery_photos: photoStrArr(p.gallery_photos),
      inviting_families: Array.isArray(p.inviting_families) ? [...p.inviting_families] : [],
      sessions: (Array.isArray(p.sessions) ? p.sessions : []).map((s: any) => ({
        name: s?.name || "", date: s?.date || "", time: s?.time || "", timezone: s?.timezone || "WIB",
        venue: s?.venue || "", address: s?.address || "", maps_url: s?.maps_url || "",
      })),
      stories: (Array.isArray(p.stories) ? p.stories : []).map((s: any) => ({
        year: s?.year || "", title: s?.title || "", description: s?.description || "", image_url: s?.image_url || "",
      })),
      quote_text: p.quote_text || "",
      quote_source: p.quote_source || "",
      video_url: p.video_url || "",
      rsvp_max_pax: p.rsvp_max_pax ?? 2,
      estimated_wedding_date: p.estimated_wedding_date || "",
      grayscale: p.grayscale === true,
      video_section_visible: p.video_section_visible !== false,
      story_visible: p.story_visible !== false,
      gift_section_visible: p.gift_section_visible !== false,
      inviting_families_visible: p.inviting_families_visible !== false,
      selected_track_id: p.selected_track_id || "",
      giftAccounts: (invitationData.gift_accounts || []).map((a: any) => ({
        id: a.id,
        provider_name: a.provider_name || "",
        account_number: a.account_number || "",
        account_name: a.account_name || "",
        type: a.type === "ewallet" ? "ewallet" : "bank",
      })),
      giftAddress: {
        recipient_name: invitationData.gift_address_name || "",
        full_address: invitationData.gift_address || "",
      },
    })
    setInvEditing(true)
    fetch(`/api/gift-addresses?wedding_profile_id=${p.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInvGiftAddrId(d?.addresses?.[0]?.id || null))
      .catch(() => {})
    fetch(`/api/tracks?wedding_profile_id=${p.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInvTrackOptions(d?.tracks || []))
      .catch(() => {})
  }

  const invUploadPhoto = async (key: string, file: File): Promise<string | null> => {
    setInvUploading(key)
    try {
      const compressed = file.type.startsWith("image/") ? await compressImage(file) : file
      const fd = new FormData()
      fd.append("file", compressed)
      const res = await fetch("/api/template-media/upload", { method: "POST", body: fd })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.url) throw new Error(payload.error || "Gagal mengunggah gambar")
      return payload.url as string
    } catch (err: any) {
      setInvSaveError(err?.message || "Gagal mengunggah gambar.")
      return null
    } finally {
      setInvUploading(null)
    }
  }

  const saveInvEdit = async () => {
    if (!invForm || !invitationData?.profile?.id) return
    setInvSaving(true)
    setInvSaveError("")
    try {
      const wpId = invitationData.profile.id
      const f = invForm
      const orig = invitationData.profile

      // Diff for the audit timeline: what did this ops save actually change?
      const changed: string[] = []
      const sameStr = (a: any, b: any) => (a ?? "") === (b ?? "")
      const strField = (label: string, nv: any, ov: any) => { if (!sameStr(nv, ov)) changed.push(label) }
      strField("Nama Tampilan", f.display_name, orig.display_name)
      strField("Inisial", f.couple_initials, orig.couple_initials)
      strField("Judul Pembuka", f.opening_title, orig.opening_title)
      strField("Deskripsi Pembuka", f.opening_description, orig.opening_description)
      strField("Panggilan (1)", f.groom_name, orig.groom_name)
      strField("Nama Lengkap (1)", f.groom_full_name, orig.groom_full_name)
      strField("Orang Tua (1)", f.groom_parents, orig.groom_parents)
      strField("Instagram (1)", f.groom_instagram, orig.groom_instagram)
      strField("Panggilan (2)", f.bride_name, orig.bride_name)
      strField("Nama Lengkap (2)", f.bride_full_name, orig.bride_full_name)
      strField("Orang Tua (2)", f.bride_parents, orig.bride_parents)
      strField("Instagram (2)", f.bride_instagram, orig.bride_instagram)
      strField("Foto Sampul Utama", f.couple_illustration_url, orig.couple_illustration_url)
      strField("Kutipan", f.quote_text, orig.quote_text)
      strField("Sumber Kutipan", f.quote_source, orig.quote_source)
      strField("Video", f.video_url, orig.video_url)
      strField("Tanggal Acara", f.estimated_wedding_date, orig.estimated_wedding_date)
      if (Number(f.rsvp_max_pax) !== Number(orig.rsvp_max_pax)) changed.push("Maks Pax")
      if (!!f.grayscale !== (orig.grayscale === true)) changed.push("Grayscale")
      const arrField = (label: string, nv: any[], ov: any[]) => {
        if (JSON.stringify(nv || []) !== JSON.stringify(ov || [])) changed.push(`${label} (${(ov || []).length}→${(nv || []).length})`)
      }
      arrField("Foto Sampul", f.cover_photos, photoStrArr(orig.cover_photos))
      arrField("Foto Mempelai 1", f.groom_photo_url, photoList(orig.groom_photo_url))
      arrField("Foto Mempelai 2", f.bride_photo_url, photoList(orig.bride_photo_url))
      arrField("Galeri", f.gallery_photos, photoStrArr(orig.gallery_photos))
      arrField("Turut Mengundang", f.inviting_families, orig.inviting_families)
      arrField("Sesi Acara", f.sessions, orig.sessions)
      arrField("Kisah", f.stories, orig.stories)
      const visField = (label: string, nv: boolean, ov: boolean) => { if (!!nv !== !!ov) changed.push(label) }
      visField("Tampil Video", f.video_section_visible, orig.video_section_visible !== false)
      visField("Tampil Kisah", f.story_visible, orig.story_visible !== false)
      visField("Tampil Hadiah", f.gift_section_visible, orig.gift_section_visible !== false)
      visField("Tampil Turut Mengundang", f.inviting_families_visible, orig.inviting_families_visible !== false)
      if ((f.selected_track_id || "") !== (orig.selected_track_id || "")) {
        const t = invTrackOptions.find((x: any) => x.id === f.selected_track_id)
        changed.push(`Lagu (${t?.title || invitationData.track?.title || "diubah"})`)
      }
      const normAccts = (list: any[]) => (list || []).map((a: any) => [a.provider_name || "", a.account_number || "", a.account_name || "", a.type || ""].join("|")).sort()
      if (JSON.stringify(normAccts(f.giftAccounts)) !== JSON.stringify(normAccts(invitationData.gift_accounts || []))) {
        changed.push(`Rekening (${(invitationData.gift_accounts || []).length}→${f.giftAccounts.length})`)
      }
      if (!sameStr(f.giftAddress.recipient_name, invitationData.gift_address_name) || !sameStr(f.giftAddress.full_address, invitationData.gift_address)) {
        changed.push("Alamat Kado")
      }
      const res = await fetch(`/api/dashboard/${wpId}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: f.display_name,
          couple_initials: f.couple_initials,
          opening_title: f.opening_title,
          opening_description: f.opening_description,
          groom_name: f.groom_name,
          groom_full_name: f.groom_full_name,
          groom_parents: f.groom_parents || null,
          groom_instagram: f.groom_instagram || null,
          bride_name: f.bride_name,
          bride_full_name: f.bride_full_name,
          bride_parents: f.bride_parents || null,
          bride_instagram: f.bride_instagram || null,
          couple_illustration_url: f.couple_illustration_url || null,
          cover_photos: f.cover_photos,
          gallery_photos: f.gallery_photos,
          groom_photo_url: f.groom_photo_url,
          bride_photo_url: f.bride_photo_url,
          sessions: f.sessions,
          stories: f.stories,
          inviting_families: (f.inviting_families || []).filter(Boolean),
          quote_text: f.quote_text || null,
          quote_source: f.quote_source || null,
          video_url: f.video_url || null,
          rsvp_max_pax: Number(f.rsvp_max_pax) || 2,
          estimated_wedding_date: f.estimated_wedding_date || null,
          grayscale: !!f.grayscale,
          video_section_visible: !!f.video_section_visible,
          story_visible: !!f.story_visible,
          gift_section_visible: !!f.gift_section_visible,
          inviting_families_visible: !!f.inviting_families_visible,
          selected_track_id: f.selected_track_id || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan undangan")

      const formIds = new Set(f.giftAccounts.filter((a: any) => a.id).map((a: any) => a.id))
      for (const a of invitationData.gift_accounts || []) {
        if (!formIds.has(a.id)) {
          await fetch(`/api/gift-accounts/${a.id}`, { method: "DELETE" })
        }
      }
      for (const a of f.giftAccounts) {
        if (!a.account_number) continue
        const body = {
          provider_name: a.provider_name,
          account_number: a.account_number,
          account_name: a.account_name,
          type: a.type,
        }
        if (a.id) {
          await fetch(`/api/gift-accounts/${a.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        } else {
          await fetch(`/api/gift-accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wedding_profile_id: wpId, ...body }),
          })
        }
      }

      const addrName = (f.giftAddress.recipient_name || "").trim()
      const addrFull = (f.giftAddress.full_address || "").trim()
      if (invGiftAddrId) {
        if (addrName && addrFull) {
          await fetch(`/api/gift-addresses/${invGiftAddrId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient_name: addrName, full_address: addrFull }),
          })
        } else {
          await fetch(`/api/gift-addresses/${invGiftAddrId}`, { method: "DELETE" })
        }
      } else if (addrName && addrFull) {
        await fetch(`/api/gift-addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wedding_profile_id: wpId, recipient_name: addrName, full_address: addrFull }),
        })
      }

      await fetchInvitationData(wpId)

      if (changed.length > 0) {
        fetch(`/api/ops/queue/${id}/invitation-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ops-phone": employee?.phone_number || "",
            "x-ops-role": employee?.role || "",
          },
          body: JSON.stringify({ details: `Mengubah: ${changed.join(", ")}` }),
        })
          .then(() => fetchAll())
          .catch((e) => console.error("[ops] invitation log failed", e))
      }
    } catch (err: any) {
      setInvSaveError(err?.message || "Gagal menyimpan. Coba lagi.")
    } finally {
      setInvSaving(false)
    }
  }

  function downloadExcel(filename: string, sheet: string, header: string[], rows: (string | number)[][]) {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, sheet)
    XLSX.writeFile(wb, filename)
  }

  const profileSlug = currentWp?.slug || ""
  const waCustomerUrl = currentWp?.whatsapp_number
    ? `https://wa.me/${currentWp.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo ${currentWp.bride_name} & ${currentWp.groom_name}, saya dari Aksaraa CORE OPS terkait proyek undangan Anda`)}`
    : "#"
  const guestInvUrl = (g: { slug?: string | null; name?: string; qr_token?: string | null }) =>
    g.slug ? `https://${profileSlug}.wedding.aksaraa.com/?to=${encodeURIComponent(g.slug)}` : ""
  const guestQrUrl = (g: { slug?: string | null; qr_token?: string | null }) =>
    g.slug || g.qr_token ? `https://${profileSlug}.wedding.aksaraa.com/qr/${encodeURIComponent(g.slug || g.qr_token || "")}` : ""

  const openQrModal = async () => {
    if (!currentWp) return
    setShowQrModal(true)
    setQrSearch("")
    setQrLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${currentWp.id}/qr-guestbook`)
      if (res.ok) {
        const data = await res.json()
        setQrGuests(data.guests || [])
      }
    } finally {
      setQrLoading(false)
    }
  }

  const handleGenerateQr = async () => {
    if (!currentWp || qrGenerating) return
    setQrGenerating(true)
    try {
      await fetch(`/api/dashboard/${currentWp.id}/qr-guestbook`, { method: "POST" })
    } catch {}
    await fetchAll()
    setQrGenerating(false)
  }

  const downloadVipExcel = () => {
    const header = ["Nama Tamu", "No. WhatsApp (nomor saja, tanpa +62/0)", "Kategori", "Meja", "VIP (isi YA jika VIP)", "Sumber", "Pesan"]
    const scheduleText = detail?.wa_blast_schedule?.message_text || ""
    const coupleName = currentWp ? getCoupleDisplayName({ display_name: currentWp.display_name, bride_name: currentWp.bride_name, groom_name: currentWp.groom_name }) : ""
    const sessions = (currentWp?.sessions || []) as Array<{ venue?: string; address?: string }>
    const firstSession = sessions[0] || {}
    const weddingDate = currentWp?.estimated_wedding_date
      ? new Date(currentWp.estimated_wedding_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : ""
    const venue = [firstSession.venue, firstSession.address].filter(Boolean).join(", ") || ""
    const rows = (detail?.vip_guests || []).map((g) => [
      g.name,
      (g.phone_number || "").replace(/[^0-9]/g, ""),
      g.category || "",
      g.table_number || "",
      "YA",
      g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
      scheduleText
        ? renderReminderMessage(scheduleText, {
            NamaTamu: g.name,
            TautanUnik: g.slug ? `https://${profileSlug}.wedding.aksaraa.com/?to=${encodeURIComponent(g.slug)}` : "",
            QRAkses: g.slug || g.qr_token ? `https://${profileSlug}.wedding.aksaraa.com/qr/${encodeURIComponent(g.slug || g.qr_token || "")}` : "",
            NamaPengantin: coupleName,
            NomorMeja: g.table_number || "",
            Tanggal: weddingDate,
            Lokasi: venue,
          })
        : "",
    ])
    downloadExcel(`daftar-tamu-vip-${profileSlug}.xlsx`, "Tamu VIP", header, rows)
  }

  const downloadQrExcel = () => {
    const msgCat = isValidMsgCategory(currentWp?.message_category) ? currentWp.message_category : "nasional"
    const msgCoupleName = `${(currentWp?.bride_name || "").trim()} & ${(currentWp?.groom_name || "").trim()}`
    const header = qrActive
      ? ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Pesan WhatsApp", "Tautan QR", "Tautan Undangan", "Sumber"]
      : ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Pesan WhatsApp", "Tautan Undangan", "Sumber"]
    const rows = qrGuests.map((g) =>
      qrActive
        ? [
            g.name,
            g.phone_number || "",
            g.category || "",
            g.table_number || "",
            g.slug || g.qr_token ? cleanMessageForCell(renderMessage(MSG_TEMPLATES[msgCat], g.name, msgCoupleName, guestInvUrl(g))) : "",
            guestQrUrl(g),
            guestInvUrl(g),
            g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
          ]
        : [
            g.name,
            g.phone_number || "",
            g.category || "",
            g.table_number || "",
            g.slug || g.qr_token ? cleanMessageForCell(renderMessage(MSG_TEMPLATES[msgCat], g.name, msgCoupleName, guestInvUrl(g))) : "",
            guestInvUrl(g),
            g.added_manually ? "Ditambahkan Manual" : "Undangan QR",
          ]
    )
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws["!cols"] = qrActive
      ? [
          { wch: 28 },
          { wch: 18 },
          { wch: 16 },
          { wch: 12 },
          { wch: 80 },
          { wch: 55 },
          { wch: 55 },
        ]
      : [
          { wch: 28 },
          { wch: 18 },
          { wch: 16 },
          { wch: 12 },
          { wch: 80 },
          { wch: 55 },
        ]
    for (let r = 2; r <= rows.length + 1; r++) {
      const undRef = XLSX.utils.encode_cell({ r: r - 1, c: qrActive ? 6 : 5 })
      const undVal = ws[undRef]?.v
      if (undVal) ws[undRef].l = { Target: String(undVal), Tooltip: String(undVal) }
      if (qrActive) {
        const qrRef = XLSX.utils.encode_cell({ r: r - 1, c: 5 })
        const qrVal = ws[qrRef]?.v
        if (qrVal) ws[qrRef].l = { Target: String(qrVal), Tooltip: String(qrVal) }
      }
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tautan & QR Tamu")
    XLSX.writeFile(wb, `tautan-qr-tamu-${profileSlug}.xlsx`)
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { mode: "cors" })
      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(url, "_blank")
    }
  }

  if (!employee) return null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-body-md">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  if (!detail || !currentWp) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background font-body-md">
        <span className="material-symbols-outlined text-5xl opacity-30">error</span>
        <p className="italic opacity-60">Data antrian tidak ditemukan.</p>
        <Link href="/ops" className="px-6 py-3 border border-primary text-primary font-label-md text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">
          Kembali ke Antrian
        </Link>
      </div>
    )
  }

  const flowIndex = OPS_COLUMNS.findIndex((c) => c.key === derived)

  return (
    <>
      <PageTheme mode="light" />
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f2ede4; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1c1c16; }
        .animate-pulse { animation: pulse-fade 2s infinite; }
        @keyframes pulse-fade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="flex flex-col h-screen bg-background text-on-surface antialiased font-body-md">
        <OpsHeader employee={employee} activeKey="antrian" />

        <main className="pt-20 flex-1 overflow-y-auto custom-scrollbar bg-background p-4 md:p-12">
          <Link
            href="/ops"
            className="inline-flex items-center gap-2 text-sm font-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Antrian
          </Link>

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-12 border-b border-outline-variant pb-6 md:pb-8">
            <div className="min-w-0">
              <span className="font-label-md text-xs uppercase tracking-[0.2em] text-secondary mb-2 block">
                Ruang Kerja Klien
              </span>
              <h2 className="font-display-lg text-3xl md:text-5xl leading-tight break-words">{currentWp.bride_name} &amp; {currentWp.groom_name}</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-body-md text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Tanggal:</span>
                  <span className="font-bold text-primary">{formatDate(getWeddingDate(currentWp))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi:</span>
                  <span className="font-bold text-primary">{currentWp.estimated_guest_count} Tamu</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60 shrink-0">Paket:</span>
                  <select
                    value={currentWp.package_type}
                    onChange={(e) => updatePackage(e.target.value)}
                    disabled={employee?.role === "creative"}
                    className="bg-white border border-outline-variant text-sm font-bold text-primary py-1 px-2 focus:ring-0 focus:border-primary font-body-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    <optgroup label="Undangan Digital">
                      {Object.entries(PACKAGE_LABELS)
                        .filter(([code]) => !code.startsWith("dgb_"))
                        .map(([code, label]) => (
                          <option key={code} value={code}>{label} — {getPackageCategory(code)}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Buku Tamu Digital">
                      {Object.entries(PACKAGE_LABELS)
                        .filter(([code]) => code.startsWith("dgb_"))
                        .map(([code, label]) => (
                          <option key={code} value={code}>{label} — {getPackageCategory(code)}</option>
                        ))}
                    </optgroup>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi Biaya:</span>
                  <span className="font-bold text-primary">{formatCurrency(currentWp.total_project_cost)}</span>
                </div>
                {currentWp.express_service && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 font-label-md text-[10px] uppercase tracking-widest rounded-full">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      Layanan Kilat 24 Jam
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end w-full lg:w-auto">
              <a
                href={waCustomerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-colors w-full sm:w-auto text-center"
              >
                Hubungi Customer
              </a>
              <div className="flex flex-col flex-1 sm:flex-none min-w-0">
                <label className="font-label-md text-[10px] uppercase tracking-widest mb-1">Petugas Konsultan</label>
                <select
                  value={detail.queue.assigned_to || ""}
                  onChange={(e) => assignConsultant(e.target.value)}
                  disabled={employee?.role === "creative"}
                  className="bg-surface-container border border-outline-variant text-sm py-2 px-4 focus:ring-0 focus:border-primary font-body-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:min-w-[180px]"
                >
                  <option value="">— Pilih —</option>
                  {detail.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-secondary-container text-on-secondary-container px-6 py-4 border border-secondary flex flex-col items-center justify-center w-full sm:w-auto">
                <span className="font-label-md text-[10px] uppercase tracking-widest opacity-80">Status SLA Aktif</span>
                <span className="font-mono text-xl font-bold">
                  <SlaTimer startedAt={detail.queue.sla_started_at} />
                </span>
              </div>
            </div>
          </div>

          {/* Status Pipeline Panel */}
          <section className="mb-8 md:mb-16 border border-primary p-4 md:p-8 bg-surface-container-low relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">account_tree</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="flex-1">
                <h3 className="font-headline-md text-xl mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined">account_tree</span>
                  Status Proyek
                </h3>
                <div className="flex flex-wrap gap-2">
                  {OPS_COLUMNS.map((col, i) => {
                    const state = derived && flowIndex !== -1
                      ? i < flowIndex ? "done" : i === flowIndex ? "active" : "todo"
                      : "todo"
                    return (
                      <span
                        key={col.key}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest ${
                          state === "done"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : state === "active"
                              ? "border-secondary bg-secondary text-on-secondary"
                              : "border-outline-variant opacity-50"
                        }`}
                      >
                        {state === "done" && <span className="material-symbols-outlined text-[12px]">check</span>}
                        {col.label}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs opacity-50 font-body-md italic mt-4">
                  Kolom posisi otomatis mengikuti data pembayaran dan feedback. Koreksi pembayaran (Belum/Sudah bayar) bisa
                  dilakukan kapan saja; alur feedback berjalan berurutan.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:min-w-[260px] sm:w-auto">
                <label className="font-label-md text-xs uppercase tracking-widest">Ubah Status</label>
                <select
                  value=""
                  onChange={(e) => e.target.value && changeStatus(e.target.value)}
                  disabled={statusSaving}
                  className="bg-white border border-outline-variant text-sm py-3 px-3 focus:ring-0 focus:border-primary font-body-md cursor-pointer disabled:opacity-50 w-full"
                >
                  <option value="">— Pilih status —</option>
                  {OPS_COLUMNS.map((col) => {
                    const valid = allowed.includes(col.key)
                    return (
                      <option key={col.key} value={col.key} disabled={!valid}>
                        {col.label}{!valid ? " (tidak valid)" : ""}
                      </option>
                    )
                  })}
                </select>
                {!roleCanChange && derived && (
                  <p className="text-xs text-amber-600 max-w-[260px] whitespace-normal break-words leading-relaxed">{unauthorizedStatusMessage(employee?.role || "", derived)}</p>
                )}
                {statusSaving && <p className="text-xs text-secondary">Menyimpan...</p>}
                {statusError && <p className="text-xs text-red-600">{statusError}</p>}
              </div>
            </div>
          </section>

          {/* Feature Cards */}
          <div className="mb-12 flex justify-between items-center">
            <h3 className="font-headline-md text-2xl">Fitur Pernikahan</h3>
            <div className="flex gap-2">
              <button className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button className="w-10 h-10 border border-outline-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors opacity-40">
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-16">
            {detail.feature_actions.length === 0 && (
              <div className="col-span-full text-center opacity-30 italic font-body-md text-sm py-12">
                Tidak ada fitur untuk paket ini
              </div>
            )}
            {[...detail.feature_actions]
              .sort((a, b) => {
                const pa = CARD_PRIORITY[a.feature_key] ?? 99
                const pb = CARD_PRIORITY[b.feature_key] ?? 99
                return pa - pb
              })
              .map((fa) => {
                return (
                  <div
                    key={fa.id}
                    className="bg-white border border-outline-variant p-4 md:p-6 flex flex-col hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-display-lg text-base leading-tight">
                        {FEATURE_LABELS[fa.feature_key] || fa.feature_key}
                      </h4>
                    </div>

                    {(() => {
                      const subtitle = fa.feature_key === "premium_web"
                        ? [detail.feature_stats.template_name, detail.feature_stats.track_name].filter(Boolean).join(" / ") || null
                        : fa.feature_key === "unique_link_generator"
                          ? qrActive
                            ? `${detail.guest_stats.with_token} QR Aktif`
                            : null
                          : fa.feature_key === "qr_code_book"
                            ? `${detail.feature_stats.checked_in_count} Tamu Sudah Hadir`
                            : fa.feature_key === "wish_wall"
                              ? `${detail.feature_stats.wish_count} Wish Sudah Masuk`
                              : fa.feature_key === "galeri_foto_tamu"
                                ? `${detail.feature_stats.photo_count} Foto Terunggah`
                                : fa.feature_key === "kolom_direct_transfer"
                                  ? `${detail.feature_stats.account_count} Rek, ${detail.feature_stats.address_count} Alm`
                                  : fa.feature_key === "reservation_automation" && detail.reservation_stats
                                    ? `${detail.reservation_stats.hadir} Hadir • ${detail.reservation_stats.belum_respon} Belum Respon • ${detail.reservation_stats.belum_dibuka} Belum Dibuka`
                                    : fa.feature_key === "wa_blast" && waBlastSchedule
                                      ? `${WA_BLAST_LABELS[waBlastSchedule.template_type] || waBlastSchedule.template_type} • ${formatDate(waBlastSchedule.scheduled_date)} ${waBlastSchedule.scheduled_time?.slice(0, 5) || ""}`
                                      : null
                      return subtitle ? (
                        <div className="mb-4 py-2 px-3 bg-secondary-container/60 border border-secondary/15">
                          <p className="font-body-md text-secondary font-semibold text-xs uppercase tracking-wider">
                            {subtitle}
                          </p>
                        </div>
                      ) : null
                    })()}

                    {(fa.feature_key === "premium_web" || fa.feature_key === "wa_blast") && (() => {
                      const confirmed = fa.feature_key === "premium_web"
                        ? detail.feature_stats.web_published === true
                        : !!waBlastSchedule
                      const label = fa.feature_key === "premium_web"
                        ? (confirmed ? "Undangan Terkonfirmasi dari Editor" : "Undangan Belum Dikonfirmasi dari Editor")
                        : (confirmed ? "Jadwal Reminder Sudah Disimpan" : "Jadwal Reminder Belum Disimpan")
                      return (
                        <div className={`mb-4 inline-flex items-center gap-2 px-2.5 py-1 border text-[9px] font-bold uppercase tracking-widest ${
                          confirmed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${confirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {label}
                        </div>
                      )
                    })()}

                    {fa.feature_key === "unique_link_generator" && (
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <button
                          onClick={openQrModal}
                          className="px-4 py-2.5 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_2</span>
                          Lihat Daftar Tamu &amp; Link
                        </button>
                        {qrActive ? (
                          <>
                            <button
                              onClick={handleGenerateQr}
                              disabled={qrGenerating}
                              className="px-4 py-2.5 border border-outline-variant text-[9px] font-bold uppercase tracking-widest hover:border-primary transition-all disabled:opacity-50"
                            >
                              {qrGenerating ? "Membuat..." : "Generate QR"}
                            </button>
                            <span className="text-[10px] text-on-surface-variant">{detail.guest_stats.with_token}/{detail.guest_stats.total} QR Aktif</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/70 italic">QR Tamu tidak tersedia untuk paket ini</span>
                        )}
                      </div>
                    )}

                    {fa.feature_key === "wa_blast" && waBlastSchedule?.message_text && (
                      <div className="mb-4 bg-surface rounded-lg p-4 border border-outline-variant/40 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/20">
                          <span className="font-label-md text-[9px] uppercase tracking-widest text-secondary font-semibold">{WA_BLAST_LABELS[waBlastSchedule.template_type] || waBlastSchedule.template_type}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant/50" />
                          <span className="font-label-md text-[8px] uppercase tracking-wider text-on-surface-variant/60">{waBlastSchedule.total_guests} Tamu</span>
                          <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${waBlastSchedule.status === "scheduled" ? "bg-amber-100 text-amber-800" : waBlastSchedule.status === "sent" ? "bg-emerald-100 text-emerald-800" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {waBlastSchedule.status === "scheduled" ? "Terjadwal" : waBlastSchedule.status === "sent" ? "Terkirim" : waBlastSchedule.status}
                          </span>
                        </div>
                        <p className="font-body-md text-sm text-on-surface/90 leading-relaxed whitespace-pre-wrap">
                          {waBlastSchedule.message_text}
                        </p>
                      </div>
                    )}

                    {fa.feature_key === "wa_blast" && (detail.wa_blast_quota || 0) > 0 && (
                      <div className="mb-4 bg-surface rounded-lg p-4 border border-outline-variant/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-secondary font-semibold">Kuota Pengiriman</p>
                            <p className="text-lg font-bold text-primary mt-0.5">{detail.wa_blast_quota}</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              {Math.min((detail.vip_guests || []).length, detail.wa_blast_quota || 0)} dari {(detail.vip_guests || []).length} tamu VIP termasuk kuota
                              {(detail.vip_guests || []).length > (detail.wa_blast_quota || 0) && (
                                <span className="text-red-600"> &bull; {(detail.vip_guests || []).length - (detail.wa_blast_quota || 0)} dikecualikan</span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => setShowVipModal(true)}
                              className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors"
                            >
                              Lihat Daftar Tamu VIP
                            </button>
                            <button
                              onClick={downloadVipExcel}
                              disabled={(detail.vip_guests || []).length === 0}
                              className="px-4 py-2 border border-outline text-on-surface font-label-md text-[10px] uppercase tracking-widest hover:bg-surface-container transition-colors disabled:opacity-40"
                            >
                              Download Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {fa.client_note && (
                      <p className="text-xs italic font-body-md opacity-60 mb-4 leading-relaxed">
                        &ldquo;{fa.client_note}&rdquo;
                      </p>
                    )}

                    {fa.image_url && (
                      <div className="mb-4 border border-outline-variant overflow-hidden bg-surface-container">
                        <img
                          src={fa.image_url}
                          alt={`Gambar ${FEATURE_LABELS[fa.feature_key]}`}
                          className="w-full h-28 object-cover"
                        />
                      </div>
                    )}

                    {fa.feature_key === "premium_web" && feedbackSubmissions.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <h5 className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">
                          Feedback Terbaru
                        </h5>
                        {feedbackSubmissions.slice(0, 2).map((fb) => {
                          const images = (() => {
                            if (!fb.image_url) return []
                            try { const p = JSON.parse(fb.image_url); return Array.isArray(p) ? p : [fb.image_url] }
                            catch { return [fb.image_url] }
                          })()
                          return (
                            <div key={fb.id} className="bg-surface-container-low p-3 border-l-2 border-secondary">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <p className="font-body-md text-xs font-semibold">{fb.template_name || "Draf"} <span className="font-label-md text-[10px] text-on-surface-variant/60 font-normal">R{fb.round_number}</span></p>
                                <span className={`text-[7px] font-bold uppercase px-1 py-0.5 shrink-0 ${fb.status === "resolved" ? "bg-emerald-100 text-emerald-800" : fb.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                  {fb.status === "resolved" ? "Selesai" : fb.status === "in_progress" ? "Proses" : "Tunggu"}
                                </span>
                              </div>
                              <p className="font-body-md text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                                &ldquo;{fb.description}&rdquo;
                              </p>
                              <p className="font-label-md text-[10px] text-on-surface-variant/70 mt-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {formatDateTime(fb.created_at)}
                              </p>
                              {images.length > 0 && (
                                <div className="flex gap-1 mt-1.5">
                                  {images.map((imgUrl, imgIdx) => (
                                    <a
                                      key={imgIdx}
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-8 h-8 border border-outline-variant overflow-hidden rounded block hover:opacity-80 transition-opacity"
                                    >
                                      <img src={imgUrl} alt={`img ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {feedbackSubmissions.length > 2 && (
                          <p className="font-label-md text-[8px] text-on-surface-variant/50 text-center">+{feedbackSubmissions.length - 2} lainnya</p>
                        )}
                      </div>
                    )}

                    {fa.feature_key === "premium_web" && (
                      <button
                        onClick={() => fetchInvitationData(fa.wedding_profile_id)}
                        disabled={invLoading}
                        className="w-full mb-4 py-3 border border-secondary text-secondary text-[9px] font-bold uppercase tracking-widest hover:bg-secondary hover:text-on-secondary transition-all disabled:opacity-40"
                      >
                        {invLoading ? "Memuat..." : "Detail Undangan Digital"}
                      </button>
                    )}

                  </div>
                )
              })}
          </div>

          {/* Riwayat (status + paket) */}
          <section className="mb-16">
            <h3 className="font-headline-md text-2xl mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined">history</span>
              Riwayat
            </h3>
            <div className="border border-outline-variant bg-white overflow-x-auto">
              {detail.status_log.length === 0 ? (
                <p className="p-6 text-sm opacity-50 italic text-center">Belum ada riwayat.</p>
              ) : (
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-left font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Perubahan</th>
                      <th className="px-4 py-3">Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {detail.status_log.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{formatDateTime(log.created_at)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {log.kind === "package" ? (
                            <>Paket: {log.previous_package ? PACKAGE_LABELS[log.previous_package] ?? log.previous_package : "—"}{" → "}{log.new_package ? PACKAGE_LABELS[log.new_package] ?? log.new_package : "—"}</>
                          ) : log.kind === "invitation" ? (
                            <>Data Undangan: <span className="font-normal">{log.details || "diubah"}</span></>
                          ) : (
                            <>{log.previous_status ? OPS_STATUS_LABELS[log.previous_status as keyof typeof OPS_STATUS_LABELS] ?? log.previous_status : "—"}{" → "}{log.new_status ? OPS_STATUS_LABELS[log.new_status as keyof typeof OPS_STATUS_LABELS] ?? log.new_status : "—"}</>
                          )}
                        </td>
                        <td className="px-4 py-3">{log.changed_by_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Workspace Footer */}
          <footer className="w-full py-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-outline-variant">
            <div className="flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined animate-pulse text-secondary">sync</span>
              <p className="font-label-md text-xs uppercase tracking-widest">
                Sinkronisasi real-time database pengantin Aksaraa Studio
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* INVITATION CARD MODAL */}
      {showInvCard && invitationData && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant">
              <h2 className="font-display-lg text-lg">Undangan Digital — {invitationData.profile?.bride_name || ""} & {invitationData.profile?.groom_name || ""}</h2>
              <div className="flex items-center gap-2">
                {!invEditing ? (
                  <button
                    onClick={startInvEdit}
                    className="px-4 py-2 bg-primary text-on-primary text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Ubah
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setInvEditing(false); setInvForm(null); setInvSaveError("") }}
                      disabled={invSaving}
                      className="px-4 py-2 border border-outline-variant text-on-surface-variant text-[9px] font-bold uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-40"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveInvEdit}
                      disabled={invSaving}
                      className="px-4 py-2 bg-secondary text-white text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-40"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${invSaving ? "animate-spin" : ""}`}>{invSaving ? "progress_activity" : "save"}</span>
                      {invSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (!cardRef.current) return
                    html2canvas(cardRef.current, { scale: 2, useCORS: true }).then((canvas) => {
                      const link = document.createElement("a")
                      link.download = `undangan-${invitationData.profile?.slug || "card"}.png`
                      link.href = canvas.toDataURL("image/png")
                      link.click()
                    })
                  }}
                  className="px-4 py-2 bg-secondary text-on-secondary text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
                <button onClick={() => { setShowInvCard(false); setInvitationData(null); setInvEditing(false); setInvForm(null); setInvSaveError("") }} className="p-2 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            {invSaveError && (
              <div className="mx-6 sm:mx-10 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">error</span>
                <p className="font-body-md text-[13px] text-red-700">{invSaveError}</p>
              </div>
            )}
            {(() => {
              const p = invitationData.profile
              const defs: [string, string][] = [
                ["sampul", "SAMPUL"],
                ["pembuka", "KALIMAT PEMBUKA"],
                ["profil", "PROFILE MEMPELAI"],
                ["acara", "ACARA"],
                ["galeri", "GALERI"],
                ["inviting", "TURUT MENGUNDANG"],
                ["kutipan", "KUTIPAN"],
                ["video", "VIDEO"],
                ["story", "STORY"],
                ["gift", "GIFT"],
                ["musik", "MUSIC"],
              ]
              const gift = { accounts: invitationData.gift_accounts || [], address: invitationData.gift_address || "" }
              const empty = defs
                .filter(([k]) => invSectionState(p, k, k === "gift" ? gift : undefined) === "empty")
                .map(([, label]) => label)
              const published = p.is_published === true
              return (
                <div className="mx-6 sm:mx-10 mt-4 space-y-2">
                  <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2 border ${published ? "bg-emerald-50 border-emerald-200" : "bg-surface-container-low border-outline-variant"}`}>
                    <span className={`material-symbols-outlined text-[18px] ${published ? "text-emerald-600" : "text-on-surface-variant"}`}>
                      {published ? "verified" : "hourglass_top"}
                    </span>
                    <p className={`font-label-md text-[11px] uppercase tracking-widest ${published ? "text-emerald-700" : "text-on-surface-variant"}`}>
                      {published
                        ? `Sudah dikonfirmasi${p.published_at ? ` • ${formatDateTime(p.published_at)}` : ""}`
                        : "Belum dikonfirmasi editor"}
                    </p>
                  </div>
                  {empty.length > 0 ? (
                    <div className="rounded-xl px-4 py-3 flex items-start gap-2 bg-amber-50 border border-amber-300">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">warning</span>
                      <div>
                        <p className="font-label-md text-[11px] uppercase tracking-widest text-amber-800">Data belum lengkap ({empty.length})</p>
                        <p className="font-body-md text-[13px] text-amber-900 mt-0.5 leading-relaxed">{empty.join(" • ")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-2.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                      <p className="font-label-md text-[11px] uppercase tracking-widest text-emerald-700">Semua data terisi</p>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="p-6 sm:p-10">
              <div ref={cardRef} className="max-w-md mx-auto bg-white border border-outline-variant shadow-lg overflow-hidden">
                {/* SAMPUL — header + hero + foto sampul (editor order) */}
                <div className="px-6 pt-6 flex items-center gap-2">
                  <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary">SAMPUL</h4>
                  <InvBadge state={invSectionState(invitationData.profile, "sampul")} label="SAMPUL" />
                </div>
                {invEditing && invForm ? (
                  <div className="px-6 py-3 space-y-3">
                    <InvField label="Foto Sampul Utama">
                      <InvPhotoList urls={invForm.couple_illustration_url ? [invForm.couple_illustration_url] : []} onChange={(v) => setInvForm({ ...invForm, couple_illustration_url: v[0] || "" })} onUpload={invUploadPhoto} uploading={invUploading} uploadKey="sampul-main" />
                    </InvField>
                    <InvCheck label="Foto hitam putih (grayscale)" checked={!!invForm.grayscale} onChange={(v) => setInvForm({ ...invForm, grayscale: v })} />
                    <InvField label="Foto Sampul Tambahan">
                      <InvPhotoList urls={invForm.cover_photos} onChange={(v) => setInvForm({ ...invForm, cover_photos: v })} onUpload={invUploadPhoto} uploading={invUploading} uploadKey="sampul-extra" />
                    </InvField>
                  </div>
                ) : invSectionState(invitationData.profile, "sampul") === "empty" ? (
                  <p className="px-6 py-3 font-body-md text-xs italic text-on-surface-variant/70">Belum diisi.</p>
                ) : (
                  <>
                    {invitationData.profile?.couple_illustration_url && (
                      <div className="relative h-64 sm:h-80 bg-surface-dim overflow-hidden mt-3">
                        <img
                          src={invitationData.profile.couple_illustration_url}
                          alt="Cover"
                          className={`w-full h-full object-cover ${invitationData.profile.grayscale ? "grayscale" : ""}`}
                          crossOrigin="anonymous"
                        />
                        <button
                          onClick={() => downloadImage(invitationData.profile.couple_illustration_url!, `cover-${invitationData.profile.slug || "photo"}.jpg`)}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 border border-outline-variant flex items-center justify-center shadow-sm hover:bg-white transition-colors z-10"
                          title="Download"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-display-lg text-3xl sm:text-4xl">{invitationData.profile.display_name || `${invitationData.profile.bride_name} & ${invitationData.profile.groom_name}`}</h3>
                          <p className="font-body-md text-sm opacity-80 mt-1">We Are Getting Married</p>
                        </div>
                      </div>
                    )}
                    {coverPhotos(invitationData.profile.cover_photos).length > 0 && (
                      <div className="px-6 pt-4 pb-2">
                        <div className="grid grid-cols-3 gap-2">
                          {coverPhotos(invitationData.profile.cover_photos).map((url, i) => (
                            <div key={i} className="relative group aspect-video bg-surface-dim border border-outline-variant overflow-hidden">
                              <img src={url} alt={`Cover ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button onClick={() => downloadImage(url, `cover-${invitationData.profile.slug || "photo"}-${i + 1}.jpg`)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Download">
                                <span className="material-symbols-outlined text-[11px]">download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="p-6 space-y-6">
                  <InvSection editing={!!(invEditing && invForm)} title="KALIMAT PEMBUKA" state={invSectionState(invitationData.profile, "pembuka")}>
                    {invEditing && invForm ? (
                      <div className="space-y-3">
                        <InvField label="Judul Pembuka"><InvText value={invForm.opening_title} onChange={(v) => setInvForm({ ...invForm, opening_title: v })} placeholder="Assalamu'alaikum ..." /></InvField>
                        <InvField label="Deskripsi Pembuka"><InvArea value={invForm.opening_description} onChange={(v) => setInvForm({ ...invForm, opening_description: v })} rows={4} /></InvField>
                      </div>
                    ) : (
                    <div>
                      {invitationData.profile.opening_title && (
                        <p className="font-body-md text-sm font-semibold">{invitationData.profile.opening_title}</p>
                      )}
                      {invitationData.profile.opening_description && (
                        <p className="font-body-md text-xs text-on-surface-variant mt-1 whitespace-pre-line">{invitationData.profile.opening_description}</p>
                      )}
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)} title="PROFILE MEMPELAI" state={invSectionState(invitationData.profile, "profil")}>
                    {invEditing && invForm ? (
                      <div className="space-y-3">
                        <InvField label="Nama Tampilan"><InvText value={invForm.display_name} onChange={(v) => setInvForm({ ...invForm, display_name: v })} placeholder="Andi & Budi" /></InvField>
                        <InvField label="Inisial Pasangan"><InvText value={invForm.couple_initials} onChange={(v) => setInvForm({ ...invForm, couple_initials: v })} placeholder="A & B" /></InvField>
                        <div className="grid grid-cols-2 gap-2">
                          <InvField label="Panggilan (1)"><InvText value={invForm.groom_name} onChange={(v) => setInvForm({ ...invForm, groom_name: v })} /></InvField>
                          <InvField label="Panggilan (2)"><InvText value={invForm.bride_name} onChange={(v) => setInvForm({ ...invForm, bride_name: v })} /></InvField>
                          <InvField label="Nama Lengkap (1)"><InvText value={invForm.groom_full_name} onChange={(v) => setInvForm({ ...invForm, groom_full_name: v })} /></InvField>
                          <InvField label="Nama Lengkap (2)"><InvText value={invForm.bride_full_name} onChange={(v) => setInvForm({ ...invForm, bride_full_name: v })} /></InvField>
                          <InvField label="Orang Tua (1)"><InvText value={invForm.groom_parents} onChange={(v) => setInvForm({ ...invForm, groom_parents: v })} /></InvField>
                          <InvField label="Orang Tua (2)"><InvText value={invForm.bride_parents} onChange={(v) => setInvForm({ ...invForm, bride_parents: v })} /></InvField>
                          <InvField label="Instagram (1)"><InvText value={invForm.groom_instagram} onChange={(v) => setInvForm({ ...invForm, groom_instagram: v })} /></InvField>
                          <InvField label="Instagram (2)"><InvText value={invForm.bride_instagram} onChange={(v) => setInvForm({ ...invForm, bride_instagram: v })} /></InvField>
                        </div>
                        <InvField label="Foto Mempelai 1"><InvPhotoList urls={invForm.groom_photo_url} onChange={(v) => setInvForm({ ...invForm, groom_photo_url: v })} onUpload={invUploadPhoto} uploading={invUploading} uploadKey="profil-groom" /></InvField>
                        <InvField label="Foto Mempelai 2"><InvPhotoList urls={invForm.bride_photo_url} onChange={(v) => setInvForm({ ...invForm, bride_photo_url: v })} onUpload={invUploadPhoto} uploading={invUploading} uploadKey="profil-bride" /></InvField>
                      </div>
                    ) : (
                    <div>
                      <p className="font-display-lg text-2xl text-center text-primary">{invitationData.profile.display_name || `${invitationData.profile.bride_name} & ${invitationData.profile.groom_name}`}</p>
                      {invitationData.profile.couple_initials && (
                        <p className="font-display-lg text-sm text-center text-secondary mt-1">{invitationData.profile.couple_initials}</p>
                      )}

                    {(() => {
                      const groomPhotos = photoList(invitationData.profile.groom_photo_url)
                      const bridePhotos = photoList(invitationData.profile.bride_photo_url)
                      if (groomPhotos.length === 0 && bridePhotos.length === 0) return null
                      const pslug = invitationData.profile?.slug || "photo"
                      return (
                        <div className="mt-4 space-y-3">
                          {groomPhotos.length > 0 && (
                            <div className="text-center">
                              <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Foto Mempelai Pertama{groomPhotos.length > 1 ? " (Slideshow)" : ""}</p>
                              <div className="flex justify-center gap-3">
                                {groomPhotos.map((url, i) => (
                                  <div key={i} className="relative group">
                                    <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden bg-surface-dim">
                                      <img src={url} alt={`Groom ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                    <button
                                      onClick={() => downloadImage(url, `groom-${pslug}-${i + 1}.jpg`)}
                                      className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                      title="Download"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">download</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {bridePhotos.length > 0 && (
                            <div className="text-center">
                              <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Foto Mempelai Kedua{bridePhotos.length > 1 ? " (Slideshow)" : ""}</p>
                              <div className="flex justify-center gap-3">
                                {bridePhotos.map((url, i) => (
                                  <div key={i} className="relative group">
                                    <div className="w-16 h-16 rounded-full border-2 border-secondary overflow-hidden bg-surface-dim">
                                      <img src={url} alt={`Bride ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                    <button
                                      onClick={() => downloadImage(url, `bride-${pslug}-${i + 1}.jpg`)}
                                      className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                      title="Download"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">download</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                        <div>
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Pertama</p>
                          {invitationData.profile.groom_name && (
                            <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.groom_name}</p>
                          )}
                          {invitationData.profile.groom_full_name && invitationData.profile.groom_full_name !== invitationData.profile.groom_name && (
                            <p className="font-body-md text-xs mt-0.5">{invitationData.profile.groom_full_name}</p>
                          )}
                          {invitationData.profile.groom_parents && (
                            <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putra dari {invitationData.profile.groom_parents}</p>
                          )}
                          {invitationData.profile.groom_instagram && (
                            <p className="font-body-md text-[10px] text-secondary mt-0.5">@{invitationData.profile.groom_instagram}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">Mempelai Kedua</p>
                          {invitationData.profile.bride_name && (
                            <p className="font-body-md text-sm font-semibold mt-0.5">{invitationData.profile.bride_name}</p>
                          )}
                          {invitationData.profile.bride_full_name && invitationData.profile.bride_full_name !== invitationData.profile.bride_name && (
                            <p className="font-body-md text-xs mt-0.5">{invitationData.profile.bride_full_name}</p>
                          )}
                          {invitationData.profile.bride_parents && (
                            <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">Putri dari {invitationData.profile.bride_parents}</p>
                          )}
                          {invitationData.profile.bride_instagram && (
                            <p className="font-body-md text-[10px] text-secondary mt-0.5">@{invitationData.profile.bride_instagram}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)} title="ACARA" state={invSectionState(invitationData.profile, "acara")}>
                    {invEditing && invForm ? (
                      <div className="space-y-3">
                        <InvField label="Perkiraan Tanggal"><InvText value={invForm.estimated_wedding_date} onChange={(v) => setInvForm({ ...invForm, estimated_wedding_date: v })} placeholder="2026-10-10" /></InvField>
                        <InvSessionList items={invForm.sessions} onChange={(v) => setInvForm({ ...invForm, sessions: v })} />
                        <InvField label="Batas Maksimum Pax"><InvText value={String(invForm.rsvp_max_pax ?? 2)} onChange={(v) => setInvForm({ ...invForm, rsvp_max_pax: v })} /></InvField>
                      </div>
                    ) : (
                    <div>
                    {getWeddingDate(invitationData.profile) && (
                      <p className="font-display-lg text-lg text-primary">{formatDate(getWeddingDate(invitationData.profile))}</p>
                    )}
                    {Array.isArray(invitationData.profile.sessions) && invitationData.profile.sessions.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {invitationData.profile.sessions.map((s: any, i: number) => (
                          <div key={i} className="border-l-2 border-secondary pl-4">
                            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">{s.name || `Sesi ${i + 1}`}</p>
                            <p className="font-body-md text-sm mt-0.5">{s.date}{s.time ? ` | ${s.time}` : ""}{s.timezone ? ` ${s.timezone}` : ""}</p>
                            {s.venue && <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{s.venue}</p>}
                            {s.address && <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{s.address}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Batas Maksimum Pax:</span>
                      <span className="font-body-md text-sm font-semibold text-on-surface">{invitationData?.profile?.rsvp_max_pax ?? 2}</span>
                    </div>
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)} title="GALERI" state={invSectionState(invitationData.profile, "galeri")}>
                    {invEditing && invForm ? (
                      <InvPhotoList urls={invForm.gallery_photos} onChange={(v) => setInvForm({ ...invForm, gallery_photos: v })} onUpload={invUploadPhoto} uploading={invUploading} uploadKey="galeri" />
                    ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(Array.isArray(invitationData.profile.gallery_photos) ? invitationData.profile.gallery_photos : []).map((url: string, i: number) => (
                        <div key={i} className="relative group aspect-square bg-surface-dim border border-outline-variant overflow-hidden">
                          <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                          <button
                            onClick={() => downloadImage(url, `gallery-${invitationData.profile.slug || "photo"}-${i + 1}.jpg`)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download"
                          >
                            <span className="material-symbols-outlined text-[11px]">download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)}
                    title="TURUT MENGUNDANG"
                    state={invSectionState(invitationData.profile, "inviting")}
                    lockTip={invUpgradeMessage(invAvailableIn(invitationData.profile, "inviting_families"))}
                  >
                    {invEditing && invForm && invSectionState(invitationData.profile, "inviting") !== "locked" ? (
                      <div className="space-y-3">
                        <InvCheck label="Tampilkan Turut Mengundang" checked={!!invForm.inviting_families_visible} onChange={(v) => setInvForm({ ...invForm, inviting_families_visible: v })} />
                        <InvStringList items={invForm.inviting_families} onChange={(v) => setInvForm({ ...invForm, inviting_families: v })} placeholder="Keluarga Besar ..." addLabel="Tambah" />
                      </div>
                    ) : (
                    <div className="text-center">
                      {(Array.isArray(invitationData.profile.inviting_families) ? invitationData.profile.inviting_families.filter(Boolean) : []).map((f: string, i: number) => (
                        <p key={i} className="font-body-md text-[10px] italic text-on-surface-variant">Keluarga Besar {f}</p>
                      ))}
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)} title="KUTIPAN" state={invSectionState(invitationData.profile, "kutipan")}>
                    {invEditing && invForm ? (
                      <div className="space-y-3">
                        <InvField label="Isi Kutipan"><InvArea value={invForm.quote_text} onChange={(v) => setInvForm({ ...invForm, quote_text: v })} rows={3} /></InvField>
                        <InvField label="Sumber Kutipan"><InvText value={invForm.quote_source} onChange={(v) => setInvForm({ ...invForm, quote_source: v })} /></InvField>
                      </div>
                    ) : (
                    <div className="text-center italic">
                        <p className="font-body-md text-sm leading-relaxed">&ldquo;{invitationData.profile.quote_text}&rdquo;</p>
                        {invitationData.profile.quote_source && (
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">&mdash; {invitationData.profile.quote_source}</p>
                        )}
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)}
                    title="VIDEO"
                    state={invSectionState(invitationData.profile, "video")}
                    lockTip={invUpgradeMessage(invAvailableIn(invitationData.profile, "cinematic_video"))}
                  >
                    {invEditing && invForm && invSectionState(invitationData.profile, "video") !== "locked" ? (
                      <div className="space-y-3">
                        <InvCheck label="Tampilkan Video" checked={!!invForm.video_section_visible} onChange={(v) => setInvForm({ ...invForm, video_section_visible: v })} />
                        <InvField label="Link Video"><InvText value={invForm.video_url} onChange={(v) => setInvForm({ ...invForm, video_url: v })} placeholder="https://youtube..." /></InvField>
                      </div>
                    ) : (
                    <div>
                      <a href={invitationData.profile.video_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-xs text-primary underline break-all">{invitationData.profile.video_url}</a>
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)}
                    title="STORY"
                    state={invSectionState(invitationData.profile, "story")}
                    lockTip={invUpgradeMessage(invAvailableIn(invitationData.profile, "story"))}
                  >
                    {invEditing && invForm && invSectionState(invitationData.profile, "story") !== "locked" ? (
                      <div className="space-y-3">
                        <InvCheck label="Tampilkan Kisah Cinta" checked={!!invForm.story_visible} onChange={(v) => setInvForm({ ...invForm, story_visible: v })} />
                        <InvStoryList items={invForm.stories} onChange={(v) => setInvForm({ ...invForm, stories: v })} onUpload={invUploadPhoto} uploading={invUploading} />
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-4">
                          {invitationData.profile.stories.map((st: any, i: number) => (
                            <div key={i} className="flex gap-4">
                              {st.image_url && (
                                <div className="relative group w-16 h-16 shrink-0 bg-surface-dim border border-outline-variant overflow-hidden">
                                  <img src={st.image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                  <button
                                    onClick={() => downloadImage(st.image_url, `story-${invitationData.profile.slug || "photo"}-${i}.jpg`)}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Download"
                                  >
                                    <span className="material-symbols-outlined text-[11px]">download</span>
                                  </button>
                                </div>
                              )}
                              <div>
                                {st.year && <p className="font-label-md text-[9px] text-secondary uppercase tracking-widest">{st.year}</p>}
                                {st.title && <p className="font-body-md text-sm font-semibold">{st.title}</p>}
                                {st.description && <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{st.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </InvSection>

                  {invitationData.template && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Template</h4>
                        <div className="flex items-center gap-4">
                          {invitationData.template.preview_image_url && (
                            <div className="relative group w-20 h-20 shrink-0 bg-surface-dim border border-outline-variant overflow-hidden">
                              <img src={invitationData.template.preview_image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button
                                onClick={() => downloadImage(invitationData.template.preview_image_url, `template-${invitationData.template.code || "preview"}.jpg`)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                              >
                                <span className="material-symbols-outlined text-[11px]">download</span>
                              </button>
                            </div>
                          )}
                          <div>
                            <p className="font-body-md text-sm font-semibold">{invitationData.template.name}</p>
                            {invitationData.template.description && (
                              <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{invitationData.template.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <InvSection editing={!!(invEditing && invForm)}
                    title="GIFT"
                    state={invSectionState(invitationData.profile, "gift", { accounts: invitationData.gift_accounts || [], address: invitationData.gift_address || "" })}
                  >
                    {invEditing && invForm ? (
                      <div className="space-y-3">
                        <InvCheck label="Tampilkan Bagian Hadiah" checked={!!invForm.gift_section_visible} onChange={(v) => setInvForm({ ...invForm, gift_section_visible: v })} />
                        <InvGiftAccounts items={invForm.giftAccounts} onChange={(v) => setInvForm({ ...invForm, giftAccounts: v })} />
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary">Alamat Pengiriman Kado</h4>
                            {invitationData.profile?.package_gates?.gift_address?.included === false && (
                              <InvBadge state="locked" label="Alamat Pengiriman Kado" tip={invUpgradeMessage(invAvailableIn(invitationData.profile, "gift_address"))} />
                            )}
                          </div>
                          <div className="space-y-3">
                            <InvField label="Nama Penerima"><InvText value={invForm.giftAddress.recipient_name} onChange={(v) => setInvForm({ ...invForm, giftAddress: { ...invForm.giftAddress, recipient_name: v } })} /></InvField>
                            <InvField label="Alamat Lengkap"><InvArea value={invForm.giftAddress.full_address} onChange={(v) => setInvForm({ ...invForm, giftAddress: { ...invForm.giftAddress, full_address: v } })} rows={3} /></InvField>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div>
                        {Array.isArray(invitationData.gift_accounts) && invitationData.gift_accounts.length > 0 && (
                          <div className="space-y-2">
                            {invitationData.gift_accounts.map((a: any, i: number) => (
                              <div key={i} className="flex justify-between border-b border-outline-variant/20 pb-2 text-sm">
                                <span className="font-body-md">{a.provider_name}</span>
                                <span className="font-body-md font-semibold">{a.account_number} — {a.account_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {invitationData.gift_address && (
                          <div className="mt-3 bg-surface-container-low p-3 rounded">
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 flex items-center gap-2">
                              Alamat Pengiriman Kado
                              {invitationData.profile?.package_gates?.gift_address?.included === false && (
                                <InvBadge state="locked" label="Alamat Pengiriman Kado" tip={invUpgradeMessage(invAvailableIn(invitationData.profile, "gift_address"))} />
                              )}
                            </p>
                            {invitationData.gift_address_name && <p className="font-body-md text-sm font-semibold">a.n. {invitationData.gift_address_name}</p>}
                            <p className="font-body-md text-xs text-on-surface-variant whitespace-pre-line">{invitationData.gift_address}</p>
                          </div>
                        )}
                    </div>
                    )}
                  </InvSection>

                  <InvSection editing={!!(invEditing && invForm)}
                    title="MUSIC"
                    state={invSectionState(invitationData.profile, "musik")}
                    noEmptyBadge
                    emptyText="Belum dipilih."
                  >
                    {invEditing && invForm ? (
                      <InvField label="Lagu Undangan">
                        <select
                          value={invForm.selected_track_id || ""}
                          onChange={(e) => setInvForm({ ...invForm, selected_track_id: e.target.value })}
                          className={invInputCls}
                        >
                          <option value="">— Tanpa lagu —</option>
                          {invTrackOptions.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.title}{t.artist ? ` — ${t.artist}` : ""}</option>
                          ))}
                        </select>
                      </InvField>
                    ) : invitationData.track ? (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">music_note</span>
                        <div>
                          <p className="font-body-md text-sm font-semibold">{invitationData.track.title}</p>
                          {invitationData.track.artist && <p className="font-body-md text-[10px] text-on-surface-variant">{invitationData.track.artist}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="font-body-md text-xs italic text-on-surface-variant/70">Belum dipilih.</p>
                    )}
                  </InvSection>

                  {invitationData.profile?.invitation_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="bg-surface-container-low p-4 text-center">
                        <p className="font-label-md text-[8px] uppercase tracking-widest text-on-surface-variant mb-1">Link Undangan</p>
                        <a href={invitationData.profile.invitation_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-primary underline break-all">
                          {invitationData.profile.invitation_url}
                        </a>
                      </div>
                    </>
                  )}

                  {invitationData.profile?.active_wp_post_url && (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div className="bg-surface-container-low p-4 text-center">
                        <p className="font-label-md text-[8px] uppercase tracking-widest text-on-surface-variant mb-1">Link Post WordPress</p>
                        <a href={invitationData.profile.active_wp_post_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-primary underline break-all">
                          {invitationData.profile.active_wp_post_url}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVipModal && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVipModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant/50 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display-lg text-lg font-medium text-primary">Daftar Tamu VIP</h3>
                <p className="text-[11px] text-on-surface-variant">{(detail?.vip_guests || []).length} tamu VIP &bull; Kuota {detail?.wa_blast_quota || 0}</p>
              </div>
              <button onClick={() => setShowVipModal(false)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex gap-3">
              <input
                type="text"
                value={vipSearch}
                onChange={(e) => setVipSearch(e.target.value)}
                placeholder="Cari nama / no. HP / meja..."
                className="flex-1 bg-surface rounded-lg border border-outline-variant/50 px-4 py-2.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
              />
              <button onClick={downloadVipExcel} className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                Download Excel
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-outline-variant/15">
              {(detail?.vip_guests || [])
                .filter((g) => !vipSearch || g.name.toLowerCase().includes(vipSearch.toLowerCase()) || (g.phone_number || "").includes(vipSearch) || (g.table_number || "").toLowerCase().includes(vipSearch.toLowerCase()))
                .map((g, i) => {
                  const isExcluded = (detail?.wa_blast_quota || 0) > 0 && i >= (detail?.wa_blast_quota || 0)
                  return (
                    <div key={g.id} className={`px-6 py-3 flex items-center gap-3 ${isExcluded ? "bg-red-50/60" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                          {g.name}
                          <span className="material-symbols-outlined text-[#b8860b] text-[14px]">star</span>
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70">
                          {g.phone_number || "—"}
                          {g.category ? ` • ${g.category}` : ""}
                          {g.table_number ? ` • ${g.table_number}` : ""}
                        </p>
                      </div>
                      {isExcluded ? (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">Dikecualikan</span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Termasuk</span>
                      )}
                    </div>
                  )
                })}
              {(detail?.vip_guests || []).length === 0 && (
                <p className="py-12 text-center text-sm text-on-surface-variant italic">Belum ada tamu VIP.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowQrModal(false)}>
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl border border-outline-variant/50 shadow-2xl flex flex-col overflow-hidden max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display-lg text-lg font-medium text-primary">Daftar Tamu &amp; Link QR</h3>
                <p className="text-[11px] text-on-surface-variant">{qrGuests.length} tamu</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="px-6 py-4 border-b border-outline-variant/20 flex gap-3">
              <input
                type="text"
                value={qrSearch}
                onChange={(e) => setQrSearch(e.target.value)}
                placeholder="Cari nama / meja..."
                className="flex-1 bg-surface rounded-lg border border-outline-variant/50 px-4 py-2.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
              />
              <button onClick={downloadQrExcel} className="px-4 py-2 border border-primary text-primary font-label-md text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors shrink-0">
                Download Excel
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-outline-variant/15">
              {qrLoading ? (
                <p className="py-12 text-center text-sm text-on-surface-variant italic">Memuat...</p>
              ) : (
                qrGuests
                  .filter((g) => !qrSearch || g.name?.toLowerCase().includes(qrSearch.toLowerCase()) || (g.table_number || "").toLowerCase().includes(qrSearch.toLowerCase()))
                  .map((g) => (
                    <div key={g.id} className="px-6 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{g.name}</p>
                          <p className="text-[11px] text-on-surface-variant/70">
                            {g.phone_number || "—"}
                            {g.category ? ` • ${g.category}` : ""}
                            {g.table_number ? ` • ${g.table_number}` : ""}
                          </p>
                        </div>
                        {qrActive && (
                          <span className={`shrink-0 text-[10px] font-label-md uppercase tracking-wider px-2 py-0.5 rounded-full ${g.qr_token ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-outline-variant/30 text-on-surface-variant border border-outline-variant"}`}>
                            {g.qr_token ? "QR Aktif" : "Belum QR"}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                        {qrActive && (
                          <a href={guestQrUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-secondary underline break-all">{guestQrUrl(g) || "—"}</a>
                        )}
                        <a href={guestInvUrl(g)} target="_blank" rel="noopener noreferrer" className="truncate text-primary underline break-all">{guestInvUrl(g) || "—"}</a>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {showRoleGate && (
        <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowRoleGate(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">block</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Akses Terbatas</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{roleGateMessage}</p>
            <button onClick={() => setShowRoleGate(false)} className="w-full py-3 bg-primary text-white rounded-lg font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">Mengerti</button>
          </div>
        </div>
      )}
    </>
  )
}
