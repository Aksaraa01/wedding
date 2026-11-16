"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"
import { PACKAGE_LABELS as PACKAGE_LABEL, getPackageCategory, hasVipQuotaBase } from "@/lib/packages"
import UpgradePackageModal, { type UpgradeModalContent } from "@/components/UpgradePackageModal"
import { startTour } from "@/components/onboarding/ProductJourney"
import { brandHomeHref } from "@/lib/eventHost"

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
  wa_blast_tier?: number | null
  galeri_addon?: boolean | null
  galeri_tier?: string | null
  galeri_photos_per_guest?: number | null
  galeri_guest_count?: number | null
  akad_date?: string | null
  resepsi_date?: string | null
  sessions?: { date: string }[] | null
  package_type?: string | null
}

const CARDS = [
  { key: "premium_web" as const, title: "Premium Web Invitation" },
  { key: "unique_link_generator" as const, title: "Undangan dan QR Tamu" },
  { key: "reservation_automation" as const, title: "Reservasi Tamu" },
  { key: "wa_blast" as const, title: "Reminder Tamu VIP" },
  { key: "qr_code_book" as const, title: "Buku Tamu Digital" },
  { key: "wish_wall" as const, title: "Doa & Harapan Tamu" },
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
  // Upsell popup hook lives with the rest: anything after the `if (loading)`
  // early return below would trip React #310 (hook count changed).
  const [upsell, setUpsell] = useState<null | "galeri" | "undangan" | "wishwall" | "dgbook">(null)

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
          // GT couples render the dashboard with gated modules (upsell
          // popups) instead of redirecting to galeri-kenangan.
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
          const quota = (hasVipQuotaBase(wpPackage) ? 100 : 0) + waBlastTier
          const vipCount = waBlastData?.vip_count || 0
          setWaBlastIncluded(quota > 0 ? Math.min(vipCount, quota) : vipCount)
          const hasSeen = (data.profile as any)?.has_seen_tour === true
          const localSeen = typeof window !== "undefined" && localStorage.getItem(`tour_seen_${id}`) === "1"
          const tourActive = typeof window !== "undefined" && localStorage.getItem(`tour_active_${id}`) === "1"
          if (!hasSeen && !localSeen && !tourActive && !data.profile.is_published) {
            setTimeout(() => {
              localStorage.setItem(`tour_active_${id}`, "1")
              localStorage.setItem(`tour_step_${id}`, "1")
              window.dispatchEvent(new Event("tour_start"))
            }, 800)
          }
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
            onClick={() => router.push(brandHomeHref())}
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
    user: profile.groom_name,
    partner: profile.bride_name,
    date: profile.estimated_wedding_date,
    guest: String(profile.estimated_guest_count ?? guestCount),
    edit: "true",
    profile_id: id,
  })

  const activeCards = CARDS.filter((card) => selections[card.key])
  // Galeri Tamu shortcut: Undangan Digital + Galeri add-on, or Buku Tamu
  // Digital tiers (both carry galeri_foto_tamu). Undangan Digital shows the
  // button even without the add-on — it opens the upsell popup instead.
  const galeriEligible = selections?.galeri_foto_tamu === true
  const wishEligible = selections?.wish_wall === true
  const isGt = profile?.package_type === "gt"
  const showGaleriBtn =
    !isGt && (galeriEligible || getPackageCategory(profile?.package_type || "") === "Undangan Digital")
  // Upsell popup: "galeri" (undangan users without the add-on) or
  // "undangan" (GT users eyeing invitation features). CTA goes to
  // pilih-paket in edit mode.
  const customizeUrlFor = (tab: "undangan" | "dgbook" | "galeri") =>
    profile
      ? `/customize?edit=true&tab=${tab}&user=${encodeURIComponent(profile.groom_name)}&partner=${encodeURIComponent(profile.bride_name)}&date=${encodeURIComponent(profile.estimated_wedding_date)}&guest=${encodeURIComponent(String(profile.estimated_guest_count ?? 300))}&profile_id=${id}`
      : "/customize"
  // Unified upsell content (shared UpgradePackageModal format: lock label +
  // benefit list + eligible packages). Eligible sets mirror PACKAGE_FEATURES
  // grouped by category to avoid ambiguous tier labels.
  const UPS_COPY: Record<"galeri" | "undangan" | "wishwall" | "dgbook", UpgradeModalContent & { href: string }> = {
    galeri: {
      title: "Tambah Galeri Tamu",
      lockLabel: "Paket Galeri Tamu",
      benefits: [
        "QR acara untuk akses kamera digital dan mengabadikan momen candid dari para tamu",
        "Bingkai dan filter untuk setiap foto tamu",
        "Galeri foto online dengan fitur unduh massal langsung dari dashboard",
      ],
      eligiblePackages: ["Galeri Tamu", "Buku Tamu Digital"],
      cta: "Pilih Paket",
      href: customizeUrlFor("galeri"),
    },
    undangan: {
      title: "Butuh Undangan Digital",
      lockLabel: "Paket Undangan Digital",
      benefits: [
        "Undangan web elegan + RSVP online",
        "QR tamu personal + absensi live",
        "Amplop digital & manajemen tamu",
      ],
      eligiblePackages: ["Undangan Digital"],
      cta: "Pilih Paket",
      href: customizeUrlFor("undangan"),
    },
    wishwall: {
      title: "Butuh Wish Wall",
      lockLabel: "Paket Undangan Digital",
      benefits: [
        "Doa & harapan tamu terkumpul otomatis",
        "Moderasi + sematkan ucapan favorit",
        "Tampil cantik di Layar LED acara",
      ],
      eligiblePackages: ["Undangan Digital", "Buku Tamu Digital"],
      cta: "Pilih Paket",
      href: customizeUrlFor("undangan"),
    },
    dgbook: {
      title: "Butuh Buku Tamu Digital",
      lockLabel: "Paket Buku Tamu Digital",
      benefits: [
        "QR check-in + absensi tamu secara live",
        "Sapaan otomatis di Layar LED",
        "Galeri foto + selfie check-in tamu",
      ],
      eligiblePackages: ["Buku Tamu Digital (Sistem, Pro, Premium, Prestige)"],
      cta: "Pilih Paket",
      href: customizeUrlFor("dgbook"),
    },
  }

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
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: "#ded1c1", backgroundImage: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, rgba(240,228,215,0.4) 30%, transparent 65%), linear-gradient(115deg, #dfd2c2 0%, #ecdcc9 22%, #baa794 45%, #f2e4d3 62%, #caa890 82%, #dfd3c4 100%)", backgroundAttachment: "fixed" }} />
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-transparent h-16 px-10 flex items-center justify-end gap-2 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => startTour(id)}
            className="relative group w-9 h-9 rounded-lg bg-[#ece2d4]/80 hover:bg-[#dfd3c3] flex items-center justify-center text-slate-700 transition shadow-sm"
            aria-label="Jalankan Tur"
            data-tour="replay"
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span className="pointer-events-none absolute top-full right-0 mt-2 bg-white text-[#2C2A29] border border-[#B34E3F] px-3 py-2 rounded-lg max-w-[160px] whitespace-normal text-center leading-tight text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Jalankan<br/>Tur
            </span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/${id}/instruksi`)}
            className="relative group w-9 h-9 rounded-lg bg-[#ece2d4]/80 hover:bg-[#dfd3c3] flex items-center justify-center text-slate-700 transition shadow-sm"
            aria-label="Cara Memulai"
            data-tour="cara-memulai"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span className="pointer-events-none absolute top-full right-0 mt-2 bg-white text-[#2C2A29] border border-[#B34E3F] px-3 py-2 rounded-lg max-w-[160px] whitespace-normal text-center leading-tight text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Cara<br/>Memulai
            </span>
          </button>
          {(["cetak_undangan_bonus", "bonus_full_custom"] as string[]).includes(profile.package_type || "") ? (
            <button
              onClick={() => router.push(`/dashboard/${id}/instruksi`)}
              className="relative group w-9 h-9 rounded-lg bg-[#ece2d4]/80 hover:bg-[#dfd3c3] flex items-center justify-center text-slate-700 transition shadow-sm"
              title="Paket BONUS — hubungi konsultan untuk ubah paket"
              aria-label="Paket BONUS"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span className="pointer-events-none absolute top-full right-0 mt-2 bg-white text-[#2C2A29] border border-[#B34E3F] px-3 py-2 rounded-lg max-w-[180px] whitespace-normal text-center leading-tight text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                Paket BONUS —<br/>hubungi konsultan
              </span>
            </button>
          ) : (
            <button
              onClick={() => router.push(`/customize?${settingsParams}`)}
              className="relative group w-9 h-9 rounded-lg bg-[#ece2d4]/80 hover:bg-[#dfd3c3] flex items-center justify-center text-slate-700 transition shadow-sm"
              title="Ganti Paket"
              aria-label="Ganti Paket"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              <span className="pointer-events-none absolute top-full right-0 mt-2 bg-white text-[#2C2A29] border border-[#B34E3F] px-3 py-2 rounded-lg max-w-[160px] whitespace-normal text-center leading-tight text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                Ganti<br/>Paket
              </span>
            </button>
          )}
          <div className="pl-1">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="pt-20 pb-32 lg:max-w-[75%] lg:mx-auto min-h-screen overflow-visible touch-pan-y relative z-10">
        <section className="px-6 mb-10">
          <div className="relative rounded-[24px] overflow-hidden shadow-xl border border-[#e0d6c8]/80 bg-[#eedfcb]">
            <div className="relative bg-gradient-to-b md:bg-gradient-to-r from-[#b7583d] via-[#b35237] to-[#9b432a] rounded-[24px] overflow-hidden flex flex-col">
              <div className="relative px-5 md:px-9 pt-5 md:pt-6 pb-7 md:pb-9 rounded-b-[28px] md:rounded-b-[32px] overflow-hidden shadow-md z-10" style={{ backgroundColor: "rgb(236,224,206)", backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuBLv_ul4rYeXAog4-6887ND4kkTGR7BHY0cAmpLcSXy7CXuvIfwYHkx5Rrw-ggdKRpC8eDcVNBUx8xhbqotcSH-s3gLaUzYrI3uy5uFy_SiJkuHlugeqjch7Zbf3dBfQPeqSjFuODdjWLGNo796PQXGvUErZ5lUzRmycI26A38177tF2LdP7rfeMoizZilih3cIqLu4q9qyDvvNbV3lutUsV9vG4elmzEi_LkgBX60SiJevBYe-t9TAKv4DJayS_DTavIYqiei_Wtn9QQ\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-1.5 md:gap-2 mb-4 max-w-full overflow-hidden">
                  <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-white/85 border border-[#e5ded4] shadow-sm backdrop-blur-sm text-[10px] md:text-[11px] whitespace-nowrap shrink-0">
                    <span className="flex items-center text-stone-900 font-bold tracking-tight"><span className="w-2 h-2 rounded-full bg-[#b8382c] mr-1.5 inline-block"></span>PAKET {(PACKAGE_LABEL[profile.package_type || ""] || "Essential").toUpperCase()}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-700 font-medium tracking-tight">{getPackageCategory(profile.package_type || "") || "UNDANGAN DIGITAL"}</span>
                  </div>
                  {(profile.wa_blast_tier || 0) > 0 && (
                    <span title={`Reminder WA VIP +${profile.wa_blast_tier} tamu`} className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-white/85 border border-blue-200 shadow-sm backdrop-blur-sm text-[10px] md:text-[11px] whitespace-nowrap shrink-0 text-blue-800 font-bold">WA +{profile.wa_blast_tier}
                    </span>
                  )}
                  {profile.express_service && (
                    <span title="Layanan Kilat 24 jam" className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-white/85 border border-amber-200 shadow-sm backdrop-blur-sm text-[10px] md:text-[11px] whitespace-nowrap shrink-0 text-amber-800 font-bold">Kilat
                    </span>
                  )}
                  {profile.galeri_addon && (
                    <span title={(profile.galeri_photos_per_guest || 0) > 0 && (profile.galeri_guest_count || 0) > 0 ? `Galeri Tamu: ${profile.galeri_photos_per_guest} foto/tamu × ${profile.galeri_guest_count} tamu` : "Galeri Tamu"} className="inline-flex items-center gap-1 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-white/85 border border-purple-200 shadow-sm backdrop-blur-sm text-[10px] md:text-[11px] whitespace-nowrap shrink-0 text-purple-800 font-bold">{profile.galeri_tier || "Galeri"}
                    </span>
                  )}
                  <span className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-[#fde8e5] text-[#b93b2a] font-bold text-[10px] md:text-[11px] tracking-wide inline-flex items-center gap-1 md:gap-2 shadow-sm border border-[#fbd0cb] whitespace-nowrap shrink-0"><span>{statusLabel}</span>{statusLabel === "UNPAID" && <span className="text-[10px]">⚠️</span>}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-1">
                    <h1 className={`font-serif leading-tight text-stone-900 font-normal tracking-tight break-words ${((profile.bride_name.trim().split(/\s+/).filter(Boolean).length + profile.groom_name.trim().split(/\s+/).filter(Boolean).length) > 4) ? "text-[22px] md:text-[42px] whitespace-normal line-clamp-2" : "text-[28px] md:text-[42px] whitespace-nowrap overflow-hidden text-ellipsis"}`}>{profile.groom_name} <br className="md:hidden"/><span className="font-serif italic font-normal text-[#c5a059] leading-none inline-block align-baseline tracking-wide select-none text-[22px] md:text-[42px]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>&amp;</span> {profile.bride_name}</h1>
                    <p className="text-stone-600 font-serif text-[14px] md:text-[17px] mt-1.5 tracking-wide flex items-center truncate">
                      <span className="material-symbols-outlined text-[14px] mr-1.5 text-[#a8824b] shrink-0 hidden md:inline">calendar_today</span>
                      {formattedDate}
                    </p>
                  </div>
                  <div className="shrink-0 md:hidden">
                    <div className="w-28 h-28 rounded-full p-[4px] flex items-center justify-center relative shadow-lg" style={{ background: "linear-gradient(135deg, #d8b471 0%, #fae8be 35%, #c89c4e 60%, #e8c988 85%, #9d7532 100%)", boxShadow: "0 8px 18px -3px rgba(70,30,10,0.35)" }}>
                      <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#faf5ec] p-2 border border-[#deb86d]/40 shadow-inner">
                        <span className="font-serif text-[30px] font-bold text-[#b58c4f] tracking-tight leading-none pt-0.5">{daysLeft}</span>
                        <span className="font-serif text-[11px] font-semibold text-[#8b6a37] tracking-normal leading-tight mt-0.5">Hari Lagi</span>
                        <span className="text-[9px] font-sans text-stone-500 font-medium tracking-tight mt-0.5">(Count Down)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 md:px-9 md:py-5 flex flex-row gap-2.5 md:gap-3.5 md:justify-start relative z-10">
                {isGt ? (
                  <>
                    <button onClick={() => router.push(`/dashboard/${id}/galeri-kenangan`)} data-tour="galeri-tamu" className="flex-1 md:flex-none md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full border border-white/40 text-[#fdfbf9] bg-white/10 hover:bg-white/20 active:bg-white/25 transition backdrop-blur-sm text-[13px] font-medium shadow-sm whitespace-nowrap overflow-hidden text-ellipsis shrink">
                      <span className="material-symbols-outlined text-[16px] shrink-0">photo_library</span>
                      <span className="whitespace-nowrap">Galeri Tamu</span>
                    </button>
                    <button onClick={() => setUpsell("undangan")} data-tour="lihat-undangan" title="Lihat Undangan" className="flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink">
                      <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">mail</span>
                      <span className="whitespace-nowrap hidden md:inline">Lihat Undangan</span>
                    </button>
                    <button onClick={() => setUpsell("undangan")} data-tour="undangan-tamu" title="Undangan Tamu" className="flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink">
                      <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">qr_code_2</span>
                      <span className="whitespace-nowrap hidden md:inline">Undangan Tamu</span>
                    </button>
                    <button onClick={() => setUpsell("undangan")} data-tour="wish-wall" title="Wish Wall" className="flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink">
                      <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">favorite</span>
                      <span className="whitespace-nowrap hidden md:inline">Wish Wall</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push(`/dashboard/${id}/web-invitation/editor?preview=1`)} data-tour="lihat-undangan" className="flex-1 md:flex-none md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full border border-white/40 text-[#fdfbf9] bg-white/10 hover:bg-white/20 active:bg-white/25 transition backdrop-blur-sm text-[13px] font-medium shadow-sm whitespace-nowrap overflow-hidden text-ellipsis shrink">
                      <span className="material-symbols-outlined text-[16px] shrink-0">mail</span>
                      <span className="whitespace-nowrap">Lihat Undangan</span>
                    </button>
                    <button onClick={() => router.push(`/dashboard/${id}/qr-guestbook`)} data-tour="undangan-tamu" title={showGaleriBtn ? "Undangan Tamu" : undefined} className={showGaleriBtn
                      ? "flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink"
                      : "flex-1 md:flex-none md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis shrink"}>
                      <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">qr_code_2</span>
                      <span className={showGaleriBtn ? "whitespace-nowrap hidden md:inline" : "whitespace-nowrap"}>Undangan Tamu</span>
                    </button>
                    <button onClick={() => (wishEligible ? router.push(`/dashboard/${id}/wish-wall`) : isGt ? setUpsell("undangan") : setUpsell("wishwall"))} data-tour="wish-wall" title="Wish Wall" className="flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink">
                      <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">favorite</span>
                      <span className="whitespace-nowrap hidden md:inline">Wish Wall</span>
                    </button>
                    {showGaleriBtn && (
                      <button onClick={() => (galeriEligible ? router.push(`/dashboard/${id}/galeri-kenangan`) : setUpsell("galeri"))} data-tour="galeri-tamu" title="Galeri Tamu" className="flex-none w-12 md:w-auto h-12 md:h-auto inline-flex items-center justify-center gap-2 px-0 md:px-5 py-3 md:py-2.5 rounded-xl md:rounded-full bg-[#faf5ec] text-[#2c241e] hover:bg-white active:bg-[#f7f2ea] transition shadow-md text-[13px] font-semibold whitespace-nowrap overflow-hidden shrink">
                        <span className="material-symbols-outlined text-[16px] text-[#a8824b] shrink-0">photo_library</span>
                        <span className="whitespace-nowrap hidden md:inline">Galeri Tamu</span>
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:flex">
                <div className="w-44 h-44 rounded-full p-[6px] flex items-center justify-center relative shadow-xl" style={{ background: "linear-gradient(135deg, #d8b471 0%, #fae8be 35%, #c89c4e 60%, #e8c988 85%, #9d7532 100%)", boxShadow: "0 10px 25px -4px rgba(70,30,10,0.35), 0 4px 8px -2px rgba(0,0,0,0.1)" }}>
                  <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#faf5ec] p-3 border border-[#deb86d]/40">
                    <span className="font-serif text-[48px] font-bold text-[#b58c4f] tracking-tight leading-none pt-1">{daysLeft}</span>
                    <span className="font-serif text-[15px] font-semibold text-[#8b6a37] tracking-normal mt-1">Hari Lagi</span>
                    <span className="text-[11px] font-sans text-stone-600 font-normal tracking-tight mt-0.5">(Count Down)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 mb-12">
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-center md:items-end">
              <h2 className="font-['Playfair_Display'] text-lg md:text-2xl mb-1">Master Guest Hub</h2>
              <span className="material-symbols-outlined text-secondary md:text-2xl">analytics</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-outline-variant">
              <div className="bg-white p-3 md:p-5">
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Total Tamu</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg md:text-2xl font-semibold">{guestCount}</span>
                </div>
              </div>
              <div className="bg-white p-3 md:p-5">
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1">Meja</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg md:text-2xl font-semibold">{tableCount}</span>
                </div>
              </div>
              <button
                onClick={() => (isGt ? setUpsell("undangan") : router.push(`/dashboard/${id}/reservation-automation`))}
                className={`bg-white p-3 md:p-5 text-left hover:bg-[#faf6ee] active:scale-[0.99] transition-all cursor-pointer group/box ${isGt ? "opacity-60" : ""}`}
              >
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
                  Reservasi Tamu
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover/box:text-secondary group-hover/box:translate-x-0.5 transition-all">{isGt ? "lock" : "chevron_right"}</span>
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg md:text-2xl font-semibold">{rsvpHadirCount}</span>
                  <span className="text-xs md:text-sm text-on-surface-variant opacity-60">{rsvpHadirPax} Pax</span>
                </div>
                <div className="mt-1.5 md:mt-2 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${rsvpTotalPax > 0 ? (rsvpHadirPax / rsvpTotalPax) * 100 : 0}%` }}
                  />
                </div>
              </button>
              {selections.qr_code_book ? (
                <button
                  onClick={() => router.push(`/dashboard/${id}/qr-guestbook/live`)}
                  className="bg-white p-3 md:p-5 text-left hover:bg-[#faf6ee] active:scale-[0.99] transition-all cursor-pointer group/box"
                >
                  <p className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
                    Checkin Tamu
                    <span className="material-symbols-outlined text-[16px] text-outline group-hover/box:text-secondary group-hover/box:translate-x-0.5 transition-all">chevron_right</span>
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg md:text-2xl font-semibold">{checkedInCount}</span>
                    <span className="text-xs md:text-sm text-on-surface-variant opacity-60">{checkedInPax} Pax</span>
                  </div>
                </button>
              ) : (
              <button
                onClick={() => setUpsell("dgbook")}
                className="bg-white p-3 md:p-5 text-left transition-all cursor-pointer hover:bg-[#faf6ee] active:scale-[0.99] group/box"
              >
                <p className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
                  Checkin Tamu
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover/box:text-secondary group-hover/box:translate-x-0.5 transition-all">lock</span>
                </p>
                  <div className="relative group inline-flex items-center gap-2 pt-0.5">
                    <span className="material-symbols-outlined text-lg md:text-xl text-on-surface-variant/50">lock</span>
                    <span className="text-xs md:text-sm text-on-surface-variant/60">Tidak Aktif</span>
                  </div>
              </button>
              )}
            </div>
            <button
              onClick={() => (isGt ? setUpsell("undangan") : router.push(`/dashboard/${id}/guests`))}
              className={`w-full py-3.5 md:py-5 bg-[#b85d3f] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#9d4c32] active:scale-[0.98] transition-colors ${isGt ? "opacity-80" : ""}`}
            >
              Kelola Tamu &amp; Meja
              <span className="material-symbols-outlined text-[18px]">{isGt ? "lock" : "chevron_right"}</span>
            </button>
          </div>
        </section>

        <section className="mb-12">
          <div className="px-6 flex justify-between items-center mb-6">
            <h2 className="font-['Playfair_Display'] text-2xl">Modul Perencanaan</h2>
          </div>
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
                    data-tour={card.key === "premium_web" ? "premium-web" : undefined}
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
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border uppercase ${
                              status.active
                                ? "bg-[#C5A059]/15 text-[#7A5A2E] border-[#C5A059]/30"
                                : "bg-[#F3F4F6] text-on-surface-variant border-[#E2D9CF]"
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

      {upsell && (
        <UpgradePackageModal
          open
          onClose={() => setUpsell(null)}
          ctaHref={UPS_COPY[upsell].href}
          content={UPS_COPY[upsell]}
        />
      )}

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
