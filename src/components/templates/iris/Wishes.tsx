"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"
import { formatWishAgo, normalizeLanguage, t } from "@/lib/i18n"

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

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, copy, language = "id" }: Props) {
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
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback(t("previewWishNotSaved", lang))
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
          name: name.trim() || guestName || t("guestHonored", lang),
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback(t("wishAlreadySent", lang))
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback(t("thanksForWish", lang))
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback(t("tooManyMessages", lang))
    } catch {
      setStatus("error")
      setFeedback(t("wishFailed", lang))
    }
  }, [weddingProfileId, guestId, guestName, name, message, status, lang])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="ir-wishes__inner">
      <form
        className="ir-wish-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="ir-field">
          <label className="ir-field__label" htmlFor="ir-wish-name">
            {copy.nameLabel}
          </label>
          <input
            id="ir-wish-name"
            className="ir-field__input"
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

        <div className="ir-field">
          <label className="ir-field__label" htmlFor="ir-wish-message">
            {copy.messageLabel}
          </label>
          <textarea
            id="ir-wish-message"
            className="ir-field__input"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.messagePlaceholder}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="ir-field__counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="ir-btn ir-btn--gold" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", lang) : copy.submit}
        </button>

        {feedback && (
          <p className={`ir-field__feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="ir-wishlist">
        {!loaded && <p className="ir-field__feedback">{t("loadingWishes", lang)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="ir-field__feedback">{copy.empty}</p>
        )}

        {pagedWishes.map((wish) => (
          <article className="ir-wish" key={wish.id}>
            <header className="ir-wish__head">
              <span className="ir-wish__name">{wish.name || t("guestHonored", lang)}</span>
              <span className="ir-wish__date">{formatWishAgo(wish.created_at, lang)}</span>
            </header>
            <p className="ir-wish__text">{wish.message}</p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="ir-pager">
            <button
              type="button"
              className="ir-pager__btn"
              aria-label={t("previousPage", lang)}
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ‹
            </button>
            <span className="ir-pager__info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="ir-pager__btn"
              aria-label={t("nextPage", lang)}
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
