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
  invitation_opened_at: string | null
}

type Stats = {
  total: number
  hadir: number
  tidak_hadir: number
  belum_respon: number
  dibuka: number
  belum_dibuka: number
}

export default function ReservationAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [guests, setGuests] = useState<RsvpGuest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, hadir: 0, tidak_hadir: 0, belum_respon: 0, dibuka: 0, belum_dibuka: 0 })
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
    if (filter === "DIBUKA" && !g.invitation_opened_at) return false
    if (filter === "BELUM_DIBUKA" && g.invitation_opened_at) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const belumResponCount = stats.belum_respon
  const openRate = stats.total ? Math.round((stats.dibuka / stats.total) * 100) : 0
  const rsvpRate = stats.total ? Math.round((stats.hadir / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  const openPct = openRate
  const hadirPct = rsvpRate

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-surface text-on-surface font-body-md overflow-x-hidden">
        {/* Top AppBar */}
        <header className="fixed top-0 w-full z-50 border-b border-outline-variant/30 h-20 flex items-center px-edge-margin-mobile lg:px-edge-margin-desktop bg-surface/95 backdrop-blur-md">
          <div className="max-w-container-max mx-auto w-full">
            <button onClick={() => router.push(`/dashboard/${id}`)} className="flex items-center gap-2 text-primary group transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="font-label-md text-label-md uppercase tracking-widest">Kembali</span>
            </button>
          </div>
        </header>

        <main className="pt-32 pb-40 px-edge-margin-mobile lg:px-edge-margin-desktop max-w-container-max mx-auto">
          {/* Title */}
          <section className="mb-12">
            <h1 className="font-headline-xl text-display-lg-mobile md:text-headline-xl leading-tight mb-2">Reservasi</h1>
          </section>

          {/* Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Column: Statistics & Action */}
            <div className="lg:col-span-5 space-y-12">
              <section className="border border-outline-variant/20 p-8 bg-surface-container-low lg:sticky lg:top-32">
                <h2 className="font-label-md text-label-md uppercase mb-10 opacity-60 tracking-[0.2em]">Ringkasan Statistik</h2>
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-2">
                    {/* Stage 1: Total Undangan */}
                    <div className="relative">
                      <div className="bg-outline-variant/30 w-full flex items-center relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center py-4 w-full">
                          <span className="font-label-md text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">Total Undangan</span>
                          <span className="font-headline-md text-[32px] leading-none">{stats.total}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1 px-2">
                        <span className="text-[10px] font-label-md opacity-40">BASE</span>
                        <span className="text-[10px] font-label-md">100%</span>
                      </div>
                    </div>
                    {/* Stage 2: Undangan Dibuka */}
                    <div className="relative">
                      <div className="bg-primary mx-auto flex items-center relative text-on-primary" style={{ width: `${openPct}%` }}>
                        <div className="flex flex-col items-center justify-center py-4 w-full">
                          <span className="font-label-md text-[10px] uppercase tracking-[0.2em] opacity-40 mb-1 text-white">Dibuka</span>
                          <span className="font-headline-md text-[32px] leading-none">{stats.dibuka}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1" style={{ paddingLeft: `${(100 - openPct) / 2}%`, paddingRight: `${(100 - openPct) / 2}%` }}>
                        <span className="text-[10px] font-label-md opacity-40">OPEN RATE</span>
                        <span className="text-[10px] font-label-md">{openPct}%</span>
                      </div>
                    </div>
                    {/* Stage 3: Konfirmasi Hadir */}
                    <div className="relative">
                      <div className="bg-secondary mx-auto flex items-center relative text-on-primary" style={{ width: `${hadirPct}%` }}>
                        <div className="flex flex-col items-center justify-center py-4 w-full">
                          <span className="font-label-md text-[10px] uppercase tracking-[0.2em] opacity-40 mb-1 text-white">Hadir</span>
                          <span className="font-headline-md text-[32px] leading-none">{stats.hadir}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1" style={{ paddingLeft: `${(100 - hadirPct) / 2}%`, paddingRight: `${(100 - hadirPct) / 2}%` }}>
                        <span className="text-[10px] font-label-md opacity-40">RSVP RATE</span>
                        <span className="text-[10px] font-label-md">{hadirPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Banner */}
              <section className="space-y-6">
                <div className="bg-primary-container p-8 text-on-primary">
                  <p className="font-body-md italic mb-6 leading-relaxed opacity-90">
                    {belumResponCount > 0
                      ? `"${belumResponCount} tamu kehormatan yang belum memberikan konfirmasi kehadiran."`
                      : `"${stats.total} tamu undangan telah diinput. Kelola tautan unik dan kirim pengingat sesuai kebutuhan Anda."`}
                  </p>
                  <button
                    onClick={() => router.push(`/dashboard/${id}/reminder-tamu-vip`)}
                    className="w-full bg-on-primary text-primary py-5 px-6 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary transition-colors duration-300"
                  >
                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                    Kirim Pengingat via WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/${id}/qr-guestbook`)}
                  className="w-full border border-primary/40 text-primary py-5 px-6 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-on-primary transition-colors duration-300"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  Kelola QR &amp; Tautan Tamu
                </button>
              </section>
            </div>

            {/* Right Column: Guest List */}
            <div className="lg:col-span-7">
              <section className="space-y-12">
                <div className="flex flex-col gap-8 bg-surface-container/30 p-8 border border-outline-variant/10">
                  {/* Search Bar */}
                  <div className="relative border-b pb-4 flex items-center border-primary/20 focus-within:border-primary transition-colors">
                    <span className="material-symbols-outlined absolute left-0 text-on-surface-variant">search</span>
                    <input
                      className="w-full pl-10 bg-transparent border-none focus:ring-0 text-[14px] placeholder:italic placeholder:opacity-30 outline-none"
                      placeholder="Cari nama tamu..."
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                    {[
                      { key: null, label: `Semua (${stats.total})` },
                      { key: "HADIR", label: `Hadir (${stats.hadir})` },
                      { key: "TIDAK_HADIR", label: `Tidak Hadir (${stats.tidak_hadir})` },
                      { key: "BELUM_RESPON", label: `Belum Respon (${stats.belum_respon})` },
                      { key: "DIBUKA", label: `Dibuka (${stats.dibuka})` },
                      { key: "BELUM_DIBUKA", label: `Belum Dibuka (${stats.belum_dibuka})` },
                    ].map(chip => (
                      <button
                        key={chip.key || "all"}
                        onClick={() => setFilter(chip.key)}
                        className={`whitespace-nowrap px-8 py-3 border font-label-md text-[11px] uppercase tracking-wider transition-all ${
                          filter === chip.key
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Rows */}
                <div className="divide-y divide-outline-variant/20 border-t border-outline-variant/20">
                  {filtered.length === 0 && (
                    <p className="py-16 text-center font-body-md italic opacity-40">Tidak ada tamu ditemukan.</p>
                  )}
                  {filtered.map(guest => {
                    const openBadge = guest.invitation_opened_at
                      ? { label: "Dibuka", class: "bg-primary/10 text-primary border-primary/20" }
                      : { label: "Belum Dibuka", class: "bg-outline-variant/10 text-outline border-outline-variant/30" }

                    const rsvpBadge = guest.rsvp_status === "HADIR"
                      ? { label: "Hadir", class: "bg-secondary/10 text-secondary border-secondary/20" }
                      : guest.rsvp_status === "TIDAK_HADIR"
                      ? { label: "Tidak Hadir", class: "bg-[#747878]/10 text-[#747878] border-[#747878]/20" }
                      : { label: "Belum Respon", class: "bg-[#c8c6c3]/30 text-on-surface-variant border-[#c8c6c3]/50" }

                    const pax = guest.rsvp_pax_count ?? guest.guest_count ?? 1
                    const wishMessage = wishByGuestId[guest.id]

                    return (
                      <div key={guest.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-surface-container-low transition-colors px-4 md:px-8 py-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-headline-md text-[24px] mb-1 truncate">{guest.name}</h3>
                          <p className="font-label-md text-[12px] tracking-widest opacity-40">{guest.phone_number}</p>
                          {wishMessage && (
                            <p className="mt-3 font-body-md italic text-on-surface-variant/70 leading-relaxed">&ldquo;{wishMessage}&rdquo;</p>
                          )}
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                          <span className={`px-4 py-2 border font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap ${openBadge.class}`}>
                            {openBadge.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-4 py-2 border font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap ${rsvpBadge.class}`}>
                              {rsvpBadge.label}
                            </span>
                            {guest.rsvp_status === "HADIR" && (
                              <span className="px-4 py-2 border border-outline-variant/50 text-on-surface-variant font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap">
                                {pax} Pax
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
