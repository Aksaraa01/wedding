"use client"

import { useState, useEffect, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
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
  { key: "premium_web" as const, title: "Premium Web Invitation" },
  { key: "unique_link_generator" as const, title: "Unique Link Generator" },
  { key: "wish_wall" as const, title: "Virtual Wish Wall (Dinding Doa)" },
  { key: "undangan_fisik" as const, title: "Undangan Fisik Premium (Cetak)" },
  { key: "wa_blast" as const, title: "WhatsApp Blast Resmi" },
  { key: "reservation_automation" as const, title: "RSVP Automation" },
  { key: "qr_code_book" as const, title: "QR Code Guest Book & Absensi" },
  { key: "kolom_direct_transfer" as const, title: "Digital Angpao & E-Gift" },
  { key: "gift_marketplace" as const, title: "Aksara Gift Marketplace" },
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
  const [guestCount, setGuestCount] = useState(0)
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
        setGuestCount(data.guest_count ?? data.profile.estimated_guest_count ?? 0)
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

  const settingsParams = new URLSearchParams({
    user: profile.bride_name,
    partner: profile.groom_name,
    date: profile.estimated_wedding_date,
    guest: String(profile.estimated_guest_count ?? guestCount),
    edit: "true",
    profile_id: id,
  })

  const activeCards = CARDS.filter((card) => selections[card.key])

  return (
    <>
      <PageTheme mode="light" />
      <header className="fixed top-0 w-full z-50 bg-background flex justify-between items-center px-edge-margin-mobile md:px-edge-margin-desktop h-20">
        <div className="font-headline-md text-headline-md tracking-widest text-primary">AKSARAA</div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/customize?${settingsParams}`)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity duration-300"
          >
            <span className="material-symbols-outlined text-primary">settings</span>
            <span className="font-label-md text-label-md uppercase tracking-widest hidden md:block">Ubah Pilihan Fitur</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          </div>
        </div>
      </header>

      <main className="mt-32 pb-32 px-edge-margin-mobile md:px-80 max-w-container-max mx-auto">
        <section className="mb-16">
          <h2 className="font-headline-md text-headline-md leading-tight">
            Selamat Datang,<br />
            {profile.bride_name} &amp; {profile.groom_name}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="font-body-md text-on-surface-variant">{statusLabel}</span>
          </div>
        </section>

        <section className="mb-20">
          <div
            onClick={() => router.push(`/dashboard/${id}/guests`)}
            className="hairline-divider pb-12 group cursor-pointer hover:bg-surface-container-low transition-colors duration-300"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-headline-md text-headline-md mb-6">Pusat Data Tamu &amp; Denah Meja</h2>
                <div className="flex flex-col md:flex-row gap-4 md:gap-12">
                  <div>
                    <p className="font-label-md text-label-md uppercase text-on-surface-variant mb-1">Total Input</p>
                    <p className="font-body-lg text-body-lg">{guestCount} Nama Terinput</p>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md uppercase text-on-surface-variant mb-1">Alokasi Ruang</p>
                    <p className="font-body-lg text-body-lg">0 Meja Dialokasikan</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-primary group-hover:translate-x-2 transition-transform duration-300">
                <span className="font-label-md text-label-md uppercase tracking-widest">Kelola Daftar Tamu &amp; Pemetaan Meja</span>
                <span className="material-symbols-outlined">east</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-0">
          <div className="mb-8">
            <h3 className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant">Modul Perencanaan</h3>
          </div>

          {activeCards.length === 0 ? (
            <div className="text-center py-20 hairline-divider">
              <p className="font-body-md text-on-surface-variant">Belum ada modul yang dipilih</p>
            </div>
          ) : (
            activeCards.map((card, i) => (
              <div
                key={card.key}
                className="hairline-divider py-10 group cursor-pointer hover:bg-surface-container-low transition-colors duration-300 flex justify-between items-center"
              >
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8">
                  <span className="font-label-md text-label-md text-on-surface-variant">{String(i + 1).padStart(2, "0")}.</span>
                  <div>
                    <h4 className="font-headline-md text-headline-md text-2xl mb-2">{card.title}</h4>
                    <p className="font-body-md text-secondary uppercase tracking-wider font-semibold">—</p>
                  </div>
                </div>
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform duration-300">chevron_right</span>
              </div>
            ))
          )}
        </section>

        <section className="mt-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="md:col-span-7">
            <div className="aspect-[4/5] w-full overflow-hidden bg-surface-container relative">
              <Image src="/dashboard.png" alt="Aksaraa Dashboard" fill className="object-cover" />
            </div>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <h3 className="font-headline-lg text-headline-lg mb-6 italic">&ldquo;Narasi perjalanan cinta yang terkurasi dengan sempurna.&rdquo;</h3>
            <p className="font-body-md text-on-surface-variant">Setiap modul dirancang untuk mempermudah langkah Anda menuju hari bahagia, tanpa mengabaikan sentuhan estetika dan detail kriya yang personal.</p>
          </div>
        </section>
      </main>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DashboardInner id={id} />
}
