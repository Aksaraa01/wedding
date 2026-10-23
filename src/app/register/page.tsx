"use client"

import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Step = 1 | 2

const PROGRESS: Record<Step, string> = { 1: "w-1/2", 2: "w-full" }

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stepParam = searchParams.get("step")
  const initialStep: Step = stepParam === "2" || stepParam === "3" ? 2 : 1
  const initialUser = searchParams.get("user") || ""
  const initialPartner = searchParams.get("partner") || ""
  const initialDate = searchParams.get("date")
  const initialGuest = searchParams.get("guest") || "300"

  const packagePassthrough = useRef({
    package: searchParams.get("package") || "",
    tab: searchParams.get("tab") || "",
    wa_tier: searchParams.get("wa_tier") || "",
    express: searchParams.get("express") || "",
    galeri_photos: searchParams.get("galeri_photos") || "",
    galeri_guests: searchParams.get("galeri_guests") || "",
  })

  const [step, setStep] = useState<Step>(initialStep)
  const [userName, setUserName] = useState(initialUser)
  const [partnerName, setPartnerName] = useState(initialPartner)
  const [weddingDate, setWeddingDate] = useState(
    initialDate && initialDate !== "tentative" ? initialDate : ""
  )
  const [isTentative, setIsTentative] = useState(initialDate === "tentative")
  const dateCardRef = useRef<HTMLDivElement>(null)

  const [nameChecking, setNameChecking] = useState(false)
  const [nameError, setNameError] = useState("")

  const step1Valid = userName.trim().length > 0 && partnerName.trim().length > 0
  const step2Valid = weddingDate.length > 0 || isTentative

  const handleNextStep1 = async () => {
    if (!step1Valid || nameChecking) return
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
      // On network failure don't block registration; the customize check +
      // server-side guard still protect against duplicates.
      setStep(2)
    } finally {
      setNameChecking(false)
    }
  }

  const handleNextStep2 = () => {
    if (!step2Valid) {
      dateCardRef.current?.classList.add("animate-shake")
      setTimeout(() => dateCardRef.current?.classList.remove("animate-shake"), 500)
      return
    }
    const params = new URLSearchParams({
      user: userName,
      partner: partnerName,
      date: weddingDate || "tentative",
      guest: initialGuest,
    })
    const pt = packagePassthrough.current
    if (pt.package) params.set("package", pt.package)
    if (pt.tab) params.set("tab", pt.tab)
    if (pt.wa_tier) params.set("wa_tier", pt.wa_tier)
    if (pt.express) params.set("express", pt.express)
    if (pt.galeri_photos) params.set("galeri_photos", pt.galeri_photos)
    if (pt.galeri_guests) params.set("galeri_guests", pt.galeri_guests)
    router.push(`/customize?${params}`)
  }

  return (
    <div className="relative h-[100dvh] md:min-h-screen bg-background text-on-surface antialiased flex flex-col overflow-hidden md:overflow-x-hidden">
      {/* Background image as in login */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-surface/60 z-10" />
        <img alt="Aksaraa Editorial Background" src="/images/login.png" className="w-full h-full object-cover object-center grayscale-[10%]" />
      </div>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-outline-variant/30 z-[100]">
        <div
          className={`h-full bg-secondary transition-all duration-1000 ease-out ${PROGRESS[step]}`}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-12 md:h-16 flex justify-center items-center px-4 md:px-edge-margin-mobile bg-surface/80 backdrop-blur-md">
        <span className="font-headline-md text-[20px] md:text-headline-md tracking-tighter text-primary">Aksaraa</span>
      </header>

      {/* Atmospheric Circle */}
      <div className="fixed -bottom-12 -left-12 w-64 h-64 opacity-10 pointer-events-none">
        <div className="w-full h-full rounded-full border border-secondary blur-2xl" />
      </div>

      {/* Main */}
      <main className="relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center px-4 md:px-edge-margin-mobile pt-16 md:pt-24 pb-4 md:pb-40 text-center">
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
                  onChange={(e) => { setUserName(e.target.value); setNameError("") }}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Mempelai Pertama"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={partnerName}
                  onChange={(e) => { setPartnerName(e.target.value); setNameError("") }}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Mempelai Kedua"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
            </div>
            {nameError && (
              <p className={`font-body-md text-sm text-error mt-6 animate-fade-in ${nameChecking ? "" : ""}`}>{nameError}</p>
            )}
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
              ref={dateCardRef}
              className="bg-[#FAF5EB] p-4 md:p-8 rounded-none border border-outline-variant/20 shadow-sm transition-all duration-500 hover:border-outline-variant"
              style={{ opacity: isTentative ? 0.4 : 1, pointerEvents: isTentative ? "none" : "auto" }}
            >
              <label
                className="block font-label-md text-label-md uppercase tracking-[0.2em] mb-4 text-on-surface-variant"
                htmlFor="wedding-date"
              >
                Pilih Tanggal
              </label>
              <div className="relative border-b border-primary py-2">
                <input
                  className="w-full bg-transparent border-none focus:ring-0 p-0 font-headline-md text-headline-md text-primary appearance-none placeholder-outline-variant/50 outline-none"
                  id="wedding-date"
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
                id="tentative"
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
              onClick={() => {
                const pt = packagePassthrough.current
                if (pt.package) {
                  const p = new URLSearchParams()
                  p.set("package", pt.package)
                  if (pt.tab) p.set("tab", pt.tab)
                  if (pt.wa_tier) p.set("wa_tier", pt.wa_tier)
                  if (pt.express) p.set("express", pt.express)
                  if (pt.galeri_photos) p.set("galeri_photos", pt.galeri_photos)
                  if (pt.galeri_guests) p.set("galeri_guests", pt.galeri_guests)
                  router.push(`/customize?${p}`)
                } else {
                  router.push("/hero")
                }
              }}
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
              onClick={handleNextStep2}
              className="flex-[1.5] py-3 md:py-4 bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 active:scale-95"
            >
              Lanjutkan
            </button>
          </div>
        </nav>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  )
}
