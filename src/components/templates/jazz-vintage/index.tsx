"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  bridePhoto,
  countdownTarget,
  coverPhoto,
  flattenPhotos,
  formatDotDate,
  gcalLink,
  groomPhoto,
  videoSource,
} from "../shared/lib"
import { formatIdDate, normalizeLanguage, t } from "@/lib/i18n"
import Wishes from "./Wishes"
import { JV, rundownArt } from "./assets"
import "./jazz-vintage.css"

const GUEST_FALLBACK = "Tamu Undangan"
const WEEKDAYS: Record<"id" | "en", string[]> = {
  id: ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"],
  en: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
}

const pad2 = (value: number) => String(value).padStart(2, "0")

function calendarCells(date: Date): { day: number; current: boolean }[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first, like the reference
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const cells: { day: number; current: boolean }[] = []
  for (let i = 0; i < offset; i += 1) cells.push({ day: 0, current: false })
  for (let day = 1; day <= total; day += 1) cells.push({ day, current: true })
  while (cells.length < 42) cells.push({ day: 0, current: false })
  return cells.slice(0, 42)
}

type Viewer = { photos: string[]; index: number } | null

export default function JazzVintage(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const tc = (profile.template_content || {}) as Record<string, string | undefined>
  const gates = profile.feature_gates || {}

  const groom = (profile.groom_name || "").trim()
  const bride = (profile.bride_name || "").trim()
  const groomFull = (profile.groom_full_name || groom || "").trim()
  const brideFull = (profile.bride_full_name || bride || "").trim()
  const coupleLabel = [groom, bride].filter(Boolean).join(" & ") || t("theWeddingOf", lang)
  const guestName = (profile.guest_name || "").trim() || t("honoredGuest", lang)

  const sessions = useMemo(
    () => (profile.sessions || []).filter((session) => session && (session.name || session.venue || session.date)),
    [profile.sessions]
  )
  const target = useMemo(
    () => countdownTarget(profile.sessions, profile.estimated_wedding_date),
    [profile.sessions, profile.estimated_wedding_date]
  )
  const targetMs = target ? target.getTime() : 0
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!targetMs) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])
  const diff = targetMs && now !== null ? Math.max(0, targetMs - now) : 0
  const countdownUnits = [
    { value: pad2(Math.floor(diff / 86_400_000)), label: t("days", lang) },
    { value: pad2(Math.floor((diff % 86_400_000) / 3_600_000)), label: t("hours", lang) },
    { value: pad2(Math.floor((diff % 3_600_000) / 60_000)), label: t("minutes", lang) },
    { value: pad2(Math.floor((diff % 60_000) / 1000)), label: t("seconds", lang) },
  ]

  const stories = useMemo(() => {
    const allowed = gates.story !== false && profile.story_visible !== false
    if (!allowed) return []
    return (profile.stories || []).filter((story) => story && (story.title || story.description))
  }, [gates.story, profile.story_visible, profile.stories])
  const storyPhotos = useMemo(
    () => stories.map((story) => (story.image_url || "").trim()).filter(Boolean),
    [stories]
  )

  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((row) => row && (row.time || row.description)) : []
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos).filter(Boolean), [profile.gallery_photos])

  const accounts = useMemo(
    () => (profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter((account) => account && account.account_number) : []),
    [profile.gift_section_visible, profile.gift_accounts]
  )
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const giftAddressName = (profile.gift_address_name || "").trim()
  const hasGift = accounts.length > 0 || !!giftAddress

  const dresscodeAllowed = profile.dresscode_visible !== false
  const dresscode = dresscodeAllowed ? profile.dresscode : undefined
  const dresscodeColors = (dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const hasDresscode = !!(dresscode?.title || dresscode?.description || dresscodeColors.length)

  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).map((family) => (family || "").trim()).filter(Boolean)
      : []

  const video = useMemo(() => videoSource(profile.video_url), [profile.video_url])
  const hasVideo = !!video && gates.video !== false && profile.video_section_visible !== false

  const openingTitle = (profile.opening_title || "").trim()
  const openingBody = (profile.opening_description || "").trim()
  const hasOpening = !!(openingTitle || openingBody)

  const coverDate = formatDotDate(profile.estimated_wedding_date || sessions[0]?.date)
  const closingDate = formatDotDate(profile.estimated_wedding_date || sessions[0]?.date)
  const monthLabel = target ? formatIdDate(target.toISOString(), lang).replace(/^\d+\s+/, "") : ""
  const eventTime = (sessions[0]?.time || "").trim()

  const heroPhoto = coverPhoto(profile)
  const groomPortrait = groomPhoto(profile.groom_photo_url)
  const bridePortrait = bridePhoto(profile.bride_photo_url)
  const filmPoster = gallery[0] || (profile.cover_photos && flattenPhotos(profile.cover_photos)[0]) || heroPhoto

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [viewer, setViewer] = useState<Viewer>(null)
  const [filmOpen, setFilmOpen] = useState(false)
  const [giftTab, setGiftTab] = useState<"transfer" | "address">(accounts.length || !giftAddress ? "transfer" : "address")
  const [toast, setToast] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const trackUrl = (profile.track_url || "").trim()

  const flash = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  const seekBy = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), duration || audio.currentTime + delta)
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo({ top: 0, behavior: "auto" })
    const audio = audioRef.current
    if (audio) {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    }
  }, [])

  // Body scroll stays locked until the cover is opened, with a CSS :has()
  // fallback so a route change cannot leave the page scrollable behind the gate.
  useEffect(() => {
    document.body.classList.toggle("jv-locked", !opened)
    rootRef.current?.classList.toggle("is-locked", !opened)
    return () => {
      document.body.classList.remove("jv-locked")
    }
  }, [opened])

  // One observer, one class (see playbook §0.7).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-jv-reveal]"))
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [opened, gallery.length, stories.length, accounts.length, honored.length])

  const stepViewer = useCallback((direction: number) => {
    setViewer((current) => {
      if (!current) return current
      const total = current.photos.length
      return total ? { ...current, index: (current.index + direction + total) % total } : current
    })
  }, [])

  useEffect(() => {
    if (!viewer && !filmOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewer(null)
        setFilmOpen(false)
      }
      if (!viewer) return
      if (event.key === "ArrowLeft") stepViewer(-1)
      if (event.key === "ArrowRight") stepViewer(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [viewer, filmOpen, stepViewer])

  const copyValue = useCallback(
    async (value: string, message: string) => {
      const ok = await copyPlainText(value)
      flash(ok ? message : t("failedToCopy", lang))
    },
    [flash, lang]
  )

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    !viewer &&
    !filmOpen &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(t("weddingInvitationByAksaraa", lang))}`
  const closingMessage = (tc.closing_message || "").trim() || t("closingMessageDefault", lang)
  const gcal = gcalLink(sessions[0], groom, bride)
  const cells = target ? calendarCells(target) : []
  const selectedDay = target ? target.getDate() : -1
  const giftTabs = accounts.length > 0 && !!giftAddress

  const welcomeTitle = tc.welcome_title || t("welcomeTitle", lang)
  const welcomeMessage = tc.welcome_message || t("welcomeMessage", lang)

  return (
    <div className={`jv-root${opened ? " is-open" : " is-locked"}`} ref={rootRef} lang={lang}>
      {trackUrl && (
        <audio
          ref={audioRef}
          src={trackUrl}
          loop
          preload="metadata"
          data-warm-audio
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {!opened && (
        <div className="jv-gate" onClick={openInvitation}>
          <div className="jv-gate__stage">
            <img className="jv-gate__bg" src={JV.coverCurtain} alt="" aria-hidden="true" fetchPriority="high" />
            <img className="jv-gate__chandelier" src={JV.coverChandelier} alt="" aria-hidden="true" />
            <h1 className="jv-gate__names">
              <span>{groom}</span>
              <span className="jv-gate__amp">{"&"}</span>
              <span>{bride}</span>
            </h1>
            <p className="jv-gate__date">{coverDate}</p>
            <p className="jv-gate__dear">{tc.cover_guest_label || t("dearGuest", lang)}</p>
            <p className="jv-gate__guest">{guestName}</p>
            <img className="jv-gate__table" src={JV.coverTable} alt="" aria-hidden="true" />
            <img className="jv-gate__garland" src={JV.garland} alt="" aria-hidden="true" />
            <button type="button" className="jv-gate__open" onClick={openInvitation}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6.5h18v12H3z" />
                <path d="m3.5 7 8.5 6 8.5-6" />
              </svg>
              <span>{tc.open_button || t("openInvitation", lang)}</span>
            </button>
          </div>
        </div>
      )}

      <div className="jv-page">
        {/* 3 — WELCOME (music card + greeting card) */}
        <section className="jv-sec jv-welcome" id="welcome" aria-label={t("welcomeKicker", lang)}>
          {trackUrl && (
            <div className="jv-music" data-jv-reveal>
              <img className="jv-music__sheet" src={JV.sheetMusic} alt="" aria-hidden="true" />
              <div className="jv-music__card">
                <img className="jv-music__photo" src={JV.gramophone} alt="" aria-hidden="true" />
                <p className="jv-music__label">{tc.music_label || t("playMusic", lang)}</p>
                <div className="jv-music__rule" aria-hidden="true">
                  <span />
                </div>
                <button
                  type="button"
                  className="jv-music__skip jv-music__skip--back"
                  onClick={() => seekBy(-10)}
                  aria-label={t("musicBack", lang)}
                >
                  <svg viewBox="0 0 26 18" aria-hidden="true" focusable="false">
                    <path d="M12 1.5 1.5 9 12 16.5zM24.5 1.5 14 9l10.5 7.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="jv-music__play"
                  onClick={toggleMusic}
                  aria-label={playing ? t("pauseMusic", lang) : t("playMusic", lang)}
                  aria-pressed={playing}
                >
                  {playing ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M8 4.5 20 12 8 19.5z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="jv-music__skip jv-music__skip--next"
                  onClick={() => seekBy(10)}
                  aria-label={t("musicForward", lang)}
                >
                  <svg viewBox="0 0 26 18" aria-hidden="true" focusable="false">
                    <path d="M14 1.5 24.5 9 14 16.5zM1.5 1.5 12 9 1.5 16.5z" />
                  </svg>
                </button>
              </div>
              <img className="jv-music__garland" src={JV.garland} alt="" aria-hidden="true" />
            </div>
          )}

          <div className="jv-welcome__stage" data-jv-reveal>
            <img className="jv-welcome__box" src={JV.jewelBox} alt="" aria-hidden="true" loading="lazy" />
            <div className="jv-welcome__card">
              <h2 className="jv-welcome__title">{welcomeTitle}</h2>
              <p className="jv-welcome__body">{welcomeMessage}</p>
            </div>
            <img className="jv-welcome__cameo" src={JV.cameo} alt="" aria-hidden="true" loading="lazy" />
            <img className="jv-welcome__tulle" src={JV.tulleBow} alt="" aria-hidden="true" loading="lazy" />
          </div>
        </section>

        {/* 4 — KALIMAT PEMBUKA */}
        {hasOpening && (
          <section className="jv-sec jv-opening" id="pembuka" aria-label={t("welcomeKicker", lang)}>
            <div className="jv-opening__stage" data-jv-reveal>
              <img className="jv-opening__card" src={JV.cardCream} alt="" aria-hidden="true" loading="lazy" />
              <div className="jv-opening__copy">
                <h2 className="jv-opening__title">{openingTitle || tc.pembuka_title || t("saveTheDate", lang)}</h2>
                {openingBody && <p className="jv-opening__body">{openingBody}</p>}
              </div>
            </div>
          </section>
        )}

        {/* 5 — MEMPELAI */}
        <section className="jv-sec jv-couple" id="mempelai" aria-label={t("secCouple", lang)}>
          <div className="jv-pad">
            <h2 className="jv-title" data-jv-reveal>
              {tc.mempelai_title || t("secCouple", lang)}
            </h2>
            {tc.mempelai_intro && <p className="jv-lead" data-jv-reveal>{tc.mempelai_intro}</p>}
          </div>

          <div className="jv-couple__stage" data-jv-reveal>
            <img className="jv-couple__swag" src={JV.garland} alt="" aria-hidden="true" loading="lazy" />
            <div className="jv-portrait jv-portrait--groom">
              <img className="jv-portrait__photo" src={groomPortrait} alt={groomFull} loading="lazy" />
              <img className="jv-portrait__frame" src={JV.frameOval} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <div className="jv-portrait jv-portrait--bride">
              <img className="jv-portrait__photo" src={bridePortrait} alt={brideFull} loading="lazy" />
              <img className="jv-portrait__frame" src={JV.frameOval} alt="" aria-hidden="true" loading="lazy" />
            </div>
          </div>

          <div className="jv-pad">
          <div className="jv-person" data-jv-reveal>
            <p className="jv-eyebrow">{t("mempelaiGroom", lang)}</p>
            <p className="jv-person__name">{groomFull}</p>
            {profile.groom_parents && (
              <>
                <p className="jv-person__of">{t("sonOf", lang)}</p>
                <p className="jv-person__parents">{profile.groom_parents}</p>
              </>
            )}
            {profile.groom_instagram && (
              <a
                className="jv-person__ig"
                href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.groom_instagram}
              </a>
            )}
          </div>

          <p className="jv-couple__amp" aria-hidden="true" data-jv-reveal>
            {"&"}
          </p>

          <div className="jv-person" data-jv-reveal>
            <p className="jv-eyebrow">{t("mempelaiBride", lang)}</p>
            <p className="jv-person__name">{brideFull}</p>
            {profile.bride_parents && (
              <>
                <p className="jv-person__of">{t("daughterOf", lang)}</p>
                <p className="jv-person__parents">{profile.bride_parents}</p>
              </>
            )}
            {profile.bride_instagram && (
              <a
                className="jv-person__ig"
                href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.bride_instagram}
              </a>
            )}
          </div>
          </div>
        </section>

        {/* 6 — EVENT */}
        {sessions.length > 0 && (
          <section className="jv-sec jv-events" id="acara" aria-label={t("secEvent", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.events_title || t("secEvent", lang)}
              </h2>
              {tc.events_intro && (
                <p className="jv-lead" data-jv-reveal>
                  {tc.events_intro}
                </p>
              )}
            </div>

            <div className="jv-event__plate" data-jv-reveal aria-hidden="true">
              <img className="jv-event__door-img" src={JV.door} alt="" loading="lazy" />
              <img className="jv-event__orchid jv-event__orchid--left" src={JV.orchid} alt="" loading="lazy" />
              <img className="jv-event__orchid jv-event__orchid--right" src={JV.orchid} alt="" loading="lazy" />
              <img className="jv-event__tag" src={JV.velvetTag} alt="" loading="lazy" />
              <span className="jv-event__tag-text">{t("locationLabel", lang)}</span>
            </div>

            <div className="jv-pad">
              {sessions.map((session, index) => (
                <article className="jv-event" key={`${session.name || "event"}-${index}`} data-jv-reveal>
                  <h3 className="jv-event__name">{session.name || t("weddingEventFallback", lang)}</h3>
                  <p className="jv-event__when">
                    {[formatIdDate(session.date || profile.estimated_wedding_date, lang), session.time].filter(Boolean).join(" · ")}
                  </p>
                  {session.venue && <p className="jv-event__venue">{session.venue}</p>}
                  {session.address && <p className="jv-event__address">{session.address}</p>}
                  <div className="jv-event__actions">
                    {session.maps_url && (
                      <a className="jv-btn jv-btn--outline" href={session.maps_url} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
                          <circle cx="12" cy="10" r="2.6" />
                        </svg>
                        {tc.maps_label || t("viewLocation", lang)}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7 — COUNTDOWN */}
        {target && (
          <section className="jv-sec jv-countdown" id="countdown" aria-label={t("secCountdown", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.countdown_title || t("saveTheDate", lang)}
              </h2>
              {tc.countdown_intro && (
                <p className="jv-lead" data-jv-reveal>
                  {tc.countdown_intro}
                </p>
              )}
            </div>

            <div className="jv-savedate" data-jv-reveal>
              <img className="jv-savedate__tulle" src={JV.calendarTulle} alt="" aria-hidden="true" loading="lazy" />
              <div className="jv-cal">
                <p className="jv-cal__month">{monthLabel}</p>
                <div className="jv-cal__grid" role="presentation">
                  {WEEKDAYS[lang].map((day) => (
                    <span className="jv-cal__head" key={day}>
                      {day}
                    </span>
                  ))}
                  {cells.map((cell, index) => (
                    <span
                      className={`jv-cal__cell${cell.current ? "" : " is-muted"}${cell.day === selectedDay ? " is-day" : ""}`}
                      key={`cell-${index}`}
                    >
                      {cell.day === selectedDay && (
                        <svg className="jv-cal__heart" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M12 20s-7-4.6-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.4 12 20 12 20Z" />
                        </svg>
                      )}
                      {cell.day > 0 ? cell.day : ""}
                    </span>
                  ))}
                </div>
                {eventTime && (
                  <p className="jv-cal__time">
                    {t("atTime", lang)} {eventTime}
                  </p>
                )}
              </div>
              <img className="jv-savedate__watch" src={JV.pocketWatch} alt="" aria-hidden="true" loading="lazy" />
            </div>

            <div className="jv-count jv-pad" data-jv-reveal>
              {countdownUnits.map((unit) => (
                <div className="jv-count__unit" key={unit.label}>
                  <span className="jv-count__value">{unit.value}</span>
                  <span className="jv-count__label">{unit.label}</span>
                </div>
              ))}
            </div>

            {gcal && (
              <div className="jv-pad">
                <a className="jv-btn jv-btn--solid" href={gcal} target="_blank" rel="noopener noreferrer" data-jv-reveal>
                  {tc.calendar_button || t("saveToCalendar", lang)}
                </a>
              </div>
            )}
          </section>
        )}

        {/* 8 — LOVE STORY */}
        {stories.length > 0 && (
          <section className="jv-sec jv-story" id="cerita" aria-label={t("secStory", lang)}>
            <div className="jv-pad">
            <h2 className="jv-title" data-jv-reveal>
              {tc.love_story_title || t("secStory", lang)}
            </h2>
            {(tc.love_story_intro || t("storyIntro", lang)) && (
              <p className="jv-lead" data-jv-reveal>
                {tc.love_story_intro || t("storyIntro", lang)}
              </p>
            )}

            <div className="jv-story__list">
              {stories.map((story, index) => (
                <article className="jv-chapter" key={`${story.title || "chapter"}-${index}`} data-jv-reveal>
                  {story.image_url && (
                    <button
                      type="button"
                      className="jv-chapter__frame"
                      onClick={() => {
                        const list = storyPhotos
                        const at = (story.image_url && list.indexOf(story.image_url)) || 0
                        setViewer({ photos: list, index: at })
                      }}
                      aria-label={t("photoViewer", lang)}
                    >
                      <img className="jv-chapter__photo" src={story.image_url} alt="" loading="lazy" />
                      <img className="jv-chapter__oval" src={JV.frameOval} alt="" aria-hidden="true" loading="lazy" />
                    </button>
                  )}
                  <div className="jv-chapter__copy">
                    <span className="jv-chapter__index" aria-hidden="true">
                      {pad2(index + 1)}
                    </span>
                    <h3 className="jv-chapter__title">{story.title || `${t("storyPart", lang)} ${index + 1}`}</h3>
                    {story.description && <p className="jv-chapter__body">{story.description}</p>}
                  </div>
                  {index < stories.length - 1 && <img className="jv-chapter__lace" src={JV.lace} alt="" aria-hidden="true" loading="lazy" />}
                </article>
              ))}
            </div>
            </div>
          </section>
        )}

        {/* 9 — RUNDOWN */}
        {rundown.length > 0 && (
          <section className="jv-sec jv-day" id="rundown" aria-label={t("secRundown", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.rundown_title || t("secRundown", lang)}
              </h2>
              {tc.rundown_intro && (
                <p className="jv-lead" data-jv-reveal>
                  {tc.rundown_intro}
                </p>
              )}
            </div>

            <div className="jv-day__stage" data-jv-reveal>
              <img className="jv-day__lace" src={JV.lace} alt="" aria-hidden="true" loading="lazy" />
              <img className="jv-day__frame" src={JV.frameCream} alt="" aria-hidden="true" loading="lazy" />
              <img className="jv-day__bow" src={JV.velvetBow} alt="" aria-hidden="true" loading="lazy" />
              <img className="jv-day__bouquet" src={JV.bouquet} alt="" aria-hidden="true" loading="lazy" />
              <ol className="jv-day__list">
                {rundown.map((row, index) => (
                  <li className="jv-day__row" key={`${row.time || "row"}-${index}`}>
                    <img className="jv-day__icon" src={rundownArt(index)} alt="" aria-hidden="true" loading="lazy" />
                    <div className="jv-day__text">
                      {row.time && <span className="jv-day__time">{row.time}</span>}
                      {row.description && <span className="jv-day__desc">{row.description}</span>}
                    </div>
                    {index < rundown.length - 1 && <span className="jv-day__sep" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 10 — GALLERY */}
        {gallery.length > 0 && (
          <section className="jv-sec jv-gallery" id="galeri" aria-label={t("secGallery", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.gallery_title || t("secGallery", lang)}
              </h2>
              {(tc.gallery_intro || t("galleryIntro", lang)) && (
                <p className="jv-lead" data-jv-reveal>
                  {tc.gallery_intro || t("galleryIntro", lang)}
                </p>
              )}
            </div>
            <div className="jv-gallery__grid" data-jv-reveal>
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className="jv-gallery__item"
                  key={`${photo}-${index}`}
                  onClick={() => setViewer({ photos: gallery, index })}
                  aria-label={`${t("viewPhoto", lang).replace("{n}", String(index + 1))}`}
                >
                  <img src={photo} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 11 — VIDEO */}
        {hasVideo && video && (
          <section className="jv-sec jv-video" id="video" aria-label={t("secVideo", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.video_title || t("secVideo", lang)}
              </h2>
              {tc.video_intro && (
                <p className="jv-lead" data-jv-reveal>
                  {tc.video_intro}
                </p>
              )}
            </div>
            <button type="button" className="jv-film" onClick={() => setFilmOpen(true)} data-jv-reveal aria-label={t("playFilm", lang)}>
              <img className="jv-film__poster" src={filmPoster} alt="" loading="lazy" />
              <img className="jv-film__frame" src={JV.frameCream} alt="" aria-hidden="true" loading="lazy" />
              <span className="jv-film__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M8 4.5 20 12 8 19.5z" />
                </svg>
              </span>
              <span className="jv-film__caption">{tc.video_caption || t("watch", lang)}</span>
            </button>
          </section>
        )}

        {/* 12 — WEDDING GIFT */}
        {hasGift && (
          <section className="jv-sec jv-gift" id="gift" aria-label={t("secGift", lang)}>
            <div className="jv-pad">
              <h2 className="jv-title" data-jv-reveal>
                {tc.gift_title || t("secGift", lang)}
              </h2>
            </div>
            <div className="jv-gift__hero" data-jv-reveal>
              <img src={JV.giftEnvelope} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <div className="jv-pad">
            {(tc.gift_intro || t("giftIntro", lang)) && (
              <p className="jv-lead" data-jv-reveal>
                {tc.gift_intro || t("giftIntro", lang)}
              </p>
            )}

            {giftTabs && (
              <div className="jv-gift__tabs" role="tablist" data-jv-reveal>
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "transfer"}
                  className={giftTab === "transfer" ? "is-active" : ""}
                  onClick={() => setGiftTab("transfer")}
                >
                  {tc.gift_transfer_tab || t("giftTransferTab", lang)}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "address"}
                  className={giftTab === "address" ? "is-active" : ""}
                  onClick={() => setGiftTab("address")}
                >
                  {tc.gift_address_tab || t("giftAddressTab", lang)}
                </button>
              </div>
            )}

            {(!giftTabs || giftTab === "transfer") && accounts.length > 0 && (
              <div className="jv-gift__panel" data-jv-reveal>
                <p className="jv-gift__lead">{tc.gift_transfer_lead || t("giftTransferLead", lang)}</p>
                {accounts.map((account, index) => (
                  <div className="jv-bank" key={`${account.account_number}-${index}`}>
                    <p className="jv-bank__name">{account.provider_name || account.type || t("giftTransferTab", lang)}</p>
                    <p className="jv-bank__num">
                      <span>{account.account_number}</span>
                      <button
                        type="button"
                        className="jv-copy"
                        aria-label={t("copyAccount", lang)}
                        onClick={() => void copyValue(account.account_number || "", t("copied", lang))}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                        </svg>
                      </button>
                    </p>
                    {account.account_name && <p className="jv-bank__acc">{account.account_name}</p>}
                  </div>
                ))}
              </div>
            )}

            {(!giftTabs || giftTab === "address") && giftAddress && (
              <div className="jv-gift__panel" data-jv-reveal>
                <p className="jv-gift__lead">{tc.gift_address_lead || t("giftAddressLead", lang)}</p>
                <div className="jv-bank">
                  {giftAddressName && <p className="jv-bank__name">{giftAddressName}</p>}
                  <p className="jv-bank__addr">{giftAddress}</p>
                  <button
                    type="button"
                    className="jv-btn jv-btn--ghost"
                    onClick={() => void copyValue([giftAddressName, giftAddress].filter(Boolean).join("\n"), t("copyAddressToast", lang) || t("copied", lang))}
                  >
                    {tc.copy_address_button || t("copyAddress", lang)}
                  </button>
                </div>
              </div>
            )}
            </div>
          </section>
        )}

        {/* 13 — DRESS CODE */}
        {hasDresscode && (
          <section className="jv-sec jv-dress" id="dresscode" aria-label={t("secDresscode", lang)}>
            <div className="jv-pad">
            <h2 className="jv-title" data-jv-reveal>
              {tc.dresscode_title || t("secDresscode", lang)}
            </h2>
            {tc.dresscode_kicker && (
              <p className="jv-lead" data-jv-reveal>
                {tc.dresscode_kicker}
              </p>
            )}
            <div className="jv-dress__card" data-jv-reveal>
              <img className="jv-dress__bow" src={JV.velvetBow} alt="" aria-hidden="true" loading="lazy" />
              {dresscode?.title && <p className="jv-dress__name">{dresscode.title}</p>}
              {dresscode?.description && <p className="jv-dress__body">{dresscode.description}</p>}
              {dresscodeColors.length > 0 && (
                <ul className="jv-dress__colors">
                  {dresscodeColors.map((color, index) => (
                    <li key={`${color.hex || "color"}-${index}`}>
                      <span className="jv-dress__dot" style={{ background: color.hex || "#6a1424" } as CSSProperties} aria-hidden="true" />
                      <span className="jv-dress__label">{color.name || `${t("colorN", lang)} ${index + 1}`}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tc.dresscode_note && <p className="jv-dress__note">{tc.dresscode_note}</p>}
            </div>
            </div>
          </section>
        )}

        {/* 14 — WISHES */}
        <section className="jv-sec jv-wishes" id="ucapan" aria-label={t("secWishes", lang)}>
          <div className="jv-pad">
          <h2 className="jv-title" data-jv-reveal>
            {tc.wishes_title || t("secWishes", lang)}
          </h2>
          {(tc.wishes_intro || t("wishesIntro", lang)) && (
            <p className="jv-lead" data-jv-reveal>
              {tc.wishes_intro || t("wishesIntro", lang)}
            </p>
          )}
          <div className="jv-wishes__card" data-jv-reveal>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              language={lang}
              copy={{
                nameLabel: tc.wishes_name_label || t("yourName", lang),
                namePlaceholder: tc.wishes_name_placeholder || t("namePlaceholder", lang),
                messageLabel: tc.wishes_message_label || t("yourMessage", lang),
                messagePlaceholder: tc.wishes_message_placeholder || t("messagePlaceholder", lang),
                submit: tc.wishes_submit || t("sendWishes", lang),
                empty: tc.wishes_empty || t("noWishesYet", lang),
              }}
            />
          </div>
          </div>
        </section>

        {/* 15 — TURUT MENGUNDANG */}
        {honored.length > 0 && (
          <section className="jv-sec jv-inviting" id="inviting" aria-label={t("secInviting", lang)}>
            <div className="jv-pad">
            <h2 className="jv-title" data-jv-reveal>
              {tc.inviting_title || t("secInviting", lang)}
            </h2>
            <p className="jv-lead" data-jv-reveal>
              {tc.inviting_intro || t("invitingIntro", lang)}
            </p>
            <div className="jv-inviting__card" data-jv-reveal>
              <ul>
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </div>
            </div>
          </section>
        )}

        {/* 16 — CLOSING */}
        <section className="jv-closing" id="closing" aria-label={t("secClosing", lang)}>
          <div className="jv-closing__stage">
            <img className="jv-closing__bg" src={JV.coverCurtain} alt="" aria-hidden="true" loading="lazy" />
            <img className="jv-closing__chandelier" src={JV.coverChandelier} alt="" aria-hidden="true" loading="lazy" />
            <div className="jv-closing__copy" data-jv-reveal>
              <p className="jv-closing__kicker">{tc.closing_kicker || t("thankYou", lang)}</p>
              <p className="jv-closing__message">{closingMessage}</p>
              <p className="jv-closing__names">{coupleLabel}</p>
              <p className="jv-closing__date">{closingDate}</p>
            </div>
            <img className="jv-closing__garland" src={JV.garland} alt="" aria-hidden="true" loading="lazy" />
          </div>
          <footer className="jv-footer">
            <a className="jv-footer__link" href={waHref} target="_blank" rel="noopener noreferrer" aria-label={t("contactAksaraa", lang)}>
              <span className="jv-footer__badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt={t("aksaraaWedding", lang)} draggable={false} />
              </span>
              <span className="jv-footer__cta">{t("weddingByAksaraa", lang)}</span>
            </a>
          </footer>
        </section>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className="jv-fab"
          onClick={toggleMusic}
          aria-label={playing ? t("pauseMusic", lang) : t("playMusic", lang)}
          aria-pressed={playing}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            {playing ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M16 9.5 21 14.5M21 9.5 16 14.5" />}
          </svg>
        </button>
      )}

      {viewer && viewer.photos[viewer.index] && (
        <div
          className="jv-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("photoViewer", lang)}
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            className="jv-lightbox__close"
            aria-label={t("close", lang)}
            onClick={() => setViewer(null)}
          >
            ×
          </button>
          {viewer.photos.length > 1 && (
            <button
              type="button"
              className="jv-lightbox__nav jv-lightbox__nav--prev"
              aria-label={t("previousPhoto", lang)}
              onClick={(event) => {
                event.stopPropagation()
                stepViewer(-1)
              }}
            >
              ‹
            </button>
          )}
          <img
            src={viewer.photos[viewer.index]}
            alt=""
            onClick={(event) => event.stopPropagation()}
          />
          {viewer.photos.length > 1 && (
            <button
              type="button"
              className="jv-lightbox__nav jv-lightbox__nav--next"
              aria-label={t("nextPhoto", lang)}
              onClick={(event) => {
                event.stopPropagation()
                stepViewer(1)
              }}
            >
              ›
            </button>
          )}
          <span className="jv-lightbox__count" aria-hidden="true">
            {viewer.index + 1} / {viewer.photos.length}
          </span>
        </div>
      )}

      {filmOpen && video && (
        <div className="jv-filmmodal" role="dialog" aria-modal="true" aria-label={t("secVideo", lang)} onClick={() => setFilmOpen(false)}>
          <button
            type="button"
            className="jv-filmmodal__close"
            aria-label={t("close", lang)}
            onClick={() => setFilmOpen(false)}
          >
            ×
          </button>
          <div className="jv-filmmodal__box" onClick={(event) => event.stopPropagation()}>
            {video.kind === "file" ? (
              <video className="jv-filmmodal__video" src={video.src} controls autoPlay playsInline />
            ) : (
              <iframe
                className="jv-filmmodal__video"
                src={video.src}
                title={tc.video_title || t("secVideo", lang)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="jv-toast" role="status">
          {toast}
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || GUEST_FALLBACK}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          language={lang}
        />
      )}
    </div>
  )
}
