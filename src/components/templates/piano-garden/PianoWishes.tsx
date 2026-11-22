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
}

const PAGE_SIZE = 5
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Albarn Family",
    message: "Wishing you a lifetime of love, laughter, and togetherness. Congratulations, David & Faye!",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Faye's University Friends",
    message: "Finally! Wishing you both all the happiness in the world. We cannot wait to celebrate with you.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "David's Colleagues",
    message: "May your marriage be filled with blessings, patience, and endless joy. Congratulations!",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "The Reed Family",
    message: "So happy for you both. Wishing you a marriage full of laughter and grace.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "Old Friends",
    message: "From all of us who have watched your story unfold, congratulations and all our love.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
  },
]

function wishAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1 day ago" : `${days} days ago`
}

export default function PianoWishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName }: Props) {
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
      setFeedback("Preview mode, your wishes are not saved.")
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
          name: name.trim() || guestName || "Our Beloved Guest",
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback("You have already sent your wishes. Thank you for your love and prayers.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback("Thank you! Your wishes will appear after moderation.")
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
      setFeedback("Could not send your wishes. Please check your connection.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <section className="tpl-rsvp piano-rsvp" id="rsvp">
      <form
        className="tpl-rsvp__form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="tpl-rsvp__field">
          <label htmlFor="piano-garden-rsvp-name">Name</label>
          <input
            id="piano-garden-rsvp-name"
            className="tpl-rsvp__input"
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

        <div className="tpl-rsvp__field">
          <label htmlFor="piano-garden-rsvp-message">Wishes &amp; Prayers</label>
          <textarea
            id="piano-garden-rsvp-message"
            className="tpl-rsvp__textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder="Write your wishes"
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="tpl-rsvp__counter">{message.length} / {MAX_CHARS}</p>
        </div>

        <button type="submit" className="tpl-rsvp__submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? "Sending..." : "Send Wishes"}
        </button>

        {feedback && (
          <p className={`rsvp-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="tpl-rsvp__wishes">
        {!loaded && <p className="piano-rsvp__empty">Loading wishes…</p>}
        {loaded && wishes.length === 0 && (
          <p className="piano-rsvp__empty">
            No wishes yet. Be the first to leave one for {coupleName || "the couple"}.
          </p>
        )}

        {wishes.length > 0 && (
          <>
            <div className="tpl-rsvp__wishes-list">
              {pagedWishes.map((wish) => (
                <div className="tpl-rsvp__wish" key={wish.id}>
                  <div className="tpl-rsvp__wish-header">
                    <div className="tpl-rsvp__wish-name">{wish.name || "Our Beloved Guest"}</div>
                    <div className="tpl-rsvp__wish-date">{wishAgo(wish.created_at)}</div>
                  </div>
                  <div className="tpl-rsvp__wish-message">{wish.message}</div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="tpl-rsvp__wishes-pagination">
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
                  aria-label="Previous page"
                  disabled={currentPage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  ‹
                </button>
                <span className="tpl-rsvp__wishes-pg-info">{currentPage + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
