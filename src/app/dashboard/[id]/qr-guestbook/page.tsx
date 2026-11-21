"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { ASSETS } from "@/lib/assets"
import ProfileMenu from "@/components/ProfileMenu"
import UpgradePackageModal from "@/components/UpgradePackageModal"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import { profileView } from "@/lib/profileView"
import { MSG_CATEGORIES, MSG_TEMPLATES, MSG_VARS, MsgCategory, cleanMessageForCell, isValidMsgCategory, renderMessage } from "@/lib/messageTemplates"
import { FALLBACK_GUEST_SLUG, FALLBACK_GUEST_NAME, slugifyName } from "@/lib/guest-slug"
import { paymentWaLink } from "@/lib/contact"
import { resolveCoupleName } from "@/lib/coupleName"
import { normalizePhone } from "@/lib/packages"
import { coupleUrl } from "@/lib/coupleUrl"
import { isInvitedToAll, sessionDisplayLabel } from "@/lib/invitedSessions"

type Guest = {
  id: string
  name: string
  phone_number: string | null
  table_number: string | null
  category: string | null
  qr_token: string | null
  slug: string | null
  is_checked_in: boolean
  checkin_timestamp: string | null
  souvenir_claimed: boolean
  added_manually?: boolean
  is_vip?: boolean
  wa_invite_clicked_at?: string | null
  invited_session_indexes?: number[] | null
}

type Profile = {
  event_type?: string | null
  groom_parents?: string | null
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  is_published: boolean
  package_type?: string | null
  galeri_tier?: string | null
  slug: string
  bride_name: string
  groom_name: string
  bride_full_name?: string | null
  groom_full_name?: string | null
  estimated_wedding_date: string | null
  estimated_guest_count: number | null
  guest_link_strict?: boolean | null
  total_project_cost?: number | null
  voucher_code?: string | null
  voucher_discount?: number | null
  sessions?: any[] | null
}

type Stats = {
  total: number
  with_token: number
  with_link: number
  checked_in: number
}

function formatTableBadge(raw: string | null): string {
  if (!raw) return ""
  const t = raw.trim()
  if (/^meja\s+/i.test(t)) return t.replace(/^meja\s+/i, "MEJA ").toUpperCase()
  return `MEJA ${t.toUpperCase()}`
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function MessagePreview({ text, guestName, coupleName, guestUrl }: { text: string; guestName: string; coupleName: string; guestUrl: string }) {
  const parts = (text || "").split(/(\{[^}]+\})/g)
  return (
    <div className="rounded-2xl bg-[#EFEAE2] border border-[#E2D9CF] p-4">
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E2D9CF]/70">
        <span className="flex items-center gap-1.5 font-label-md text-[10px] uppercase tracking-widest text-[#B34E3F] font-bold">
          <span className="material-symbols-outlined text-[14px]">chat</span>
          WhatsApp
        </span>
        <span className="flex items-center gap-1.5 text-[9px] font-label-md uppercase tracking-widest text-on-surface-variant/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> Simulasi
        </span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm border border-[#E2D9CF] px-4 py-3 text-[13px] leading-relaxed text-[#2C2A29] whitespace-pre-wrap break-words shadow-sm">
        {parts.map((part, i) => {
          if (!part) return null
          const matched = MSG_VARS.find((v) => v.tag === part)
          if (!matched) return <span key={i}>{part}</span>
          const value =
            part === "{Nama Tamu}" ? guestName
              : part === "{Nama Pasangan}" ? coupleName
                : guestUrl
          return (
            <mark key={i} className="bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded-md font-semibold break-all">
              {value}
            </mark>
          )
        })}
      </div>
    </div>
  )
}

