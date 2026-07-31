"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
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

      <div className="flex gap-4">
        <button
          onClick={() => hasToken && onCopyQr(guest.qr_token!, guest.slug)}
          disabled={!hasToken}
          className="flex items-center gap-2 text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant hover:text-secondary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors py-1"
        >
          {isCopiedQr ? (
            <>
              <span className="material-symbols-outlined text-base text-emerald-600">check</span>
              <span className="text-emerald-700 font-semibold">TAUTAN QR TERSALIN</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              SALIN TAUTAN QR
            </>
          )}
        </button>
        <button
          onClick={() => hasToken && onCopyUndangan(guest)}
          disabled={!hasToken}
          className="flex items-center gap-2 text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant hover:text-secondary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors py-1"
        >
          {isCopiedUndangan ? (
            <>
              <span className="material-symbols-outlined text-base text-emerald-600">check</span>
              <span className="text-emerald-700 font-semibold">TAUTAN UNDANGAN TERSALIN</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">link</span>
              SALIN TAUTAN UNDANGAN
            </>
          )}
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
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased pb-16">
      {/* Background Texture */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] select-none">
        <img
          src={ASSETS.qrGuestbook.bg}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/40 px-6 md:px-12 py-4">
        <nav className="flex flex-col gap-1 max-w-2xl">
          <button
            onClick={() => router.push(`/dashboard/${id}`)}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group font-label-md text-[11px] uppercase tracking-wider font-semibold"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Kembali ke Dasbor
          </button>
          <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-primary mt-1">
            Panel Kontrol Tautan &amp; QR
          </h1>
        </nav>
      </header>

      {/* Main */}
      <main className="w-full max-w-2xl mx-auto px-6 pt-36 flex flex-col gap-6">
        {/* Stats Pill */}
        <section className="w-full flex flex-col items-center gap-4">
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
        </section>

        {/* UNPAID Banner */}
        {isUnpaid && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-start gap-3">
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
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-1 flex items-center gap-3 shadow-sm focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary transition-all">
          <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tamu..."
            className="bg-transparent border-none focus:ring-0 w-full py-3 font-body-md text-sm text-on-surface placeholder:text-outline-variant/80 outline-none"
          />
        </div>

        {/* Guest List */}
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
      </main>
    </div>
  )
}
