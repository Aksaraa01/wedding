"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"

type Wish = {
  id: string
  name: string | null
  message: string
  created_at: string
}

type Copy = {
  nameLabel: string
  namePlaceholder: string
  messageLabel: string
  messagePlaceholder: string
  submit: string
  empty: string
}

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  coupleName?: string
  copy: Copy
  language?: "id" | "en"
}

const PAGE_SIZE = 4
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "Keluarga Tanoto",
    message: "Selamat menempuh hidup baru. Semoga rumah kalian selalu hangat dan penuh tawa.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Sahabat Livia",
    message: "Akhirnya! Kami menunggu hari ini sejak cerita pertama kalian. Bahagia selalu.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Rekan Kevin",
    message: "Semoga perjalanan kalian selalu ditemani cuaca baik dan orang-orang yang menyayangi.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

function wishAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Baru saja"
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 hari lalu" : `${days} hari lalu`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, copy , language = "id"}: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [page, setPage] = useState(0)

  useEffect(() => {
    setName(prefilledName)
  }, [prefilledName])

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
      .then((response) => (response.ok ? response.json() : null))
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
      setFeedback("Mode pratinjau, ucapan Anda tidak disimpan.")
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
      const response = await fetch("/api/wishes", {
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
      if (response.status === 409) {
        setStatus("error")
        setFeedback("Anda sudah mengirim ucapan. Terima kasih atas doa dan kasihnya.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback("Terima kasih. Ucapan Anda akan tampil setelah ditinjau.")
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback("Terlalu banyak pesan saat ini. Silakan coba lagi sebentar.")
    } catch {
      setStatus("error")
      setFeedback("Ucapan gagal dikirim. Periksa koneksi Anda.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="cn-wishes__inner">
      <form
        className="cn-wish-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="cn-field">
          <label className="cn-field__label" htmlFor="cn-wish-name">
            {copy.nameLabel}
          </label>
          <input
            id="cn-wish-name"
            className="cn-field__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </div>

        <div className="cn-field">
          <label className="cn-field__label" htmlFor="cn-wish-message">
            {copy.messageLabel}
          </label>
          <textarea
            id="cn-wish-message"
            className="cn-field__input"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.messagePlaceholder}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="cn-field__counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="cn-btn cn-btn--solid" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? "Mengirim…" : copy.submit}
        </button>

        {feedback && (
          <p className={`cn-field__feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="cn-wishlist">
        {!loaded && <p className="cn-field__feedback">Memuat ucapan…</p>}
        {loaded && wishes.length === 0 && (
          <p className="cn-field__feedback">
            {copy.empty}{coupleName ? ` (${coupleName})` : ""}
          </p>
        )}

        {pagedWishes.map((wish) => (
          <article className="cn-wish" key={wish.id}>
            <header className="cn-wish__head">
              <span className="cn-wish__name">{wish.name || "Tamu Undangan"}</span>
              <span className="cn-wish__date">{wishAgo(wish.created_at)}</span>
            </header>
            <p className="cn-wish__text">{wish.message}</p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="cn-pager">
            <button
              type="button"
              className="cn-pager__btn"
              aria-label="Halaman sebelumnya"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ‹
            </button>
            <span className="cn-pager__info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="cn-pager__btn"
              aria-label="Halaman berikutnya"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
