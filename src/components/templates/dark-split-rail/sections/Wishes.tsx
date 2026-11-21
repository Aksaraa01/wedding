"use client"

import { useCallback, useEffect, useState } from "react"
import { timeAgo } from "../../shared/lib"
import { COLORS, FONT_BODY, FONT_BTN, FONT_DISPLAY } from "../fonts"
import Section, { SectionHeading } from "../Section"
import { wishNameState } from "../../shared/wishName"

type Wish = {
  id: string
  name: string | null
  message: string
  created_at: string
}

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  language?: "id" | "en"
}

function ArrowLeftIcon({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ArrowRightIcon({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function initials(name?: string | null): string {
  const parts = (name || "Tamu Undangan").split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || "T"
  const second = parts[1]?.[0] || parts[0]?.[1] || ""
  return `${first}${second}`.toUpperCase()
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict , language = "id"}: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!weddingProfileId) return
    // Skip real fetch for demo IDs
    if (weddingProfileId === "demo-wedding-profile-id") {
      setWishes([
        { id: "1", name: "Keluarga Bapak Leonardo", message: "Semoga bahagia selalu, Andrew & Niar!", created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: "2", name: "Teman Kuliah Niar", message: "Akhirnya menikah juga! Selamat ya!", created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: "3", name: "Rekan Kerja Andrew", message: "Selamat menempuh hidup baru. Semoga diberkahi.", created_at: new Date(Date.now() - 259200000).toISOString() },
      ])
      setLoaded(true)
      return
    }
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(weddingProfileId)}&status=approved`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setWishes(Array.isArray(data?.wishes) ? data.wishes : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [weddingProfileId])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId) {
      setStatus("done")
      setFeedback("Mode pratinjau, ucapan tidak tersimpan.")
      setMessage("")
      setTimeout(() => {
        setStatus("idle")
        setFeedback("")
      }, 4000)
      return
    }
    setStatus("sending")
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: weddingProfileId,
          guest_id: guestId || null,
          name: name.trim() || guestName || "Tamu Undangan",
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409 || res.ok) {
        setStatus("done")
        setFeedback(res.ok ? "Tersimpan, menunggu moderasi ✦" : "Terima kasih! Ucapan Anda telah tersampaikan.")
        setMessage("")
        setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 4000)
      } else {
        setStatus("error")
        setFeedback("Terlalu banyak kiriman. Coba lagi nanti.")
      }
    } catch {
      setStatus("error")
      setFeedback("Gagal terkirim. Periksa koneksi Anda.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const pagedWishes = wishes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(wishes.length / PAGE_SIZE) || 1

  return (
    <Section id="wishes" className="border-t border-white/[0.08]">
      <SectionHeading>Best Wishes</SectionHeading>

      <p className="mx-auto mt-5 max-w-[360px] text-center leading-relaxed" style={{ ...FONT_BODY, color: "rgba(242,241,238,0.85)" }}>
        Berikan harapan dan doa terbaikmu di sini untuk kami berdua.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="mx-auto mt-8 max-w-[400px]"
      >
        <>
          <label className="block text-[10px] uppercase" style={{ ...FONT_BODY, letterSpacing: "2px", color: "rgba(242,241,238,0.7)" }}>
            Nama
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            className="mt-2 w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-[14px] outline-none focus:border-[#AF8D5C]"
            style={{ ...FONT_DISPLAY, borderColor: "rgba(255,255,255,0.14)", color: COLORS.cream }}
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </>

        <label className="mt-5 block text-[10px] uppercase" style={{ ...FONT_BODY, letterSpacing: "2px", color: "rgba(242,241,238,0.7)" }}>
          Ucapan & Doa
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          placeholder="Tulis Ucapan"
          rows={4}
          className="mt-2 w-full resize-none rounded-lg border bg-white/[0.04] px-4 py-3 text-[14px] outline-none focus:border-[#AF8D5C]"
          style={{ ...FONT_BODY, borderColor: "rgba(255,255,255,0.14)", color: COLORS.cream }}
        />
        <p className="mt-1 text-right text-[10px]" style={{ ...FONT_BODY, color: "rgba(242,241,238,0.5)" }}>
          {message.length} / 500
        </p>

        <button
          type="submit"
          disabled={status === "sending" || !message.trim()}
          className="mt-5 w-full rounded-full py-3 text-[12px] uppercase transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          style={{ ...FONT_BTN, letterSpacing: "1.5px", backgroundColor: COLORS.ink, color: COLORS.cream }}
        >
          {status === "sending" ? "Mengirim..." : "Kirim Ucapan"}
        </button>

        {feedback && (
          <p
            className="mt-3 text-center text-[12.5px]"
            style={{ ...FONT_BODY, color: status === "error" ? "#DB0000" : "#AF8D5C" }}
          >
            {feedback}
          </p>
        )}
      </form>

      {wishes.length > 0 && (
        <div className="mx-auto mt-12 max-w-[440px]">
          <div className="border-t pt-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <ul className="space-y-6">
              {pagedWishes.map((w, i) => (
                <li
                  key={w.id}
                  className={`flex flex-wrap items-baseline gap-3 ${i % 2 === 0 ? "justify-start text-left" : "justify-end text-right"}`}
                >
                  <div className={`flex-1 min-w-[180px] ${i % 2 === 0 ? "" : "text-right"}`}>
                    <p className="text-[17px] leading-none italic" style={{ ...FONT_DISPLAY, color: COLORS.cream }}>
                      {w.name || "Tamu Undangan"}
                    </p>
                    <p className="mt-1 text-[9px] uppercase" style={{ ...FONT_BODY, letterSpacing: "2px", color: "rgba(242,241,238,0.5)" }}>
                      {timeAgo(w.created_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(242,241,238,0.85)" }}>
                      {w.message}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-white/70 transition-colors hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  aria-label="Halaman sebelumnya"
                >
                  <ArrowLeftIcon size={14} />
                </button>
                <span className="text-[10px] uppercase" style={{ ...FONT_BODY, letterSpacing: "1px", color: "rgba(242,241,238,0.5)" }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border text-white/70 transition-colors hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  aria-label="Halaman berikutnya"
                >
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!loaded && weddingProfileId && (
        <p className="mt-8 text-center text-[12px]" style={{ ...FONT_BODY, color: "rgba(242,241,238,0.5)" }}>
          Memuat doa & ucapan…
        </p>
      )}

      {loaded && wishes.length === 0 && (
        <p className="mt-8 text-center text-[13px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(242,241,238,0.7)" }}>
          Belum ada doa & ucapan. Jadilah yang pertama!
        </p>
      )}
    </Section>
  )
}