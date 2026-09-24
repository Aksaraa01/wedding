"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"

type Profile = {
  id: string
  slug: string
  bride_name: string
  groom_name: string
  scanner_pin: string | null
}

type CheckinRecord = {
  id: string
  name: string
  table_number: string | null
  checkin_timestamp: string | null
  souvenir_claimed: boolean
  is_checked_in: boolean
  added_manually?: boolean
  is_vip?: boolean
}

type Stats = {
  total: number
  checked_in: number
  checked_in_manual: number
  percentage: number
  recent_checkins: CheckinRecord[]
}

function formatWIB(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
  return `${date}, ${time} WIB`
}

function Donut({ qrPct, manualPct, percentage }: { qrPct: number; manualPct: number; percentage: number }) {
  const qr = Math.max(0, Math.min(100, qrPct))
  const manual = Math.max(0, Math.min(100, manualPct))
  const background = `conic-gradient(#8d4d39 0% ${qr}%, #f2a33c ${qr}% ${qr + manual}%, #f2ede4 ${qr + manual}% 100%)`
  return (
      <div className="relative w-full h-full">
      <div className="w-full h-full rounded-full" style={{ background }} />
      <div className="absolute inset-[9%] rounded-full bg-white flex flex-col items-center justify-center">
        <span className="font-headline-md text-[22px] md:text-[32px] text-primary">{percentage}%</span>
        <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Hadir</span>
      </div>
    </div>
  )
}

