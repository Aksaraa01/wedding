"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { normalizePhone } from "@/lib/packages"
import { CoupleSlugHint } from "@/components/CoupleSlugHint"
import { coupleSlugError } from "@/lib/slug"
import { isReservedSlug, reservedSlugMessage } from "@/lib/reservedSlugs"
import { KIDS_EVENT_OPTIONS, normalizeEventType, type EventType } from "@/lib/eventType"

// Ceriavite registration, built as a mobile app form: one column, sectioned
// cards, 48px targets, sticky primary action. One name (the child), the parents'
// line, the rite and the date; the package is fixed at Rp 199.000.
export default function DaftarCeriavitePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [gender, setGender] = useState<"putra" | "putri">("putra")
  const [parents, setParents] = useState("")
  const [eventType, setEventType] = useState<EventType>("khitanan")
  const [date, setDate] = useState("")
  const [wa, setWa] = useState("")
  const [pin, setPin] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const slugIssue =
    coupleSlugError(nickname, "") ||
    (isReservedSlug(nickname.replace(/[^a-zA-Z0-9]/g, "")) ? reservedSlugMessage(nickname) : null)

  // Only the child's name is required. The date defaults to a month out and is
  // editable later in the editor, so a parent can finish signing up in seconds.
  const formValid =
    nickname.trim().length > 0 &&
    wa.replace(/\D/g, "").length > 0 &&
    pin.length === 6 &&
    !slugIssue

  const submit = async () => {
    if (!formValid || submitting) return
    setSubmitting(true)
    setError("")

    const cleaned = wa.replace(/\D/g, "").replace(/^0+/, "")
    const phone = normalizePhone(cleaned)

    try {
      const phoneCheck = await fetch(`/api/check-phone?q=${encodeURIComponent(phone)}`)
      const phoneResult = await phoneCheck.json()
      if (phoneResult.exists) {
        setError("Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.")
        setSubmitting(false)
        return
      }

      const coupleCheck = await fetch(
        `/api/check-couple?name1=${encodeURIComponent(nickname.trim())}&name2=`
      )
      const coupleResult = await coupleCheck.json()
      if (coupleResult.exists) {
        setError("Nama ananda sudah terdaftar. Hubungi konsultan jika ini ananda Anda.")
        setSubmitting(false)
        return
      }

      const res = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: "",
          groom_name: nickname.trim(),
          child_full_name: nickname.trim(),
          parents_names: parents.trim(),
          subject_gender: gender,
          event_type: normalizeEventType(eventType),
          estimated_wedding_date:
            date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          estimated_guest_count: 300,
          whatsapp_number: phone,
          pin,
          package_type: "essential",
          wa_blast_tier: 0,
          express_service: false,
          undangan_fisik: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan. Silakan coba lagi.")
        setSubmitting(false)
        return
      }
      const pid = data.wedding_profile_id || ""
      router.push(pid ? `/dashboard/${pid}` : "/login")
    } catch {
      setError("Gagal terhubung ke server.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1817] antialiased [-webkit-tap-highlight-color:transparent]">
      {/* App bar */}
      <header className="sticky top-0 z-30 border-b border-[#EFE9DD] bg-[#FAF7F2]/92 backdrop-blur-md [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-[520px] items-center gap-2 px-3">
          <Link
            href="/ceriavite"
            aria-label="Kembali"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#8D4D39] active:bg-white/5"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-[15px] text-[#1A1817]">Buat Undangan</span>
          <span className="ml-auto rounded-full bg-[#8D4D39]/15 px-2.5 py-1 text-[9.5px] uppercase tracking-[0.14em] text-[#8D4D39]">
            Rp 199.000
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[520px] px-4 pb-32">
        <p className="pt-5 text-[10px] uppercase tracking-[0.3em] text-[#8D4D39]">
          Satu paket, sekali bayar
        </p>
        <h1 className="mt-2 text-[22px] leading-tight text-[#1A1817]">Data ananda</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#6E6A63]">
          Isi seperlunya sekarang. Foto, acara, dan galeri dilengkapi di editor setelah akun dibuat.
        </p>

        {/* Data ananda */}
        <section className="mt-5 rounded-2xl border border-[#EFE9DD] bg-white p-4">
          <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">
            Nama panggilan ananda
          </label>
          <input
            className="h-12 w-full rounded-xl border border-[#E7DECF] bg-[#FCFAF6] px-3.5 text-[15px] text-[#1A1817] placeholder:text-[#A39B8E] focus:border-[#8D4D39] focus:outline-none"
            placeholder="Contoh: Raka"
            autoComplete="off"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setError("")
            }}
          />
          <CoupleSlugHint
            name1={nickname}
            name2=""
            variant="default"
            className="mt-2"
            helpText="Nama panggilan ini menjadi alamat undangan digital ananda."
          />

          <p className="mb-2 mt-5 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">Putra / Putri</p>
          <div className="grid grid-cols-2 gap-2">
            {(["putra", "putri"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`h-11 rounded-xl border text-[13px] capitalize transition-colors ${
                  gender === g
                    ? "border-[#8D4D39] bg-[#8D4D39] text-white"
                    : "border-[#E7DECF] text-[#6E6A63]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <label className="mb-2 mt-5 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">
            Nama orang tua
          </label>
          <input
            className="h-12 w-full rounded-xl border border-[#E7DECF] bg-[#FCFAF6] px-3.5 text-[15px] text-[#1A1817] placeholder:text-[#A39B8E] focus:border-[#8D4D39] focus:outline-none"
            placeholder="Bapak Ahmad Fauzi & Ibu Sri Rahmawati"
            autoComplete="off"
            value={parents}
            onChange={(e) => setParents(e.target.value)}
          />
        </section>

        {/* Acara */}
        <h2 className="mt-6 text-[15px] text-[#1A1817]">Acara</h2>
        <section className="mt-2.5 rounded-2xl border border-[#EFE9DD] bg-white p-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">Jenis acara</p>
          <div className="grid grid-cols-3 gap-2">
            {KIDS_EVENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEventType(opt.value)}
                className={`h-11 rounded-xl border px-1 text-[12px] leading-tight transition-colors ${
                  eventType === opt.value
                    ? "border-[#8D4D39] bg-[#8D4D39] text-white"
                    : "border-[#E7DECF] text-[#6E6A63]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="mb-2 mt-4 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">
            Tanggal acara
          </label>
          <input
            type="date"
            className="h-12 w-full min-w-0 appearance-none rounded-xl border border-[#E7DECF] bg-[#FCFAF6] px-3.5 text-[15px] text-[#1A1817] focus:border-[#8D4D39] focus:outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </section>

        {/* Kontak & PIN */}
        <h2 className="mt-6 text-[15px] text-[#1A1817]">Kontak &amp; akses</h2>
        <section className="mt-2.5 rounded-2xl border border-[#EFE9DD] bg-white p-4">
          <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">
            Nomor WhatsApp aktif
          </label>
          <div className="flex h-12 overflow-hidden rounded-xl border border-[#E7DECF] bg-[#FCFAF6] focus-within:border-[#8D4D39]">
            <span className="flex items-center border-r border-[#EFE9DD] px-3 text-[14px] text-[#6E6A63]">
              +62
            </span>
            <input
              className="h-full w-full bg-transparent px-3 text-[15px] text-[#1A1817] placeholder:text-[#A39B8E] focus:outline-none"
              placeholder="81234567890"
              inputMode="numeric"
              autoComplete="tel"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
            />
          </div>

          <label className="mb-2 mt-4 block text-[10px] uppercase tracking-[0.18em] text-[#8D4D39]">
            PIN 6 digit <span className="normal-case tracking-normal text-[#8B857C]">untuk masuk dashboard</span>
          </label>
          <input
            className="h-12 w-full rounded-xl border border-[#E7DECF] bg-[#FCFAF6] px-3.5 text-[17px] tracking-[0.5em] text-[#1A1817] placeholder:text-[#A39B8E] focus:border-[#8D4D39] focus:outline-none"
            placeholder="••••••"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </section>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-200">
            {error}
          </p>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-[#8B857C]">
          Dengan mendaftar Anda menyetujui syarat layanan Ceriavite. Undangan aktif setelah
          pembayaran dikonfirmasi tim kami.
        </p>
      </main>

      {/* Sticky primary action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EFE9DD] bg-[#FAF7F2]/95 backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-[520px] px-4 py-2.5">
          <button
            type="button"
            onClick={submit}
            disabled={!formValid || submitting}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#8D4D39] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-opacity active:scale-[0.98] disabled:opacity-40"
          >
            {submitting ? "Menyiapkan undangan…" : "Buat undangan Rp 199.000"}
          </button>
        </div>
      </div>
    </div>
  )
}
