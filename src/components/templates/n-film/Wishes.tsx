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
  intro?: string
  language?: "id" | "en"
}

const PAGE_SIZE = 5
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

function demoWishes(lang: "id" | "en"): Wish[] {
  return lang === "en"
    ? [
  {
    id: "demo-1",
    name: "The Albarn Family",
    message: "Wishing you a lifetime of gentleness, laughter, and the kind of love that only grows quieter and deeper with time.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    name: "A Friend of Faye",
    message: "Finally! We have watched this story unfold from the very first chapter. Congratulations, you two.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-3",
    name: "David's Old Colleague",
    message: "May your home always be warm, your table always full, and your patience always longer than the queue at the airport.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "demo-4",
    name: "The Reed Family",
    message: "With all our love and blessings for the road ahead. We are so happy for you both.",
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "demo-5",
    name: "An Old Friend",
    message: "From the people who watched you become who you are, congratulations, and all of our love.",
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
    ]
    : [
  {
    id: "demo-1",
    name: "Keluarga Albarn",
    message: "Semoga kalian selalu diberkahi kelembutan, tawa, dan cinta yang semakin dalam seiring waktu.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Sahabat Faye",
    message: "Akhirnya! Kami menyaksikan kisah ini sejak bab pertama. Selamat untuk kalian berdua.",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Rekan Lama David",
    message: "Semoga rumah kalian selalu hangat, meja selalu penuh, dan kesabaran selalu lebih panjang dari antrean bandara.",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "demo-4",
    name: "Keluarga Reed",
    message: "Dengan segenap cinta dan doa untuk perjalanan kalian ke depan. Kami sangat bahagia untuk kalian berdua.",
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "demo-5",
    name: "Teman Lama",
    message: "Dari kami yang menyaksikan kalian tumbuh, selamat, dan semua cinta kami untuk kalian.",
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
    ]
}


export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, intro , language = "id"}: Props) {
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
      setWishes(demoWishes(lang))
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
  }, [weddingProfileId, lang])

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
          name: name.trim() || guestName || t("honoredGuest", lang),
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
            placeholder={lang === "en" ? "Your name" : "Nama Anda"}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </div>

        <div className="nf-field">
          <label className="nf-field__label" htmlFor="nf-wish-message">
            {t("secWishes", lang)}
          </label>
          <textarea
            id="nf-wish-message"
            className="nf-input"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={t("writeWish", lang)}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="nf-counter">
            {message.length} / {MAX_CHARS}
          </p>
        </div>

        <button type="submit" className="nf-btn nf-btn--red" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", lang) : t("sendWishes", lang)}
        </button>

        {feedback && (
          <p className={`nf-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="nf-wishlist">
        {!loaded && <p className="nf-feedback">{t("loadingWishes", lang)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="nf-feedback">{lang === "en" ? `No wishes yet. Be the first to write one for ${coupleName || "the couple"}.` : `Belum ada ucapan. Jadilah yang pertama untuk ${coupleName || "kedua mempelai"}.`}</p>
        )}

        {pagedWishes.map((wish) => (
          <article className="nf-wish" key={wish.id}>
            <header className="nf-wish__head">
              <span className="nf-wish__name">{wish.name || t("honoredGuest", lang)}</span>
              <span className="nf-wish__date">{formatWishAgo(wish.created_at, lang)}</span>
            </header>
            <p className="nf-wish__text">{wish.message}</p>
          </article>
        ))}

        {totalPages > 1 && (
          <div className="nf-pager">
            <button
              type="button"
              className="nf-pager__btn"
              aria-label={t("previousPage", lang)}
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
