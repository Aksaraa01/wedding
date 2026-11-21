"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"
import { normalizeLanguage, t } from "@/lib/i18n"

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
  lang?: "EN" | "ID" | "id" | "en"
  language?: "id" | "en" | string
}

const PAGE_SIZE = 5
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
    name: "University Friends",
    message: "Finally! Wishing you both all the happiness in the world. We cannot wait to celebrate with you.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Colleagues",
    message: "May your marriage be filled with blessings, patience, and endless joy.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

function wishAgo(iso: string | undefined, language: "id" | "en" = "id"): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return language === "en" ? "now" : "baru saja"
  if (minutes < 60) return language === "en" ? `${minutes}m` : `${minutes} mnt`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return language === "en" ? `${hours}h` : `${hours} jam`
  const days = Math.floor(hours / 24)
  return language === "en" ? `${days}d` : `${days} hr`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, lang: langProp , language = "id"}: Props) {
  const lang = normalizeLanguage(language || langProp || "id")
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
      .then((r) => (r.ok ? r.json() : null))
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
  const paged = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="aj-wishes">
      <p className="aj-wishes__intro">
        {lang === "id"
          ? `Tinggalkan pesan cinta dan doa untuk ${coupleName || "kedua mempelai"}.`
          : `Leave a message of love and a prayer for ${coupleName || "the couple"}.`}
      </p>

      <form
        className="aj-wishes__form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          className="aj-wishes__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === "id" ? "Nama Anda" : "Your name"}
          maxLength={80}
          autoComplete="name"
          aria-label={lang === "id" ? "Nama" : "Name"}
          readOnly={nameLocked}
          aria-readonly={nameLocked}
        />
        <textarea
          className="aj-wishes__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
          placeholder={lang === "id" ? "Tulis ucapan & doa" : "Write your wishes"}
          rows={2}
          maxLength={MAX_CHARS}
          aria-label={lang === "id" ? "Ucapan" : "Wishes"}
        />
        <div className="aj-wishes__row">
          <span className="aj-wishes__count">{message.length}/{MAX_CHARS}</span>
          <button type="submit" className="aj-wishes__submit" disabled={status === "sending" || !message.trim()}>
            {status === "sending" ? (lang === "id" ? "Mengirim..." : "Sending...") : lang === "id" ? "Kirim" : "Send"}
          </button>
        </div>
        {feedback && <p className={`aj-wishes__feedback${status === "error" ? " is-error" : ""}`}>{feedback}</p>}
      </form>

      <div className="aj-wishes__list">
        {!loaded && <p className="aj-wishes__empty">{t("loadingWishes", lang)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="aj-wishes__empty">
            {t("noWishesYet", lang)}
          </p>
        )}
        {paged.map((wish) => (
          <article key={wish.id} className="aj-wishes__item">
            <div className="aj-wishes__meta">
              <b>{wish.name || (lang === "id" ? "Tamu" : "Guest")}</b>
              <span>{wishAgo(wish.created_at, lang)}</span>
            </div>
            <p>{wish.message}</p>
          </article>
        ))}
        {totalPages > 1 && (
          <div className="aj-wishes__pager">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} aria-label={t("previousPage", lang)}>
              ‹
            </button>
            <span>{currentPage + 1} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} aria-label={t("nextPage", lang)}>
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
