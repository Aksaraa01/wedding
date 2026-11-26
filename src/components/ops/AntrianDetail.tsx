"use client"

import { profileView } from "@/lib/profileView"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"
import { renderReminderMessage, getCoupleDisplayName } from "@/lib/reminderTemplates"
import { resolveCoupleName } from "@/lib/coupleName"
import { MAX_CHILDREN, parseChildren, readChildren, resolveChildren, type InvitationChild } from "@/lib/children"
import { coupleUrl } from "@/lib/coupleUrl"
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
import { PACKAGE_FEATURES, calcTotalBook, matchGaleriTier, lowestEligiblePackage, packageDisplayName, type GaleriTierRow, type PriceBook } from "@/lib/packages"
import UpgradePackageModal from "@/components/UpgradePackageModal"
import AutoTextarea from "@/components/AutoTextarea"
import { useVisiblePoll } from "@/lib/useVisiblePoll"
import {
  OPS_COLUMNS,
  OPS_STATUS_LABELS,
  allowedNextStatuses,
  resolveDerivedStatus,
} from "@/lib/opsStatus"
import { canChangeStatus, unauthorizedStatusMessage } from "@/lib/opsRoles"
import { compressImage } from "@/lib/imageCompress"
import { copyPlainText } from "@/lib/clipboard"
import { pollWpJob, fetchWpJob } from "@/lib/wpJobPoll"
import { OPENING_PRESETS, OPENING_CUSTOM, matchOpeningPreset } from "@/lib/openingPresets"
import { normalizeVideoUrl } from "@/components/templates/shared/lib"
import { getTemplateContentSpec } from "@/components/templates"
import { visibleCoverSlotIndexes, type CoverSlotGateData } from "@/lib/coverSlots"
import { hidesOpeningSection } from "@/lib/templateSections"
import { getTemplateExtraFields, groupExtraFields, templateExtrasLabel } from "@/lib/templateExtras"
import BankSelect from "@/components/dashboard/BankSelect"
import { getBankBySlug, getBankByName, bankLogoUrl } from "@/lib/bankList"
import { LANGUAGE_OPTIONS, normalizeLanguage } from "@/lib/i18n"

type QueueItem = {
  id: string
  status: string
  sla_started_at: string
  sla_ended_at?: string | null
  assigned_to: string | null
  assigned_name: string | null
  created_at: string
  wedding_profile: {
    id: string
    bride_name: string
    groom_name: string
    bride_full_name?: string | null
    groom_full_name?: string | null
    display_name?: string | null
    slug: string
    scanner_pin?: string | null
    whatsapp_number: string
    estimated_wedding_date: string
    sessions: any
    estimated_guest_count: number
    package_type: string
    total_project_cost: number
    voucher_code?: string | null
    voucher_discount?: number | null
    payment_status: string
    express_service?: boolean | null
    wa_blast_tier?: number | null
    galeri_addon?: boolean | null
    galeri_photos_per_guest?: number | null
    galeri_guest_count?: number | null
    galeri_tier?: string | null
    galeri_price?: number | null
    message_category?: string | null
    event_type?: string | null
    subject_gender?: string | null
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
  kind: "status" | "package" | "invitation" | "payment" | "voucher" | "publish" | "addon"
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
  feature_set?: string[]
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

function SlaTimer({ startedAt, endedAt }: { startedAt: string; endedAt?: string | null }) {
  const [elapsed, setElapsed] = useState("")
  useEffect(() => {
    const fmt = (diff: number) => {
      if (diff < 0) return "00:00:00"
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }
    // Frozen: terminal stage reached — show the final duration, no ticking.
    if (endedAt) {
      setElapsed(fmt(new Date(endedAt).getTime() - new Date(startedAt).getTime()))
      return
    }
    const tick = () => {
      setElapsed(fmt(Date.now() - new Date(startedAt).getTime()))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt, endedAt])
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

// Indonesian, actionable sync errors for the ops console (mirrors the couple
// editor). Every message ends with a retry call-to-action.
function invSyncErrorID(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "")
  const lower = raw.toLowerCase()
  if (!raw) return "Sinkronisasi ke WordPress gagal. Silakan tekan Coba Lagi."
  if (lower.includes("abort")) return "Sinkronisasi dibatalkan. Silakan tekan Coba Lagi."
  if (lower.includes("masih berjalan") || lower.includes("timeout") || lower.includes("timed out")) {
    return "Sinkronisasi masih berjalan dan melewati batas waktu. Perubahan sudah tersimpan — tekan Coba Lagi untuk melanjutkan sinkronisasi."
  }
  if (lower.includes("fetch failed") || lower.includes("failed to fetch") || lower.includes("network") || lower.includes("load failed")) {
    return "Koneksi ke server gagal. Periksa koneksi internet, lalu tekan Coba Lagi."
  }
  if (lower.includes("belum ada postingan wordpress")) {
    return "Belum ada undangan WordPress yang aktif. Perubahan sudah tersimpan — tekan Coba Lagi setelah template dipilih."
  }
  if (lower.includes("profil tidak ditemukan") || lower.includes("job tidak ditemukan")) {
    return "Data undangan tidak ditemukan. Muat ulang halaman, lalu tekan Coba Lagi."
  }
  if (lower.includes("http")) {
    return `WordPress mengembalikan kesalahan (${raw}). Perubahan sudah tersimpan — tekan Coba Lagi.`
  }
  return raw.endsWith("Lagi.") ? raw : `${raw} Silakan tekan Coba Lagi.`
}

type InvSectionState = "ok" | "locked" | "hidden" | "empty"

const invHasArr = (v: any) => Array.isArray(v) && v.filter(Boolean).length > 0
const invHasStr = (v: any) => typeof v === "string" && v.trim() !== ""

function invSectionState(p: any, key: string, gift?: { accounts: any[]; address: string }, noPhoto?: boolean): InvSectionState {
  const gates = p?.package_gates || {}
  switch (key) {
    case "tema":
      return p?.selected_template_id ? "ok" : "empty"
    case "sampul":
      // Not required: an empty cover renders the default couple photo, so it
      // is never flagged incomplete (mirrors invitationCompleteness).
      return "ok"
    case "pembuka":
      return !invHasStr(p?.opening_title) && !invHasStr(p?.opening_description) ? "empty" : "ok"
    case "profil":
      return !invHasStr(p?.groom_full_name) || !invHasStr(p?.bride_full_name) ? "empty" : "ok"
    case "acara": {
      const ss = Array.isArray(p?.sessions) ? p.sessions : []
      if (ss.length === 0) return "empty"
      const bad = ss.some((s: any) => !invHasStr(s?.name) || !invHasStr(s?.date) || !invHasStr(s?.venue) || !invHasStr(s?.address) || !invHasStr(s?.maps_url))
      return bad ? "empty" : "ok"
    }
    case "galeri":
      // Tanpa-photo templates hide the whole gallery section: never incomplete.
      if (noPhoto) return "ok"
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
      // Tanpa-photo templates hide the video section entirely (mirrors editor).
      if (noPhoto) return "ok"
      return !invHasStr(p?.video_url) ? "empty" : "ok"
    case "story":
      if (gates.story?.included === false) return "locked"
      if (p?.story_visible === false) return "hidden"
      return !invHasArr(p?.stories) ? "empty" : "ok"
    case "gift":
      if (p?.gift_section_visible === false) return "hidden"
      return (gift && (invHasArr(gift.accounts) || invHasStr(gift.address))) ? "ok" : "empty"
    case "dresscode":
      if (gates.dresscode?.included === false) return "locked"
      if (p?.dresscode_visible === false) return "hidden"
      return !invHasArr(p?.dresscode?.colors) ? "empty" : "ok"
    case "livestream":
      if (gates.livestream?.included === false) return "locked"
      if (p?.livestream_visible === false) return "hidden"
      return !invHasStr(p?.livestream?.url) ? "empty" : "ok"
    case "rundown":
      if (p?.rundown_visible === false) return "hidden"
      return "ok"
    case "contacts":
      if (p?.contacts_visible === false) return "hidden"
      return "ok"
    case "musik":
      return p?.selected_track_id ? "ok" : "empty"
    default:
      return "ok"
  }
}

function invAvailableIn(p: any, gateKey: string): string[] {
  return p?.package_gates?.[gateKey]?.availableIn || []
}

function InvLockedNotice({ availableIn }: { availableIn: string[] }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
      <span className="material-symbols-outlined text-[20px] text-secondary">lock</span>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">Fitur Terkunci</p>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">{invUpgradeMessage(availableIn)}</p>
      </div>
    </div>
  )
}

function InvSectionToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant">{label}</span>
      <label className="inline-flex items-center cursor-pointer shrink-0 gap-2">
        <span className="font-label-md text-[10px] text-on-surface-variant">{checked ? "Tampil" : "Sembunyi"}</span>
        <input type="checkbox" checked={checked} className="sr-only peer" onChange={onChange} />
        <div className="relative w-10 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary" />
      </label>
    </div>
  )
}

function InvAccordion({ secKey, icon, label, lockedInfo, hidden, incomplete, defaultOpen, omit, children }: {
  secKey: string
  icon: string
  label: string
  lockedInfo: string[] | null
  hidden: boolean
  incomplete: boolean
  defaultOpen?: boolean
  /** Package excludes this section entirely (e.g. Ceriavite has no story/video). */
  omit?: boolean
  children: ReactNode
}) {
  const isLocked = lockedInfo !== null
  if (omit) return null
  return (
    <details
      data-section={secKey}
      data-inv-section={secKey}
      open={defaultOpen || undefined}
      className="group scroll-mt-6 border rounded-xl overflow-visible bg-white border-[#B34E3F] open:bg-[#B34E3F] open:border-[#B34E3F]"
    >
      <summary
        onClick={(e) => {
          // Single-open at DOM level (no React state): after the native
          // toggle, close every other section. Immune to render timing.
          const el = e.currentTarget.closest("details")
          requestAnimationFrame(() => {
            try {
              document.querySelectorAll("[data-inv-section]").forEach((other) => {
                if (other !== el) other.removeAttribute("open")
              })
              // Collapsing the previously open section above shrinks the page,
              // so keep the section just opened anchored to the top instead of
              // letting the viewport land on empty background below it.
              if (el && el.open) el.scrollIntoView({ behavior: "smooth", block: "start" })
            } catch {}
          })
        }}
        className="w-full flex justify-between items-center py-4 px-4 transition-colors text-[#2C2A29] hover:text-[#B34E3F] group-open:text-white group-open:hover:text-white/90 rounded-xl group-open:rounded-b-none group-open:rounded-t-xl cursor-pointer list-none [&::-webkit-details-marker]:hidden"
      >
        <span className="font-label-md text-label-md flex items-center gap-3 min-h-[24px]">
          <span className="material-symbols-outlined text-[18px] leading-none">{icon}</span>
          {label}
          {isLocked && (
            <span className="group/inner relative inline-flex ml-1">
              <span className="material-symbols-outlined text-[18px] text-[#6B7280] group-open:text-white">lock</span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/inner:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">{invUpgradeMessage(lockedInfo!)}</span>
            </span>
          )}
          {hidden && !isLocked && (
            <span className="group/inner relative inline-flex">
              <span className="material-symbols-outlined text-[18px] text-[#6B7280] group-open:text-white/90">visibility_off</span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/inner:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[200px] whitespace-normal text-center leading-tight z-50 shadow-lg">Konten<br />disembunyikan - tidak<br />tampil di undangan</span>
            </span>
          )}
          {!hidden && !isLocked && incomplete && (
            <span className="group/inner relative inline-flex ml-1 items-center" tabIndex={0}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D97706] text-white text-[11px] font-bold leading-none">!</span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/inner:block bg-white text-[#2C2A29] border border-[#B34E3F] text-[11px] px-3 py-2 rounded-lg max-w-[180px] whitespace-normal text-center leading-tight z-50 shadow-lg pointer-events-none">Konten belum<br />lengkap — silakan<br />lengkapi bagian {label}</span>
            </span>
          )}
        </span>
        <span className="material-symbols-outlined leading-none text-[#2C2A29] group-open:text-white group-open:hidden">expand_more</span>
        <span className="material-symbols-outlined leading-none text-white hidden group-open:block">expand_less</span>
      </summary>
      <div className="px-4 pb-6 bg-white rounded-b-xl overflow-hidden border-t border-[#E2D9CF]">{children}</div>
    </details>
  )
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
  return <AutoTextarea className={`${invInputCls} resize-none overflow-hidden`} value={value} onChange={onChange} placeholder={placeholder} minRows={rows || 3} />
}

// Free-text field (names, addresses): long values wrap onto the next row.
function InvFreeText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <AutoTextarea className={`${invInputCls} resize-none overflow-hidden`} value={value} onChange={onChange} placeholder={placeholder} />
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

function InvGiftAccounts({ items, onChange }: { items: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, patch: any) => onChange(items.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  const slugOf = (a: any) => getBankBySlug(a.provider_name || "")?.slug || getBankByName(a.provider_name || "")?.slug || ""
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <div key={a.id || `new-${i}`} className="border border-outline-variant rounded-xl p-3 space-y-3 bg-surface-container-lowest">
          <div className="flex items-center justify-between">
            <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary">Rekening {i + 1}</p>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-[11px] font-label-md uppercase tracking-widest text-red-600 hover:underline">Hapus</button>
          </div>
          <div>
            <label className="block font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Bank / E-Wallet</label>
            <BankSelect
              value={slugOf(a)}
              name={a.provider_name || ""}
              onChange={(slug, displayName) => {
                const bank = getBankBySlug(slug)
                set(i, {
                  provider_name: displayName,
                  type: bank?.type || a.type || "bank",
                  provider_logo_url: bank ? bankLogoUrl(bank.slug) : a.provider_logo_url || "",
                })
              }}
            />
          </div>
          <InvField label="Nomor Rekening"><InvText value={a.account_number || ""} onChange={(v) => set(i, { account_number: v })} placeholder="1234567890" /></InvField>
          <InvField label="Atas Nama"><InvFreeText value={a.account_name || ""} onChange={(v) => set(i, { account_name: v })} placeholder="Nama pemilik" /></InvField>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { provider_name: "", account_number: "", account_name: "", type: "bank", provider_logo_url: "" }])} className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors">
        + Tambah Rekening
      </button>
    </div>
  )
}

function InvPhotoBox({ url, uploading, onFile, badge }: {
  url: string
  uploading: boolean
  onFile: (file: File) => Promise<void>
  badge?: string
}) {
  return (
    <div className="relative w-20 h-20 bg-surface-dim border border-outline-variant shrink-0 overflow-hidden">
      {uploading ? (
        <span className="material-symbols-outlined text-[20px] animate-spin absolute inset-0 m-auto w-fit h-fit">progress_activity</span>
      ) : url ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
          {badge && <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{badge}</span>}
          <label className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer" title="Ganti foto">
            <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await onFile(f) }} />
          </label>
        </>
      ) : (
        <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await onFile(f) }} />
        </label>
      )}
    </div>
  )
}

