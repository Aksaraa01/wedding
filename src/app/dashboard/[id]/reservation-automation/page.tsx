"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type RsvpGuest = {
  id: string
  name: string
  phone_number: string
  category: string
  table_number: string
  guest_count: number
  rsvp_status: string | null
  rsvp_pax_count: number | null
  rsvp_message: string | null
  rsvp_responded_at: string | null
  is_checked_in: boolean
}

type Stats = {
  total: number
  hadir: number
  tidak_hadir: number
  belum_respon: number
}

export default function ReservationAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [guests, setGuests] = useState<RsvpGuest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, hadir: 0, tidak_hadir: 0, belum_respon: 0 })
  const [wishByGuestId, setWishByGuestId] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/${id}/reservation-automation`)
      .then(res => res.json())
      .then(data => {
        setGuests(data.guests || [])
        setStats(data.stats)
        setWishByGuestId(data.wish_by_guest_id || {})
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const filtered = guests.filter(g => {
    if (filter === "HADIR" && g.rsvp_status !== "HADIR") return false
    if (filter === "TIDAK_HADIR" && g.rsvp_status !== "TIDAK_HADIR") return false
    if (filter === "BELUM_RESPON" && (g.rsvp_status === "HADIR" || g.rsvp_status === "TIDAK_HADIR")) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const belumResponCount = stats.belum_respon

  function donutSegments() {
    const total = stats.total || 1
    const h = (stats.hadir / total) * 100
    const th = (stats.tidak_hadir / total) * 100
    const br = (stats.belum_respon / total) * 100
    return { h, th, br }
  }

  const segs = donutSegments()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-surface text-on-surface font-body-md">
        {/* Top AppBar */}
        <header className="fixed top-0 w-full z-50 border-b border-outline-variant/30 h-20 flex items-center px-6 md:px-12 bg-surface">
          <button onClick={() => router.push(`/dashboard/${id}`)} className="flex items-center gap-2 text-primary group transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-label-md text-label-md uppercase tracking-widest">Kembali</span>
          </button>
        </header>

        <main className="pt-32 pb-40 px-6 md:px-12 max-w-3xl mx-auto">
          {/* Title */}
          <section className="mb-12">
            <h1 className="font-headline-xl text-display-lg-mobile md:text-headline-xl leading-tight mb-2">Reservasi</h1>
          </section>

          {/* Stats Donut */}
          <section className="mb-12 border border-outline-variant/20 p-8 bg-surface-container-low">
            <h2 className="font-label-md text-label-md uppercase mb-8 opacity-60 tracking-[0.2em]">Ringkasan Statistik</h2>
            <div className="flex flex-col items-center gap-10">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e6e2d9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#c8c6c3" strokeWidth="3" strokeDasharray={`${segs.br + segs.th} ${segs.h}`} />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#747878" strokeWidth="3" strokeDasharray={`${segs.br} ${segs.h + segs.th}`} />
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#8d4d39" strokeWidth="3" strokeDasharray={`${segs.h} ${segs.th + segs.br}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline-md text-headline-md leading-none">{stats.total}</span>
                  <span className="font-label-md text-[10px] uppercase tracking-tighter opacity-60">Total Tamu</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-4">
                {[
                  { label: "Hadir", color: "bg-secondary", value: stats.hadir, pct: stats.total ? Math.round((stats.hadir / stats.total) * 100) : 0 },
                  { label: "Tidak Hadir", color: "bg-[#747878]", value: stats.tidak_hadir, pct: stats.total ? Math.round((stats.tidak_hadir / stats.total) * 100) : 0 },
                  { label: "Belum Respon", color: "bg-[#c8c6c3]", value: stats.belum_respon, pct: stats.total ? Math.round((stats.belum_respon / stats.total) * 100) : 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${item.color}`} />
                      <span className="font-body-md">{item.label}</span>
                    </div>
                    <span className="font-label-md">{item.value} Orang ({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Action Banner */}
          {belumResponCount > 0 && (
            <section className="mb-16">
              <div className="bg-primary-container p-8 text-on-primary">
                <p className="font-body-md italic mb-6 leading-relaxed opacity-90">
                  &quot;{belumResponCount} tamu kehormatan yang belum memberikan konfirmasi kehadiran.&quot;
                </p>
                <button className="w-full bg-on-primary text-primary py-5 px-6 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary transition-colors duration-300">
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  Kirim Pengingat via WhatsApp
                </button>
              </div>
            </section>
          )}

          {/* Guest List */}
          <section className="space-y-8">
            <div className="flex flex-col gap-6">
              <div className="relative border-b border-primary/20 pb-2 flex items-center">
                <span className="material-symbols-outlined absolute left-0 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Cari nama tamu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 bg-transparent border-none focus:ring-0 text-body-md placeholder:italic placeholder:opacity-40 outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {[
                  { key: null, label: `Semua (${stats.total})` },
                  { key: "HADIR", label: `Hadir (${stats.hadir})` },
                  { key: "TIDAK_HADIR", label: `Tidak Hadir (${stats.tidak_hadir})` },
                  { key: "BELUM_RESPON", label: `Belum Respon (${stats.belum_respon})` },
                ].map(chip => (
                  <button
                    key={chip.key || "all"}
                    onClick={() => setFilter(chip.key)}
                    className={`whitespace-nowrap px-6 py-2 font-label-md text-[11px] uppercase tracking-wider transition-colors ${
                      filter === chip.key
                        ? "border border-primary bg-primary text-on-primary"
                        : "border border-outline-variant text-on-surface-variant hover:border-primary"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30">
              {filtered.length === 0 && (
                <p className="py-12 text-center font-body-md italic opacity-40">Tidak ada tamu ditemukan.</p>
              )}
              {filtered.map(guest => {
                const statusBadge = guest.rsvp_status === "HADIR"
                  ? { label: "Hadir", class: "bg-secondary/10 text-secondary border-secondary/20" }
                  : guest.rsvp_status === "TIDAK_HADIR"
                  ? { label: "Tidak Hadir", class: "bg-[#747878]/10 text-[#747878] border-[#747878]/20" }
                  : { label: "Belum Respon", class: "bg-[#c8c6c3]/30 text-on-surface-variant border-[#c8c6c3]/50" }

                const pax = guest.rsvp_pax_count ?? guest.guest_count ?? 1
                const wishMessage = wishByGuestId[guest.id]

                return (
                  <div key={guest.id} className="py-8 flex flex-col gap-3 group transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-headline-md text-[20px] mb-1">{guest.name}</h3>
                        <p className="font-label-md text-[12px] opacity-60 tracking-wider">{guest.phone_number}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 border font-label-md text-[10px] uppercase tracking-widest ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                        {guest.rsvp_status === "HADIR" && (
                          <span className="px-3 py-1 border border-outline-variant/50 text-on-surface-variant font-label-md text-[10px] uppercase tracking-widest">
                            {pax} Pax
                          </span>
                        )}
                      </div>
                    </div>
                    {wishMessage && (
                      <p className="font-body-md italic text-on-surface-variant/70 leading-relaxed">&ldquo;{wishMessage}&rdquo;</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
