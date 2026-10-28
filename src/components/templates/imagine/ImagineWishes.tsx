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

const PAGE_SIZE = 10
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
    name: "Faye's University Friends",
    message: "Finally! Wishing you both all the happiness in the world.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Albarn's Colleagues",
    message: "May your marriage be filled with blessings and endless joy. Congratulations!",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

function wishAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  const days = Math.floor(minutes / 1440)
  return days === 1 ? "1 day ago" : `${days} days ago`
}

export default function ImagineWishes({ weddingProfileId, guestId, guestName, guestLinkStrict }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!weddingProfileId) return
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
    return () => { cancelled = true }
  }, [weddingProfileId])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback("Preview mode — your wishes are not saved.")
      setMessage("")
      window.setTimeout(() => { setStatus("idle"); setFeedback("") }, 4000)
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
        setFeedback("You have already sent your wishes. Thank you for your love and prayers.")
        return
      }
      if (res.ok) {
        setStatus("done")
        setFeedback("Thank you! Your wishes will appear after moderation.")
        setMessage("")
        window.setTimeout(() => { setStatus("idle"); setFeedback("") }, 5000)
        return
      }
      setStatus("error")
      setFeedback("Could not send your wishes. Please try again in a moment.")
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
    <>
      <form
        className="wedding-wish-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void send()
        }}
      >
        <div className="form-group guest-name-wrap">
          <input
            type="text"
            name="name"
            className="form-control guest-name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </div>
        <div className="form-group guest-comment-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
          <textarea
            className="form-control guest-comment"
            rows={1}
            placeholder="Give your wish"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
          />
        </div>
        <p className="wish-counter">{message.length} / {MAX_CHARS}</p>
        <div className="submit-comment-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
          <button type="submit" className="submit submit-comment" disabled={status === "sending" || !message.trim()}>
            {status === "sending" ? "Sending…" : "Send"}
          </button>
        </div>
        {feedback && (
          <p className={`wish-feedback${status === "error" ? " is-error" : ""}`} role="status">{feedback}</p>
        )}
      </form>

      <div className="comment-wrap">
        {!loaded && weddingProfileId && <p className="wish-empty">Loading wishes…</p>}
        {loaded && wishes.length === 0 && (
          <p className="wish-empty">No wishes yet. Be the first to leave one.</p>
        )}
        {wishes.length > 0 && (
          <>
            <ul className="wish-list">
              {pagedWishes.map((w) => (
                <li key={w.id} className="wish-item">
                  <div className="comment-head">
                    <span className="wish-name">{w.name || "Our Beloved Guest"}</span>
                    <span className="wish-date">{wishAgo(w.created_at)}</span>
                  </div>
                  <p className="comment-body">{w.message}</p>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="more-comment-wrap">
                <button
                  type="button"
                  className="wish-pg-btn"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span className="wish-pg-info">{currentPage + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="wish-pg-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
