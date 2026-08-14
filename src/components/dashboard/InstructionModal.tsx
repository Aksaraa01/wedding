"use client"

import { useRouter } from "next/navigation"

type Step = {
  key: string
  icon: string
  title: string
  bullets: string[]
  route: (id: string) => string
  phase: string
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

const PACKAGE_LABEL: Record<string, string> = {
  essential: "Essential",
  signature: "Signature",
  prestige: "Prestige",
}

// feature_code -> packages that include it (source of truth: packages.ts)
const AVAILABLE_IN: Record<string, string[]> = {
  premium_web: ["essential", "signature", "prestige"],
  reservation_automation: ["essential", "signature", "prestige"],
  unique_link_generator: ["essential", "signature", "prestige"],
  kolom_direct_transfer: ["essential", "signature", "prestige"],
  wish_wall: ["signature", "prestige"],
  galeri_foto_tamu: ["prestige"],
  qr_code_book: ["prestige"],
  wa_blast: ["prestige"],
}

const STEPS: Step[] = [
  {
    key: "unique_link_generator",
    icon: "group",
    title: "Kelola Tamu & Meja",
    phase: "Fase 1: Persiapan Awal",
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
    bullets: [
      "Edit konten dan narasi undangan digital.",
      "Pilih tema yang sesuai karakter Anda.",
      "Konfirmasi draf sebelum dikirim ke tamu.",
    ],
    route: (id) => `/dashboard/${id}/web-invitation/editor`,
  },
  {
    key: "undangan_fisik",
    icon: "credit_card",
    title: "Undangan Fisik & Pembayaran",
    phase: "Fase 1: Persiapan Awal",
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
    title: "QR Guest Book",
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

export default function InstructionModal({
  id,
  selections,
  packageType,
  onClose,
}: {
  id: string
  selections: Selections
  packageType: string
  onClose: () => void
}) {
  const router = useRouter()

  const activeKeys = new Set(
    Object.entries(selections)
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
    <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-6">
      <div className="bg-background text-on-background w-full md:max-w-5xl max-h-screen md:max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <main className="w-full max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop pt-16 md:pt-20 pb-16 relative">
          <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
            <h1 className="font-headline-xl text-headline-xl text-primary mb-6">Instruksi</h1>
            <p className="font-body-md text-on-surface-variant">
              Ikuti langkah-langkah perencanaan sesuai modul yang aktif pada paket Anda.
            </p>
          </div>

          <div className="relative w-full max-w-5xl mx-auto">
            {/* Central Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-surface-variant md:translate-x-[-0.5px] z-0" />

            {phases.map((phase) => (
              <div key={phase.label}>
                <div className="mb-10 md:mb-14 text-center relative z-20">
                  <span className="inline-block px-4 py-2 bg-surface-container rounded-full border border-outline-variant font-label-md text-label-md uppercase tracking-widest text-on-surface">
                    {phase.label}
                  </span>
                </div>

                {phase.steps.map((step, i) => {
                  const isActive = activeKeys.has(step.key)
                  const even = i % 2 === 0
                  return (
                    <div key={`${step.key}-${i}`} className="flex flex-col md:flex-row items-center w-full mb-10 md:mb-14">
                      <div className={`w-full md:w-1/2 ${even ? "md:pr-16" : "md:pl-16"} ${even ? "md:flex md:justify-end" : "md:flex md:justify-start"}`}>
                        <div
                          className={`w-full max-w-sm p-6 md:p-8 border bg-surface-container-lowest relative ${
                            isActive
                              ? "border-secondary shadow-[0_4px_24px_rgba(141,77,57,0.08)]"
                              : "border-outline-variant opacity-70"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-3 -left-3 bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-md text-label-md border border-secondary flex items-center gap-1 shadow-sm">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Aktif
                            </div>
                          )}

                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 border ${
                            isActive
                              ? "bg-secondary/10 border-secondary/20"
                              : "bg-surface-container-highest border-outline-variant"
                          }`}>
                            <span className={`material-symbols-outlined ${isActive ? "text-secondary" : "text-outline"}`}>{step.icon}</span>
                          </div>

                          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-2">
                            Step {i + 1}
                          </span>
                          <h3 className="font-headline-md text-headline-md text-primary mb-3">{step.title}</h3>

                          {!isActive && (
                            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant rounded-full">
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">workspace_premium</span>
                              <span className="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">
                                Tersedia di Paket {AVAILABLE_IN[step.key]?.map((p) => PACKAGE_LABEL[p]).join(" & ")}
                              </span>
                            </div>
                          )}

                          <ul className="mb-6 flex flex-col gap-2.5">
                            {step.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 shrink-0 mt-2 rounded-full bg-on-secondary-fixed-variant" />
                                <span className="text-sm text-on-surface-variant font-body-md leading-relaxed">{b}</span>
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
                            className={`w-full py-3 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                              isActive
                                ? "bg-primary text-on-primary border border-primary hover:bg-secondary hover:border-secondary"
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

          <div className="mt-10 text-center">
            <button
              onClick={goToCustomize}
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-on-secondary font-label-md text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Atur di Pilih Paket
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
