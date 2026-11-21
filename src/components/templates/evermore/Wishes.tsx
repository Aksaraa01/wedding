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

const PAGE_SIZE = 5
const MAX_CHARS = 180
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Albarn Family",
    message: "Wishing you a lifetime of love, laughter, and togetherness. Congratulations, David & Faye!",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Faye's University Friends",
    message: "Finally! Wishing you both all the happiness in the world. We cannot wait to celebrate with you.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "David's Colleagues",
    message: "May your marriage be filled with blessings, patience, and endless joy. Congratulations!",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "The Reed Family",
    message: "A beautiful beginning for two wonderful people. See you at the celebration.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "Nadia & Raka",
    message: "Semoga cinta dan sabar selalu punya ruang paling besar di rumah kalian.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
  },
  {
    id: "demo-6",
    name: "The Albarn Cousins",
    message: "Turut berbahagia untuk kalian. Semoga selalu saling memilih dalam setiap musim.",
    created_at: new Date(Date.now() - 518_400_000).toISOString(),
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
        setFeedback(lang === "en" ? "You have already sent your wishes. Thank you for your love and prayers." : "Anda sudah mengirim ucapan. Terima kasih atas doa dan cintanya.")
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
    <>
      <form
        className="rsvp-form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <>
          <label htmlFor="evermore-wish-name">{lang === "en" ? "Name" : "Nama"}</label>
          <input
            id="evermore-wish-name"
            className="rsvp-field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={lang === "en" ? "Enter your name" : "Nama Anda"}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </>

        <label htmlFor="evermore-wish-message">{lang === "en" ? "Wishes & Prayers" : "Ucapan & Doa"}</label>
        <textarea
          id="evermore-wish-message"
          className="rsvp-field"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
          placeholder={t("writeWish", lang)}
          rows={4}
          maxLength={MAX_CHARS}
        />
        <p className="rsvp-counter">{message.length} / {MAX_CHARS}</p>

        <button type="submit" className="rsvp-submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", lang) : t("sendWishes", lang)}
        </button>

        {feedback && (
          <p className={`rsvp-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="rsvp-wishes">
        <p className="rsvp-wishes-heading">{title || (lang === "en" ? "Messages from our loved ones" : "Pesan dari orang-orang terkasih")}</p>

        {!loaded && <p className="rsvp-empty">{lang === "en" ? "Loading wishes…" : "Memuat doa & ucapan…"}</p>}
        {loaded && wishes.length === 0 && (
          <p className="rsvp-empty">{lang === "en" ? `No wishes yet. Be the first to leave one for ${coupleName || "the couple"}.` : `Belum ada doa & ucapan. Jadilah yang pertama untuk ${coupleName || "kedua mempelai"}.`}</p>
        )}

        {wishes.length > 0 && (
          <>
            <div className="rsvp-wish-list">
              {pagedWishes.map((wish, index) => (
                <article key={wish.id} className={`rsvp-wish${index % 2 === 1 ? " rsvp-wish-right" : ""}`}>
                  <p className="rsvp-wish-head">
                    <span className="rsvp-wish-name">{wish.name || t("honoredGuest", lang)}</span>
                    <span className="rsvp-wish-status">{timeAgo(wish.created_at, lang)}</span>
                  </p>
                  <p className="rsvp-wish-message">{wish.message}</p>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="rsvp-pagination" aria-label={lang === "en" ? "Wish pages" : "Halaman ucapan"}>
                <button className="rsvp-page-button" type="button" aria-label={t("prevPhoto", lang)} disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹</button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button className="rsvp-page-button" type="button" aria-label={t("nextPhoto", lang)} disabled={currentPage >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}>›</button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  )
}
