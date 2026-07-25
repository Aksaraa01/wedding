"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type Selections = {
  premium_web: boolean
  wish_wall: boolean
  reservation_automation: boolean
  kolom_direct_transfer: boolean
  gift_marketplace: boolean
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
}

const CARDS = [
  { num: "01", key: "premium_web" as const, title: "Premium Web Invitation" },
  { num: "02", key: "unique_link_generator" as const, title: "Unique Link Generator" },
  { num: "03", key: "wish_wall" as const, title: "Virtual Wish Wall (Dinding Doa)" },
  { num: "04", key: "undangan_fisik" as const, title: "Undangan Fisik Premium (Cetak)" },
  { num: "05", key: "wa_blast" as const, title: "WhatsApp Blast Resmi" },
  { num: "06", key: "reservation_automation" as const, title: "RSVP Automation" },
  { num: "07", key: "qr_code_book" as const, title: "QR Code Guest Book & Absensi" },
  { num: "08", key: "kolom_direct_transfer" as const, title: "Digital Angpao & E-Gift" },
  { num: "09", key: "gift_marketplace" as const, title: "Aksara Gift Marketplace" },
]

const STATUS_LABEL: Record<string, string> = {
  UNPAID: "UNPAID",
  PARTIAL_DP: "PARTIAL DP",
  FULLY_PAID: "FULLY PAID",
}

const STATUS_COLOR: Record<string, string> = {
  UNPAID: "bg-red-500",
  PARTIAL_DP: "bg-yellow-500",
  FULLY_PAID: "bg-green-500",
}

function DashboardInner({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selections, setSelections] = useState<Selections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/dashboard/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Dashboard tidak ditemukan")
        return r.json()
      })
      .then((data) => {
        setProfile(data.profile)
        setSelections(data.selections)
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
      <div className="min-h-screen bg-background flex items-center justify-center px-edge-margin-mobile">
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

  const statusLabel = STATUS_LABEL[profile.payment_status] || "UNPAID"
  const statusColor = STATUS_COLOR[profile.payment_status] || "bg-gray-500"
  const guestCount = profile.estimated_guest_count || 0

  const settingsParams = new URLSearchParams({
    user: searchParams.get("user") || profile.bride_name,
    partner: searchParams.get("partner") || profile.groom_name,
    date: searchParams.get("date") || profile.estimated_wedding_date,
    guest: searchParams.get("guest") || String(guestCount),
  })

  const activeCards = CARDS.filter((card) => selections[card.key])

  return (
    <>
      <PageTheme mode="dark" />
      <div className="font-body-md bg-background text-on-background min-h-screen">
        {/* Header */}
        <header className="w-full px-edge-margin-mobile lg:px-edge-margin-desktop flex items-center justify-between h-24 lg:h-28 border-b border-outline-variant/30">
          <div className="font-label-md uppercase tracking-widest text-primary text-sm lg:text-base">Aksaraa</div>
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => router.push(`/customize?${settingsParams}`)}
              className="font-label-md text-on-surface-variant hover:text-primary transition-colors tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              Ubah Pilihan Fitur
            </button>
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">account_circle</span>
          </div>
        </header>

        {/* Main */}
        <main className="px-edge-margin-mobile lg:px-edge-margin-desktop max-w-container-max mx-auto pt-10 lg:pt-16 pb-32">
          {/* Welcome */}
          <section className="mb-10 lg:mb-16">
            <h1 className="font-headline-lg text-headline-lg lg:text-headline-xl text-primary mb-2">
              Selamat Datang,{" "}
              <span className="text-secondary">{profile.bride_name} & {profile.groom_name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
              <span className="font-label-md uppercase tracking-widest text-on-surface-variant">{statusLabel}</span>
            </div>
          </section>

          {/* Master Guest Hub Card */}
          <section className="mb-10 lg:mb-16">
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h2 className="font-headline-md text-headline-md text-primary mb-2">Master Guest Hub</h2>
                <p className="font-body-md text-on-surface-variant">Pusat Data Tamu &amp; Denah Meja</p>
              </div>
              <div className="flex items-center gap-8 lg:gap-16">
                <div className="text-left">
                  <p className="text-headline-md font-headline-md text-primary">{guestCount}</p>
                  <p className="text-on-surface-variant text-sm">Nama Terinput</p>
                </div>
                <div className="text-left">
                  <p className="text-headline-md font-headline-md text-primary">0</p>
                  <p className="text-on-surface-variant text-sm">Meja Dialokasikan</p>
                </div>
              </div>
            </div>
          </section>

          {/* Module Cards */}
          <section className="space-y-4 lg:space-y-6">
            {activeCards.length === 0 ? (
              <div className="text-center py-20 border border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">widgets</span>
                <p className="font-body-md text-on-surface-variant">Belum ada fitur yang dipilih</p>
                <button
                  onClick={() => router.push(`/customize?${settingsParams}`)}
                  className="mt-6 bg-primary text-on-primary font-label-md uppercase tracking-widest py-3 px-8 hover:bg-secondary transition-colors"
                >
                  Pilih Fitur
                </button>
              </div>
            ) : (
              activeCards.map((card) => (
                <div
                  key={card.key}
                  className="group bg-surface-container-lowest border border-outline-variant/30 p-5 lg:p-7 flex items-center justify-between hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {}}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-label-md text-on-surface-variant/40 text-xs tracking-wider">{card.num}</span>
                      <h3 className="font-headline-md text-headline-md text-primary">{card.title}</h3>
                    </div>
                    <p className="font-body-md text-on-surface-variant text-sm">—</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                </div>
              ))
            )}
          </section>

          {/* Editorial */}
          <section className="mt-20 lg:mt-32">
            <div className="relative w-full aspect-[4/3] lg:aspect-[21/9] bg-surface-container overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="font-headline-md text-headline-md text-on-surface-variant/30 mb-4 italic tracking-wider">
                    every love story deserves to be preserved
                  </p>
                  <span className="inline-block w-12 h-px bg-outline-variant/30" />
                  <p className="font-label-md text-on-surface-variant/30 tracking-wider mt-4 uppercase">
                    aksaraa — 2026
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DashboardInner id={id} />
}
