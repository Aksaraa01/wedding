"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { normalizeLanguage, t } from "@/lib/i18n"
import { timeAgo } from "../shared/lib"
import { wishNameState } from "../shared/wishName"

type Wish = {
  id: string
  name: string | null
  message: string
  created_at: string
  is_pinned?: boolean
}

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  coupleName?: string
  language?: string
  title?: string
  intro?: string
}

const PAGE_SIZE = 10
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Leonardo Family",
    message: "Wishing you a lifetime of love, laughter, and togetherness. Congratulations, Vincent & Felicia!",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Felicia's University Friends",
    message: "Finally! Wishing you both all the happiness in the world. We cannot wait to celebrate with you.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Vincent's Colleagues",
    message: "May your marriage be filled with blessings, patience, and endless joy. Congratulations!",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
]

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName, language = "id", title, intro }: Props) {
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
      setFeedback(lang === "en" ? "Preview mode, your wishes are not saved." : "Mode pratinjau, ucapan tidak tersimpan.")
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
        setFeedback(lang === "en" ? "You have already sent your wishes. Thank you for your love and prayers." : "Anda sudah mengirim ucapan. Terima kasih atas doa dan cintanya.")
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
      setFeedback(lang === "en" ? "Too many messages right now. Please try again in a moment." : "Terlalu banyak kiriman. Coba lagi nanti.")
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
    <section className="sheet__section sheet__section--wishes" data-io>
      <h3 className="display story__heading">{title || t("secWishes", lang)}</h3>
      <p className="wishes__intro serif-i">
        {intro || (lang === "en" ? `Leave a message of love and a prayer for ${coupleName || "the couple"}.` : `Tinggalkan pesan cinta dan doa untuk ${coupleName || "kedua mempelai"}.`)}
      </p>

      <div className="tpl-rsvp">
        <form
          className="tpl-rsvp__form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            void send()
          }}
        >
          <div className="tpl-rsvp__field">
            <label htmlFor="sandhya-wish-name">{lang === "en" ? "Name" : "Nama"}</label>
            <input
              id="sandhya-wish-name"
              className="tpl-rsvp__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "en" ? "Your name" : "Nama Anda"}
              maxLength={80}
              autoComplete="name"
              readOnly={nameLocked}
              aria-readonly={nameLocked}
            />
          </div>

          <div className="tpl-rsvp__field">
            <label htmlFor="sandhya-wish-message">{lang === "en" ? "Wishes & Prayers" : "Ucapan & Doa"}</label>
            <textarea
              id="sandhya-wish-message"
              className="tpl-rsvp__textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t("writeWish", lang)}
              rows={4}
              maxLength={MAX_CHARS}
            />
          </div>
          <p className="tpl-rsvp__counter">{message.length} / {MAX_CHARS}</p>

          <button type="submit" className="tpl-rsvp__submit" disabled={status === "sending" || !message.trim()}>
            {status === "sending" ? t("sending", lang) : t("sendWishes", lang)}
          </button>

          {feedback && (
            <p className={`tpl-rsvp__feedback${status === "error" ? " is-error" : ""}`} role="status">
              {feedback}
            </p>
          )}
        </form>

        {!loaded && weddingProfileId && <p className="tpl-rsvp__empty">{lang === "en" ? "Loading wishes…" : "Memuat doa & ucapan…"}</p>}
        {loaded && wishes.length === 0 && (
          <p className="tpl-rsvp__empty">{lang === "en" ? "No wishes yet. Be the first to leave one." : "Belum ada doa & ucapan. Jadilah yang pertama!"}</p>
        )}

        {wishes.length > 0 && (
          <div className="tpl-rsvp__wishes">
            <ul className="tpl-rsvp__wishes-list">
              {pagedWishes.map((wish) => (
                <li key={wish.id} className="tpl-rsvp__wish">
                  <div className="tpl-rsvp__wish-header">
                    <span className="tpl-rsvp__wish-name">{wish.name || t("honoredGuest", lang)}</span>
                    <span className="tpl-rsvp__wish-date">{timeAgo(wish.created_at, lang)}</span>
                  </div>
                  <p className="tpl-rsvp__wish-message">{wish.message}</p>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="tpl-rsvp__wishes-pagination">
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label={t("prevPhoto", lang)}
                >
                  ‹
                </button>
                <span className="tpl-rsvp__wishes-pg-info">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-label={t("nextPhoto", lang)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