function GuestCard({ guest, slug, onCopyQr, onCopyUndangan, onCopyMessage, onSendWa, copiedId, copiedKind, gated, isFirstGuest, onBlockedClick, isUnpaid, qrCodeBook, setShowLimitModal, sessions }: {
  guest: Guest
  slug: string
  onCopyQr: (token: string, slug: string | null) => void
  onCopyUndangan: (guest: Guest) => void
  onCopyMessage: (guest: Guest) => void
  onSendWa: (guest: Guest) => void
  copiedId: string | null
  copiedKind: "qr" | "undangan" | "pesan" | null
  gated: boolean
  isFirstGuest: boolean
  onBlockedClick: () => void
  isUnpaid?: boolean
  qrCodeBook: boolean
  setShowLimitModal: (open: boolean) => void
  sessions: any[]
}) {
  const hasToken = !!guest.qr_token
  const hasLink = !!guest.qr_token || !!guest.slug
  const canSendWa = hasLink
  const isWaClicked = !!guest.wa_invite_clicked_at
  const isCopiedQr = copiedId === guest.id && copiedKind === "qr"
  const isCopiedUndangan = copiedId === guest.id && copiedKind === "undangan"
  const isCopiedMessage = copiedId === guest.id && copiedKind === "pesan"

  const blocked = isUnpaid || gated
  const tableBadge = formatTableBadge(guest.table_number)
  const blockedText = isUnpaid ? "Selesaikan Pembayaran" : "Kunci — Lengkapi Undangan"

  return (
    <div className="bg-white border border-[#E2D9CF] hover:border-[#E2D9CF] rounded-xl p-4 shadow-sm transition-all duration-200 flex flex-col gap-3 group">
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <h2 className="font-headline-md text-[16px] md:text-lg font-medium text-[#2C2A29] truncate min-w-0 max-w-full">{guest.name}</h2>
            {guest.is_vip && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#C5A059] text-[#8B6F2A] font-label-md text-[10px] uppercase tracking-wider rounded-full shrink-0">
                <span className="material-symbols-outlined text-[11px]">star</span>
                VIP
              </span>
            )}
          </div>
          {guest.phone_number && (
            <p className="font-body-md text-xs text-on-surface-variant tracking-wide">{guest.phone_number}</p>
          )}
          {guest.added_manually && (
            <span className="inline-flex items-center self-start px-2 py-0.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-label-md text-[9px] uppercase tracking-wider rounded-full">
              Manual
            </span>
          )}
          {sessions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {isInvitedToAll(guest.invited_session_indexes ?? null, sessions.length) ? (
                <span className="inline-flex items-center px-2 py-0.5 bg-[#EDE9FE] border border-[#C4B5FD] text-[#5B21B6] font-label-md text-[10px] rounded-full">
                  Semua acara
                </span>
              ) : (
                (Array.isArray(guest.invited_session_indexes) ? guest.invited_session_indexes : []).map((idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-[#EDE9FE] border border-[#C4B5FD] text-[#5B21B6] font-label-md text-[10px] rounded-full">
                    {sessionDisplayLabel(sessions[idx], idx)}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {tableBadge && (
            <span className="inline-flex items-center px-2.5 py-1 bg-[#E5E7EB] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] font-semibold tracking-wider rounded-full">
              {tableBadge}
            </span>
          )}
          {hasLink ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="font-label-md text-[10px] uppercase font-bold tracking-wider text-[#10B981]">AKTIF</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E2D9CF]" />
              <span className="font-label-md text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF]">BELUM</span>
            </div>
          )}
        </div>
      </div>

      {blocked ? (
        <button
          type="button"
          onClick={onBlockedClick}
          className="bg-[#F3F4F6] border border-[#E2D9CF] rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 text-[11px] font-label-md uppercase tracking-wider text-[#9CA3AF] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">lock</span>
          {blockedText}
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          <button
            onClick={() => {
              if (canSendWa) onSendWa(guest)
            }}
            disabled={!canSendWa}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[52px] font-label-md text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-center leading-tight transition-all active:scale-95 disabled:opacity-40"
          >
            <span className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isWaClicked ? "bg-emerald-50 ring-1 ring-emerald-300 text-emerald-600" : canSendWa ? "text-[#25D366]" : "text-[#9CA3AF]"}`}>
              <WhatsAppIcon className="w-[22px] h-[22px]" />
            </span>
            <span className={isWaClicked ? "text-emerald-700" : canSendWa ? "text-[#2C2A29]" : "text-[#9CA3AF]"}>
              Kirim WA
            </span>
          </button>
          <button
            onClick={() => {
              const hasSlug = !!guest.slug
              if (hasSlug) onCopyMessage(guest)
            }}
            disabled={!guest.slug}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[52px] font-label-md text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-center leading-tight transition-all active:scale-95 disabled:opacity-40"
          >
            <span className={`material-symbols-outlined text-[22px] ${guest.slug ? (isCopiedMessage ? "text-emerald-600" : "text-[#B34E3F]") : "text-[#9CA3AF]"}`}>{isCopiedMessage ? "check" : "mail"}</span>
            <span className={guest.slug ? (isCopiedMessage ? "text-emerald-700" : "text-[#2C2A29]") : "text-[#9CA3AF]"}>{isCopiedMessage ? "Tersalin" : "Pesan"}</span>
          </button>
          <button
            onClick={() => {
              const hasSlug = !!guest.slug
              if (hasSlug) onCopyUndangan(guest)
            }}
            disabled={!guest.slug}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[52px] font-label-md text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-center leading-tight transition-all active:scale-95 disabled:opacity-40"
          >
            <span className={`material-symbols-outlined text-[22px] ${guest.slug ? (isCopiedUndangan ? "text-emerald-600" : "text-[#2C2A29]") : "text-[#9CA3AF]"}`}>{isCopiedUndangan ? "check" : "link"}</span>
            <span className={guest.slug ? (isCopiedUndangan ? "text-emerald-700" : "text-[#2C2A29]") : "text-[#9CA3AF]"}>{isCopiedUndangan ? "Tersalin" : "Undangan"}</span>
          </button>
          <button
            onClick={() => {
              if (qrCodeBook) {
                hasToken && onCopyQr(guest.qr_token!, guest.slug)
              } else {
                setShowLimitModal(true)
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[52px] font-label-md text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-center leading-tight transition-all active:scale-95"
          >
            <span className={`material-symbols-outlined text-[22px] ${qrCodeBook ? (hasToken ? (isCopiedQr ? "text-emerald-600" : "text-[#2C2A29]") : "text-[#9CA3AF]") : "text-[#B34E3F]"}`}>{isCopiedQr ? "check" : "qr_code_2"}</span>
            <span className={qrCodeBook ? (isCopiedQr ? "text-emerald-700" : "text-[#2C2A29]") : "text-[#2C2A29]"}>{isCopiedQr ? "Tersalin" : "QR"}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function QrGuestbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, with_token: 0, with_link: 0, checked_in: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedKind, setCopiedKind] = useState<"qr" | "undangan" | "pesan" | null>(null)
  const [msgCategory, setMsgCategory] = useState<MsgCategory>("nasional")
  const [msgText, setMsgText] = useState<string>(MSG_TEMPLATES.nasional)
  const msgTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateView, setTemplateView] = useState<"edit" | "preview">("edit")
  const [exporting, setExporting] = useState(false)
  const [qrCodeBook, setQrCodeBook] = useState(true)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [hasUnresolvedFeedback, setHasUnresolvedFeedback] = useState(false)
  const [linkStrict, setLinkStrict] = useState(false)
  const [linkSaving, setLinkSaving] = useState(false)
  const [showLinkInfo, setShowLinkInfo] = useState(false)
  const [genericCopied, setGenericCopied] = useState<"link" | "msg" | null>(null)

  const fetchData = async () => {
    try {
      const [profileRes, guestsRes] = await Promise.all([
        fetch(`/api/dashboard/${id}`),
        fetch(`/api/dashboard/${id}/qr-guestbook`),
      ])
      if (!profileRes.ok || !guestsRes.ok) return
      const profileData = await profileRes.json()
      const guestsData = await guestsRes.json()
      setProfile(profileData.profile)
      if (profileData.profile?.guest_link_strict === false) {
        setLinkStrict(false)
      } else {
        setLinkStrict(true)
      }
      // Resolve the category from the profile we just loaded (not from state,
      // which is still empty here). A Ceriavite profile always gets the kids
      // template, whatever wedding category was saved before.
      const kidsHere = profileView(profileData.profile).kids
      const savedCat = profileData.profile?.message_category
      const resolvedCat: MsgCategory = kidsHere
        ? "khitanan"
        : savedCat && MSG_CATEGORIES.some((c) => c.id === savedCat)
          ? (savedCat as MsgCategory)
          : "nasional"
      setMsgCategory(resolvedCat)
      setMsgText(MSG_TEMPLATES[resolvedCat])
      if (profileData.feature_set && Array.isArray(profileData.feature_set)) {
        setQrCodeBook(profileData.feature_set.includes("qr_code_book"))
      }
      setGuests(guestsData.guests)
      setStats(guestsData.stats)
    } catch {}
  }

  useEffect(() => {
    setLoading(true)
    fetchData().finally(() => setLoading(false))
  }, [id])

  // Product tour: auto-expand the message template when its step is active.
  useEffect(() => {
    const open = () => setTemplateOpen(true)
    window.addEventListener("tour_open_template", open)
    return () => window.removeEventListener("tour_open_template", open)
  }, [])

  useEffect(() => {
    fetch(`/api/feedback-submissions?wedding_profile_id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        const list = res?.submissions || []
        setHasUnresolvedFeedback(list.some((s: any) => s.status !== "resolved"))
      })
      .catch(() => setHasUnresolvedFeedback(false))
  }, [id])

  const gated = !!profile && profile.payment_status !== "UNPAID" && profile.is_published !== true
  const firstGuestId = guests[0]?.id || null

  const handleLinkMode = async (strict: boolean) => {
    if (strict === linkStrict || linkSaving) return
    setLinkStrict(strict)
    setLinkSaving(true)
    try {
      const res = await fetch(`/api/dashboard/${id}/qr-guestbook`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_link_strict: strict }),
      })
      if (!res.ok) {
        setLinkStrict(!strict)
        alert("Gagal menyimpan. Silakan coba lagi.")
      }
    } catch {
      setLinkStrict(!strict)
      alert("Gagal menyimpan. Silakan coba lagi.")
    } finally {
      setLinkSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const body = gated ? JSON.stringify({ guest_id: firstGuestId }) : undefined
      const res = await fetch(`/api/dashboard/${id}/qr-guestbook`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      })
      const data = await res.json()
      if (res.ok) {
        await fetchData()
        if (data.message) alert(data.message)
      } else {
        alert(data.error || "Gagal generate QR")
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyQr = async (token: string, slug: string | null) => {
    if (!profile) return
    if (!qrCodeBook) {
      setShowLimitModal(true)
      return
    }
    const url = coupleUrl(profile.slug, `/qr/${encodeURIComponent(slug || token || "")}`)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(guests.find(g => g.qr_token === token)?.id || null)
      setCopiedKind("qr")
      setTimeout(() => { setCopiedId(null); setCopiedKind(null) }, 2000)
    } catch {}
  }

  // Always hand out a slug-shaped ?to=. A guest row without a generated slug
  // (unpaid profile / QR-only row) would otherwise put the raw display name in
  // the URL, and a name containing "/" breaks the WP guestbook + RSVP.
  const guestLinkParam = (guest: Guest) => guest.slug || slugifyName(guest.name)

  const handleCopyUndangan = async (guest: Guest) => {
    if (!profile) return
    const url = guest.qr_token && !guest.slug
      ? coupleUrl(profile.slug, `/w/${encodeURIComponent(profile.slug)}?to=${encodeURIComponent(guestLinkParam(guest))}&qr_token=${encodeURIComponent(guest.qr_token)}`)
      : coupleUrl(profile.slug, `/?to=${encodeURIComponent(guestLinkParam(guest))}`)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(guest.id)
      setCopiedKind("undangan")
      setTimeout(() => { setCopiedId(null); setCopiedKind(null) }, 2000)
    } catch {}
  }

  const guestQrUrl = (guest: Guest) =>
    guest.qr_token
      ? coupleUrl(profile?.slug || "", `/qr/${encodeURIComponent(guest.slug || guest.qr_token)}`)
      : ""

  const guestUndanganUrl = (guest: Guest) => {
    if (!profile) return ""
    return guest.qr_token && !guest.slug
      ? coupleUrl(profile.slug, `/w/${encodeURIComponent(profile.slug)}?to=${encodeURIComponent(guestLinkParam(guest))}&qr_token=${encodeURIComponent(guest.qr_token)}`)
      : guest.slug || guest.qr_token
      ? coupleUrl(profile.slug, `/?to=${encodeURIComponent(guestLinkParam(guest))}`)
      : ""
  }

  const view = profileView(profile)
  const coupleName = profile
    ? view.kids
      ? ((profile.groom_parents || "").trim() || (profile.groom_full_name || "").trim() || resolveCoupleName(profile))
      : resolveCoupleName(profile)
    : ""

  const genericUndanganUrl = profile
    ? coupleUrl(profile.slug, `/?to=${encodeURIComponent(FALLBACK_GUEST_SLUG)}`)
    : ""

  const handleCopyGeneric = async (kind: "link" | "msg") => {
    if (!profile) return
    if (isUnpaid || gated) return
    const text = kind === "link"
      ? genericUndanganUrl
      : renderMessage(msgText, FALLBACK_GUEST_NAME, coupleName, genericUndanganUrl)
    try {
      await navigator.clipboard.writeText(text)
      setGenericCopied(kind)
      setTimeout(() => setGenericCopied(null), 2000)
    } catch {}
  }

  const handleCopyMessage = async (guest: Guest) => {
    if (!profile) return
    const message = renderMessage(msgText, guest.name, coupleName, guestUndanganUrl(guest))
    try {
      await navigator.clipboard.writeText(message)
      setCopiedId(guest.id)
      setCopiedKind("pesan")
      setTimeout(() => { setCopiedId(null); setCopiedKind(null) }, 2000)
    } catch {}
  }

  const handleSendWa = (guest: Guest) => {
    if (!profile) return
    const inviteUrl = guestUndanganUrl(guest)
    if (!inviteUrl) return

    const message = renderMessage(msgText, guest.name, coupleName, inviteUrl)
    const phone = normalizePhone(guest.phone_number || "").replace(/\D/g, "")
    const href = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    const previousClickedAt = guest.wa_invite_clicked_at ?? null
    const clickedAt = new Date().toISOString()

    setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, wa_invite_clicked_at: clickedAt } : g))
    window.open(href, "_blank", "noopener,noreferrer")

    void fetch(`/api/dashboard/${id}/qr-guestbook/wa-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: guest.id }),
      keepalive: true,
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to save WhatsApp click")
    }).catch(() => {
      setGuests(prev => prev.map(g =>
        g.id === guest.id && g.wa_invite_clicked_at === clickedAt
          ? { ...g, wa_invite_clicked_at: previousClickedAt }
          : g
      ))
    })
  }

  const handlePrintQr = () => {
    if (isUnpaid) {
      window.open(payLink(), "_blank")
      return
    }
    if (gated) {
      setShowConfirmModal(true)
      return
    }
    if (!qrCodeBook) {
      setShowLimitModal(true)
      return
    }
    if (!guests.some(g => g.qr_token)) {
      alert("Generate QR tamu terlebih dahulu.")
      return
    }
    window.open(`/qr-print/${id}?autoprint=1`, "_blank", "noopener,noreferrer")
  }

  const selectMsgCategory = (cat: MsgCategory) => {
    setMsgCategory(cat)
    setMsgText(MSG_TEMPLATES[cat])
    fetch(`/api/dashboard/${id}/message-template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat }),
    }).catch(() => {})
  }

  const insertMsgVar = (tag: string) => {
    const el = msgTextareaRef.current
    if (!el) {
      setMsgText((t) => (t ? `${t}\n${tag}` : tag))
      return
    }
    const start = el.selectionStart ?? msgText.length
    const end = el.selectionEnd ?? msgText.length
    const next = msgText.slice(0, start) + tag + msgText.slice(end)
    setMsgText(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + tag.length
      el.setSelectionRange(pos, pos)
    })
  }

  const demoGuest = guests[0]
  const demoGuestName = demoGuest?.name || "Nama Tamu"
  const demoGuestUrl = demoGuest ? guestUndanganUrl(demoGuest) : "https://aksaraa.com/undangan"

  const handleExportExcel = async () => {
    if (!profile || guests.length === 0) return
    if (isUnpaid) {
      window.open(payLink(), "_blank")
      return
    }
    if (gated) {
      setShowConfirmModal(true)
      return
    }
    setExporting(true)
    try {
      const header = qrCodeBook
        ? ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Pesan WhatsApp", "Tautan QR", "Tautan Undangan", "Sumber"]
        : ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Pesan WhatsApp", "Tautan Undangan", "Sumber"]
      const rows = guests.map((g) => {
        const raw = g.slug || g.qr_token ? renderMessage(msgText, g.name, coupleName, guestUndanganUrl(g)) : ""
        // Keep multi-line formatting, but guard against any literal ASCII quotes that
        // would trigger Excel/RFC-4180 quoting on copy (strip edge quotes, smarten inner).
        const msg = cleanMessageForCell(raw)
        return qrCodeBook
          ? [g.name, g.phone_number || "", g.category || "", g.table_number || "", msg, guestQrUrl(g), guestUndanganUrl(g), g.added_manually ? "Ditambahkan Manual" : "Undangan QR"]
          : [g.name, g.phone_number || "", g.category || "", g.table_number || "", msg, guestUndanganUrl(g), g.added_manually ? "Ditambahkan Manual" : "Undangan QR"]
      })
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = qrCodeBook
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
        const undRef = XLSX.utils.encode_cell({ r: r - 1, c: qrCodeBook ? 6 : 5 })
        const undVal = ws[undRef]?.v
        if (undVal) ws[undRef].l = { Target: String(undVal), Tooltip: String(undVal) }
        if (qrCodeBook) {
          const qrRef = XLSX.utils.encode_cell({ r: r - 1, c: 5 })
          const qrVal = ws[qrRef]?.v
          if (qrVal) ws[qrRef].l = { Target: String(qrVal), Tooltip: String(qrVal) }
        }
      }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Tautan & QR Tamu")
      XLSX.writeFile(wb, "tautan-qr-tamu.xlsx")
    } finally {
      setExporting(false)
    }
  }

  const isUnpaid = profile?.payment_status === "UNPAID"
  const blocked = isUnpaid || gated
  const blockedText = isUnpaid ? "Selesaikan Pembayaran" : "Kunci — Lengkapi Undangan"
  // total_project_cost already has the voucher discount applied.
  const finalAmount = Math.max(0, Number(profile?.total_project_cost) || 0)
  const payLink = () => paymentWaLink({ packageType: profile?.package_type, galeriTier: profile?.galeri_tier, amount: finalAmount > 0 ? finalAmount : null })
  const handleBlockedClick = () => {
    if (isUnpaid) {
      window.open(payLink(), "_blank")
    } else {
      setShowConfirmModal(true)
    }
  }
  const withSlug = guests.filter((g) => !!g.slug).length
  const allHaveSlugs = stats.total > 0 && withSlug >= stats.total
  const gatedGenerate = !isUnpaid && stats.total > 0 && !allHaveSlugs
  const filtered = guests.filter((g) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.name.toLowerCase().includes(q) ||
      (g.phone_number || "").includes(q) ||
      (g.table_number || "").toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen font-body-md text-on-surface antialiased flex flex-col overflow-hidden" style={DASH_SATIN_BG}>
      {/* Background Texture */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] select-none">
        <img
          src={ASSETS.qrGuestbook.bg}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <header className="shrink-0 border-b border-[#E2D9CF] px-6 md:px-12 py-4" style={DASH_HERO_BG}>
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push(`/dashboard/${id}`)} aria-label="Kembali ke dasbor" className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container transition-colors shrink-0">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="inline-flex items-center gap-2 text-[#2C2A29] font-label-md text-[11px] uppercase tracking-wider font-bold truncate">
              Tautan Undangan dan QR Tamu
            </span>
          </div>
          <ProfileMenu />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-6 pt-6 pb-32 md:pb-16">
          <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-[#2C2A29]">
            Tautan Undangan dan QR Tamu
          </h1>

          {/* Horizontal Action Bar */}
          <section className="mt-5 bg-white border border-[#E2D9CF] rounded-xl p-2 sm:p-3 flex flex-row items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-[#F3F4F6] border border-[#E2D9CF] rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                <span className="material-symbols-outlined hidden sm:inline text-sm text-[#B34E3F]">link</span>
                <span className="font-label-md text-[9px] sm:text-[11px] uppercase tracking-wider text-[#2C2A29] font-bold">
                  {stats.total} Tamu
                </span>
              </span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981]" />
                <span className="font-label-md text-[9px] sm:text-[11px] uppercase tracking-wider text-emerald-700 font-bold">
                  {stats.with_link} Aktif
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {gatedGenerate && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#B34E3F] text-white font-label-md text-[10px] uppercase tracking-wider rounded-full hover:bg-[#9E3B2D] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap"
                >
                  {generating ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">add</span>
                  )}
                  {generating ? "..." : gated ? "Aktifkan QR" : qrCodeBook ? "Generate QR" : "Generate Link"}
                </button>
              )}
              <button
                onClick={() => router.push(`/dashboard/${id}/guests`)}
                data-tour="tambah-tamu"
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#B34E3F] text-white font-label-md text-[10px] uppercase tracking-wider rounded-full hover:bg-[#9E3B2D] transition-colors shadow-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Tambah Tamu
              </button>
              <button
                onClick={() => router.push(`/dashboard/${id}/guests`)}
                data-tour="tambah-tamu"
                className="md:hidden w-10 h-10 flex items-center justify-center bg-[#B34E3F] text-white rounded-full hover:bg-[#9E3B2D] transition-colors shadow-sm shrink-0"
                aria-label="Tambah Tamu"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting || guests.length === 0}
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] uppercase tracking-wider rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap"
              >
                {exporting ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">download</span>
                )}
                {exporting ? "..." : "Export Excel"}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting || guests.length === 0}
                className="md:hidden w-10 h-10 flex items-center justify-center bg-white border border-[#E2D9CF] text-[#2C2A29] rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm shrink-0"
                aria-label="Export Excel"
              >
                {exporting ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">download</span>
                )}
              </button>
              <button
                onClick={handlePrintQr}
                disabled={guests.length === 0}
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] uppercase tracking-wider rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Cetak QR
              </button>
              <button
                onClick={handlePrintQr}
                disabled={guests.length === 0}
                className="md:hidden w-10 h-10 flex items-center justify-center bg-white border border-[#E2D9CF] text-[#2C2A29] rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm shrink-0"
                aria-label="Cetak QR"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
              </button>
            </div>
          </section>
          {/* Akses Tautan Undangan */}
          <section data-tour="link-mode" className="mt-4 bg-white border border-[#E2D9CF] rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#B34E3F] text-[18px]">link</span>
              <h2 className="font-label-md text-[12px] uppercase tracking-widest text-[#2C2A29] font-bold flex-1">Akses Tautan Undangan</h2>
              <button
                type="button"
                onClick={() => setShowLinkInfo(true)}
                aria-label="Info akses tautan undangan"
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-[#B34E3F] hover:bg-[#F5EFE6] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
            <div className="flex gap-2 p-1 bg-[#F5EFE6] rounded-full w-fit mt-3">
              <button
                type="button"
                onClick={() => handleLinkMode(true)}
                disabled={linkSaving}
                className={`px-4 py-1.5 rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 ${linkStrict ? "bg-[#B34E3F] text-white" : "text-[#2C2A29] hover:text-[#B34E3F]"}`}
              >
                Terbatas
              </button>
              <button
                type="button"
                onClick={() => handleLinkMode(false)}
                disabled={linkSaving}
                className={`px-4 py-1.5 rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 ${!linkStrict ? "bg-[#B34E3F] text-white" : "text-[#2C2A29] hover:text-[#B34E3F]"}`}
              >
                Fleksibel
              </button>
            </div>
            <p className="font-body-md text-[12px] text-on-surface-variant mt-2 leading-relaxed">
              {linkStrict
                ? "Hanya tamu terdaftar yang dapat membuka undangan."
                : "Siapa pun dapat membuka undangan dengan nama apa pun."}
            </p>
          </section>
          {!linkStrict && (
            <section className="mt-4 bg-white border border-[#E2D9CF] rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#B34E3F] text-[18px]">share</span>
                <h2 className="font-label-md text-[12px] uppercase tracking-widest text-[#2C2A29] font-bold flex-1">Tautan Umum</h2>
              </div>
              {blocked ? (
                <button
                  type="button"
                  onClick={handleBlockedClick}
                  className="w-full mt-3 bg-[#F3F4F6] border border-[#E2D9CF] rounded-xl px-3 py-3 flex items-center justify-center gap-2 text-[11px] font-label-md uppercase tracking-wider text-[#9CA3AF] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  {blockedText}
                </button>
              ) : (
              <>
              <p className="font-mono text-[12px] text-[#2C2A29] bg-[#F5EFE6] border border-[#E2D9CF] rounded-xl px-3 py-2.5 mt-3 break-all">
                {genericUndanganUrl}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleCopyGeneric("link")}
                  className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
                >
                  {genericCopied === "link" ? "Tersalin!" : "Salin Tautan"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyGeneric("msg")}
                  className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#B34E3F] border border-[#B34E3F] text-white hover:bg-[#9E3B2D] transition-colors"
                >
                  {genericCopied === "msg" ? "Tersalin!" : "Salin Pesan"}
                </button>
              </div>
              <p className="font-body-md text-[12px] text-on-surface-variant mt-2 leading-relaxed">
                Salin pesan, lalu ganti {`to=${FALLBACK_GUEST_SLUG}`} dengan slug nama tamu — contoh: to=Budi-Santoso.
              </p>
              </>
              )}
            </section>
          )}
          {/* Template Pesan Undangan */}
          <section data-tour="template-pesan" className="mt-4 bg-white border border-[#E2D9CF] rounded-2xl shadow-sm overflow-hidden">
            <button type="button" onClick={() => setTemplateOpen(!templateOpen)} className="w-full flex items-center justify-between p-4 bg-[#FAF7F2] hover:bg-[#F5EFE6] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-[#B34E3F] text-[18px]">chat</span>
                <div className="text-left min-w-0">
                  <h2 className="font-label-md text-[12px] uppercase tracking-widest text-[#2C2A29] font-bold">Template Pesan Undangan</h2>
                  <p className="font-body-md text-[11px] text-on-surface-variant truncate">Template Aktif: {MSG_CATEGORIES.find((c) => c.id === msgCategory)?.label} • Klik untuk edit template</p>
                </div>
              </div>
              <span className={`material-symbols-outlined text-[#B34E3F] transition-transform ${templateOpen ? "rotate-180" : ""}`}>expand_more</span>
            </button>
            {templateOpen && (
              <div className="p-5 border-t border-[#E2D9CF] space-y-4">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {(view.chrome.messageCategory === "khitanan"
                    ? MSG_CATEGORIES.filter((c) => c.id === "khitanan")
                    : MSG_CATEGORIES.filter((c) => c.id !== "khitanan")
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectMsgCategory(c.id)}
                      className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border font-label-md text-[10px] uppercase tracking-wider transition-colors ${
                        msgCategory === c.id
                          ? "bg-[#B34E3F] border-[#B34E3F] text-white font-bold"
                          : "bg-[#F5EFE6] border-[#E2D9CF] text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F]"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {MSG_VARS.filter((v) => !(view.kids && v.tag === "{Nama Pasangan}")).map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertMsgVar(v.tag)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#D1C7BD] text-[#B34E3F] font-label-md text-[10px] font-bold uppercase tracking-wider hover:border-[#B34E3F] hover:bg-white transition-colors shadow-sm whitespace-nowrap"
                      title={`Sisipkan ${v.label}`}
                    >
                      <span className="material-symbols-outlined text-[12px]">add</span>
                      {v.tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 p-1 bg-[#F5EFE6] rounded-full w-fit">
                  <button type="button" onClick={() => setTemplateView("edit")} className={`px-4 py-1.5 rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors ${templateView === "edit" ? "bg-[#B34E3F] text-white" : "text-[#2C2A29] hover:text-[#B34E3F]"}`}>Edit Template</button>
                  <button type="button" onClick={() => setTemplateView("preview")} className={`px-4 py-1.5 rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors ${templateView === "preview" ? "bg-[#B34E3F] text-white" : "text-[#2C2A29] hover:text-[#B34E3F]"}`}>Hasil Pesan</button>
                </div>

                {templateView === "edit" ? (
                  <textarea
                    ref={msgTextareaRef}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-[#E2D9CF] rounded-xl p-4 font-body-md text-[13px] leading-relaxed text-[#2C2A29] resize-none h-40 max-h-40 overflow-y-auto focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors"
                  />
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-2xl">
                    <MessagePreview text={msgText} guestName={demoGuestName} coupleName={coupleName} guestUrl={demoGuestUrl} />
                  </div>
                )}
              </div>
            )}
          </section>
          {gated && (
            <div className="mt-4 bg-[#E0F2FE] border border-[#7DD3FC] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <span className="material-symbols-outlined text-[#0284C7] text-[18px] shrink-0 mt-0.5">info</span>
                <div>
                  <p className="font-body-md text-[13px] text-[#0C4A6E] leading-relaxed">
                    Konfirmasi design dan data undangan untuk mengaktifkan tautan undangan seluruh tamu.
                  </p>
                </div>
              </div>
              <button onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)} className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#0284C7] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#0C4A6E] active:scale-95 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Buka Editor
              </button>
            </div>
          )}

          {hasUnresolvedFeedback && (
            <div className="mt-4 bg-[#E0F2FE] border border-[#7DD3FC] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <span className="material-symbols-outlined text-[#0284C7] text-[18px] shrink-0 mt-0.5">info</span>
                <div>
                  <p className="font-body-md text-sm text-[#0C4A6E] font-bold">Undangan Belum Selesai</p>
                  <p className="font-body-md text-[13px] text-[#0C4A6E] leading-relaxed mt-1">
                    Ada feedback kamu yang belum selesai. Sebaiknya tunggu hingga selesai agar tamu mendapat undangan terbaru.
                  </p>
                </div>
              </div>
              <button onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback`)} className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#0284C7] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#0C4A6E] active:scale-95 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                Lihat Feedback
              </button>
            </div>
          )}

          {isUnpaid && (
            <div className="mt-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <span className="material-symbols-outlined text-[#92400E] flex-shrink-0">warning</span>
                <div>
                  <p className="font-body-md text-sm text-[#92400E] font-bold">Pembayaran Belum Selesai</p>
                  <p className="font-body-sm text-[13px] text-[#92400E]/80 mt-1">
                    Selesaikan pembayaran untuk menghasilkan tautan unik dan QR setiap tamu.
                  </p>
                </div>
              </div>
              <button onClick={() => window.open(payLink(), "_blank")} className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#D97706] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#92400E] active:scale-95 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Bayar Sekarang
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mt-4 bg-white border border-[#E2D9CF] rounded-xl px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] transition-all">
            <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tamu..."
              className="bg-transparent border-none focus:ring-0 w-full h-12 py-3.5 font-body-md text-sm text-on-surface placeholder:text-outline-variant/80 outline-none"
            />
          </div>

          <div className="flex flex-col gap-4 mt-6">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/50 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">people_outline</span>
                {search ? (
                  <p className="font-body-md text-sm text-on-surface-variant">Tidak ada tamu yang cocok</p>
                ) : (
                  <>
                    <p className="font-body-md text-sm text-on-surface-variant mb-5">
                      Belum ada tamu. Tambahkan tamu terlebih dahulu.
                    </p>
                    <button
                      onClick={() => router.push(`/dashboard/${id}/guests`)}
                      className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 min-h-[48px] rounded-xl font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Tambahkan Tamu
                    </button>
                  </>
                )}
              </div>
            ) : (
              filtered.map((g) => (
                <GuestCard
                  key={g.id}
                  guest={g}
                  slug={profile?.slug || ""}
                  onCopyQr={handleCopyQr}
                  onCopyUndangan={handleCopyUndangan}
                  onCopyMessage={handleCopyMessage}
                  onSendWa={handleSendWa}
                  copiedId={copiedId}
                  copiedKind={copiedKind}
                  gated={gated}
                  isFirstGuest={g.id === firstGuestId}
                  onBlockedClick={handleBlockedClick}
                  isUnpaid={isUnpaid}
                  qrCodeBook={qrCodeBook}
                  setShowLimitModal={setShowLimitModal}
                  sessions={Array.isArray(profile?.sessions) ? profile.sessions : []}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 flex flex-col items-center justify-center text-center opacity-30 select-none">
            <div className="w-16 h-[1px] bg-on-surface-variant mb-4" />
            <p className="font-headline-md text-xs tracking-[0.2em] uppercase italic text-on-surface-variant">Aksaraa Management</p>
          </footer>
      </main>

      {/* QR book feature limit — only Buku Tamu Digital packages include it */}
      {showLinkInfo && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">info</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Akses Tautan Undangan</h3>
              <div className="text-sm text-on-surface-variant leading-relaxed space-y-3 text-left w-full">
                <p>
                  <span className="font-bold text-on-surface">Mode Terbatas</span> — Hanya tamu yang namanya terdaftar di daftar tamu yang dapat membuka undangan. Jika tautan dibuka dengan nama yang tidak ada di daftar, akan muncul halaman &ldquo;Tautan Undangan Tidak Valid&rdquo;.
                </p>
                <p>
                  <span className="font-bold text-on-surface">Mode Fleksibel</span> — Siapa pun dapat membuka undangan dengan nama apa pun, cocok untuk satu tautan umum yang dibagikan ke banyak orang. Nama yang tampil mengikuti tulisan di tautan (contoh: Budi-Santoso menjadi &ldquo;Budi Santoso&rdquo;).
                </p>
                <p>
                  Saat tamu mengisi RSVP, namanya otomatis tercatat di daftar tamu dengan kategori Fleksibel, sehingga tetap bisa check-in dan klaim souvenir.
                </p>
              </div>
              <button
                onClick={() => setShowLinkInfo(false)}
                className="w-full bg-primary text-on-primary py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <UpgradePackageModal
          open
          onClose={() => setShowLimitModal(false)}
          ctaHref={`/customize?edit=true&tab=dgbook&user=${encodeURIComponent(profile?.groom_name || "")}&partner=${encodeURIComponent(profile?.bride_name || "")}&date=${encodeURIComponent(profile?.estimated_wedding_date || "")}&guest=${encodeURIComponent(String(profile?.estimated_guest_count || 300))}&profile_id=${id}`}
          content={{
            title: "Fitur Buku Tamu Digital",
            lockLabel: "Paket Buku Tamu Digital",
            benefits: [
              "QR personal untuk setiap tamu",
              "Scanner dan check in tamu tanpa aplikasi",
              "Sapaan otomatis di Layar LED",
            ],
            eligiblePackages: ["Buku Tamu Digital (Sistem, Pro, Premium, Prestige)"],
            cta: "Pilih Paket",
          }}
        />
      )}

      {/* Paid-but-unconfirmed Modal — invitation must be completed & confirmed first */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">edit_calendar</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Lengkapi &amp; Konfirmasi Undangan Dulu</h3>
              <p className="text-sm text-on-surface-variant">
                QR dan tautan undangan untuk tamu lainnya belum dapat diaktifkan sebelum undangan Anda
                diisi lengkap dan dikonfirmasi. Selesaikan konten undangan di editor, lalu konfirmasi.
              </p>
              <button
                onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)}
                className="w-full bg-primary text-on-primary py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Lengkapi di Editor
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full border border-outline-variant text-on-surface-variant py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
