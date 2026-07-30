"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  PACKAGE_PRICES,
  WA_TIER_PRICES,
  EXPRESS_FEE,
  calcTotal,
  normalizePhone,
} from "@/lib/packages"
import ProfileMenu from "@/components/ProfileMenu"

const WA_TIERS = [100, 200, 300] as const

type MatrixRow = {
  label: string
  essential: { value: string; class: string }
  signature: { value: string; class: string }
  prestige: { value: string; class: string }
}

type MatrixSection = {
  code: string
  label: string
  rows: MatrixRow[]
}

const PACKAGES = [
  {
    code: "essential",
    name: "Essential",
    badge: "Best for Intimate Weddings (< 100 Guests)",
    desc: "Sederhana, anggun, dan esensial untuk momen hangat keluarga dekat",
    tags: ["15 Foto Galeri", "2 Bulan Aktif", "2 Round Revisi"],
    features: [
      { icon: "check", text: "Web Invitation", accent: false, muted: false },
      { icon: "check", text: "Amplop Digital", accent: false, muted: false },
      { icon: "check", text: "RSVP", accent: false, muted: false },
      { icon: "check", text: "Unlimited Manual Send", accent: false, muted: false },
    ],
    btnLabel: "Pilih Essential",
    btnClass: "border border-primary hover:bg-primary hover:text-surface",
  },
  {
    code: "signature",
    name: "Signature",
    badge: "Favorit 85% Pengantin Aksaraa",
    badgeClass: "bg-secondary text-white px-3 py-1",
    desc: "Keseimbangan sempurna antara estetika, kenyamanan tamu, dan fitur lengkap",
    tags: ["20 Foto Galeri", "6 Bulan Aktif", "3 Round Revisi"],
    features: [
      { icon: "add", text: "Alamat Pengiriman Kado Fisik", accent: true, muted: false },
      { icon: "add", text: "Fitur Turut Mengundang", accent: true, muted: false },
      { icon: "check", text: "Semua Fitur Essential", accent: false, muted: true },
    ],
    btnLabel: "Pilih Signature Experience",
    btnClass: "bg-secondary text-white border-secondary hover:bg-secondary-container hover:text-on-secondary-container",
    isHero: true,
  },
  {
    code: "prestige",
    name: "Prestige",
    badge: "Ultimate All-Inclusive VIP Experience",
    badgeClass: "bg-[#d4af37] text-[#1c1c16] px-3 py-1",
    desc: "Pengalaman narasi digital paling mewah dengan fitur VIP eksklusif",
    tags: ["Unlimited Foto", "1 Tahun Aktif", "5 Round Revisi"],
    features: [
      { icon: "auto_awesome", text: "Love Story & Cinematic Video", accent: true, muted: false },
      { icon: "notifications_active", text: "Reminder Otomatis WhatsApp", accent: true, muted: false },
      { icon: "brush", text: "Custom Logo Wedding", accent: true, muted: false },
      { icon: "photo_library", text: "Galeri Kenangan Tamu", accent: true, muted: false },
      { icon: "check", text: "Semua Fitur Signature", accent: false, muted: true },
    ],
    btnLabel: "Pilih Prestige VIP",
    btnClass: "text-on-surface bg-[#d4af37] border-[#d4af37] shadow-[rgba(212,175,55,0.3)_0px_4px_14px_0px] hover:opacity-90",
    gold: true,
  },
]



