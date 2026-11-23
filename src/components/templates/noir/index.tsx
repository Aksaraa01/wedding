"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { copyPlainText } from "@/lib/clipboard"
import { resolveCoupleName } from "@/lib/coupleName"
import { normalizeLanguage, t } from "@/lib/i18n"
import InvitationOverlay from "@/components/InvitationOverlay"
import AutoplayYouTube from "../shared/AutoplayYouTube"
import {
  bridePhoto as bridePhotoOf,
  countdownTarget,
  coverPhoto,
  flattenPhotos,
  gcalLink,
  groomPhoto as groomPhotoOf,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./noir.css"

const GUEST_FALLBACK_ID = "Tamu Undangan"
const GUEST_FALLBACK_EN = "Guest"

const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const ID_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const pad2 = (n: number) => String(n).padStart(2, "0")

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return "th"
  const mod10 = n % 10
  if (mod10 === 1) return "st"
  if (mod10 === 2) return "nd"
  if (mod10 === 3) return "rd"
  return "th"
}

function parseDate(value?: string | null): Date | null {
  const raw = String(value || "").trim()
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function fullDate(value: string | null | undefined, lang: "id" | "en"): string {
  const d = parseDate(value)
  if (!d) return ""
  if (lang === "en") {
    return `${EN_DAYS[d.getDay()]}, ${EN_MONTHS[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())} ${d.getFullYear()}`
  }
  return `${ID_DAYS[d.getDay()]}, ${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function dateCard(value?: string, lang: "id" | "en" = "id") {
  const d = parseDate(value)
  if (!d) return null
  return {
    day: pad2(d.getDate()),
    month: (lang === "en" ? EN_MONTHS_SHORT : ID_MONTHS_SHORT)[d.getMonth()],
    year: String(d.getFullYear()),
    full: fullDate(value, lang),
  }
}

function youtubeId(url?: string | null): string {
  const raw = (url || "").trim()
  if (!raw) return ""
  const short = raw.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  if (short) return short[1]
  const v = raw.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (v) return v[1]
  const embed = raw.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)
  if (embed) return embed[1]
  return ""
}

function SectionHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="noir-head">
      <h2 className="noir-h2">{title}</h2>
      {intro ? <p className="noir-lead">{intro}</p> : null}
    </header>
  )
}

export default function Noir(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const gates = profile.feature_gates || {}
  const tc = profile.template_content || {}

  const groomShort = (profile.groom_name || "").trim()
  const brideShort = (profile.bride_name || "").trim()
  const coupleShort =
    [groomShort, brideShort].filter(Boolean).join(" & ") ||
    resolveCoupleName(profile) ||
    (lang === "en" ? "The Couple" : "Mempelai")
  const groomName = (profile.groom_full_name || groomShort).trim()
  const brideName = (profile.bride_full_name || brideShort).trim()
  const guestName = (profile.guest_name || "").trim()
  const guestLabel = guestName || (lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoOn, setVideoOn] = useState(false)
  const [giftTab, setGiftTab] = useState<"account" | "address">("account")
  const [toast, setToast] = useState("")

  const cover = coverPhoto(profile)
  const coverSlides = flattenPhotos(profile.cover_photos)
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const gallery = flattenPhotos(profile.gallery_photos)

  const sessions = (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue))
  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url))
      : []
  const rundown =
    profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).map((s) => String(s)).filter(Boolean)
      : []

  const giftOn = profile.gift_section_visible !== false
  const accounts = giftOn
    ? (profile.gift_accounts || []).filter((a) => a && (a.provider_name || a.account_number))
    : []
  const giftAddressName = (profile.gift_address_name || "").trim()
  const giftAddress = giftOn && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const dresscodeOn = profile.dresscode_visible !== false
  const dresscode = dresscodeOn ? profile.dresscode : undefined
  const dresscodeColors = (dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const dresscodeTitle = tc.dresscode_title || dresscode?.title || t("secDresscode", lang)
  const dresscodeIntro = tc.dresscode_intro || dresscode?.description || ""
  const hasDresscode = dresscodeOn && (dresscodeColors.length > 0 || !!dresscodeIntro)

  const video = videoSource(profile.video_url)
  const hasVideo = !!video && gates.video !== false && profile.video_section_visible !== false
  const videoPoster = video ? youtubeId(video.src) : ""

  const ceremony = sessions[0]
  const coverDate = fullDate(profile.estimated_wedding_date || ceremony?.date, lang)
  // The countdown target is memoized by value: `sessions` is rebuilt on every
  // render, so depending on the array would restart the 1 s timer forever.
  const sessionDates = (profile.sessions || []).map((s) => (s?.date ? String(s.date) : "")).join("|")
  const targetMs = useMemo(
    () => countdownTarget(profile.sessions || [], profile.estimated_wedding_date)?.getTime() ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionDates, profile.estimated_wedding_date]
  )
  const calendar = gcalLink(ceremony, groomName, brideName)
  const trackUrl = profile.track_url || ""

  // Guest-facing copy, every string a field or the shared dictionary.
  const kicker = tc.cover_kicker || t("weddingInvitation", lang)
  const guestPrefix = tc.cover_guest_label || t("toGuest", lang)
  const openLabel = tc.open_button || t("openInvitation", lang)
  const welcomeNote = tc.welcome_note || ""
  const openingTitle = (profile.opening_title || "").trim()
  const openingDescription = (profile.opening_description || "").trim()
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const mempelaiTitle = tc.mempelai_title || t("secCouple", lang)
  const mempelaiIntro = tc.mempelai_intro || ""
  const agendaTitle = tc.agenda_title || t("secEvent", lang)
  const eventsIntro = tc.events_intro || ""
  const mapsLabel = tc.maps_label || t("viewLocation", lang)
  const countdownTitle = tc.countdown_title || t("countdown", lang)
  const calendarLabel = tc.calendar_button || t("saveToCalendar", lang)
  const storyTitle = tc.love_story_title || t("secStory", lang)
  const rundownTitle = tc.rundown_title || t("secRundown", lang)
  const galleryTitle = tc.gallery_title || t("secGallery", lang)
  const galleryIntro = tc.gallery_intro || ""
  const videoTitle = tc.video_title || t("secVideo", lang)
  const videoCaption = tc.video_caption || ""
  const giftTitle = tc.gift_intro_title || t("secGift", lang)
  const giftIntro = tc.gift_intro_description || ""
  const copyAccountLabel = tc.copy_account_button || t("copyNumber", lang)
  const addressTitle = tc.gift_address_title || t("sendGift", lang)
  const copyAddressLabel = tc.copy_address_button || t("copyAddress", lang)
  const copyAccountToast = tc.copy_account_toast || t("copied", lang)
  const copyAddressToast = tc.copy_address_toast || t("copied", lang)
  const wishesTitle = tc.wishes_title || t("secWishes", lang)
  const wishesIntro = tc.wishes_intro || ""
  const invitingTitle = tc.inviting_title || t("secInviting", lang)
  const invitingIntro = tc.inviting_intro || ""
  const closingTitle = tc.closing_title || t("thankYou", lang)
  const closingMessage = tc.closing_message || t("withLoveAndGratitude", lang)
  const closingBrand = tc.closing_brand || t("digitalWeddingInvitation", lang)

  const countdownLabels = [
    { key: "days", label: tc.countdown_days || t("days", lang) },
    { key: "hours", label: tc.countdown_hours || t("hours", lang) },
    { key: "minutes", label: tc.countdown_minutes || t("minutes", lang) },
    { key: "seconds", label: tc.countdown_seconds || t("seconds", lang) },
  ]

  // ── toast ───────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  const copyValue = useCallback(
    async (value: string, message: string) => {
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  // ── music ───────────────────────────────────────────────────────────────
  const playMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    )
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else {
      audio.pause()
      setPlaying(false)
    }
  }, [playMusic])

  const openInvitation = useCallback(() => {
    setOpened(true)
    playMusic()
    if (typeof window !== "undefined") window.scrollTo({ top: 0 })
  }, [playMusic])

  // Desktop has no gate: the fixed cover pane is the opening screen.
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 961px)")
    const sync = () => {
      if (mq.matches) setOpened(true)
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Desktop starts the track on the first interaction (there is no gate click).
  useEffect(() => {
    if (!opened || typeof window === "undefined") return
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    const kick = () => {
      playMusic()
      window.removeEventListener("pointerdown", kick)
      window.removeEventListener("keydown", kick)
    }
    window.addEventListener("pointerdown", kick, { once: true })
    window.addEventListener("keydown", kick, { once: true })
    return () => {
      window.removeEventListener("pointerdown", kick)
      window.removeEventListener("keydown", kick)
    }
  }, [opened, playMusic])

  // ── countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (targetMs === null) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  const countdown = useMemo(() => {
    if (targetMs === null) return null
    const diff = Math.max(0, targetMs - (now ?? targetMs))
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [targetMs, now])

  // ── reveal (the reference drives AOS; same mechanism, one observer) ──────
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-aos]"))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    for (const el of els) {
      const dur = el.dataset.aosDuration
      const delay = el.dataset.aosDelay
      if (dur) el.style.transitionDuration = `${dur}ms`
      if (delay) el.style.transitionDelay = `${delay}ms`
    }
    if (reduce) {
      for (const el of els) el.classList.add("aos-animate")
      return
    }
    for (const el of els) {
      if (el.closest(".noir-gate") || el.closest(".noir-pane")) el.classList.add("aos-animate")
    }
    const observe = els.filter((el) => !el.classList.contains("aos-animate"))
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("aos-animate")
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 100% 160px 100%", threshold: 0.01 }
    )
    for (const el of observe) io.observe(el)
    return () => io.disconnect()
  }, [])

  // ── keyboard: lightbox + story ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (lightbox !== null) {
        if (event.key === "Escape") setLightbox(null)
        if (event.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
        if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
        return
      }
      if (event.key === "ArrowRight" && stories.length > 1) {
        setStoryIndex((i) => (i + 1) % stories.length)
      }
      if (event.key === "ArrowLeft" && stories.length > 1) {
        setStoryIndex((i) => (i - 1 + stories.length) % stories.length)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length, stories.length])

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const scrollGallery = (dir: number) => {
    const el = galleryRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" })
  }

  const rootStyle = { "--noir-cover": `url("${cover}")` } as CSSProperties

  return (
    <div ref={rootRef} className={`noir-root${opened ? " is-open" : " is-locked"}`} style={rootStyle}>
      {/* ───── mobile gate (the reference hides it on desktop) ───── */}
      <section className="noir-gate" aria-hidden={opened}>
        <img className="noir-gate__img" src={cover} alt="" />
        <div className="noir-gate__veil" />
        <div className="noir-gate__body">
          <p className="noir-kicker">{kicker}</p>
          <h1 className="noir-gate__names">{coupleShort}</h1>
          {coverDate ? <p className="noir-gate__date">{coverDate}</p> : null}
          <p className="noir-gate__guest">
            <span>{guestPrefix}</span>
            <strong>{guestLabel}</strong>
          </p>
          <button type="button" className="noir-btn noir-btn--solid" onClick={openInvitation}>
            {openLabel}
          </button>
        </div>
      </section>

      <div className="noir-shell">
        {/* ───── fixed cover pane (desktop) ───── */}
        <aside className="noir-pane" aria-hidden={!opened}>
          <img className="noir-pane__img" src={cover} alt="" />
          <div className="noir-pane__veil" />
          <div className="noir-pane__caption">
            <p className="noir-kicker">{kicker}</p>
            <p className="noir-pane__names">{coupleShort}</p>
            {coverDate ? <p className="noir-pane__date">{coverDate}</p> : null}
          </div>
        </aside>

        <main className="noir-flow">
          {/* 1 — Cover */}
          <section className="noir-sec noir-cover">
            <div className="noir-cover__frame">
              {cover ? <img className="noir-cover__img" src={cover} alt="" fetchPriority="high" /> : null}
              <div className="noir-cover__veil" />
              <div className="noir-cover__body">
                <p className="noir-kicker" data-aos="fade-down" data-aos-duration="900">
                  {kicker}
                </p>
                <h1 className="noir-cover__names" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="120">
                  {coupleShort}
                </h1>
                <span className="noir-rule" aria-hidden />
                {coverDate ? (
                  <p className="noir-cover__date" data-aos="fade-up" data-aos-duration="1100" data-aos-delay="260">
                    {coverDate}
                  </p>
                ) : null}
                <p className="noir-cover__guest" data-aos="fade-up" data-aos-duration="1100" data-aos-delay="380">
                  <span>{guestPrefix}</span>
                  <strong>{guestLabel}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* 2 — Opening video: this design opens on a still cover, so the
              couple's film lives in section 11 only (documented in REA_NOIR). */}

          {/* 3 — Welcome */}
          <section className="noir-sec noir-welcome">
            <div className="noir-welcome__frame" data-aos="zoom-in" data-aos-duration="1000">
              <p className="noir-kicker">{t("theWeddingOf", lang)}</p>
              <p className="noir-welcome__names">{resolveCoupleName(profile) || coupleShort}</p>
              {coverDate ? <span className="noir-rule noir-rule--short" aria-hidden /> : null}
              {coverDate ? <p className="noir-welcome__date">{coverDate}</p> : null}
              {welcomeNote ? <p className="noir-welcome__note">{welcomeNote}</p> : null}
              <p className="noir-welcome__guest">
                <span>{guestPrefix}</span>
                <strong>{guestLabel}</strong>
              </p>
            </div>
          </section>

          {/* 4 — Kalimat pembuka (+ the reference's quote card) */}
          {openingTitle || openingDescription || quoteText ? (
            <section className="noir-sec noir-opening">
              {openingTitle ? <p className="noir-kicker noir-kicker--wide">{openingTitle}</p> : null}
              {openingDescription ? <p className="noir-opening__text">{openingDescription}</p> : null}
              {quoteText ? (
                <figure className="noir-quote" data-aos="fade-up" data-aos-duration="1000">
                  <span className="noir-rule noir-rule--short" aria-hidden />
                  <blockquote className="noir-quote__text">{quoteText}</blockquote>
                  {quoteSource ? <figcaption className="noir-quote__source">{quoteSource}</figcaption> : null}
                </figure>
              ) : null}
            </section>
          ) : null}

          {/* 5 — Mempelai */}
          <section className="noir-sec noir-couple">
            <SectionHead title={mempelaiTitle} intro={mempelaiIntro} />
            <div className="noir-couple__list">
              {groomShort || groomName ? (
                <article className="noir-person" data-aos="fade-up" data-aos-duration="1000">
                  <div className="noir-person__photo">
                    <img src={groomPhoto} alt="" loading="lazy" />
                  </div>
                  <div className="noir-person__card">
                    <h3 className="noir-person__name">{groomName || groomShort}</h3>
                    {profile.groom_parents ? (
                      <p className="noir-person__parents">
                        {t("sonOf", lang)} {profile.groom_parents}
                      </p>
                    ) : null}
                    {profile.groom_instagram ? (
                      <a
                        className="noir-person__ig"
                        href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {profile.groom_instagram}
                      </a>
                    ) : null}
                  </div>
                </article>
              ) : null}
              {brideShort || brideName ? (
                <article className="noir-person" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="120">
                  <div className="noir-person__photo">
                    <img src={bridePhoto} alt="" loading="lazy" />
                  </div>
                  <div className="noir-person__card">
                    <h3 className="noir-person__name">{brideName || brideShort}</h3>
                    {profile.bride_parents ? (
                      <p className="noir-person__parents">
                        {t("daughterOf", lang)} {profile.bride_parents}
                      </p>
                    ) : null}
                    {profile.bride_instagram ? (
                      <a
                        className="noir-person__ig"
                        href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {profile.bride_instagram}
                      </a>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>
          </section>

          {/* 6 — Event */}
          {sessions.length > 0 ? (
            <section className="noir-sec noir-events">
              <SectionHead title={agendaTitle} intro={eventsIntro} />
              <div className="noir-event-list">
                {sessions.map((session, index) => {
                  const card = dateCard(session.date, lang)
                  return (
                    <article
                      className="noir-event"
                      key={`${session.name || "event"}-${index}`}
                      data-aos="fade-up"
                      data-aos-duration="900"
                      data-aos-delay={String(index * 90)}
                    >
                      <div className="noir-event__head">
                        {card ? (
                          <p className="noir-event__date" aria-hidden>
                            <span className="noir-event__day">{card.day}</span>
                            <span className="noir-event__month">
                              {card.month}
                              <span className="noir-event__year">{card.year}</span>
                            </span>
                          </p>
                        ) : null}
                        <div className="noir-event__meta">
                          {session.name ? <h3 className="noir-event__name">{session.name}</h3> : null}
                          {card ? <p className="noir-event__full">{card.full}</p> : null}
                          {session.time ? <p className="noir-event__time">{session.time}</p> : null}
                        </div>
                      </div>
                      {session.venue || session.address ? (
                        <div className="noir-event__place">
                          {session.venue ? <p className="noir-event__venue">{session.venue}</p> : null}
                          {session.address ? <p className="noir-event__address">{session.address}</p> : null}
                        </div>
                      ) : null}
                      {session.maps_url ? (
                        <a className="noir-btn noir-btn--ghost" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                          {mapsLabel}
                        </a>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* 7 — Countdown */}
          {countdown ? (
            <section className="noir-sec noir-countdown">
              <p className="noir-kicker noir-kicker--wide">{countdownTitle}</p>
              <div className="noir-countdown__grid" aria-live="off">
                {countdownLabels.map((unit) => (
                  <div className="noir-countdown__cell" key={unit.key}>
                    <span className="noir-countdown__num">{pad2(countdown[unit.key as keyof typeof countdown])}</span>
                    <span className="noir-countdown__label">{unit.label}</span>
                  </div>
                ))}
              </div>
              {coverDate ? <p className="noir-countdown__date">{coverDate}</p> : null}
              {calendar ? (
                <a className="noir-btn noir-btn--ghost" href={calendar} target="_blank" rel="noreferrer noopener">
                  {calendarLabel}
                </a>
              ) : null}
            </section>
          ) : null}

          {/* 8 — Love story */}
          {stories.length > 0 ? (
            <section className="noir-sec noir-story">
              <SectionHead title={storyTitle} />
              <div className="noir-story__stage">
                {stories.map((story, index) => (
                  <article
                    className={`noir-story__slide${index === storyIndex ? " is-active" : ""}`}
                    key={`${story.title || "story"}-${index}`}
                    aria-hidden={index !== storyIndex}
                  >
                    {story.image_url ? <img className="noir-story__img" src={story.image_url} alt="" loading="lazy" /> : null}
                    <div className="noir-story__veil" />
                    <div className="noir-story__text">
                      <p className="noir-kicker noir-kicker--wide">
                        {t("storyPart", lang).replace("{n}", pad2(index + 1))}
                      </p>
                      {story.title ? <h3 className="noir-story__title">{story.title}</h3> : null}
                      {story.description ? <p className="noir-story__caption">{story.description}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
              {stories.length > 1 ? (
                <div className="noir-story__nav">
                  <button
                    type="button"
                    className="noir-story__arrow"
                    onClick={() => setStoryIndex((i) => (i - 1 + stories.length) % stories.length)}
                    aria-label={t("previousPhoto", lang)}
                  >
                    <svg viewBox="0 0 12 22" aria-hidden>
                      <path d="M10 1 2 11l8 10" />
                    </svg>
                  </button>
                  <div className="noir-story__bars">
                    {stories.map((story, index) => (
                      <button
                        type="button"
                        key={`${story.title || "bar"}-${index}`}
                        className={`noir-story__bar${index === storyIndex ? " is-active" : ""}`}
                        onClick={() => setStoryIndex(index)}
                        aria-label={t("storyPart", lang).replace("{n}", pad2(index + 1))}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="noir-story__arrow"
                    onClick={() => setStoryIndex((i) => (i + 1) % stories.length)}
                    aria-label={t("nextPhoto", lang)}
                  >
                    <svg viewBox="0 0 12 22" aria-hidden>
                      <path d="M2 1l8 10-8 10" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* 9 — Rundown */}
          {rundown.length > 0 ? (
            <section className="noir-sec noir-rundown">
              <SectionHead title={rundownTitle} />
              <ol className="noir-rundown__list">
                {rundown.map((row, index) => (
                  <li className="noir-rundown__row" key={`${row.time || "row"}-${index}`}>
                    <span className="noir-rundown__time">{row.time}</span>
                    <span className="noir-rundown__text">{row.description}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* 10 — Gallery */}
          {gallery.length > 0 ? (
            <section className="noir-sec noir-gallery">
              <SectionHead title={galleryTitle} intro={galleryIntro} />
              <div className="noir-gallery__track" ref={galleryRef}>
                {gallery.map((src, index) => (
                  <button
                    type="button"
                    className="noir-gallery__item"
                    key={`${src}-${index}`}
                    onClick={() => setLightbox(index)}
                    aria-label={t("photoGallery", lang)}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              {gallery.length > 1 ? (
                <div className="noir-gallery__nav">
                  <button type="button" className="noir-gallery__arrow" onClick={() => scrollGallery(-1)} aria-label={t("previousPhoto", lang)}>
                    <svg viewBox="0 0 12 22" aria-hidden>
                      <path d="M10 1 2 11l8 10" />
                    </svg>
                  </button>
                  <button type="button" className="noir-gallery__arrow" onClick={() => scrollGallery(1)} aria-label={t("nextPhoto", lang)}>
                    <svg viewBox="0 0 12 22" aria-hidden>
                      <path d="M2 1l8 10-8 10" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* 11 — Video */}
          {hasVideo && video ? (
            <section className="noir-sec noir-video">
              <SectionHead title={videoTitle} intro={videoCaption} />
              <div className="noir-video__frame">
                {videoOn ? (
                  video.kind === "file" ? (
                    <video className="noir-video__player" src={video.src} controls autoPlay muted loop playsInline />
                  ) : videoPoster ? (
                    <AutoplayYouTube videoId={videoPoster} title={videoTitle} controls autoplay />
                  ) : (
                    <iframe className="noir-video__player" src={video.src} title={videoTitle} allow="autoplay; encrypted-media" />
                  )
                ) : (
                  <button type="button" className="noir-video__poster" onClick={() => setVideoOn(true)} aria-label={videoTitle}>
                    {videoPoster ? <img src={`https://i.ytimg.com/vi/${videoPoster}/maxresdefault.jpg`} alt="" loading="lazy" /> : null}
                    <span className="noir-video__play" aria-hidden>
                      <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </section>
          ) : null}

          {/* 12 — Wedding gift */}
          {hasGift ? (
            <section className="noir-sec noir-gift">
              <SectionHead title={giftTitle} intro={giftIntro} />
              {accounts.length > 0 && giftAddress ? (
                <div className="noir-gift__tabs">
                  <button
                    type="button"
                    className={`noir-gift__tab${giftTab === "account" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("account")}
                  >
                    {giftTitle}
                  </button>
                  <button
                    type="button"
                    className={`noir-gift__tab${giftTab === "address" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("address")}
                  >
                    {addressTitle}
                  </button>
                </div>
              ) : null}

              {accounts.length > 0 && (giftTab === "account" || !giftAddress) ? (
                <div className="noir-gift__panel">
                  {accounts.map((account, index) => (
                    <article className="noir-gift__card" key={`${account.account_number || "acc"}-${index}`}>
                      {account.provider_name ? <p className="noir-gift__provider">{account.provider_name}</p> : null}
                      {account.account_number ? <p className="noir-gift__number">{account.account_number}</p> : null}
                      {account.account_name ? <p className="noir-gift__owner">{account.account_name}</p> : null}
                      {account.account_number ? (
                        <button
                          type="button"
                          className="noir-btn noir-btn--ghost"
                          onClick={() => copyValue(account.account_number || "", copyAccountToast)}
                        >
                          {copyAccountLabel}
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}

              {giftAddress && (giftTab === "address" || accounts.length === 0) ? (
                <div className="noir-gift__panel">
                  <article className="noir-gift__card">
                    <p className="noir-gift__provider">{addressTitle}</p>
                    {giftAddressName ? <p className="noir-gift__owner">{giftAddressName}</p> : null}
                    <p className="noir-gift__address">{giftAddress}</p>
                    <button
                      type="button"
                      className="noir-btn noir-btn--ghost"
                      onClick={() => copyValue(giftAddress, copyAddressToast)}
                    >
                      {copyAddressLabel}
                    </button>
                  </article>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* 13 — Dress code */}
          {hasDresscode ? (
            <section className="noir-sec noir-dress">
              <SectionHead title={dresscodeTitle} intro={dresscodeIntro} />
              {dresscodeColors.length > 0 ? (
                <ul className="noir-dress__colors">
                  {dresscodeColors.map((color, index) => (
                    <li className="noir-dress__swatch" key={`${color.hex || color.name}-${index}`}>
                      <span className="noir-dress__dot" style={{ backgroundColor: color.hex || "transparent" }} aria-hidden />
                      {color.name ? <span className="noir-dress__name">{color.name}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {/* 14 — Wishes */}
          <section className="noir-sec noir-wishes">
            <SectionHead title={wishesTitle} intro={wishesIntro} />
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={guestName}
              guestLinkStrict={profile.guest_link_strict}
              nameFallback={guestLabel}
              language={lang}
              copy={{
                nameLabel: tc.wishes_name_label || t("dearGuest", lang),
                namePlaceholder: tc.wishes_name_placeholder || t("dearGuest", lang),
                messageLabel: tc.wishes_message_label || t("secWishes", lang),
                messagePlaceholder: tc.wishes_message_placeholder || t("secWishes", lang),
                submit: tc.wishes_submit || t("sendWishes", lang),
                empty: tc.wishes_empty || t("noWishesYet", lang),
                more: tc.wishes_more || t("loadingWishes", lang),
                loading: tc.wishes_loading || t("loading", lang),
              }}
            />
          </section>

          {/* 15 — Turut mengundang */}
          {honored.length > 0 ? (
            <section className="noir-sec noir-inviting">
              <SectionHead title={invitingTitle} intro={invitingIntro} />
              <ul className="noir-inviting__list">
                {honored.map((name, index) => (
                  <li className="noir-inviting__name" key={`${name}-${index}`}>
                    {name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* 16 — Closing (never hides) */}
          <section className="noir-sec noir-closing">
            {coverSlides[1] ? <img className="noir-closing__img" src={coverSlides[1]} alt="" loading="lazy" /> : null}
            <div className="noir-closing__body">
              <p className="noir-kicker noir-kicker--wide">{closingTitle}</p>
              <p className="noir-closing__names">{coupleShort}</p>
              {coverDate ? <p className="noir-closing__date">{coverDate}</p> : null}
              <span className="noir-rule noir-rule--short" aria-hidden />
              <p className="noir-closing__message">{closingMessage}</p>
              <p className="noir-closing__brand">{closingBrand}</p>
            </div>
          </section>
        </main>
      </div>

      {trackUrl ? (
        <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio />
      ) : null}

      {trackUrl ? (
        <button
          type="button"
          className={`noir-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? t("pauseMusic", lang) : t("playMusic", lang)}
        >
          <span className="noir-music__bars" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </button>
      ) : null}

      {lightbox !== null && gallery[lightbox] ? (
        <div className="noir-lightbox" role="dialog" aria-modal="true" aria-label={t("photoViewer", lang)}>
          <button type="button" className="noir-lightbox__close" onClick={() => setLightbox(null)} aria-label={t("close", lang)}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <img className="noir-lightbox__img" src={gallery[lightbox]} alt="" />
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="noir-lightbox__arrow noir-lightbox__arrow--prev"
                onClick={() => setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))}
                aria-label={t("previousPhoto", lang)}
              >
                <svg viewBox="0 0 12 22" aria-hidden>
                  <path d="M10 1 2 11l8 10" />
                </svg>
              </button>
              <button
                type="button"
                className="noir-lightbox__arrow noir-lightbox__arrow--next"
                onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))}
                aria-label={t("nextPhoto", lang)}
              >
                <svg viewBox="0 0 12 22" aria-hidden>
                  <path d="M2 1l8 10-8 10" />
                </svg>
              </button>
              <p className="noir-lightbox__count">
                {pad2(lightbox + 1)} / {pad2(gallery.length)}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <div className={`noir-toast${toast ? " show" : ""}`} role="status">
          {toast}
        </div>
      ) : null}

      {/* Reveal targets start hidden; without JS they must stay readable. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: ".noir-root [data-aos]{opacity:1!important;transform:none!important}",
        }}
      />

      {showGuestDock ? (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestLabel}
          coupleName={coupleShort}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={24}
          language={lang}
        />
      ) : null}
    </div>
  )
}
