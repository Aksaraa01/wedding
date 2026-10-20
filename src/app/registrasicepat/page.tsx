"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { normalizePhone } from "@/lib/packages"

function RegistrasiCepatInner() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [secondName, setSecondName] = useState("")
  const [waNumber, setWaNumber] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherAmount, setVoucherAmount] = useState<number | null>(null)
  const [voucherNote, setVoucherNote] = useState("")
  const [voucherError, setVoucherError] = useState("")
  const [voucherChecking, setVoucherChecking] = useState(false)
  const [basePrice, setBasePrice] = useState<number | null>(null)

  const formValid =
    firstName.trim().length > 0 &&
    secondName.trim().length > 0 &&
    waNumber.replace(/\D/g, "").length > 0 &&
    pin.length === 6

  const applyVoucher = async (code: string) => {
    const clean = code.replace(/\s/g, "").toUpperCase()
    if (!clean) {
      setVoucherAmount(null)
      setVoucherNote("")
      setVoucherError("")
      return
    }
    setVoucherChecking(true)
    setVoucherError("")
    try {
      let base = basePrice
      if (base === null) {
        try {
          const priceRes = await fetch("/api/packages/prices")
          const priceBook = await priceRes.json()
          base = Number(priceBook?.base?.signature) || 0
          setBasePrice(base)
        } catch {
          base = 0
        }
      }
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, package_type: "signature", base }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setVoucherCode(clean)
        const preview = data.discount_preview ?? (data.discount_type === "amount" ? data.amount : null)
        setVoucherAmount(preview)
        setVoucherNote(
          data.discount_type === "percent"
            ? `${data.percent}%${data.max_discount ? ` (maks Rp${Number(data.max_discount).toLocaleString("id-ID")})` : ""}`
            : "",
        )
      } else {
        setVoucherAmount(null)
        setVoucherNote("")
        setVoucherError(data.message || "Kode voucher tidak valid.")
      }
    } catch {
      setVoucherAmount(null)
      setVoucherNote("")
      setVoucherError("Gagal memeriksa voucher. Coba lagi.")
    } finally {
      setVoucherChecking(false)
    }
  }

  const handleSubmit = async () => {
    if (!formValid || submitting) return
    setSubmitting(true)
    setSubmitError("")

    const cleaned = waNumber.replace(/\D/g, "").replace(/^0+/, "")
    const cleanPin = (pin || "").replace(/\D/g, "")
    if (!cleaned || cleanPin.length !== 6) {
      setSubmitting(false)
      return
    }

    const phone = normalizePhone(cleaned)

    const phoneCheck = await fetch(`/api/check-phone?q=${encodeURIComponent(phone)}`)
    const phoneResult = await phoneCheck.json()
    if (phoneResult.exists) {
      setSubmitError("Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.")
      setSubmitting(false)
      return
    }

    const coupleCheck = await fetch(
      `/api/check-couple?name1=${encodeURIComponent(firstName.trim())}&name2=${encodeURIComponent(secondName.trim())}`
    )
    const coupleResult = await coupleCheck.json()
    if (coupleResult.exists) {
      setSubmitError("Nama pasangan sudah terdaftar. Hubungi konsultan jika ini pasangan Anda.")
      setSubmitting(false)
      return
    }

    try {
      const endOfYear = `${new Date().getFullYear()}-12-31`
      const res = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: firstName.trim(),
          groom_name: secondName.trim(),
          estimated_wedding_date: endOfYear,
          estimated_guest_count: 300,
          whatsapp_number: phone,
          pin: cleanPin,
          package_type: "signature",
          wa_blast_tier: 0,
          express_service: false,
          undangan_fisik: false,
          voucher_code: voucherAmount != null ? voucherCode.trim().toUpperCase() : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const pid = data.wedding_profile_id || data.profile_id || ""
        router.push(pid ? `/dashboard/${pid}/web-invitation/editor` : "/login")
      } else {
        setSubmitError(data.error || "Terjadi kesalahan. Silakan coba lagi.")
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative h-[100dvh] md:min-h-screen bg-background text-on-surface antialiased flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-surface/60 z-10" />
        <img alt="Aksaraa Editorial Background" src="/images/login.png" className="w-full h-full object-cover object-center grayscale-[10%]" />
      </div>
      <header className="fixed top-0 w-full z-50 h-12 md:h-16 flex justify-center items-center px-4 bg-surface/80 backdrop-blur-md">
        <span className="font-headline-md text-[20px] md:text-headline-md tracking-tighter text-primary">Aksaraa</span>
      </header>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 md:p-10 max-w-lg w-full border border-outline-variant/40 shadow-2xl relative max-h-[92dvh] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full mx-auto mb-5">
              <span className="material-symbols-outlined scale-150">mail</span>
            </div>
            <h2 className="font-headline-md text-headline-md mb-2">Buat Akun</h2>
            <p className="font-body-md text-sm text-on-surface-variant">Isi data pasangan dan buat PIN untuk masuk ke editor undangan. Paket Signature.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Nama Mempelai Pertama</label>
              <input
                className="w-full px-4 py-3.5 bg-transparent border border-outline-variant/30 focus:border-primary rounded-xl focus:outline-none text-lg font-headline-md placeholder:text-outline-variant transition-colors"
                placeholder="Nama Mempelai Pertama"
                type="text"
                autoComplete="off"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setSubmitError("") }}
              />
            </div>
            <div>
              <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Nama Mempelai Kedua</label>
              <input
                className="w-full px-4 py-3.5 bg-transparent border border-outline-variant/30 focus:border-primary rounded-xl focus:outline-none text-lg font-headline-md placeholder:text-outline-variant transition-colors"
                placeholder="Nama Mempelai Kedua"
                type="text"
                autoComplete="off"
                value={secondName}
                onChange={(e) => { setSecondName(e.target.value); setSubmitError("") }}
              />
            </div>
            <div>
              <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Nomor WhatsApp Aktif</label>
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
              <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Buat PIN (6 digit)</label>
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
                  onClick={() => setShowPin(v => !v)}
                  className="px-3 text-on-surface-variant hover:text-primary"
                  aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPin ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            {submitError && (
              <p className="font-body-md text-sm text-red-400">{submitError}</p>
            )}
            <div>
              <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Kode Voucher (opsional)</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 px-4 py-3.5 bg-transparent border border-outline-variant/30 focus:border-primary rounded-xl focus:outline-none font-mono uppercase tracking-widest placeholder:text-outline-variant transition-colors"
                  placeholder="AKSARAA-XXXXXX"
                  autoComplete="off"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.replace(/\s/g, "").toUpperCase())
                    setVoucherError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.preventDefault()
                  }}
                  maxLength={64}
                />
                <button
                  type="button"
                  onClick={() => applyVoucher(voucherCode)}
                  disabled={voucherChecking || !voucherCode.trim()}
                  className="shrink-0 px-5 rounded-xl border border-secondary text-secondary font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary hover:text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  {voucherChecking ? "..." : "Pakai"}
                </button>
              </div>
              {voucherError && (
                <p className="font-body-md text-sm text-red-400 mt-2">{voucherError}</p>
              )}
              {(voucherAmount != null || voucherNote) && (
                <p className="font-body-md text-sm text-green-700 mt-2">
                  Voucher diterapkan{voucherNote ? ` — ${voucherNote}` : ""}
                  {voucherAmount != null ? ` — potongan Rp${voucherAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : ""}.
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!formValid || submitting}
              className={`w-full py-4 rounded-xl bg-secondary text-white font-label-md uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:bg-on-secondary-fixed ${
                !formValid || submitting ? "opacity-50" : ""
              }`}
            >
              <span>{submitting ? "Mendaftar..." : "Daftar"}</span>
              <span className="material-symbols-outlined">arrow_right_alt</span>
            </button>
            <button
              onClick={() => router.push("/hero")}
              className="w-full py-3 rounded-xl border border-outline-variant text-primary font-label-md uppercase tracking-[0.2em] hover:bg-surface-variant transition-colors"
            >
              Kembali
            </button>
            <div className="rounded-xl bg-surface-container-low p-3.5 text-center">
              <p className="font-label-md text-[11px] text-on-surface-variant leading-relaxed">
                Nomor WhatsApp &amp; PIN akan digunakan untuk login ke dasbor Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegistrasiCepatPage() {
  return (
    <Suspense>
      <RegistrasiCepatInner />
    </Suspense>
  )
}