export default function LiveAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [guests, setGuests] = useState<CheckinRecord[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [generatingPin, setGeneratingPin] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, statsRes, guestsRes] = await Promise.all([
        fetch(`/api/dashboard/${id}`),
        fetch(`/api/dashboard/${id}/qr-guestbook/stats`),
        fetch(`/api/dashboard/${id}/qr-guestbook`),
      ])
      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfile(p.profile)
      }
      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats(s)
      }
      if (guestsRes.ok) {
        const g = await guestsRes.json()
        setGuests((g.guests || []).filter((x: any) => x.is_checked_in))
      }
    } catch {}
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  useEffect(() => {
    if (loading) return
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
  }, [fetchAll, loading])

  const buildScannerUrl = (slug: string) => {
    return `https://${slug}.wedding.aksaraa.com/scanner`
  }

  const handleCopyLink = async () => {
    if (!profile) return
    const url = buildScannerUrl(profile.slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleGeneratePin = async () => {
    if (!profile) return
    setGeneratingPin(true)
    try {
      const res = await fetch("/api/scanner-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedding_profile_id: profile.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile({ ...profile, scanner_pin: data.pin })
      } else {
        alert(data.error || "Gagal generate PIN")
      }
    } finally {
      setGeneratingPin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const total = stats?.total ?? 0
  const checkedIn = stats?.checked_in ?? 0
  const checkedManual = stats?.checked_in_manual ?? 0
  const checkedQr = Math.max(0, checkedIn - checkedManual)
  const notChecked = Math.max(0, total - checkedIn)
  const percentage = stats?.percentage ?? 0
  const scannerUrl = profile ? buildScannerUrl(profile.slug) : ""
  const qrPct = total ? (checkedQr / total) * 100 : 0
  const manualPct = total ? (checkedManual / total) * 100 : 0

  const filtered = guests
    .filter((g) => g.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const ta = a.checkin_timestamp ? new Date(a.checkin_timestamp).getTime() : -Infinity
      const tb = b.checkin_timestamp ? new Date(b.checkin_timestamp).getTime() : -Infinity
      return tb - ta
    })

  return (
    <div className="min-h-screen font-body-md text-body-md" style={DASH_SATIN_BG}>
      <header className="border-b border-[#E2D9CF] px-6 md:px-12 py-4" style={DASH_HERO_BG}>
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push(`/dashboard/${id}`)} aria-label="Kembali ke dasbor" className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container transition-colors shrink-0">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="inline-flex items-center gap-2 text-[#2C2A29] font-label-md text-[11px] uppercase tracking-wider font-bold truncate">
              Buku Tamu QR &amp; Absensi Live
            </span>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="px-edge-margin-mobile md:px-edge-margin-desktop pb-16 space-y-8 md:space-y-0 md:grid md:grid-cols-12 md:gap-8 max-w-[1400px] mx-auto">
        <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-[#2C2A29] pt-6 md:col-span-12">
          Buku Tamu QR &amp; <br />Absensi Live
        </h1>
        {/* LEFT — pie chart + scanner card */}
        <div className="md:col-span-5 space-y-6 md:space-y-10">
          <div className="bg-white p-5 md:p-8 shadow-sm border border-[#eae3d5] relative overflow-hidden">
            <div className="absolute inset-3 md:inset-4 border border-[#eae3d5]/50 pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-5 md:mb-6 text-center">
                <p className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
                  Statistik Kehadiran
                </p>
              </div>
              <div className="w-40 h-40 md:w-48 md:h-48 mx-auto">
                <Donut qrPct={qrPct} manualPct={manualPct} percentage={percentage} />
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-body-md text-sm">Hadir</span>
                  </div>
                  <span className="font-label-md text-primary">{checkedQr}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-body-md text-sm">Hadir-Manual</span>
                  </div>
                  <span className="font-label-md text-amber-600">{checkedManual}</span>
                </div>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
                    <span className="font-body-md text-sm text-on-surface-variant">Belum Hadir</span>
                  </div>
                  <span className="font-label-md text-on-surface-variant">{notChecked}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-label-md text-[10px] uppercase tracking-widest">Total Undangan</span>
                  <span className="font-headline-md text-[18px]">{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scanner card */}
          <div data-tour="buku-tamu" className="bg-surface-container-lowest border border-outline-variant/30 p-5 md:p-8 space-y-6">
            <div className="flex flex-col gap-3">
              <span className="font-label-md text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-on-surface-variant mb-1 md:mb-2 block">
                Tautan Scanner Live
              </span>
              <div className="flex flex-col gap-4 md:gap-6">
                <code className="font-body-md text-primary break-all text-[15px] md:text-[18px] leading-relaxed">{scannerUrl}</code>

                <div className="flex items-center gap-4 md:gap-8 pt-4 border-t border-outline-variant/20 flex-wrap">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 font-label-md text-[11px] md:text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors py-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Tersalin" : "Salin Tautan"}
                  </button>
                  <a
                    href={scannerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-label-md text-[11px] md:text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors py-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Buka Scanner
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
              {profile?.scanner_pin ? (
                <div className="flex items-center gap-3">
                  <span className="font-label-md text-[10px] md:text-[11px] uppercase tracking-widest text-on-surface-variant">PIN:</span>
                  <span className="font-headline-md text-[18px] md:text-[20px] tracking-[0.15em] text-primary">{profile.scanner_pin}</span>
                  <button
                    onClick={handleGeneratePin}
                    disabled={generatingPin}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2"
                    title="Generate ulang PIN"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGeneratePin}
                  disabled={generatingPin}
                  className="flex items-center gap-2 font-label-md text-[11px] md:text-[10px] text-secondary uppercase tracking-widest hover:text-primary transition-colors py-2.5"
                >
                  {generatingPin ? (
                    <span className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                  )}
                  {generatingPin ? "Memproses..." : "Buat PIN Scanner"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — search + live list */}
        <div className="md:col-span-7">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
              Live Feed &amp; Daftar Hadir
            </h2>
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase italic">Update otomatis</span>
          </div>

          <div className="mb-4 flex items-center border border-outline-variant/60 focus-within:border-secondary rounded-xl bg-white px-4 py-2.5 md:py-3 gap-3 shadow-sm transition-colors min-h-[48px]">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tamu..."
              className="w-full bg-transparent border-0 p-0 focus:ring-0 text-sm text-primary placeholder:text-on-surface-variant/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Bersihkan">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-[#eae3d5] shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-3">qr_code_scanner</span>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {search ? "Tidak ada tamu yang cocok" : "Belum ada tamu yang check-in"}
                </p>
                <p className="font-body-md text-xs text-on-surface-variant mt-1">
                  {search ? "Coba kata kunci lain" : "Scan QR tamu di venue untuk memulai"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#eae3d5]/70">
                {filtered.map((c) => (
                  <div key={c.id} className="px-4 py-3.5 flex items-center gap-4 hover:bg-[#faf6ee] transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 bg-surface-container-highest flex items-center justify-center rounded-full">
                      <span className="material-symbols-outlined text-primary font-light text-[20px]">person</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline-md text-[17px] leading-tight truncate">{c.name}</h4>
                        {c.is_vip && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-[#C5A059] text-[#8B6F2A] text-[9px] font-label-md font-semibold uppercase tracking-wider rounded-full">
                            <span className="material-symbols-outlined text-[10px]">star</span>
                            VIP
                          </span>
                        )}
                        {c.added_manually && (
                          <span className="shrink-0 inline-block align-middle text-[9px] font-label-md font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                            Ditambahkan Manual
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-on-surface-variant text-[13px]">
                        {c.table_number ? `Meja ${c.table_number} • ` : ""}
                        <span className="text-secondary italic">Hadir</span>
                        <span className="text-on-surface-variant/60"> • {formatWIB(c.checkin_timestamp)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
