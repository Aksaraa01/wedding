"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"

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
  checkin_timestamp: string
  souvenir_claimed: boolean
  added_manually?: boolean
}

type Stats = {
  total: number
  checked_in: number
  percentage: number
  recent_checkins: CheckinRecord[]
}

function formatWIB(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB"
}

function CircularProgress({ percentage }: { percentage: number }) {
  const r = 15.915
  const circumference = 2 * Math.PI * r
  const filled = (percentage / 100) * circumference

  return (
    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#f2ede4" strokeWidth="2" />
      {percentage > 0 && (
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke="#8d4d39"
          strokeWidth="2"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset="0"
          className="transition-all duration-700"
        />
      )}
    </svg>
  )
}

export default function LiveAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPin, setGeneratingPin] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch(`/api/dashboard/${id}`),
        fetch(`/api/dashboard/${id}/qr-guestbook/stats`),
      ])
      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfile(p.profile)
      }
      if (statsRes.ok) {
        const s = await statsRes.json()
        setStats(s)
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

  const percentage = stats?.percentage ?? 0
  const notChecked = (stats?.total ?? 0) - (stats?.checked_in ?? 0)
  const scannerUrl = profile ? buildScannerUrl(profile.slug) : ""

  return (
    <div className="min-h-screen bg-background font-body-md text-body-md mb-32">
      <header className="px-edge-margin-mobile py-8 space-y-4">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="inline-flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">west</span>
          Kembali ke Dasbor
        </button>
        <h1 className="font-headline-md text-[32px] leading-tight text-on-surface">
          Buku Tamu QR &amp; <br />Absensi Live
        </h1>
      </header>

      <main className="space-y-12">
        {/* Stats Section */}
        <section className="px-edge-margin-mobile">
          <div className="mb-6 text-center">
            <p className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant mb-1">
              Statistik Kehadiran
            </p>
          </div>

          <div className="relative aspect-[3/4] bg-white p-8 flex flex-col items-center justify-center shadow-sm border border-[#eae3d5] overflow-hidden md:max-w-[400px] md:max-h-[533px] mx-auto">
            <div className="absolute inset-4 border border-[#eae3d5]/50 pointer-events-none" />
            <div className="z-10 w-full space-y-8">
              <div className="relative w-48 h-48 mx-auto">
                <CircularProgress percentage={percentage} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline-md text-[32px] text-primary">{percentage}%</span>
                  <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">Hadir</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-body-md text-sm">Hadir</span>
                  </div>
                  <span className="font-label-md text-primary">{stats?.checked_in || 0}</span>
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
                  <span className="font-headline-md text-[18px]">{stats?.total || 0}</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />
          </div>


        </section>

        {/* Live Feed Section */}
        <section className="px-edge-margin-mobile">
          <div className="flex justify-between items-end mb-8">
            <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">Live Feed</h2>
            <span className="text-[10px] font-label-md text-on-surface-variant uppercase italic">Update otomatis</span>
          </div>

          <div className="space-y-0">
            {!stats?.recent_checkins || stats.recent_checkins.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-3">qr_code_scanner</span>
                <p className="font-body-md text-sm text-on-surface-variant">Belum ada tamu yang check-in</p>
                <p className="font-body-md text-xs text-on-surface-variant mt-1">Scan QR tamu di venue untuk memulai</p>
              </div>
            ) : (
              stats.recent_checkins.map((c, i) => (
                <div
                  key={c.id}
                  className="py-6"
                  style={{
                    borderTop: "0.5px solid #eae3d5",
                    opacity: 1,
                    transform: "translateY(0)",
                    transition: "0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary font-light text-[20px]">person</span>
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-headline-md text-[20px] leading-tight">
                        {c.name}
                        {c.added_manually && (
                          <span className="ml-2 inline-block align-middle text-[9px] font-label-md font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                            Manual
                          </span>
                        )}
                      </h4>
                        <span className="font-label-md text-[10px] text-on-surface-variant">
                          {formatWIB(c.checkin_timestamp)}
                        </span>
                      </div>
                      <p className="font-body-md text-on-surface-variant text-sm">
                        {c.table_number ? `Meja ${c.table_number} • ` : ""}
                        <span className="text-secondary italic">Hadir</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </section>

        {/* Scanner Sync Section */}
        <section className="px-edge-margin-mobile pb-12">
          <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] mb-6 text-on-surface-variant">
            Sinkronisasi Scanner
          </h2>
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 space-y-6">
              <div className="flex flex-col gap-3">
                <span className="font-label-md text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2 block">
                  Tautan Scanner Live
                </span>
                <div className="flex flex-col gap-6">
                  <code className="font-body-md text-primary break-all text-[18px] leading-relaxed">{scannerUrl}</code>

                  <div className="flex items-center gap-8 pt-4 border-t border-outline-variant/20">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors"
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
                      className="flex items-center gap-2 font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      Buka Scanner
                    </a>
                  </div>
                </div>
              </div>

              {/* PIN */}
              <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/20">
                {profile?.scanner_pin ? (
                  <div className="flex items-center gap-3">
                    <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">PIN:</span>
                    <span className="font-headline-md text-[20px] tracking-[0.15em] text-primary">{profile.scanner_pin}</span>
                    <button
                      onClick={handleGeneratePin}
                      disabled={generatingPin}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                      title="Generate ulang PIN"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePin}
                    disabled={generatingPin}
                    className="flex items-center gap-2 font-label-md text-[10px] text-secondary uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    {generatingPin ? (
                      <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                    )}
                    {generatingPin ? "Memproses..." : "Buat PIN Scanner"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full px-edge-margin-mobile pb-8 pt-4 bg-gradient-to-t from-surface via-surface to-transparent z-50" />
    </div>
  )
}
