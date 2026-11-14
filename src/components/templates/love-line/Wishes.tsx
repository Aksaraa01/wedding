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
}

const PAGE_SIZE = 4
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "Dee",
    message: "Beautiful. Wishing you a lifetime of laughter and light.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Our Wedding Link",
    message: "Beautiful design matters. Happy for all of you that want to get married.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
]

function wishAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, copy }: Props) {
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
      setFeedback("Preview mode — your wish was not saved.")
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
          name: name.trim() || guestName || "Dear Guest",
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback("You have already sent a wish. Thank you for your love and prayers.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback("Thank you. Your wish will appear after it is reviewed.")
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback("Too many messages right now. Please try again in a moment.")
    } catch {
      setStatus("error")
      setFeedback("Your wish could not be sent. Please check your connection.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="ll-wishes__inner">
      <form
        className="ll-wish-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="ll-field">
          <label className="ll-field__label" htmlFor="ll-wish-name">
            {copy.nameLabel}
          </label>
          <input
            id="ll-wish-name"
            className="ll-field__input"
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

        <div className="ll-field">
          <label className="ll-field__label" htmlFor="ll-wish-message">
            {copy.messageLabel}
          </label>
          <textarea
            id="ll-wish-message"
            className="ll-field__input"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.messagePlaceholder}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="ll-field__counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="ll-secondary" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? "Sending…" : copy.submit}
        </button>

        {feedback && (
          <p className={`ll-field__feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="ll-wishlist">
        {!loaded && <p className="ll-field__feedback">Loading wishes…</p>}
        {loaded && wishes.length === 0 && (
          <p className="ll-field__feedback">
            {copy.empty}{coupleName ? ` (${coupleName})` : ""}
          </p>
        )}

        {pagedWishes.map((wish) => (
          <article className="ll-wish" key={wish.id}>
            <header className="ll-wish__head">
              <span className="ll-wish__name">{wish.name || "Dear Guest"}</span>
              <span className="ll-wish__date">{wishAgo(wish.created_at)}</span>
            </header>
            <p className="ll-wish__text">{wish.message}</p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="ll-pager">
            <button
              type="button"
              className="ll-pager__btn"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ‹
            </button>
            <span className="ll-pager__info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="ll-pager__btn"
              aria-label="Next page"
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
