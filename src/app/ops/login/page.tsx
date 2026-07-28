"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

export default function OpsLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = sessionStorage.getItem("ops_employee")
      if (session) {
        router.replace("/ops")
      }
    }
  }, [router])

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("")
      const newPin = [...pin]
      digits.forEach((d, i) => {
        if (i < 6) newPin[i] = d
      })
      setPin(newPin)
      const nextEmpty = newPin.findIndex((p) => !p)
      if (nextEmpty !== -1 && nextEmpty < 6) {
        pinRefs.current[nextEmpty]?.focus()
      } else {
        pinRefs.current[5]?.focus()
      }
      return
    }

    const digit = value.replace(/\D/g, "").slice(0, 1)
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)

    if (digit && index < 5) {
      pinRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")

      const pinStr = pin.join("")
      if (pinStr.length !== 6) {
        setError("PIN harus 6 digit")
        return
      }

      setLoading(true)
      try {
        const res = await fetch("/api/ops/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone, pin: pinStr }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Kredensial tidak valid")
          return
        }
        sessionStorage.setItem("ops_employee", JSON.stringify(data.employee))
        router.push("/ops")
      } catch {
        setError("Terjadi kesalahan. Silakan coba lagi.")
      } finally {
        setLoading(false)
      }
    },
    [phone, pin, router]
  )

  return (
    <>
      <PageTheme mode="light" />
      <style jsx>{`
        .input-line-focus:focus-within {
          border-bottom-width: 2px;
          border-color: #000000;
        }
        .stagger-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        @keyframes fadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="h-screen flex flex-col overflow-hidden bg-background text-on-surface antialiased font-body-md text-body-md">
        <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant/20 h-20 flex justify-between items-center px-edge-margin-mobile md:px-edge-margin-desktop">
          <div className="flex items-center gap-4">
            <h1 className="font-display-lg text-headline-md tracking-widest text-primary uppercase">Aksaraa</h1>
            <span className="text-xs font-label-md tracking-widest bg-primary text-white px-2 py-1">CORE OPS</span>
          </div>
        </header>

        <main className="flex-1 relative flex items-center justify-center pt-20">
          <div className="absolute inset-0 z-0 bg-surface" />

          <div className="relative z-20 w-full max-w-md px-edge-margin-mobile">
            <div
              className="bg-surface p-8 md:p-12 shadow-2xl space-y-12 stagger-in border border-outline-variant"
              style={{ animationDelay: "100ms" }}
            >
              <div className="text-center">
                <h1 className="font-headline-lg text-headline-lg mb-2">Login Petugas</h1>
                <p className="text-on-surface-variant/60 font-body-md text-sm">Aksara CORE OPS — Internal Board</p>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="group">
                  <label
                    className="font-label-md text-label-md uppercase text-on-surface-variant mb-2 block tracking-widest"
                    htmlFor="phone"
                  >
                    Nomor Handphone
                  </label>
                  <div className="relative border-b border-on-background/20 input-line-focus transition-all duration-300">
                    <input
                      className="w-full bg-transparent border-none px-0 py-3 focus:ring-0 font-body-lg text-body-lg placeholder:text-outline/40"
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812..."
                      type="tel"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="font-label-md text-label-md uppercase text-on-surface-variant mb-2 block tracking-widest">
                    PIN Karyawan
                  </label>
                  <div className="flex gap-3 justify-center">
                    {pin.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { pinRefs.current[i] = el }}
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handlePinChange(i, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-body-md border-b-2 border-outline-variant bg-transparent focus:border-primary focus:ring-0 outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-error font-body-md text-body-md -mt-4">{error}</p>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !phone || pin.join("").length !== 6}
                    className="w-full bg-primary text-on-primary py-5 font-label-md text-label-md uppercase tracking-[0.2em] border border-primary hover:bg-tertiary transition-all duration-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Memverifikasi..." : "Masuk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
