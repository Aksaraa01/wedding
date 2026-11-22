"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { normalizeLanguage, t, tf } from "@/lib/i18n"
import { timeAgo } from "../shared/lib"
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
  language?: string
  title?: string
  intro?: string
}

const PAGE_SIZE = 10

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, language = "id", title, intro }: Props) {
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
    if (weddingProfileId === "demo-wedding-profile-id") {
      setWishes([
        { id: "1", name: "Keluarga Bapak Leonardo", message: "Semoga bahagia selalu, Vincent & Felicia!", created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: "2", name: "Teman Kuliah Felicia", message: "Akhirnya menikah juga! Selamat ya!", created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: "3", name: "Rekan Kerja Vincent", message: "Selamat menempuh hidup baru. Semoga diberkahi.", created_at: new Date(Date.now() - 259200000).toISOString() },
      ])
      setLoaded(true)
      return
    }
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(weddingProfileId)}&status=approved`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setWishes(Array.isArray(data?.wishes) ? data.wishes : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [weddingProfileId])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId || weddingProfileId === "demo-wedding-profile-id") {
      setStatus("done")
      setFeedback(lang === "en" ? "Preview mode — wishes are not saved." : "Mode pratinjau, ucapan tidak tersimpan.")
      setMessage("")
      window.setTimeout(() => {
        setStatus("idle")
        setFeedback("")
      }, 4000)
      return
    }
    setStatus("sending")
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
      if (res.status === 409 || res.ok) {
        setStatus("done")
        setFeedback(res.ok ? (lang === "en" ? "Saved, awaiting moderation." : "Tersimpan, menunggu moderasi") : t("thanksForWish", lang))
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 4000)
      } else {
        setStatus("error")
        setFeedback(lang === "en" ? "Too many submissions. Please try again later." : "Terlalu banyak kiriman. Coba lagi nanti.")
      }
    } catch {
      setStatus("error")
      setFeedback(t("wishFailed", lang))
    }
  }, [weddingProfileId, guestId, guestName, name, message, status, lang])

  const totalPages = Math.ceil(wishes.length / PAGE_SIZE) || 1
  const pagedWishes = wishes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <section className="sheet__section sheet__section--wishes" data-io>
      <h3 className="display story__heading">{title || t("secWishes", lang)}</h3>
      <p className="wishes__intro serif-i">{intro || (lang === "en" ? "Leave your best wishes and prayers for us here." : "Berikan harapan dan doa terbaikmu di sini untuk kami berdua.")}</p>

      <form
        className="wishes__form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void send()
        }}
      >
        <label className="wishes__field">
          <span className="wishes__label">{lang === "en" ? "Name" : "Nama"}</span>
          <input
            className="wishes__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === "en" ? "Your name" : "Nama Anda"}
            maxLength={80}
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </label>

        <label className="wishes__field">
          <span className="wishes__label">{lang === "en" ? "Wishes & Prayers" : "Ucapan & Doa"}</span>
          <textarea
            className="wishes__textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder={t("writeWish", lang)}
            rows={4}
          />
        </label>
        <p className="wishes__count">{message.length} / 500</p>

        <button type="submit" className="wishes__submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", lang) : t("sendWishes", lang)}
        </button>

        {feedback && <p className={`wishes__feedback${status === "error" ? " is-error" : ""}`}>{feedback}</p>}
      </form>

      {!loaded && weddingProfileId && <p className="wishes__empty">{lang === "en" ? "Loading wishes…" : "Memuat doa & ucapan…"}</p>}

      {loaded && wishes.length === 0 && <p className="wishes__empty">{lang === "en" ? "No wishes yet. Be the first!" : "Belum ada doa & ucapan. Jadilah yang pertama!"}</p>}

      {wishes.length > 0 && (
        <div className="wishes__feed">
          <ul className="wishes__list">
            {pagedWishes.map((w, i) => (
              <li key={w.id} className={`wishes__item${i % 2 === 1 ? " wishes__item--alt" : ""}`}>
                <p className="wishes__name">{w.name || t("honoredGuest", lang)}</p>
                <p className="wishes__meta">{timeAgo(w.created_at, lang)}</p>
                <p className="wishes__message">{w.message}</p>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="wishes__pager">
              <button
                type="button"
                className="wishes__page"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label={t("prevPhoto", lang)}
              >
                ‹
              </button>
              <span className="wishes__page-label">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="wishes__page"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                aria-label={t("nextPhoto", lang)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
