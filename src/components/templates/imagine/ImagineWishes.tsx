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

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  coupleName?: string
  language?: "id" | "en"
}

const PAGE_SIZE = 10
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

function demoWishes(lang: "id" | "en"): Wish[] {
  return lang === "en"
    ? [
  {
    id: "demo-1",
    name: "The Leonardo Family",
    message: "Wishing you a lifetime of love, laughter, and togetherness. Congratulations!",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Faye's University Friends",
    message: "Finally! Wishing you both all the happiness in the world.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Albarn's Colleagues",
    message: "May your marriage be filled with blessings and endless joy. Congratulations!",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
    ]
    : [
  {
    id: "demo-1",
    name: "Keluarga Leonardo",
    message: "Semoga kalian selalu dipenuhi cinta, tawa, dan kebersamaan. Selamat!",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Teman Kuliah Faye",
    message: "Akhirnya! Semoga kalian berdua mendapatkan semua kebahagiaan di dunia.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Rekan Kerja Albarn",
    message: "Semoga pernikahan kalian dipenuhi keberkahan dan sukacita tanpa akhir. Selamat!",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
    ]
}


export default function ImagineWishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, language = "id" }: Props) {
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
    if (!weddingProfileId) return
    if (weddingProfileId === DEMO_ID) {
      setWishes(demoWishes(lang))
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
  }, [weddingProfileId, lang])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback(t("previewWishNotSaved", lang))
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
          name: name.trim() || guestName || t("honoredGuest", lang),
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409) {
        setStatus("error")
        setFeedback(t("wishAlreadySent", lang))
        return
      }
      if (res.ok) {
        setStatus("done")
        setFeedback(t("thanksForWish", lang))
        setMessage("")
        window.setTimeout(() => { setStatus("idle"); setFeedback("") }, 5000)
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
            placeholder={lang === "en" ? "Name" : "Nama"}
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
            placeholder={t("writeWish", lang)}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
          />
        </div>
        <p className="wish-counter">{message.length} / {MAX_CHARS}</p>
        <div className="submit-comment-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
          <button type="submit" className="submit submit-comment" disabled={status === "sending" || !message.trim()}>
            {status === "sending" ? t("sending", lang) : (t("sendWishes", lang))}
          </button>
        </div>
        {feedback && (
          <p className={`wish-feedback${status === "error" ? " is-error" : ""}`} role="status">{feedback}</p>
        )}
      </form>

      <div className="comment-wrap">
        {!loaded && weddingProfileId && <p className="wish-empty">{t("loadingWishes", lang)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="wish-empty">{t("noWishesYet", lang)}</p>
        )}
        {wishes.length > 0 && (
          <>
            <ul className="wish-list">
              {pagedWishes.map((w) => (
                <li key={w.id} className="wish-item">
                  <div className="comment-head">
                    <span className="wish-name">{w.name || t("honoredGuest", lang)}</span>
                    <span className="wish-date">{formatWishAgo(w.created_at, lang)}</span>
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
                  aria-label={t("previousPage", lang)}
                >
                  ‹
                </button>
                <span className="wish-pg-info">{currentPage + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="wish-pg-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label={t("nextPage", lang)}
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
