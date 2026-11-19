"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { timeAgo } from "../shared/lib"
import { wishNameState } from "../shared/wishName"

type Wish = { id: string; name: string | null; message: string; created_at: string }

type Props = {
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  guestLinkStrict?: boolean
  title: string
  intro: string
  namePlaceholder: string
  messagePlaceholder: string
  submitLabel: string
  moreLabel: string
  emptyLabel: string
}

const PAGE_SIZE = 10

export default function Wishes({
  weddingProfileId,
  guestId,
  guestName,
  guestLinkStrict,
  title,
  intro,
  namePlaceholder,
  messagePlaceholder,
  submitLabel,
  moreLabel,
  emptyLabel,
}: Props) {
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
    if (!weddingProfileId) return
    if (weddingProfileId === "demo-wedding-profile-id") {
      setWishes([
        {
          id: "1",
          name: "Keluarga Bapak Leonardo",
          message: "Semoga bahagia selalu, menjadi keluarga yang penuh berkah.",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "2",
          name: "Teman Kuliah",
          message: "Akhirnya menikah juga! Selamat ya, semoga langgeng selalu.",
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "3",
          name: "Rekan Kerja",
          message: "Selamat menempuh hidup baru. Semoga diberkahi dan bahagia.",
          created_at: new Date(Date.now() - 259200000).toISOString(),
        },
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
      setFeedback("Mode pratinjau, ucapan tidak tersimpan.")
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
          name: name.trim() || guestName || "Tamu Undangan",
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409 || res.ok) {
        setStatus("done")
        setFeedback(res.ok ? "Tersimpan, menunggu moderasi" : "Terima kasih! Ucapan Anda telah tersampaikan.")
        setMessage("")
        window.setTimeout(() => {
          setStatus("idle")
          setFeedback("")
        }, 4000)
      } else {
        setStatus("error")
        setFeedback("Terlalu banyak kiriman. Coba lagi nanti.")
      }
    } catch {
      setStatus("error")
      setFeedback("Gagal terkirim. Periksa koneksi Anda.")
    }
  }, [weddingProfileId, guestId, guestName, name, message, status])

  const totalPages = Math.max(1, Math.ceil(wishes.length / PAGE_SIZE))
  const paged = useMemo(() => wishes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [wishes, page])

  return (
    <section className="wedding-wish-wrap" id="toRsvp" data-section-order="wedding_wish">
      <div className="wedding-wish-inner">
        <div className="wedding-wish-head">
          <h1 className="wedding-wish-title">{title}</h1>
          {intro ? <p className="wedding-wish-description">{intro}</p> : null}
        </div>
        <div className="wedding-wish-body">
          <div className="wedding-wish-form">
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                void send()
              }}
            >
              <div className="form-group guest-name-wrap">
                <input
                  type="text"
                  className="form-control guest-name"
                  name="name"
                  placeholder={namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={nameLocked}
                  maxLength={80}
                />
              </div>
              <div className="form-group guest-comment-wrap">
                <textarea
                  className="form-control guest-comment no-scrollbar"
                  name="comment"
                  rows={2}
                  placeholder={messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="submit-comment-wrap">
                <button type="submit" className="submit submit-comment" disabled={!message.trim() || status === "sending"}>
                  {status === "sending" ? "…" : submitLabel}
                </button>
              </div>
              {feedback ? <p className={`sw-wishes__feedback is-${status}`}>{feedback}</p> : null}
            </form>
          </div>
          <div className="comment-inner-wrapping">
            <div className={`comment-wrap${wishes.length ? " show" : ""}`}>
              {paged.map((wish) => (
                <div className="comment-item" key={wish.id}>
                  <div className="comment-head">
                    <p className="comment-name">{wish.name || "Tamu Undangan"}</p>
                    <span className="comment-date">{timeAgo(wish.created_at)}</span>
                  </div>
                  <div className="comment-body">
                    <p className="comment-caption">{wish.message}</p>
                  </div>
                </div>
              ))}
              {loaded && !wishes.length ? <p className="sw-wishes__empty">{emptyLabel}</p> : null}
            </div>
            {totalPages > 1 ? (
              <div className="more-comment-wrap show">
                {page < totalPages - 1 ? (
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                    {moreLabel}
                  </button>
                ) : null}
                {page > 0 ? (
                  <button type="button" className="sw-wishes__less" onClick={() => setPage((p) => Math.max(0, p - 1))}>
                    Tutup
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
