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
  const lang = normalizeLanguage(language)
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
    const en = lang === "en"
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setFeedback(en ? "Preview mode — your wish was not saved." : "Mode pratinjau — ucapan tidak tersimpan.")
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
        setFeedback(en ? "You have already sent a wish. Thank you for your kindness." : "Anda sudah mengirim ucapan. Terima kasih atas doa Anda.")
        return
      }
      if (response.ok) {
        setFeedback(en ? "Thank you. Your wish appears once it has been reviewed." : "Terima kasih. Ucapan Anda akan tampil setelah ditinjau.")
        setMessage("")
        return
      }
      setIsError(true)
      setFeedback(en ? "Too many messages right now. Please try again in a moment." : "Terlalu banyak pesan saat ini. Coba lagi sebentar lagi.")
    } catch {
      setIsError(true)
      setFeedback(en ? "Your wish could not be sent. Please check your connection." : "Ucapan Anda gagal dikirim. Periksa koneksi Anda.")
    } finally {
      setSending(false)
    }
  }, [weddingProfileId, guestId, guestName, nameFallback, name, message, sending, lang])

  const shown = useMemo(() => wishes.slice(0, visible), [wishes, visible])

  return (
    <>
      <form
        className="noir-wish-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <label className="noir-field">
          <span className="noir-field__label">{copy.nameLabel}</span>
          <input
            className="noir-field__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.namePlaceholder}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </label>
        <label className="noir-field">
          <span className="noir-field__label">{copy.messageLabel}</span>
          <textarea
            className="noir-field__input noir-field__input--area"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={copy.messagePlaceholder}
            rows={3}
            maxLength={MAX_CHARS}
            required
          />
        </label>
        <button type="submit" className="noir-btn noir-btn--solid noir-wish-submit" disabled={sending || !message.trim()} aria-busy={sending}>
          {copy.submit}
        </button>
        {feedback ? (
          <p className={`noir-wish-feedback${isError ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        ) : null}
      </form>

      <div className="noir-wish-list">
        {!loaded ? <p className="noir-wish-empty">{copy.loading}</p> : null}
        {loaded && wishes.length === 0 ? <p className="noir-wish-empty">{copy.empty}</p> : null}
        {shown.map((wish) => (
          <article className="noir-wish" key={wish.id}>
            <header className="noir-wish__head">
              <p className="noir-wish__name">{wish.name || nameFallback}</p>
              <p className="noir-wish__time">{timeAgo(wish.created_at, lang)}</p>
            </header>
            <p className="noir-wish__text">{wish.message}</p>
          </article>
        ))}
      </div>

      {wishes.length > visible ? (
        <button type="button" className="noir-btn noir-btn--ghost noir-wish-more" onClick={() => setVisible((v) => v + PAGE)}>
          {copy.more}
        </button>
      ) : null}
    </>
  )
}
