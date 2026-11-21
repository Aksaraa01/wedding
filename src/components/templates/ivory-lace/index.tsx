"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  countdownTarget,
  flattenPhotos,
  formatDotDate,
  gcalLink,
  groomPhoto,
  bridePhoto,
  initialsOf,
  initialsGlyphs,
  monogramFontSize,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./ivory-lace.css"
import { normalizeLanguage, t } from "@/lib/i18n"

// ── Static art (authored for this template) ────────────────────────────────
// Everything decorative here is our own SVG: the reference's lace, seals,
// wreaths, sprigs, pins and icons are licensed Canva stock and are not shipped.
const ART = (name: string) => `/templates/ivory-lace/${name}`
// Reference artwork, vendored from the design (see docs/REA_IVORY_LACE.md §5a).
const ART_ENVELOPE = ART("envelope.webp")
const ART_SEAL = ART("seal.webp")
const ART_WREATH = ART("wreath.webp")
const ART_SPRIG = ART("sprig.webp")
const ART_PIN = ART("pin.webp")
const ART_DIVIDER = ART("divider.svg")
const ART_PAPERCLIP = ART("paperclip.svg")
const ART_VINYL = ART("vinyl.webp")
const ART_NOTES = ART("icon-music.svg")
const ART_HEART = ART("icon-heart.svg")
// One drawn icon per rundown row, matching the reference's timeline set.
const ART_STEPS = [
  ART("icon-arrival.svg"),
  ART("icon-rings.svg"),
  ART("icon-camera.svg"),
  ART("icon-dinner.svg"),
  ART("icon-music.svg"),
  ART("icon-cake.svg"),
  ART("icon-car.svg"),
]

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const CAL_MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
]
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

const DEFAULT_WELCOME =
  "We are so happy to share this day with you, surrounded by the people we love most."
const DEFAULT_EVENTS_INTRO =
  "We would be honoured to have you with us as we say our vows."
const DEFAULT_INVITING =
  "Together with the families who share this invitation."

const pad2 = (n: number) => String(n).padStart(2, "0")

// The reference draws the "&" of a display heading a size smaller than the
// words around it. Split on the character so the copy stays editable.
function ampParts(text: string) {
  return text.split("&").flatMap((part, index, all) =>
    index === 0 ? [part] : [<i className="amp" key={`amp-${index}`}>&amp;</i>, part]
  )
}

function longDate(value?: string | null): string {
  if (!value) return ""
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  if (isNaN(d.getTime())) return ""
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function eventDate(profile: TemplateProps): Date | null {
  const raw = String(profile.estimated_wedding_date || profile.sessions?.[0]?.date || "").trim()
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function calendarWeeks(date: Date): Array<Array<number | null>> {
  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1)
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let day = 1; day <= days; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<number | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function useCountdown(iso?: string, sessions?: TemplateProps["sessions"]) {
  const target = useMemo(() => countdownTarget(sessions, iso), [sessions, iso])
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!target) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])
  if (!target || now === null) return null
  const diff = Math.max(0, target.getTime() - now)
  return {
    d: pad2(Math.floor(diff / 86400000)),
    h: pad2(Math.floor((diff % 86400000) / 3600000)),
    m: pad2(Math.floor((diff % 3600000) / 60000)),
    s: pad2(Math.floor((diff % 60000) / 1000)),
  }
}

// ── Ornaments (reference artwork) ──────────────────────────────────────────

function Monogram({ text, className }: { text: string; className?: string }) {
  const monogramCount = initialsGlyphs(text).length
  return (
    <span className={`il-monogram${className ? ` ${className}` : ""}`}>
      <img src={ART_WREATH} alt="" aria-hidden="true" />
      <b style={monogramCount > 2 ? { fontSize: `${monogramFontSize(text, 43)}px` } : undefined}>{text}</b>
    </span>
  )
}

