"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  PACKAGE_PRICES,
  PACKAGE_OLD_PRICES,
  PACKAGE_LABELS,
  WA_TIER_PRICES,
  EXPRESS_FEE,
  calcTotal,
  normalizePhone,
} from "@/lib/packages"
import ProfileMenu from "@/components/ProfileMenu"

const WA_TIERS = [100, 200, 300] as const

type MatrixRow = {
  id: string
  label: string
  columns: Record<string, { value: string; class: string }>
}

type MatrixSection = {
  code: string
  label: string
  rows: MatrixRow[]
}

type MatrixCol = {
  code: string
  label: string
}

type CardDef = {
  code: string
  name: string
  tagline: string
  badge?: string
  style: "sage" | "secondary" | "gold"
  features: { text: string; included: boolean; accent?: boolean }[]
}

const UNDANGAN_CARDS: CardDef[] = [
  {
    code: "essential",
    name: "Essential",
    tagline: "Sederhana dan anggun untuk momen hangat keluarga dekat",
    features: [
      { text: "Undangan Digital & Smart Dashboard", included: true },
      { text: "Amplop Digital (Rekening Based)", included: true },
      { text: "RSVP & Wedding Wish", included: true },
      { text: "Pilihan Lagu, Subdomain & Pilihan Bahasa", included: true },
      { text: "Alamat Pengiriman Kado", included: false },
      { text: "Love Story & Cinematic Video", included: false },
    ],
    style: "sage",
  },
  {
    code: "signature",
    name: "Signature",
    tagline: "Favorit 85% pasangan — keseimbangan estetika & fitur",
    badge: "Paling Populer",
    features: [
      { text: "Semua fitur Essential", included: true },
      { text: "Alamat Pengiriman Kado", included: true, accent: true },
      { text: "Fitur Turut Mengundang", included: true, accent: true },
      { text: "3 Round Revisi & 20 Foto Galeri", included: true },
      { text: "Love Story & Cinematic Video", included: false },
    ],
    style: "secondary",
  },
  {
    code: "prestige",
    name: "Prestige",
    tagline: "Pengalaman narasi digital paling mewah dengan fitur VIP",
    badge: "VIP",
    features: [
      { text: "Semua fitur Signature", included: true },
      { text: "Love Story & Cinematic Video", included: true, accent: true },
      { text: "Custom Logo Wedding", included: true, accent: true },
      { text: "Reminder otomatis ke 100 Tamu VIP", included: true, accent: true },
      { text: "5 Round Revisi & Foto Galeri Unlimited", included: true },
      { text: "QR Guest Book & Galeri Kenangan Tamu (lewat Buku Tamu Digital)", included: false },
    ],
    style: "gold",
  },
]

const DGB_CARDS: CardDef[] = [
  {
    code: "dgb_sistem",
    name: "Sistem",
    tagline: "Buku tamu digital esensial untuk hari bahagia Anda",
    features: [
      { text: "QR Digital System & Check-in Tamu", included: true },
      { text: "Photo by Guest (2 foto / tamu)", included: true },
      { text: "Wedding Wish & RSVP", included: true },
      { text: "Subdomain Nama Pasangan", included: true },
      { text: "Reminder otomatis ke 100 Tamu VIP", included: true },
    ],
    style: "sage",
  },
  {
    code: "dgb_pro",
    name: "Pro",
    tagline: "Layanan usher profesional untuk kelancaran acara",
    badge: "Paling Populer",
    features: [
      { text: "Semua fitur Sistem", included: true },
      { text: "Ushers (2) & Devices (2 Tablet/HP)", included: true, accent: true },
      { text: "Incl. Undangan Digital & Smart Dashboard", included: true },
      { text: "Amplop Digital & Galeri Kenangan Tamu", included: true },
    ],
    style: "secondary",
  },
  {
    code: "dgb_premium",
    name: "Premium",
    tagline: "Kapasitas lebih besar untuk perayaan yang meriah",
    badge: "Premium",
    features: [
      { text: "Semua fitur Pro", included: true },
      { text: "Ushers (3) & Devices (3 Tablet/HP)", included: true, accent: true },
      { text: "Photo by Guest (3 foto / tamu)", included: true, accent: true },
      { text: "Reminder otomatis ke 100 Tamu VIP", included: true },
    ],
    style: "gold",
  },
  {
    code: "dgb_prestige",
    name: "Prestige",
    tagline: "Layanan konci untuk acara berskala besar",
    badge: "VIP",
    features: [
      { text: "Semua fitur Premium", included: true },
      { text: "Ushers (4) & Devices (4 Tablet/HP)", included: true, accent: true },
      { text: "Photo by Guest (4 foto / tamu)", included: true, accent: true },
      { text: "Amplop Digital & Galeri Kenangan Tamu", included: true },
      { text: "Reminder otomatis ke 100 Tamu VIP", included: true },
    ],
    style: "gold",
  },
]

