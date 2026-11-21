"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { timeAgo } from "../shared/lib"
import { wishNameState } from "../shared/wishName"
import { normalizeLanguage } from "@/lib/i18n"

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
  more: string
  loading: string
}

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  nameFallback: string
  copy: Copy
  language?: "id" | "en"
}

const MAX_CHARS = 500
const PAGE = 10
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Tanoto Family",
    message:
      "Wishing you a lifetime of quiet mornings and photographs worth keeping. May your home always smell of coffee and rain.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Livia & Arman",
    message: "Two of the kindest people we know. May this day, and every one after it, be as gentle as you are.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Kevin",
    message: "Congratulations! Wishing you both a marriage full of laughter, patience and very good food.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

export default function Wishes({
  weddingProfileId,
  guestId,
  guestName,
  guestLinkStrict,
  nameFallback,
  copy,
  language = "id"
}: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(PAGE)
  const { value: prefilledName, locked: nameLocked } = wishNameState(guestName, guestId, guestLinkStrict)
  const [name, setName] = useState(prefilledName)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isError, setIsError] = useState(false)

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
    if (!text || sending) return
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setFeedback("Preview mode — your wish was not saved.")
      setIsError(false)
      setMessage("")
      return
    }
    setSending(true)
    setFeedback("")
    setIsError(false)
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
        setIsError(true)
        setFeedback("You have already sent a wish. Thank you for your kindness.")
        return
      }
      if (response.ok) {
        setFeedback("Thank you. Your wish appears once it has been reviewed.")
        setMessage("")
        return
      }
      setIsError(true)
      setFeedback("Too many messages right now. Please try again in a moment.")
    } catch {
      setIsError(true)
      setFeedback("Your wish could not be sent. Please check your connection.")
    } finally {
      setSending(false)
    }
  }, [weddingProfileId, guestId, guestName, nameFallback, name, message, sending])

  const shown = useMemo(() => wishes.slice(0, visible), [wishes, visible])

  return (
    <>
      <div className="wedding-wish-form">
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            void send()
          }}
        >
          <div className="form-group guest-name-wrap">
            <input
              className="form-control guest-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.namePlaceholder}
              aria-label={copy.nameLabel}
              maxLength={80}
              autoComplete="name"
              readOnly={nameLocked}
              aria-readonly={nameLocked}
            />
          </div>
          <div className="form-group guest-comment-wrap">
            <textarea
              className="form-control guest-comment"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
              placeholder={copy.messagePlaceholder}
              aria-label={copy.messageLabel}
              rows={1}
              maxLength={MAX_CHARS}
              required
            />
          </div>
          <div className="submit-comment-wrap">
            <button type="submit" className="submit submit-comment" disabled={sending || !message.trim()} aria-busy={sending}>
              {copy.submit}
            </button>
          </div>
        </form>
        {feedback ? (
          <p className={`olan-wish-feedback${isError ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        ) : null}
      </div>

      <div className={`comment-wrap${loaded ? " show" : ""}`}>
        {loaded && wishes.length === 0 ? <p className="olan-wish-empty">{copy.empty}</p> : null}
        {shown.map((wish, i) => (
          <div className={`olan-wish${i % 2 === 1 ? " is-alt" : ""}`} key={wish.id}>
            <p className="olan-wish__name">
              {wish.name || nameFallback}
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </p>
            <p className="olan-wish__time">{timeAgo(wish.created_at)}</p>
            <p className="olan-wish__text">{wish.message}</p>
          </div>
        ))}
      </div>

      {wishes.length > visible ? (
        <div className="more-comment-wrap show">
          <button type="button" className="olan-wish-more" onClick={() => setVisible((v) => v + PAGE)}>
            {copy.more}
          </button>
        </div>
      ) : null}
    </>
  )
}