function HeartRule({ className }: { className?: string }) {
  return (
    <img
      className={`il-rule${className ? ` ${className}` : ""}`}
      src={ART_DIVIDER}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function IvoryLace(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [openAccount, setOpenAccount] = useState(-1)
  const [toast, setToast] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const sessions = (profile.sessions || []).filter(Boolean)
  const main = sessions[0]
  const events = sessions.filter((s) => !!(s.name || s.venue || s.date || s.address))

  const groom = profile.groom_name || (lang === "en" ? "The Groom" : "Mempelai Pria")
  const bride = profile.bride_name || (lang === "en" ? "The Bride" : "Mempelai Wanita")
  const groomFull = profile.groom_full_name || groom
  const brideFull = profile.bride_full_name || bride
  const coupleLabel = [groom, bride].join(" & ")

  const initials = initialsOf(profile.groom_name, profile.bride_name)
  const derivedMonogram = initials.length === 2 ? `${initials[0]}${initials[1]}` : initials
  const monogram = ((profile.couple_initials || "").trim() || derivedMonogram || "A&M").replace(/\s|&/g, "")

  const covers = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  // Cover slots are semantic (see TEMPLATE_CONFIGS): 0 hero, 1 love story,
  // 2/3 the event photographs, 4 closing.
  const coverImage = covers[0] || ""
  const storyImage = covers[1] || covers[0] || ""
  const closingImage = covers[4] || covers[3] || covers[1] || covers[0] || ""

  const galleryPhotos = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  // Each event has its own upload (cover slot 2, 3 …); a gallery photo is only
  // a fallback so an event card is never empty.
  const eventPhoto = (index: number) => covers[2 + index] || galleryPhotos[index] || covers[0] || ""

  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description))
      : []

  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
      : []
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((i) => i && (i.time || i.description))
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode =
    profile.dresscode_visible !== false &&
    (dressColors.length > 0 || !!(profile.dresscode?.title || profile.dresscode?.description))

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = !!film && gates.video !== false && profile.video_section_visible !== false

  const eventDay = useMemo(() => eventDate(profile), [profile])
  const dateDot = formatDotDate(profile.estimated_wedding_date || main?.date)
  const guestName = profile.guest_name || t("honoredGuest", lang)
  const calendarUrl = gcalLink(main, profile.groom_name || "", profile.bride_name || "")

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl

  // Instagram hashtag, the same convention as the adat templates: the couple's
  // display name when it starts with "#", their names otherwise.
  const rawHashtag = (profile.display_name || "").trim()
  const hashtag = rawHashtag.startsWith("#")
    ? rawHashtag
    : `#${`${groom}${bride}`.replace(/[^A-Za-z0-9]/g, "")}`

  const welcomeTitle = (profile.opening_title || "").trim() || tc.welcome_invite || (lang === "en" ? "Dear Family & Friends" : "Keluarga & Sahabat Tercinta")
  const welcomeMessage = (profile.opening_description || "").trim() || tc.welcome_message || DEFAULT_WELCOME

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const openInvitation = useCallback(() => {
    if (opened) return
    setOpened(true)
    if (hasTrack) {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    }
    window.scrollTo(0, 0)
  }, [hasTrack, opened])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [opened])

  // Reveal-on-scroll, re-armed when the invitation opens.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !opened) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-il-reveal]"))
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    )
    items.forEach((item) => io.observe(item))
    return () => io.disconnect()
  }, [opened])

  // Lightbox keyboard controls.
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (event.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % galleryPhotos.length))
      if (event.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + galleryPhotos.length) % galleryPhotos.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, galleryPhotos.length])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    else {
      audio.pause()
      setPlaying(false)
    }
  }

  const showToast = (text: string) => {
    setToast(text)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2600)
  }

  const copyText = (value?: string) => {
    if (!value) return
    if (!navigator.clipboard?.writeText) {
      showToast("Copy is not available in this browser")
      return
    }
    navigator.clipboard.writeText(value).then(
      () => showToast("Copied"),
      () => showToast("Could not copy")
    )
  }

  const bg = (image: string) => ({ backgroundImage: `url(${image})` }) as CSSProperties
  const weeks = eventDay ? calendarWeeks(eventDay) : []

  return (
    <div ref={rootRef} className={`il-root${opened ? " is-open" : " is-locked"}`}>
      {hasTrack && (
        <audio
          ref={audioRef}
          loop
          preload="metadata" data-warm-audio=""
          src={trackUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {hasTrack && opened && (
        <button
          type="button"
          className={`il-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="il-music__disc" aria-hidden="true">
            <img src={ART_VINYL} alt="" draggable={false} />
          </span>
          <span className="il-music__label">{playing ? "Pause" : "Play"}</span>
        </button>
      )}

      <main className="il-invitation" aria-hidden={!opened}>
        {/* ── 1. Cover ─────────────────────────────────────────── */}
        <section className="il-cover" data-section="cover" id="il-cover">
          {coverImage && <span className="il-cover__photo" style={bg(coverImage)} aria-hidden="true" />}
          <span className="il-cover__veil" aria-hidden="true" />
          <div className="il-cover__body" data-il-reveal>
            <Monogram text={monogram} />
            <p className="il-kicker">{tc.cover_kicker || t("theWeddingOf", lang)}</p>
            <h1 className="il-cover__names">
              <span>{groom}</span>
              <em>&amp;</em>
              <span>{bride}</span>
            </h1>
            {dateDot && <p className="il-cover__date">{dateDot}</p>}
          </div>
        </section>

        {/* ── 3+4. Welcome / kalimat pembuka ───────────────────── */}
        <section className="il-section il-welcome" data-section="welcome">
          <div className="il-plate il-welcome__plate" data-il-reveal>
            <img className="il-welcome__sprig" src={ART_SPRIG} alt="" aria-hidden="true" loading="lazy" />
            <h2 className="il-display il-welcome__title">{ampParts(welcomeTitle)}</h2>
            <HeartRule className="il-welcome__rule" />
            <p className="il-body il-welcome__message">{welcomeMessage}</p>
            <p className="il-body il-welcome__signoff">With love,</p>
            <p className="il-script il-welcome__names">
              <span>{groom}</span>
              <i>&amp;</i>
              <span>{bride}</span>
            </p>
          </div>
        </section>

        {/* ── 5. Mempelai ──────────────────────────────────────── */}
        <section className="il-section il-couple" data-section="couple">
          <div className="il-wrap il-couple__head" data-il-reveal>
            <h2 className="il-display il-heading">The Bride &amp; Groom</h2>
            {tc.profiles_intro && <p className="il-body il-couple__intro">{tc.profiles_intro}</p>}
          </div>

          <div className="il-wrap il-couple__pair">
            <article className="il-person" data-il-reveal>
              <figure className="il-person__photo">
                <img src={groomPhoto(profile.groom_photo_url)} alt={groomFull} loading="lazy" />
              </figure>
              <h3 className="il-script il-person__name">{groomFull}</h3>
              {profile.groom_parents && <p className="il-body il-person__parents">{profile.groom_parents}</p>}
              {profile.groom_instagram && (
                <a
                  className="il-link il-person__ig"
                  href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.groom_instagram.startsWith("@") ? profile.groom_instagram : `@${profile.groom_instagram}`}
                </a>
              )}
            </article>

            <span className="il-amp" aria-hidden="true">
              &amp;
            </span>

            <article className="il-person" data-il-reveal>
              <figure className="il-person__photo">
                <img src={bridePhoto(profile.bride_photo_url)} alt={brideFull} loading="lazy" />
              </figure>
              <h3 className="il-script il-person__name">{brideFull}</h3>
              {profile.bride_parents && <p className="il-body il-person__parents">{profile.bride_parents}</p>}
              {profile.bride_instagram && (
                <a
                  className="il-link il-person__ig"
                  href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.bride_instagram.startsWith("@") ? profile.bride_instagram : `@${profile.bride_instagram}`}
                </a>
              )}
            </article>
          </div>
        </section>

        {/* ── 6. Story (outside the 15, approved) ──────────────── */}
        {stories.length > 0 && (
          <section className="il-story" data-section="story">
            {storyImage && <span className="il-story__photo" style={bg(storyImage)} aria-hidden="true" />}
            <span className="il-story__veil" aria-hidden="true" />
            <div className="il-wrap il-story__body" data-il-reveal>
              <h2 className="il-script il-story__title">{tc.love_story_title || t("secStory", lang)}</h2>
              {tc.story_intro && <p className="il-story__intro">{tc.story_intro}</p>}
              {stories.map((story, index) => (
                <div className="il-story__chapter" key={`${story.title || "chapter"}-${index}`}>
                  {story.title && stories.length > 1 && (
                    <p className="il-story__chaptertitle">{story.title}</p>
                  )}
                  {story.description && <p className="il-story__text">{story.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Events ────────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="il-section il-events" data-section="events">
            <div className="il-wrap il-events__head" data-il-reveal>
              <h2 className="il-display il-heading">Ceremony &amp; Reception</h2>
              <p className="il-body il-events__intro">{tc.events_intro || DEFAULT_EVENTS_INTRO}</p>
            </div>

            {events.map((event, index) => {
              const photo = eventPhoto(index)
              const maps =
                event.maps_url ||
                (event.venue || event.address
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.venue, event.address].filter(Boolean).join(", ")
                    )}`
                  : "")
              return (
                <article className="il-event" key={`${event.name || "event"}-${index}`} data-il-reveal>
                  {photo && (
                    <figure className="il-photo il-photo--torn il-event__photo">
                      <img src={photo} alt="" loading="lazy" />
                    </figure>
                  )}
                  <div className="il-event__body">
                    <h3 className="il-display il-event__name">{event.name || t("weddingEventFallback", lang)}</h3>
                    <p className="il-script il-event__venue">{event.venue || ""}</p>
                    {(event.address || event.time) && (
                      <p className="il-body il-event__meta">
                        {[longDate(event.date), event.time].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {event.address && <p className="il-body il-event__address">{event.address}</p>}
                    {maps && (
                      <div className="il-event__pin">
                        <img className="il-pin" src={ART_PIN} alt="" aria-hidden="true" loading="lazy" />
                        <a className="il-btn il-btn--ghost il-btn--sm" href={maps} target="_blank" rel="noreferrer">
                          Location
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* ── 8. Countdown + calendar ──────────────────────────── */}
        {eventDay && (
          <section className="il-section il-countdown" data-section="countdown">
            <div className="il-wrap il-countdown__head" data-il-reveal>
              <h2 className="il-display il-heading">{t("saveTheDate", lang)}</h2>
            </div>

            <div className="il-calendar" data-il-reveal>
              <span className="il-calendar__clip" aria-hidden="true">
                <img src={ART_PAPERCLIP} alt="" draggable={false} />
              </span>
              <p className="il-calendar__month">
                {CAL_MONTHS[eventDay.getMonth()]} · {eventDay.getFullYear()}
              </p>
              <div className="il-calendar__grid" role="presentation">
                {WEEKDAYS.map((day, index) => (
                  <span className="il-calendar__dow" key={`${day}-${index}`}>
                    {day}
                  </span>
                ))}
                {weeks.flat().map((day, index) =>
                  day === null ? (
                    <span className="il-calendar__day is-empty" key={`empty-${index}`} />
                  ) : (
                    <span
                      className={`il-calendar__day${day === eventDay.getDate() ? " is-marked" : ""}`}
                      key={`day-${day}`}
                    >
                      {day === eventDay.getDate() ? (
                        <>
                          <svg className="il-calendar__heart" viewBox="0 0 24 22" aria-hidden="true">
                            <path
                              d="M12 20S2 13.6 2 7.6A5.6 5.6 0 0 1 12 4a5.6 5.6 0 0 1 10 3.6C22 13.6 12 20 12 20z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.3"
                            />
                          </svg>
                          <b>{day}</b>
                        </>
                      ) : (
                        day
                      )}
                    </span>
                  )
                )}
              </div>
            </div>

            <CountdownClock iso={profile.estimated_wedding_date} sessions={profile.sessions} />

            {calendarUrl && (
              <a className="il-btn il-btn--ghost il-countdown__cal" href={calendarUrl} target="_blank" rel="noreferrer">
                Add to calendar
              </a>
            )}
          </section>
        )}

        {/* ── 9. Turut mengundang ──────────────────────────────── */}
        {honored.length > 0 && (
          <section className="il-section il-inviting" data-section="inviting">
            <div className="il-wrap il-inviting__body" data-il-reveal>
              <h2 className="il-script il-inviting__title">With Honour</h2>
              <p className="il-body il-inviting__intro">{tc.inviting_intro || DEFAULT_INVITING}</p>
              <ul className="il-inviting__list">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── 10. Rundown ──────────────────────────────────────── */}
        {rundown.length > 0 && (
          <section className="il-section il-rundown" data-section="rundown">
            <div className="il-wrap il-rundown__head" data-il-reveal>
              <h2 className="il-display il-heading">{tc.rundown_title || t("rundownTitle", lang)}</h2>
              {tc.rundown_intro && <p className="il-body il-rundown__intro">{tc.rundown_intro}</p>}
            </div>
            <ol className="il-wrap il-rundown__list">
              {rundown.map((item, index) => (
                <li className="il-step" key={`${item.time || "step"}-${index}`} data-il-reveal>
                  <span className="il-step__thread" aria-hidden="true">
                    <img className="il-step__heart" src={ART_HEART} alt="" loading="lazy" />
                  </span>
                  <span className="il-step__icon" aria-hidden="true">
                    <img src={ART_STEPS[index % ART_STEPS.length]} alt="" loading="lazy" />
                  </span>
                  <span className="il-step__text">
                    <b>{item.time || ""}</b>
                    <em>{item.description || ""}</em>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── 11. Gallery ──────────────────────────────────────── */}
        {galleryPhotos.length > 0 && (
          <section className="il-section il-gallery" data-section="gallery">
            <div className="il-wrap il-gallery__head" data-il-reveal>
              <h2 className="il-display il-heading">{tc.gallery_title || t("secGallery", lang)}</h2>
              {tc.gallery_intro && <p className="il-body il-gallery__intro">{tc.gallery_intro}</p>}
            </div>
            <div className="il-wrap il-gallery__grid">
              {galleryPhotos.map((photo, index) => (
                <button
                  type="button"
                  className={`il-photo il-photo--torn il-gallery__tile${index % 3 === 0 ? " is-tall" : ""}`}
                  key={`${photo}-${index}`}
                  data-il-reveal
                  onClick={() => setLightbox(index)}
                  aria-label={`Open photograph ${index + 1} of ${galleryPhotos.length}`}
                >
                  <img src={photo} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            {tc.gallery_quote && <p className="il-script il-gallery__quote">{tc.gallery_quote}</p>}
          </section>
        )}

        {/* ── 12. Film ─────────────────────────────────────────── */}
        {hasVideo && (
          <section className="il-section il-film" data-section="video">
            <div className="il-wrap il-film__body" data-il-reveal>
              <h2 className="il-display il-heading">{tc.video_title || t("secVideo", lang)}</h2>
              {tc.video_intro && <p className="il-body il-film__intro">{tc.video_intro}</p>}

              <div className="il-film__player">
                <img className="il-film__sprig" src={ART_SPRIG} alt="" aria-hidden="true" loading="lazy" />
                <div className="il-film__still">
                  {film!.kind === "file" ? (
                    <video src={film!.src} autoPlay muted loop playsInline preload="metadata" />
                  ) : (
                    <iframe
                      src={film!.src}
                      title={tc.video_title || t("secVideo", lang)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  )}
                </div>
                <img className="il-film__vinyl" src={ART_VINYL} alt="" aria-hidden="true" loading="lazy" />
              </div>
              {tc.video_caption && <p className="il-film__caption">{tc.video_caption}</p>}
            </div>
          </section>
        )}

        {/* ── 13. Gift ─────────────────────────────────────────── */}
        {hasGift && (
          <section className="il-section il-gift" data-section="gift">
            <div className="il-wrap il-gift__body" data-il-reveal>
              <h2 className="il-display il-heading il-gift__heading">{tc.gift_intro_title || t("secGift", lang)}</h2>
              <p className="il-body il-gift__intro">
                {tc.gift_intro_description ||
                  "Your presence is the greatest gift. Should you wish to send a token of love, the details are below."}
              </p>

              {accounts.length > 0 && (
                <ul className="il-accounts">
                  {accounts.map((account, index) => {
                    const open = openAccount === index
                    return (
                      <li className={`il-account${open ? " is-open" : ""}`} key={`${account.account_number || "acc"}-${index}`}>
                        <button
                          type="button"
                          className="il-account__head"
                          aria-expanded={open}
                          onClick={() => setOpenAccount(open ? -1 : index)}
                        >
                          <span>{account.provider_name || (lang === "en" ? "Bank Account" : "Rekening Bank")}</span>
                          <svg className="il-account__chev" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 9.5 12 15l6-5.5" />
                          </svg>
                        </button>
                        <div className="il-account__panel">
                          <div className="il-account__inner">
                            {account.account_number && <p className="il-account__number">{account.account_number}</p>}
                            {account.account_name && <p className="il-account__name">{account.account_name}</p>}
                            {account.account_number && (
                              <button type="button" className="il-link" onClick={() => copyText(account.account_number)}>
                                Copy number
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {giftAddress && (
                <div className="il-address">
                  {profile.gift_address_name && <p className="il-address__name">{profile.gift_address_name}</p>}
                  <p className="il-address__text">{giftAddress}</p>
                  <button type="button" className="il-link" onClick={() => copyText(giftAddress)}>
                    Copy address
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 14. Dress code ───────────────────────────────────── */}
        {hasDresscode && (
          <section className="il-section il-dress" data-section="dresscode">
            <div className="il-wrap il-dress__body" data-il-reveal>
              <h2 className="il-display il-heading">Attire</h2>
              {profile.dresscode?.title && <p className="il-script il-dress__title">{profile.dresscode.title}</p>}
              {profile.dresscode?.description && (
                <p className="il-body il-dress__note">{profile.dresscode.description}</p>
              )}
              {dressColors.length > 0 && (
                <div className="il-swatches" aria-label="Dress code palette">
                  {dressColors.map((color, index) => (
                    <span className="il-swatch" key={`${color.hex || color.name}-${index}`}>
                      <i style={{ ["--il-swatch" as string]: color.hex || "#ccc" } as CSSProperties} aria-hidden="true" />
                      {color.name && <em>{color.name}</em>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 15. Wishes ───────────────────────────────────────── */}
        <section className="il-section il-wishes" data-section="wishes">
          <div className="il-wrap il-wishes__body" data-il-reveal>
            <h2 className="il-display il-heading">Wishes</h2>
            <p className="il-body il-wishes__intro">
              {tc.wishes_intro ||
                "Nothing would make us happier than celebrating this day surrounded by the people we love. Leave us a wish, and let us know you are coming."}
            </p>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel} language={profile.language}
            />
          </div>
        </section>

        {/* ── 16. Closing ──────────────────────────────────────── */}
        <section className="il-closing" data-section="closing">
          <div className="il-wrap il-closing__body" data-il-reveal>
            <Monogram text={monogram} />
            <p className="il-script il-closing__title">Thank You</p>
            {closingImage && (
              <figure className="il-photo il-photo--torn il-closing__photo">
                <img src={closingImage} alt="" loading="lazy" />
                <figcaption className="il-closing__names">{coupleLabel}</figcaption>
              </figure>
            )}
            <p className="il-hashtag">{hashtag}</p>
            <p className="il-body il-closing__message">
              {tc.closing_message || (lang === "en" ? "We cannot wait to celebrate with you." : "Kami tidak sabar merayakan hari bahagia ini bersama Anda.")}
            </p>
            {tc.cover_apology && <p className="il-closing__apology">{tc.cover_apology}</p>}

            <footer className="tpl-footer il-footer">
              <a
                className="tpl-footer__link"
                href={`https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
                  "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Aksaraa Wedding via WhatsApp"
              >
                <span className="tpl-footer__badge">
                  <img
                    src={ASSETS.galeriEnvelope.aksaraaLogo}
                    alt="Aksaraa Wedding"
                    className="tpl-footer__logo"
                    draggable={false}
                  />
                </span>
                <span className="tpl-footer__cta">Wedding by Aksaraa</span>
              </a>
              <p className="tpl-footer__text">
                © {new Date().getFullYear()} {coupleLabel}. All rights reserved.
              </p>
            </footer>
          </div>
        </section>
      </main>

      {/* ── Sealed envelope ──────────────────────────────────────── */}
      <div
        className={`il-gate${opened ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
        onClick={openInvitation}
      >
        <div className="il-gate__card">
          <span className="il-gate__lace" style={bg(ART_ENVELOPE)} aria-hidden="true" />
          <div className="il-gate__body">
            <p className="il-script il-gate__letter">A Letter From Our Hearts</p>
            <HeartRule className="il-gate__rule" />
            <h1 className="il-gate__names">
              <span>{groom}</span>
              <em>&amp;</em>
              <span>{bride}</span>
            </h1>
            <img className="il-gate__seal" src={ART_SEAL} alt="" aria-hidden="true" draggable={false} />
            <button type="button" className="il-gate__open" onClick={openInvitation}>
              Open
            </button>
            <p className="il-gate__guest">
              <span>Dear,</span>
              <strong>{guestName}</strong>
            </p>
          </div>
        </div>
        <span className="il-gate__brand">Wedding by Aksaraa</span>
      </div>

      {lightbox !== null && galleryPhotos[lightbox] && (
        <div className="il-lightbox" role="dialog" aria-modal="true" aria-label="Photograph">
          <button
            type="button"
            className="il-lightbox__nav il-lightbox__nav--prev"
            onClick={() => setLightbox((lightbox - 1 + galleryPhotos.length) % galleryPhotos.length)}
            aria-label="Previous photograph"
          >
            ‹
          </button>
          <img src={galleryPhotos[lightbox]} alt="" />
          <button
            type="button"
            className="il-lightbox__nav il-lightbox__nav--next"
            onClick={() => setLightbox((lightbox + 1) % galleryPhotos.length)}
            aria-label="Next photograph"
          >
            ›
          </button>
          <button type="button" className="il-lightbox__close" onClick={() => setLightbox(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || t("honoredGuest", lang)}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          language={profile.language}
          anchor="bottom"
          bottom={92}
        />
      )}

      {toast && (
        <div className="il-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function CountdownClock({ iso, sessions }: { iso?: string; sessions?: TemplateProps["sessions"] }) {
  const c = useCountdown(iso, sessions)
  const cells: Array<[string, string]> = [
    [c?.d ?? "00", "Days"],
    [c?.h ?? "00", "Hours"],
    [c?.m ?? "00", "Minutes"],
    [c?.s ?? "00", "Seconds"],
  ]
  return (
    <div className="il-clock" aria-label="Wedding countdown">
      {cells.map(([value, label], index) => (
        <Fragment key={label}>
          <div className="il-clock__cell">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
          {index < cells.length - 1 && (
            <span className="il-clock__sep" aria-hidden="true">
              :
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
