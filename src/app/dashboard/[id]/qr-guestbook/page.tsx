"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { ASSETS } from "@/lib/assets"
import ProfileMenu from "@/components/ProfileMenu"

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
}

type Profile = {
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  is_published: boolean
  slug: string
  bride_name: string
  groom_name: string
  estimated_wedding_date: string | null
  estimated_guest_count: number | null
}

type Stats = {
  total: number
  with_token: number
  checked_in: number
}

function formatTableBadge(raw: string | null): string {
  if (!raw) return ""
  const t = raw.trim()
  if (/^meja\s+/i.test(t)) return t.replace(/^meja\s+/i, "MEJA ").toUpperCase()
  return `MEJA ${t.toUpperCase()}`
}

function GuestCard({ guest, slug, onCopyQr, onCopyUndangan, copiedId, copiedKind, gated, isFirstGuest, onGatedClick }: {
  guest: Guest
  slug: string
  onCopyQr: (token: string, slug: string | null) => void
  onCopyUndangan: (guest: Guest) => void
  copiedId: string | null
  copiedKind: "qr" | "undangan" | null
  gated: boolean
  isFirstGuest: boolean
  onGatedClick: () => void
}) {
  const hasToken = !!guest.qr_token
  const isCopiedQr = copiedId === guest.id && copiedKind === "qr"
  const isCopiedUndangan = copiedId === guest.id && copiedKind === "undangan"

  const blocked = gated && !isFirstGuest
  const blockAction = (fn: () => void) => (blocked ? onGatedClick : fn)
  const tableBadge = formatTableBadge(guest.table_number)

  return (
    <div className="bg-white border border-[#E2D9CF] hover:border-[#E2D9CF] rounded-xl p-4 shadow-sm transition-all duration-200 flex flex-col gap-3 group">
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="font-headline-md text-[16px] md:text-lg font-medium text-[#2C2A29] truncate">{guest.name}</h2>
          {guest.phone_number && (
            <p className="font-body-md text-xs text-on-surface-variant tracking-wide">{guest.phone_number}</p>
          )}
          {guest.added_manually && (
            <span className="inline-flex items-center self-start px-2 py-0.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-label-md text-[9px] uppercase tracking-wider rounded-full">
              Manual
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {tableBadge && (
            <span className="inline-flex items-center px-2.5 py-1 bg-[#E5E7EB] border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] font-semibold tracking-wider rounded-full">
              {tableBadge}
            </span>
          )}
          {hasToken ? (
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
        <div className="bg-[#F3F4F6] border border-[#E2D9CF] rounded-lg px-3 py-2.5 flex items-center justify-center gap-2 text-[11px] font-label-md uppercase tracking-wider text-[#9CA3AF]">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Kunci — Lengkapi Undangan
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => hasToken && onCopyUndangan(guest)}
            disabled={!hasToken}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-full min-h-[40px] font-label-md text-[10px] uppercase tracking-wider font-semibold text-center leading-tight transition-colors ${hasToken ? (isCopiedUndangan ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-[#B34E3F] text-white border border-[#B34E3F] hover:bg-[#9E3B2D]") : "bg-[#F3F4F6] text-[#9CA3AF] border border-[#E2D9CF] cursor-not-allowed"}`}
          >
            <span className="material-symbols-outlined text-[18px]">{isCopiedUndangan ? "check" : "link"}</span>
            <span>{isCopiedUndangan ? "Tersalin" : "Salin Undangan"}</span>
          </button>
          <button
            onClick={() => hasToken && onCopyQr(guest.qr_token!, guest.slug)}
            disabled={!hasToken}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-full min-h-[40px] font-label-md text-[10px] uppercase tracking-wider font-semibold text-center leading-tight transition-colors ${hasToken ? (isCopiedQr ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-[#F5EFE6] text-[#2C2A29] border border-[#E2D9CF] hover:bg-[#E2D9CF]") : "bg-[#F3F4F6] text-[#9CA3AF] border border-[#E2D9CF] cursor-not-allowed"}`}
          >
            <span className="material-symbols-outlined text-[18px]">{isCopiedQr ? "check" : "qr_code_2"}</span>
            <span>{isCopiedQr ? "Tersalin" : "Salin QR"}</span>
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
  const [stats, setStats] = useState<Stats>({ total: 0, with_token: 0, checked_in: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedKind, setCopiedKind] = useState<"qr" | "undangan" | null>(null)
  const [exporting, setExporting] = useState(false)
  const [qrCodeBook, setQrCodeBook] = useState(true)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

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

  const gated = !!profile && profile.payment_status !== "UNPAID" && profile.is_published !== true
  const firstGuestId = guests[0]?.id || null

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
    const url = `https://${profile.slug}.wedding.aksaraa.com/qr/${slug || token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(guests.find(g => g.qr_token === token)?.id || null)
      setCopiedKind("qr")
      setTimeout(() => { setCopiedId(null); setCopiedKind(null) }, 2000)
    } catch {}
  }

  const handleCopyUndangan = async (guest: Guest) => {
    if (!profile) return
    const url = guest.slug
      ? `https://${profile.slug}.wedding.aksaraa.com/?to=${guest.slug}`
      : `https://${profile.slug}.wedding.aksaraa.com/w/${profile.slug}?to=${encodeURIComponent(guest.name)}&qr_token=${encodeURIComponent(guest.qr_token || "")}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(guest.id)
      setCopiedKind("undangan")
      setTimeout(() => { setCopiedId(null); setCopiedKind(null) }, 2000)
    } catch {}
  }

  const guestQrUrl = (guest: Guest) =>
    guest.qr_token
      ? `https://${profile?.slug}.wedding.aksaraa.com/qr/${guest.slug || guest.qr_token}`
      : ""

  const guestUndanganUrl = (guest: Guest) => {
    if (!profile) return ""
    return guest.slug
      ? `https://${profile.slug}.wedding.aksaraa.com/?to=${guest.slug}`
      : guest.qr_token
      ? `https://${profile.slug}.wedding.aksaraa.com/w/${profile.slug}?to=${encodeURIComponent(guest.name)}&qr_token=${encodeURIComponent(guest.qr_token)}`
      : ""
  }

  const handleExportExcel = async () => {
    if (!profile || guests.length === 0) return
    if (gated) {
      setShowConfirmModal(true)
      return
    }
    setExporting(true)
    try {
      const header = qrCodeBook
        ? ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Tautan QR", "Tautan Undangan", "Sumber"]
        : ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Tautan Undangan", "Sumber"]
      const rows = guests.map((g) => qrCodeBook
        ? [g.name, g.phone_number || "", g.category || "", g.table_number || "", guestQrUrl(g), guestUndanganUrl(g), g.added_manually ? "Ditambahkan Manual" : "Undangan QR"]
        : [g.name, g.phone_number || "", g.category || "", g.table_number || "", guestUndanganUrl(g), g.added_manually ? "Ditambahkan Manual" : "Undangan QR"])
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = qrCodeBook
        ? [
            { wch: 28 },
            { wch: 18 },
            { wch: 16 },
            { wch: 12 },
            { wch: 55 },
            { wch: 55 },
          ]
        : [
            { wch: 28 },
            { wch: 18 },
            { wch: 16 },
            { wch: 12 },
            { wch: 55 },
          ]
      for (let r = 2; r <= rows.length + 1; r++) {
        const undRef = XLSX.utils.encode_cell({ r: r - 1, c: qrCodeBook ? 5 : 4 })
        const undVal = ws[undRef]?.v
        if (undVal) ws[undRef].l = { Target: String(undVal), Tooltip: String(undVal) }
        if (qrCodeBook) {
          const qrRef = XLSX.utils.encode_cell({ r: r - 1, c: 4 })
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
  const firstGuestHasToken = !!guests[0]?.qr_token
  const needsGenerate = !isUnpaid && stats.total > 0 && stats.with_token < stats.total
  const gatedGenerate = gated
    ? stats.total > 0 && !firstGuestHasToken
    : needsGenerate
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
    <div className="h-screen bg-[#FAF7F2] font-body-md text-on-surface antialiased flex flex-col overflow-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] select-none">
        <img
          src={ASSETS.qrGuestbook.bg}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-[#E2D9CF] px-6 md:px-12 py-4">
        <div className="w-full flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[#2C2A29] font-label-md text-[11px] uppercase tracking-wider font-bold">
            Tautan Undangan dan QR Tamu
          </span>
          <ProfileMenu />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden pb-28 md:pb-0">
        {/* Fixed Top Content */}
        <div className="shrink-0 w-full max-w-2xl mx-auto px-6 pt-6">
          <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-[#2C2A29]">
            Tautan Undangan dan QR Tamu
          </h1>

          {/* Horizontal Action Bar */}
          <section className="mt-5 bg-white border border-[#E2D9CF] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#E2D9CF] rounded-full px-3 py-1.5">
                <span className="material-symbols-outlined text-sm text-[#B34E3F]">link</span>
                <span className="font-label-md text-[11px] uppercase tracking-wider text-[#2C2A29] font-bold">
                  {stats.with_token} Tautan
                </span>
              </span>
              <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-label-md text-[11px] uppercase tracking-wider text-emerald-700 font-bold">
                  {stats.with_token} Aktif
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {gatedGenerate && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B34E3F] text-white font-label-md text-[11px] uppercase tracking-wider rounded-full hover:bg-[#9E3B2D] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap"
                >
                  {generating ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">add</span>
                  )}
                  {generating ? "..." : gated ? "Aktifkan QR" : "Generate QR"}
                </button>
              )}
              <button
                onClick={handleExportExcel}
                disabled={exporting || guests.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[11px] uppercase tracking-wider rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm whitespace-nowrap"
              >
                {exporting ? (
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">download</span>
                )}
                {exporting ? "..." : "Export Excel"}
              </button>
            </div>
          </section>
          {gated && (
            <p className="mt-3 text-[11px] text-on-surface-variant text-center md:text-left">
              Konfirmasi undangan untuk aktifkan QR seluruh tamu. QR pertama dapat disalin sekarang.
            </p>
          )}

          {/* UNPAID Banner */}
          {isUnpaid && (
            <div className="mt-5 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3 flex-1">
                <span className="material-symbols-outlined text-[#92400E] flex-shrink-0">warning</span>
                <div>
                  <p className="font-body-md text-sm text-[#92400E] font-bold">Pembayaran Belum Selesai</p>
                  <p className="font-body-sm text-[13px] text-[#92400E]/80 mt-1">
                    Selesaikan pembayaran untuk menghasilkan tautan unik dan QR setiap tamu.
                  </p>
                </div>
              </div>
              <button onClick={() => router.push(`/customize?edit=true&profile_id=${id}`)} className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#D97706] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#92400E] active:scale-95 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Bayar Sekarang
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mt-6 md:mt-5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tamu..."
              className="bg-transparent border-none focus:ring-0 w-full h-12 py-3.5 font-body-md text-sm text-on-surface placeholder:text-outline-variant/80 outline-none"
            />
          </div>
        </div>

        {/* Scrollable Guest List */}
        <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
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
                  copiedId={copiedId}
                  copiedKind={copiedKind}
                  gated={gated}
                  isFirstGuest={g.id === firstGuestId}
                  onGatedClick={() => setShowConfirmModal(true)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 flex flex-col items-center justify-center text-center opacity-30 select-none">
            <div className="w-16 h-[1px] bg-on-surface-variant mb-4" />
            <p className="font-headline-md text-xs tracking-[0.2em] uppercase italic text-on-surface-variant">Aksaraa Management</p>
          </footer>
        </div>
      </main>

      {/* QR book feature limit — only Buku Tamu Digital packages include it */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">qr_code_scanner</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Fitur Buku Tamu Digital</h3>
              <p className="text-sm text-on-surface-variant">
                QR tamu dan QR Guest Book hanya tersedia pada paket Buku Tamu Digital. Ubah paket Anda untuk mengaktifkan fitur ini.
              </p>
              <button
                onClick={() => router.push(`/customize?edit=true&tab=dgbook&user=${encodeURIComponent(profile?.bride_name || "")}&partner=${encodeURIComponent(profile?.groom_name || "")}&date=${encodeURIComponent(profile?.estimated_wedding_date || "")}&guest=${encodeURIComponent(String(profile?.estimated_guest_count || 300))}&profile_id=${id}`)}
                className="w-full bg-primary text-on-primary py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Ubah ke Buku Tamu Digital
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full border border-outline-variant text-on-surface-variant py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
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
