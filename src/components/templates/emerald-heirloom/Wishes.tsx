"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"
import { normalizeLanguage, t } from "@/lib/i18n"

type Wish = {
  id: string
  name: string | null
  message: string
  created_at: string
}

export type WishesCopy = {
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
  copy: WishesCopy
  language?: "id" | "en"
}

const PAGE_SIZE = 4
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Tanoto Family",
    message:
      "May your home be as green as the garden you were married in — full of light, of birdsong, and of people you love.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Livia",
    message: "Two people who kept choosing each other, quietly, until it became a life. All our love.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Kevin",
    message: "Here is to the long table, the lilies, and the two of you at the centre of it all.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

function wishAgo(iso?: string, lang: "id" | "en" = "id"): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return lang === "en" ? "Just now" : "Baru saja"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "Yesterday" : `${days} days ago`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, copy , language = "id"}: Props) {
  const lang = normalizeLanguage(language)
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
    const en = language === "en"
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback(en ? "Preview mode — your wish was not saved." : "Mode pratinjau — ucapan tidak tersimpan.")
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
          name: name.trim() || guestName || (en ? "Guest" : "Tamu Undangan"),
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback(en ? "You have already sent a wish. Thank you for your kindness." : "Anda sudah mengirim ucapan. Terima kasih atas doa Anda.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback(en ? "Thank you. Your wish appears once it has been reviewed." : "Terima kasih. Ucapan Anda akan tampil setelah ditinjau.")
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback(en ? "Too many messages right now. Please try again in a moment." : "Terlalu banyak pesan saat ini. Coba lagi sebentar lagi.")
    } catch {
      setStatus("error")
      setFeedback(en ? "Your wish could not be sent. Please check your connection." : "Ucapan Anda gagal dikirim. Periksa koneksi Anda.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status, language])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <>
      <form
        className="eh-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="eh-field">
          <label htmlFor="eh-wish-name">{copy.nameLabel}</label>
          <input
            id="eh-wish-name"
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

        <div className="eh-field">
          <label htmlFor="eh-wish-message">{copy.messageLabel}</label>
          <textarea
            id="eh-wish-message"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.messagePlaceholder}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="eh-field__counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="eh-button eh-submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? (
            lang === "en" ? "Sending…" : "Mengirim…"
          ) : (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />
              </svg>
              {copy.submit}
            </>
          )}
        </button>

        {feedback && (
          <p className={`eh-field__feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="eh-wishlist">
        {!loaded && <p className="eh-field__feedback">Loading wishes…</p>}
        {loaded && wishes.length === 0 && (
          <p className="eh-field__feedback">
            {copy.empty}
            {coupleName ? ` (${coupleName})` : ""}
          </p>
        )}

        {pagedWishes.map((wish) => (
          <article className="eh-wish" key={wish.id}>
            <p className="eh-wish__text">{wish.message}</p>
            <p className="eh-wish__meta">
              <span className="eh-wish__name">{wish.name || (language === "en" ? "Guest" : "Tamu Undangan")}</span>
              <span>{wishAgo(wish.created_at, lang)}</span>
            </p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="eh-pager">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ‹
            </button>
            <span>
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </>
  )
}
