"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  countdownTarget,
  coverPhoto as coverPhotoOf,
  flattenPhotos,
  groomPhoto as groomPhotoOf,
  bridePhoto as bridePhotoOf,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./n-film.css"

const DEFAULT_CLOSING =
  "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say."

const DEFAULT_OPENING_TITLE = "Warmest Greetings"
const DEFAULT_OPENING_DESCRIPTION =
  "With great joy and gratitude, we invite you to share in the beginning of our forever."

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// "24 · 08 · 2027" — the design's date lockup.
function dotDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} · ${pad2(d.getMonth() + 1)} · ${d.getFullYear()}`
}

function yearOf(value?: string | null): string {
  return parseDate(value)?.getFullYear().toString() || ""
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) {
    const tail = t.replace(/\/+$/, "").split("/").pop() || ""
    return tail.replace(/^@/, "")
  }
  return t.replace(/^@/, "")
}

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
    { value: pad2(Math.floor(diff / 86400000)), label: "Days" },
    { value: pad2(Math.floor((diff % 86400000) / 3600000)), label: "Hours" },
    { value: pad2(Math.floor((diff % 3600000) / 60000)), label: "Minutes" },
    { value: pad2(Math.floor((diff % 60000) / 1000)), label: "Seconds" },
  ]

  return (
    <div className="nf-clock" aria-label="Countdown to the wedding">
      {units.map((unit) => (
        <div className="nf-clock__unit" key={unit.label}>
          <span className="nf-clock__value">{target ? unit.value : "--"}</span>
          <span className="nf-clock__label">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function NFilm(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [giftTab, setGiftTab] = useState<"accounts" | "address">("accounts")
  const [toast, setToast] = useState("")
  // The reference sizes every gallery row by the photo's own aspect ratio
  // (portrait 191x256, square 191x191), so a square upload is never cropped to
  // portrait. Dimensions are only known in the browser, so they are read on load.
  const [ratios, setRatios] = useState<Record<number, string>>({})

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])

  const baseStill = coverPhotoOf(profile) || gallery[0] || ""
  const coverFilmPoster = slots[0] || baseStill
  const heroStill = slots[1] || gallery[0] || baseStill
  const closingStill = slots[2] || gallery[gallery.length - 1] || heroStill

  const groomShot = groomPhotoOf(profile.groom_photo_url) || heroStill
  const brideShot = bridePhotoOf(profile.bride_photo_url) || heroStill

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () => (profile.stories || []).filter((story) => story && (story.title || story.description)),
    [profile.stories]
  )
  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((item) => item && (item.time || item.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((family) => !!family && !!family.trim())
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress
  const canSwitchGiftTab = accounts.length > 0 && !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!film
  const openingFilm = film && film.kind === "file" ? film.src : ""

  const texts = {
    kicker: (tc.cover_kicker || "").trim(),
    coverTitle: (tc.cover_title || "").trim() || "Now Showing",
    openLabel: (tc.open_button || "").trim() || "Start the Film",
    apology: (tc.cover_apology || "").trim(),
    badge: (tc.hero_badge || "").trim() || "#1",
    meta: (tc.hero_meta || "").trim(),
    openingTitle: (profile.opening_title || "").trim() || DEFAULT_OPENING_TITLE,
    openingDescription: (profile.opening_description || "").trim() || DEFAULT_OPENING_DESCRIPTION,
    galleryIntro: (tc.gallery_intro || "").trim() || "click to preview",
    giftIntroTitle: (tc.gift_intro_title || "").trim() || "Wedding Gift",
    giftIntro: (tc.gift_intro_description || "").trim(),
    wishesIntro: (tc.wishes_intro || "").trim(),
    closing: (tc.closing_message || "").trim() || DEFAULT_CLOSING,
    invitingIntro: (tc.inviting_intro || "").trim(),
  }

  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || "The Wedding"
  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const guestName = (profile.guest_name || "").trim() || "Beloved Guest"
  const dateLock = dotDate(profile.estimated_wedding_date)
  const year = yearOf(profile.estimated_wedding_date)
  const hashtag = texts.kicker || (groomName && brideName ? `#${groomName}${brideName}Forever` : "")
  const metaLine = texts.meta || [year ? "100% Love" : "", year, "Forever", "Romance"].filter(Boolean).join(" · ")
  const countdown = useMemo(() => countdownTarget(events, profile.estimated_wedding_date), [events, profile.estimated_wedding_date])

  const hasQuote = !!((profile.quote_text || "").trim())
  const hasOpening = !!(profile.opening_description || "").trim() || !!(profile.opening_title || "").trim()

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  // RSVP + QR live in the shared dock. It is a per-guest surface: previews and
  // the public demo must never render it (playbook §6).
  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    !videoOpen &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2200)
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    const audio = audioRef.current
    if (audio) {
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      )
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true), () => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  // Reveal on scroll — the template's own minimal AOS, no dependency.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-nf-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Modal state drives the floating dock: it hides instead of overlapping.
  useEffect(() => {
    const hidden = lightbox !== null || videoOpen
    window.dispatchEvent(new CustomEvent("aksaraa:floating", { detail: hidden }))
    if (!hidden) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null)
        setVideoOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, videoOpen])

  const stepLightbox = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (current === null || gallery.length === 0) return current
        return (current + delta + gallery.length) % gallery.length
      })
    },
    [gallery.length]
  )

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") stepLightbox(1)
      if (event.key === "ArrowLeft") stepLightbox(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, stepLightbox])

  // Lazy images below the fold, and images that finished before hydration, never
  // fire onLoad — read whatever is already decoded through a ref as well.
  const readRatio = useCallback((index: number, img: HTMLImageElement | null) => {
    if (!img || !img.naturalWidth || !img.naturalHeight) return
    const next = `${img.naturalWidth} / ${img.naturalHeight}`
    setRatios((current) => (current[index] ? current : { ...current, [index]: next }))
  }, [])

  const copy = useCallback(
    (value: string, label: string) => {
      const done = () => showToast(`${label} copied`)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, () => showToast("Copy failed — please copy manually"))
        return
      }
      showToast("Copy is not available in this browser")
    },
    [showToast]
  )

  const rootStyle = {
    "--nf-hero": heroStill ? `url("${heroStill}")` : "none",
  } as CSSProperties

  const people = [
    {
      key: "groom",
      shot: groomShot,
      name: (profile.groom_full_name || groomName).trim(),
      parents: (profile.groom_parents || "").trim(),
      instagram: igHandle(profile.groom_instagram),
    },
    {
      key: "bride",
      shot: brideShot,
      name: (profile.bride_full_name || brideName).trim(),
      parents: (profile.bride_parents || "").trim(),
      instagram: igHandle(profile.bride_instagram),
    },
  ].filter((person) => person.name)

  return (
    <div
      ref={rootRef}
      className={`nf-root${opened ? " is-open" : " is-locked"}`}
      style={rootStyle}
      data-template="n-film"
    >
      {trackUrl && (
        <audio ref={audioRef} src={trackUrl} loop preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}

      {/* 1 — cover. The poster IS the gate: the guest picks a name to open. */}
      {!opened && (
        <section className="nf-gate" data-section="sampul" aria-label="Open the invitation">
          {openingFilm && (
            <video
              className="nf-gate__film"
              src={openingFilm}
              poster={coverFilmPoster || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          )}
          <div className="nf-gate__veil" aria-hidden="true" />
          <div className="nf-gate__inner">
            {hashtag && <p className="nf-kicker">{hashtag}</p>}
            <h1 className="nf-gate__title">{texts.coverTitle}</h1>

            <div className="nf-profiles">
              <button type="button" className="nf-profile" onClick={openInvitation}>
                <span className="nf-profile__shot">
                  {groomShot && <img src={groomShot} alt={groomName || "Groom"} draggable={false} />}
                </span>
                <span className="nf-profile__name">{(groomName || "The Couple").toUpperCase()}</span>
              </button>
              <button type="button" className="nf-profile" onClick={openInvitation}>
                <span className="nf-profile__shot">
                  {brideShot && <img src={brideShot} alt={brideName || "Bride"} draggable={false} />}
                </span>
                <span className="nf-profile__name">{(brideName || "The Couple").toUpperCase()}</span>
              </button>
            </div>

            <span className="nf-gate__rule" aria-hidden="true" />

            {dateLock && (
              <p className="nf-eyebrow" style={{ marginTop: 26 }}>
                {dateLock}
              </p>
            )}
            <p className="nf-eyebrow" style={{ marginTop: 10 }}>
              To our beloved
            </p>
            <p className="nf-gate__guest">{guestName}</p>

            {texts.apology && <p className="nf-gate__apology">{texts.apology}</p>}

            <button type="button" className="nf-btn nf-btn--solid nf-gate__open" onClick={openInvitation}>
              {texts.openLabel}
            </button>
          </div>
        </section>
      )}

      <div className="nf-col">
        {/* 2 + 3 — the masthead is the welcome surface. */}
        <section className="nf-hero" data-section="welcome" aria-label="Welcome">
            {heroStill && <img className="nf-hero__still" src={heroStill} alt="" aria-hidden="true" />}
            <div className="nf-hero__scrim" aria-hidden="true" />
            <div className="nf-hero__foot" aria-hidden="true" />
            <div className="nf-hero__body">
              <div className="nf-hero__top" data-nf-reveal>
                <span className="nf-flag">{texts.badge}</span>
                <span className="nf-label">Today&rsquo;s Couple</span>
              </div>
              <h2 className="nf-display nf-hero__names" data-nf-reveal>
                {coupleLabel}
              </h2>
              <p className="nf-hero__meta" data-nf-reveal>
                {metaLine}
              </p>

              {hasQuote && (
                <div className="nf-verse" data-nf-reveal>
                  <p className="nf-verse__text">&ldquo;{profile.quote_text}&rdquo;</p>
                  {profile.quote_source && <p className="nf-verse__source">{profile.quote_source}</p>}
                </div>
              )}

              <div className={`nf-ctas${hasVideo ? "" : " nf-ctas--single"}`} data-nf-reveal>
                {hasVideo && (
                  <button type="button" className="nf-btn nf-btn--solid" onClick={() => setVideoOpen(true)}>
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M5 3.5v9l7.5-4.5z" />
                    </svg>
                    Play
                  </button>
                )}
                <a className="nf-btn nf-btn--ghost" href="#nf-events">
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.5a5 5 0 1 1 0 10A5 5 0 0 1 8 3Zm-.75 2.25v4.1l3.4 1.95.75-1.3-2.65-1.5V5.25h-1.5Z" />
                  </svg>
                  More Info
                </a>
              </div>
            </div>
        </section>

        {/* 4 — kalimat pembuka, in the design's logline voice. */}
        {hasOpening && (
          <section className="nf-section" data-section="pembuka" aria-labelledby="nf-synopsis">
            <div className="nf-head" data-nf-reveal>
              <p className="nf-eyebrow">Synopsis</p>
              <h2 className="nf-title" id="nf-synopsis">
                {texts.openingTitle}
              </h2>
            </div>
            <div className="nf-premise" data-nf-reveal>
              <span className="nf-premise__rule" aria-hidden="true" />
              <p className="nf-premise__text">{texts.openingDescription}</p>
            </div>
          </section>
        )}

        {/* 5 — mempelai. Two portraits, their own names. No gendered labels. */}
        {people.length > 0 && (
          <section className="nf-section" data-section="mempelai" aria-label="The couple">
            {heroStill && (
              <img className="nf-cast__wide" src={heroStill} alt="" aria-hidden="true" loading="lazy" data-nf-reveal />
            )}
            <div className="nf-head nf-head--center" data-nf-reveal>
              <p className="nf-eyebrow">Main Cast</p>
            </div>
            <div className="nf-cast">
              {people.map((person) => (
                <div className="nf-cast__person" key={person.key} data-nf-reveal>
                  <span className="nf-cast__shot">
                    {person.shot && <img src={person.shot} alt={person.name} loading="lazy" />}
                  </span>
                  <p className="nf-cast__name">{person.name}</p>
                  {person.parents && <p className="nf-cast__parents">{person.parents}</p>}
                  {person.instagram && (
                    <a
                      className="nf-cast__ig"
                      href={`https://instagram.com/${person.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{person.instagram}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6 — love story, as a season of numbered episodes. */}
        {stories.length > 0 && (
          <section className="nf-section" data-section="story" aria-label="Love story">
            <div className="nf-head" data-nf-reveal>
              <h2 className="nf-title">Episodes</h2>
              <p className="nf-eyebrow">Love Story · Season 1</p>
            </div>
            <div className="nf-episodes">
              {stories.map((story, index) => {
                const thumb = story.image_url || gallery[index % Math.max(1, gallery.length)] || heroStill
                return (
                  <article className="nf-ep" key={`${story.title || "story"}-${index}`} data-nf-reveal>
                    <div className="nf-ep__head">
                      <span className="nf-ep__thumb">{thumb && <img src={thumb} alt="" loading="lazy" />}</span>
                      <p className="nf-ep__title">{story.title || "Our Story"}</p>
                    </div>
                    {story.description && <p className="nf-ep__text">{story.description}</p>}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* 7 — events. */}
        {events.length > 0 && (
          <section className="nf-section" id="nf-events" data-section="acara" aria-label="Time and place">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <h2 className="nf-title">Time &amp; Place</h2>
            </div>
            <div className="nf-events">
              {events.map((event, index) => (
                <div className="nf-event" key={`${event.name || "event"}-${index}`} data-nf-reveal>
                  {event.name && <h3 className="nf-event__name">{event.name}</h3>}
                  {event.date && <p className="nf-event__date">{dotDate(event.date) || event.date}</p>}
                  {event.time && <p className="nf-event__time">{event.time}</p>}
                  {(event.venue || event.address) && (
                    <p className="nf-event__venue">{[event.venue, event.address].filter(Boolean).join(", ")}</p>
                  )}
                  {event.maps_url && (
                    <a className="nf-event__maps" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                      View Location
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8 — countdown, its own block. */}
        <section className="nf-section" data-section="countdown" aria-label="Countdown">
          <div className="nf-countdown">
            <p className="nf-eyebrow" data-nf-reveal>
              Countdown to our special day
            </p>
            <div data-nf-reveal>
              <Clock target={countdown} />
            </div>
          </div>
        </section>

        {/* 9 — turut mengundang. */}
        {honored.length > 0 && (
          <section className="nf-section nf-inviting" data-section="inviting" aria-label="With the blessings of their families">
            <div data-nf-reveal>
              <p className="nf-eyebrow">With the blessings of their families</p>
              {texts.invitingIntro && <p className="nf-body nf-inviting__intro">{texts.invitingIntro}</p>}
            </div>
            <div className="nf-inviting__list">
              {honored.map((family, index) => (
                <p className="nf-inviting__row" key={`${family}-${index}`} data-nf-reveal>
                  {family}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* 10 — rundown. The preset's own card idiom. */}
        {rundown.length > 0 && (
          <section className="nf-section" data-section="rundown" aria-label="Run of show">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <h2 className="nf-title">Run of Show</h2>
            </div>
            <div className="nf-rundown">
              {rundown.map((item, index) => (
                <div className="nf-run" key={`${item.time || "run"}-${index}`} data-nf-reveal>
                  {item.time && <span className="nf-run__time">{item.time}</span>}
                  {item.description && <span className="nf-run__text">{item.description}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 11 — gallery. */}
        {gallery.length > 0 && (
          <section className="nf-section" data-section="galeri" aria-label="Our moment">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <h2 className="nf-title">Our Moment</h2>
              <p className="nf-eyebrow" style={{ textTransform: "lowercase", letterSpacing: "1.2px" }}>
                {texts.galleryIntro}
              </p>
            </div>
            <div className="nf-gallery">
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className="nf-shot"
                  key={`${photo}-${index}`}
                  onClick={() => setLightbox(index)}
                  aria-label={`Open photo ${index + 1} of ${gallery.length}`}
                  style={{ aspectRatio: ratios[index] || "3 / 4" }}
                  data-nf-reveal
                >
                  <img
                    src={photo}
                    alt=""
                    loading="lazy"
                    ref={(img) => readRatio(index, img)}
                    onLoad={(event) => readRatio(index, event.currentTarget)}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 12 — the film. */}
        {hasVideo && (
          <section className="nf-section" data-section="video" aria-label="The film">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <h2 className="nf-title">The Film</h2>
            </div>
            <div className="nf-film" data-nf-reveal>
              <button type="button" className="nf-film__plate" onClick={() => setVideoOpen(true)} aria-label="Play the film">
                {heroStill && <img src={heroStill} alt="" loading="lazy" />}
              </button>
              {texts.galleryIntro && <p className="nf-film__caption">tap to watch</p>}
            </div>
          </section>
        )}

        {/* 13 — gift. */}
        {hasGift && (
          <section className="nf-section" data-section="gift" aria-label="Wedding gift">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <h2 className="nf-title">{texts.giftIntroTitle}</h2>
              {texts.giftIntro && <p className="nf-body">{texts.giftIntro}</p>}
            </div>

            {canSwitchGiftTab && (
              <div className="nf-tabs" role="tablist" aria-label="Gift method">
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "accounts"}
                  className={`nf-tab${giftTab === "accounts" ? " is-active" : ""}`}
                  onClick={() => setGiftTab("accounts")}
                >
                  Direct Transfer
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "address"}
                  className={`nf-tab${giftTab === "address" ? " is-active" : ""}`}
                  onClick={() => setGiftTab("address")}
                >
                  Send Gift
                </button>
              </div>
            )}

            {accounts.length > 0 && (!canSwitchGiftTab || giftTab === "accounts") && (
              <div>
                {accounts.map((account, index) => (
                  <div className="nf-account" key={`${account.account_number || "account"}-${index}`}>
                    {account.provider_name && <p className="nf-account__bank">{account.provider_name}</p>}
                    <p className="nf-account__no">
                      <span>{account.account_number}</span>
                      {account.account_number && (
                        <button
                          type="button"
                          className="nf-copy"
                          onClick={() => copy(account.account_number || "", "Account number")}
                        >
                          Copy
                        </button>
                      )}
                    </p>
                    {account.account_name && <p className="nf-account__name">{account.account_name}</p>}
                  </div>
                ))}
              </div>
            )}

            {giftAddress && (!canSwitchGiftTab || giftTab === "address") && (
              <div className="nf-address">
                {profile.gift_address_name && <p className="nf-address__name">{profile.gift_address_name}</p>}
                <p className="nf-address__text">{giftAddress}</p>
                <button type="button" className="nf-copy" style={{ marginTop: 12 }} onClick={() => copy(giftAddress, "Address")}>
                  Copy address
                </button>
              </div>
            )}
          </section>
        )}

        {/* 14 — dress code. */}
        {hasDresscode && (
          <section className="nf-section" data-section="dresscode" aria-label="Dress code">
            <div className="nf-head nf-head--center" data-nf-reveal>
              <p className="nf-eyebrow">Costume</p>
              <h2 className="nf-title">{[profile.dresscode?.title].filter(Boolean).join("") || "Dress Code"}</h2>
              {profile.dresscode?.description && <p className="nf-body">{profile.dresscode.description}</p>}
            </div>
            <div className="nf-swatches">
              {dressColors.map((color, index) => (
                <div className="nf-swatch" key={`${color.hex || "swatch"}-${index}`} data-nf-reveal>
                  <span className="nf-swatch__dot" style={{ background: color.hex || "#141414" }} />
                  {color.name && <span className="nf-swatch__name">{color.name}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 15 — wishes. RSVP is the floating dock, never a section. */}
        <section className="nf-section" id="nf-wishes" data-section="wishes" aria-labelledby="nf-wishes-title">
          <div className="nf-head nf-head--center" data-nf-reveal>
            <h2 className="nf-title" id="nf-wishes-title">
              Wishes
            </h2>
          </div>
          <Wishes
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            guestLinkStrict={profile.guest_link_strict}
            coupleName={coupleLabel}
            intro={texts.wishesIntro}
          />
        </section>

        {/* 16 — closing. */}
        <section className="nf-closing" data-section="closing" aria-label="Closing">
          {closingStill && <img className="nf-closing__still" src={closingStill} alt="" aria-hidden="true" />}
          <div className="nf-closing__veil" aria-hidden="true" />
          <div className="nf-closing__body">
            <p className="nf-eyebrow" data-nf-reveal>
              With joyful hearts
            </p>
            <h2 className="nf-display nf-closing__names" data-nf-reveal>
              {coupleLabel}
            </h2>
            <p className="nf-body nf-body--light nf-closing__message" data-nf-reveal>
              {texts.closing}
            </p>
          </div>
        </section>

        <footer className="nf-foot">
          <p className="nf-foot__by">Digital Invitation by</p>
          <a className="nf-foot__link" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Contact Aksaraa Wedding on WhatsApp">
            <span className="nf-foot__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
            </span>
            <span className="nf-foot__cta">Wedding by Aksaraa</span>
          </a>
        </footer>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className={`nf-music ${playing ? "is-on" : "is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause the music" : "Play the music"}
          aria-pressed={playing}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M12.5 1.6a.6.6 0 0 1 .75.58v8.07a2.3 2.3 0 1 1-1.2-2.02V4.5L6.6 5.6v5.35a2.3 2.3 0 1 1-1.2-2.02V4.3a.6.6 0 0 1 .46-.58l6.64-2.12Z" />
          </svg>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="nf-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="nf-close" aria-label="Close" onClick={() => setLightbox(null)}>
            ×
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="nf-lightbox__nav nf-lightbox__nav--prev"
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
              className="nf-lightbox__nav nf-lightbox__nav--next"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
        </div>
      )}

      {videoOpen && film && (
        <div className="nf-modal" role="dialog" aria-modal="true" aria-label="The film" onClick={() => setVideoOpen(false)}>
          <button type="button" className="nf-close" aria-label="Close" onClick={() => setVideoOpen(false)}>
            ×
          </button>
          <div className="nf-modal__box" onClick={(event) => event.stopPropagation()}>
            {film.kind === "file" ? (
              <video src={film.src} controls autoPlay playsInline />
            ) : (
              <iframe
                src={film.src}
                title="The wedding film"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="nf-toast" role="status">
          {toast}
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || "Tamu Undangan"}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="center"
        />
      )}
    </div>
  )
}
