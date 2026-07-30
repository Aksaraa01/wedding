"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setLoading(true)
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, slug }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Gagal masuk")
          return
        }
        router.push(`/dashboard/${data.wedding_profile_id}`)
      } catch {
        setError("Terjadi kesalahan. Silakan coba lagi.")
      } finally {
        setLoading(false)
      }
    },
    [phone, slug, router]
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
          <div
            onClick={() => router.push("/hero")}
            className="flex items-center cursor-pointer active:scale-95 transition-all w-10"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </div>
          <div className="font-headline-md text-headline-md text-primary tracking-[0.2em] uppercase">
            Aksaraa
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 relative flex items-center justify-center pt-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-surface/60 z-10" />
            <img
              alt="Aksaraa Editorial Background"
              className="w-full h-full object-cover object-center grayscale-[10%]"
              src="/images/login.png"
            />
          </div>

          <div className="relative z-20 w-full max-w-md px-edge-margin-mobile">
            <div
              className="bg-surface p-8 md:p-12 shadow-2xl space-y-12 stagger-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="text-center">
                <h1 className="font-headline-lg text-headline-lg mb-2">
                  Masuk ke Dasbor
                </h1>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="group">
                  <label
                    className="font-label-md text-label-md uppercase text-on-surface-variant mb-2 block tracking-widest"
                    htmlFor="whatsapp"
                  >
                    Nomor Handphone
                  </label>
                  <div className="relative border-b border-on-background/20 input-line-focus transition-all duration-300">
                    <input
                      className="w-full bg-transparent border-none px-0 py-3 focus:ring-0 font-body-lg text-body-lg placeholder:text-outline/40"
                      id="whatsapp"
                      name="whatsapp"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812..."
                      type="tel"
                    />
                  </div>
                </div>

                <div className="group">
                  <label
                    className="font-label-md text-label-md uppercase text-on-surface-variant mb-2 block tracking-widest"
                    htmlFor="slug"
                  >
                    couple
                  </label>
                  <div className="relative border-b border-on-background/20 input-line-focus transition-all duration-300 flex items-baseline">
                    <span className="text-on-surface-variant/50 font-body-md text-body-md mr-1 select-none">
                      aksaraa/
                    </span>
                    <input
                      className="flex-1 bg-transparent border-none px-0 py-3 focus:ring-0 font-body-lg text-body-lg placeholder:text-outline/40"
                      id="slug"
                      name="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="nama-pasangan"
                      type="text"
                    />
                  </div>
                  <p className="mt-3 text-[11px] text-on-surface-variant/60 font-body-md italic">
                    Cth: Kanya-Rio
                  </p>
                </div>

                {error && (
                  <p className="text-error font-body-md text-body-md -mt-4">{error}</p>
                )}

                <div className="pt-4">
                  <button
                    ref={btnRef}
                    type="submit"
                    disabled={loading || !phone || !slug}
                    className="w-full bg-primary text-on-primary py-5 font-label-md text-label-md uppercase tracking-[0.2em] border border-primary hover:bg-tertiary transition-all duration-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ letterSpacing: "0.2em" }}
                    onMouseEnter={() => { if (btnRef.current) btnRef.current.style.letterSpacing = "0.25em" }}
                    onMouseLeave={() => { if (btnRef.current) btnRef.current.style.letterSpacing = "0.2em" }}
                  >
                    {loading ? "Memverifikasi..." : "Masuk"}
                  </button>
                </div>
              </form>

              <div className="pt-8 border-t border-outline-variant/30 text-center">
                <a
                  className="text-on-surface-variant font-label-md text-label-md uppercase tracking-widest border-b border-transparent hover:border-primary transition-all duration-300"
                  href="https://wa.me/6281224459435"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Butuh bantuan akses?
                </a>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-6 left-0 w-full z-50 flex justify-center pointer-events-none">
          <div className="text-on-surface-variant font-label-md text-[10px] uppercase tracking-widest opacity-40">
            Aksaraa — Client Portal
          </div>
        </div>
      </div>
    </>
  )
}
