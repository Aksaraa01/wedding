"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"

type Selections = {
  premium_web: boolean
  wish_wall: boolean
  reservation_automation: boolean
  kolom_direct_transfer: boolean
  galeri_foto_tamu: boolean
  qr_code_book: boolean
  unique_link_generator: boolean
  undangan_fisik: boolean
  wa_blast: boolean
}

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
  estimated_wedding_date: string
  estimated_guest_count: number
  whatsapp_number: string
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  total_project_cost: number
  express_service?: boolean | null
  akad_date?: string | null
  resepsi_date?: string | null
  sessions?: { date: string }[] | null
  package_type?: string | null
}

const CARDS = [
  { key: "premium_web" as const, title: "Premium Web Invitation" },
  { key: "unique_link_generator" as const, title: "Undangan dan QR Tamu" },
  { key: "reservation_automation" as const, title: "RSVP Automation" },
  { key: "wa_blast" as const, title: "Reminder Tamu VIP" },
  { key: "qr_code_book" as const, title: "QR Guest Book" },
  { key: "wish_wall" as const, title: "Virtual Wish Wall" },
  { key: "galeri_foto_tamu" as const, title: "Galeri Kenangan Tamu" },
  { key: "kolom_direct_transfer" as const, title: "Digital Angpao & E-Gift" },
  { key: "undangan_fisik" as const, title: "Undangan Fisik Premium" },
]

const ICON_MAP: Record<string, string> = {
  premium_web: "language",
  unique_link_generator: "link",
  wish_wall: "favorite",
  undangan_fisik: "mail",
  wa_blast: "chat_bubble",
  reservation_automation: "how_to_reg",
  qr_code_book: "qr_code_2",
  kolom_direct_transfer: "redeem",
  galeri_foto_tamu: "photo_library",
}

const STATUS_LABEL: Record<string, string> = {
  UNPAID: "UNPAID",
  PARTIAL_DP: "PARTIAL DP",
  FULLY_PAID: "FULLY PAID",
}

const PACKAGE_LABEL: Record<string, string> = {
  essential: "Essential",
  signature: "Signature",
  prestige: "Prestige",
}

function getModuleStatus(key: string, vals: {
  templateName: string; trackName: string; qrWithToken: number; qrCheckedIn: number;
  totalWishes: number; photoCount: number; accountCount: number; addressCount: number;
  rsvpStats: { hadir: number; belum_dibuka: number } | null;
  paymentStatus: string;
  waBlastSchedule: { scheduled_date: string } | null;
  waBlastIncluded: number;
}): { label: string; active: boolean } {
  if (key === "premium_web") {
    return vals.templateName
      ? { label: `${vals.templateName}${vals.trackName ? ` - ${vals.trackName}` : ""}`, active: true }
      : { label: "Draf", active: false }
  }
  if (vals.paymentStatus === "UNPAID") {
    return { label: "Belum Aktif", active: false }
  }
  switch (key) {
    case "unique_link_generator":
      return vals.qrWithToken > 0
        ? { label: `${vals.qrWithToken} QR Aktif`, active: true }
        : { label: "Belum Aktif", active: false }
    case "qr_code_book":
      return { label: `${vals.qrCheckedIn} Hadir`, active: true }
    case "wish_wall":
      return vals.totalWishes > 0
        ? { label: `${vals.totalWishes} Wish Sudah Masuk`, active: true }
        : { label: "Belum Aktif", active: false }
    case "galeri_foto_tamu":
      return vals.photoCount > 0
        ? { label: `${vals.photoCount} Momen Terunggah`, active: true }
        : { label: "Belum Aktif", active: false }
    case "kolom_direct_transfer":
      return { label: `${vals.accountCount} Rek, ${vals.addressCount} Alm`, active: true }
    case "reservation_automation":
      return vals.rsvpStats
        ? { label: `${vals.rsvpStats.hadir} Hadir, ${vals.rsvpStats.belum_dibuka} Belum Dibuka`, active: true }
        : { label: "Belum Aktif", active: false }
    case "undangan_fisik":
      return { label: "Konsultasi", active: false }
    case "wa_blast":
      if (vals.waBlastSchedule) {
        const d = new Date(vals.waBlastSchedule.scheduled_date + "T00:00:00")
        const dateStr = isNaN(d.getTime())
          ? vals.waBlastSchedule.scheduled_date
          : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        return { label: `Dijadwalkan ${dateStr} ke ${vals.waBlastIncluded} Tamu VIP`, active: true }
      }
      return { label: "Jadwal Belum Disimpan", active: false }
    default:
      return { label: "—", active: false }
  }
}

