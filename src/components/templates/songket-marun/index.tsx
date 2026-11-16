"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  countdownTarget,
  coverPhoto,
  formatDotDate,
  formatLongDate,
  gcalLink,
  groomPhoto,
} from "../shared/lib"
import { useWishes } from "../shared/kids/useWishes"
import "./songket-marun.css"

const pad2 = (n: number) => String(n).padStart(2, "0")

function Clock({ target }: { target: Date | null }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!target) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  const diff = target && now !== null ? Math.max(0, target.getTime() - now) : 0
  const units = [
    { value: Math.floor(diff / 86400000), label: "Hari" },
    { value: Math.floor((diff % 86400000) / 3600000), label: "Jam" },
    { value: Math.floor((diff % 3600000) / 60000), label: "Menit" },
    { value: Math.floor((diff % 60000) / 1000), label: "Detik" },
  ]

  return (
    <div className="skm-clock" aria-label="Hitung mundur hari bahagia">
      {units.map((u) => (
        <div className="skm-clock__cell" key={u.label}>
          <span className="skm-clock__value">{target ? pad2(u.value) : "--"}</span>
          <small className="skm-clock__label">{u.label}</small>
        </div>
      ))}
    </div>
  )
}

export default function SongketMarun(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [wishName, setWishName] = useState("")
  const [wishMessage, setWishMessage] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const labels = profile.event_labels || eventLabels(profile.event_type, profile.subject_gender)

  const childName = (profile.groom_name || "").trim() || "Ananda"
  const childFull = (profile.groom_full_name || childName).trim()
  const parents = (profile.groom_parents || "").trim()
  const guestName = (profile.guest_name || "").trim() || labels.guestFallback
  const cover = coverPhoto(profile)
  const portrait = groomPhoto(profile.groom_photo_url)

  const eventDate = (profile.estimated_wedding_date || "").trim()
  const events = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const target = useMemo(() => countdownTarget(events, eventDate), [events, eventDate])
  const calendarUrl = useMemo(() => gcalLink(events[0], childName), [events, childName])

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean).slice(0, 9) : []),
    [profile.gallery_photos]
  )

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()

  const coverKicker = (tc.cover_kicker || "").trim() || labels.coverKicker
  const coverGuestLabel = (tc.cover_guest_label || "").trim() || "Kepada Yth. Bapak/Ibu/Saudara/i"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const salam =
    (tc.opening_salam || "").trim() ||
    "Assalamu'alaikum Warahmatullahi Wabarakatuh"
  const openingTitle = (profile.opening_title || "").trim()
  const openingDescription =
    (profile.opening_description || "").trim() ||
    `Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan ${labels.eventNoun.toLowerCase()} ${labels.subjectPossessive.toLowerCase()} tercinta. Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir.`
  const eventsTitle = (tc.events_title || "").trim() || "Waktu & Tempat"
  const eventsIntro = (tc.events_intro || "").trim() || "Kami menantikan kehadiran dan doa restu Anda."
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const galleryTitle = (tc.gallery_title || "").trim() || "Momen Bahagia"
  const galleryIntro = (tc.gallery_intro || "").trim() || "Kepingan kecil yang ingin kami bagikan."
  const wishesIntro = (tc.wishes_intro || "").trim() || "Tuliskan doa dan ucapan terbaik Anda untuk ananda."
  const giftIntro =
    (tc.gift_intro_description || "").trim() ||
    "Doa restu Anda adalah hadiah terindah. Bila ingin memberi lebih, kami menerimanya dengan penuh rasa syukur."
  const closingText =
    (tc.closing_message || "").trim() ||
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu. Atas kehadiran dan doanya kami ucapkan terima kasih."
  const apology =
    (tc.cover_apology || "").trim() ||
    "Mohon maaf apabila ada kesalahan penulisan nama atau gelar."
  const familyLabel = (tc.closing_family_label || "").trim() || "Kami yang berbahagia"

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const wishes = useWishes(profile.wedding_profile_id, profile.guest_id)

  const showDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  const playMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    )
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    playMusic()
  }, [playMusic])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else {
      audio.pause()
      setPlaying(false)
    }
  }, [playMusic])

  const copyText = useCallback(
    async (value: string, message: string) => {
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  const submitWish = useCallback(async () => {
    const ok = await wishes.send(wishName || guestName, wishMessage)
    if (ok) setWishMessage("")
  }, [wishes, wishName, guestName, wishMessage])

  useEffect(() => {
    document.body.classList.toggle("skm-locked", !opened)
    return () => document.body.classList.remove("skm-locked")
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-skm-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened, gallery.length, accounts.length, wishes.wishes.length])

  return (
    <div ref={rootRef} className={`skm-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      {!opened && (
        <section className="skm-cover" aria-label={coverKicker}>
          <img className="skm-cover__photo" src={cover} alt="" aria-hidden="true" draggable={false} />
          <div className="skm-cover__veil" />
          <div className="skm-cover__inner">
            <p className="skm-kicker">{coverKicker}</p>
            <div className="skm-rule" aria-hidden="true"><span /></div>
            <h1 className="skm-cover__name">{childName}</h1>
            <p className="skm-cover__date">{formatLongDate(eventDate)}</p>
            <p className="skm-cover__guest">
              {coverGuestLabel}
              <strong>{guestName}</strong>
            </p>
            <button type="button" className="skm-open" onClick={openInvitation}>
              {openLabel}
            </button>
          </div>
        </section>
      )}

      {opened && (
        <main>
          <section className="skm-section skm-opening skm-center" data-skm-reveal>
            <div className="skm-weave" aria-hidden="true" />
            <p className="skm-kicker" style={{ color: "#8a6d2f" }}>{salam}</p>
            <div className="skm-opening__photo">
              <img src={portrait} alt={childFull} draggable={false} />
            </div>
            {openingTitle && <h2 className="skm-opening__title">{openingTitle}</h2>}
            <p className="skm-salam">{openingDescription}</p>
            <div className="skm-rule" aria-hidden="true"><span /></div>
            <p className="skm-ananda__of">{apology}</p>
          </section>

          {quoteText && (
            <section className="skm-quote" data-skm-reveal>
              <div className="skm-weave" aria-hidden="true" />
              <p className="skm-quote__text">&ldquo;{quoteText}&rdquo;</p>
              {quoteSource && <p className="skm-quote__source">{quoteSource}</p>}
            </section>
          )}

          <section className="skm-section skm-ananda skm-center" data-skm-reveal>
            <p className="skm-kicker" style={{ color: "#8a6d2f" }}>{labels.subjectPossessive}</p>
            <h2 className="skm-section__title" style={{ color: "var(--skm-maroon)" }}>{labels.subjectLabel}</h2>
            <div className="skm-portrait">
              <div className="skm-portrait__img">
                <img src={portrait} alt={childFull} draggable={false} />
              </div>
            </div>
            <p className="skm-ananda__name">{childFull}</p>
            {parents && (
              <>
                <p className="skm-ananda__of">{labels.subjectOf}</p>
                <p className="skm-ananda__parents">{parents}</p>
              </>
            )}
          </section>

          <section className="skm-section skm-events skm-center" data-skm-reveal>
            <p className="skm-kicker">Rangkaian Acara</p>
            <h2 className="skm-section__title">{eventsTitle}</h2>
            <p className="skm-section__intro">{eventsIntro}</p>
            {events.map((session, i) => (
              <article className="skm-event" key={`${session.name || "acara"}-${i}`}>
                <h3 className="skm-event__name">{session.name || labels.mainEventName}</h3>
                {session.date && <p className="skm-event__date">{formatLongDate(session.date)}</p>}
                {session.time && <p className="skm-event__time">{session.time}</p>}
                {(session.venue || session.address) && (
                  <p className="skm-event__where">
                    {session.venue && <strong>{session.venue}</strong>}
                    {session.venue && session.address ? <br /> : null}
                    {session.address}
                  </p>
                )}
                {session.maps_url && (
                  <a className="skm-event__maps" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                    {mapsLabel}
                  </a>
                )}
              </article>
            ))}
            {calendarUrl && (
              <a className="skm-event__maps" href={calendarUrl} target="_blank" rel="noreferrer noopener">
                Simpan Tanggal
              </a>
            )}
          </section>

          {target && (
            <section className="skm-section skm-countdown skm-center" data-skm-reveal>
              <p className="skm-kicker">{labels.countdownLabel}</p>
              <div className="skm-rule" aria-hidden="true"><span /></div>
              <Clock target={target} />
            </section>
          )}

          {gallery.length > 0 && (
            <section className="skm-section skm-gallery skm-center" data-skm-reveal>
              <p className="skm-kicker" style={{ color: "#8a6d2f" }}>Galeri</p>
              <h2 className="skm-section__title" style={{ color: "var(--skm-maroon)" }}>{galleryTitle}</h2>
              <p className="skm-section__intro">{galleryIntro}</p>
              <div className="skm-grid">
                {gallery.map((src, i) => (
                  <figure key={`${src}-${i}`}>
                    <img src={src} alt="" loading="lazy" draggable={false} />
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section className="skm-section skm-wishes skm-center" data-skm-reveal>
            <p className="skm-kicker" style={{ color: "#8a6d2f" }}>Doa & Ucapan</p>
            <h2 className="skm-section__title" style={{ color: "var(--skm-maroon)" }}>{labels.wishesTitle}</h2>
            <p className="skm-section__intro">{wishesIntro}</p>
            <div className="skm-wish-form">
              <input
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                placeholder="Nama Anda"
                aria-label="Nama Anda"
              />
              <textarea
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                placeholder="Tulis doa & ucapan…"
                aria-label="Doa dan ucapan"
              />
              <button
                type="button"
                className="skm-wish-submit"
                onClick={submitWish}
                disabled={wishes.state === "sending" || !wishMessage.trim()}
              >
                {wishes.state === "sending" ? "Mengirim…" : "Kirim Ucapan"}
              </button>
              {wishes.feedback && <p className="skm-wish-note">{wishes.feedback}</p>}
            </div>
            <div className="skm-wish-list">
              {!wishes.loaded ? (
                <p className="skm-wish-empty">Memuat ucapan…</p>
              ) : wishes.wishes.length === 0 ? (
                <p className="skm-wish-empty">Belum ada ucapan. Jadilah yang pertama.</p>
              ) : (
                wishes.wishes.map((w) => (
                  <div className="skm-wish" key={w.id}>
                    <span className="skm-wish__time">{formatDotDate(w.created_at)}</span>
                    <div className="skm-wish__name">{w.name || labels.guestFallback}</div>
                    <p className="skm-wish__text">{w.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {hasGift && (
            <section className="skm-section skm-gift skm-center" data-skm-reveal>
              <p className="skm-kicker">{labels.giftTitle}</p>
              <h2 className="skm-section__title">{labels.giftTitle}</h2>
              <p className="skm-section__intro">{giftIntro}</p>
              {accounts.map((acc, i) => (
                <div className="skm-gift__card" key={`${acc.account_number || acc.provider_name || "acc"}-${i}`}>
                  <p className="skm-gift__bank">{acc.provider_name}</p>
                  <p className="skm-gift__number">{acc.account_number}</p>
                  <p className="skm-gift__owner">{acc.account_name}</p>
                  <button
                    type="button"
                    className="skm-gift__copy"
                    onClick={() => copyText(acc.account_number || "", "Nomor rekening disalin")}
                  >
                    Salin Nomor
                  </button>
                </div>
              ))}
              {giftAddress && (
                <div className="skm-gift__card">
                  <p className="skm-gift__bank">Kirim Hadiah</p>
                  <p className="skm-gift__address">{giftAddress}</p>
                  <button
                    type="button"
                    className="skm-gift__copy"
                    onClick={() => copyText(giftAddress, "Alamat disalin")}
                  >
                    Salin Alamat
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="skm-section skm-closing skm-center" data-skm-reveal>
            <div className="skm-rule" aria-hidden="true"><span /></div>
            <p className="skm-closing__text">{closingText}</p>
            <p className="skm-closing__family">{familyLabel}</p>
            <p className="skm-closing__names">{parents || childFull}</p>
          </section>

          <p className="skm-footer">
            {labels.brand} · {labels.site.replace("https://", "")}
          </p>
        </main>
      )}

      {opened && trackUrl && (
        <button
          type="button"
          className={`skm-music${playing ? " skm-music--playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {playing ? "music_note" : "music_off"}
          </span>
        </button>
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 78,
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "10px 18px",
            background: "rgba(50,10,17,0.92)",
            color: "#f8f0e2",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            border: "1px solid rgba(230,205,139,0.6)",
          }}
        >
          {toast}
        </div>
      )}

      {showDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName}
          coupleName={childName}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message}
          rsvpMaxPax={profile.rsvp_max_pax}
          qrEnabled={Boolean(gates.qr_code_book)}
        />
      )}
    </div>
  )
}
