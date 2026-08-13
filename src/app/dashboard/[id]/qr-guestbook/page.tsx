"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { ASSETS } from "@/lib/assets"

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
  slug: string
  bride_name: string
  groom_name: string
}

type Stats = {
  total: number
  with_token: number
  checked_in: number
}

function GuestCard({ guest, slug, onCopyQr, onCopyUndangan, copiedId, copiedKind }: {
  guest: Guest
  slug: string
  onCopyQr: (token: string, slug: string | null) => void
  onCopyUndangan: (guest: Guest) => void
  copiedId: string | null
  copiedKind: "qr" | "undangan" | null
}) {
  const hasToken = !!guest.qr_token
  const isCopiedQr = copiedId === guest.id && copiedKind === "qr"
  const isCopiedUndangan = copiedId === guest.id && copiedKind === "undangan"

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 hover:border-outline rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col gap-4 group">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-headline-md text-lg md:text-xl font-medium text-primary">{guest.name}</h2>
          {guest.phone_number && (
            <p className="font-body-md text-xs text-on-surface-variant tracking-wide font-medium">{guest.phone_number}</p>
          )}
          {guest.added_manually && (
            <span className="inline-flex items-center self-start px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-700 font-label-md text-[9px] uppercase tracking-wider rounded-full mt-1">
              Ditambahkan Manual
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {guest.table_number && (
            <span className="font-label-md text-[9px] font-semibold tracking-wider bg-surface-container border border-outline-variant/50 text-on-surface px-2.5 py-1 rounded-md">
              MEJA {guest.table_number}
            </span>
          )}
          {hasToken ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="font-label-md text-[10px] uppercase font-bold tracking-wider text-emerald-700">AKTIF</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span className="font-label-md text-[10px] uppercase font-bold tracking-wider text-outline-variant">BELUM</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-outline-variant/30" />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => hasToken && onCopyQr(guest.qr_token!, guest.slug)}
          disabled={!hasToken}
          className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-colors"
        >
          <span className={`material-symbols-outlined text-xl ${isCopiedQr ? "text-emerald-600" : ""}`}>
            {isCopiedQr ? "check" : "qr_code_2"}
          </span>
          <span className={`font-label-md text-[10px] uppercase tracking-wider font-semibold text-center leading-tight ${isCopiedQr ? "text-emerald-700" : ""}`}>
            {isCopiedQr ? "TAUTAN QR TERSALIN" : "SALIN TAUTAN QR"}
          </span>
        </button>
        <button
          onClick={() => hasToken && onCopyUndangan(guest)}
          disabled={!hasToken}
          className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-secondary disabled:opacity-30 disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-colors"
        >
          <span className={`material-symbols-outlined text-xl ${isCopiedUndangan ? "text-emerald-600" : ""}`}>
            {isCopiedUndangan ? "check" : "link"}
          </span>
          <span className={`font-label-md text-[10px] uppercase tracking-wider font-semibold text-center leading-tight ${isCopiedUndangan ? "text-emerald-700" : ""}`}>
            {isCopiedUndangan ? "TAUTAN UNDANGAN TERSALIN" : "SALIN TAUTAN UNDANGAN"}
          </span>
        </button>
      </div>
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

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/dashboard/${id}/qr-guestbook`, { method: "POST" })
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
    setExporting(true)
    try {
      const header = ["Nama Tamu", "No. WhatsApp", "Kategori", "Meja", "Tautan QR", "Tautan Undangan", "Sumber"]
      const rows = guests.map((g) => [g.name, g.phone_number || "", g.category || "", g.table_number || "", guestQrUrl(g), guestUndanganUrl(g), g.added_manually ? "Ditambahkan Manual" : "Undangan QR"])
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = [
        { wch: 28 },
        { wch: 18 },
        { wch: 16 },
        { wch: 12 },
        { wch: 55 },
        { wch: 55 },
      ]
      for (let r = 2; r <= rows.length + 1; r++) {
        const qrRef = XLSX.utils.encode_cell({ r: r - 1, c: 4 })
        const undRef = XLSX.utils.encode_cell({ r: r - 1, c: 5 })
        const qrVal = ws[qrRef]?.v
        const undVal = ws[undRef]?.v
        if (qrVal) ws[qrRef].l = { Target: String(qrVal), Tooltip: String(qrVal) }
        if (undVal) ws[undRef].l = { Target: String(undVal), Tooltip: String(undVal) }
      }
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Tautan & QR Tamu")
      XLSX.writeFile(wb, "tautan-qr-tamu.xlsx")
    } finally {
      setExporting(false)
    }
  }

  const isUnpaid = profile?.payment_status === "UNPAID"
  const needsGenerate = !isUnpaid && stats.total > 0 && stats.with_token < stats.total
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
    <div className="h-screen bg-background font-body-md text-on-surface antialiased flex flex-col overflow-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] select-none">
        <img
          src={ASSETS.qrGuestbook.bg}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <header className="shrink-0 bg-background/95 backdrop-blur-md border-b border-outline-variant/40 px-6 md:px-12 py-4">
        <nav className="max-w-2xl">
          <button
            onClick={() => router.push(`/dashboard/${id}`)}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group font-label-md text-[11px] uppercase tracking-wider font-semibold"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Kembali ke Dasbor
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Top Content */}
        <div className="shrink-0 w-full max-w-2xl mx-auto px-6 pt-6">
          <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-primary">
            Panel Kontrol Tautan &amp; QR
          </h1>

          {/* Stats Pill */}
          <section className="mt-5 flex flex-col items-center gap-4">
            <div className="inline-flex flex-wrap justify-center items-center gap-4 py-2.5 px-5 bg-surface-container-low/90 border border-outline-variant/30 rounded-full shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">link</span>
                <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                  {stats.with_token} Tautan Tergenerasi
                </span>
              </div>
              <span className="hidden sm:inline text-outline-variant/60">|</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-sm ring-2 ring-emerald-600/10" />
                <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                  {stats.with_token} QR Status Aktif
                </span>
              </div>
            </div>

            {/* Generate Button */}
            {needsGenerate && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label-md text-[11px] uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm"
              >
                {generating ? (
                  <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">add</span>
                )}
                {generating ? "Memproses..." : "Generate QR untuk Semua Tamu"}
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || guests.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant/60 text-on-surface font-label-md text-[11px] uppercase tracking-wider rounded-full hover:border-secondary hover:text-secondary transition-colors disabled:opacity-40 shadow-sm"
            >
              {exporting ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">download</span>
              )}
              {exporting ? "Membuat File..." : "Download Excel"}
            </button>
          </section>

          {/* UNPAID Banner */}
          {isUnpaid && (
            <div className="mt-5 bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600 flex-shrink-0">info</span>
              <div>
                <p className="font-body-md text-body-md text-yellow-800 font-semibold">Pembayaran Belum Selesai</p>
                <p className="font-body-sm text-body-sm text-yellow-700 mt-1">
                  Selesaikan pembayaran terlebih dahulu untuk menghasilkan tautan unik dan QR untuk setiap tamu.
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mt-5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-1 flex items-center gap-3 shadow-sm focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tamu..."
              className="bg-transparent border-none focus:ring-0 w-full py-3 font-body-md text-sm text-on-surface placeholder:text-outline-variant/80 outline-none"
            />
          </div>
        </div>

        {/* Scrollable Guest List */}
        <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant/50 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">people_outline</span>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {search ? "Tidak ada tamu yang cocok" : "Belum ada tamu. Tambahkan tamu terlebih dahulu."}
                </p>
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

      {/* Prestige-only Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">workspace_premium</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Hanya tersedia pada paket Prestige</h3>
              <p className="text-sm text-on-surface-variant">Upgrade paket kamu untuk mengaktifkan fitur QR Guest Book.</p>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                OK, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
