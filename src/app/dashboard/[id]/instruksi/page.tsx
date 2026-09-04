"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"
import { PACKAGE_CODES, PACKAGE_FEATURES, PACKAGE_LABELS as PACKAGE_LABEL, PACKAGE_CATEGORY } from "@/lib/packages"

type Step = {
  key: string
  icon: string
  title: string
  bullets: string[]
  route: (id: string) => string
  phase: string
  always?: boolean
  prePayment?: boolean
}

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

// feature_code -> packages that include it (derived from single source of truth: packages.ts)
const AVAILABLE_IN: Record<string, string[]> = {}
for (const pkg of PACKAGE_CODES) {
  for (const feat of PACKAGE_FEATURES[pkg] || []) {
    ;(AVAILABLE_IN[feat] = AVAILABLE_IN[feat] || []).push(pkg)
  }
}

const STEPS: Step[] = [
  {
    key: "kelola_tamu",
    icon: "group",
    title: "Kelola Tamu & Meja",
    phase: "Fase 1: Persiapan Awal",
    prePayment: true,
    bullets: [
      "Tambahkan data tamu (Excel atau satu per satu).",
      "Tandai tamu VIP untuk fitur pengingat khusus.",
    ],
    route: (id) => `/dashboard/${id}/guests`,
  },
  {
    key: "premium_web",
    icon: "web",
    title: "Premium Web Invitation",
    phase: "Fase 1: Persiapan Awal",
    prePayment: true,
    bullets: [
      "Edit konten dan narasi undangan digital.",
      "Pilih tema yang sesuai karakter Anda.",
      "Konfirmasi draf sebelum dikirim ke tamu.",
    ],
    route: (id) => `/dashboard/${id}/web-invitation/editor`,
  },
  {
    key: "pembayaran",
    icon: "credit_card",
    title: "Lakukan Pembayaran",
    phase: "Fase 1: Persiapan Awal",
    always: true,
    bullets: [
      "Selesaikan pembayaran paket pilihan.",
      "Hubungi konsultan untuk aktivasi fitur lanjutan.",
    ],
    route: (id) => `/dashboard/${id}`,
  },
  {
    key: "unique_link_generator",
    icon: "qr_code",
    title: "URL Undangan & QR Tamu",
    phase: "Fase 2: Penyebaran & Otomatisasi",
    bullets: [
      "Link undangan & QR otomatis terbuat.",
      "Aksaraa team akan mengirimkan undangan sesuai tanggal.",
      "QR khusus check-in venue untuk paket tertentu.",
    ],
    route: (id) => `/dashboard/${id}/qr-guestbook`,
  },
  {
    key: "reservation_automation",
    icon: "fact_check",
    title: "RSVP Automation",
    phase: "Fase 2: Penyebaran & Otomatisasi",
    bullets: [
      "Pantau reservasi kehadiran secara real-time.",
      "Estimasi total pax untuk persiapan katering.",
      "Lihat pesan & doa digital dari tamu.",
    ],
    route: (id) => `/dashboard/${id}/reservation-automation`,
  },
  {
    key: "wa_blast",
    icon: "notifications",
    title: "Reminder Tamu VIP",
    phase: "Fase 2: Penyebaran & Otomatisasi",
    bullets: [
      "Pilih templat pesan pengingat yang elegan.",
      "Tentukan jadwal pengiriman otomatis.",
      "Pastikan daftar tamu VIP sudah tersimpan.",
    ],
    route: (id) => `/dashboard/${id}/reminder-tamu-vip`,
  },
  {
    key: "qr_code_book",
    icon: "how_to_reg",
    title: "Buku Tamu Digital",
    phase: "Fase 3: Hari Bahagia",
    bullets: [
      "Gunakan HP usher untuk scan (tanpa alat tambahan).",
      "Pantau data kedatangan tamu secara langsung.",
      "Tamu disambut tampilan personal di HP mereka.",
    ],
    route: (id) => `/dashboard/${id}/qr-guestbook/live`,
  },
  {
    key: "wish_wall",
    icon: "auto_awesome",
    title: "Virtual Wish Wall",
    phase: "Fase 3: Hari Bahagia",
    bullets: [
      "Tampilkan doa tamu secara live di layar ballroom.",
      "Gunakan dasbor moderasi untuk menyaring pesan.",
      "Akses link wish wall langsung dari menu ini.",
    ],
    route: (id) => `/dashboard/${id}/wish-wall`,
  },
  {
    key: "galeri_foto_tamu",
    icon: "photo_library",
    title: "Galeri Kenangan Tamu",
    phase: "Fase 3: Hari Bahagia",
    bullets: [
      "Lihat & unduh foto dari perspektif tamu.",
      "Batas waktu unduh: 1 minggu setelah hari-H.",
      "Simpan momen unik yang tertangkap secara candid.",
    ],
    route: (id) => `/dashboard/${id}/galeri-kenangan`,
  },
  {
    key: "kolom_direct_transfer",
    icon: "redeem",
    title: "Digital Angpao & E-Gift",
    phase: "Fase 3: Hari Bahagia",
    bullets: [
      "Kelola rekening bank, QRIS, dan alamat kado.",
      "Tampilkan info donasi di halaman undangan.",
    ],
    route: (id) => `/dashboard/${id}/amplop-digital`,
  },
]

