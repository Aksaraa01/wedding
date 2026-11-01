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
  intro?: string
}

const PAGE_SIZE = 5
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Albarn Family",
    message: "Wishing you a lifetime of gentleness, laughter, and the kind of love that only grows quieter and deeper with time.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "A Friend of Faye",
    message: "Finally! We have watched this story unfold from the very first chapter. Congratulations, you two.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "David's Old Colleague",
    message: "May your home always be warm, your table always full, and your patience always longer than the queue at the airport.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "The Reed Family",
    message: "With all our love and blessings for the road ahead. We are so happy for you both.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "An Old Friend",
    message: "From the people who watched you become who you are — congratulations, and all of our love.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
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

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, intro }: Props) {
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
          name: name.trim() || guestName || "Tamu Undangan",
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback("You have already sent a wish. Thank you for the love and the prayers.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback("Thank you. Your wish will appear once it has been reviewed.")
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
      setFeedback("Could not send your wish. Please check your connection.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="nf-wishes">
      {intro && <p className="nf-body nf-wishes__intro">{intro}</p>}

      <form
        className="nf-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="nf-field">
          <label className="nf-field__label" htmlFor="nf-wish-name">
            Name
          </label>
          <input
            id="nf-wish-name"
            className="nf-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </div>

        <div className="nf-field">
          <label className="nf-field__label" htmlFor="nf-wish-message">
            Wish &amp; Prayer
          </label>
          <textarea
            id="nf-wish-message"
            className="nf-input"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder="Write a wish for the couple"
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="nf-counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="nf-btn nf-btn--red" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? "Sending…" : "Kirim Ucapan"}
        </button>

        {feedback && (
          <p className={`nf-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="nf-wishlist">
        {!loaded && <p className="nf-feedback">Loading wishes…</p>}
        {loaded && wishes.length === 0 && (
          <p className="nf-feedback">No wishes yet. Be the first to write one for {coupleName || "the couple"}.</p>
        )}

        {pagedWishes.map((wish) => (
          <article className="nf-wish" key={wish.id}>
            <header className="nf-wish__head">
              <span className="nf-wish__name">{wish.name || "Tamu Undangan"}</span>
              <span className="nf-wish__date">{wishAgo(wish.created_at)}</span>
            </header>
            <p className="nf-wish__text">{wish.message}</p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="nf-pager">
            <button
              type="button"
              className="nf-pager__btn"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ‹
            </button>
            <span className="nf-pager__info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="nf-pager__btn"
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
