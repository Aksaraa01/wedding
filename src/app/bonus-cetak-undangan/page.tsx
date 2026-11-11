"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CoupleSlugHint } from "@/components/CoupleSlugHint"
import { coupleSlugError } from "@/lib/slug"
import { normalizePhone } from "@/lib/packages"

type Step = 1 | 2

const PROGRESS: Record<Step, string> = { 1: "w-1/2", 2: "w-full" }

// Fixed campaign link: everyone who registers through /bonus-cetak-undangan is
// registered on the ops-granted BONUS package. The package is decided by this
// page, never by a query parameter.
const BONUS_PACKAGE = "cetak_undangan_bonus"
const DEFAULT_GUEST_COUNT = 300

export default function BonusCetakUndanganPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [userName, setUserName] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [weddingDate, setWeddingDate] = useState("")
  const [isTentative, setIsTentative] = useState(false)

  const [nameChecking, setNameChecking] = useState(false)
  const [nameError, setNameError] = useState("")

  const [accountOpen, setAccountOpen] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const step1Valid = userName.trim().length > 0 && partnerName.trim().length > 0
  const step2Valid = weddingDate.length > 0 || isTentative

  const handleNextStep1 = async () => {
    if (!step1Valid || nameChecking) return
    const slugIssue = coupleSlugError(userName, partnerName)
    if (slugIssue) {
      setNameError(slugIssue)
      return
    }
    setNameChecking(true)
    setNameError("")
    try {
      const res = await fetch(
        `/api/check-couple?name1=${encodeURIComponent(userName.trim())}&name2=${encodeURIComponent(partnerName.trim())}`
      )
      const data = await res.json()
      if (data?.exists) {
        setNameError("Nama pasangan sudah terdaftar. Hubungi konsultan jika ini pasangan Anda.")
        return
      }
      setStep(2)
    } catch {
      // Don't block registration on a network hiccup — the server re-checks.
      setStep(2)
    } finally {
      setNameChecking(false)
    }
  }

  const openAccount = () => {
    if (!step2Valid) return
    setWaNumber("")
    setPin("")
    setSubmitError("")
    setAccountOpen(true)
  }

  const closeAccount = () => {
    if (submitting) return
    setAccountOpen(false)
    setSubmitError("")
  }

  const handleSubmit = async () => {
    if (submitting) return
    const slugIssue = coupleSlugError(userName, partnerName)
    if (slugIssue) {
      setSubmitError(slugIssue)
      return
    }
    const cleaned = waNumber.replace(/\D/g, "").replace(/^0+/, "")
    const cleanPin = (pin || "").replace(/\D/g, "")
    if (!cleaned || cleanPin.length !== 6) return

    setSubmitting(true)
    setSubmitError("")

    const phone = normalizePhone(cleaned)

    try {
      const phoneCheck = await fetch(`/api/check-phone?q=${encodeURIComponent(phone)}`)
      const phoneResult = await phoneCheck.json().catch(() => ({}))
      if (phoneResult.exists) {
        setSubmitError("Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.")
        return
      }

      const coupleCheck = await fetch(
        `/api/check-couple?name1=${encodeURIComponent(userName.trim())}&name2=${encodeURIComponent(partnerName.trim())}`
      )
      const coupleResult = await coupleCheck.json().catch(() => ({}))
      if (coupleResult.exists) {
        setSubmitError("Nama pasangan sudah terdaftar. Hubungi konsultan jika ini pasangan Anda.")
        return
      }

      const endOfYear = `${new Date().getFullYear()}-12-31`
      const finalDate = !isTentative && weddingDate ? weddingDate : endOfYear

      const res = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: partnerName.trim(),
          groom_name: userName.trim(),
          estimated_wedding_date: finalDate,
          estimated_guest_count: DEFAULT_GUEST_COUNT,
          whatsapp_number: phone,
          pin: cleanPin,
          package_type: BONUS_PACKAGE,
          wa_blast_tier: 0,
          express_service: false,
          undangan_fisik: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const pid = data.wedding_profile_id || data.profile_id || ""
        router.push(pid ? `/dashboard/${pid}` : "/login")
        return
      }
      setSubmitError(data.error || "Terjadi kesalahan. Silakan coba lagi.")
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative h-[100dvh] md:min-h-screen bg-background text-on-surface antialiased flex flex-col overflow-hidden md:overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-surface/60 z-10" />
        <img alt="Aksaraa Editorial Background" src="/images/login.png" className="w-full h-full object-cover object-center grayscale-[10%]" />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-outline-variant/30 z-[100]">
        <div className={`h-full bg-secondary transition-all duration-1000 ease-out ${PROGRESS[step]}`} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-12 md:h-16 flex justify-center items-center px-4 md:px-edge-margin-mobile bg-surface/80 backdrop-blur-md">
        <span className="font-headline-md text-[20px] md:text-headline-md tracking-tighter text-primary">Aksaraa</span>
      </header>

      {/* Atmospheric Circle */}
      <div className="fixed -bottom-12 -left-12 w-64 h-64 opacity-10 pointer-events-none">
        <div className="w-full h-full rounded-full border border-secondary blur-2xl" />
      </div>

      <main className="relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center px-4 md:px-edge-margin-mobile pt-16 md:pt-24 pb-4 md:pb-40 text-center">
        <div className="mb-4 md:mb-6 inline-flex items-center gap-2 px-4 py-2 bg-surface/90 border border-secondary/40 shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-secondary">redeem</span>
          <span className="font-label-md text-[11px] uppercase tracking-[0.15em] text-on-surface-variant">
            Paket BONUS (Cetak Undangan)
          </span>
        </div>

        {step === 1 && (
          <div className="animate-fade-in w-[90%] max-w-[340px] mx-auto flex flex-col justify-center bg-surface p-6 md:p-10 shadow-2xl">
            <h1 className="font-headline-md text-[20px] md:text-headline-md mb-2 md:mb-4 text-on-surface leading-tight">
              Selamat datang di Aksaraa. Mari mulai cerita Anda.
            </h1>
            <p className="font-body-md text-sm md:text-body-md text-on-surface-variant mb-6 md:mb-10 opacity-80 italic">
              Siapa nama mempelai pertama dan kedua?
            </p>
            <div className="space-y-6 md:space-y-12 w-full">
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value)
                    setNameError("")
                  }}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-base md:placeholder:text-headline-md placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Mempelai Pertama"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={partnerName}
                  onChange={(e) => {
                    setPartnerName(e.target.value)
                    setNameError("")
                  }}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-base md:placeholder:text-headline-md placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Mempelai Kedua"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
            </div>
            <CoupleSlugHint name1={userName} name2={partnerName} className="mt-6" />
            {nameError && <p className="font-body-md text-sm text-error mt-6 animate-fade-in">{nameError}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="w-[90%] max-w-md mx-auto space-y-6 md:space-y-8 animate-fade-in flex flex-col justify-center bg-surface p-6 md:p-10 shadow-2xl">
            <div className="text-center space-y-2 md:space-y-4">
              <h1 className="font-headline-md text-[24px] md:text-[32px] leading-tight text-primary">
                Kapan pernikahan akan digelar?
              </h1>
              <p className="font-body-md text-sm md:text-body-md text-on-surface-variant max-w-[280px] mx-auto">
                Pilih estimasi tanggal agar kami bisa menyusun linimasa perhitungan mundur.
              </p>
            </div>

            <div
              className="bg-[#FAF5EB] p-4 md:p-8 rounded-none border border-outline-variant/20 shadow-sm transition-all duration-500 hover:border-outline-variant"
              style={{ opacity: isTentative ? 0.4 : 1, pointerEvents: isTentative ? "none" : "auto" }}
            >
              <label
                className="block font-label-md text-label-md uppercase tracking-[0.2em] mb-4 text-on-surface-variant"
                htmlFor="bonus-wedding-date"
              >
                Pilih Tanggal
              </label>
              <div className="relative border-b border-primary py-2">
                <input
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-headline-md text-headline-md text-primary appearance-none placeholder-outline-variant/50 outline-none"
                  id="bonus-wedding-date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  type="date"
                />
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                  calendar_today
                </span>
              </div>
            </div>

            <div
              className="group flex items-start gap-4 cursor-pointer p-4 -mx-4 transition-colors hover:bg-surface-container-low"
              onClick={() => setIsTentative(!isTentative)}
            >
              <input
                className="custom-checkbox mt-1"
                id="bonus-tentative"
                type="checkbox"
                checked={isTentative}
                onChange={() => setIsTentative(!isTentative)}
              />
              <div className="flex flex-col text-left">
                <span className="font-body-md text-primary font-medium">Tanggal belum pasti (Tentatif)</span>
                <span className="font-label-md text-on-surface-variant leading-relaxed">
                  Gunakan estimasi waktu sementara (misalnya akhir tahun ini).
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {step === 1 && (
        <nav className="fixed bottom-0 w-full bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-4 md:px-edge-margin-mobile py-3 md:py-6 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 md:gap-6">
            <button
              onClick={() => router.push("/hero")}
              className="flex-1 py-3 md:py-4 border border-outline-variant text-primary font-label-md uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleNextStep1}
              disabled={!step1Valid || nameChecking}
              className={`flex-[1.5] py-3 md:py-4 bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 active:scale-95 ${!step1Valid || nameChecking ? "opacity-50" : "opacity-100"}`}
            >
              {nameChecking ? "Memeriksa..." : "Lanjutkan"}
            </button>
          </div>
        </nav>
      )}

      {step === 2 && (
        <nav className="fixed bottom-0 w-full bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-4 md:px-edge-margin-mobile py-3 md:py-6 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 md:gap-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 md:py-4 border border-outline-variant text-primary font-label-md uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={openAccount}
              disabled={!step2Valid}
              className={`flex-[1.5] py-3 md:py-4 bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 active:scale-95 ${!step2Valid ? "opacity-50" : "opacity-100"}`}
            >
              Daftar
            </button>
          </div>
        </nav>
      )}

      {accountOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 md:p-10 max-w-lg w-full border border-outline-variant/40 shadow-2xl relative max-h-[92dvh] overflow-y-auto">
            <button
              onClick={closeAccount}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full mx-auto mb-5">
                <span className="material-symbols-outlined scale-150">mail</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-2">Buat Akun</h2>
              <p className="font-body-md text-sm text-on-surface-variant">
                Selesaikan pendaftaran Anda dengan nomor WhatsApp dan buat PIN untuk masuk ke dasbor.
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">
                  Nomor WhatsApp Aktif
                </label>
                <div className="flex border border-outline-variant/30 focus-within:border-primary rounded-xl overflow-hidden transition-colors">
                  <span className="px-4 py-3.5 bg-surface-container-highest font-body-md border-r border-outline-variant/30">+62</span>
                  <input
                    className="w-full px-4 py-3.5 bg-transparent focus:outline-none text-lg font-headline-md placeholder:text-outline-variant"
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
              <div>
                <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">
                  Buat PIN (6 digit)
                </label>
                <div className="flex items-center border border-outline-variant/30 focus-within:border-primary rounded-xl overflow-hidden transition-colors">
                  <input
                    className="w-full px-4 py-3.5 bg-transparent focus:outline-none text-lg font-headline-md tracking-[0.3em] placeholder:text-outline-variant"
                    placeholder="••••••"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setPin(digits)
                      setSubmitError("")
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="px-3 text-on-surface-variant hover:text-primary"
                    aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPin ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3.5 text-center">
                <p className="font-label-md text-[11px] text-on-surface-variant leading-relaxed">
                  Nomor WhatsApp &amp; PIN akan digunakan untuk login ke dasbor Anda.
                </p>
              </div>
              {submitError && <p className="font-body-md text-sm text-red-500">{submitError}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting || pin.length !== 6 || !waNumber}
                className={`w-full py-4 rounded-xl bg-secondary text-white font-label-md uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:bg-on-secondary-fixed ${
                  submitting || pin.length !== 6 || !waNumber ? "opacity-50" : ""
                }`}
              >
                <span>{submitting ? "Mendaftar..." : "Daftar"}</span>
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </button>
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
        .custom-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 1px solid #1c1c16;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .custom-checkbox:checked {
          background-color: #1c1c16;
        }
        .custom-checkbox:checked::after {
          content: "check";
          font-family: "Material Symbols Outlined";
          font-size: 14px;
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
  )
}