function DashboardInner({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selections, setSelections] = useState<Selections | null>(null)
  const [guestCount, setGuestCount] = useState(0)
  const [tableCount, setTableCount] = useState(0)
  const [templateName, setTemplateName] = useState("")
  const [trackName, setTrackName] = useState("")
  const [qrWithToken, setQrWithToken] = useState(0)
  const [qrCheckedIn, setQrCheckedIn] = useState(0)
  const [pendingWishes, setPendingWishes] = useState(0)
  const [totalWishes, setTotalWishes] = useState(0)
  const [photoCount, setPhotoCount] = useState(0)
  const [accountCount, setAccountCount] = useState(0)
  const [addressCount, setAddressCount] = useState(0)
  const [rsvpStats, setRsvpStats] = useState<{ hadir: number; belum_dibuka: number } | null>(null)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [checkedInPax, setCheckedInPax] = useState(0)
  const [rsvpHadirCount, setRsvpHadirCount] = useState(0)
  const [rsvpHadirPax, setRsvpHadirPax] = useState(0)
  const [rsvpTotalPax, setRsvpTotalPax] = useState(0)
  const [waBlastSchedule, setWaBlastSchedule] = useState<{ scheduled_date: string } | null>(null)
  const [waBlastIncluded, setWaBlastIncluded] = useState(0)
  const [showFisikInfo, setShowFisikInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/${id}`),
      fetch(`/api/dashboard/${id}/web-invitation`).then(r => r.ok ? r.json() : null),
      fetch(`/api/dashboard/${id}/qr-guestbook`).then(r => r.ok ? r.json() : null),
      fetch(`/api/guest-photos?wedding_profile_id=${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/gift-accounts?wedding_profile_id=${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/gift-addresses?wedding_profile_id=${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/dashboard/${id}/reservation-automation`).then(r => r.ok ? r.json() : null),
      fetch(`/api/dashboard/${id}/wa-blast`).then(r => r.ok ? r.json() : null),
    ])
      .then(([dashboardRes, invData, qrData, photoData, accData, addrData, rsvpData, waBlastData]) => {
        if (!dashboardRes.ok) throw new Error("Dashboard tidak ditemukan")
        return dashboardRes.json().then((data) => {
          setProfile(data.profile)
          setSelections(data.selections)
          setGuestCount(data.guest_count ?? data.profile.estimated_guest_count ?? 0)
          setTableCount(data.table_count ?? 0)
          if (invData?.template?.name) setTemplateName(invData.template.name)
          if (invData?.track?.title) setTrackName(invData.track.title)
          if (qrData?.stats) {
            setQrWithToken(qrData.stats.with_token)
            setQrCheckedIn(qrData.stats.checked_in)
          }
          setPendingWishes(data.pending_wishes ?? 0)
          setTotalWishes(data.total_wishes ?? 0)
          if (photoData?.photos) setPhotoCount(photoData.photos.length)
          if (accData?.accounts) setAccountCount(accData.accounts.length)
          if (addrData?.addresses) setAddressCount(addrData.addresses.length)
          if (rsvpData?.stats) setRsvpStats(rsvpData.stats)
          setCheckedInCount(data.checked_in_count ?? 0)
          setCheckedInPax(data.checked_in_pax ?? 0)
          setRsvpHadirCount(data.rsvp_hadir_count ?? 0)
          setRsvpHadirPax(data.rsvp_hadir_pax ?? 0)
          setRsvpTotalPax(data.rsvp_total_pax ?? 0)
          if (waBlastData?.schedule) setWaBlastSchedule(waBlastData.schedule)
          const wpPackage = data.profile?.package_type || "signature"
          const waBlastTier = waBlastData?.wa_blast_tier || 0
          const quota = (wpPackage === "prestige" ? 100 : 0) + waBlastTier
          const vipCount = waBlastData?.vip_count || 0
          setWaBlastIncluded(quota > 0 ? Math.min(vipCount, quota) : vipCount)
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile || !selections) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6">error_outline</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-4">Dashboard Tidak Ditemukan</h1>
          <p className="font-body-md text-on-surface-variant mb-8">{error || "Data tidak tersedia"}</p>
          <button
            onClick={() => router.push("/hero")}
            className="bg-primary text-on-primary font-label-md uppercase tracking-widest py-4 px-12 hover:bg-secondary transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  function getClosestDate(p: Profile): string {
    const now = Date.now()
    const sessionDates = Array.isArray(p.sessions) ? p.sessions.map(s => s.date).filter(Boolean) : []
    const candidates = [...sessionDates, p.akad_date, p.resepsi_date, p.estimated_wedding_date].filter(Boolean) as string[]
    if (candidates.length === 0) return p.estimated_wedding_date
    let closest = candidates[0]
    let closestDiff = Math.abs(new Date(closest).getTime() - now)
    for (const d of candidates) {
      const diff = Math.abs(new Date(d).getTime() - now)
      if (diff < closestDiff) {
        closestDiff = diff
        closest = d
      }
    }
    return closest
  }

  const displayDate = getClosestDate(profile)
  const statusLabel = STATUS_LABEL[profile.payment_status] || "UNPAID"
  const daysLeft = Math.max(0, Math.ceil((new Date(displayDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const formattedDate = new Date(displayDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const settingsParams = new URLSearchParams({
    user: profile.bride_name,
    partner: profile.groom_name,
    date: profile.estimated_wedding_date,
    guest: String(profile.estimated_guest_count ?? guestCount),
    edit: "true",
    profile_id: id,
  })

  const activeCards = CARDS.filter((card) => selections[card.key])

  const moduleVals = {
    templateName,
    trackName,
    qrWithToken,
    qrCheckedIn,
    totalWishes,
    photoCount,
    accountCount,
    addressCount,
    rsvpStats,
    paymentStatus: profile.payment_status,
    waBlastSchedule,
    waBlastIncluded,
  }

  const statusColor = profile.payment_status === "FULLY_PAID" ? "bg-green-500" : profile.payment_status === "PARTIAL_DP" ? "bg-yellow-500" : "bg-red-500"

  return (
    <>
      <PageTheme mode="light" />
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant h-20 flex items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/customize?${settingsParams}`)}
            className="text-on-surface-variant"
            title="Ubah Pilihan Fitur"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <ProfileMenu />
        </div>
      </header>

      <main className="pt-24 pb-32 lg:max-w-[75%] lg:mx-auto">
        <section className="px-6 mb-10">
          <div className="bg-[#1A1817] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary opacity-10 blur-[100px] pointer-events-none" />
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mb-6">
              <span className={`w-2 h-2 rounded-full ${statusColor} animate-[pulse-animation_2s_ease-in-out_infinite]`} />
              <span className="text-[10px] font-semibold tracking-widest uppercase">Paket {PACKAGE_LABEL[profile.package_type || ""] || "Essential"} &bull; {statusLabel} &bull; {formattedDate}</span>
            </div>
            <h1 className="font-['Playfair_Display'] text-[48px] md:text-[56px] leading-tight mb-8">
              {profile.bride_name} &amp; {profile.groom_name}
            </h1>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Menuju Hari Bahagia</p>
                <p className="font-['Playfair_Display'] text-3xl">{daysLeft} Hari Lagi</p>
              </div>
              <span className="material-symbols-outlined text-secondary/80">calendar_today</span>
            </div>
          </div>
        </section>

        <section className="px-6 mb-12">
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-end">
              <h2 className="font-['Playfair_Display'] text-2xl mb-1">Master Guest Hub</h2>
              <span className="material-symbols-outlined text-secondary">analytics</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-outline-variant">
              <div className="bg-white p-5">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Total Tamu</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{guestCount}</span>
                </div>
              </div>
              <div className="bg-white p-5">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Meja</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{tableCount}</span>
                </div>
              </div>
              <div className="bg-white p-5">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Reservasi Tamu</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{rsvpHadirCount}</span>
                  <span className="text-sm text-on-surface-variant opacity-60">{rsvpHadirPax} Pax</span>
                </div>
                <div className="mt-2 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${rsvpTotalPax > 0 ? (rsvpHadirPax / rsvpTotalPax) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="bg-white p-5">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Checkin Tamu</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{checkedInCount}</span>
                  <span className="text-sm text-on-surface-variant opacity-60">{checkedInPax} Pax</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/${id}/guests`)}
              className="w-full py-5 bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Kelola Tamu &amp; Meja
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="mb-12">
          <div className="px-6 flex justify-between items-center mb-6">
            <h2 className="font-['Playfair_Display'] text-2xl">Modul Perencanaan</h2>
          </div>
          {profile.express_service && (
            <div className="mx-6 mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 flex-shrink-0">bolt</span>
              <div>
                <p className="font-body-md text-body-md text-amber-800 font-semibold">Layanan Kilat 24 Jam Aktif</p>
                <p className="font-body-sm text-body-sm text-amber-700 mt-1">
                  Proses pengerjaan undangan Anda dipercepat dengan layanan kilat 24 jam.
                </p>
              </div>
            </div>
          )}
          <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCards.length === 0 ? (
              <div className="text-center py-20 bg-white border border-outline-variant rounded-2xl">
                <p className="font-body-md text-on-surface-variant">Belum ada modul yang dipilih</p>
              </div>
            ) : (
              activeCards.map((card, i) => {
                const status = getModuleStatus(card.key, moduleVals)
                return (
                  <div
                    key={card.key}
                    onClick={() => {
                      if (card.key === "undangan_fisik") {
                        setShowFisikInfo(true)
                        return
                      }
                      const routes: Record<string, string> = {
                        premium_web: `/dashboard/${id}/web-invitation/editor`,
                        reservation_automation: `/dashboard/${id}/reservation-automation`,
                        unique_link_generator: `/dashboard/${id}/qr-guestbook`,
                        qr_code_book: `/dashboard/${id}/qr-guestbook/live`,
                        wish_wall: `/dashboard/${id}/wish-wall`,
                        galeri_foto_tamu: `/dashboard/${id}/galeri-kenangan`,
                        kolom_direct_transfer: `/dashboard/${id}/amplop-digital`,
                        wa_blast: `/dashboard/${id}/reminder-tamu-vip`,
                      }
                      const route = routes[card.key]
                      if (route) router.push(route)
                    }}
                    className="group bg-white p-4 md:p-6 border border-outline-variant rounded-2xl flex items-center justify-between active:bg-surface-container transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 md:gap-5 min-w-0">
                      <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined">{ICON_MAP[card.key]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-on-surface-variant opacity-50 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              status.active
                                ? "bg-green-100 text-green-700"
                                : "bg-outline-variant text-on-surface-variant"
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate">{card.title}</h3>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-active:translate-x-1 transition-transform">
                      arrow_forward_ios
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="px-6">
          <div className="relative rounded-3xl overflow-hidden mb-8 h-[500px]">
            <Image src="/dashboard.png" alt="Aksaraa Dashboard" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 text-center">
              <blockquote className="font-['Playfair_Display'] italic text-white text-2xl mb-6">
                &ldquo;Narasi perjalanan cinta yang terkurasi dengan sempurna.&rdquo;
              </blockquote>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-white text-[16px]">verified_user</span>
                <span className="text-[10px] font-semibold text-white tracking-widest uppercase">AES-256 Encrypted Data</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showFisikInfo && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowFisikInfo(false)}
        >
          <div
            className="relative bg-white max-w-sm w-full p-8 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFisikInfo(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <span className="material-symbols-outlined text-5xl text-secondary mb-4 block">mail</span>
            <h3 className="font-['Playfair_Display'] text-2xl mb-3">Undangan Fisik Premium</h3>
            <p className="font-body-md text-on-surface-variant">
              Konsultan Aksaraa akan menghubungi kamu segera untuk detail nya.
            </p>
            <button
              onClick={() => setShowFisikInfo(false)}
              className="w-full mt-8 bg-primary text-on-primary py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DashboardInner id={id} />
}