function Inner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("user") || ""
  const partnerName = searchParams.get("partner") || ""

  const isEdit = searchParams.get("edit") === "true"
  const editProfileId = searchParams.get("profile_id") || ""

  const [selectedPackage, setSelectedPackage] = useState("signature")
  const [waBlastTier, setWaBlastTier] = useState<number>(0)
  const [expressService, setExpressService] = useState(false)
  const [undanganFisik, setUndanganFisik] = useState(false)
  const [matrix, setMatrix] = useState<MatrixSection[]>([])

  const [loaded, setLoaded] = useState(!isEdit)
  const [modalOpen, setModalOpen] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    fetch("/api/packages/matrix")
      .then((r) => r.json())
      .then((data) => {
        setMatrix(data.matrix || [])
      })
  }, [])

  useEffect(() => {
    if (!isEdit || !editProfileId) return
    fetch(`/api/dashboard/${editProfileId}`)
      .then((r) => r.json())
      .then((data) => {
        setSelectedPackage(data.profile.package_type || "signature")
        setWaBlastTier(data.profile.wa_blast_tier || 0)
        setExpressService(!!data.profile.express_service)
        setUndanganFisik(!!data.profile.undangan_fisik)
        setLoaded(true)
      })
  }, [])

  const PKG_COLORS: Record<string, string> = {
    essential: "text-primary",
    signature: "text-secondary",
    prestige: "text-[#d4af37]",
  }

  const total = calcTotal(selectedPackage, waBlastTier, expressService)

  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID")

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
      <style>{`
        .paper-texture { background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png"); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

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
        <section className="mb-16 text-center max-w-3xl mx-auto">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-[0.2em] mb-4 block">Paket Terbaik untuk Anda</span>
          <h1 className="font-headline-xl text-headline-xl text-primary mb-6">Pilih Paket&nbsp;</h1>
          <p className="font-body-lg text-body-lg max-md:text-[14px] text-on-surface-variant">Temukan pengalaman yang paling tepat untuk mengabadikan perayaan Anda. Setiap pilihan dikurasi secara mendalam demi hasil yang tanpa cela.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          {PACKAGES.map((pkg) => {
            const isActive = selectedPackage === pkg.code
            const isSignature = pkg.code === "signature"
            const isPrestige = pkg.code === "prestige"
            const pkgColor = PKG_COLORS[pkg.code] || ""

            let cardClasses = "flex flex-col p-10 bg-surface transition-all duration-500 cursor-pointer relative overflow-hidden"
            if (isActive) {
              cardClasses += isPrestige
                ? " border-2 border-[#d4af37] scale-105 z-10 shadow-2xl"
                : " border-2 border-secondary scale-105 z-10 shadow-2xl shadow-secondary/10"
            } else {
              cardClasses += " border border-outline-variant hover:scale-[1.02]"
            }

            const badgeBg = pkg.badgeClass || "border border-on-surface-variant px-3 py-1"
            const badgeText = pkg.badgeClass ? "" : "text-on-surface-variant"

            return (
              <div
                key={pkg.code}
                className={cardClasses}
                onClick={() => {
                  setSelectedPackage(pkg.code)
                  if (pkg.code !== "prestige") setWaBlastTier(0)
                }}
              >
                {isActive && isSignature && (
                  <div className="absolute top-0 right-0 bg-secondary text-white px-6 py-2 font-label-md text-[10px] tracking-widest uppercase translate-y-4 translate-x-12 rotate-45">Favorit</div>
                )}
                <div className="mb-8 h-12">
                  <span className={`inline-block ${badgeBg} font-label-md text-[10px] tracking-widest uppercase ${badgeText}`}>
                    {pkg.badge}
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className={`font-headline-md text-headline-md mb-2 ${isActive || pkg.code === "signature" || pkg.code === "prestige" ? pkgColor : ""}`}>{pkg.name}</h3>
                  <p className="font-body-md italic text-on-surface-variant">{pkg.desc}</p>
                </div>
                <div className="mb-8">
                  <div className={`flex items-baseline gap-1 ${isActive || pkg.code === "signature" || pkg.code === "prestige" ? pkgColor : ""}`}>
                    <span className="text-label-md font-bold self-start mt-1">Rp</span>
                    <span className="font-headline-lg text-headline-lg">{PACKAGE_PRICES[pkg.code].toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-10">
                  {pkg.tags.map((tag) => (
                    <span key={tag} className={`font-label-md text-[10px] border px-2 py-1 uppercase ${isActive ? `${pkgColor} border-current font-bold` : "border-outline-variant"}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <ul className="space-y-4 mb-12 flex-grow">
                  {pkg.features.map((f) => (
                    <li key={f.text} className={`flex items-center gap-3 ${f.accent ? "font-semibold" : ""} ${f.muted ? "text-on-surface-variant" : ""}`}>
                      <span className={`material-symbols-outlined text-sm ${f.accent ? pkgColor : ""} ${f.muted ? "text-on-surface-variant" : ""}`}>
                        {f.icon === "add" ? "add" : f.icon === "check" ? "check" : f.icon}
                      </span>
                      <span className={`${f.accent ? pkgColor : ""}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-4 font-label-md uppercase tracking-widest transition-all ${pkg.btnClass}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPackage(pkg.code)
                    if (pkg.code !== "prestige") setWaBlastTier(0)
                  }}
                >
                  {isActive ? "Terpilih" : pkg.btnLabel}
                </button>
              </div>
            )
          })}
        </section>

        {selectedPackage === "prestige" && (
          <section className="mb-6">
            <div className="border border-outline-variant/30 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-headline-md text-xl md:text-2xl mb-1">Tambah Reminder Tamu VIP</h4>
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
                      <span className="font-headline-md text-lg block">{tier}</span>
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
          <div className="border border-secondary bg-secondary-fixed/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
          <div className="border border-outline-variant/30 p-6 md:p-8 flex items-center justify-between">
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

        <section className="mb-32">
          <h2 className="font-headline-lg text-headline-lg mb-12 text-center">Detail Komparasi Fitur</h2>
          <div className="overflow-x-auto hide-scrollbar border-t border-outline">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="font-label-md text-label-md uppercase tracking-widest border-b border-outline-variant">
                  <th className="py-6 font-semibold w-1/4">Fitur Utama</th>
                  <th className={`py-6 text-center w-1/4 ${selectedPackage === "essential" ? "text-primary" : ""}`}>Essential</th>
                  <th className={`py-6 text-center w-1/4 ${selectedPackage === "signature" ? "text-secondary" : ""}`}>Signature</th>
                  <th className={`py-6 text-center w-1/4 ${selectedPackage === "prestige" ? "text-[#d4af37]" : ""}`}>Prestige</th>
                </tr>
              </thead>
              <tbody className="font-body-md">
                {matrix.map((section) => (
                  <React.Fragment key={section.code}>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-lowest/50">
                      <td className="py-4 px-2 font-label-md text-[10px] text-on-surface-variant tracking-widest uppercase" colSpan={4}>{section.label}</td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-b border-outline-variant/30">
                        <td className="py-4">{row.label}</td>
                        <td className={`py-4 text-center ${row.essential.class || ""}`}>{row.essential.value}</td>
                        <td className={`py-4 text-center ${row.signature.class || ""}`}>{row.signature.value}</td>
                        <td className={`py-4 text-center ${row.prestige.class || ""}`}>{row.prestige.value}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant px-edge-margin-mobile py-6 z-[90]">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-label-md text-[10px] uppercase text-on-surface-variant tracking-widest">Estimasi Total</span>
            <div className="flex items-center gap-3">
              <span className="font-headline-md text-2xl">{PACKAGES.find((p) => p.code === selectedPackage)?.name} Experience</span>
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
