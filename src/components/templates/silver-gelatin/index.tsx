"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
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
import "./silver-gelatin.css"

const WISH_ME = "Tamu Undangan"

const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function longDateEn(value?: string | null, withDay = false): string {
  const d = parseDate(value)
  if (!d) return ""
  const core = `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return withDay ? `${EN_DAYS[d.getDay()]}, ${core}` : core
}

// "22 . 05 . 2027" — the reference's spaced dot date.
function dotDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} . ${pad2(d.getMonth() + 1)} . ${d.getFullYear()}`
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th"
  if (n % 10 === 1) return "st"
  if (n % 10 === 2) return "nd"
  if (n % 10 === 3) return "rd"
  return "th"
}

// "Saturday, May 22nd, 2027, at 08:00 – 10:00"
function eventLine(date?: string | null, time?: string | null): string {
  const d = parseDate(date)
  if (!d) return (time || "").trim()
  const day = `${EN_DAYS[d.getDay()]}, ${EN_MONTHS[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()}`
  const clock = (time || "").trim()
  return clock ? `${day}, at ${clock}` : day
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return (t.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  return t.replace(/^@/, "")
}

type RevealKind = "up" | "fade" | "zoom" | "right" | "left"
type RevealProps = { "data-sg-reveal"?: RevealKind; "data-sg-load"?: RevealKind; style?: CSSProperties }

const IN = (kind: RevealKind, delay = 0): RevealProps => ({
  "data-sg-reveal": kind,
  style: { "--sg-delay": `${delay}s` } as CSSProperties,
})
const ON_LOAD = (kind: RevealKind, delay = 0): RevealProps => ({
  "data-sg-load": kind,
  style: { "--sg-delay": `${delay}s` } as CSSProperties,
})

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
    { value: pad2(Math.floor(diff / 86400000)), label: "days" },
    { value: pad2(Math.floor((diff % 86400000) / 3600000)), label: "hours" },
    { value: pad2(Math.floor((diff % 3600000) / 60000)), label: "minutes" },
    { value: pad2(Math.floor((diff % 60000) / 1000)), label: "seconds" },
  ]

  return (
    <div className="sg-clock" aria-label="Countdown to the wedding day">
      {units.map((unit, index) => (
        <Fragment key={unit.label}>
          {index > 0 && <b className="sg-clock__sep" aria-hidden="true">:</b>}
          <div className="sg-clock__cell">
            <span className="sg-clock__value">{target ? unit.value : "--"}</span>
            <small className="sg-clock__label">{unit.label}</small>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

export default function SilverGelatin(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toast, setToast] = useState("")
  const [giftOpen, setGiftOpen] = useState(false)
  const [filmOn, setFilmOn] = useState(false)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])

  const coverShot = slots[0] || coverPhoto(profile)
  const eventShot = slots[1] || gallery[0] || coverShot
  // The full-bleed band after the gallery takes the last gallery photo and
  // removes it from the grid, so the same frame is never shown twice in a row.
  const dividerShot = gallery.length >= 4 ? gallery[gallery.length - 1] : ""
  const gridPhotos = dividerShot ? gallery.slice(0, -1) : gallery
  const dressShot = slots[2] || gallery[0] || coverShot
  const groomShot = groomPhotoOf(profile.groom_photo_url)
  const brideShot = bridePhotoOf(profile.bride_photo_url)

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () =>
      gates.story === false || profile.story_visible === false
        ? []
        : (profile.stories || []).filter((s) => s && (s.title || s.description)),
    [profile.stories, gates.story, profile.story_visible]
  )
  const rundown =
    profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
      : []

  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const dressIntro = (tc.dresscode_intro || profile.dresscode?.description || "").trim()
  const dressTitle = (profile.dresscode?.title || "").trim()
  const dressNote = (tc.dresscode_note || "").trim()
  const hasDresscode = profile.dresscode_visible !== false && (dressColors.length > 0 || !!dressIntro || !!dressTitle)

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!film

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const coupleInitials =
    [brideName.charAt(0), groomName.charAt(0)].filter(Boolean).join("") ||
    (profile.couple_initials || "").trim()
  const guestName = (profile.guest_name || "").trim() || WISH_ME
  const dateObject = parseDate(profile.estimated_wedding_date)
  const dateDot = dotDate(profile.estimated_wedding_date)
  const mainEvent = events[0]
  const calendarUrl = gcalLink(mainEvent, groomName, brideName)

  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  // ── copy (every string reachable from the editor; defaults are fallbacks) ──
  const openLabel = (tc.open_button || "").trim() || "Open Invitation"
  const apology = (tc.cover_apology || "").trim() || "We apologize for any misspelling of your name or title."
  const dearLabel = (tc.cover_kicker || "").trim() || "Dear"
  const welcomeGreeting = (profile.opening_title || tc.welcome_message || "").trim() || "Dear family and friends!"
  const welcomeBody =
    (profile.opening_description || "").trim() ||
    (tc.welcome_invite || "").trim() ||
    "With great joy, we invite you to share in the special day of our wedding."
  const welcomeDateLead = (tc.events_kicker || "").trim() || "The celebration will take place on"
  const photoOneLabel = (tc.story_kicker || "").trim() || "Love story"
  const photoTwoLabel = (tc.gallery_kicker || "").trim() || "Wedding"
  const coupleHeading = (tc.mempelai_kicker || "").trim() || "The Couple"
  const parentsLabel = (tc.parents_label || "").trim()
  const storyTitle = (tc.love_story_title || "").trim() || "Our Story"
  const storyIntro = (tc.story_intro || "").trim()
  const eventsTitle = (tc.events_title || "").trim() || "Venue"
  const eventsIntro = (tc.events_intro || "").trim() || "We look forward to welcoming you at:"
  const eventsNote = (tc.events_note || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "View Location"
  const countdownIntro = (tc.countdown_intro || "").trim() || "Counting down to our big day, only a little time left"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "With the blessing of"
  const invitingTitle = (tc.inviting_title || "").trim() || "Our Families"
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownKicker = (tc.rundown_kicker || "").trim() || "The Programme"
  const rundownTitle = (tc.rundown_title || "").trim() || "Order of the Day"
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryTitle = (tc.gallery_title || "").trim() || "Moments"
  const galleryIntro = (tc.gallery_intro || "").trim() || "Little snippets of our journey"
  const videoTitle = (tc.video_title || "").trim() || "Our Film"
  const videoIntro = (tc.video_intro || "").trim()
  const giftTitle = (tc.gift_intro_title || "").trim() || "Wedding Gift"
  const giftIntro = (tc.gift_intro_description || "").trim() ||
    "Your blessings are the most beautiful gift to us. But should you wish to give a token of love, you may do so via:"
  const giftButton = (tc.gift_button || "").trim() || "Direct Transfer"
  const giftSignature = (tc.gift_signature || "").trim()
  const dressHeading = (tc.dresscode_kicker || "").trim() || "Dresscode"
  const wishesTitle = (tc.wishes_title || "").trim() || "Wishes"
  const wishesIntro = (tc.wishes_intro || "").trim() || "Write your best prayers and wishes for us."
  const closingMessage = (tc.closing_message || "").trim() ||
    "Thank you for your prayers and presence. It is an honour for us to celebrate this day with you."
  const closingSee = (tc.closing_see || "").trim() || "See you!"
  const accountToast = (tc.copy_account_toast || "").trim() || "Account number copied"
  const addressToast = (tc.copy_address_toast || "").trim() || "Address copied"
  const addressButton = (tc.copy_address_button || "").trim() || "Copy address"

  const wishCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || "Name",
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || "Your full name",
    messageLabel: (tc.wishes_message_label || "").trim() || "Message",
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || "Leave a wish for the couple",
    submit: (tc.wishes_submit || "").trim() || "Submit now",
    empty: (tc.wishes_empty || "").trim() || "No wishes yet. Be the first.",
  }

  const target = useMemo(
    () => countdownTarget(events, profile.estimated_wedding_date),
    [events, profile.estimated_wedding_date]
  )

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2200)
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
    playMusic()
    const next = rootRef.current?.querySelector<HTMLElement>(".sg-body")
    if (next) {
      const top = next.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: "smooth" })
    }
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

  const stepLightbox = useCallback(
    (dir: number) => {
      setLightbox((cur) => (cur === null ? null : (cur + dir + gallery.length) % gallery.length))
    },
    [gallery.length]
  )

  const copyText = useCallback(
    (value: string, message: string) => {
      const done = () => showToast(message)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, done)
        return
      }
      const area = document.createElement("textarea")
      area.value = value
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand("copy")
      } catch {
        /* ignore */
      }
      document.body.removeChild(area)
      done()
    },
    [showToast]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const frame = window.requestAnimationFrame(() => {
      root.querySelectorAll<HTMLElement>("[data-sg-load]").forEach((el) => el.classList.add("is-in"))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-sg-reveal]"))
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [stories.length, rundown.length, honored.length, gallery.length, accounts.length, events.length, giftOpen, hasVideo])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (gallery.length > 1) {
        if (event.key === "ArrowLeft") stepLightbox(-1)
        if (event.key === "ArrowRight") stepLightbox(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length, stepLightbox])

  const embedUrl = film && film.kind === "embed" ? film.src : ""
  const filmPoster = eventShot
  const initialA = coupleInitials.charAt(0)
  const initialB = coupleInitials.charAt(1)

  return (
    <div ref={rootRef} className={`sg-root${opened ? " is-open" : ""}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="sg-page">
        {/* 1 — cover */}
        <section className="sg-cover" data-section="sampul" aria-label="Open the invitation">
          <div className="sg-cover__frame">
            <figure className="sg-cover__photo" {...ON_LOAD("fade")}>
              <img src={coverShot} alt={coupleLabel} draggable={false} />
            </figure>
            <span className="sg-cover__notch" aria-hidden="true" />
            {initialA && (
              <p className="sg-cover__initial sg-cover__initial--a" {...ON_LOAD("up", 0.3)}>
                {brideName || groomName}
              </p>
            )}
            {initialB && (
              <p className="sg-cover__initial sg-cover__initial--b" {...ON_LOAD("up", 0.42)}>
                {groomName || brideName}
              </p>
            )}
            {brideName && (
              <p className="sg-cover__script sg-cover__script--a" {...ON_LOAD("right", 0.5)}>
                {brideName}
              </p>
            )}
            {groomName && (
              <p className="sg-cover__script sg-cover__script--b" {...ON_LOAD("left", 0.6)}>
                {groomName}
              </p>
            )}
            <p className="sg-cover__dear" {...ON_LOAD("fade", 0.7)}>{dearLabel}</p>
            <p className="sg-cover__guest" {...ON_LOAD("fade", 0.55)}>{guestName}</p>
            <button type="button" className="sg-cover__open" onClick={openInvitation} {...ON_LOAD("up", 0.65)}>
              {openLabel}
            </button>
            {apology && <p className="sg-cover__apology">{apology}</p>}
          </div>
        </section>

        <div className="sg-body">
          {/* 2 + 12 — the film, one band directly under the cover */}
          {hasVideo && film && (
            <section className="sg-film" data-section="video" aria-label="The wedding film">
              <div className="sg-film__stage">
                {filmOn ? (
                  film.kind === "file" ? (
                    <video className="sg-film__media" src={film.src} autoPlay controls playsInline poster={filmPoster} />
                  ) : (
                    <iframe
                      className="sg-film__media"
                      src={embedUrl}
                      title={videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                ) : (
                  <button type="button" className="sg-film__cover" onClick={() => setFilmOn(true)} aria-label="Play the wedding film">
                    <img src={filmPoster} alt="" aria-hidden="true" draggable={false} />
                    <span className="sg-film__play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                    <span className="sg-film__caption">
                      <span className="sg-label">{videoTitle}</span>
                      {videoIntro && <span className="sg-film__intro">{videoIntro}</span>}
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* 3 + 4 — welcome and the couple's own words */}
          <section className="sg-section sg-welcome" data-section="pembuka" aria-label="Word of welcome">
            <p className="sg-welcome__greeting" {...IN("up")}>{welcomeGreeting}</p>
            {welcomeBody && <p className="sg-body-copy" {...IN("fade", 0.06)}>{welcomeBody}</p>}
            {dateDot && (
              <p className="sg-body-copy" {...IN("fade", 0.08)}>
                {welcomeDateLead} {dateDot}
              </p>
            )}

            <div className="sg-photoBand" {...IN("fade", 0.1)}>
              <figure className="sg-photoBand__shot sg-photoBand__shot--a">
                <img src={brideShot} alt={brideName || coupleLabel} loading="lazy" draggable={false} />
              </figure>
              <p className="sg-photoBand__script sg-photoBand__script--a">
                <span>{photoOneLabel}</span>
              </p>
            </div>

            <div className="sg-photoBand sg-photoBand--b" {...IN("fade", 0.1)}>
              <figure className="sg-photoBand__shot sg-photoBand__shot--b">
                <img src={groomShot} alt={groomName || coupleLabel} loading="lazy" draggable={false} />
              </figure>
              <p className="sg-photoBand__script sg-photoBand__script--b">
                <span>{photoTwoLabel}</span>
              </p>
            </div>
          </section>

          {/* 5 — mempelai */}
          <section className="sg-section sg-couple" data-section="mempelai" aria-label="The couple">
            <h2 className="sg-heading" {...IN("up")}>{coupleHeading}</h2>
            <span className="sg-rule" aria-hidden="true" {...IN("fade", 0.04)} />
            {[
              {
                key: "bride",
                script: brideName,
                full: profile.bride_full_name || brideName,
                parents: profile.bride_parents,
                ig: brideIg,
                role: "Daughter of",
              },
              {
                key: "groom",
                script: groomName,
                full: profile.groom_full_name || groomName,
                parents: profile.groom_parents,
                ig: groomIg,
                role: "Son of",
              },
            ]
              .filter((person) => !!person.script || !!person.full)
              .map((person, index) => (
                <Fragment key={person.key}>
                  {index === 1 && <p className="sg-couple__amp" aria-hidden="true" {...IN("zoom", 0.04)}>&amp;</p>}
                  <article className="sg-person">
                    {person.script && <h3 className="sg-person__script" {...IN("up", 0.06)}>{person.script}</h3>}
                    {person.full && <p className="sg-person__full" {...IN("fade", 0.08)}>{person.full}</p>}
                    {person.parents && (
                      <>
                        <p className="sg-label sg-person__role" {...IN("fade", 0.1)}>{parentsLabel || person.role}</p>
                        <p className="sg-body-copy" {...IN("fade", 0.12)}>{person.parents}</p>
                      </>
                    )}
                    {person.ig && (
                      <a
                        className="sg-person__ig"
                        href={`https://instagram.com/${person.ig}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...IN("fade", 0.16)}
                      >
                        @{person.ig}
                      </a>
                    )}
                  </article>
                </Fragment>
              ))}
          </section>

          {/* 6 — love story */}
          {stories.length > 0 && (
            <section className="sg-section sg-story" data-section="story" aria-label="Our story">
              <h2 className="sg-heading" {...IN("up")}>{storyTitle}</h2>
              {storyIntro && <p className="sg-sub" {...IN("fade", 0.05)}>{storyIntro}</p>}
              <ol className="sg-chapters">
                {stories.map((story, index) => (
                  <li className={`sg-chapter${index % 2 === 1 ? " sg-chapter--flip" : ""}`} key={`${story.title || "chapter"}-${index}`}>
                    {story.image_url && (
                      <figure className="sg-chapter__plate" {...IN("fade", 0.06)}>
                        <img src={story.image_url} alt={story.title || ""} loading="lazy" draggable={false} />
                      </figure>
                    )}
                    <div className="sg-chapter__copy">
                      {story.title && <h3 className="sg-chapter__title" {...IN("up", 0.08)}>{story.title}</h3>}
                      {story.description && <p className="sg-body-copy" {...IN("fade", 0.1)}>{story.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 7 — venue + events */}
          <section className="sg-section sg-venue" data-section="acara" aria-label="Wedding events">
            <h2 className="sg-heading" {...IN("up")}>{eventsTitle}</h2>
            <div className="sg-venue__hero">
              <figure className="sg-venue__plate">
                <img src={eventShot} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              </figure>
              {eventsIntro && <p className="sg-venue__intro" {...IN("fade", 0.08)}>{eventsIntro}</p>}
            </div>
            <div className="sg-events">
              {events.map((event, index) => (
                <article className="sg-event" key={`${event.name || "event"}-${index}`}>
                  {event.name && <p className="sg-label" {...IN("up")}>{event.name}</p>}
                  {event.venue && <h3 className="sg-event__venue" {...IN("fade", 0.04)}>{event.venue}</h3>}
                  {event.address && <p className="sg-event__line" {...IN("fade", 0.06)}>{event.address}</p>}
                  <p className="sg-event__line" {...IN("fade", 0.08)}>
                    {eventLine(event.date || profile.estimated_wedding_date, event.time)}
                  </p>
                  {event.maps_url && (
                    <a
                      className="sg-link"
                      href={event.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...IN("fade", 0.1)}
                    >
                      {mapsLabel}
                    </a>
                  )}
                </article>
              ))}
            </div>
            {eventsNote && <p className="sg-note" {...IN("fade", 0.1)}>{eventsNote}</p>}
          </section>

          {/* 8 — countdown */}
          {target && (
            <section className="sg-section sg-count" data-section="countdown" aria-label="Countdown to the wedding day">
              <p className="sg-body-copy" {...IN("up")}>{countdownIntro}</p>
              <div {...IN("up", 0.06)}>
                <Clock target={target} />
              </div>
              {calendarUrl && (
                <a className="sg-link sg-count__cal" href={calendarUrl} target="_blank" rel="noopener noreferrer" {...IN("fade", 0.1)}>
                  Add to calendar
                </a>
              )}
            </section>
          )}

          {/* 9 — turut mengundang */}
          {honored.length > 0 && (
            <section className="sg-section sg-inviting" data-section="inviting" aria-label="With the blessing of">
              <p className="sg-label" {...IN("up")}>{invitingKicker}</p>
              <h2 className="sg-heading" {...IN("up", 0.04)}>{invitingTitle}</h2>
              {invitingIntro && <p className="sg-body-copy" {...IN("fade", 0.08)}>{invitingIntro}</p>}
              <ul className="sg-families">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`} {...IN("fade", Math.min(0.05 * index, 0.24))}>{family}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 10 — rundown */}
          {rundown.length > 0 && (
            <section className="sg-section sg-rundown" data-section="rundown" aria-label="Order of the day">
              <p className="sg-label" {...IN("up")}>{rundownKicker}</p>
              <h2 className="sg-heading" {...IN("up", 0.04)}>{rundownTitle}</h2>
              {rundownIntro && <p className="sg-sub" {...IN("fade", 0.08)}>{rundownIntro}</p>}
              <ol className="sg-programme">
                {rundown.map((item, index) => (
                  <li className="sg-programme__row" key={`${item.time || "row"}-${index}`} {...IN("fade", 0.04)}>
                    {item.time && <span className="sg-programme__time">{item.time}</span>}
                    {item.description && <span className="sg-programme__text">{item.description}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 11 — moments */}
          {gallery.length > 0 && (
            <section className="sg-section sg-moments" data-section="galeri" aria-label="Gallery">
              <h2 className="sg-heading" {...IN("up")}>{galleryTitle}</h2>
              {galleryIntro && <p className="sg-sub" {...IN("fade", 0.05)}>{galleryIntro}</p>}
              <div className="sg-grid" {...IN("fade", 0.08)}>
                {gridPhotos.map((url, index) => (
                  <button
                    type="button"
                    className="sg-grid__cell"
                    key={`${url}-${index}`}
                    onClick={() => setLightbox(index)}
                    aria-label={`Photo ${index + 1}`}
                  >
                    <img src={url} alt="" loading="lazy" draggable={false} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* full-bleed photographic divider between the gallery and the registry */}
          {dividerShot && (
            <figure className="sg-divider" aria-hidden="true" {...IN("fade")}>
              <img src={dividerShot} alt="" loading="lazy" draggable={false} />
            </figure>
          )}

          {/* 13 — gift */}
          {hasGift && (
            <section className="sg-section sg-gift" data-section="gift" aria-label="Wedding registry">
              <h2 className="sg-heading" {...IN("up")}>{giftTitle}</h2>
              {giftIntro && <p className="sg-body-copy" {...IN("fade", 0.05)}>{giftIntro}</p>}
              <button
                type="button"
                className="sg-btn sg-btn--solid"
                onClick={() => setGiftOpen((value) => !value)}
                aria-expanded={giftOpen}
                {...IN("up", 0.08)}
              >
                {giftButton}
              </button>
              {giftOpen && (
                <div className="sg-gift__list">
                  {accounts.map((account, index) => (
                    <div className="sg-account" key={`${account.account_number || "acc"}-${index}`} {...IN("up", Math.min(0.05 * index, 0.2))}>
                      {account.provider_name && <p className="sg-account__bank">{account.provider_name}</p>}
                      <div className="sg-account__row">
                        {account.account_number && <span className="sg-account__number">{account.account_number}</span>}
                        {account.account_number && (
                          <button
                            type="button"
                            className="sg-account__copy"
                            onClick={() => copyText(account.account_number || "", accountToast)}
                            aria-label="Copy account number"
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                              <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1zM3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {account.account_name && <p className="sg-account__name">{account.account_name}</p>}
                    </div>
                  ))}
                  {giftAddress && (
                    <div className="sg-account sg-account--address" {...IN("up", 0.08)}>
                      {profile.gift_address_name && <p className="sg-account__bank">{profile.gift_address_name}</p>}
                      <p className="sg-account__name">{giftAddress}</p>
                      <button type="button" className="sg-link" onClick={() => copyText(giftAddress, addressToast)}>
                        {addressButton}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {giftSignature && <p className="sg-script sg-gift__sign" {...IN("fade", 0.1)}>{giftSignature}</p>}
            </section>
          )}

          {/* 14 — dress code */}
          {hasDresscode && (
            <section className="sg-section sg-dress" data-section="dresscode" aria-label="Dress code">
              <h2 className="sg-heading" {...IN("up")}>{dressHeading}</h2>
              <div className="sg-dress__band" {...IN("fade", 0.05)}>
                <figure className="sg-dress__photo">
                  <img src={dressShot} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                </figure>
                {dressColors.length > 0 && (
                  <ul className="sg-swatches">
                    {dressColors.map((color, index) => (
                      <li className="sg-swatch" key={`${color.hex || color.name}-${index}`} {...IN("up", Math.min(0.05 * index, 0.2))}>
                        <span className="sg-swatch__chip" style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                        {color.name && <span className="sg-swatch__name">{color.name}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {dressTitle && <p className="sg-dress__title" {...IN("up", 0.08)}>{dressTitle}</p>}
              {dressIntro && <p className="sg-body-copy" {...IN("fade", 0.1)}>{dressIntro}</p>}
              {dressNote && <p className="sg-note" {...IN("fade", 0.12)}>{dressNote}</p>}
            </section>
          )}

          {/* 15 — wishes */}
          <section className="sg-section sg-wishes" data-section="wishes" aria-label="Wishes for the couple">
            <h2 className="sg-heading" {...IN("up")}>{wishesTitle}</h2>
            {wishesIntro && <p className="sg-body-copy" {...IN("fade", 0.05)}>{wishesIntro}</p>}
            <div className="sg-wishes__card" {...IN("fade", 0.08)}>
              <Wishes
                weddingProfileId={profile.wedding_profile_id}
                guestId={profile.guest_id}
                guestName={profile.guest_name}
                guestLinkStrict={profile.guest_link_strict}
                coupleName={coupleLabel}
                copy={wishCopy}
              />
            </div>
          </section>

          {/* 16 — closing */}
          <section className="sg-closing" data-section="closing" aria-label="Closing">
            {closingMessage && <p className="sg-body-copy" {...IN("up")}>{closingMessage}</p>}
            <p className="sg-script sg-closing__see" {...IN("fade", 0.08)}>{closingSee}</p>
            {(initialA || initialB) && (
              <p className="sg-closing__initials" aria-label={coupleInitials} {...IN("fade", 0.12)}>
                {initialA && <span className="sg-closing__initial sg-closing__initial--a">{initialA}</span>}
                {initialB && <span className="sg-closing__initial sg-closing__initial--b">{initialB}</span>}
              </p>
            )}
            {dateDot && <p className="sg-closing__date" {...IN("fade", 0.16)}>{dateDot}</p>}
          </section>

          <footer className="sg-footer">
            <a
              className="sg-footer__link"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Aksaraa Wedding on WhatsApp"
            >
              <span className="sg-footer__badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
              </span>
              <span className="sg-footer__cta">Wedding by Aksaraa</span>
            </a>
            <p className="sg-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {trackUrl && (
        <button
          type="button"
          className={`sg-music${playing ? " is-on" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause the music" : "Play the music"}
          aria-pressed={playing}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
            {!playing && <path d="M3 3 21 21" />}
          </svg>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="sg-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="sg-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>×</button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="sg-lightbox__nav sg-lightbox__nav--prev"
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(-1)
              }}
            >
              ‹
            </button>
          )}
          <img src={gallery[lightbox]} alt="" onClick={(event) => event.stopPropagation()} />
          {gallery.length > 1 && (
            <button
              type="button"
              className="sg-lightbox__nav sg-lightbox__nav--next"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
          <span className="sg-lightbox__count" aria-hidden="true">{lightbox + 1} / {gallery.length}</span>
        </div>
      )}

      {toast && <div className="sg-toast" role="status">{toast}</div>}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || WISH_ME}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={80}
        />
      )}
    </div>
  )
}
