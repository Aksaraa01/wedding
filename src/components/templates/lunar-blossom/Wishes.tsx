"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"

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
  coupleName?: string
  lang: "EN" | "ID"
}

const PAGE_SIZE = 5
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Leonardo Family",
    message: "Wishing you a lifetime of love, laughter, and togetherness. Congratulations!",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "University Friends",
    message: "Finally! Wishing you both all the happiness in the world. We cannot wait to celebrate with you.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Colleagues",
    message: "May your marriage be filled with blessings, patience, and endless joy.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

function wishAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, lang }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!weddingProfileId) {
      setLoaded(true)
      return
    }
    if (weddingProfileId === DEMO_ID) {
      setWishes(DEMO_WISHES)
      setLoaded(true)
      return
    }
    let cancelled = false
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(weddingProfileId)}&status=approved`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setWishes(Array.isArray(data?.wishes) ? data.wishes : [])
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [weddingProfileId])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback(lang === "ID" ? "Mode pratinjau — ucapan tidak disimpan." : "Preview mode — your wishes are not saved.")
      setMessage("")
      window.setTimeout(() => {
        setStatus("idle")
        setFeedback("")
      }, 4000)
      return
    }
    setStatus("sending")
    setFeedback("")
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: weddingProfileId,
          guest_id: guestId || null,
          name: name.trim() || guestName || "Our Beloved Guest",
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409) {
        setStatus("error")
        setFeedback(
          lang === "ID"
            ? "Anda sudah mengirim ucapan. Terima kasih atas doanya."
            : "You have already sent your wishes. Thank you for your love and prayers."
        )
        return
      }
      if (res.ok) {
        setStatus("done")
        setFeedback(
          lang === "ID"
            ? "Terima kasih! Ucapan Anda akan tampil setelah moderasi."
            : "Thank you! Your wishes will appear after moderation."
        )
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback(lang === "ID" ? "Terlalu banyak pesan. Coba lagi nanti." : "Too many messages right now. Please try again.")
    } catch {
      setStatus("error")
      setFeedback(lang === "ID" ? "Gagal mengirim. Periksa koneksi Anda." : "Could not send your wishes. Please check your connection.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status, lang])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="lb-wishes">
      <p className="lb-wishes__intro">
        {lang === "ID"
          ? `Tinggalkan pesan cinta dan doa untuk ${coupleName || "kedua mempelai"}.`
          : `Leave a message of love and a prayer for ${coupleName || "the couple"}.`}
      </p>

      <form
        className="lb-wishes__form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          className="lb-wishes__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === "ID" ? "Nama Anda" : "Your name"}
          maxLength={80}
          autoComplete="name"
          aria-label={lang === "ID" ? "Nama" : "Name"}
          readOnly={nameLocked}
          aria-readonly={nameLocked}
        />
        <textarea
          className="lb-wishes__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
          placeholder={lang === "ID" ? "Tulis ucapan & doa" : "Write your wishes"}
          rows={2}
          maxLength={MAX_CHARS}
          aria-label={lang === "ID" ? "Ucapan" : "Wishes"}
        />
        <div className="lb-wishes__row">
          <span className="lb-wishes__count">{message.length}/{MAX_CHARS}</span>
          <button type="submit" className="lb-wishes__submit" disabled={status === "sending" || !message.trim()}>
            {status === "sending" ? (lang === "ID" ? "Mengirim..." : "Sending...") : lang === "ID" ? "Kirim" : "Send"}
          </button>
        </div>
        {feedback && <p className={`lb-wishes__feedback${status === "error" ? " is-error" : ""}`}>{feedback}</p>}
      </form>

      <div className="lb-wishes__list">
        {!loaded && <p className="lb-wishes__empty">{lang === "ID" ? "Memuat ucapan..." : "Loading wishes..."}</p>}
        {loaded && wishes.length === 0 && (
          <p className="lb-wishes__empty">
            {lang === "ID" ? "Belum ada ucapan. Jadilah yang pertama." : "No wishes yet. Be the first to leave one."}
          </p>
        )}
        {paged.map((wish) => (
          <article key={wish.id} className="lb-wishes__item">
            <div className="lb-wishes__meta">
              <b>{wish.name || (lang === "ID" ? "Tamu" : "Guest")}</b>
              <span>{wishAgo(wish.created_at)}</span>
            </div>
            <p>{wish.message}</p>
          </article>
        ))}
        {totalPages > 1 && (
          <div className="lb-wishes__pager">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} aria-label="Previous">
              ‹
            </button>
            <span>{currentPage + 1} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} aria-label="Next">
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
