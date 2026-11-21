"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { wishNameState } from "../shared/wishName"
import { t } from "@/lib/i18n"

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

const PAGE_SIZE = 5
const MAX_CHARS = 500
const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    name: "The Albarn Family",
    message: "Wishing you a lifetime of gentleness, laughter, and the kind of love that only grows quieter and deeper with time.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "A Friend of Faye",
    message: "Finally! We have watched this story unfold from the very first chapter. Congratulations, you two.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "David's Old Colleague",
    message: "May your home always be warm, your table always full, and your patience always longer than the queue at the airport.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "The Reed Family",
    message: "With all our love and blessings for the road ahead. We are so happy for you both.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "An Old Friend",
    message: "From the people who watched you become who you are, congratulations, and all of our love.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
  },
  {
    id: "demo-6",
    name: "The Garden Club",
    message: "May your marriage grow like the garden we planted together, slowly, patiently, and in every season.",
    created_at: new Date(Date.now() - 518_400_000).toISOString(),
  },
  {
    id: "demo-7",
    name: "Faye's Godmother",
    message: "I have prayed for this day since you were small. Be kind to one another, and laugh often.",
    created_at: new Date(Date.now() - 604_800_000).toISOString(),
  },
  {
    id: "demo-8",
    name: "The Southworths",
    message: "Congratulations on finding the person who makes ordinary afternoons feel like celebrations.",
    created_at: new Date(Date.now() - 691_200_000).toISOString(),
  },
  {
    id: "demo-9",
    name: "A Neighbour",
    message: "May your home always have a full pot of tea and an open door for the people you love.",
    created_at: new Date(Date.now() - 777_600_000).toISOString(),
  },
  {
    id: "demo-10",
    name: "David's Sister",
    message: "You got the good one, and she got the good one. That is rare. Take care of each other.",
    created_at: new Date(Date.now() - 864_000_000).toISOString(),
  },
  {
    id: "demo-11",
    name: "The Choir",
    message: "Wishing you a life that sings. We will be at the front row, loudly and proudly.",
    created_at: new Date(Date.now() - 950_400_000).toISOString(),
  },
  {
    id: "demo-12",
    name: "Work Friends",
    message: "Thank you for always leaving the last slice. Now you have a lifetime of slices to share.",
    created_at: new Date(Date.now() - 1_036_800_000).toISOString(),
  },
]

function wishAgo(iso: string | undefined, lang: "id" | "en"): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return lang === "en" ? "Just now" : "Baru saja"
  if (minutes < 60) return lang === "en" ? `${minutes} min ago` : `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return lang === "en" ? `${hours} hr ago` : `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return lang === "en" ? `${days} day${days === 1 ? "" : "s"} ago` : days === 1 ? "1 hari lalu" : `${days} hari lalu`
}

export default function Wishes({ weddingProfileId, guestId, guestName, guestLinkStrict, coupleName , language = "id"}: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  // Terbatas links prefill and lock the name; fleksibel links keep it editable.
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
    return () => {
      cancelled = true
    }
  }, [weddingProfileId])

  const send = useCallback(async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId || weddingProfileId === DEMO_ID) {
      setStatus("done")
      setFeedback(language === "en" ? "Preview mode, your wish was not saved." : "Mode pratinjau, ucapan tidak disimpan.")
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
          name: name.trim() || guestName || t("honoredGuest", language),
          message: text,
          source: "invitation",
        }),
      })
      if (response.status === 409) {
        setStatus("error")
        setFeedback(language === "en" ? "You have already sent a wish. Thank you for the love and the prayers." : "Anda sudah mengirim ucapan. Terima kasih atas cinta dan doanya.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback(t("thanksForWish", language))
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback(language === "en" ? "Too many messages right now. Please try again in a moment." : "Terlalu banyak pesan saat ini. Silakan coba lagi sebentar lagi.")
    } catch {
      setStatus("error")
      setFeedback(t("wishFailed", language))
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <div className="eg-wishes">
      <form
        className="eg-wishes__form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="eg-field">
          <label htmlFor="eg-wish-name">{language === "en" ? "Name" : "Nama"}</label>
          <input
            id="eg-wish-name"
            className="eg-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={language === "en" ? "Your name" : "Nama Anda"}
            maxLength={80}
            autoComplete="name"
            readOnly={nameLocked}
            aria-readonly={nameLocked}
          />
        </div>

        <div className="eg-field">
          <label htmlFor="eg-wish-message">{t("secWishes", language)}</label>
          <textarea
            id="eg-wish-message"
            className="eg-input eg-textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={t("writeWish", language)}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="eg-counter">{message.length} / {MAX_CHARS}</p>
        </div>

        <button type="submit" className="eg-pill eg-wishes__submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", language) : t("sendWishes", language)}
        </button>

        {feedback && (
          <p className={`eg-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="eg-wishes__feed">
        {!loaded && <p className="eg-wishes__empty">{t("loading", language)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="eg-wishes__empty">
            {language === "en" ? `No wishes yet. Be the first to write one for ${coupleName || "the couple"}.` : `Belum ada ucapan. Jadilah yang pertama untuk ${coupleName || "kedua mempelai"}.`}
          </p>
        )}

        {wishes.length > 0 && (
          <>
            <div className="eg-wishes__scroller">
              {pagedWishes.map((wish) => (
                <article className="eg-wish" key={wish.id}>
                  <header className="eg-wish__head">
                    <span className="eg-wish__name">{wish.name || t("honoredGuest", language)}</span>
                    <span className="eg-wish__date">{wishAgo(wish.created_at, language)}</span>
                  </header>
                  <p className="eg-wish__text">{wish.message}</p>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="eg-wishes__pager">
                <button
                  type="button"
                  className="eg-pager-btn"
                  aria-label={language === "en" ? "Previous page" : "Halaman sebelumnya"}
                  disabled={currentPage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  ‹
                </button>
                <span className="eg-pager-info">{currentPage + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="eg-pager-btn"
                  aria-label={language === "en" ? "Next page" : "Halaman berikutnya"}
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
