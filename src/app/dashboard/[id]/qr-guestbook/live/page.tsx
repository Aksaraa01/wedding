"use client"

import { use, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import { useVisiblePoll } from "@/lib/useVisiblePoll"

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
  category: string | null
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
  const [statusFilter, setStatusFilter] = useState<"semua" | "hadir" | "hadir-manual" | "belum-hadir">("semua")
  const [loading, setLoading] = useState(true)
  const [generatingPin, setGeneratingPin] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wishByGuest, setWishByGuest] = useState<Record<string, string>>({})
  const [exporting, setExporting] = useState(false)
  const bookWrapRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cssFullscreen, setCssFullscreen] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, statsRes, guestsRes, wishRes] = await Promise.all([
        fetch(`/api/dashboard/${id}`),
        fetch(`/api/dashboard/${id}/qr-guestbook/stats`),
        fetch(`/api/dashboard/${id}/qr-guestbook`),
        fetch(`/api/wishes?wedding_profile_id=${id}`),
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
        setGuests(g.guests || [])
      }
      if (wishRes.ok) {
        const w = await wishRes.json()
        const map: Record<string, string> = {}
        for (const item of w.wishes || []) {
          if (item.guest_id && item.message && !map[item.guest_id]) {
            map[item.guest_id] = item.message
          }
        }
        setWishByGuest(map)
      }
    } catch {}
  }, [id])

  const toggleBookFullscreen = useCallback(async () => {
    // CSS fallback (e.g. iPhone Safari has no Element fullscreen): fixed overlay.
    if (cssFullscreen) {
      setCssFullscreen(false)
      return
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen() } catch {}
      return
    }
    const el = bookWrapRef.current
    if (el && typeof el.requestFullscreen === "function") {
      try {
        await el.requestFullscreen()
        return
      } catch {}
    }
    setCssFullscreen(true)
  }, [cssFullscreen])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  // Live refresh, paused while the tab is hidden (usher phones locked or in
  // background must not generate traffic or Supabase log volume).
  useVisiblePoll(fetchAll, 10000, !loading)

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

  const handleExportExcel = async () => {
    if (filtered.length === 0 || exporting) return
    setExporting(true)
    try {
      const header = ["Nama Tamu", "Meja", "Kategori", "VIP", "Status", "Waktu Check-in", "Ucapan"]
      const rows = filtered.map((g) => [
        g.name,
        g.table_number || "",
        g.category || "",
        g.is_vip ? "Ya" : "",
        !g.is_checked_in ? "Belum Hadir" : g.added_manually ? "Hadir-Manual" : "Hadir",
        g.checkin_timestamp ? formatWIB(g.checkin_timestamp) : "",
        wishByGuest[g.id] || "",
      ])
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 22 }, { wch: 60 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Daftar Hadir")
      XLSX.writeFile(wb, "daftar-hadir.xlsx")
    } finally {
      setExporting(false)
    }
  }

  const handleGeneratePin = async () => {    if (!profile) return
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
    .filter((g) => {
      if (statusFilter === "hadir" && (!g.is_checked_in || g.added_manually)) return false
      if (statusFilter === "hadir-manual" && (!g.is_checked_in || !g.added_manually)) return false
      if (statusFilter === "belum-hadir" && g.is_checked_in) return false
      return g.name.toLowerCase().includes(search.trim().toLowerCase())
    })
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

      <main className="px-edge-margin-mobile md:px-edge-margin-desktop pb-16 max-w-[1400px] mx-auto">
        <h1 className="font-headline-md text-xl md:text-2xl font-medium tracking-tight text-[#2C2A29] pt-6">
          Buku Tamu QR &amp; Absensi Live
        </h1>

        {/* Global info banner */}
        <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">info</span>
          <p className="font-body-md text-[13px] text-amber-900 leading-relaxed">
            <span className="font-bold">INFO:</span> Buku tamu digital ini akan terisi pada hari acara setelah ada tamu yang check-in
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT — stats + live feed */}
        <div className="space-y-6 min-w-0 lg:col-span-5">
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

          {/* Feed header: LIVE indicator + export */}
          <div className="flex justify-between items-end mb-4 gap-2">
            <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">
              Live Feed &amp; Daftar Hadir
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-label-md uppercase tracking-widest text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting || filtered.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2D9CF] text-[#2C2A29] font-label-md text-[10px] uppercase tracking-wider rounded-full hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors disabled:opacity-40 shadow-sm"
              >
                {exporting ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">download</span>
                )}
                {exporting ? "..." : "Ekspor Data"}
              </button>
            </div>
          </div>

          <section className="mb-4 bg-white border border-[#E2D9CF] rounded-2xl shadow-sm p-3 md:p-4 space-y-3">
            <div className="flex items-center bg-[#FAF7F2] border border-[#E2D9CF]/60 focus-within:border-secondary rounded-xl px-4 py-2.5 md:py-3 gap-3 transition-colors min-h-[48px]">
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

            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {([
                { id: "semua", label: `Semua (${total})` },
                { id: "hadir", label: `Hadir (${checkedQr})` },
                { id: "hadir-manual", label: `Hadir-Manual (${checkedManual})` },
                { id: "belum-hadir", label: `Belum Hadir (${notChecked})` },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full border font-label-md text-[10px] uppercase tracking-wider transition-colors ${
                    statusFilter === f.id
                      ? "bg-[#B34E3F] border-[#B34E3F] text-white font-bold"
                      : "bg-[#FAF7F2] border-[#E2D9CF] text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          <div className="bg-white border border-[#eae3d5] shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-3">qr_code_scanner</span>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {search || statusFilter !== "semua" ? "Tidak ada tamu yang cocok" : "Belum ada tamu yang check-in"}
                </p>
                <p className="font-body-md text-xs text-on-surface-variant mt-1">
                  {search || statusFilter !== "semua" ? "Coba kata kunci atau filter lain" : "Scan QR tamu di venue untuk memulai"}
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
                        {wishByGuest[c.id] && (
                          <span
                            title={wishByGuest[c.id]}
                            className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#ECFDF5] border border-emerald-300 text-emerald-700 text-[9px] font-label-md font-semibold uppercase tracking-wider rounded-full"
                          >
                            <span className="material-symbols-outlined text-[10px]">volunteer_activism</span>
                            Wishes
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-on-surface-variant text-[13px]">
                        {c.table_number ? `${/^meja\s/i.test(c.table_number.trim()) ? c.table_number.trim() : `Meja ${c.table_number}`} • ` : ""}
                        {c.is_checked_in ? (
                          <>
                            <span className="text-secondary italic">Hadir{c.added_manually ? "-Manual" : ""}</span>
                            <span className="text-on-surface-variant/60"> • {formatWIB(c.checkin_timestamp)}</span>
                          </>
                        ) : (
                          <span className="text-on-surface-variant/60 italic">Belum Hadir</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — scanner quick access + live book */}
        <div className="space-y-6 min-w-0 lg:col-span-7">
          <section data-tour="buku-tamu" className="bg-white border border-[#E2D9CF] rounded-2xl shadow-sm p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#B34E3F] text-[18px]">qr_code_scanner</span>
              <h2 className="font-label-md text-[12px] uppercase tracking-widest text-[#2C2A29] font-bold flex-1">Pranala Scanner Cepat</h2>
            </div>
            <p className="font-mono text-[12px] text-[#2C2A29] bg-[#F5EFE6] border border-[#E2D9CF] rounded-xl px-3 py-2.5 break-all">{scannerUrl}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5EFE6] border border-[#E2D9CF] font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Tersalin!" : "Salin Tautan"}
              </button>
              <a
                href={scannerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2D9CF] font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Buka Scanner
              </a>
              {profile?.scanner_pin ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2C2A29] text-white font-label-md text-[11px] tracking-[0.15em]">
                  PIN: <span className="font-bold">{profile.scanner_pin}</span>
                  <button
                    onClick={handleGeneratePin}
                    disabled={generatingPin}
                    className="hover:text-[#E6CA7E] transition-colors disabled:opacity-50"
                    title="Generate ulang PIN"
                    aria-label="Generate ulang PIN"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                </span>
              ) : (
                <button
                  onClick={handleGeneratePin}
                  disabled={generatingPin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B34E3F] text-white font-label-md text-[10px] uppercase tracking-widest hover:bg-[#9E3B2D] transition-colors disabled:opacity-50"
                >
                  {generatingPin ? "Memproses..." : "Buat PIN Scanner"}
                </button>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">Buku Tamu Digital</h2>
              <button
                type="button"
                onClick={toggleBookFullscreen}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2D9CF] font-label-md text-[10px] uppercase tracking-widest text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">{isFullscreen || cssFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
                {isFullscreen || cssFullscreen ? "Keluar Layar Penuh" : "Buka Mode Layar Penuh"}
              </button>
            </div>
            <div ref={bookWrapRef} className={`rounded-2xl overflow-hidden border border-[#E2D9CF] shadow-sm bg-[#F4EFE6] ${isFullscreen ? "h-screen" : ""} ${cssFullscreen ? "fixed inset-0 z-[90] rounded-none border-0 p-3 md:p-6 overflow-auto" : ""}`}>
              {cssFullscreen && (
                <button
                  type="button"
                  onClick={() => setCssFullscreen(false)}
                  className="fixed top-4 right-4 z-[91] w-11 h-11 rounded-full bg-[#2C2A29] text-white flex items-center justify-center shadow-xl"
                  aria-label="Keluar layar penuh"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <iframe
                src={`/dashboard/${id}/qr-guestbook/live/book`}
                title="Buku Tamu Digital"
                className={`w-full border-0 ${isFullscreen || cssFullscreen ? "h-full min-h-[85vh]" : "h-[560px] md:h-[620px]"}`}
                loading="lazy"
              />
            </div>
          </section>
        </div>
        </div>
      </main>
    </div>
  )
}
