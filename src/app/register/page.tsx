"use client"

import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ASSETS } from "@/lib/assets"

type Step = 1 | 2 | 3

const PROGRESS: Record<Step, string> = { 1: "w-1/3", 2: "w-2/3", 3: "w-full" }

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stepParam = searchParams.get("step")
  const initialStep: Step = stepParam === "3" ? 3 : stepParam === "2" ? 2 : 1
  const initialUser = searchParams.get("user") || ""
  const initialPartner = searchParams.get("partner") || ""
  const initialDate = searchParams.get("date")
  const initialGuest = Number(searchParams.get("guest") || "300")

  const [step, setStep] = useState<Step>(initialStep)
  const [userName, setUserName] = useState(initialUser)
  const [partnerName, setPartnerName] = useState(initialPartner)
  const [weddingDate, setWeddingDate] = useState(
    initialDate && initialDate !== "tentative" ? initialDate : ""
  )
  const [isTentative, setIsTentative] = useState(initialDate === "tentative")
  const [guestCount, setGuestCount] = useState(initialGuest)
  const dateCardRef = useRef<HTMLDivElement>(null)
  const paxRef = useRef<HTMLSpanElement>(null)

  const step1Valid = userName.trim().length > 0 && partnerName.trim().length > 0
  const step2Valid = weddingDate.length > 0 || isTentative

  const handleNextStep2 = () => {
    if (!step2Valid) {
      dateCardRef.current?.classList.add("animate-shake")
      setTimeout(() => dateCardRef.current?.classList.remove("animate-shake"), 500)
      return
    }
    setStep(3)
  }

  const handleSlider = (val: number) => {
    setGuestCount(val)
    if (paxRef.current) {
      paxRef.current.style.transform = "scale(1.05)"
      setTimeout(() => {
        if (paxRef.current) paxRef.current.style.transform = "scale(1)"
      }, 100)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-on-surface antialiased flex flex-col overflow-x-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-outline-variant/30 z-[100]">
        <div
          className={`h-full bg-secondary transition-all duration-1000 ease-out ${PROGRESS[step]}`}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-16 flex justify-center items-center px-edge-margin-mobile bg-surface/80 backdrop-blur-md">
        <span className="font-headline-md text-headline-md tracking-tighter text-primary">Aksaraa</span>
      </header>

      {/* Atmospheric Circle */}
      <div className="fixed -bottom-12 -left-12 w-64 h-64 opacity-10 pointer-events-none">
        <div className="w-full h-full rounded-full border border-secondary blur-2xl" />
      </div>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center px-edge-margin-mobile pt-24 pb-40 text-center">
        {step === 1 && (
          <div className="animate-fade-in max-w-[340px]">
            <h1 className="font-headline-md text-headline-md mb-4 text-on-surface leading-tight">
              Selamat datang di Aksaraa. Mari mulai cerita Anda.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-16 opacity-80 italic">
              Siapa nama Anda dan pasangan?
            </p>
            <div className="space-y-12 w-full">
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Anda"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
              <div className="relative group">
                <input
                  autoComplete="off"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full bg-transparent border-none border-b border-outline-variant py-4 px-0 font-display-lg-mobile text-headline-md focus:ring-0 focus:border-primary placeholder:text-outline-variant transition-all duration-300 outline-none"
                  placeholder="Nama Pasangan"
                  type="text"
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-full bg-outline-variant/30 group-focus-within:bg-primary transition-all duration-500" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-md space-y-12 animate-fade-in">
            <div className="text-center space-y-4">
              <h1 className="font-headline-md text-[32px] leading-tight text-primary">
                Kapan pernikahan akan digelar?
              </h1>
              <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
                Pilih estimasi tanggal agar kami bisa menyusun linimasa perhitungan mundur.
              </p>
            </div>

            <div
              ref={dateCardRef}
              className="bg-[#FAF5EB] p-8 rounded-none border border-outline-variant/20 shadow-sm transition-all duration-500 hover:border-outline-variant"
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

        {step === 3 && (
          <>
            <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="font-headline-md text-[32px] leading-tight text-primary mb-4">
                Perkiraan jumlah undangan?
              </h2>
              <p className="font-body-md text-on-surface-variant max-w-[320px] mx-auto">
                Ini membantu menghitung kuota server RSVP, Undangan, QR Code tamu, dan alokasi meja VIP.
              </p>
            </div>

            <div
              className="w-full max-w-md bg-[#FAF5EB] p-8 border border-outline-variant/30 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="text-center mb-12">
                <div className="font-label-md text-label-md text-secondary uppercase tracking-[0.2em] mb-4">
                  ESTIMASI KAPASITAS
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    ref={paxRef}
                    className="font-headline-xl text-headline-xl text-primary"
                    style={{ transition: "transform 0.1s ease-out" }}
                  >
                    {guestCount}
                  </span>
                  <span className="font-headline-md text-headline-md text-primary italic">Tamu</span>
                </div>
                <div className="font-body-md text-on-surface-variant mt-2">(Pax)</div>
              </div>

              <div className="relative w-full pb-8 px-2">
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="10"
                  value={guestCount}
                  onChange={(e) => handleSlider(Number(e.target.value))}
                  className="range-slider mb-8 w-full"
                />
                <div className="flex justify-between w-full font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <div className="flex flex-col items-start gap-1">
                    <span className="w-px h-2 bg-outline-variant mx-auto" />
                    <span>50 Pax</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-px h-2 bg-outline-variant" />
                    <span>Intimate</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-px h-2 bg-outline-variant" />
                    <span>Ballroom</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="w-px h-2 bg-outline-variant mx-auto" />
                    <span>1500+ Pax</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 w-full max-w-[200px] aspect-[4/5] opacity-80 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div
                className="w-full h-full grayscale"
                style={{
                    backgroundImage:
                      `url('${ASSETS.register.bg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      {step === 1 && (
        <footer className="sticky bottom-0 left-0 w-full px-edge-margin-mobile pb-10 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => step1Valid && setStep(2)}
              className={`w-full bg-primary text-on-primary flex items-center justify-center gap-3 py-5 rounded-none font-label-md text-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 active:scale-95 group ${
                step1Valid ? "opacity-100" : "opacity-50"
              }`}
            >
              Lanjutkan
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <p className="mt-6 text-[10px] text-on-surface-variant/40 text-center tracking-widest font-label-md">
              LANGKAH 1 DARI 3
            </p>
          </div>
        </footer>
      )}

      {step === 2 && (
        <nav className="fixed bottom-0 w-full bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-edge-margin-mobile py-6 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between gap-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-outline-variant text-primary font-label-md uppercase tracking-[0.1em] hover:bg-surface-variant transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleNextStep2}
              className="flex-[1.5] py-4 bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all duration-300 active:scale-95"
            >
              Lanjutkan
            </button>
          </div>
        </nav>
      )}

      {step === 3 && (
        <footer className="fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant/20 p-edge-margin-mobile">
          <div className="max-w-md mx-auto flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 border border-primary font-label-md text-label-md uppercase tracking-widest text-primary hover:bg-surface-container transition-colors duration-300"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  user: userName,
                  partner: partnerName,
                  date: weddingDate || "tentative",
                  guest: String(guestCount),
                })
                router.push(`/customize?${params}`)
              }}
              className="flex-[1.5] py-4 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-all duration-300 active:scale-[0.98]"
            >
              Selesaikan
            </button>
          </div>
          <p className="mt-3 text-[10px] text-on-surface-variant/40 text-center tracking-widest font-label-md">
            LANGKAH 3 DARI 3
          </p>
        </footer>
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
