"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Wish = {
  id: string
  name: string
  message: string
  status: string
  is_pinned: boolean
  created_at: string
}

type Stats = {
  total: number
  pending: number
  approved: number
}

export default function WishWallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [wishes, setWishes] = useState<Wish[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0 })
  const [filter, setFilter] = useState("all")
  const [coupleSlug, setCoupleSlug] = useState("")
  const [copied, setCopied] = useState(false)

  const fetchWishes = async () => {
    const base = `/api/wishes?wedding_profile_id=${id}`
    const res = await fetch(base)
    if (!res.ok) return
    const data = await res.json()
    setWishes(data.wishes || [])
    const all = data.wishes || []
    setStats({
      total: all.length,
      pending: all.filter((w: Wish) => w.status === "pending").length,
      approved: all.filter((w: Wish) => w.status === "approved").length,
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

  const ledUrl = coupleSlug ? `https://${coupleSlug}.aksaraa.com/led` : ""

  const copyLedUrl = () => {
    if (!ledUrl) return
    navigator.clipboard.writeText(ledUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const FILTERS = [
    { key: "all", label: "Semua Doa" },
    { key: "pending", label: "Menunggu Moderasi" },
    { key: "approved", label: "Disetujui" },
    { key: "pinned", label: "Disematkan" },
  ]

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md antialiased pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-6 h-16">
        <button onClick={() => router.push(`/dashboard/${id}`)} className="flex items-center gap-2 text-on-surface hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md tracking-widest uppercase">Kembali</span>
        </button>
      </header>

      <main className="mt-20 px-6 max-w-lg mx-auto w-full">
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-[1px] bg-secondary" />
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">Dasbor Pernikahan</span>
          </div>
          <h2 className="font-headline-md text-headline-md leading-tight mb-3">Moderasi Dinding Doa</h2>
          <p className="text-on-surface-variant font-body-md opacity-80">
            Kurasi doa dan ucapan manis dari para tamu sebelum ditampilkan secara langsung pada situs web undangan Anda.
          </p>
        </section>

        <section className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col items-center text-center">
            <span className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Total</span>
            <span className="font-headline-md text-[24px]">{stats.total}</span>
            <span className="font-label-md text-[10px] text-on-surface-variant">Pesan</span>
          </div>
          <div className="bg-secondary/5 border border-secondary/20 p-4 flex flex-col items-center text-center">
            <span className="font-label-md text-label-md text-secondary mb-1 uppercase">Menunggu</span>
            <span className="font-headline-md text-[24px] text-secondary">{stats.pending}</span>
            <span className="font-label-md text-[10px] text-secondary">Pesan</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col items-center text-center">
            <span className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Aktif</span>
            <span className="font-headline-md text-[24px]">{stats.approved}</span>
            <span className="font-label-md text-[10px] text-on-surface-variant">Pesan</span>
          </div>
        </section>

        {ledUrl && (
          <section className="mb-10 p-6 bg-secondary/5 border border-secondary/20">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">Tautan Layar Proyeksi LED Ballroom</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-md text-[10px] text-secondary uppercase tracking-widest">Siap Tayang</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 bg-white border border-secondary/10">
              <span className="font-body-md text-on-surface-variant truncate">{ledUrl}</span>
              <div className="flex gap-2">
                <button onClick={copyLedUrl} className="p-2 hover:bg-surface-container-low transition-colors text-secondary" title="Salin">
                  <span className="material-symbols-outlined text-[20px]">{copied ? "check" : "content_copy"}</span>
                </button>
                <a href={ledUrl} target="_blank" rel="noopener" className="p-2 hover:bg-surface-container-low transition-colors text-secondary" title="Buka">
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="mb-8 -mx-6 px-6 overflow-x-auto flex gap-3" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full font-label-md text-label-md transition-all active:scale-95 whitespace-nowrap ${
                filter === f.key
                  ? "bg-primary text-on-primary"
                  : "border border-outline text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {f.label}
            </button>
          ))}
        </section>

        <div className="space-y-6">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">forum</span>
              <p className="text-on-surface-variant mt-4">Belum ada doa</p>
            </div>
          )}

          {filtered.map((wish) => (
            <article
              key={wish.id}
              className={`bg-white p-6 border relative overflow-hidden ${
                wish.status === "pending" ? "border-secondary/20 bg-secondary/5" : "border-outline-variant/30"
              }`}
            >
              {wish.is_pinned && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              )}

              <div className="flex items-center gap-2 mb-4">
                {wish.is_pinned ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-primary">push_pin</span>
                    <span className="font-label-md text-label-md uppercase text-primary tracking-widest">Disematkan</span>
                  </>
                ) : wish.status === "pending" ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                    <span className="font-label-md text-label-md uppercase text-secondary tracking-widest">Menunggu Persetujuan</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest">Ditampilkan</span>
                  </>
                )}
              </div>

              <h3 className="font-headline-md text-[20px] mb-2">{wish.name}</h3>
              <p className="font-body-md italic text-on-surface-variant mb-6 leading-relaxed">
                &ldquo;{wish.message}&rdquo;
              </p>

              {wish.status === "pending" ? (
                <div className="flex flex-col gap-3 pt-4 border-t border-secondary/10">
                  <button
                    onClick={() => updateWish(wish.id, { status: "approved" })}
                    className="w-full py-3 bg-secondary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    Setujui &amp; Tampilkan
                  </button>
                  <button
                    onClick={() => deleteWish(wish.id)}
                    className="w-full py-3 text-secondary font-label-md text-label-md uppercase tracking-widest hover:underline transition-all"
                  >
                    Tolak
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 pt-4 border-t border-outline-variant/30">
                  <button
                    onClick={() => updateWish(wish.id, { status: wish.status === "approved" ? "hidden" : "approved" })}
                    className="flex-1 py-3 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors text-center"
                  >
                    {wish.status === "approved" ? "Sembunyikan" : "Tampilkan"}
                  </button>
                  <button
                    onClick={() => updateWish(wish.id, { is_pinned: !wish.is_pinned })}
                    className="flex-1 py-3 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-surface-container-low transition-colors text-center"
                  >
                    {wish.is_pinned ? "Lepas Semat" : "Sematkan"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