function InstructionInner({ id }: { id: string }) {
  const router = useRouter()
  const [selections, setSelections] = useState<Selections | null>(null)
  const [packageType, setPackageType] = useState("signature")
  const [paymentStatus, setPaymentStatus] = useState<string>("UNPAID")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setSelections(data.selections || {})
        setPackageType(data.profile?.package_type || "signature")
        setPaymentStatus(data.profile?.payment_status || "UNPAID")
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const activeKeys = new Set(
    Object.entries(selections || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k)
  )

  const phases: { label: string; steps: Step[] }[] = []
  for (const step of STEPS) {
    let phase = phases.find((p) => p.label === step.phase)
    if (!phase) {
      phase = { label: step.phase, steps: [] }
      phases.push(phase)
    }
    phase.steps.push(step)
  }

  const goToCustomize = () => {
    const settingsParams = new URLSearchParams({
      user: "",
      partner: "",
      date: "",
      guest: "",
      edit: "true",
      profile_id: id,
    })
    router.push(`/customize?${settingsParams}`)
  }

  return (
    <>
      <PageTheme mode="light" />
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-surface border-b border-outline-variant h-16 flex items-center px-6 md:px-12">
        <div className="w-full flex items-center justify-between">
          <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">Cara Memulai</span>
          <ProfileMenu />
        </div>
      </header>

      <main className="w-full max-w-container-max mx-auto px-5 md:px-edge-margin-desktop pt-24 md:pt-28 pb-28 md:pb-20 relative">
        <div className="text-center mb-8 md:mb-16 max-w-2xl mx-auto px-2">
          <h1 className="font-headline-xl text-[26px] md:text-headline-xl text-primary mb-3 md:mb-6 leading-tight">Cara Memulai</h1>
          <p className="font-body-md text-sm md:text-body-md text-on-surface-variant leading-relaxed">
            Ikuti langkah-langkah perencanaan sesuai modul yang aktif pada paket Anda.
          </p>
        </div>

        {loading ? (
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <div className="relative w-full max-w-5xl mx-auto">
            {/* Central Line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-surface-variant md:translate-x-[-0.5px] z-0" />

            {phases.map((phase, pi) => (
              <div key={phase.label}>
                <div className="mb-8 md:mb-14 text-center relative z-20">
                  <span className="inline-block px-4 py-2.5 bg-surface-container rounded-full border border-outline-variant font-label-md text-[11px] md:text-label-md uppercase tracking-widest text-on-surface">
                    {phase.label}
                  </span>
                </div>

                {phase.steps.map((step, i) => {
                  // Step order: pre-payment basics (kelola tamu, premium web) are
                  // always active. Pembayaran gates everything below it.
                  const isPembayaran = step.key === "pembayaran"
                  const paymentActive = paymentStatus !== "UNPAID"
                  const isActive = step.prePayment
                    ? true
                    : isPembayaran
                      ? paymentActive
                      : paymentActive && (step.always || activeKeys.has(step.key))
                  const even = i % 2 === 0
                  return (
                    <div key={`${step.key}-${pi}-${i}`} className={`flex flex-col md:flex-row items-center w-full mb-8 md:mb-14 pl-6 md:pl-0 ${even ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      <div className={`w-full md:w-1/2 ${even ? "md:pr-16" : "md:pl-16"} ${even ? "md:flex md:justify-end" : "md:flex md:justify-start"}`}>
                        <div
                          className={`w-full max-w-sm p-5 md:p-8 border rounded-2xl bg-surface-container-lowest relative ${
                            isActive
                              ? "border-secondary shadow-[0_4px_24px_rgba(141,77,57,0.08)]"
                              : "border-outline-variant opacity-70"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-3 -left-3 bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-md text-label-md border border-secondary flex items-center gap-1 shadow-sm">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              {isPembayaran ? "Terbayar" : "Aktif"}
                            </div>
                          )}

                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 border ${
                            isActive
                              ? "bg-secondary/10 border-secondary/20"
                              : "bg-surface-container-highest border-outline-variant"
                          }`}>
                            <span className={`material-symbols-outlined ${isActive ? "text-secondary" : "text-outline"}`}>{step.icon}</span>
                          </div>

                          <span className="font-label-md text-[11px] md:text-label-md text-on-surface-variant uppercase tracking-widest block mb-2">
                            Step {i + 1}
                          </span>
                          <h3 className="font-headline-md text-[18px] md:text-headline-md text-primary mb-3 leading-tight">{step.title}</h3>

                          {!isActive && (
                            isPembayaran ? (
                              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-full">
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                                <span className="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">
                                  {paymentStatus === "UNPAID" ? "Menunggu Pembayaran" : "Belum Tersedia"}
                                </span>
                              </div>
                            ) : (
                              (() => {
                                const pkgs = AVAILABLE_IN[step.key] || []
                                const grouped: Record<string, string[]> = {}
                                for (const p of pkgs) {
                                  const cat = PACKAGE_CATEGORY[p] === "dgbook" ? "Buku Tamu Digital" : "Undangan Digital"
                                  if (!grouped[cat]) grouped[cat] = []
                                  grouped[cat].push(PACKAGE_LABEL[p] || p)
                                }
                                return (
                                  <div className="mb-4 inline-flex flex-col gap-1 px-3 py-2 bg-surface-container border border-outline-variant rounded-xl">
                                    <span className="inline-flex items-center gap-1.5 font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">
                                      <span className="material-symbols-outlined text-[14px]">lock</span>
                                      Tersedia di Paket:
                                    </span>
                                    {Object.entries(grouped).map(([cat, labels]) => (
                                      <span key={cat} className="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant ml-5">
                                        • {cat}: {labels.join(", ")}
                                      </span>
                                    ))}
                                  </div>
                                )
                              })()
                            )
                          )}

                          <ul className="mb-6 flex flex-col gap-2.5">
                            {step.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-3">
                                {isPembayaran ? (
                                  <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center ${
                                    paymentActive
                                      ? "bg-secondary border-secondary text-on-secondary"
                                      : "bg-surface-container-highest border-outline-variant text-outline"
                                  }`}>
                                    {paymentActive && (
                                      <span className="material-symbols-outlined text-[13px]">check</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="w-1.5 h-1.5 shrink-0 mt-2 rounded-full bg-on-secondary-fixed-variant" />
                                )}
                                <span className={`text-[13px] md:text-sm font-body-md leading-relaxed ${
                                  isPembayaran && !paymentActive ? "text-outline" : "text-on-surface-variant"
                                }`}>{b}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => {
                              if (isActive) {
                                router.push(step.route(id))
                              } else {
                                goToCustomize()
                              }
                            }}
                            disabled={!isActive}
                            className={`w-full py-4 min-h-[48px] font-label-md text-[13px] md:text-label-md uppercase tracking-widest flex items-center justify-center gap-2 transition-colors rounded-xl ${
                              isActive
                                ? "bg-primary text-on-primary border border-primary hover:bg-secondary hover:border-secondary active:scale-[0.98]"
                                : "bg-transparent border border-outline-variant text-outline cursor-not-allowed"
                            }`}
                          >
                            {isActive ? (
                              <>
                                Lihat Detail <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </>
                            ) : (
                              "Belum Tersedia"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Node */}
                      <div
                        className={`hidden md:flex w-12 h-12 absolute left-1/2 -translate-x-1/2 items-center justify-center rounded-full shadow-[0_0_0_4px_#fdf9f0] border-2 z-10 ${
                          isActive
                            ? "bg-surface border-secondary"
                            : "bg-surface-variant border-outline-variant"
                        }`}
                      >
                        {isActive ? (
                          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : (
                          <span className="w-2.5 h-2.5 bg-outline-variant rounded-full" />
                        )}
                      </div>

                      <div className="w-full md:w-1/2 hidden md:block" />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center pb-4">
          <button
            onClick={goToCustomize}
            className="inline-flex items-center gap-2 px-8 py-4 min-h-[48px] bg-secondary text-on-secondary font-label-md text-[13px] md:text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity rounded-full active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Atur di Pilih Paket
          </button>
        </div>
      </main>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <InstructionInner id={id} />
}
