"use client"

import { use, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import { generateWishWallPdf, type PdfProfile } from "@/lib/wishWallPdf"

type Wish = {
  id: string
  name: string
  message: string
  status: string
  is_pinned: boolean
  created_at: string
  source: string | null
}

type Stats = {
  total: number
  pending: number
  approved: number
  pinned: number
  hidden: number
}

function timeAgo(iso: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru Saja"
  if (mins < 60) return `${mins} Menit Lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} Jam Lalu`
  return `${Math.floor(hours / 24)} Hari Lalu`
}

export default function WishWallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [wishes, setWishes] = useState<Wish[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, pinned: 0, hidden: 0 })
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [coupleSlug, setCoupleSlug] = useState("")
  const [profile, setProfile] = useState<PdfProfile | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [pdfError, setPdfError] = useState("")
  const [visible, setVisible] = useState(9)
  const ledWrapRef = useRef<HTMLDivElement>(null)
  const [ledScale, setLedScale] = useState(1)

  useEffect(() => {
    const el = ledWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setLedScale(w / 1280)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [coupleSlug])

  const fetchWishes = async () => {
    const res = await fetch(`/api/wishes?wedding_profile_id=${id}`)
    if (!res.ok) return
    const data = await res.json()
    const all = data.wishes || []
    setWishes(all)
    setStats({
      total: all.length,
      pending: all.filter((w: Wish) => w.status === "pending").length,
      approved: all.filter((w: Wish) => w.status === "approved").length,
      pinned: all.filter((w: Wish) => w.is_pinned).length,
      hidden: all.filter((w: Wish) => w.status === "hidden").length,
    })
  }

  useEffect(() => {
    fetch(`/api/dashboard/${id}`).then(r => r.json()).then(data => {
      if (data?.profile?.slug) setCoupleSlug(data.profile.slug)
      if (data?.profile) setProfile(data.profile)
    })
    fetchWishes()
  }, [id])

  const q = query.trim().toLowerCase()
  const filtered = wishes.filter((w) => {
    if (filter === "pending" && w.status !== "pending") return false
    if (filter === "approved" && w.status !== "approved") return false
    if (filter === "hidden" && w.status !== "hidden") return false
    if (filter === "pinned" && !w.is_pinned) return false
    if (q && !w.name.toLowerCase().includes(q) && !w.message.toLowerCase().includes(q)) return false
    return true
  })

  const shown = filtered.slice(0, visible)

  const updateWish = async (wishId: string, updates: Record<string, any>) => {
    const res = await fetch(`/api/wishes/${wishId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) fetchWishes()
  }

  const deleteWish = async (wishId: string) => {
    const res = await fetch(`/api/wishes/${wishId}`, { method: "DELETE" })
    if (res.ok) fetchWishes()
  }

  const approvedWishes = wishes.filter((w) => w.status === "approved")

  const downloadPdf = async () => {
    if (downloading || approvedWishes.length === 0) return
    setDownloading(true)
    setPdfError("")
    try {
      await generateWishWallPdf(
        profile || {},
        approvedWishes.map((w) => ({ id: w.id, name: w.name, message: w.message, created_at: w.created_at })),
      )
    } catch (e: any) {
      setPdfError(e?.message || "Gagal membuat PDF. Coba lagi.")
    } finally {
      setDownloading(false)
    }
  }

  const ledUrl = coupleSlug ? `https://${coupleSlug}.wedding.aksaraa.com/led` : ""

  const copyLedUrl = () => {
    if (!ledUrl) return
    navigator.clipboard.writeText(ledUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const FILTERS = [
    { key: "all", label: "Semua Doa", count: stats.total },
    { key: "pending", label: "Menunggu Moderasi", count: stats.pending },
    { key: "approved", label: "Disetujui", count: stats.approved },
    { key: "hidden", label: "Disembunyikan", count: stats.hidden },
    { key: "pinned", label: "Disematkan", count: stats.pinned },
  ]

  return (
    <div className="min-h-screen text-[#1c1c16] font-body-md text-body-md antialiased pb-20" style={DASH_SATIN_BG}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .editorial-shadow { box-shadow: 0 4px 20px -2px rgba(28, 28, 22, 0.05); }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 border-b border-[#E2D9CF] flex justify-between items-center px-6 lg:px-10 h-16" style={DASH_HERO_BG}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push(`/dashboard/${id}`)} aria-label="Kembali ke dasbor" className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container transition-colors shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-label-md text-label-md tracking-widest uppercase text-on-surface-variant truncate">Wish Wall</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden lg:inline font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">Admin Mode</span>
          <ProfileMenu />
        </div>
      </header>

      <main className="mt-20 px-6 lg:px-10 max-w-7xl mx-auto w-full pb-20">
        {/* Page Header */}
        <section data-tour="wish-wall" className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="font-headline-xl text-[20px] md:text-[28px] lg:text-headline-xl leading-tight mb-2 text-[#2C2A29]">Doa & Harapan Tamu</h2>
            <p className="text-on-surface-variant text-sm md:font-body-lg opacity-80 max-w-xl leading-relaxed">
              Review doa dan ucapan manis dari para tamu sebelum ditampilkan secara langsung pada situs web undangan Anda.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-1.5">
            <button
              onClick={downloadPdf}
              disabled={downloading || approvedWishes.length === 0}
              title={approvedWishes.length === 0 ? "Belum ada doa yang disetujui" : "Unduh doa yang disetujui sebagai PDF"}
              className="inline-flex items-center justify-center gap-2 bg-[#B34E3F] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all shadow-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[16px] ${downloading ? "animate-spin" : ""}`}>
                {downloading ? "progress_activity" : "picture_as_pdf"}
              </span>
              {downloading ? "Menyiapkan PDF…" : "Download PDF"}
            </button>
            <span className="text-[11px] text-on-surface-variant text-center sm:text-right">
              {approvedWishes.length > 0 ? `${approvedWishes.length} doa disetujui` : "Belum ada doa disetujui"}
            </span>
          </div>
        </section>

        {pdfError && (
          <div className="mb-6 p-4 border border-red-300 bg-red-50 text-sm text-red-700 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {pdfError}
          </div>
        )}

        {/* Live LED Preview with Toolbar */}
        {ledUrl && (
          <section className="mb-10">
            <div className="bg-white border border-[#E2D9CF] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                  <span className="font-label-md text-[11px] text-[#C5A059] uppercase tracking-widest font-bold">Pratinjau Layar LED • Live</span>
                </div>
                <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E2D9CF] rounded-full px-3 py-2 max-w-full overflow-hidden">
                  <span className="material-symbols-outlined text-[16px] text-[#B34E3F] shrink-0">link</span>
                  <span className="font-body-md text-sm text-[#2C2A29] truncate flex-1">{ledUrl}</span>
                  <button onClick={copyLedUrl} className="shrink-0 w-7 h-7 rounded-full bg-white border border-[#E2D9CF] flex items-center justify-center text-[#B34E3F] hover:bg-[#F5EFE6] transition-colors" title={copied ? "Tersalin" : "Salin"}>
                    <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
                  </button>
                </div>
              </div>
              <a href={ledUrl} target="_blank" rel="noopener" className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#B34E3F] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all shadow-sm whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Buka Layar LED
              </a>
            </div>
            <div className="bg-white border border-[#E2D9CF] rounded-2xl p-3 shadow-lg">
              <div
                ref={ledWrapRef}
                className="relative w-full overflow-hidden bg-[#1A1817] rounded-xl flex items-center justify-center"
                style={{ aspectRatio: "16 / 9" }}
              >
                <iframe
                  src={`/led/${coupleSlug}`}
                  title="Pratinjau Layar LED"
                  loading="lazy"
                  style={{
                    width: 1280,
                    height: 720,
                    border: 0,
                    transform: `scale(${ledScale})`,
                    transformOrigin: "center",
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Search + Horizontal Filter Tabs */}
        <div className="mb-4 bg-white border border-[#E2D9CF] rounded-xl p-2 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 pl-2">search</span>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(9) }}
            placeholder="Cari nama tamu atau isi pesan…"
            className="flex-1 min-w-0 bg-transparent outline-none font-body-md text-sm text-[#2C2A29] placeholder:text-on-surface-variant/50 py-2"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="shrink-0 w-7 h-7 rounded-full hover:bg-[#F5EFE6] flex items-center justify-center text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
        {q && (
          <p className="text-xs text-on-surface-variant mb-4 px-1">
            {filtered.length} hasil untuk &ldquo;{query.trim()}&rdquo;
          </p>
        )}
        <div className="mb-6 bg-white border border-[#E2D9CF] rounded-xl p-2 flex gap-2 overflow-x-auto hide-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setVisible(9) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-label-md text-[11px] uppercase tracking-widest whitespace-nowrap shrink-0 transition-all border ${
                filter === f.key
                  ? "bg-[#B34E3F] text-white border-[#B34E3F]"
                  : "bg-[#F5EFE6] text-[#2C2A29] border-[#E2D9CF] hover:bg-[#E2D9CF]"
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === f.key ? "bg-white/20 text-white" : "bg-white text-[#2C2A29] border border-[#E2D9CF]"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {/* Main Content: Guest Message Feed */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.length === 0 && (
                <div className="md:col-span-2 text-center py-16 bg-white border border-[#E2D9CF] rounded-xl">
                  <span className="material-symbols-outlined text-5xl text-[#E2D9CF] mb-4">forum</span>
                  <p className="font-headline-md text-lg text-[#2C2A29] mb-2">Belum ada doa</p>
                  <p className="font-body-md text-sm text-on-surface-variant mb-6 max-w-md mx-auto">Bagikan link undangan agar tamu dapat mengirim ucapan dan doa.</p>
                  <button onClick={() => router.push(`/dashboard/${id}/qr-guestbook`)} className="inline-flex items-center gap-2 bg-[#B34E3F] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    Bagikan Link Undangan
                  </button>
                </div>
              )}

              {shown.map((wish) => {
                const isPending = wish.status === "pending"
                const isHidden = wish.status === "hidden"
                const sourceLabel = wish.source === "welcome" ? "Dari Welcome" : "Dari Undangan"

                return (
                  <article
                    key={wish.id}
                    className={`relative overflow-hidden flex flex-col h-full rounded-xl border shadow-sm ${wish.is_pinned ? "bg-white border-[#C5A059] border-l-4 border-l-[#C5A059]" : isPending ? "bg-[#FFFBEB] border-[#F59E0B]" : isHidden ? "bg-[#F3F4F6] border-[#D1D5DB]" : "bg-white border-[#E2D9CF]"}`}
                  >
                    <div className="p-4 md:p-5 flex flex-col h-full">
                    <div className="mb-2.5">
                      <div className="flex items-center gap-2">
                        {wish.is_pinned ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-[#C5A059]">push_pin</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-[#C5A059] tracking-widest font-bold">Disematkan</span>
                          </>
                        ) : isPending ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-[#F59E0B]">schedule</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-[#92400E] tracking-widest font-bold">Review</span>
                          </>
                        ) : isHidden ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-[#6B7280]">visibility_off</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-[#6B7280] tracking-widest font-bold">Disembunyikan</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-[#10B981]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-[#10B981] tracking-widest font-bold">Ditampilkan</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 font-label-md uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${wish.source === "welcome" ? "bg-[#C5A059]" : "bg-[#B34E3F]"}`} />
                        {sourceLabel} • {timeAgo(wish.created_at)}
                      </p>
                    </div>

                    <h3 className="font-headline-md mb-1.5 capitalize font-semibold text-[#2C2A29] text-[15px] md:text-[16px] leading-snug">{wish.name}</h3>
                    <p className={`leading-relaxed mb-4 text-[13px] md:text-sm ${wish.is_pinned ? "italic text-on-surface-variant" : "text-on-surface-variant"}`}>
                      &ldquo;{wish.message}&rdquo;
                    </p>

                    {isPending ? (
                      <div className="flex gap-2 mt-auto pt-3 border-t border-[#F59E0B]/20">
                        <button
                          onClick={() => updateWish(wish.id, { status: "approved" })}
                          className="flex-1 py-2 bg-[#B34E3F] text-white rounded-full font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => deleteWish(wish.id)}
                          className="flex-1 py-2 bg-white border border-[#DC2626] text-[#DC2626] rounded-full font-label-md text-[11px] uppercase tracking-widest hover:bg-[#FEF2F2] active:scale-95 transition-all"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-auto pt-3 border-t border-[#E2D9CF]">
                        <button
                          onClick={() => updateWish(wish.id, { status: wish.status === "approved" ? "hidden" : "approved" })}
                          className="flex-1 py-2 bg-white border border-[#E2D9CF] text-[#2C2A29] rounded-full font-label-md text-[11px] uppercase tracking-widest hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors text-center"
                        >
                          {wish.status === "approved" ? "Sembunyikan" : "Tampilkan"}
                        </button>
                        <button
                          onClick={() => updateWish(wish.id, { is_pinned: !wish.is_pinned })}
                          className={`flex-1 py-2 rounded-full font-label-md text-[11px] uppercase tracking-widest transition-colors text-center ${wish.is_pinned ? "bg-white border border-[#C5A059] text-[#C5A059] hover:bg-[#FFFBEB]" : "bg-white border border-[#E2D9CF] text-[#2C2A29] hover:border-[#C5A059] hover:text-[#C5A059]"}`}
                        >
                          {wish.is_pinned ? "Lepas Semat" : "Sematkan"}
                        </button>
                      </div>
                    )}
                    </div>
                  </article>
                )
              })}
            </div>

            {filtered.length > visible && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisible(v => v + 9)}
                  className="px-10 py-4 border border-outline text-on-surface font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-high transition-all"
                >
                  Muat Pesan Lainnya
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