export default function AntrianDetail({ id }: { id: string }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [detail, setDetail] = useState<QueueDetail | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [feedbackSubmissions, setFeedbackSubmissions] = useState<FeedbackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [pinCopied, setPinCopied] = useState(false)
  const [waBlastSchedule, setWaBlastSchedule] = useState<any>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState("")
  const [showRoleGate, setShowRoleGate] = useState(false)
  const [roleGateMessage, setRoleGateMessage] = useState("")
  const [showInvCard, setShowInvCard] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [invEditing, setInvEditing] = useState(false)
  const [openInvExtraGroup, setOpenInvExtraGroup] = useState<string | null>(null)
  const [invForm, setInvForm] = useState<any>(null)
  const [invSaveError, setInvSaveError] = useState("")
  const [invConfirmOpen, setInvConfirmOpen] = useState(false)
  const [invPendingChanges, setInvPendingChanges] = useState<string[]>([])
  const [invSyncing, setInvSyncing] = useState(false)
  const [invSyncMsg, setInvSyncMsg] = useState("")
  const [invSyncError, setInvSyncError] = useState<string | null>(null)
  const [invTplOpen, setInvTplOpen] = useState(false)
  // One view for every family-dependent decision on this screen.
  const opsView = profileView(invitationData?.profile || detail?.wedding_profile)
  const [invTplList, setInvTplList] = useState<any[]>([])
  const [invTplLoading, setInvTplLoading] = useState(false)
  const [invTplWorking, setInvTplWorking] = useState<string | null>(null)
  const [invTplBlocked, setInvTplBlocked] = useState<any | null>(null)
  const [invTrackOptions, setInvTrackOptions] = useState<any[]>([])
  const [invMusicUploading, setInvMusicUploading] = useState(false)
  const [invMusicUploadError, setInvMusicUploadError] = useState("")
  const [invMusicConfirmOpen, setInvMusicConfirmOpen] = useState(false)
  const [invPendingMusicFile, setInvPendingMusicFile] = useState<File | null>(null)
  const invMusicFileRef = useRef<HTMLInputElement>(null)
  const [invUploading, setInvUploading] = useState<string | null>(null)
  const [invGiftAddrId, setInvGiftAddrId] = useState<string | null>(null)
  const [invTrackSearch, setInvTrackSearch] = useState("")
  const [showFbPayGate, setShowFbPayGate] = useState(false)
  const [invOpeningCustomMode, setInvOpeningCustomMode] = useState(false)
  const [invCardSummary, setInvCardSummary] = useState<{ empty: string[]; wpId: string } | null>(null)
  const [invLoading, setInvLoading] = useState(false)
  const [invColorEdit, setInvColorEdit] = useState<{ index: number; hex: string } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [showVipModal, setShowVipModal] = useState(false)
  const [vipSearch, setVipSearch] = useState("")
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrSearch, setQrSearch] = useState("")
  const [qrGuests, setQrGuests] = useState<any[]>([])
  const [qrLoading, setQrLoading] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)
  const [voucherInput, setVoucherInput] = useState("")
  const [voucherApplying, setVoucherApplying] = useState(false)
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [voucherSwapOpen, setVoucherSwapOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishConfirmError, setPublishConfirmError] = useState<string | null>(null)
  const [publishBlockers, setPublishBlockers] = useState<{ key: string; label: string }[]>([])
  // Add-on editor (main package stays in the header dropdown; this panel
  // manages WA tier + Express + Galeri config with a live DB-priced estimate).
  const [addonOpen, setAddonOpen] = useState(false)
  // Reviewing a couple-staged delta top-up: when true the panel prefills the
  // galeri sliders from the staged request instead of the stored add-on.
  const [reviewTopup, setReviewTopup] = useState(false)
  // The staged-delta banner is informational only (no pay step): clicking
  // "Tinjau" dismisses it and opens the pre-filled add-on panel. Re-arms when
  // the staged amount changes.
  const [deltaDismissed, setDeltaDismissed] = useState(false)
  const [editWaTier, setEditWaTier] = useState(0)
  const [editExpress, setEditExpress] = useState(false)
  const [editGaleriOn, setEditGaleriOn] = useState(false)
  const [editGaleriPhotos, setEditGaleriPhotos] = useState(5)
  const [editGaleriGuests, setEditGaleriGuests] = useState(100)
  const [priceBook, setPriceBook] = useState<PriceBook | null>(null)
  const [tierRows, setTierRows] = useState<GaleriTierRow[] | null>(null)
  const [savingAddons, setSavingAddons] = useState(false)
  const [addonMsg, setAddonMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const confirmPublish = async (force = false) => {
    setPublishBusy(true)
    setPublishConfirmError(null)
    try {
      const res = await fetch(`/api/ops/queue/${id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
        body: JSON.stringify({ force }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 422 && Array.isArray((data as any)?.incomplete)) {
          setPublishBlockers((data as any).incomplete)
          return
        }
        throw new Error((data as any)?.error || "Gagal mengkonfirmasi undangan")
      }
      setPublishConfirmOpen(false)
      setPublishBlockers([])
      await fetchAll()
    } catch (err: any) {
      setPublishConfirmError(err?.message || "Gagal mengkonfirmasi undangan")
    } finally {
      setPublishBusy(false)
    }
  }

  const applyVoucherOps = async () => {
    const code = voucherInput.trim().toUpperCase()
    if (!code || voucherApplying) return
    setVoucherApplying(true)
    setVoucherMsg(null)
    try {
      const res = await fetch(`/api/ops/queue/${id}/voucher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
        body: JSON.stringify({ voucher_code: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menerapkan voucher")
      setVoucherInput("")
      setVoucherMsg({ ok: true, text: `Voucher ${data.voucher_code} diterapkan • potongan ${formatCurrency(data.voucher_discount)}` })
      await fetchAll()
    } catch (err: any) {
      setVoucherMsg({ ok: false, text: err?.message || "Gagal menerapkan voucher" })
    } finally {
      setVoucherApplying(false)
    }
  }

  const handleToggleVisibility = async (key: string, newValue: boolean) => {
    if (!detail?.wedding_profile?.id) return
    try {
      const res = await fetch(`/api/dashboard/${detail.wedding_profile.id}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      })
      if (!res.ok) throw new Error("Gagal mengubah visibilitas")
      setInvForm((prev: any) => ({ ...prev, [key]: newValue }))
      await fetchAll()
    } catch (e) {
      console.error("Failed to toggle visibility", e)
    }
  }

  const handleDresscodeColorNameChange = (index: number, name: string) => {
    setInvForm((prev: any) => {
      const colors = [...(prev.dresscode?.colors || [])]
      colors[index] = { ...colors[index], name }
      return { ...prev, dresscode: { ...(prev.dresscode || {}), colors } }
    })
  }

  const handleDresscodeColorDelete = (index: number) => {
    setInvForm((prev: any) => {
      const colors = (prev.dresscode?.colors || []).filter((_: unknown, idx: number) => idx !== index)
      return { ...prev, dresscode: { ...(prev.dresscode || {}), colors } }
    })
  }

  const handleDresscodeColorAdd = () => {
    setInvForm((prev: any) => ({
      ...prev,
      dresscode: { ...(prev.dresscode || {}), colors: [...(prev.dresscode?.colors || []), { hex: "#CCCCCC", name: "" }] }
    }))
  }

  const handleTemplateContentChange = (key: string, value: string) => {
    setInvForm((prev: any) => ({
      ...prev,
      template_content: { ...(prev?.template_content || {}), [key]: value },
    }))
  }

  const handleLivestreamUrlChange = (url: string) => {
    setInvForm((prev: any) => ({
      ...prev,
      livestream: { ...(prev.livestream || {}), url }
    }))
  }

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
    // Employee session loads async — never treat its absence as "not
    // found". Stay in loading state until credentials exist.
    if (!employee?.phone_number) return
    try {
      const res = await fetch(`/api/ops/queue/${id}`, {
        headers: {
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
      })
      if (!res.ok) {
        setLoadError(true)
        return
      }
      const data = await res.json()
      setLoadError(false)
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
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [id, employee?.phone_number, employee?.role])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Live polling, paused while the tab is hidden (a background detail tab
  // with its multi-query fetchAll must not generate traffic or log volume).
  // Refetch-on-focus behavior is preserved via useVisiblePoll's refetch.
  useVisiblePoll(fetchAll, POLL_MS)
  useEffect(() => {
    const onFocus = () => {
      if (!document.hidden) fetchAll()
    }
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
    }
  }, [fetchAll])

  const currentWp = detail?.wedding_profile

  // QR Guest Book (Buku Tamu Digital) module: only active on DGB tiers.
  const qrActive = detail?.feature_set
    ? detail.feature_set.includes("qr_code_book")
    : currentWp?.package_type
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
    setPendingPkg(packageType)
    // Selecting Galeri Tamu carries the slider config (stored add-on values
    // or Tier-A defaults) so the estimate is real immediately — the panel's
    // mandatory slider then refines it. Band follows the photo count.
    const body: Record<string, unknown> = { package_type: packageType }
    if (packageType === "gt" && currentWp) {
      const photos = currentWp.galeri_addon && currentWp.galeri_photos_per_guest ? currentWp.galeri_photos_per_guest : 5
      const guests = currentWp.galeri_addon && currentWp.galeri_guest_count ? currentWp.galeri_guest_count : 100
      body.package_type = "gt"
      body.galeri = { photos_per_guest: photos, guest_count: guests }
    }
    const res = await fetch(`/api/ops/queue/${id}/package`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ops-phone": employee?.phone_number || "",
        "x-ops-role": employee?.role || "",
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      fetchAll()
    } else {
      alert(data.error || "Gagal mengubah paket")
    }
    setPendingPkg(null)
  }

  // Add-on editor: sync from the loaded profile whenever the panel opens,
  // and lazy-load the DB price books once.
  useEffect(() => {
    if (!priceBook) {
      fetch("/api/packages/prices")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.base) setPriceBook(d as PriceBook) })
        .catch(() => {})
    }
    if (!tierRows) {
      fetch("/api/galeri-tiers")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const t = d?.tiers
          if (t && typeof t === "object") {
            const rows: GaleriTierRow[] = Object.entries(t).map(([tier, v]) => {
              const r = v as { price?: unknown; photoMin?: unknown; photoMax?: unknown; guestMin?: unknown; guestMax?: unknown }
              return {
                tier,
                photoMin: Math.floor(Number(r.photoMin)),
                photoMax: Math.floor(Number(r.photoMax)),
                guestMin: Math.floor(Number(r.guestMin)),
                guestMax: Math.floor(Number(r.guestMax)),
                price: Math.floor(Number(r.price) || 0),
              }
            })
            if (rows.length > 0) setTierRows(rows)
          }
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!addonOpen || !currentWp) return
    setEditWaTier(currentWp.wa_blast_tier || 0)
    setEditExpress(!!currentWp.express_service)
    const stagedPhotos = (currentWp as any).galeri_topup_photos_per_guest as number | null
    if (reviewTopup && stagedPhotos) {
      // Show exactly what the couple requested (the staged top-up), so the
      // operator reviews the real delta before marking it lunas.
      setEditGaleriOn(true)
      setEditGaleriPhotos(stagedPhotos)
      setEditGaleriGuests((currentWp as any).galeri_topup_guest_count || 100)
    } else {
      // Legacy GT mains have no add-on toggle: the slider IS the product, so
      // the editor is always on for them (photo/guest input mandatory).
      setEditGaleriOn(!!currentWp.galeri_addon || getPackageCategory(currentWp.package_type) === "Galeri Tamu")
      setEditGaleriPhotos(currentWp.galeri_photos_per_guest || 5)
      setEditGaleriGuests(currentWp.galeri_guest_count || 100)
    }
    setAddonMsg(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonOpen, reviewTopup])

  // Re-arm the dismissed banner whenever the staged delta amount changes.
  const stagedDeltaCost = Number((currentWp as any)?.additional_cost || 0)
  useEffect(() => {
    setDeltaDismissed(false)
  }, [stagedDeltaCost])

  // Tier resolves by matching the sliders against the DB bounds (names,
  // bounds, prices all live in galeri_tiers). Slider input limits derive
  // from the same matrix union — no hardcoded bands anywhere.
  const galeriBounds = useMemo(() => {
    if (!tierRows || tierRows.length === 0) return null
    return {
      photoMin: Math.max(1, Math.min(...tierRows.map((r) => r.photoMin))),
      photoMax: Math.max(1, Math.max(...tierRows.map((r) => r.photoMax))),
      guestMin: Math.max(1, Math.min(...tierRows.map((r) => r.guestMin))),
      guestMax: Math.max(1, Math.max(...tierRows.map((r) => r.guestMax))),
    }
  }, [tierRows])
  const gPhotoMin = galeriBounds?.photoMin ?? 1
  const gPhotoMax = galeriBounds?.photoMax ?? 10
  const gGuestMin = galeriBounds?.guestMin ?? 10
  const gGuestMax = galeriBounds?.guestMax ?? 200
  const addonPhotos = Math.min(gPhotoMax, Math.max(gPhotoMin, Math.floor(editGaleriPhotos) || gPhotoMin))
  const addonGuests = Math.min(gGuestMax, Math.max(gGuestMin, Math.floor(editGaleriGuests) || gGuestMin))
  const addonMatch = tierRows ? matchGaleriTier(tierRows, addonPhotos, addonGuests) : null
  const addonTierPrice = editGaleriOn && addonMatch ? addonMatch.price : 0
  // Estimates must never render from a half-loaded price book: with the
  // galeri toggle on but tiers unmatched (loading or uncovered combo),
  // show skeletons.
  const galeriPricesReady = !editGaleriOn || !!addonMatch
  const addonEstimate =
    priceBook && currentWp && galeriPricesReady
      ? calcTotalBook(priceBook, currentWp.package_type, editWaTier, editExpress, addonTierPrice)
      : null

  // Add-on availability follows the MAIN package (reduces human error):
  // - Galeri Tamu (standalone): photo/guest sliders here (mandatory — the
  //   slider tier IS its price). No WA / Express on GT.
  // - Buku Tamu Digital bundles gallery: no GT slider, WA + Express only
  //   (WA only where the base package includes it).
  // - Undangan Digital: WA (where included) + Express + Galeri slider.
  const mainPkgCat = currentWp ? getPackageCategory(currentWp.package_type) : ""
  const isGtMain = mainPkgCat === "Galeri Tamu"
  const waAllowed = !!currentWp && !!PACKAGE_FEATURES[currentWp.package_type]?.includes("wa_blast")
  const expressAllowed = !isGtMain
  const galeriAllowed = !!currentWp

  // Header estimate goes live: panel draft (marked unstored) wins, then an
  // in-flight package change, else the stored total.
  const storedSnap = currentWp
    ? {
        wa: currentWp.wa_blast_tier || 0,
        ex: !!currentWp.express_service,
        gOn: !!currentWp.galeri_addon,
        gP: currentWp.galeri_photos_per_guest || 0,
        gG: currentWp.galeri_guest_count || 0,
      }
    : null
  const panelDraftActive =
    addonOpen &&
    !!storedSnap &&
    (editWaTier !== storedSnap.wa ||
      editExpress !== storedSnap.ex ||
      editGaleriOn !== storedSnap.gOn ||
      (editGaleriOn && (editGaleriPhotos !== storedSnap.gP || editGaleriGuests !== storedSnap.gG)))
  const [pendingPkg, setPendingPkg] = useState<string | null>(null)
  const liveEstimate =
    priceBook && currentWp && (panelDraftActive || (pendingPkg && pendingPkg !== currentWp.package_type)) && (!panelDraftActive || galeriPricesReady)
      ? calcTotalBook(
          priceBook,
          pendingPkg && pendingPkg !== currentWp.package_type ? pendingPkg : currentWp.package_type,
          panelDraftActive ? editWaTier : (storedSnap?.wa || 0),
          panelDraftActive ? editExpress : !!storedSnap?.ex,
          panelDraftActive ? addonTierPrice : (currentWp.galeri_price || 0)
        )
      : null

  // Manual toggle always edits the stored add-ons; "Tinjau" opts into the
  // staged top-up prefill instead.
  const toggleAddonPanel = () => {
    setReviewTopup(false)
    setAddonOpen((v) => !v)
  }
  const reviewStagedTopup = () => {
    setReviewTopup(true)
    setAddonOpen(true)
    setDeltaDismissed(true)
  }

  const saveAddons = async () => {
    if (employee?.role === "creative") {
      setRoleGateMessage("Perubahan add-on hanya dapat dilakukan oleh Admin atau Sales. Peran Anda saat ini: Creative.")
      setShowRoleGate(true)
      return
    }
    if (!currentWp) return
    // Never save a galeri draft without a resolved DB tier — the server
    // would reject it, but the operator acts on the estimate.
    if (galeriAllowed && editGaleriOn && !addonMatch) {
      setAddonMsg({ ok: false, text: !tierRows ? "Harga galeri belum termuat — tunggu sebentar lalu coba lagi." : `Kombinasi ${addonPhotos} foto × ${addonGuests} tamu belum tersedia di matriks.` })
      return
    }
    const photos = addonPhotos
    const guests = addonGuests
    setSavingAddons(true)
    setAddonMsg(null)
    try {
      const res = await fetch(`/api/ops/queue/${id}/package`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
        body: JSON.stringify({
          // Single gt code — no band derivation (slider tiers price it).
          package_type: currentWp.package_type,
          // Only applicable add-ons are sent; omitted keys ride along
          // untouched server-side (never wipes stored values).
          ...(waAllowed ? { wa_blast_tier: editWaTier } : {}),
          ...(expressAllowed ? { express_service: editExpress } : {}),
          ...(galeriAllowed ? { galeri: editGaleriOn ? { photos_per_guest: photos, guest_count: guests } : null } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan add-on")
      setAddonMsg({ ok: true, text: `Tersimpan. Estimasi ${formatCurrency(data.total_project_cost)}` })
      await fetchAll()
    } catch (e: any) {
      setAddonMsg({ ok: false, text: e?.message || "Gagal menyimpan add-on" })
    } finally {
      setSavingAddons(false)
    }
  }

  // Ops "Tambah Feedback": paid couples go straight to the couple feedback
  // page (new tab); UNPAID gets an explanatory popup instead — feedback is
  // a paid-status feature. Ops attribution is handled server-side via the
  // ops employee session headers (see POST /api/feedback-submissions).
  const handleAddFeedback = (wpId: string) => {
    if (!wpId) return
    if (detail?.wedding_profile?.payment_status === "UNPAID") {
      setShowFbPayGate(true)
      return
    }
    window.open(`/dashboard/${wpId}/web-invitation/feedback`, "_blank")
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
      setInvOpeningCustomMode(false)
    } catch (e) {
      console.error("Failed to fetch invitation", e)
    } finally {
      setInvLoading(false)
    }
  }

  // Lightweight completeness summary for the premium_web feature card
  // (warning banner). Same section rules as the editor/modal.
  const fetchInvCardSummary = async (wpId: string) => {
    try {
      const res = await fetch(`/api/dashboard/${wpId}/web-invitation`)
      if (!res.ok) return
      const data = await res.json()
      const p = data.profile
      // Keys mirror the server confirm gate (getIncompleteInvitationSections):
      // no "musik" (never blocking), with "tema" first.
      const defs: [string, string][] = [
        ["tema", "TEMA"],
        ["sampul", "SAMPUL"],
        ["pembuka", "KALIMAT PEMBUKA"],
        ["profil", profileView(p).kids ? "PROFILE ANANDA" : "PROFILE MEMPELAI"],
        ["acara", "ACARA"],
        ["galeri", "GALERI"],
        ["inviting", "TURUT MENGUNDANG"],
        ["kutipan", "KUTIPAN"],
        ["video", "VIDEO"],
        ["story", "STORY"],
        ["gift", "GIFT"],
        ["dresscode", "DRESS CODE"],
        ["livestream", "LIVE STREAMING"],
      ]
      const gift = { accounts: data.gift_accounts || [], address: data.gift_address || "" }
      const specSlots = getTemplateContentSpec(data.template?.code)?.cover_slots
      const manifestSlots = Array.isArray(data.template?.wp_manifest?.cover_photos) ? data.template.wp_manifest.cover_photos.length : undefined
      const hasCoverSlots = data.template?.no_photo !== true && (specSlots ?? manifestSlots ?? 0) > 0
      const empty = defs
        .filter(([k]) => {
          if (k === "pembuka" && hidesOpeningSection(data.template?.code)) return false
          if (k === "sampul") return !hasCoverSlots && p?.link_thumbnail_disabled !== true && !invHasStr(p?.link_thumbnail_url)
          if (k === "dresscode" && !getTemplateContentSpec(data.template?.code)?.sections?.dresscode) return false
          if (k === "livestream" && !getTemplateContentSpec(data.template?.code)?.sections?.livestream) return false
          return invSectionState(p, k, k === "gift" ? gift : undefined, data.template?.no_photo === true) === "empty"
        })
        .map(([, label]) => label)
      setInvCardSummary({ empty, wpId })
    } catch {}
  }

  useEffect(() => {
    const fa = detail?.feature_actions?.find((x: any) => x.feature_key === "premium_web")
    const wpId = fa?.wedding_profile_id
    if (!wpId || invCardSummary?.wpId === wpId) return
    fetchInvCardSummary(wpId)
  }, [detail])

  // Accordion header props mirroring the couple editor (lock / hidden / incomplete).
  const invAccProps = (key: string) => {
    const p = invitationData?.profile
    const gates = p?.package_gates || {}
    const lockedInfo: string[] | null =
      key === "inviting" && gates.inviting_families?.included === false ? gates.inviting_families.availableIn || [] :
      key === "video" && gates.cinematic_video?.included === false ? gates.cinematic_video.availableIn || [] :
      key === "story" && gates.story?.included === false ? gates.story.availableIn || [] :
      key === "dresscode" && gates.dresscode?.included === false ? gates.dresscode.availableIn || [] :
      key === "livestream" && gates.livestream?.included === false ? gates.livestream.availableIn || [] : null
    const hidden =
      key === "inviting" ? p?.inviting_families_visible === false :
      key === "video" ? p?.video_section_visible === false :
      key === "story" ? p?.story_visible === false :
      key === "gift" ? p?.gift_section_visible === false :
      key === "dresscode" ? p?.dresscode_visible === false :
      key === "livestream" ? p?.livestream_visible === false :
      key === "rundown" ? p?.rundown_visible === false :
      key === "contacts" ? p?.contacts_visible === false : false
    const st = key === "sampul"
      ? (invHasCoverPhotos || p?.link_thumbnail_disabled === true || invHasStr(p?.link_thumbnail_url) ? "ok" : "empty")
      : invSectionState(p, key === "profile" ? "profil" : key === "music" ? "musik" : key, key === "gift" ? { accounts: invitationData?.gift_accounts || [], address: invitationData?.gift_address || "" } : undefined, invNoPhoto)
    return { lockedInfo, hidden, incomplete: st === "empty" }
  }

  const invOpeningMatch = invForm ? matchOpeningPreset(invForm.opening_title || "") : null
  const invIsCustom = invOpeningCustomMode || (!!invForm?.opening_title && !invOpeningMatch)
  const invOpeningSelect =
    invOpeningMatch && !invOpeningCustomMode
      ? invOpeningMatch.title
      : invForm?.opening_title || invOpeningCustomMode
        ? OPENING_CUSTOM
        : ""

  // Cover slots mirror the couple editor: in-house templates have 1 single
  // slot; WP templates follow wp_manifest.cover_photos (length + slideshow
  // markers). Slot writes also sync couple_illustration_url from slot 0.
  const invTpl = invitationData?.template
  // Tanpa-photo template: photo fields are hidden in editor + ops and excluded
  // from completeness. Stored photos are kept (hidden, ungated, unsynced).
  const invNoPhoto = (invitationData as any)?.template?.no_photo === true
  const invIsInhouseTpl = !!invTpl && (invTpl.source_type === "inhouse" || (!!invTpl.code && !invTpl.wp_master_slug))
  // Section/photo capabilities follow the selected template exactly like the
  // couple editor (content spec for in-house, manifest for WP). Ops must never
  // show fields the template does not render.
  const invContentSpec = invTpl?.code ? getTemplateContentSpec(invTpl.code) : undefined
  const invShowStoryPhoto = invContentSpec?.story_photo !== false && !invNoPhoto
  // Same split as the couple editor: a design can take a gallery/film but no
  // cover or portrait photos (lace).
  const invHasPersonPhotos = !invNoPhoto && invContentSpec?.person_photos !== false
  const invExtraFields = getTemplateExtraFields(invTpl?.code, normalizeLanguage(invForm?.language))
  const invExtrasLabel = templateExtrasLabel(invTpl?.name, normalizeLanguage(invForm?.language))
  const invCoverSlotCount = invContentSpec?.cover_slots ?? (Array.isArray(invTpl?.wp_manifest?.cover_photos) ? invTpl.wp_manifest.cover_photos.length : 0)
  // Zero slots means no cover drives the link preview, so the couple must pick
  // a dedicated thumbnail (or opt out) in the SAMPUL accordion.
  const invHasCoverPhotos = !invNoPhoto && invCoverSlotCount > 0
  const invCoverSlotLabel = (i: number) => invContentSpec?.cover_slot_labels?.[i] || `Slot ${i + 1}`
  // Stored photo for one template slot (the column holds string | string[]
  // entries, sometimes JSON-encoded). Read-only views use it so ops can see an
  // EMPTY slot too, instead of the cover list silently collapsing to nothing.
  const invStoredCoverAt = (i: number): string => {
    const raw = (invitationData as any)?.profile?.cover_photos
    const list = Array.isArray(raw) ? raw : []
    const v = list[i]
    if (typeof v === "string") return v
    if (Array.isArray(v)) return (v.find((x) => typeof x === "string" && x) as string) || ""
    return ""
  }
  // Slots whose section is hidden are not offered (stored photos are kept).
  // invitationData starts as null and every neighbouring read above is
  // optional-chained: this one line, evaluated during the first render (which
  // includes SSR), used to throw "Cannot read properties of null (reading
  // 'profile')" and turn every /ops/antrian/[id] into a 500.
  const invCoverSlotIndexes = visibleCoverSlotIndexes(invContentSpec, (invForm || invitationData?.profile || {}) as unknown as CoverSlotGateData, invCoverSlotCount)
  const invIsCoverSlideshowSlot = (i: number) => {
    if (invContentSpec) return !!invContentSpec.cover_slideshows?.includes(i)
    const mapping = invTpl?.wp_manifest?.cover_photos?.[i]
    return Array.isArray(mapping?.settings) && mapping.settings.join(".") === "background_slideshow_gallery"
  }
  // Couple-photo slots mirror the couple editor: slideshow-ness comes from the
  // TEMPLATE (content spec or manifest), never from how many photos are
  // currently uploaded.
  const invIsSlideshowField = (field: "groom_photo_url" | "bride_photo_url") => {
    if (invContentSpec) {
      if (field === "groom_photo_url") return invContentSpec.groom_photo === "slideshow"
      if (field === "bride_photo_url") return invContentSpec.bride_photo === "slideshow"
      return false
    }
    const mapping = invTpl?.wp_manifest?.[field]
    const m = Array.isArray(mapping) ? mapping[0] : mapping
    return Array.isArray(m?.settings) && m.settings.join(".") === "background_slideshow_gallery"
  }
  const invSetCoverAt = (idx: number, url: string) => {
    if (!invForm) return
    const covers: any[] = [...(Array.isArray(invForm.cover_photos) ? invForm.cover_photos : [])]
    while (covers.length <= idx) covers.push("")
    covers[idx] = url
    const first = covers[0]
    setInvForm({ ...invForm, cover_photos: covers, couple_illustration_url: typeof first === "string" && first ? first : invForm.couple_illustration_url })
  }
  const invClearCoverAt = (idx: number) => {
    if (!invForm) return
    const covers = (Array.isArray(invForm.cover_photos) ? invForm.cover_photos : []).filter((_: any, i: number) => i !== idx)
    const first = covers[0]
    setInvForm({ ...invForm, cover_photos: covers, couple_illustration_url: typeof first === "string" && first ? first : "" })
  }
  const invSetCoverSlideAt = (slot: number, slide: number, url: string) => {
    if (!invForm) return
    const covers: any[] = [...(Array.isArray(invForm.cover_photos) ? invForm.cover_photos : [])]
    const cur = covers[slot]
    const arr: string[] = Array.isArray(cur) ? [...cur] : (typeof cur === "string" && cur !== "" ? [cur] : [])
    while (arr.length <= slide) arr.push("")
    arr[slide] = url
    covers[slot] = arr
    setInvForm({ ...invForm, cover_photos: covers })
  }

  const photoStrArr = (v: any): string[] => {    if (Array.isArray(v)) return v.filter(Boolean)
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
    const currentId = invitationData?.profile?.id
    if (!currentId) return
    setInvSaveError("")
    // Re-fetch fresh data first: the modal may have been opened a while ago
    // while the couple (or another tab) changed something. Building the form
    // from stale rows makes the next save re-POST existing rows as new
    // duplicates (server assigns fresh ids to id-less rows).
    let fresh: any = null
    try {
      const res = await fetch(`/api/dashboard/${currentId}/web-invitation`)
      if (res.ok) {
        fresh = await res.json()
        setInvitationData(fresh)
      }
    } catch {}
    const src = fresh || invitationData
    const p = src.profile
    if (!p) return
    setInvOpeningCustomMode(false)
    setInvForm({
      display_name: p.display_name || "",
      couple_initials: p.couple_initials || "",
      opening_title: p.opening_title || "",
      opening_description: p.opening_description || "",
      groom_name: p.groom_name || "",
      groom_full_name: p.groom_full_name || "",
      groom_parents: p.groom_parents || "",
      groom_instagram: p.groom_instagram || "",
      // Ceriavite: ordered ananda list. Falls back to the legacy single slot so
      // profiles created before the column existed open with their child intact.
      // Wedding profiles never carry the list (their second slot holds the bride).
      // `readChildren` keeps blank rows: an ananda the ops adds is empty until
      // they type, and dropping it would make "Tambah Ananda" look like a no-op.
      children: profileView(p).kids
        ? (() => {
            const stored = readChildren(p.children)
            return stored.length > 0 ? stored : resolveChildren(p)
          })()
        : [],
      bride_name: p.bride_name || "",
      bride_full_name: p.bride_full_name || "",
      bride_parents: p.bride_parents || "",
      bride_instagram: p.bride_instagram || "",
      couple_illustration_url: p.couple_illustration_url || "",
      link_thumbnail_url: p.link_thumbnail_url || "",
      link_thumbnail_disabled: p.link_thumbnail_disabled === true,
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
      dresscode: p.dresscode || {},
      livestream: p.livestream || {},
      dresscode_visible: p.dresscode_visible !== false,
      livestream_visible: p.livestream_visible !== false,
      rundown: (Array.isArray(p.rundown) ? p.rundown : []).map((r: any) => ({
        time: r?.time || "", description: r?.description || "",
      })),
      contacts: (Array.isArray(p.contacts) ? p.contacts : []).map((c: any) => ({
        name: c?.name || "", description: c?.description || "", whatsapp: c?.whatsapp || "",
      })),
      rundown_visible: p.rundown_visible !== false,
      contacts_visible: p.contacts_visible !== false,
      template_content: p.template_content || {},
      gift_section_visible: p.gift_section_visible !== false,
      inviting_families_visible: p.inviting_families_visible !== false,
      selected_track_id: p.selected_track_id || "",
      language: normalizeLanguage(p.language),
      giftAccounts: (src.gift_accounts || []).map((a: any) => ({
        id: a.id,
        provider_name: a.provider_name || "",
        account_number: a.account_number || "",
        account_name: a.account_name || "",
        type: a.type === "ewallet" ? "ewallet" : "bank",
        provider_logo_url: a.provider_logo_url || "",
      })),
      giftAddress: {
        recipient_name: src.gift_address_name || "",
        full_address: src.gift_address || "",
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

  // Music upload mirrors the couple editor: the couple keeps at most one
  // private upload, so a second one replaces (and deletes) the previous.
  const invProfileId = invitationData?.profile?.id
  const invMyCustomTrack = invTrackOptions.find(
    (t: any) => t.is_custom === true && t.uploaded_by === invProfileId && t.is_public !== true
  ) || null
  const invSortedTracks = useMemo(() => {
    const sel = invForm?.selected_track_id
    return [...invTrackOptions].sort((a: any, b: any) => (a.id === sel ? 0 : 1) - (b.id === sel ? 0 : 1))
  }, [invTrackOptions, invForm?.selected_track_id])

  const invUploadMusic = async (file: File) => {
    if (!invProfileId || invMusicUploading) return
    setInvMusicUploading(true)
    setInvMusicUploadError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("wedding_profile_id", invProfileId)
      const res = await fetch("/api/tracks", { method: "POST", body: fd })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setInvMusicUploadError(payload.error || "Gagal mengunggah lagu")
        return
      }
      const track = payload.track
      setInvTrackOptions((prev: any[]) => [
        track,
        ...prev.filter((t: any) => !(t.is_custom === true && t.uploaded_by === invProfileId && t.is_public !== true)),
      ])
      setInvForm((prev: any) => (prev ? { ...prev, selected_track_id: track.id } : prev))
    } catch {
      setInvMusicUploadError("Gagal mengunggah lagu. Periksa koneksi.")
    } finally {
      setInvMusicUploading(false)
    }
  }

  const invPickMusicFile = (file: File) => {
    setInvMusicUploadError("")
    if (invMyCustomTrack) {
      setInvPendingMusicFile(file)
      setInvMusicConfirmOpen(true)
    } else {
      invUploadMusic(file)
    }
  }

  const invConfirmMusicReplace = () => {
    setInvMusicConfirmOpen(false)
    const file = invPendingMusicFile
    setInvPendingMusicFile(null)
    if (file) invUploadMusic(file)
  }

  const invCancelMusicReplace = () => {
    setInvMusicConfirmOpen(false)
    setInvPendingMusicFile(null)
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

  const computeInvDiff = (): string[] => {
    if (!invForm || !invitationData?.profile) return []
    const f = invForm
    const orig = invitationData.profile
    const changed: string[] = []
    const sameStr = (a: any, b: any) => (a ?? "") === (b ?? "")
    const strField = (label: string, nv: any, ov: any) => { if (!sameStr(nv, ov)) changed.push(label) }
    if (orig.package_type !== "ceriavite") strField("Hashtag", f.display_name, orig.display_name)
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
    if (Array.isArray(f.children)) {
      const normAnanda = (list: any[]) =>
        (list || []).map((c: any) => [c?.name || "", c?.full_name || "", c?.photo_url || "", c?.instagram || ""].join("|"))
      if (JSON.stringify(normAnanda(f.children)) !== JSON.stringify(normAnanda(parseChildren(orig.children)))) {
        changed.push(`Ananda (${parseChildren(orig.children).length}→${f.children.length})`)
      }
    }
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
      // Normalize key order + nulls on BOTH sides: DB rows often carry keys
      // in a different order (or extra nulls) than the edit form builds.
      const normSessions = (list: any[]) => (list || []).map((s: any) => ({
        name: s?.name || "", date: s?.date || "", time: s?.time || "", timezone: s?.timezone || "WIB",
        venue: s?.venue || "", address: s?.address || "", maps_url: s?.maps_url || "",
      }))
      const normStories = (list: any[]) => (list || []).map((s: any) => ({
        year: s?.year || "", title: s?.title || "", description: s?.description || "", image_url: s?.image_url || "",
      }))
      if (JSON.stringify(normSessions(f.sessions)) !== JSON.stringify(normSessions(orig.sessions))) {
        changed.push(`Sesi Acara (${(orig.sessions || []).length}→${(f.sessions || []).length})`)
      }
      if (JSON.stringify(normStories(f.stories)) !== JSON.stringify(normStories(orig.stories))) {
        changed.push(`Kisah (${(orig.stories || []).length}→${(f.stories || []).length})`)
      }
    const visField = (label: string, nv: boolean, ov: boolean) => { if (!!nv !== !!ov) changed.push(label) }
    visField("Tampil Video", f.video_section_visible, orig.video_section_visible !== false)
    visField("Tampil Kisah", f.story_visible, orig.story_visible !== false)
    visField("Tampil Hadiah", f.gift_section_visible, orig.gift_section_visible !== false)
    visField("Tampil Turut Mengundang", f.inviting_families_visible, orig.inviting_families_visible !== false)
    visField("Tampil Dress Code", f.dresscode_visible !== false, orig.dresscode_visible !== false)
    visField("Tampil Live Streaming", f.livestream_visible !== false, orig.livestream_visible !== false)
    visField("Tampil Rundown Acara", f.rundown_visible !== false, orig.rundown_visible !== false)
    visField("Tampil Kontak Keluarga", f.contacts_visible !== false, orig.contacts_visible !== false)
    // The edit form normalizes rows (missing keys → "", fixed key order), so a
    // raw JSON compare flags unchanged rundown/contacts as "changed". Compare
    // only the editable columns, like sessions/stories above.
    const normRundown = (list: any[]) => (list || []).map((r: any) => [r?.time || "", r?.description || ""].join("|"))
    if (JSON.stringify(normRundown(f.rundown)) !== JSON.stringify(normRundown(orig.rundown))) {
      changed.push(`Rundown Acara (${(orig.rundown || []).length}→${(f.rundown || []).length})`)
    }
    const normContacts = (list: any[]) => (list || []).map((c: any) => [c?.name || "", c?.description || "", c?.whatsapp || ""].join("|"))
    if (JSON.stringify(normContacts(f.contacts)) !== JSON.stringify(normContacts(orig.contacts))) {
      changed.push(`Kontak Keluarga (${(orig.contacts || []).length}→${(f.contacts || []).length})`)
    }
    if (JSON.stringify(f.dresscode?.colors || []) !== JSON.stringify(orig.dresscode?.colors || [])) changed.push("Palet Dress Code")
    strField("Live Streaming", f.livestream?.url, orig.livestream?.url)
    // Diff EVERY extra field the active template exposes (the old hardcoded
    // list missed profiles_intro/events_intro/gallery_intro/wishes_intro, so an
    // extras-only edit looked like "no changes" and never reached the log).
    const tcLabels = new Map<string, string>([
      ["cover_apology", "Cover Apology"],
      ["gallery_quote", "Gallery Quote"],
      ["gift_intro_title", "Gift Intro Title"],
      ["gift_intro_description", "Gift Intro Description"],
      ["closing_message", "Closing Message"],
    ])
    for (const field of getTemplateExtraFields(invTpl?.code, normalizeLanguage(invForm?.language))) {
      tcLabels.set(field.key, field.label)
    }
    for (const [key, label] of tcLabels) {
      strField(label, f.template_content?.[key], orig.template_content?.[key])
    }
    if ((f.selected_track_id || "") !== (orig.selected_track_id || "")) {
      const t = invTrackOptions.find((x: any) => x.id === f.selected_track_id)
      changed.push(`Lagu (${t?.title || invitationData.track?.title || "diubah"})`)
    }
      const normAccts = (list: any[]) => (list || []).map((a: any) => [a.provider_name || "", a.account_number || "", a.account_name || "", a.type || "", a.provider_logo_url || ""].join("|")).sort()
    if (JSON.stringify(normAccts(f.giftAccounts)) !== JSON.stringify(normAccts(invitationData.gift_accounts || []))) {
      changed.push(`Rekening (${(invitationData.gift_accounts || []).length}→${f.giftAccounts.length})`)
    }
    if (!sameStr(f.giftAddress.recipient_name, invitationData.gift_address_name) || !sameStr(f.giftAddress.full_address, invitationData.gift_address)) {
      changed.push("Alamat Kado")
    }
    if (!sameStr(f.link_thumbnail_url, orig.link_thumbnail_url) || (f.link_thumbnail_disabled === true) !== (orig.link_thumbnail_disabled === true)) {
      changed.push("Thumbnail Tautan")
    }
    return changed
  }

  const executeInvSave = async (): Promise<string> => {
    if (!invForm || !invitationData?.profile?.id) throw new Error("Data belum siap.")
    const wpId = invitationData.profile.id
    const f = invForm
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
          // Ceriavite only; the API mirrors the first ananda into groom_* itself.
          ...(profileView(invitationData.profile).kids && Array.isArray(f.children) ? { children: f.children } : {}),
          bride_name: f.bride_name,
          bride_full_name: f.bride_full_name,
          bride_parents: f.bride_parents || null,
          bride_instagram: f.bride_instagram || null,
          couple_illustration_url: f.couple_illustration_url || null,
          link_thumbnail_url: f.link_thumbnail_url || null,
          link_thumbnail_disabled: f.link_thumbnail_disabled === true,
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
          dresscode: f.dresscode || {},
          livestream: f.livestream || {},
          dresscode_visible: f.dresscode_visible !== false,
          livestream_visible: f.livestream_visible !== false,
          rundown: f.rundown || [],
          contacts: f.contacts || [],
          rundown_visible: f.rundown_visible !== false,
          contacts_visible: f.contacts_visible !== false,
          template_content: f.template_content || {},
          inviting_families_visible: !!f.inviting_families_visible,
          selected_track_id: f.selected_track_id || null,
          language: normalizeLanguage(f.language),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan undangan")

      const formIds = new Set(f.giftAccounts.filter((a: any) => a.id).map((a: any) => a.id))
      // Gift writes must fail loudly: a silent partial save (e.g. deletes
      // failing while posts succeed) is exactly how duplicate rows pile up.
      const checkedGiftFetch = async (url: string, init: RequestInit, what: string) => {
        const r = await fetch(url, init)
        if (!r.ok) {
          const d = await r.json().catch(() => ({}))
          throw new Error(d.error || `Gagal ${what}. Coba lagi.`)
        }
        return r
      }
      for (const a of invitationData.gift_accounts || []) {
        if (!a?.id) continue
        if (!formIds.has(a.id)) {
          await checkedGiftFetch(`/api/gift-accounts/${a.id}`, { method: "DELETE" }, "menghapus rekening")
        }
      }
      for (const a of f.giftAccounts) {
        if (!a.account_number) continue
        const body = {
          provider_name: a.provider_name,
          provider_logo_url: a.provider_logo_url || "",
          account_number: a.account_number,
          account_name: a.account_name,
          type: a.type,
        }
        if (a.id) {
          await checkedGiftFetch(`/api/gift-accounts/${a.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }, "menyimpan rekening")
        } else {
          await checkedGiftFetch(`/api/gift-accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wedding_profile_id: wpId, ...body }),
          }, "menambah rekening")
        }
      }

      const addrName = (f.giftAddress.recipient_name || "").trim()
      const addrFull = (f.giftAddress.full_address || "").trim()
      if (invGiftAddrId) {
        if (addrName && addrFull) {
          await checkedGiftFetch(`/api/gift-addresses/${invGiftAddrId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient_name: addrName, full_address: addrFull }),
          }, "menyimpan alamat kado")
        } else {
          await checkedGiftFetch(`/api/gift-addresses/${invGiftAddrId}`, { method: "DELETE" }, "menghapus alamat kado")
        }
      } else if (addrName && addrFull) {
        await checkedGiftFetch(`/api/gift-addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wedding_profile_id: wpId, recipient_name: addrName, full_address: addrFull }),
        }, "menambah alamat kado")
      }

      return wpId
  }

  const runInvPatch = async (wpId: string, opts?: { isInhouse?: boolean; postId?: number | null }) => {
    if (opts?.isInhouse ?? invIsInhouseTpl) return
    const res = await fetch(`/api/wp/patch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: wpId, post_id: opts?.postId ?? null, source: "ops" }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || res.statusText || "Gagal memulai sinkronisasi")
    }
    const { job_id } = await res.json()
    if (!job_id) return
    await pollWpJob(job_id, { interval: 800 })
  }

  const logInvChange = async (changed: string[]) => {
    if (changed.length === 0) return
    try {
      await fetch(`/api/ops/queue/${id}/invitation-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-phone": employee?.phone_number || "",
          "x-ops-role": employee?.role || "",
        },
        body: JSON.stringify({ details: `Mengubah: ${changed.join(", ")}` }),
      })
      fetchAll()
    } catch (e) {
      console.error("[ops] invitation log failed", e)
    }
  }

  const openInvConfirm = () => {
    if (!invForm) return
    const changed = computeInvDiff()
    if (changed.length === 0) {
      setInvSaveError("Tidak ada perubahan untuk disimpan.")
      return
    }
    setInvSaveError("")
    setInvSyncError(null)
    setInvPendingChanges(changed)
    setInvConfirmOpen(true)
  }

  const confirmInvSave = async () => {
    // Re-entry guard: a double-click on "Ya, Simpan" would otherwise run two
    // concurrent saves that POST the same id-less rows twice (duplicates).
    if (invSyncing) return
    setInvConfirmOpen(false)
    setInvSyncing(true)
    setInvSyncError(null)
    setInvSaveError("")
    try {
      const changed = computeInvDiff()
      const wpId = await executeInvSave()
      try {
        await runInvPatch(wpId)
      } catch (patchErr) {
        await fetchInvitationData(wpId)
        fetchInvCardSummary(wpId)
        await logInvChange(changed)
        throw patchErr
      }
      await fetchInvitationData(wpId)
      fetchInvCardSummary(wpId)
      await logInvChange(changed)
    } catch (err) {
      setInvSyncError(invSyncErrorID(err))
    } finally {
      setInvSyncing(false)
    }
  }

  const retryInvPatch = async () => {
    const wpId = invitationData?.profile?.id
    if (!wpId) return
    setInvSyncing(true)
    setInvSyncMsg("Menyinkronkan data undangan...")
    setInvSyncError(null)
    try {
      await runInvPatch(wpId)
      await fetchInvitationData(wpId)
      fetchInvCardSummary(wpId)
    } catch (err) {
      setInvSyncError(invSyncErrorID(err))
    } finally {
      setInvSyncing(false)
    }
  }

  const openTplPicker = async () => {
    setInvTplOpen(true)
    if (invTplList.length > 0) return
    setInvTplLoading(true)
    try {
      // fresh=1 + no-store: eligibility edits must be current, this picker gates
      // template assignment and a stale list causes ops human error.
      const res = await fetch(`/api/web-templates?fresh=1`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        // Only the profile's own family: a Ceriavite profile must never be
        // offered a wedding design (and vice versa), the copy cannot be relabelled.
        const family = profileView(detail?.wedding_profile).family
        setInvTplList(
          (data.templates || []).filter((t: any) => profileView({ event_type: t.event_type }).family === family)
        )
      }
    } catch {}
    setInvTplLoading(false)
  }

  const selectInvTemplate = async (tpl: any) => {
    const wpId = invitationData?.profile?.id
    if (!wpId || !tpl?.id || invTplWorking) return
    if (tpl.id === invitationData.template?.id) {
      setInvTplOpen(false)
      return
    }
    // Package gate: block assigning a template outside the couple's package so
    // ops can't mis-assign by mistake. The current template is exempt.
    const pkg = invitationData?.profile?.package_type || ""
    const elig = tpl.package_eligibility
    const eligible = !Array.isArray(elig) || elig.length === 0 || (!!pkg && elig.includes(pkg))
    if (!eligible) {
      setInvTplBlocked(tpl)
      return
    }
    const prevName = invitationData.template?.name || "belum ada"
    const inhouse = tpl.source_type === "inhouse" || (!!tpl.code && !tpl.wp_master_slug)
    setInvTplWorking(tpl.id)
    setInvSyncError(null)
    try {
      if (inhouse) {
        const res = await fetch(`/api/web-invitation/template-select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: wpId, template_id: tpl.id, source: "ops" }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Gagal mengganti template")
      } else {
        setInvSyncMsg("Menduplikasi template WordPress...")
        setInvSyncing(true)
        const res = await fetch(`/api/wp/duplicate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: tpl.id, profile_id: wpId, source: "ops" }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Gagal menduplikasi template")
        if (data.job_id) await pollWpJob(data.job_id, { interval: 800 })
        // Duplicate only copies the master — patch the couple's latest data
        // into the fresh post right away (same as Perbarui in the editor).
        // The duplicate result pins the post_id so a rapid re-pick can't
        // redirect this patch onto the wrong post.
        setInvSyncMsg("Menulis data undangan ke template baru...")
        const freshPostId = typeof data.result?.post_id === "number" ? data.result.post_id : typeof data.post_id === "number" ? data.post_id : null
        const dupJob = data.job_id ? await fetchWpJob(data.job_id) : null
        const pinnedPostId = freshPostId ?? (typeof dupJob?.result === "object" && dupJob?.result !== null ? (dupJob.result as any).post_id ?? null : null)
        await runInvPatch(wpId, { postId: typeof pinnedPostId === "number" ? pinnedPostId : null })
      }
      setInvTplOpen(false)
      await fetchInvitationData(wpId)
      fetchInvCardSummary(wpId)
      try {
        await fetch(`/api/ops/queue/${id}/invitation-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ops-phone": employee?.phone_number || "",
            "x-ops-role": employee?.role || "",
          },
          body: JSON.stringify({ details: `Template (${prevName} → ${tpl.name})` }),
        })
        fetchAll()
      } catch (e) {
        console.error("[ops] invitation log failed", e)
      }
    } catch (err: any) {
      setInvTplOpen(false)
      setInvSyncError(invSyncErrorID(err))
    } finally {
      setInvTplWorking(null)
      setInvSyncing(false)
      setInvSyncMsg("")
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
    ? `https://wa.me/${currentWp.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Halo ${currentWp.groom_name} & ${currentWp.bride_name}, saya dari Aksaraa CORE OPS terkait proyek undangan Anda`)}`
    : "#"
  const guestInvUrl = (g: { slug?: string | null; name?: string; qr_token?: string | null }) =>
    g.slug ? coupleUrl(profileSlug, `/?to=${encodeURIComponent(g.slug)}`) : ""
  const guestQrUrl = (g: { slug?: string | null; qr_token?: string | null }) =>
    g.slug || g.qr_token ? coupleUrl(profileSlug, `/qr/${encodeURIComponent(g.slug || g.qr_token || "")}`) : ""

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
    const coupleName = currentWp ? getCoupleDisplayName({ bride_full_name: currentWp.bride_full_name, groom_full_name: currentWp.groom_full_name, bride_name: currentWp.bride_name, groom_name: currentWp.groom_name }) : ""
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
            TautanUnik: g.slug ? coupleUrl(profileSlug, `/?to=${encodeURIComponent(g.slug)}`) : "",
            QRAkses: g.slug || g.qr_token ? coupleUrl(profileSlug, `/qr/${encodeURIComponent(g.slug || g.qr_token || "")}`) : "",
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
    const msgCoupleName = currentWp ? getCoupleDisplayName(currentWp) : ""
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

  if (loading || (!detail && !loadError)) {
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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display-lg text-3xl md:text-5xl leading-tight break-words">{resolveCoupleName(currentWp || {})}</h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    opsView.kids
                      ? "border-[#c9a45c]/60 bg-[#f7f0e2] text-[#8a6d2f]"
                      : "border-[#cfc6b6] bg-[#f4f1ea] text-[#6e6a63]"
                  }`}
                >
                  {opsView.kids ? opsView.labels.eventNoun : "Wedding"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-body-md text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Tanggal:</span>
                  <span className="font-bold text-primary">{formatDate(getWeddingDate(currentWp))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi:</span>
                  <span className="font-bold text-primary">{currentWp.estimated_guest_count} Tamu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">PIN Scanner:</span>
                  {currentWp.scanner_pin ? (
                    <>
                      <span className="font-mono font-bold tracking-[0.2em] text-primary">{currentWp.scanner_pin}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentWp.scanner_pin) return
                          copyPlainText(currentWp.scanner_pin).then((ok) => {
                            if (!ok) return
                            setPinCopied(true)
                            window.setTimeout(() => setPinCopied(false), 1500)
                          })
                        }}
                        className="inline-flex items-center text-on-surface-variant hover:text-secondary transition-colors"
                        title="Salin PIN"
                        aria-label="Salin PIN"
                      >
                        <span className="material-symbols-outlined text-[16px]">{pinCopied ? "check" : "content_copy"}</span>
                      </button>
                    </>
                  ) : (
                    <span className="italic text-on-surface-variant/60">Belum diatur</span>
                  )}
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
                        .filter(([code]) => !code.startsWith("dgb_") && !code.startsWith("gt_"))
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
                    {/* Standalone Galeri Tamu: single slider-priced package. */}
                    <optgroup label="Galeri Tamu">
                      <option value="gt">
                        Galeri Tamu — Galeri Tamu
                      </option>
                    </optgroup>
                  </select>
                </div>
                <div className="w-full">
                  <button
                    type="button"
                    onClick={toggleAddonPanel}
                    className="w-full flex items-center gap-2 py-1 text-left"
                    aria-expanded={addonOpen}
                  >
                    <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60 shrink-0">Add-on:</span>
                    <span className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                      {currentWp && (currentWp.wa_blast_tier || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-300 text-blue-800 px-1.5 py-0.5 rounded-full">
                          WA +{currentWp.wa_blast_tier}
                        </span>
                      )}
                      {currentWp?.express_service && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-800 px-1.5 py-0.5 rounded-full">
                          Kilat
                        </span>
                      )}
                      {currentWp?.galeri_addon && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-purple-50 border border-purple-300 text-purple-800 px-1.5 py-0.5 rounded-full">
                          {currentWp.galeri_tier || "Galeri"}
                        </span>
                      )}
                      {currentWp && !((currentWp.wa_blast_tier || 0) > 0) && !currentWp.express_service && !currentWp.galeri_addon && (
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">{isGtMain ? "Belum dikonfigurasi — kelola" : "Tanpa add-on — kelola"}</span>
                      )}
                    </span>
                    <span className={`material-symbols-outlined text-[18px] transition-transform shrink-0 ${addonOpen ? "rotate-180" : ""}`}>expand_more</span>
                  </button>
                  {/* Couple-staged top-up request: informational only. Ops
                      reviews it via "Tinjau" (opens the pre-filled add-on
                      panel), then Simpan applies it — no separate pay step. */}
                  {currentWp && stagedDeltaCost > 0 && !deltaDismissed && (
                    <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                      <span className="text-xs font-semibold text-amber-800">
                        Permintaan tambah kuota: {(currentWp as any).galeri_topup_photos_per_guest ? `${(currentWp as any).galeri_topup_photos_per_guest} foto × ${(currentWp as any).galeri_topup_guest_count} tamu` : "—"}
                        {(currentWp as any).additional_tier ? ` • tier ${(currentWp as any).additional_tier}` : ""}
                        {stagedDeltaCost > 0 ? ` • ${formatCurrency(stagedDeltaCost)}` : ""}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={reviewStagedTopup} className="px-2.5 py-1 rounded bg-white border border-amber-400 text-amber-800 text-[11px] font-bold uppercase tracking-wider">Tinjau</button>
                      </div>
                    </div>
                  )}
                  {addonOpen && currentWp && (
                    <div className="mt-2 border border-outline-variant/60 bg-white p-3 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {waAllowed && (
                      <div className="border border-outline-variant/40 p-3">
                        <h4 className="font-label-md text-[11px] uppercase tracking-widest font-bold mb-1">Reminder WA VIP</h4>
                        <select
                          value={editWaTier}
                          onChange={(e) => setEditWaTier(Number(e.target.value))}
                          disabled={employee?.role === "creative"}
                          className="w-full bg-white border border-outline-variant text-sm py-2 px-2 focus:ring-0 focus:border-primary disabled:opacity-50"
                        >
                          <option value={0}>Tanpa tambahan</option>
                          {[100, 200, 300].map((t) => (
                            <option key={t} value={t}>
                              +{t} tamu{priceBook ? ` — ${formatCurrency(priceBook.waTiers[t] ?? 0)}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      )}
                      {expressAllowed && (
                      <div className="border border-outline-variant/40 p-3">
                        <h4 className="font-label-md text-[11px] uppercase tracking-widest font-bold mb-1">Layanan Kilat</h4>
                        <p className="text-xs text-on-surface-variant mb-2">
                          24 jam{priceBook ? ` — ${formatCurrency(priceBook.express)}` : ""}.
                        </p>
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={editExpress}
                            onChange={() => setEditExpress(!editExpress)}
                            disabled={employee?.role === "creative"}
                            className="w-4 h-4 accent-[#8d4d39] disabled:opacity-50"
                          />
                          Aktifkan
                        </label>
                      </div>
                      )}
                      {galeriAllowed ? (
                      <div className={`border p-3 ${editGaleriOn ? "border-secondary" : "border-outline-variant/40"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-label-md text-[11px] uppercase tracking-widest font-bold">Galeri Tamu{isGtMain ? " (wajib)" : ""}</h4>
                          {!isGtMain && (
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={editGaleriOn}
                              onChange={() => setEditGaleriOn(!editGaleriOn)}
                              disabled={employee?.role === "creative"}
                            />
                            <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary relative" />
                          </label>
                          )}
                        </div>
                        {editGaleriOn ? (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <label className="text-xs text-on-surface-variant">
                                Foto/tamu
                                <input
                                  type="number"
                                  min={gPhotoMin}
                                  max={gPhotoMax}
                                  value={editGaleriPhotos}
                                  onChange={(e) => setEditGaleriPhotos(Number(e.target.value))}
                                  disabled={employee?.role === "creative"}
                                  className="mt-1 w-full bg-white border border-outline-variant text-sm py-1.5 px-2 focus:ring-0 focus:border-primary disabled:opacity-50"
                                />
                              </label>
                              <label className="text-xs text-on-surface-variant">
                                Tamu
                                <input
                                  type="number"
                                  min={gGuestMin}
                                  max={gGuestMax}
                                  value={editGaleriGuests}
                                  onChange={(e) => setEditGaleriGuests(Number(e.target.value))}
                                  disabled={employee?.role === "creative"}
                                  className="mt-1 w-full bg-white border border-outline-variant text-sm py-1.5 px-2 focus:ring-0 focus:border-primary disabled:opacity-50"
                                />
                              </label>
                            </div>
                            <p className="text-xs font-bold text-primary">
                              {addonMatch ? `${addonMatch.tier} • ${formatCurrency(addonMatch.price)}` : !tierRows ? "Memuat harga…" : "Kombinasi belum tersedia"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant">Aktifkan untuk konfigurasi.</p>
                        )}
                      </div>
                      ) : (
                      <div className="border border-outline-variant/40 p-3">
                        <h4 className="font-label-md text-[11px] uppercase tracking-widest font-bold mb-1">Galeri Tamu</h4>
                        <p className="text-xs text-on-surface-variant">
                          Galeri sudah termasuk paket ini.
                        </p>
                      </div>
                      )}
                      <div className="md:col-span-3 flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-outline-variant/40">
                        <div className="flex-1 text-sm">
                          <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Estimasi: </span>
                          <span className="font-bold text-primary">
                            {addonEstimate == null ? "•••" : formatCurrency(addonEstimate)}
                          </span>
                          {addonMsg && (
                            <span className={`block text-xs mt-1 ${addonMsg.ok ? "text-green-700" : "text-red-500"}`}>{addonMsg.text}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={saveAddons}
                          disabled={savingAddons || employee?.role === "creative" || !priceBook}
                          className="px-6 py-2.5 bg-primary text-white font-label-md text-[11px] uppercase tracking-[0.2em] hover:bg-secondary transition-colors disabled:opacity-50"
                        >
                          {savingAddons ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-md uppercase tracking-widest text-[10px] opacity-60">Estimasi Biaya:</span>
                  {liveEstimate != null ? (
                    <span className="whitespace-nowrap">
                      {!!currentWp.voucher_code && (currentWp.voucher_discount || 0) > 0 ? (
                        <>
                          <span className="text-sm text-on-surface-variant line-through mr-2">{formatCurrency(liveEstimate)}</span>
                          <span className="font-bold text-primary">{formatCurrency(Math.max(0, liveEstimate - (currentWp.voucher_discount || 0)))}</span>
                        </>
                      ) : (
                        <span className="font-bold text-primary">{formatCurrency(liveEstimate)}</span>
                      )}
                      <span className="ml-2 text-[8px] uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full">Belum tersimpan</span>
                    </span>
                  ) : !!currentWp.voucher_code && (currentWp.voucher_discount || 0) > 0 ? (
                    <span className="whitespace-nowrap">
                      <span className="text-sm text-on-surface-variant line-through mr-2">{formatCurrency((currentWp.total_project_cost || 0) + (currentWp.voucher_discount || 0))}</span>
                      <span className="font-bold text-primary">{formatCurrency(currentWp.total_project_cost)}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-primary">{formatCurrency(currentWp.total_project_cost)}</span>
                  )}
                </div>
                {!!currentWp.voucher_code ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-300 text-green-800 font-label-md text-[10px] uppercase tracking-widest rounded-full">
                      <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                      {currentWp.voucher_code} − {formatCurrency(currentWp.voucher_discount || 0)}
                    </span>
                    {((employee?.role === "admin" || employee?.role === "sales") &&
                      derived === "belum_bayar") && (
                      <button
                        onClick={() => {
                          setVoucherSwapOpen((v) => !v)
                          setVoucherInput("")
                          setVoucherMsg(null)
                        }}
                        className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                        title="Ganti ke kode voucher lain"
                      >
                        Ganti
                      </button>
                    )}
                    {(employee?.role === "admin" ||
                      (employee?.role === "sales" && currentWp.payment_status === "UNPAID")) && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Lepas voucher ${currentWp.voucher_code} dari couple ini? Kuota kembali bertambah.`)) return
                          setVoucherApplying(true)
                          try {
                            const res = await fetch(`/api/ops/queue/${id}/voucher`, {
                              method: "DELETE",
                              headers: {
                                "x-ops-phone": employee?.phone_number || "",
                                "x-ops-role": employee?.role || "",
                              },
                            })
                            const data = await res.json().catch(() => ({}))
                            if (!res.ok) throw new Error(data.error || "Gagal melepas voucher")
                            setVoucherMsg({ ok: true, text: "Voucher dilepas." })
                            await fetchAll()
                          } catch (err: any) {
                            setVoucherMsg({ ok: false, text: err?.message || "Gagal melepas voucher" })
                          } finally {
                            setVoucherApplying(false)
                          }
                        }}
                        disabled={voucherApplying}
                        className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Lepas voucher (admin)"
                      >
                        Lepas
                      </button>
                    )}
                  </div>
                ) : (
                  (employee?.role === "admin" || employee?.role === "sales") &&
                  derived === "belum_bayar" && (
                    <div className="flex items-center gap-2">
                      <input
                        value={voucherInput}
                        onChange={(e) => {
                          setVoucherInput(e.target.value.toUpperCase())
                          setVoucherMsg(null)
                        }}
                        placeholder="Kode voucher"
                        className="w-40 px-2.5 py-1.5 text-xs font-mono uppercase tracking-widest border border-outline-variant bg-white focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={applyVoucherOps}
                        disabled={voucherApplying || !voucherInput.trim()}
                        className="px-3 py-1.5 bg-white border border-secondary text-secondary font-label-md text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white active:scale-95 transition-all disabled:opacity-50"
                      >
                        {voucherApplying ? "..." : "Pakai"}
                      </button>
                    </div>
                  )
                )}
                {voucherSwapOpen && !!currentWp.voucher_code && (
                  <div className="flex items-center gap-2">
                    <input
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value.toUpperCase())
                        setVoucherMsg(null)
                      }}
                      placeholder="Kode pengganti"
                      className="w-40 px-2.5 py-1.5 text-xs font-mono uppercase tracking-widest border border-outline-variant bg-white focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={async () => {
                        await applyVoucherOps()
                        setVoucherSwapOpen(false)
                      }}
                      disabled={voucherApplying || !voucherInput.trim()}
                      className="px-3 py-1.5 bg-white border border-secondary text-secondary font-label-md text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white active:scale-95 transition-all disabled:opacity-50"
                    >
                      {voucherApplying ? "..." : "Tukar"}
                    </button>
                  </div>
                )}
                {voucherMsg && (
                  <div className={`flex items-center gap-2 text-xs ${voucherMsg.ok ? "text-green-700" : "text-red-500"}`}>
                    {voucherMsg.text}
                  </div>
                )}
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
                <span className="font-label-md text-[10px] uppercase tracking-widest opacity-80">{detail.queue.sla_ended_at ? "SLA Selesai" : "Status SLA Aktif"}</span>
                <span className="font-mono text-xl font-bold">
                  <SlaTimer startedAt={detail.queue.sla_started_at} endedAt={detail.queue.sla_ended_at} />
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
                          {!confirmed && fa.feature_key === "premium_web" &&
                            (employee?.role === "admin" || employee?.role === "sales") && (
                            <button
                              onClick={() => {
                                setPublishConfirmOpen(true)
                                setPublishConfirmError(null)
                                setPublishBlockers([])
                              }}
                              className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary text-on-primary rounded-full hover:bg-secondary active:scale-95 transition-all normal-case tracking-normal"
                            >
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Konfirmasi
                            </button>
                          )}
                        </div>
                      )
                    })()}

                    {fa.feature_key === "premium_web" && invCardSummary && (
                      invCardSummary.empty.length > 0 ? (
                        <div className="mb-4 rounded-xl px-3 py-2.5 flex items-start gap-2 bg-amber-50 border border-amber-300">
                          <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">warning</span>
                          <div>
                            <p className="font-label-md text-[10px] uppercase tracking-widest text-amber-800">Data belum lengkap ({invCardSummary.empty.length})</p>
                            <p className="font-body-md text-xs text-amber-900 mt-0.5 leading-relaxed">{invCardSummary.empty.join(" • ")}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 rounded-xl px-3 py-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200">
                          <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-emerald-700">Semua data terisi</p>
                        </div>
                      )
                    )}

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

                    {fa.feature_key === "premium_web" && (
                      <div className="mb-4 space-y-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">rate_review</span>
                            Feedback Terbaru
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleAddFeedback(fa.wedding_profile_id)}
                            title="Tambah feedback baru untuk undangan ini"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-white font-label-md text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shrink-0"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Tambah Feedback
                          </button>
                        </div>
                    {feedbackSubmissions.length > 0 ? (
                      <>
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
                        </>
                        ) : (
                          <p className="font-body-md text-xs italic text-on-surface-variant/70">Belum ada feedback.</p>
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
                            log.previous_package === log.new_package && log.details ? (
                              <>Add-on: <span className="font-normal">{log.details}</span></>
                            ) : (
                              <>Paket: {log.previous_package ? PACKAGE_LABELS[log.previous_package] ?? log.previous_package : "—"}{" → "}{log.new_package ? PACKAGE_LABELS[log.new_package] ?? log.new_package : "—"}</>
                            )
                          ) : log.kind === "addon" ? (
                            <>Add-on: <span className="font-normal">{log.details || "diubah"}</span></>
                          ) : log.kind === "invitation" ? (
                            <>Data Undangan: <span className="font-normal">{log.details || "diubah"}</span></>
                          ) : log.kind === "payment" ? (
                            <>Pembayaran: <span className="font-normal">{log.details || "diubah"}</span></>
                          ) : log.kind === "voucher" ? (
                            <>Voucher: <span className="font-normal">{log.details || "diubah"}</span></>
                          ) : log.kind === "publish" ? (
                            <>Konfirmasi: <span className="font-normal">{log.details || "diubah"}</span></>
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

      {/* PUBLISH CONFIRM MODAL — mandatory confirmation before ops confirms */}
      {publishConfirmOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full mx-auto mb-4">
                <span className="material-symbols-outlined scale-125">verified</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-2">Konfirmasi Undangan</h2>
              <p className="font-body-md text-sm text-on-surface-variant">
                Konfirmasi undangan untuk <span className="font-semibold text-on-surface">{detail?.wedding_profile?.groom_name || ""} &amp; {detail?.wedding_profile?.bride_name || ""}</span> atas nama couple?
                Aksi ini dicatat di Riwayat beserta nama Anda.
              </p>
            </div>
            {publishBlockers.length > 0 && (
              <div className="mb-4 rounded-xl px-3 py-2.5 bg-amber-50 border border-amber-300">
                <p className="font-label-md text-[10px] uppercase tracking-widest text-amber-800 mb-1">Data belum lengkap:</p>
                <p className="font-body-md text-xs text-amber-900 leading-relaxed">{publishBlockers.map((b) => b.label).join(" • ")}</p>
              </div>
            )}
            {publishConfirmError && (
              <p className="font-body-md text-sm text-red-500 mb-4 text-center">{publishConfirmError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPublishConfirmOpen(false)
                  setPublishConfirmError(null)
                  setPublishBlockers([])
                }}
                disabled={publishBusy}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => confirmPublish(true)}
                disabled={publishBusy}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-md text-xs uppercase tracking-widest hover:bg-secondary active:scale-95 transition-all disabled:opacity-50"
              >
                {publishBusy ? "Memproses..." : "Ya, Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION CARD MODAL */}
      {showInvCard && invitationData && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-outline-variant">
              <h2 className="font-display-lg text-lg">Undangan Digital — {resolveCoupleName(invitationData.profile || {})}</h2>
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
                      onClick={() => { setInvEditing(false); setInvForm(null); setInvSaveError(""); setInvOpeningCustomMode(false) }}
                      className="px-4 py-2 border border-outline-variant text-on-surface-variant text-[9px] font-bold uppercase tracking-widest hover:bg-surface-container transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={openInvConfirm}
                      className="px-4 py-2 bg-secondary text-white text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Simpan
                    </button>
                  </>
                )}
                <button onClick={() => { setShowInvCard(false); setInvitationData(null); setInvEditing(false); setInvForm(null); setInvSaveError(""); setInvOpeningCustomMode(false) }} className="p-2 hover:bg-surface-container-low transition-colors">
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
            {invSyncError && (
              <div className="mx-6 sm:mx-10 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">error</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-[11px] uppercase tracking-widest text-red-700">Sinkronisasi Gagal</p>
                    <p className="font-body-md text-[13px] text-[#2C2A29] mt-1 leading-relaxed">{invSyncError}</p>
                  </div>
                </div>
                <button
                  onClick={retryInvPatch}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B34E3F] text-white font-label-md text-[12px] hover:bg-[#9E3B2D] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Coba Lagi
                </button>
              </div>
            )}

            <div className="p-6 sm:p-10">
              <div ref={cardRef} className="max-w-md mx-auto bg-white border border-outline-variant shadow-lg overflow-hidden">
                <style>{`.input-editorial { border: none; border-bottom: 1px solid #1A1A1A; background: transparent; padding: 8px 0; border-radius: 0; outline: none; transition: border-width 0.1s ease; width: 100%; font-family: 'Playfair Display', serif; font-size: 18px; } .input-editorial:focus { border-bottom-width: 2px; box-shadow: none; outline: none; } .input-editorial::placeholder { color: rgba(26,26,26,.34); font-size: .8em; font-style: italic; font-family: 'Inter', sans-serif; font-weight: 400; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E1D8; }`}</style>
                {/* SAMPUL */}
                <div className="p-6 space-y-4">
                <InvAccordion secKey="sampul" icon="photo_album" label="SAMPUL" defaultOpen {...invAccProps("sampul")}>
                {invEditing && invForm ? (
                  <div className="mt-6 space-y-8">
                    {/* Tanpa-photo: cover slots hidden, date/initials stay */}
                    {invHasCoverPhotos && (
                    <div className="space-y-3">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Foto Sampul</label>
                      <p className="text-[11px] text-on-surface-variant italic">
                        {`${invCoverSlotIndexes.length} slot foto sampul tersedia pada template. Isi setiap slot untuk mengganti foto.`}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {invCoverSlotIndexes.map((i) => {
                          const slotValue = (Array.isArray(invForm.cover_photos) ? invForm.cover_photos : [])[i]
                          if (invIsCoverSlideshowSlot(i)) {
                            const slides = Array.isArray(slotValue) ? slotValue : (typeof slotValue === "string" && slotValue !== "" ? [slotValue] : [])
                            return (
                              <div key={i} className="col-span-2 border border-outline-variant rounded p-2 bg-surface-container-lowest">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{invCoverSlotLabel(i)} — Slideshow (2 foto)</span>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {[0, 1].map((s) => {
                                    const sKey = `cover-${i}-${s}`
                                    const busy = invUploading === sKey
                                    const url = slides[s]
                                    return (
                                      <div key={s} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                                        {busy ? (
                                          <span className="material-symbols-outlined text-[20px] animate-spin absolute inset-0 m-auto w-fit h-fit">progress_activity</span>
                                        ) : (
                                          <>
                                            {url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />}
                                            <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}.{s === 0 ? "a" : "b"}</span>
                                            <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" title="Ganti foto">
                                              <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                  const f = e.target.files?.[0]
                                                  e.target.value = ""
                                                  if (!f) return
                                                  const u = await invUploadPhoto(sKey, f)
                                                  if (u) invSetCoverSlideAt(i, s, u)
                                                }}
                                              />
                                            </label>
                                          </>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }
                          const sKey = `cover-${i}`
                          const busy = invUploading === sKey
                          const url = typeof slotValue === "string" ? slotValue : (Array.isArray(slotValue) ? slotValue[0] : "")
                          if (busy) {
                            return (
                              <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                              </div>
                            )
                          }
                          if (url) {
                            return (
                              <div key={i} className="relative aspect-video bg-surface-dim border border-outline-variant overflow-hidden group">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                                <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                                <span className="absolute bottom-1 left-1 right-1 bg-black/55 text-white text-[9px] px-1 py-0.5 rounded-sm truncate">{invCoverSlotLabel(i)}</span>
                                <label className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer" title="Ganti foto ini">
                                  <span className="material-symbols-outlined text-white text-[24px] drop-shadow-md">edit</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0]
                                      e.target.value = ""
                                      if (!f) return
                                      const u = await invUploadPhoto(sKey, f)
                                      if (u) invSetCoverAt(i, u)
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => invClearCoverAt(i)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Hapus foto ini"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            )
                          }
                          return (
                            <label key={i} className="relative aspect-video bg-surface-dim border border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
                              <span className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-sm flex items-center justify-center text-[11px] font-bold">{i + 1}</span>
                              <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                              <span className="text-[9px] text-on-surface-variant mt-1">{invCoverSlotLabel(i)}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  e.target.value = ""
                                  if (!f) return
                                  const u = await invUploadPhoto(sKey, f)
                                  if (u) invSetCoverAt(i, u)
                                }}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    )}
                    {invHasCoverPhotos ? (
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
                          {invForm.link_thumbnail_disabled !== true && (
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
                          <label
                            className="relative w-24 aspect-[1.91/1] shrink-0 cursor-pointer overflow-hidden rounded border border-dashed border-outline-variant bg-surface-dim flex items-center justify-center"
                            title={invForm.link_thumbnail_url ? "Ganti thumbnail" : "Unggah thumbnail"}
                          >
                            {invUploading === "link-thumb" ? (
                              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                            ) : invForm.link_thumbnail_url ? (
                              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${invForm.link_thumbnail_url})` }} />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0]
                                e.target.value = ""
                                if (!f) return
                                const u = await invUploadPhoto("link-thumb", f)
                                if (u) setInvForm({ ...invForm, link_thumbnail_url: u, link_thumbnail_disabled: false })
                              }}
                            />
                          </label>
                          <div className="min-w-0 space-y-1">
                            <label className="inline-flex cursor-pointer rounded-full bg-secondary px-4 py-2 font-label-md text-[10px] uppercase tracking-widest text-white hover:opacity-90">
                              {invForm.link_thumbnail_url ? "Ganti Gambar" : "Unggah Gambar"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  e.target.value = ""
                                  if (!f) return
                                  const u = await invUploadPhoto("link-thumb", f)
                                  if (u) setInvForm({ ...invForm, link_thumbnail_url: u, link_thumbnail_disabled: false })
                                }}
                              />
                            </label>
                            <p className="text-[10px] text-on-surface-variant">JPG atau PNG. Rekomendasi 1200 × 630 px.</p>
                          </div>
                        </div>
                        <label className="flex items-start gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={invForm.link_thumbnail_disabled === true}
                            onChange={(e) => setInvForm({ ...invForm, link_thumbnail_disabled: e.target.checked })}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#B34E3F]"
                          />
                          <span className="text-[11px] leading-snug text-on-surface-variant">
                            Tanpa gambar thumbnail (tautan tampil tanpa foto)
                          </span>
                        </label>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Bahasa Undangan</label>
                      <select className="input-editorial w-full font-headline-md text-[16px]" value={normalizeLanguage(invForm.language)} onChange={(e) => setInvForm({ ...invForm, language: normalizeLanguage(e.target.value) })} disabled={invitationData?.template?.source_type === "wp"}>
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">{invitationData?.template?.source_type === "wp" ? "Template WordPress saat ini hanya tersedia dalam Bahasa Indonesia." : "Seluruh undangan akan tampil dalam bahasa ini untuk semua tamu."}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Tanggal Acara</label>
                      <input className="input-editorial w-full font-headline-md text-[16px]" type="date" value={invForm.estimated_wedding_date || ""} onChange={(e) => setInvForm({ ...invForm, estimated_wedding_date: e.target.value })} />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Tanggal utama yang tampil pada sampul undangan.</p>
                    </div>
                    {invitationData?.profile?.package_type !== "ceriavite" && (
                      <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Hashtag Instagram Post</label>
                        <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={invForm.display_name || ""} onChange={(e) => setInvForm({ ...invForm, display_name: e.target.value })} placeholder="#RiaYusufBersatu" />
                        <p className="text-[11px] text-on-surface-variant mt-1 italic">Tampil pada undangan sebagai hashtag. Contoh: #RiaYusufWedding. Kosongkan untuk menyembunyikan.</p>
                      </div>
                    )}
                    {invContentSpec?.initials !== false && invitationData?.profile?.package_type !== "ceriavite" && (
                    <div className="space-y-2">
                      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Singkatan Pasangan</label>
                      <input className="input-editorial w-full font-headline-md text-[18px]" type="text" value={invForm.couple_initials || ""} onChange={(e) => setInvForm({ ...invForm, couple_initials: e.target.value })} placeholder="WD" />
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: WD, AC — semua karakter yang ditulis tampil pada monogram sampul; otomatis mengecil bila lebih dari 2.</p>
                    </div>
                    )}
                    <div className="space-y-2">
                      <InvCheck label="Foto hitam putih (grayscale)" checked={!!invForm.grayscale} onChange={(v) => setInvForm({ ...invForm, grayscale: v })} />
                    </div>
                  </div>
                ) : invSectionState(invitationData.profile, "sampul") === "empty" ? (
                  <p className="font-body-md text-xs italic text-on-surface-variant/70 mt-6">Belum diisi.</p>
                ) : (
                  <>
                    {invitationData.profile?.couple_illustration_url && (
                      <div className="relative h-64 sm:h-80 bg-surface-dim overflow-hidden mt-6">
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
                          <h3 className="font-display-lg text-3xl sm:text-4xl">{resolveCoupleName(invitationData.profile)}</h3>
                          <p className="font-body-md text-sm opacity-80 mt-1">{profileView(invitationData.profile).kids ? profileView(invitationData.profile).labels.eventKicker : "We Are Getting Married"}</p>
                        </div>
                      </div>
                    )}
                    {invHasCoverPhotos ? (
                      <div className="px-6 pt-4 pb-2">
                        <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">
                          {`Foto Sampul (${invCoverSlotIndexes.length} slot)`}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {invCoverSlotIndexes.map((i) => {
                            const url = invStoredCoverAt(i)
                            return (
                              <div key={i} className="relative group aspect-video bg-surface-dim border border-outline-variant overflow-hidden">
                                {url ? (
                                  <>
                                    <img src={url} alt={invCoverSlotLabel(i)} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    <button onClick={() => downloadImage(url, `cover-${invitationData.profile.slug || "photo"}-${i + 1}.jpg`)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-white/80 border border-outline-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Download">
                                      <span className="material-symbols-outlined text-[11px]">download</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest text-on-surface-variant">
                                    Belum diisi
                                  </span>
                                )}
                                <span className="absolute bottom-0 inset-x-0 bg-white/85 px-1 py-0.5 text-[8px] font-bold uppercase tracking-tight leading-[1.2] text-on-surface-variant">
                                  {invCoverSlotLabel(i)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : coverPhotos(invitationData.profile.cover_photos).length > 0 && (
                      <div className="px-6 pt-4 pb-2">
                        <div className="grid grid-cols-3 gap-2">
                          {coverPhotos(invitationData.profile.cover_photos).map((url: string, i: number) => (
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
                </InvAccordion>
                </div>

                <div className="p-6 space-y-4">
                  {!hidesOpeningSection(invitationData?.template?.code) && (
                  <InvAccordion secKey="pembuka" icon="chat_bubble" label="KALIMAT PEMBUKA" {...invAccProps("pembuka")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Judul</label>
                          <select
                            className="input-editorial w-full font-body-md text-[14px] cursor-pointer"
                            value={invOpeningSelect}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "" || value === OPENING_CUSTOM) {
                                setInvOpeningCustomMode(true)
                                return
                              }
                              const preset = matchOpeningPreset(value)
                              if (!preset) return
                              setInvOpeningCustomMode(false)
                              setInvForm({ ...invForm, opening_title: preset.title, opening_description: preset.description })
                            }}
                          >
                            <option value="">-- Pilih Judul --</option>
                            {OPENING_PRESETS.map((p) => (
                              <option key={p.title} value={p.title}>{p.title}</option>
                            ))}
                            <option value={OPENING_CUSTOM}>{OPENING_CUSTOM}</option>
                          </select>
                        </div>
                        {invIsCustom && (
                          <div className="space-y-2">
                            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Judul Custom</label>
                            <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={invForm.opening_title || ""} onChange={(v) => setInvForm({ ...invForm, opening_title: v })} placeholder="Perkenankanlah kami mengundang" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Deskripsi</label>
                          <AutoTextarea className="input-editorial w-full font-body-md text-[14px] resize-none disabled:opacity-60 overflow-hidden" value={invForm.opening_description || ""} onChange={(v) => setInvForm({ ...invForm, opening_description: v })} placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami…" disabled={!invIsCustom} minRows={3} />
                          {!invitationData.template?.wp_manifest?.opening_description && (
                            <p className="text-[11px] text-on-surface-variant/70 mt-1 italic">Catatan: Template ini hanya menampilkan Judul. Deskripsi tidak akan tampil di undangan.</p>
                          )}
                        </div>
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
                  </InvAccordion>
                  )}

                  <InvAccordion secKey="profile" icon="group" label={profileView(invitationData?.profile).kids ? "PROFILE ANANDA" : "PROFILE MEMPELAI"} {...invAccProps("profile")}>
                    {invEditing && invForm ? (
                      profileView(invitationData?.profile).kids && Array.isArray(invForm.children) ? (
                      <div className="mt-6 space-y-6">
                        <p className="text-[11px] text-on-surface-variant italic">
                          Satu undangan boleh memuat lebih dari satu ananda (saudara). Nama orang tua ditulis sekali untuk semuanya.
                        </p>

                        {(invForm.children as InvitationChild[]).map((child, index) => {
                          const upKey = `profil-ananda-${index}`
                          return (
                            <div key={`ananda-${index}`} className="bg-surface-container-low border border-outline-variant p-4 space-y-4">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Ananda {index + 1}</span>
                                {invForm.children.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setInvForm({ ...invForm, children: invForm.children.filter((_: any, j: number) => j !== index) })}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    aria-label={`Hapus ananda ${index + 1}`}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-4 items-start">
                                {invHasPersonPhotos && (
                                  <InvPhotoBox
                                    url={child.photo_url || ""}
                                    uploading={invUploading === upKey}
                                    onFile={async (file: File) => {
                                      const url = await invUploadPhoto(upKey, file)
                                      if (!url) return
                                      setInvForm((prev: any) => ({
                                        ...prev,
                                        children: prev.children.map((c: any, j: number) => (j === index ? { ...c, photo_url: url } : c)),
                                      }))
                                    }}
                                  />
                                )}
                                <div className="flex-1 space-y-2">
                                  <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={child.name} onChange={(v) => setInvForm({ ...invForm, children: invForm.children.map((c: any, j: number) => (j === index ? { ...c, name: v } : c)) })} placeholder="Nama panggilan ananda" />
                                  <p className="text-[11px] text-on-surface-variant italic">Nama panggilan ananda</p>
                                  <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={child.full_name} onChange={(v) => setInvForm({ ...invForm, children: invForm.children.map((c: any, j: number) => (j === index ? { ...c, full_name: v } : c)) })} placeholder="Nama lengkap ananda" />
                                  <p className="text-[11px] text-on-surface-variant italic">Nama lengkap ananda</p>
                                </div>
                              </div>
                              <div>
                                <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={child.instagram} onChange={(e) => setInvForm({ ...invForm, children: invForm.children.map((c: any, j: number) => (j === index ? { ...c, instagram: e.target.value } : c)) })} placeholder="Instagram (opsional)" />
                                <p className="text-[11px] text-on-surface-variant mt-1 italic">Contoh: @raka</p>
                              </div>
                            </div>
                          )
                        })}

                        {invForm.children.length < MAX_CHILDREN && (
                          <button
                            type="button"
                            onClick={() => setInvForm({ ...invForm, children: [...invForm.children, { name: "", full_name: "", photo_url: "", instagram: "" }] })}
                            className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            TAMBAH ANANDA
                          </button>
                        )}

                        <div className="border-t border-outline-variant pt-6">
                          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Nama Orang Tua</label>
                          <div className="mt-3">
                            <AutoTextarea className="input-editorial w-full font-headline-md text-[16px] resize-none overflow-hidden" value={invForm.groom_parents || ""} onChange={(v) => setInvForm({ ...invForm, groom_parents: v })} placeholder="Bapak ... & Ibu ..." />
                            <p className="text-[11px] text-on-surface-variant mt-1 italic">Ditampilkan satu kali untuk semua ananda.</p>
                          </div>
                        </div>
                      </div>
                      ) : (
                      <div className="mt-6 space-y-8">
                        {(["groom", "bride"] as const).map((side) => {
                          const isGroom = side === "groom"
                          const urls = (isGroom ? invForm.groom_photo_url : invForm.bride_photo_url) || []
                          const setUrls = (v: string[]) => setInvForm({ ...invForm, [isGroom ? "groom_photo_url" : "bride_photo_url"]: v })
                          const upKey = (i: number) => `profil-${side}-${i}`
                          const putUrl = async (i: number, file: File) => {
                            const url = await invUploadPhoto(upKey(i), file)
                            if (!url) return
                            const next = [...urls]
                            next[i] = url
                            setUrls(next.filter(Boolean))
                          }
                          const k = profileView(detail?.wedding_profile).kids
                          const label = k ? "Ananda" : isGroom ? "Mempelai Pertama" : "Mempelai Kedua"
                          const slideshow = invIsSlideshowField(isGroom ? "groom_photo_url" : "bride_photo_url")
                          const nameHint = k ? "Nama panggilan ananda" : isGroom ? "Nama Mempelai Pertama" : "Nama Mempelai Kedua"
                          const fullHint = k ? "Nama lengkap ananda" : isGroom ? "Nama Lengkap Mempelai Pertama" : "Nama Lengkap Mempelai Kedua"
                          const parHint = isGroom ? "Contoh: Putra dari Bapak Hendra & Ibu Sari" : "Contoh: Putri dari Bapak Wijaya & Ibu Dewi"
                          const igHint = isGroom ? "Contoh: @amospurba" : "Contoh: @claudiamnrg"
                          return (
                            <div key={side} className="space-y-4">
                              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">{label}</label>
                              {slideshow ? (
                                <>
                                {/* Tanpa-photo: slideshow grid hidden, names stay */}
                                {invHasPersonPhotos && (
                                <div className="border border-outline-variant rounded p-2 bg-surface-container-lowest">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Slideshow (harus 2 foto)</span>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {[0, 1].map((i) => (
                                      <div key={i} className="relative">
                                        <InvPhotoBox url={urls[i] || ""} uploading={invUploading === upKey(i)} onFile={(f) => putUrl(i, f)} badge={i === 0 ? "a" : "b"} />
                                        {urls[i] && (
                                          <button type="button" onClick={() => setUrls(urls.filter((_: string, j: number) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center" title="Hapus foto ini">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                )}
                                </>
                              ) : (
                                <div className="flex gap-4 items-end">
                                  {/* Tanpa-photo: person photo hidden, names stay */}
                                  {invHasPersonPhotos && (
                                  <InvPhotoBox url={urls[0] || ""} uploading={invUploading === upKey(0)} onFile={(f) => putUrl(0, f)} />
                                  )}
                                  <div className="flex-1">
                                    <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={isGroom ? invForm.groom_name || "" : invForm.bride_name || ""} onChange={(v) => setInvForm({ ...invForm, [isGroom ? "groom_name" : "bride_name"]: v })} placeholder={nameHint} />
                                    <p className="text-[11px] text-on-surface-variant mt-1 italic">{nameHint}</p>
                                    <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] mt-3 resize-none overflow-hidden" value={isGroom ? invForm.groom_full_name || "" : invForm.bride_full_name || ""} onChange={(v) => setInvForm({ ...invForm, [isGroom ? "groom_full_name" : "bride_full_name"]: v })} placeholder={fullHint} />
                                    <p className="text-[11px] text-on-surface-variant mt-1 italic">{fullHint}</p>
                                  </div>
                                </div>
                              )}
                              {slideshow && (
                                <>
                                  <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" value={isGroom ? invForm.groom_name || "" : invForm.bride_name || ""} onChange={(v) => setInvForm({ ...invForm, [isGroom ? "groom_name" : "bride_name"]: v })} placeholder={nameHint} />
                                  <p className="text-[11px] text-on-surface-variant mt-1 italic">{nameHint}</p>
                                  <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] mt-3 resize-none overflow-hidden" value={isGroom ? invForm.groom_full_name || "" : invForm.bride_full_name || ""} onChange={(v) => setInvForm({ ...invForm, [isGroom ? "groom_full_name" : "bride_full_name"]: v })} placeholder={fullHint} />
                                  <p className="text-[11px] text-on-surface-variant mt-1 italic">{fullHint}</p>
                                </>
                              )}
                              <div className="mt-3">
                                <AutoTextarea className="input-editorial w-full font-headline-md text-[16px] resize-none overflow-hidden" value={isGroom ? invForm.groom_parents || "" : invForm.bride_parents || ""} onChange={(v) => setInvForm({ ...invForm, [isGroom ? "groom_parents" : "bride_parents"]: v })} placeholder={k ? "Bapak ... & Ibu ..." : isGroom ? "Nama Orang Tua Mempelai Pertama" : "Nama Orang Tua Mempelai Kedua"} />
                                <p className="text-[11px] text-on-surface-variant mt-1 italic">{parHint}</p>
                              </div>
                              <div className="mt-3">
                                <input className="input-editorial w-full font-headline-md text-[16px]" type="text" value={isGroom ? invForm.groom_instagram || "" : invForm.bride_instagram || ""} onChange={(e) => setInvForm({ ...invForm, [isGroom ? "groom_instagram" : "bride_instagram"]: e.target.value })} placeholder={k ? "Instagram (opsional)" : isGroom ? "Instagram Mempelai Pertama" : "Instagram Mempelai Kedua"} />
                                <p className="text-[11px] text-on-surface-variant mt-1 italic">{igHint}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      )
                    ) : (
                    <div>
                      <p className="font-display-lg text-2xl text-center text-primary">{resolveCoupleName(invitationData.profile)}</p>
                      {invitationData.profile.couple_initials && (
                        <p className="font-display-lg text-sm text-center text-secondary mt-1">{invitationData.profile.couple_initials}</p>
                      )}
                      {(() => {
                        const ananda = parseChildren(invitationData.profile.children)
                        if (ananda.length < 2) return null
                        return (
                          <div className="mt-4">
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 text-center">Daftar Ananda</p>
                            <ul className="space-y-1 text-center">
                              {ananda.map((child, i) => (
                                <li key={`${child.name || child.full_name}-${i}`} className="font-body-md text-sm">
                                  {child.full_name || child.name}
                                  {child.instagram && <span className="text-on-surface-variant"> · @{child.instagram}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })()}

                    {(() => {
                      const groomPhotos = photoList(invitationData.profile.groom_photo_url)
                      const bridePhotos = photoList(invitationData.profile.bride_photo_url)
                      if (groomPhotos.length === 0 && bridePhotos.length === 0) return null
                      const pslug = invitationData.profile?.slug || "photo"
                      return (
                        <div className="mt-4 space-y-3">
                          {groomPhotos.length > 0 && (
                            <div className="text-center">
                              <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">{profileView(invitationData.profile).kids ? "Foto Ananda" : "Foto Mempelai Pertama"}{groomPhotos.length > 1 ? " (Slideshow)" : ""}</p>
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
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">{profileView(invitationData.profile).kids ? "Ananda" : "Mempelai Pertama"}</p>
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
                  </InvAccordion>

                  <InvAccordion secKey="acara" icon="calendar_today" label="ACARA" {...invAccProps("acara")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-8">
                        {(invForm.sessions || []).map((session: any, i: number) => {
                          const setS = (patch: any) => setInvForm({ ...invForm, sessions: invForm.sessions.map((s: any, j: number) => (j === i ? { ...s, ...patch } : s)) })
                          return (
                            <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-6">
                              <div className="flex items-end justify-between gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Acara</label>
                                  <AutoTextarea
                                    className="input-editorial font-label-md text-[14px] font-bold w-full resize-none overflow-hidden"
                                    style={session.name ? { color: "#8D4D39" } : undefined}
                                    placeholder={i === 0 ? "Contoh: Akad Nikah / Pemberkatan" : "Contoh: Resepsi"}
                                    value={session.name || ""}
                                    onChange={(v) => setS({ name: v })}
                                  />
                                </div>
                                {(invForm.sessions || []).length > 1 && (
                                  <button type="button" onClick={() => setInvForm({ ...invForm, sessions: invForm.sessions.filter((_: any, j: number) => j !== i) })} className="text-red-500 hover:text-red-700 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                  <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Tanggal</label>
                                  <input className="input-editorial w-full font-label-md text-[14px]" type="date" value={session.date || ""} onChange={(e) => setS({ date: e.target.value })} />
                                </div>
                                <div className="col-span-1">
                                  <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Waktu</label>
                                  <input className="input-editorial w-full font-label-md text-[14px]" type="text" value={session.time || ""} onChange={(e) => setS({ time: e.target.value })} placeholder="08:00 - 10:00" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Nama Tempat</label>
                                <AutoTextarea className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden" value={session.venue || ""} onChange={(v) => setS({ venue: v })} placeholder="Nama venue atau lokasi" />
                              </div>
                              <div>
                                <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Alamat Lengkap</label>
                                <AutoTextarea className="input-editorial w-full font-label-md text-[14px] min-h-[60px] resize-none overflow-hidden" placeholder="Masukkan alamat lengkap..." value={session.address || ""} onChange={(v) => setS({ address: v })} />
                              </div>
                              <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <label className="text-[10px] text-on-surface-variant font-label-md uppercase block mb-1">Link Google Maps</label>
                                  <input className="input-editorial w-full font-label-md text-[14px]" placeholder="https://maps.google.com/..." type="text" value={session.maps_url || ""} onChange={(e) => setS({ maps_url: e.target.value })} />
                                </div>
                                <button type="button" onClick={() => { if (session.maps_url) window.open(session.maps_url, "_blank", "noopener,noreferrer") }} className="bg-secondary text-white rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all mb-2">UJI LINK</button>
                              </div>
                            </div>
                          )
                        })}
                        {(profileView(invitationData?.profile).kids || (invForm.sessions || []).length < 2) && (
                          <button type="button" onClick={() => setInvForm({ ...invForm, sessions: [...(invForm.sessions || []), { name: "", date: "", time: "", timezone: "WIB", venue: "", address: "", maps_url: "" }] })} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            TAMBAH SESI ACARA LAIN
                          </button>
                        )}
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
                    </div>
                    )}
                  </InvAccordion>

                  {/* Tanpa-photo: whole gallery section removed (photos-only) */}
                  {!invNoPhoto && (
                  <InvAccordion secKey="galeri" icon="photo_library" label="GALERI" {...invAccProps("galeri")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-8">
                        <div className="space-y-4">
                          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                            {invitationData.photo_quota == null ? "GALERI FOTO" : `GALERI FOTO (MAKS. ${invitationData.photo_quota} FOTO)`}
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {invForm.gallery_photos.map((url: string, i: number) => (
                              <div key={i} className="aspect-square bg-surface-dim border border-outline-variant relative group">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                                <button type="button" onClick={() => setInvForm({ ...invForm, gallery_photos: invForm.gallery_photos.filter((_: string, j: number) => j !== i) })} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            ))}
                            {invUploading === "galeri" && (
                              <div className="aspect-square border border-outline flex items-center justify-center bg-surface-dim">
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              </div>
                            )}
                            {(invitationData.photo_quota == null || invForm.gallery_photos.length < invitationData.photo_quota) && invUploading !== "galeri" && (
                              <label className="aspect-square border border-dashed border-outline flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-highest cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                <span className="text-[8px] font-bold mt-1">TAMBAH</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = e.target.files ? Array.from(e.target.files).filter((f) => f.type.startsWith("image/")) : []
                                    e.target.value = ""
                                    if (!files.length) return
                                    const quota = invitationData.photo_quota == null ? files.length : Math.max(0, invitationData.photo_quota - invForm.gallery_photos.length)
                                    for (const file of files.slice(0, quota)) {
                                      const url = await invUploadPhoto("galeri", file)
                                      if (url) setInvForm((prev: any) => ({ ...prev, gallery_photos: [...prev.gallery_photos, url] }))
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
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
                  </InvAccordion>
                  )}

                  <InvAccordion
                    secKey="inviting"
                    icon="group"
                    label="TURUT MENGUNDANG"
                    {...invAccProps("inviting")}
                  >
                    {invEditing && invForm && invSectionState(invitationData.profile, "inviting") !== "locked" ? (
                      <div className="mt-6 space-y-4">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Turut Mengundang"
                            checked={invForm.inviting_families_visible !== false}
                            onChange={() => setInvForm({ ...invForm, inviting_families_visible: invForm.inviting_families_visible === false })}
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant italic">Masukkan nama keluarga yang turut mengundang, pisahkan dengan enter</p>
                        <textarea
                          className="input-editorial w-full font-headline-md text-[16px] min-h-[120px] resize-none"
                          value={(Array.isArray(invForm.inviting_families) ? invForm.inviting_families : []).join("\n")}
                          onChange={(e) => {
                            if (e.target.value === "") {
                              setInvForm({ ...invForm, inviting_families: [] })
                            } else {
                              setInvForm({ ...invForm, inviting_families: e.target.value.split("\n") })
                            }
                          }}
                          onBlur={(e) => {
                            const arr = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                            setInvForm({ ...invForm, inviting_families: arr })
                          }}
                          placeholder={"Keluarga Bapak H. Sulaiman & Ibu Hj. Fatimah\nKeluarga Bapak Drs. Wijaya & Ibu Dra. Siti\nKeluarga Besar Kedua Mempelai"}
                          rows={4}
                        />
                      </div>
                    ) : invSectionState(invitationData.profile, "inviting") === "locked" ? (
                      <div className="mt-6"><InvLockedNotice availableIn={invAvailableIn(invitationData.profile, "inviting_families")} /></div>
                    ) : (
                    <div className="text-center">
                      {(Array.isArray(invitationData.profile.inviting_families) ? invitationData.profile.inviting_families.filter(Boolean) : []).map((f: string, i: number) => (
                        <p key={i} className="font-body-md text-[10px] italic text-on-surface-variant">Keluarga Besar {f}</p>
                      ))}
                    </div>
                    )}
                  </InvAccordion>

                  <InvAccordion secKey="kutipan" icon="format_quote" label="KUTIPAN" {...invAccProps("kutipan")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                          <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Pilih Kutipan Populer</label>
                          <select
                            className="input-editorial w-full font-body-md text-[14px] cursor-pointer"
                            value={invForm.quote_source || ""}
                            onChange={(e) => {
                              const source = e.target.value
                              if (source === "Ar-Rum: 21") {
                                setInvForm({ ...invForm, quote_text: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya; dan dijadikan-Nya diantaramu rasa kasih dan sayang.", quote_source: "QS. Ar-Rum: 21" })
                              } else if (source === "Matius 19:6") {
                                setInvForm({ ...invForm, quote_text: "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.", quote_source: "Matius 19:6" })
                              } else if (source === "Custom") {
                                setInvForm({ ...invForm, quote_text: "", quote_source: "" })
                              } else {
                                setInvForm({ ...invForm, quote_source: source })
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
                          <AutoTextarea
                            className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden"
                            value={invForm.quote_text || ""}
                            onChange={(v) => setInvForm({ ...invForm, quote_text: v })} minRows={4} />
                        </div>
                        <div className="space-y-2">
                          <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Sumber / Penulis</label>
                          <AutoTextarea
                            className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden"
                            value={invForm.quote_source || ""}
                            onChange={(v) => setInvForm({ ...invForm, quote_source: v })}
                          />
                        </div>
                      </div>
                    ) : (
                    <div className="text-center italic">
                        <p className="font-body-md text-sm leading-relaxed">&ldquo;{invitationData.profile.quote_text}&rdquo;</p>
                        {invitationData.profile.quote_source && (
                          <p className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">&mdash; {invitationData.profile.quote_source}</p>
                        )}
                    </div>
                    )}
                  </InvAccordion>

                  {/* Tanpa-photo: whole video section removed (mirrors editor) */}
                  {!invNoPhoto && (
                  <InvAccordion secKey="video" icon="movie" label="VIDEO" {...invAccProps("video")} omit={opsView.kids}>
                    {invEditing && invForm ? (
                      invSectionState(invitationData.profile, "video") === "locked" ? (
                        <div className="mt-6"><InvLockedNotice availableIn={invAvailableIn(invitationData.profile, "cinematic_video")} /></div>
                      ) : (
                        <div className="mt-6 space-y-4">
                          <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                            <InvSectionToggle
                              label="Tampilkan Video"
                              checked={invForm.video_section_visible !== false}
                              onChange={() => setInvForm({ ...invForm, video_section_visible: invForm.video_section_visible === false })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">URL Video (YouTube)</label>
                            <input
                              className="input-editorial w-full font-body-md text-[14px]"
                              type="url"
                              value={invForm.video_url || ""}
                              onChange={(e) => setInvForm({ ...invForm, video_url: normalizeVideoUrl(e.target.value) })}
                              onBlur={(e) => { const v = normalizeVideoUrl(e.target.value); if (v !== e.target.value) setInvForm({ ...invForm, video_url: v }) }}
                              placeholder="https://youtu.be/..."
                            />
                            <p className="text-[11px] text-on-surface-variant mt-1 italic">Tautan video (mis. "OUR FOOTAGE") yang tampil pada undangan.</p>
                          </div>
                        </div>
                      )
                    ) : (
                    <div>
                      <a href={invitationData.profile.video_url} target="_blank" rel="noopener noreferrer" className="font-body-md text-xs text-primary underline break-all">{invitationData.profile.video_url}</a>
                    </div>
                    )}
                  </InvAccordion>
                  )}

                  {/* Dress code is template-specific: only templates whose
                      content spec renders it show this accordion (mirrors editor). */}
                  {invContentSpec?.sections?.dresscode && (
                  <InvAccordion secKey="dresscode" icon="checkroom" label="DRESS CODE" {...invAccProps("dresscode")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Dress Code"
                            checked={invForm.dresscode_visible !== false}
                            onChange={() => handleToggleVisibility("dresscode_visible", invForm.dresscode_visible === false)}
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant italic">
                          Judul selalu "Dress Code". Deskripsi otomatis dari nama palet warna.
                        </p>
                        <div className="space-y-2">
                          <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">Palet Warna</label>
                          <div className="space-y-2">
                            {(invForm.dresscode?.colors || []).map((c: { hex?: string; name?: string }, i: number) => (
                              <div key={i} className="flex gap-2 items-center">
                                <button
                                  type="button"
                                  onClick={() => setInvColorEdit({ index: i, hex: c.hex || "#CCCCCC" })}
                                  className="relative h-9 w-10 shrink-0 rounded border border-outline-variant overflow-hidden"
                                  style={{ backgroundColor: c.hex || "#CCCCCC" }}
                                  title="Ubah kode warna"
                                  aria-label={`Ubah kode warna ${c.name || i + 1}`}
                                />
                                <AutoTextarea className="input-editorial flex-1 font-body-md text-[14px] resize-none overflow-hidden" value={c.name || ""} onChange={(v) => handleDresscodeColorNameChange(i, v)} placeholder="Nama warna (mis. Ivory)" />
                                <button onClick={() => handleDresscodeColorDelete(i)} className="text-red-500 hover:text-red-700">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            ))}
                            <button onClick={handleDresscodeColorAdd} className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-secondary font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container-low transition-colors">
                              + Tambah Warna
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-on-surface-variant italic mt-2">
                          Deskripsi otomatis: {invForm.dresscode?.description?.trim() ? invForm.dresscode.description : "Elegant Attire in " + (invForm.dresscode?.colors?.map((c: any) => c.name).filter(Boolean).join(", ") || "—")}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {(invitationData?.profile?.dresscode?.colors || []).length ? (
                          <div className="mt-6 space-y-4">
                            {(invitationData?.profile?.dresscode?.colors || []).map((c: any, i: number) => (
                              <div key={i} className="flex gap-2 items-center">
                                <span className="relative h-9 w-10 shrink-0 rounded border border-outline-variant overflow-hidden" style={{ backgroundColor: c.hex || "#CCCCCC" }} />
                                <span className="font-body-md text-sm">{c.name || `Warna ${i + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <p className="text-[11px] text-on-surface-variant italic mt-2">
                          Deskripsi otomatis: {invitationData?.profile?.dresscode?.description?.trim() ? invitationData.profile.dresscode.description : "Elegant Attire in " + ((invitationData?.profile?.dresscode?.colors || []).map((c: any) => c.name).filter(Boolean).join(", ") || "—")}
                        </p>
                      </div>
                    )}
                  </InvAccordion>
                  )}

                  {/* Live streaming is template-specific (mirrors editor). */}
                  {invContentSpec?.sections?.livestream && (
                  <InvAccordion secKey="livestream" icon="live_tv" label="LIVE STREAMING" {...invAccProps("livestream")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Live Streaming"
                            checked={invForm.livestream_visible !== false}
                            onChange={() => handleToggleVisibility("livestream_visible", invForm.livestream_visible === false)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-widest">URL Live Streaming</label>
                          <input
                            className="input-editorial w-full font-body-md text-[14px]"
                            type="url"
                            value={invForm.livestream?.url || ""}
                            onChange={(e) => handleLivestreamUrlChange(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          <p className="text-[11px] text-on-surface-variant mt-1 italic">
                            Tautan tayangan langsung. Judul, deskripsi, dan tombol mengikuti template.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {invitationData.profile.livestream?.url ? (
                          <div className="mt-6">
                            <a href={invitationData.profile.livestream.url} target="_blank" rel="noopener noreferrer" className="font-body-md text-sm text-primary underline break-all">
                              {invitationData.profile.livestream.url}
                            </a>
                            <p className="mt-2 text-sm text-on-surface-variant">Live Streaming tersedia</p>
                          </div>
                        ) : (
                          <p className="font-body-md text-xs italic text-on-surface-variant/70">Belum ada live streaming.</p>
                        )}
                      </div>
                    )}
                  </InvAccordion>
                  )}

                  {invContentSpec?.sections?.rundown && (
                  <InvAccordion secKey="rundown" icon="schedule" label="RUNDOWN ACARA" {...invAccProps("rundown")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Rundown Acara"
                            checked={invForm.rundown_visible !== false}
                            onChange={() => handleToggleVisibility("rundown_visible", invForm.rundown_visible === false)}
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant italic">
                          Susunan acara yang tampil di undangan. Kosongkan untuk menyembunyikan bagian ini.
                        </p>
                        {(invForm.rundown || []).map((item: any, i: number) => (
                          <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Rundown {i + 1}</span>
                              <button
                                type="button"
                                onClick={() => setInvForm({ ...invForm, rundown: (invForm.rundown || []).filter((_: any, index: number) => index !== i) })}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                            <input
                              className="input-editorial w-full font-label-md text-[14px]"
                              type="text"
                              value={item.time || ""}
                              onChange={(e) => setInvForm({ ...invForm, rundown: (invForm.rundown || []).map((row: any, index: number) => index === i ? { ...row, time: e.target.value } : row) })}
                              placeholder="Contoh: 11.30 pagi"
                            />
                            <AutoTextarea
                              className="input-editorial w-full font-label-md text-[14px] min-h-[60px] resize-none overflow-hidden"
                              value={item.description || ""}
                              onChange={(v) => setInvForm({ ...invForm, rundown: (invForm.rundown || []).map((row: any, index: number) => index === i ? { ...row, description: v } : row) })}
                              placeholder="Contoh: Tamu tiba ke venue"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setInvForm({ ...invForm, rundown: [...(invForm.rundown || []), { time: "", description: "" }] })}
                          className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          TAMBAH RUNDOWN
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {(invitationData?.profile?.rundown || []).length ? (
                          (invitationData?.profile?.rundown || []).map((item: any, i: number) => (
                            <div key={i} className="border-b border-outline-variant pb-3 last:border-0">
                              <p className="font-label-md text-sm font-bold text-secondary">{item.time || `Rundown ${i + 1}`}</p>
                              <p className="font-body-md text-xs text-on-surface-variant mt-1">{item.description || "—"}</p>
                            </div>
                          ))
                        ) : (
                          <p className="font-body-md text-xs italic text-on-surface-variant/70">Belum ada rundown acara.</p>
                        )}
                      </div>
                    )}
                  </InvAccordion>
                  )}

                  {invContentSpec?.sections?.contacts && (
                  <InvAccordion secKey="contacts" icon="contact_phone" label="HUBUNGI KAMI" {...invAccProps("contacts")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Kontak Keluarga"
                            checked={invForm.contacts_visible !== false}
                            onChange={() => handleToggleVisibility("contacts_visible", invForm.contacts_visible === false)}
                          />
                        </div>
                        <p className="text-[11px] text-on-surface-variant italic">
                          Kontak keluarga mempelai. Nomor WhatsApp dibuka melalui tautan wa.me.
                        </p>
                        {(invForm.contacts || []).map((contact: any, i: number) => (
                          <div key={i} className="bg-surface-container-low p-4 border border-outline-variant space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Kontak {i + 1}</span>
                              <button
                                type="button"
                                onClick={() => setInvForm({ ...invForm, contacts: (invForm.contacts || []).filter((_: any, index: number) => index !== i) })}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                            <AutoTextarea
                              className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden"
                              value={contact.name || ""}
                              onChange={(v) => setInvForm({ ...invForm, contacts: (invForm.contacts || []).map((row: any, index: number) => index === i ? { ...row, name: v } : row) })}
                              placeholder="Nama kontak"
                            />
                            <AutoTextarea
                              className="input-editorial w-full font-label-md text-[14px] resize-none overflow-hidden"
                              value={contact.description || ""}
                              onChange={(v) => setInvForm({ ...invForm, contacts: (invForm.contacts || []).map((row: any, index: number) => index === i ? { ...row, description: v } : row) })}
                              placeholder="Hubungan, mis. Keluarga Mempelai Pria"
                            />
                            <input
                              className="input-editorial w-full font-label-md text-[14px]"
                              type="text"
                              value={contact.whatsapp || ""}
                              onChange={(e) => setInvForm({ ...invForm, contacts: (invForm.contacts || []).map((row: any, index: number) => index === i ? { ...row, whatsapp: e.target.value } : row) })}
                              placeholder="Nomor WhatsApp, mis. +62 812 3456 7890"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setInvForm({ ...invForm, contacts: [...(invForm.contacts || []), { name: "", description: "", whatsapp: "" }] })}
                          className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          TAMBAH KONTAK
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {(invitationData?.profile?.contacts || []).length ? (
                          (invitationData?.profile?.contacts || []).map((contact: any, i: number) => (
                            <div key={i} className="border-b border-outline-variant pb-3 last:border-0">
                              <p className="font-label-md text-sm font-bold text-secondary">{contact.name || `Kontak ${i + 1}`}</p>
                              <p className="font-body-md text-xs text-on-surface-variant mt-1">{contact.description || "—"}</p>
                              {contact.whatsapp && <p className="font-body-md text-xs text-primary mt-1">{contact.whatsapp}</p>}
                            </div>
                          ))
                        ) : (
                          <p className="font-body-md text-xs italic text-on-surface-variant/70">Belum ada kontak keluarga.</p>
                        )}
                      </div>
                    )}
                  </InvAccordion>
                  )}


                  <InvAccordion secKey="story" icon="auto_stories" label="STORY" {...invAccProps("story")} omit={invitationData?.profile?.package_type === "ceriavite"}>
                    {invEditing && invForm && invSectionState(invitationData.profile, "story") !== "locked" ? (
                      <div className="mt-6 space-y-6">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Kisah Cinta"
                            checked={invForm.story_visible !== false}
                            onChange={() => setInvForm({ ...invForm, story_visible: invForm.story_visible === false })}
                          />
                        </div>
                        <div className="space-y-8">
                          <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block">CURATE YOUR LOVE STORY</label>
                          {(invForm.stories || []).map((story: any, i: number) => {
                            const setSt = (patch: any) => setInvForm({ ...invForm, stories: invForm.stories.map((s: any, j: number) => (j === i ? { ...s, ...patch } : s)) })
                            const upKey = `story-${i}`
                            return (
                              <div key={i} className="p-4 bg-surface-container-low border border-outline-variant space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-[10px] text-secondary uppercase">MILESTONE {i + 1}</span>
                                  <button type="button" onClick={() => setInvForm({ ...invForm, stories: invForm.stories.filter((_: any, j: number) => j !== i) })} className="text-red-500 hover:text-red-700 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </div>
                                <div className="flex gap-4">
                                  {/* Text-only story templates hide the milestone photo */}
                                  {invShowStoryPhoto && (
                                  <InvPhotoBox
                                    url={story.image_url || ""}
                                    uploading={invUploading === upKey}
                                    onFile={async (file) => {
                                      const url = await invUploadPhoto(upKey, file)
                                      if (url) setSt({ image_url: url })
                                    }}
                                  />
                                  )}
                                  <div className="flex-1 space-y-3">
                                    <input className="input-editorial w-full font-headline-md text-[18px]" placeholder="Tahun" type="text" value={story.year || ""} onChange={(e) => setSt({ year: e.target.value })} />
                                    <AutoTextarea className="input-editorial w-full font-headline-md text-[18px] resize-none overflow-hidden" placeholder="Judul Cerita" value={story.title || ""} onChange={(v) => setSt({ title: v })} />
                                  </div>
                                </div>
                                <AutoTextarea className="input-editorial w-full font-body-md text-[14px] resize-none overflow-hidden" placeholder="Ceritakan momen ini..." value={story.description || ""} onChange={(v) => setSt({ description: v })} minRows={2} />
                              </div>
                            )
                          })}
                          <button type="button" onClick={() => setInvForm({ ...invForm, stories: [...(invForm.stories || []), { year: "", title: "", description: "", image_url: "" }] })} className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            TAMBAH MILESTONE BARU
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div>
                      <div className="space-y-4">
                          {invitationData.profile.stories.map((st: any, i: number) => (
                            <div key={i} className="flex gap-4">
                              {invShowStoryPhoto && st.image_url && (
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
                  </InvAccordion>

                  <InvAccordion secKey="gift" icon="featured_seasonal_and_gifts" label="GIFT" {...invAccProps("gift")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-6">
                        <div className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                          <InvSectionToggle
                            label="Tampilkan Bagian Hadiah"
                            checked={invForm.gift_section_visible !== false}
                            onChange={() => setInvForm({ ...invForm, gift_section_visible: invForm.gift_section_visible === false })}
                          />
                        </div>
                        <div className="space-y-3">
                          <p className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Daftar Rekening / E-Wallet</p>
                          <InvGiftAccounts items={invForm.giftAccounts} onChange={(v) => setInvForm({ ...invForm, giftAccounts: v })} />
                        </div>
                        <div className="space-y-3">
                          <p className="font-label-md text-[11px] uppercase tracking-widest text-secondary">Alamat Pengiriman Kado</p>
                          {invitationData.profile?.package_gates?.gift_address?.included === false ? (
                            <InvLockedNotice availableIn={invAvailableIn(invitationData.profile, "gift_address")} />
                          ) : (
                            <div className="space-y-3">
                              <InvField label="Nama Penerima"><InvFreeText value={invForm.giftAddress.recipient_name} onChange={(v) => setInvForm({ ...invForm, giftAddress: { ...invForm.giftAddress, recipient_name: v } })} /></InvField>
                              <InvField label="Alamat Lengkap"><InvArea value={invForm.giftAddress.full_address} onChange={(v) => setInvForm({ ...invForm, giftAddress: { ...invForm.giftAddress, full_address: v } })} rows={3} /></InvField>
                            </div>
                          )}
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
                  </InvAccordion>

                  <InvAccordion secKey="music" icon="music_note" label="MUSIC" {...invAccProps("music")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        {invMusicUploadError && (
                          <p className="text-[11px] text-error font-medium">{invMusicUploadError}</p>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => invMusicFileRef.current?.click()}
                            disabled={invMusicUploading}
                            className="w-full py-3.5 bg-secondary text-white rounded-full font-label-md text-[11px] tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className={`material-symbols-outlined text-[18px] ${invMusicUploading ? "animate-spin" : ""}`}>
                              {invMusicUploading ? "progress_activity" : "upload_file"}
                            </span>
                            {invMusicUploading ? "Mengunggah..." : "Unggah MP3"}
                          </button>
                          <input
                            ref={invMusicFileRef}
                            type="file"
                            accept="audio/*,.mp3"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) invPickMusicFile(file)
                              e.target.value = ""
                            }}
                          />
                          <p className="text-[10px] text-on-surface-variant mt-2">
                            {invMyCustomTrack
                              ? "Punya 1 lagu unggahan. Unggah lagi akan mengganti lagu tersebut."
                              : "Maksimal 1 lagu unggahan. Lagu unggahan akan tampil di atas daftar."}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 border border-outline-variant">
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">search</span>
                          <input
                            className="bg-transparent border-none focus:ring-0 font-label-md text-label-md w-full text-on-surface"
                            placeholder="Cari lagu..."
                            value={invTrackSearch}
                            onChange={(e) => setInvTrackSearch(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar -mx-4 px-4">
                          {invSortedTracks
                            .filter((t) => t.title.toLowerCase().includes(invTrackSearch.toLowerCase()) || (t.artist && t.artist.toLowerCase().includes(invTrackSearch.toLowerCase())))
                            .map((track) => {
                              const isSelected = track.id === invForm.selected_track_id
                              const isMine = track.is_custom === true && track.uploaded_by === invProfileId && track.is_public !== true
                              return (
                                <div
                                  key={track.id}
                                  onClick={() => setInvForm({ ...invForm, selected_track_id: isSelected ? "" : track.id })}
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
                                        <span className="text-[10px] text-on-surface-variant">{subtitle}</span>
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
                          {invSortedTracks.filter((t) => t.title.toLowerCase().includes(invTrackSearch.toLowerCase()) || (t.artist && t.artist.toLowerCase().includes(invTrackSearch.toLowerCase()))).length === 0 && (
                            <p className="text-on-surface-variant font-body-md text-sm py-4 text-center">Tidak ada lagu ditemukan.</p>
                          )}
                        </div>
                      </div>
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
                  </InvAccordion>
                  {invExtraFields.length > 0 && (
                  <InvAccordion secKey="extras" icon="auto_awesome" label={invExtrasLabel} {...invAccProps("extras")}>
                    {invEditing && invForm ? (
                      <div className="mt-6 space-y-4">
                        <p className="text-[11px] text-on-surface-variant italic">
                          Copy khusus template {invTpl?.name}. Kosongkan untuk memakai teks bawaan.
                        </p>
                        {groupExtraFields(invExtraFields, normalizeLanguage(invForm?.language)).map((group) => {
                          const isOpen = openInvExtraGroup === group.section
                          return (
                            <div key={group.section} className="border border-outline-variant/40 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setOpenInvExtraGroup((prev) => (prev === group.section ? null : group.section))}
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
                                        value={invForm.template_content?.[field.key] || ""}
                                        onChange={(v) => handleTemplateContentChange(field.key, v)}
                                        placeholder={field.placeholder}
                                        minRows={field.rows ?? 1}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupExtraFields(invExtraFields, normalizeLanguage(invForm?.language)).map((group) => {
                          const isOpen = openInvExtraGroup === group.section
                          return (
                            <div key={group.section} className="border border-outline-variant/40 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setOpenInvExtraGroup((prev) => (prev === group.section ? null : group.section))}
                                className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container transition-colors"
                              >
                                <span className="font-label-md text-[11px] uppercase tracking-widest text-secondary">{group.label}</span>
                                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{isOpen ? "expand_less" : "expand_more"}</span>
                              </button>
                              {isOpen && (
                                <div className="px-3 py-3 space-y-2 bg-white">
                                  {group.fields.map((field) => (
                                    <div key={field.key} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-outline-variant/20 pb-2 text-sm">
                                      <span className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant">{field.label}</span>
                                      <span className="font-body-md break-words whitespace-pre-line">{invitationData?.profile?.template_content?.[field.key] || "—"}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </InvAccordion>
                  )}

                  {invitationData.template ? (
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
                          <div className="min-w-0">
                            <p className="font-body-md text-sm font-semibold">{invitationData.template.name}</p>
                            {invitationData.template.description && (
                              <p className="font-body-md text-[10px] text-on-surface-variant mt-0.5">{invitationData.template.description}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openTplPicker}
                          className="mt-3 w-full py-2.5 rounded-full border border-outline-variant font-label-md text-[11px] uppercase tracking-widest text-on-surface hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                          Ganti Template
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-t border-outline-variant/40" />
                      <div>
                        <h4 className="font-label-md text-[9px] uppercase tracking-widest text-secondary mb-3">Template</h4>
                        <p className="font-body-md text-xs italic text-on-surface-variant/70 mb-3">Belum dipilih.</p>
                        <button
                          type="button"
                          onClick={openTplPicker}
                          className="w-full py-2.5 rounded-full bg-secondary text-white font-label-md text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Pilih Template
                        </button>
                      </div>
                    </>
                  )}

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

      {invConfirmOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setInvConfirmOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">save</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Simpan Perubahan?</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Pastikan data berikut sudah benar. Setelah disimpan, undangan langsung disinkronkan ke WordPress.
              </p>
              <div className="w-full max-h-40 overflow-y-auto rounded-xl bg-surface-container-low border border-outline-variant p-3 text-left">
                {invPendingChanges.map((c, i) => (
                  <p key={i} className="font-body-md text-[13px] text-on-surface flex items-start gap-2 py-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5 shrink-0">check</span>
                    {c}
                  </p>
                ))}
              </div>
              <div className="flex gap-2 w-full mt-1">
                <button
                  onClick={() => setInvConfirmOpen(false)}
                  className="flex-1 border border-outline-variant text-on-surface-variant py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmInvSave}
                  className="flex-1 bg-secondary text-white py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invMusicConfirmOpen && (
        <div className="fixed inset-0 z-[305] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={invCancelMusicReplace}>
          <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">music_note</span>
            <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Ganti Lagu?</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Upload hanya mendukung satu lagu. Lagu yang sudah diunggah sebelumnya akan dihapus dan digantikan dengan lagu yang baru.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={invConfirmMusicReplace}
                className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                Ganti &amp; Upload
              </button>
              <button
                type="button"
                onClick={invCancelMusicReplace}
                className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {invSyncing && (
        <div className="fixed inset-0 z-[310] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl max-w-xs w-full">
            <span className="w-10 h-10 border-[3px] border-secondary border-t-transparent rounded-full animate-spin" />
            <p className="font-label-md text-sm text-primary text-center">{invSyncMsg || "Menyimpan & menyinkronkan..."}</p>
            <p className="font-body-md text-xs text-on-surface-variant text-center">Mohon tunggu, jangan tutup halaman ini.</p>
          </div>
        </div>
      )}

      {invTplOpen && (
        <div className="fixed inset-0 z-[320] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { if (!invTplWorking) setInvTplOpen(false) }}>
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
              <h3 className="font-headline-md text-lg font-medium text-primary">Pilih Template</h3>
              <button onClick={() => { if (!invTplWorking) setInvTplOpen(false) }} className="p-2 hover:bg-surface-container-low transition-colors" aria-label="Tutup">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {invTplLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : invTplList.length === 0 ? (
                <p className="font-body-md text-sm text-on-surface-variant text-center py-8">Tidak ada template tersedia.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {invTplList.map((tpl: any) => {
                    const isCurrent = tpl.id === invitationData.template?.id
                    const pkg = invitationData.profile?.package_type || ""
                    const eligible = !Array.isArray(tpl.package_eligibility) || tpl.package_eligibility.length === 0 || (pkg && tpl.package_eligibility.includes(pkg))
                    const working = invTplWorking === tpl.id
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={!!invTplWorking}
                        onClick={() => selectInvTemplate(tpl)}
                        className={`relative text-left border rounded-xl overflow-hidden transition-all disabled:opacity-60 ${isCurrent ? "border-secondary ring-1 ring-secondary" : "border-outline-variant hover:border-secondary"}`}
                      >
                        {tpl.preview_image_url ? (
                          <img src={tpl.preview_image_url} alt={tpl.name} className="w-full aspect-[3/4] object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-surface-dim flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant">image</span>
                          </div>
                        )}
                        <div className="p-2.5">
                          <p className="font-body-md text-[13px] font-semibold truncate">{tpl.name}</p>
                          <p className="font-label-md text-[9px] uppercase tracking-widest text-on-surface-variant mt-0.5">
                            {tpl.source_type === "inhouse" ? "In-house" : "WordPress"}{tpl.category ? ` • ${tpl.category}` : ""}
                          </p>
                          {!eligible && (
                            <p className="font-label-md text-[9px] uppercase tracking-widest text-amber-700 mt-1">Di luar paket</p>
                          )}
                        </div>
                        {isCurrent && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-secondary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[11px]">check</span>
                            Saat Ini
                          </span>
                        )}
                        {working && (
                          <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {invTplBlocked && (() => {
        const pkg = invitationData?.profile?.package_type || ""
        const elig = Array.isArray(invTplBlocked.package_eligibility) ? invTplBlocked.package_eligibility : []
        const min = lowestEligiblePackage(elig)
        const minLabel = min ? packageDisplayName(min) : elig.length > 0 ? packageDisplayName(elig[0]) : "tertentu"
        return (
          <UpgradePackageModal
            open
            showClose
            hideSecondary
            zIndexClass="z-[340]"
            onClose={() => setInvTplBlocked(null)}
            onCta={() => setInvTplBlocked(null)}
            content={{
              title: invTplBlocked.name,
              lockLabel: "Di Luar Paket",
              benefits: [
                `Paket pelanggan saat ini: ${pkg ? packageDisplayName(pkg) : "-"}`,
                `Template tersedia mulai dari ${minLabel}`,
              ],
              eligiblePackages: elig.map((c: string) => packageDisplayName(c)),
              cta: "Mengerti",
            }}
          />
        )
      })()}

      {showFbPayGate && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFbPayGate(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-2xl">payments</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Khusus Sudah Bayar</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Fitur feedback hanya tersedia untuk undangan dengan status pembayaran <span className="font-semibold text-on-surface">Sudah Bayar</span>. Selesaikan pembayaran couple terlebih dahulu untuk menambah feedback.
              </p>
              <button
                onClick={() => setShowFbPayGate(false)}
                className="w-full bg-primary text-on-primary py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {showVipModal && (        <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVipModal(false)}>
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
