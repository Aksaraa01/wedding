"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
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
  nameFallback: string
  listLabel: string
  copy: Copy
}

const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Tanoto Family",
    message: "Wishing you a lifetime of quiet mornings and photographs worth keeping. All our love.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Livia",
    message: "Two of the kindest people we know. May this day, and every one after it, be as gentle as you are.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Kevin",
    message: "Congratulations. Here is to the long exposure of a life shared — no retakes needed.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

export default function Wishes({
  weddingProfileId,
  guestId,
  guestName,
  guestLinkStrict,
  nameFallback,
  listLabel,
  copy,
}: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")

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
          name: name.trim() || guestName || nameFallback,
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback("You have already sent a wish. Thank you for your kindness.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback("Thank you. Your wish appears once it has been reviewed.")
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
  }, [weddingProfileId, guestId, guestName, nameFallback, name, message, status])

  return (
    <>
      <div className="fr-paper fr-form" data-p="10">
        <div className="fr-card__bar fr-eyeb">
          <span>{copy.messageLabel}</span>
        </div>
        <div className="fr-form__in">
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              void send()
            }}
          >
            <div className="form-group">
              <label className="fr-eyeb fr-form__label" htmlFor="fr-wish-name">
                {copy.nameLabel}
              </label>
              <input
                id="fr-wish-name"
                className="form-control"
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

            <div className="form-group">
              <label className="fr-eyeb fr-form__label" htmlFor="fr-wish-message">
                {copy.messageLabel}
              </label>
              <textarea
                id="fr-wish-message"
                className="form-control"
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
                placeholder={copy.messagePlaceholder}
                rows={2}
                maxLength={MAX_CHARS}
                required
              />
            </div>

            <p className="fr-eyeb fr-center fr-form__count">
              {message.length} / {MAX_CHARS}
            </p>

            <p className="fr-center">
              <button
                type="submit"
                className="fr-tix fr-tix--dark"
                disabled={status === "sending" || !message.trim()}
                aria-busy={status === "sending"}
              >
                <span className="fr-tix__l">{copy.submit}</span>
                <span className="fr-tix__r">
                  <svg viewBox="0 0 14 13" aria-hidden="true" focusable="false">
                    <path d="M1 6.5h11M7.5 1.5l5 5-5 5" />
                  </svg>
                </span>
              </button>
            </p>
          </form>

          {feedback && (
            <p className={`fr-alert${status === "error" ? " is-error" : ""}`} role="status">
              {feedback}
            </p>
          )}
        </div>
      </div>

      <div className="fr-wish__list fr-scroll fr-fadeb" data-p="16" aria-label={listLabel}>
        {loaded && wishes.length === 0 && <span className="fr-serif">{copy.empty}</span>}
        {wishes.map((wish) => (
          <div className="fr-wish__it" key={wish.id}>
            <b>{wish.name || nameFallback}</b>
            <span className="fr-serif">{wish.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}
