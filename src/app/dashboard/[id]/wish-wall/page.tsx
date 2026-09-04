"use client"

import { use, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"

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
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, pinned: 0 })
  const [filter, setFilter] = useState("all")
  const [coupleSlug, setCoupleSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(6)
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
    })
  }

  useEffect(() => {
    fetch(`/api/dashboard/${id}`).then(r => r.json()).then(data => {
      if (data?.profile?.slug) setCoupleSlug(data.profile.slug)
    })
    fetchWishes()
  }, [id])

  const filtered = wishes.filter((w) => {
    if (filter === "all") return true
    if (filter === "pending") return w.status === "pending"
    if (filter === "approved") return w.status === "approved"
    if (filter === "pinned") return w.is_pinned
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
    { key: "pinned", label: "Disematkan", count: stats.pinned },
  ]

  return (
    <div className="min-h-screen bg-[#fdf9f0] text-[#1c1c16] font-body-md text-body-md antialiased pb-20">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .editorial-shadow { box-shadow: 0 4px 20px -2px rgba(28, 28, 22, 0.05); }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-[#fdf9f0]/80 backdrop-blur-md border-b border-[#c4c7c7]/30 flex justify-between items-center px-6 lg:px-10 h-16">
        <span className="font-label-md text-label-md tracking-widest uppercase text-on-surface-variant">Wish Wall</span>
        <div className="flex items-center gap-4">
          <span className="hidden lg:inline font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">Admin Mode</span>
          <ProfileMenu />
        </div>
      </header>

      <main className="mt-20 px-6 lg:px-10 max-w-7xl mx-auto w-full pb-20">
        {/* Page Header */}
        <section className="mb-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-headline-xl text-[20px] md:text-[28px] lg:text-headline-xl leading-tight mb-2">Doa & Harapan Tamu</h2>
            <p className="text-on-surface-variant text-sm md:font-body-lg opacity-80 max-w-xl leading-relaxed">
              Review doa dan ucapan manis dari para tamu sebelum ditampilkan secara langsung pada situs web undangan Anda.
            </p>
          </div>

          {ledUrl && (
            <div className="w-full lg:max-w-md">
              <div className="flex flex-col gap-1 mb-3">
                <span className="font-label-md text-[11px] text-secondary uppercase tracking-widest">Link Layar LED</span>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 bg-white border border-[#8d4d39]/10">
                <span className="font-body-md text-on-surface-variant truncate text-sm">{ledUrl}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={copyLedUrl} className="p-2 hover:bg-surface-container-low transition-colors text-secondary" title="Salin">
                    <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
                  </button>
                  <a href={ledUrl} target="_blank" rel="noopener" className="p-2 hover:bg-surface-container-low transition-colors text-secondary" title="Buka">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live LED Preview */}
        {ledUrl && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="w-8 h-[1px] bg-secondary shrink-0" />
              <span className="font-label-md text-[11px] md:text-label-md text-secondary uppercase tracking-widest">Pratinjau Layar LED</span>
              <span className="hidden sm:inline text-secondary/40">—</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-md text-[10px] text-secondary uppercase tracking-widest">Live • Auto-refresh</span>
              </span>
            </div>
            <div className="bg-black border border-[#1c1c16]/20 p-2 md:p-3 shadow-xl">
              <div
                ref={ledWrapRef}
                className="relative w-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center"
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

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4 lg:space-y-6">
              <h4 className="hidden lg:block font-label-md text-label-md uppercase tracking-widest text-on-surface-variant border-b border-[#c4c7c7]/30 pb-4">Filter Pesan</h4>
              <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 lg:py-3 font-label-md text-[11px] lg:text-label-md text-left whitespace-nowrap shrink-0 transition-all rounded-full lg:rounded-none border lg:border-0 ${
                      filter === f.key
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-white border-[#c4c7c7]/40 hover:bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {f.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? "bg-white/20" : f.key === "pending" ? "bg-secondary/10 text-secondary" : "bg-surface-container text-on-surface-variant"}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="pt-6 border-t border-[#c4c7c7]/30">
                <p className="text-[12px] text-on-surface-variant leading-relaxed italic">
                  &ldquo;Moderasi dilakukan secara real-time. Pesan yang disetujui akan langsung muncul di dinding doa digital.&rdquo;
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content: Guest Message Feed */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shown.length === 0 && (
                <div className="md:col-span-2 text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">forum</span>
                  <p className="text-on-surface-variant mt-4">Belum ada doa</p>
                </div>
              )}

              {shown.map((wish) => {
                const isPending = wish.status === "pending"
                const sourceLabel = wish.source === "welcome" ? "Dari Welcome" : "Dari Undangan"

                return (
                  <article
                    key={wish.id}
                    className={`relative overflow-hidden flex flex-col h-full ${wish.is_pinned ? "md:col-span-2 bg-white p-8 border border-[#c4c7c7]/30 editorial-shadow" : isPending ? "bg-[#8d4d39]/5 p-8 border border-[#8d4d39]/20" : "bg-white p-8 border border-[#c4c7c7]/30 editorial-shadow"}`}
                  >
                    {wish.is_pinned && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}

                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        {wish.is_pinned ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-primary">push_pin</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-primary tracking-widest">Disematkan</span>
                          </>
                        ) : isPending ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-secondary">schedule</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-secondary tracking-widest">Review</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <span className="font-label-md text-[11px] md:text-label-md uppercase text-on-surface-variant tracking-widest">Ditampilkan</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 font-label-md uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${wish.source === "welcome" ? "bg-secondary" : "bg-primary"}`} />
                        {sourceLabel} • {timeAgo(wish.created_at)}
                      </p>
                    </div>

                    <h3 className={`font-headline-md mb-3 ${wish.is_pinned ? "text-[18px] md:text-headline-md" : "text-[18px] md:text-[22px]"}`}>{wish.name}</h3>
                    <p className={`leading-relaxed mb-6 ${wish.is_pinned ? "text-sm md:font-body-lg italic text-on-surface-variant max-w-3xl" : "text-sm md:font-body-md text-on-surface-variant"}`}>
                      &ldquo;{wish.message}&rdquo;
                    </p>

                    {isPending ? (
                      <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-[#8d4d39]/10">
                        <button
                          onClick={() => updateWish(wish.id, { status: "approved" })}
                          className="w-full py-4 bg-secondary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98]"
                        >
                          Setujui &amp; Tampilkan
                        </button>
                        <button
                          onClick={() => deleteWish(wish.id)}
                          className="w-full py-2 text-secondary font-label-md text-label-md uppercase tracking-widest hover:underline transition-all"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-4 mt-auto pt-6 border-t border-[#c4c7c7]/30">
                        <button
                          onClick={() => updateWish(wish.id, { status: wish.status === "approved" ? "hidden" : "approved" })}
                          className="flex-1 py-3 border border-primary text-primary font-label-md text-[11px] lg:text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors text-center"
                        >
                          {wish.status === "approved" ? "Sembunyikan" : "Tampilkan"}
                        </button>
                        <button
                          onClick={() => updateWish(wish.id, { is_pinned: !wish.is_pinned })}
                          className="flex-1 py-3 border border-primary text-primary font-label-md text-[11px] lg:text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors text-center"
                        >
                          {wish.is_pinned ? "Lepas Semat" : "Sematkan"}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {filtered.length > visible && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisible(v => v + 6)}
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
