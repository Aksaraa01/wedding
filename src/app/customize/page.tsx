"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"

type Toggles = Record<
  | "premium_web" | "wish_wall" | "reservation_automation"
  | "kolom_direct_transfer" | "gift_marketplace"
  | "qr_code_book" | "unique_link_generator"
  | "undangan_fisik" | "wa_blast",
  boolean
>

const MAIN_PRODUCTS = ["premium_web", "qr_code_book", "undangan_fisik", "wa_blast"] as const
type MainProduct = (typeof MAIN_PRODUCTS)[number]

const SUB_MAP: Record<string, string[]> = {
  premium_web: ["wish_wall", "reservation_automation", "kolom_direct_transfer", "gift_marketplace"],
  qr_code_book: ["unique_link_generator"],
}

function waTierPrice(guest: number) {
  if (guest <= 100) return 200_000
  if (guest <= 500) return 500_000
  return 1_000_000
}

function toggleClass(on: boolean) {
  return on ? "bg-secondary" : "bg-surface-container-highest"
}
function knobClass(on: boolean) {
  return on ? "translate-x-6 bg-on-secondary" : "bg-on-surface-variant/60"
}

function Inner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("user") || ""
  const partnerName = searchParams.get("partner") || ""
  const guestCount = Number(searchParams.get("guest") || "300")

  const [toggles, setToggles] = useState<Toggles>({
    premium_web: true,
    wish_wall: true,
    reservation_automation: true,
    kolom_direct_transfer: true,
    gift_marketplace: true,
    qr_code_book: true,
    unique_link_generator: true,
    undangan_fisik: false,
    wa_blast: true,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const subProductsOf = (main: string) =>
    (SUB_MAP[main] || []) as (keyof Toggles)[]

  const allSubOff = (main: string) =>
    subProductsOf(main).every((s) => !toggles[s])

  const handleMainToggle = (key: MainProduct) => {
    setToggles((prev) => {
      const next = !prev[key]
      const subs = subProductsOf(key)
      const updated = { ...prev, [key]: next }
      subs.forEach((s) => {
        updated[s] = next
      })
      return updated
    })
  }

  const handleSubToggle = (main: string, sub: keyof Toggles) => {
    setToggles((prev) => {
      if (!prev[main as keyof Toggles]) return prev
      const updated = { ...prev, [sub]: !prev[sub] }
      if (allSubOff(main)) {
        updated[main as keyof Toggles] = false
      }
      return updated
    })
  }

  const total =
    (toggles.premium_web ? 1_000_000 : 0) +
    (toggles.qr_code_book ? 500_000 : 0) +
    (toggles.wa_blast ? waTierPrice(guestCount) : 0)

  const formatRp = (n: number) =>
    "Rp " + n.toLocaleString("id-ID")

  const handleSubmit = async () => {
    const cleaned = waNumber.replace(/\D/g, "")
    if (!cleaned) return

    const first = userName.trim().split(" ")[0].toLowerCase()
    const second = partnerName.trim().split(" ")[0].toLowerCase()
    const slug = `${first}-${second}`

    const res = await fetch("/api/submit-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bride_name: userName.trim(),
        groom_name: partnerName.trim(),
        estimated_wedding_date: searchParams.get("date") || "2025-12-31",
        estimated_guest_count: guestCount,
        slug,
        whatsapp_number: `+62${cleaned}`,
        toggles,
        total_project_cost: total,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const p = new URLSearchParams({
        user: userName.trim(),
        partner: partnerName.trim(),
        date: searchParams.get("date") || "2025-12-31",
        guest: String(guestCount),
      })
      router.push(`/dashboard/${data.wedding_profile_id}?${p}`)
    }
  }

  return (
    <div className="font-body-md text-on-background bg-background min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md px-edge-margin-mobile h-20 flex justify-between items-center border-b border-outline-variant/30">
        <button
          onClick={() => {
            const p = new URLSearchParams({
              step: "3",
              user: userName,
              partner: partnerName,
              date: searchParams.get("date") || "tentative",
              guest: String(guestCount),
            })
            router.push(`/register?${p}`)
          }}
          className="flex items-center gap-2 group hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div className="font-display-lg text-headline-md tracking-widest uppercase text-primary">Aksara</div>
        <span className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity">account_circle</span>
      </header>

      <main className="pt-32 px-edge-margin-mobile max-w-container-max mx-auto pb-40">
        <div className="max-w-4xl mb-20">
          <h1 className="font-headline-xl text-display-lg-mobile mb-6 leading-tight text-primary">
            Rancang Cerita Anda
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Halo {userName} &amp; {partnerName}, silakan aktifkan atau matikan service di bawah sesuai kebutuhan
            esensial pernikahan Anda.
          </p>
        </div>

        <div className="space-y-12">
          {/* Premium Web Invitation */}
          <Section>
            <HeaderRow
              title="Premium Web Invitation"
              desc="Desain undangan digital sinematik premium."
              on={toggles.premium_web}
              onToggle={() => handleMainToggle("premium_web")}
            />
            <div className="space-y-2 ml-4 md:ml-8">
              {["wish_wall", "reservation_automation", "kolom_direct_transfer", "gift_marketplace"].map(
                (sub) => (
                  <SubRow
                    key={sub}
                    label={SUB_LABELS[sub]}
                    on={toggles[sub as keyof Toggles]}
                    disabled={!toggles.premium_web}
                    onToggle={() => handleSubToggle("premium_web", sub as keyof Toggles)}
                  />
                )
              )}
            </div>
          </Section>

          {/* QR Code Book */}
          <Section>
            <HeaderRow
              title="QR Code Book & Real-Time Attendance"
              desc="Sistem check-in tamu otomatis di lokasi."
              on={toggles.qr_code_book}
              onToggle={() => handleMainToggle("qr_code_book")}
            />
            <div className="space-y-2 ml-4 md:ml-8">
              <SubRow
                label="Unique Link Generator"
                on={toggles.unique_link_generator}
                disabled={!toggles.qr_code_book}
                onToggle={() => handleSubToggle("qr_code_book", "unique_link_generator")}
              />
            </div>
          </Section>

          {/* Undangan Fisik */}
          <Section>
            <HeaderRow
              title="Undangan Fisik"
              desc="Layanan cetak eksklusif dengan bahan premium."
              on={toggles.undangan_fisik}
              onToggle={() => setToggles((p) => ({ ...p, undangan_fisik: !p.undangan_fisik }))}
              border={false}
            />
          </Section>

          {/* WhatsApp Blast Resmi */}
          <Section>
            <HeaderRow
              title="WhatsApp Blast Resmi"
              desc="Kirim undangan massal resmi via WhatsApp."
              on={toggles.wa_blast}
              onToggle={() => setToggles((p) => ({ ...p, wa_blast: !p.wa_blast }))}
              border={false}
            />
            <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant border-t border-outline-variant/10 pt-4">
              <span>Jumlah tamu: <strong>{guestCount.toLocaleString("id-ID")}</strong> orang</span>
              <button
                onClick={() => {
                  const p = new URLSearchParams({
                    step: "3",
                    user: userName,
                    partner: partnerName,
                    date: searchParams.get("date") || "tentative",
                    guest: String(guestCount),
                  })
                  router.push(`/register?${p}`)
                }}
                className="font-label-md text-xs uppercase tracking-wider underline hover:text-secondary transition-colors"
              >
                Ubah
              </button>
            </div>
          </Section>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md z-50 px-edge-margin-mobile py-6 border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md uppercase tracking-[0.15em] text-on-surface-variant/60">
              Estimasi Total
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              {formatRp(total)}
              {toggles.undangan_fisik && (
                <span className="block text-xs font-body-md text-on-surface-variant/60 font-normal">
                  * belum termasuk undangan fisik
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary font-label-md text-label-md uppercase tracking-[0.1em] px-12 py-5 transition-all duration-300 hover:bg-secondary active:scale-[0.98] w-full md:w-auto"
          >
            Kunci Kustomisasi &amp; Kirim ke Konsultan
          </button>
        </div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-edge-margin-mobile">
          <div
            className="absolute inset-0 bg-on-background/40 backdrop-blur-md"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-background w-full max-w-md p-8 rounded-xl shadow-sm border border-outline-variant/30">
            <h2 className="font-headline-md text-headline-md mb-4">Langkah Terakhir</h2>
            <p className="font-body-md text-on-surface-variant mb-8">
              Silakan masukkan nomor WhatsApp Anda agar Konsultan kami dapat segera menghubungi Anda untuk
              memproses kustomisasi ini.
            </p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-md uppercase tracking-widest text-on-surface-variant/60">
                  Nomor WhatsApp
                </label>
                <div className="flex border border-outline-variant/30 focus-within:border-primary transition-colors">
                  <span className="px-4 py-3 bg-surface-container-highest font-body-md border-r border-outline-variant/30">
                    +62
                  </span>
                  <input
                    className="w-full px-4 py-3 bg-transparent font-body-md focus:outline-none"
                    placeholder="8123456789"
                    type="tel"
                    value={waNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "")
                      setWaNumber(digits)
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!waNumber}
                  className={`bg-primary text-on-primary font-label-md uppercase tracking-widest py-4 transition-colors ${
                    waNumber ? "hover:bg-secondary" : "opacity-50"
                  }`}
                >
                  Kirim ke Konsultan
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-on-surface-variant font-label-md uppercase tracking-widest py-2 hover:text-primary transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function CustomizePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  )
}

const SUB_LABELS: Record<string, string> = {
  wish_wall: "Virtual Wish Wall",
  reservation_automation: "Reservation Automation",
  kolom_direct_transfer: "Kolom Direct Transfer",
  gift_marketplace: "Aksara Gift Marketplace",
  unique_link_generator: "Unique Link Generator",
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low/30 rounded-xl p-6 md:p-8 border border-outline-variant/30">
      {children}
    </section>
  )
}

function HeaderRow({
  title,
  desc,
  on,
  onToggle,
  border = true,
}: {
  title: string
  desc: string
  on: boolean
  onToggle: () => void
  border?: boolean
}) {
  return (
    <div className={`flex items-center justify-between${border ? " mb-8 pb-6 border-b border-outline-variant/30" : ""}`}>
      <div className="flex-1 pr-4 group transition-all">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-headline-md text-headline-md">{title}</h2>
          <span className="material-symbols-outlined text-on-surface-variant/40 text-sm group-hover:text-primary transition-colors">arrow_forward_ios</span>
        </div>
        <p className="font-body-md text-on-surface-variant">{desc}</p>
      </div>
      <div
        className={`toggle-track w-12 h-6 rounded-full relative cursor-pointer ${toggleClass(on)}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <div className={`toggle-knob absolute left-1 top-1 w-4 h-4 rounded-full shadow-sm ${knobClass(on)}`} />
      </div>
    </div>
  )
}

function SubRow({
  label,
  on,
  disabled,
  onToggle,
}: {
  label: string
  on: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-outline-variant/10 last:border-b-0">
      <div className="flex-1 pr-4 group flex items-center justify-between">
        <span className="font-body-md">{label}</span>
        <span className="material-symbols-outlined text-on-surface-variant/30 text-xs group-hover:text-primary transition-colors mr-4">chevron_right</span>
      </div>
      <div
        className={`toggle-track w-12 h-6 rounded-full relative cursor-pointer ${
          disabled ? "bg-surface-container-highest pointer-events-none" : toggleClass(on)
        }`}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onToggle()
        }}
      >
        <div
          className={`toggle-knob absolute left-1 top-1 w-4 h-4 rounded-full shadow-sm ${
            disabled ? "bg-on-surface-variant/60" : knobClass(on)
          }`}
        />
      </div>
    </div>
  )
}
