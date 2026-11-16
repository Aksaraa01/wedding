"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { normalizePhone } from "@/lib/packages"
import { CoupleSlugHint } from "@/components/CoupleSlugHint"
import { coupleSlugError } from "@/lib/slug"
import { isReservedSlug, reservedSlugMessage } from "@/lib/reservedSlugs"
import { KIDS_EVENT_OPTIONS, eventLabels, normalizeEventType, type EventType } from "@/lib/eventType"

// Ceriavite registration: one name (the child), the parents' line, the rite and
// the date. Everything else the editor asks for later. The package is fixed —
// Rp 199.000 flat — so there is no package, add-on or WA-tier picker here.
export default function DaftarCeriavitePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [fullName, setFullName] = useState("")
  const [gender, setGender] = useState<"putra" | "putri">("putra")
  const [parents, setParents] = useState("")
  const [eventType, setEventType] = useState<EventType>("khitanan")
  const [date, setDate] = useState("")
  const [wa, setWa] = useState("")
  const [pin, setPin] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const labels = eventLabels(eventType, gender)
  const slugIssue = coupleSlugError(nickname, "") ||
    (isReservedSlug(nickname.replace(/[^a-zA-Z0-9]/g, "")) ? reservedSlugMessage(nickname) : null)

  const formValid =
    nickname.trim().length > 0 &&
    date.trim().length > 0 &&
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
          child_full_name: fullName.trim() || nickname.trim(),
          parents_names: parents.trim(),
          subject_gender: gender,
          event_type: normalizeEventType(eventType),
          estimated_wedding_date: date,
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
      router.push(pid ? `/dashboard/${pid}/web-invitation/templates` : "/login")
    } catch {
      setError("Gagal terhubung ke server.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#320a11] text-[#f8f0e2] flex flex-col">
      <header className="w-full border-b border-[#c9a227]/25">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/ceriavite" className="font-headline-md text-lg tracking-tight text-[#f8f0e2]">
            Ceriavite
          </a>
          <a href="/login" className="font-label-md text-[10px] uppercase tracking-[0.2em] text-[#e6cd8b]">
            Masuk
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <div className="text-center">
          <p className="font-label-md text-[10px] uppercase tracking-[0.32em] text-[#e6cd8b]">
            {labels.coverKicker}
          </p>
          <h1 className="mt-3 font-headline-md text-3xl leading-tight text-[#f8f0e2]">
            Mulai undangan ananda
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#f8f0e2]/65">
            Satu paket Rp 199.000 — undangan website, konfirmasi kehadiran (RSVP),
            doa &amp; ucapan, tautan tamu, dan tanda kasih.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
              Nama panggilan ananda
            </label>
            <input
              className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 font-headline-md text-lg text-[#f8f0e2] placeholder:text-[#f8f0e2]/30 focus:border-[#c9a227] focus:outline-none"
              placeholder="Contoh: Arkan"
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
              className="mt-2"
              helpText="Isi dengan nama panggilan saja. Nama ini menjadi alamat undangan digital ananda."
            />
          </div>

          <div>
            <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
              Nama lengkap ananda (opsional)
            </label>
            <input
              className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2] placeholder:text-[#f8f0e2]/30 focus:border-[#c9a227] focus:outline-none"
              placeholder="Contoh: Muhammad Arkan Al Fatih"
              autoComplete="off"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["putra", "putri"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`rounded-xl border px-4 py-3 text-sm capitalize transition-colors ${
                  gender === g
                    ? "border-[#c9a227] bg-[#c9a227] text-[#320a11]"
                    : "border-[#c9a227]/30 bg-transparent text-[#f8f0e2]/75"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
              Nama orang tua
            </label>
            <input
              className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2] placeholder:text-[#f8f0e2]/30 focus:border-[#c9a227] focus:outline-none"
              placeholder="Contoh: Bapak Ahmad Fauzi & Ibu Sri Rahmawati"
              autoComplete="off"
              value={parents}
              onChange={(e) => setParents(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
                Jenis acara
              </label>
              <select
                className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2] focus:border-[#c9a227] focus:outline-none"
                value={eventType}
                onChange={(e) => setEventType(normalizeEventType(e.target.value))}
              >
                {KIDS_EVENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#3d0d16]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
                Tanggal acara
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2] focus:border-[#c9a227] focus:outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
              Nomor WhatsApp aktif
            </label>
            <div className="flex overflow-hidden rounded-xl border border-[#c9a227]/30 focus-within:border-[#c9a227]">
              <span className="border-r border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2]/70">
                +62
              </span>
              <input
                className="w-full bg-[#3d0d16] px-4 py-3.5 text-base text-[#f8f0e2] placeholder:text-[#f8f0e2]/30 focus:outline-none"
                placeholder="81234567890"
                inputMode="numeric"
                autoComplete="tel"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-label-md text-[10px] uppercase tracking-widest text-[#e6cd8b]">
              PIN 6 digit (untuk masuk ke dashboard)
            </label>
            <input
              className="w-full rounded-xl border border-[#c9a227]/30 bg-[#3d0d16] px-4 py-3.5 text-base tracking-[0.4em] text-[#f8f0e2] placeholder:text-[#f8f0e2]/30 focus:border-[#c9a227] focus:outline-none"
              placeholder="••••••"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!formValid || submitting}
            className="w-full rounded-xl bg-[#c9a227] px-6 py-4 font-label-md text-[11px] uppercase tracking-[0.2em] text-[#320a11] transition-opacity disabled:opacity-50"
          >
            {submitting ? "Menyiapkan undangan…" : "Buat undangan — Rp 199.000"}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-[#f8f0e2]/45">
            Dengan mendaftar Anda menyetujui syarat layanan Ceriavite.
            Undangan aktif setelah pembayaran dikonfirmasi tim kami.
          </p>
        </div>
      </main>
    </div>
  )
}