const CARD_STYLES = {
  sage: {
    accent: "text-[#4a6b57]",
    badgeBg: "bg-[#4a6b57]/10 text-[#3d5a48]",
    border: "border-[#4a6b57]/30",
    hoverBorder: "hover:border-[#4a6b57]",
    activeBorder: "border-[#4a6b57]",
    price: "text-[#3d5a48]",
  },
  secondary: {
    accent: "text-secondary",
    badgeBg: "bg-secondary text-on-secondary border-secondary",
    border: "border-secondary",
    hoverBorder: "hover:border-secondary",
    activeBorder: "border-secondary",
    price: "text-secondary",
  },
  gold: {
    accent: "text-[#a9802f]",
    badgeBg: "bg-[#d4af37]/15 text-[#8a6d1f] border-[#d4af37]/50",
    border: "border-[#d4af37]",
    hoverBorder: "hover:border-[#d4af37]",
    activeBorder: "border-[#d4af37]",
    price: "text-[#a9802f]",
  },
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID").replace(/,/g, ".")
}

function Inner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("user") || ""
  const partnerName = searchParams.get("partner") || ""

  const isEdit = searchParams.get("edit") === "true"
  const editProfileId = searchParams.get("profile_id") || ""

  const initialTab = searchParams.get("tab") === "dgbook" ? "dgbook" : "undangan"

  const [activeTab, setActiveTab] = useState<"undangan" | "dgbook">(initialTab)
  const [selectedPackage, setSelectedPackage] = useState(initialTab === "dgbook" ? "dgb_sistem" : "signature")
  const [waBlastTier, setWaBlastTier] = useState<number>(0)
  const [expressService, setExpressService] = useState(false)
  const [undanganFisik, setUndanganFisik] = useState(false)
  const [matrix, setMatrix] = useState<MatrixSection[]>([])
  const [matrixCols, setMatrixCols] = useState<MatrixCol[]>([])

  const [loaded, setLoaded] = useState(!isEdit)
  const [modalOpen, setModalOpen] = useState(false)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    fetch("/api/packages/matrix")
      .then((r) => r.json())
      .then((data) => {
        setMatrix(data.matrix || [])
        setMatrixCols(data.columns || [])
      })
  }, [])

  useEffect(() => {
    if (!isEdit || !editProfileId) return
    fetch(`/api/dashboard/${editProfileId}`)
      .then((r) => r.json())
      .then((data) => {
        const pkg = data.profile.package_type || "signature"
        setSelectedPackage(pkg)
        setActiveTab(pkg.startsWith("dgb_") ? "dgbook" : "undangan")
        setWaBlastTier(data.profile.wa_blast_tier || 0)
        setExpressService(!!data.profile.express_service)
        setUndanganFisik(!!data.profile.undangan_fisik)
        setLoaded(true)
      })
  }, [editProfileId, isEdit])

  const total = calcTotal(selectedPackage, waBlastTier, expressService)

  const switchTab = (tab: "undangan" | "dgbook") => {
    setActiveTab(tab)
    setSelectedPackage(tab === "dgbook" ? "dgb_sistem" : "signature")
    setWaBlastTier(0)
  }

  const isDgb = selectedPackage.startsWith("dgb_")
  const showWaTier = !isDgb || isDgb // WA Blast VIP reminder is part of Prestige & every Buku Tamu tier
  const activeCards = activeTab === "undangan" ? UNDANGAN_CARDS : DGB_CARDS

  const handleSubmit = async () => {
    const cleaned = waNumber.replace(/\D/g, "").replace(/^0+/, "")
    if (!cleaned) return

    setSubmitting(true)
    setSubmitError("")

    const phone = normalizePhone(cleaned)

    const phoneCheck = await fetch(`/api/check-phone?q=${encodeURIComponent(phone)}`)
    const phoneResult = await phoneCheck.json()
    if (phoneResult.exists) {
      setSubmitError("Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.")
      setSubmitting(false)
      return
    }

    const coupleCheck = await fetch(
      `/api/check-couple?name1=${encodeURIComponent(userName.trim())}&name2=${encodeURIComponent(partnerName.trim())}`
    )
    const coupleResult = await coupleCheck.json()
    if (coupleResult.exists) {
      setSubmitError("Nama pasangan sudah terdaftar. Hubungi konsultan jika ini pasangan Anda.")
      setSubmitting(false)
      return
    }

    try {
      const first = userName.trim().split(" ")[0].toLowerCase()
      const second = partnerName.trim().split(" ")[0].toLowerCase()
      const slug = `${first}-${second}`

      const rawDate = searchParams.get("date")
      const endOfYear = `${new Date().getFullYear()}-12-31`
      const weddingDate = rawDate && rawDate !== "tentative" ? rawDate : endOfYear
      const guestCount = Number(searchParams.get("guest") || "300")

      const res = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: userName.trim(),
          groom_name: partnerName.trim(),
          estimated_wedding_date: weddingDate,
          estimated_guest_count: guestCount,
          slug,
          whatsapp_number: phone,
          package_type: selectedPackage,
          wa_blast_tier: waBlastTier,
          express_service: expressService,
          undangan_fisik: undanganFisik,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const p = new URLSearchParams({
          user: userName.trim(),
          partner: partnerName.trim(),
          date: rawDate || "tentative",
          guest: String(guestCount),
        })
        router.push(`/dashboard/${data.wedding_profile_id}?${p}`)
      } else {
        const err = await res.json()
        setSubmitError(err.error || "Terjadi kesalahan. Silakan coba lagi.")
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSave = async () => {
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch(`/api/customize/${editProfileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_type: selectedPackage,
          wa_blast_tier: waBlastTier,
          express_service: expressService,
          undangan_fisik: undanganFisik,
        }),
      })
      if (res.ok) {
        router.push(`/dashboard/${editProfileId}`)
      } else {
        const err = await res.json()
        setSubmitError(err.error || "Gagal menyimpan.")
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface selection:bg-secondary/20 overflow-x-hidden">
      <header className="fixed top-0 w-full z-[100] bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 h-20">
        <div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop h-full flex justify-between items-center">
          <button
            onClick={() => {
              if (isEdit) {
                router.push(`/dashboard/${editProfileId}`)
              } else {
                const p = new URLSearchParams({
                  step: "3",
                  user: userName,
                  partner: partnerName,
                  date: searchParams.get("date") || "tentative",
                  guest: searchParams.get("guest") || "300",
                })
                router.push(`/register?${p}`)
              }
            }}
            className="flex items-center gap-2 group text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-label-md text-label-md uppercase tracking-widest hidden md:inline">Kembali</span>
          </button>
          <div className="font-headline-md text-headline-md tracking-tighter text-primary font-bold">AKSARAA</div>
          <ProfileMenu />
        </div>
      </header>

      <main className="pt-32 pb-40 px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto">
        <section className="mb-12 text-center max-w-3xl mx-auto">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-[0.2em] mb-4 block">Pilih Paket Undangan Anda</span>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-6">Pilih Paket</h1>
          <p className="font-body-lg text-body-lg max-md:text-[14px] text-on-surface-variant">Temukan pengalaman yang paling tepat untuk mengabadikan perayaan Anda. Setiap pilihan dikurasi secara mendalam demi hasil yang tanpa cela.</p>
        </section>

        {/* Segmented control */}
        <div className="flex justify-center mb-14">
          <div className="inline-flex rounded-full border border-outline-variant/50 bg-white p-1.5 shadow-sm">
            {(["undangan", "dgbook"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-6 md:px-10 py-3 rounded-full font-label-md text-label-md uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-primary text-on-primary shadow"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab === "undangan" ? "Undangan Digital" : "Buku Tamu Digital"}
              </button>
            ))}
          </div>
        </div>

        {/* Package cards */}
        <section className={`grid grid-cols-1 gap-8 items-stretch mb-10 ${activeTab === "undangan" ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
          {activeCards.map((pkg) => {
            const isActive = selectedPackage === pkg.code
            const style = CARD_STYLES[pkg.style]
            const oldPrice = PACKAGE_OLD_PRICES[pkg.code]
            const price = PACKAGE_PRICES[pkg.code]

            return (
              <div
                key={pkg.code}
                onClick={() => {
                  setSelectedPackage(pkg.code)
                  setWaBlastTier(0)
                }}
                className={`relative flex flex-col p-8 bg-white border-2 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden ${
                  isActive ? scaleClasses(pkg.style) : `border-outline-variant/40 ${style.hoverBorder}`
                }`}
              >
                {pkg.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full font-label-md text-[9px] uppercase tracking-widest border ${style.badgeBg}`}>
                    {pkg.badge}
                  </div>
                )}
                <div className="mb-4">
                  <h3 className={`font-headline-md text-headline-md mb-1 ${isActive ? style.accent : ""}`}>{pkg.name}</h3>
                  <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">{pkg.tagline}</p>
                </div>
                <div className="mb-6 flex items-baseline gap-2">
                  {oldPrice != null && (
                    <span className="text-sm text-on-surface-variant/50 line-through">{formatRp(oldPrice)}</span>
                  )}
                  <span className={`font-headline-lg text-headline-lg font-bold ${style.price}`}>{formatRp(price)}</span>
                </div>
                <div className="h-px bg-outline-variant/30 mb-6" />
                <ul className="space-y-3 mb-6 flex-grow">
                  {pkg.features.map((f) => (
                    <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? "" : "text-on-surface-variant/45"}`}>
                      <span className={`material-symbols-outlined text-[16px] shrink-0 ${f.included ? (f.accent ? style.accent : "text-on-surface-variant") : "text-outline-variant"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {f.included ? "check" : "close"}
                      </span>
                      <span className={f.accent ? `font-semibold ${style.accent}` : ""}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <details className="group mb-6">
                  <summary className="cursor-pointer list-none flex items-center justify-between font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                    Lihat Fitur Dasar
                    <span className="material-symbols-outlined text-[16px] group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <ul className="mt-3 space-y-2 text-[13px] text-on-surface-variant">
                    {baseFeatures(activeTab).map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[14px] ${style.price}`} style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </details>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPackage(pkg.code)
                    setWaBlastTier(0)
                  }}
                  className={`w-full py-4 rounded-xl font-label-md uppercase tracking-widest transition-all ${
                    isActive
                      ? `${style.badgeBg} border ${style.border} bg-transparent`
                      : `bg-primary text-on-primary hover:bg-secondary`
                  }`}
                >
                  {isActive ? "Terpilih" : "Pilih Paket Ini"}
                </button>
              </div>
            )
          })}
        </section>

        <div className="text-center mb-14">
          <button onClick={() => setMatrixOpen(true)} className="inline-flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-secondary border-b border-secondary/40 pb-1 hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            Lihat Detail Komparasi Fitur
          </button>
        </div>

        {showWaTier && (
          <section className="mb-6">
            <div className={`border p-6 md:p-8 bg-white transition-colors ${waBlastTier > 0 ? "border-secondary" : "border-outline-variant/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-headline-md text-xl md:text-2xl mb-1">Tambah Kapasitas Reminder Tamu VIP</h4>
                  <p className="font-body-md text-[13px] text-on-surface-variant">Reminder otomatis ke 100 Tamu VIP sudah termasuk. Tambah kapasitas undangan sesuai kebutuhan (bertambah di atas 100 tamu).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={waBlastTier > 0}
                    onChange={() => setWaBlastTier(waBlastTier > 0 ? 0 : 100)}
                  />
                  <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                </label>
              </div>
              {waBlastTier > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {WA_TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setWaBlastTier(tier)}
                      className={`flex-1 min-w-[100px] p-4 border text-center transition-all ${
                        waBlastTier === tier
                          ? "border-secondary bg-secondary-fixed/30"
                          : "border-outline-variant hover:border-secondary"
                      }`}
                    >
                      <span className="font-headline-md text-lg block">+{tier}</span>
                      <span className="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">Tamu</span>
                      <span className="font-body-md text-[13px] text-on-surface-variant block mt-1">{formatRp(WA_TIER_PRICES[tier])}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-6">
          <div className={`border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white transition-colors ${expressService ? "border-secondary" : "border-outline-variant/30"}`}>
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined scale-110 md:scale-125">bolt</span>
              </div>
              <div>
                <h4 className="font-headline-md text-xl md:text-2xl mb-1">Yakin Esok Selesai (24 Hours)</h4>
                <p className="font-body-md text-[14px] md:text-body-md text-on-surface-variant">Percepat produksi dari standar 4-6 hari menjadi hanya 24 jam saja.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="font-label-md text-secondary block uppercase tracking-tighter text-[10px] md:text-label-md">Layanan Kilat</span>
                <span className="font-headline-md text-xl md:text-2xl">{formatRp(EXPRESS_FEE)}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={expressService}
                  onChange={() => setExpressService(!expressService)}
                />
                <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
              </label>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className={`border p-6 md:p-8 flex items-center justify-between bg-white transition-colors ${undanganFisik ? "border-secondary" : "border-outline-variant/30"}`}>
            <div>
              <h4 className="font-headline-md text-2xl mb-1">Undangan Fisik Premium (Cetak)</h4>
              <p className="font-body-md text-on-surface-variant">Layanan cetak eksklusif dengan bahan premium.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={undanganFisik}
                onChange={() => setUndanganFisik(!undanganFisik)}
              />
              <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
            </label>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant px-edge-margin-mobile py-6 z-[90]">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-label-md text-[10px] uppercase text-on-surface-variant tracking-widest">Estimasi Total</span>
            <div className="flex items-center gap-3">
              <span className="font-headline-md text-2xl">{PACKAGE_LABELS[selectedPackage] || "Paket"} Experience</span>
              <span className="text-on-surface-variant/30">|</span>
              <span className="font-headline-md text-2xl text-secondary">{formatRp(total)}</span>
            </div>
            {undanganFisik && (
              <span className="text-[10px] text-on-surface-variant/60 mt-1">* belum termasuk undangan fisik</span>
            )}
          </div>
          {isEdit ? (
            <button
              onClick={handleSave}
              disabled={submitting}
              className={`w-full md:w-auto px-12 py-4 bg-primary text-white font-label-md uppercase tracking-[0.2em] transition-all hover:bg-secondary ${submitting ? "opacity-50" : ""}`}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full md:w-auto px-12 py-4 bg-primary text-white font-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all"
            >
              Kunci Kustomisasi &amp; Kirim ke Konsultan
            </button>
          )}
        </div>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface p-10 max-w-lg w-full border border-outline relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full mx-auto mb-6">
                <span className="material-symbols-outlined scale-[2]">mail</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-4">Langkah Terakhir</h2>
              <p className="font-body-md text-on-surface-variant">Selesaikan pesanan Anda dengan menghubungkan WhatsApp. Konsultan kami akan membantu proses onboarding narasi Anda.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Nomor WhatsApp Aktif</label>
                <div className="flex border border-outline-variant/30 focus-within:border-primary transition-colors">
                  <span className="px-4 py-4 bg-surface-container-highest font-body-md border-r border-outline-variant/30">+62</span>
                  <input
                    className="w-full px-4 py-4 bg-transparent focus:outline-none text-xl font-headline-md placeholder:text-outline-variant"
                    placeholder="812 XXXX XXXX"
                    type="tel"
                    value={waNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "")
                      setWaNumber(digits)
                      setSubmitError("")
                    }}
                  />
                </div>
              </div>
              {submitError && (
                <p className="font-body-md text-sm text-red-400">{submitError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!waNumber || submitting}
                className={`w-full py-5 bg-secondary text-white font-label-md uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:bg-on-secondary-fixed ${
                  !waNumber || submitting ? "opacity-50" : ""
                }`}
              >
                <span>{submitting ? "Mengirim..." : "Mulai Diskusi Narasi"}</span>
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </button>
              <p className="text-[10px] text-center uppercase tracking-tighter text-on-surface-variant">Tanpa biaya pendaftaran. Pembayaran dilakukan setelah draft pertama disetujui.</p>
            </div>
          </div>
        </div>
      )}

      {matrixOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center p-4 py-10 overflow-y-auto">
          <div className="bg-surface w-full max-w-5xl border border-outline relative">
            <div className="sticky top-0 bg-surface border-b border-outline-variant px-6 py-5 flex items-center justify-between z-10">
              <h3 className="font-headline-md text-headline-md text-primary">Detail Komparasi Fitur</h3>
              <button onClick={() => setMatrixOpen(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-left min-w-[900px] text-sm">
                <thead className="sticky top-[61px] z-10 bg-surface">
                  <tr className="font-label-md text-label-md uppercase tracking-widest border-b border-outline-variant">
                    <th className="py-5 px-4 font-semibold text-left">FITUR</th>
                    {matrixCols.map((col) => (
                      <th key={col.code} className={`py-5 px-3 text-center font-semibold ${selectedPackage === col.code ? "text-secondary" : ""}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((section) => (
                    <React.Fragment key={section.code}>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-lowest/50">
                        <td className="py-3 px-4 font-label-md text-[10px] text-on-surface-variant tracking-widest uppercase" colSpan={8}>{section.label}</td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.id} className="border-b border-outline-variant/20">
                          <td className="py-3.5 px-4">{row.label}</td>
                          {matrixCols.map((col) => {
                            const cell = row.columns[col.code]
                            return (
                              <td key={col.code} className={`py-3.5 px-3 text-center ${cell?.class || ""} ${selectedPackage === col.code ? "font-semibold" : ""}`}>
                                {cell?.value || "—"}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function scaleClasses(style: "sage" | "secondary" | "gold"): string {
  if (style === "secondary") return "border-secondary scale-[1.02] shadow-xl shadow-secondary/10 z-10"
  if (style === "gold") return "border-[#d4af37] scale-[1.02] shadow-xl shadow-[#d4af37]/10 z-10"
  return "border-[#4a6b57] shadow-lg"
}

function baseFeatures(tab: "undangan" | "dgbook"): string[] {
  return tab === "undangan"
    ? ["PIC & Smart Dashboard", "Maps, Countdown & Add to Calendar", "Pilihan Lagu & Autoplay", "Subdomain Nama Pasangan", "Pilihan Bahasa", "Unlimited Send (Manual)"]
    : ["QR Digital System", "Check-in Tamu realtime", "Wedding Wish & RSVP", "Subdomain Nama Pasangan", "Amplop Digital & E-Gift", "Reminder otomatis ke 100 Tamu VIP"]
}

export default function CustomizePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  )
}