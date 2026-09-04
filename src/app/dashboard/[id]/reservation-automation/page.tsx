"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"

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
  dibuka: number
  belum_dibuka: number
}

export default function ReservationAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [guests, setGuests] = useState<RsvpGuest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, hadir: 0, tidak_hadir: 0, dibuka: 0, belum_dibuka: 0 })
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

  const hasRsvp = (g: RsvpGuest) => g.rsvp_status === "HADIR" || g.rsvp_status === "TIDAK_HADIR"

  const filtered = guests.filter(g => {
    if (filter === "HADIR" && g.rsvp_status !== "HADIR") return false
    if (filter === "TIDAK_HADIR" && g.rsvp_status !== "TIDAK_HADIR") return false
    if (filter === "DIBUKA" && (hasRsvp(g) || !g.invitation_opened_at)) return false
    if (filter === "BELUM_DIBUKA" && (hasRsvp(g) || g.invitation_opened_at)) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const [showWaBlastModal, setShowWaBlastModal] = useState(false)
  const [waBlastEnabled, setWaBlastEnabled] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/${id}`)
      .then(r => r.json())
      .then(data => {
        const set = data.feature_set as string[] | undefined
        if (Array.isArray(set)) setWaBlastEnabled(set.includes("wa_blast"))
      })
      .catch(() => {})
  }, [id])

  const belumKonfirmasi = Math.max(0, stats.total - stats.hadir - stats.tidak_hadir)
  const openPct = stats.total ? Math.round((stats.dibuka / stats.total) * 100) : 0
  const conversionPct = stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0

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
        .conversion-line::before {
          content: '';
          position: absolute;
          left: 24px;
          top: 40px;
          bottom: 40px;
          width: 1px;
          background-color: #e6e2d9;
          z-index: 0;
        }
      `}</style>

      <div className="min-h-screen bg-surface text-on-surface font-body-md overflow-x-hidden">
        {/* Top AppBar */}
        <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 border-b border-[#c4c7c7]/30 h-20 flex items-center justify-between px-edge-margin-mobile lg:px-edge-margin-desktop bg-surface/95 backdrop-blur-md">
          <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">RSVP Automation</span>
          <ProfileMenu />
        </header>

        <main className="pt-32 pb-28 md:pb-40 px-edge-margin-mobile lg:px-edge-margin-desktop max-w-container-max mx-auto">
          {/* Title */}
          <section className="mb-12">
            <h1 className="font-headline-xl text-display-lg-mobile md:text-headline-xl leading-tight mb-2">Reservasi</h1>
          </section>

          {/* Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Column: Statistics & Action */}
            <div className="lg:col-span-5 space-y-12">
              <section className="border border-[#c4c7c7]/20 p-8 bg-surface-container-low lg:sticky lg:top-32">
                <h2 className="font-label-md text-label-md uppercase mb-10 opacity-60 tracking-[0.2em]">Ringkasan Statistik</h2>
                <div className="relative conversion-line">
                  {/* Stage 1: Total Undangan */}
                  <div className="relative z-10 flex items-start gap-6 mb-12">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center border-4 border-background shrink-0">
                      <span className="material-symbols-outlined text-[20px]">groups</span>
                    </div>
                    <div className="flex-1 bg-surface-container-low p-6 border border-[#c4c7c7]/30">
                      <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-2">Total Undangan</p>
                      <div className="flex items-baseline gap-3">
                        <span className="font-headline-lg text-headline-lg">{stats.total}</span>
                        <span className="text-on-surface-variant text-sm">Guests</span>
                      </div>
                      <div className="mt-4 h-1 w-full bg-surface-variant">
                        <div className="h-full bg-primary" style={{ width: "100%" }} />
                      </div>
                      <p className="mt-2 font-label-md text-[10px] text-on-surface-variant">100% BASE CAPACITY</p>
                    </div>
                  </div>

                  {/* Stage 2: Dibuka */}
                  <div className="relative z-10 flex items-start gap-6 mb-12">
                    <div className="w-12 h-12 rounded-full bg-white border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">mark_email_read</span>
                    </div>
                    <div className="flex-1 bg-white p-6 border border-outline-variant">
                      <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-2">Dibuka</p>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-3">
                          <span className="font-headline-lg text-headline-lg">{stats.dibuka}</span>
                          <span className="text-on-surface-variant text-sm">Undangan</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{openPct}%</span>
                          <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant">Open Rate</p>
                        </div>
                      </div>
                      <div className="mt-4 h-1 w-full bg-surface-variant overflow-hidden">
                        <div className="h-full bg-secondary-container" style={{ width: `${Math.min(Math.max(openPct, 4), 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: Konfirmasi Hadir */}
                  <div className="relative z-10 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full bg-white border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    </div>
                    <div className="flex-1 bg-primary text-white p-6">
                      <p className="font-label-md text-label-md uppercase tracking-widest text-white mb-2">Konfirmasi Hadir</p>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-3">
                          <span className="font-headline-lg text-headline-lg text-white">{stats.hadir}</span>
                          <span className="text-white text-sm">Confirmed</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-white">{conversionPct}%</span>
                          <p className="text-[10px] uppercase tracking-tighter text-white">Conversion</p>
                        </div>
                      </div>
                      <div className="mt-4 h-1 w-full bg-white/30 overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${Math.min(Math.max(conversionPct, 4), 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Banner */}
              <section className="space-y-6">
                <div className="bg-primary-container p-8 text-on-primary">
                  <p className="font-body-md italic mb-6 leading-relaxed opacity-90">
                    {belumKonfirmasi > 0
                      ? `"${belumKonfirmasi} tamu kehormatan yang belum memberikan konfirmasi kehadiran."`
                      : `"${stats.total} tamu undangan telah diinput. Kelola tautan unik dan kirim pengingat sesuai kebutuhan Anda."`}
                  </p>
                  <button
                    onClick={() => {
                      if (!waBlastEnabled) { setShowWaBlastModal(true); return }
                      router.push(`/dashboard/${id}/reminder-tamu-vip`)
                    }}
                    className="w-full bg-on-primary text-primary min-h-[44px] md:min-h-0 py-5 px-6 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary transition-colors duration-300"
                  >
                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                    Kirim Pengingat via WhatsApp
                  </button>
                </div>
                  <button
                    onClick={() => router.push(`/dashboard/${id}/qr-guestbook`)}
                    className="w-full border border-[#1a1a1a]/40 text-primary min-h-[44px] md:min-h-0 py-5 px-6 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-on-primary transition-colors duration-300"
                  >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  Kelola QR &amp; Tautan Tamu
                </button>
              </section>
            </div>

            {/* Right Column: Guest List */}
            <div className="lg:col-span-7 lg:h-[calc(100vh-9rem)] lg:flex lg:flex-col lg:gap-8">
                <div className="flex flex-col gap-8 bg-[#f2ede4]/30 p-8 border border-[#c4c7c7]/10 shrink-0">
                  {/* Search Bar */}
                  <div className="relative border-b pb-4 flex items-center border-[#1a1a1a]/20 focus-within:border-primary transition-colors">
                    <span className="material-symbols-outlined absolute left-0 text-on-surface-variant">search</span>
                    <input
                      className="w-full pl-10 bg-transparent border-none focus:ring-0 text-[14px] placeholder:italic placeholder:opacity-30 outline-none min-h-[44px] md:min-h-0 py-3 md:py-0"
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
                      { key: "BELUM_DIBUKA", label: `Belum Dibuka (${stats.belum_dibuka})` },
                      { key: "DIBUKA", label: `Dibuka (${stats.dibuka})` },
                      { key: "HADIR", label: `Hadir (${stats.hadir})` },
                      { key: "TIDAK_HADIR", label: `Tidak Hadir (${stats.tidak_hadir})` },
                    ].map(chip => (
                      <button
                        key={chip.key || "all"}
                        onClick={() => setFilter(chip.key)}
                        className={`whitespace-nowrap px-8 min-h-[44px] md:min-h-0 py-4 md:py-3 border font-label-md text-[11px] uppercase tracking-wider transition-all ${
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

                {/* List Rows - mobile as table */}
                <div className="flex-1 overflow-hidden border border-[#c4c7c7]/20 bg-white flex flex-col">
                  {/* Mobile table */}
                  <div className="md:hidden flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10 border-b border-[#c4c7c7]/30">
                        <tr className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
                          <th className="px-4 py-3 font-semibold">Nama</th>
                          <th className="px-2 py-3 font-semibold text-center whitespace-nowrap">Status</th>
                          <th className="px-2 py-3 font-semibold text-center">Pax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c4c7c7]/15">
                        {filtered.length === 0 && (
                          <tr><td colSpan={3} className="py-12 text-center font-body-md italic opacity-40 text-[14px]">Tidak ada tamu ditemukan.</td></tr>
                        )}
                        {filtered.map(guest => {
                          const statusBadge = guest.rsvp_status === "HADIR"
                            ? { label: "Hadir", class: "bg-[#8d4d39]/10 text-secondary border-[#8d4d39]/20" }
                            : guest.rsvp_status === "TIDAK_HADIR"
                            ? { label: "Tidak Hadir", class: "bg-[#747878]/10 text-[#747878] border-[#747878]/20" }
                            : guest.invitation_opened_at
                            ? { label: "Dibuka", class: "bg-[#1a1a1a]/10 text-primary border-[#1a1a1a]/20" }
                            : { label: "Belum Dibuka", class: "bg-[#c4c7c7]/10 text-outline border-[#c4c7c7]/30" }
                          const pax = guest.rsvp_pax_count ?? guest.guest_count ?? 1
                          return (
                            <tr key={guest.id} className="hover:bg-surface-container-low">
                              <td className="px-4 py-3 max-w-[140px]">
                                <p className="font-headline-md text-[14px] max-[18px] truncate leading-tight" style={{ fontSize: "min(18px, 14px)" }}>{guest.name}</p>
                                <p className="font-label-md text-[10px] tracking-widest opacity-40 truncate">{guest.phone_number}</p>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className={`inline-block px-2 py-1 border font-label-md text-[9px] uppercase tracking-widest whitespace-nowrap ${statusBadge.class}`}>
                                  {statusBadge.label}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center font-label-md text-[12px] max-[18px]" style={{ fontSize: "min(18px, 12px)" }}>
                                {guest.rsvp_status === "HADIR" ? `${pax}` : "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Desktop list */}
                  <div className="hidden md:block flex-1 overflow-y-auto divide-y divide-[#c4c7c7]/20 hide-scrollbar">
                    {filtered.length === 0 && (
                      <p className="py-16 text-center font-body-md italic opacity-40">Tidak ada tamu ditemukan.</p>
                    )}
                    {filtered.map(guest => {
                      const statusBadge = guest.rsvp_status === "HADIR"
                        ? { label: "Hadir", class: "bg-[#8d4d39]/10 text-secondary border-[#8d4d39]/20" }
                        : guest.rsvp_status === "TIDAK_HADIR"
                        ? { label: "Tidak Hadir", class: "bg-[#747878]/10 text-[#747878] border-[#747878]/20" }
                        : guest.invitation_opened_at
                        ? { label: "Dibuka", class: "bg-[#1a1a1a]/10 text-primary border-[#1a1a1a]/20" }
                        : { label: "Belum Dibuka", class: "bg-[#c4c7c7]/10 text-outline border-[#c4c7c7]/30" }

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
                            <div className="flex items-center gap-2">
                              <span className={`px-4 py-2 border font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                              {guest.rsvp_status === "HADIR" && (
                                <span className="px-4 py-2 border border-[#c4c7c7]/50 text-on-surface-variant font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap">
                                  {pax} Pax
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
            </div>
          </div>
        </main>
      </div>

      {showWaBlastModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl">upgrade</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Fitur Premium</h3>
              <p className="text-sm text-on-surface-variant">
                Fitur Pengingat WhatsApp hanya tersedia pada paket tertentu. Ubah paket Anda untuk mengaktifkan fitur ini.
              </p>
              <button
                onClick={() => router.push(`/customize?edit=true&tab=dgbook&profile_id=${id}`)}
                className="w-full bg-primary text-on-primary min-h-[44px] md:min-h-0 py-4 md:py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Ubah Paket
              </button>
              <button
                onClick={() => setShowWaBlastModal(false)}
                className="w-full border border-outline-variant text-on-surface-variant min-h-[44px] md:min-h-0 py-4 md:py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
