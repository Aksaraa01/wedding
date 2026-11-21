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
    name: "Keluarga Sandhya",
    message: "Semoga keluarga kalian dipenuhi kasih, sukacita, dan kedamaian. Selamat menempuh hidup baru!",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Sahabat Joseph",
    message: "Akhirnya! Semoga kebahagiaan selalu menyertai kalian. Kami tidak sabar merayakan bersama.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Rekan Joseph",
    message: "Semoga pernikahan kalian dipenuhi keberkahan, kesabaran, dan kebahagiaan. Selamat!",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "Keluarga Besar Sandhya",
    message: "Sangat bahagia untuk kalian berdua. Semoga rumah tangga kalian penuh tawa dan kasih.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "Sahabat Lama",
    message: "Dari kami yang menyaksikan kisah kalian, selamat dan semua cinta kami.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
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
        setFeedback(language === "en" ? "You have already sent a wish. Thank you for your love and prayers." : "Anda sudah mengirim ucapan. Terima kasih atas cinta dan doanya.")
        return
      }
      if (response.ok) {
        setStatus("done")
        setFeedback((language === "en" ? "Thank you! Your wish will appear after moderation." : "Terima kasih! Ucapan Anda akan tampil setelah moderasi."))
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 5000)
        return
      }
      setStatus("error")
      setFeedback(language === "en" ? "Too many messages right now. Please try again shortly." : "Terlalu banyak pesan saat ini. Silakan coba lagi sebentar lagi.")
    } catch {
      setStatus("error")
      setFeedback(language === "en" ? "Failed to send your wish. Please check your connection." : "Gagal mengirim ucapan. Periksa koneksi Anda.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedWishes = useMemo(
    () => wishes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [wishes, currentPage]
  )

  return (
    <section className="tpl-rsvp adat-rsvp" id="rsvp">
      <form
        className="tpl-rsvp__form"
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void send()
        }}
      >
        <div className="tpl-rsvp__field">
          <label htmlFor="adat-bali-rsvp-name">{language === "en" ? "Name" : "Nama"}</label>
          <input
            id="adat-bali-rsvp-name"
            className="tpl-rsvp__input"
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

        <div className="tpl-rsvp__field">
          <label htmlFor="adat-bali-rsvp-message">{t("secWishes", language)}</label>
          <textarea
            id="adat-bali-rsvp-message"
            className="tpl-rsvp__textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
            placeholder={t("writeWish", language)}
            rows={4}
            maxLength={MAX_CHARS}
          />
          <p className="tpl-rsvp__counter">{message.length} / {MAX_CHARS}</p>
        </div>

        <button type="submit" className="tpl-rsvp__submit" disabled={status === "sending" || !message.trim()}>
          {status === "sending" ? t("sending", language) : t("sendWishes", language)}
        </button>

        {feedback && (
          <p className={`rsvp-feedback${status === "error" ? " is-error" : ""}`} role="status">
            {feedback}
          </p>
        )}
      </form>

      <div className="tpl-rsvp__wishes">
        {!loaded && <p className="adat-rsvp__empty">{t("loading", language)}</p>}
        {loaded && wishes.length === 0 && (
          <p className="adat-rsvp__empty">
            {language === "en"
              ? `No wishes yet. Be the first for ${coupleName || "the couple"}.`
              : `Belum ada ucapan. Jadilah yang pertama untuk ${coupleName || "kedua mempelai"}.`}
          </p>
        )}

        {wishes.length > 0 && (
          <>
            <div className="tpl-rsvp__wishes-list">
              {pagedWishes.map((wish) => (
                <div className="tpl-rsvp__wish" key={wish.id}>
                  <div className="tpl-rsvp__wish-header">
                    <div className="tpl-rsvp__wish-name">{wish.name || t("honoredGuest", language)}</div>
                    <div className="tpl-rsvp__wish-date">{wishAgo(wish.created_at, language)}</div>
                  </div>
                  <div className="tpl-rsvp__wish-message">{wish.message}</div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="tpl-rsvp__wishes-pagination">
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
                  aria-label={language === "en" ? "Previous page" : "Halaman sebelumnya"}
                  disabled={currentPage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  ‹
                </button>
                <span className="tpl-rsvp__wishes-pg-info">{currentPage + 1} / {totalPages}</span>
                <button
                  type="button"
                  className="tpl-rsvp__wishes-pg-btn"
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
    </section>
  )
}
