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
  gcalLink,
  initialsGlyphs,
  initialsOf,
  monogramFontSize,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import BackgroundVideo from "../dark-split-rail/BackgroundVideo"
import AutoplayYouTube from "../shared/AutoplayYouTube"
import "./still-ever.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const DEFAULT_CLOSING =
  "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say."

// Art-directed stills shipped with the template. Used only as fallbacks for
// decorative surfaces (never as demo couple data).
const A = (name: string) => `/templates/still-ever/${name}`
const ART_HERO = A("hero-1.webp")
const ART_STORY = A("hero-2.webp")
const ART_CLOSING = A("hero-3.webp")

const WEEKDAYS = {
  id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
}
const MONTHS = {
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}
const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function dateBlockOf(value: string | null | undefined, lang: "id" | "en") {
  const d = parseDate(value)
  if (!d) return null
  return {
    day: pad2(d.getDate()),
    weekday: WEEKDAYS[lang][d.getDay()],
    month: MONTHS[lang][d.getMonth()],
    year: String(d.getFullYear()),
    full: `${WEEKDAYS[lang][d.getDay()]}, ${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`,
  }
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

// The seconds tick lives in its own component: re-rendering it must not
// reconcile the whole invitation tree, which otherwise drops a frame every
// second — including in the middle of the envelope flip.
function CountdownClock({ iso, sessions, lang }: { iso?: string; sessions?: TemplateProps["sessions"]; lang: "id" | "en" }) {
  const countdown = useCountdown(iso, sessions)
  return (
    <div className="se-clock" aria-label={t("countdown", lang)}>
      <div><strong>{countdown?.d ?? "00"}</strong><span>{t("days", lang)}</span></div>
      <div><strong>{countdown?.h ?? "00"}</strong><span>{t("hours", lang)}</span></div>
      <div><strong>{countdown?.m ?? "00"}</strong><span>{t("minutes", lang)}</span></div>
      <div><strong>{countdown?.s ?? "00"}</strong><span>{t("seconds", lang)}</span></div>
    </div>
  )
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

type Bloom = "idle" | "in" | "out"

export default function StillEver(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)
  const gateOpeningRef = useRef(false)

  const [opened, setOpened] = useState(false)
  const [opening, setOpening] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [slide, setSlide] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [giftTab, setGiftTab] = useState<"accounts" | "address">("accounts")
  const [toast, setToast] = useState("")
  const [bloom, setBloom] = useState<Bloom>("idle")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const gallery = flattenPhotos(profile.gallery_photos)
  const slots = flattenPhotos(profile.cover_photos)
  // Cover slots: 1-3 are the sliding hero covers, slot 4 is the closing plate.
  // The livestream card borrows the first hero slot instead of its own photo.
  const heroSlots = slots.slice(0, 3).filter(Boolean)
  const cover = heroSlots[0] || coverPhotoOf(profile)
  const groomPhoto = flattenPhotos(profile.groom_photo_url)[0] || cover
  const bridePhoto = flattenPhotos(profile.bride_photo_url)[0] || cover
  const closingPhoto = slots[3] || gallery[gallery.length - 1] || ART_CLOSING
  const storyPhoto = gallery[0] || heroSlots[2] || ART_STORY
  const mediaPoster = cover
  const heroPhotos = heroSlots.length > 0 ? heroSlots : [cover]

  const stories = (profile.stories || []).filter((story) => story && (story.title || story.description))
  const events = (profile.sessions || []).filter(Boolean)
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((family) => !!family && !!family.trim())
      : []
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((item) => item && (item.time || item.description))
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const hasStreaming = profile.livestream_visible !== false && !!profile.livestream?.url
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = accounts.length > 0 || !!giftAddress
  const giftTabs = accounts.length > 0 && !!giftAddress

  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const directVideo = isDirectVideo(profile.video_url || "")
  const isYouTubeEmbed = /youtube(-nocookie)?\.com\/embed\//.test(videoEmbed)
  const youtubeId = isYouTubeEmbed ? videoEmbed.split("/").filter(Boolean).pop() || "" : ""
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed

  const dateBlock = dateBlockOf(profile.estimated_wedding_date, lang)
  const calendarUrl = gcalLink(events[0], profile.groom_name || "", profile.bride_name || "")

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  // Reference music config: an optional in/out point inside the track. Guest
  // invitations pick a segment, so playback is clamped instead of looping the
  // whole file.
  const musicStart = Math.max(0, Number(tc.music_start_seconds ?? 0) || 0)
  const musicEnd = tc.music_end_seconds == null || tc.music_end_seconds === "" ? null : Number(tc.music_end_seconds)

  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || "The Wedding"
  const monogram = (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "S&E"
  const monogramCount = initialsGlyphs(monogram).length
  const guestName = profile.guest_name || "Beloved Guest"
  const closingMessage = tc.closing_message || DEFAULT_CLOSING
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  // Guest dock (QR + RSVP) is a per-guest affair: only real invitation links
  // render it — template previews and the public demo simulate no guest context.
  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  // The reference cover is an envelope: the wax seal breaks off, the flap
  // (carrying the stationery card) flips over its top edge, then the cover
  // leaves and the invitation is revealed. Music must start on the gesture, so
  // it is triggered here rather than after the animation.
  //
  // The flap lifts off a lit interior: the inside of the jacket glows warmer as
  // the fold opens, and a warm bloom covers the swap so the invitation is
  // revealed out of that light instead of a hard cut (or a blackout). The bloom
  // is a short hand-over, not a held beat: lit at 450ms, next frame at 1.5s.
  const openEnvelope = useCallback(() => {
    if (gateOpeningRef.current) return
    gateOpeningRef.current = true
    setOpening(true)
    if (hasTrack) {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    }
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.setTimeout(() => setBloom("in"), reduced ? 0 : 450)
    window.setTimeout(() => {
      setOpened(true)
      setBloom("out")
      window.scrollTo(0, 0)
    }, reduced ? 120 : 1500)
  }, [hasTrack])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [opened])

  useEffect(() => {
    if (!opened || heroPhotos.length < 2) return
    const id = window.setInterval(() => setSlide((value) => (value + 1) % heroPhotos.length), 4800)
    return () => window.clearInterval(id)
  }, [opened, heroPhotos.length])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-se-reveal]"))
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    )
    items.forEach((item) => io.observe(item))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (event.key === "ArrowRight") setLightbox((value) => (value === null ? value : (value + 1) % gallery.length))
      if (event.key === "ArrowLeft") setLightbox((value) => (value === null ? value : (value - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

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

  // The reference stops the track as soon as the wedding film starts so the two
  // never play over each other.
  const pauseMusic = () => {
    const audio = audioRef.current
    if (!audio || audio.paused) return
    audio.pause()
    setPlaying(false)
  }

  // Keep the music inside [start, end]. Without this the browser happily plays
  // past the segment the couple chose.
  const clampMusic = (audio: HTMLAudioElement) => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    const start = Math.min(musicStart, Math.max(0, duration - 0.05))
    if (audio.currentTime < start || (musicEnd !== null && Number.isFinite(musicEnd) && audio.currentTime >= musicEnd)) {
      audio.currentTime = start
    }
  }

  const showToast = (text: string) => {
    setToast(text)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2600)
  }

  const copyAccount = (number?: string) => {
    if (!number) return
    if (!navigator.clipboard?.writeText) {
      showToast("Copy is not available on this browser")
      return
    }
    navigator.clipboard.writeText(number).then(
      () => showToast("Account number copied"),
      () => showToast("Could not copy the account number")
    )
  }

  const rootStyle = {
    "--se-hero-count": Math.max(1, heroPhotos.length),
    "--se-guest-len": Math.max(1, guestName.length),
  } as CSSProperties

  return (
    <div ref={rootRef} className={`still-ever-root${opened ? " is-open" : " is-locked"}`} style={rootStyle}>
      {hasTrack && (
        <audio
          ref={audioRef}
          loop
          preload="none"
          src={trackUrl}
          onLoadedMetadata={(event) => {
            const audio = event.currentTarget
            if (musicStart > 0 && Number.isFinite(audio.duration)) {
              audio.currentTime = Math.min(musicStart, Math.max(0, audio.duration - 0.05))
            }
          }}
          onTimeUpdate={(event) => clampMusic(event.currentTarget)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* The wedding film runs muted and heavily dimmed behind the invitation
          (same treatment as the Sandhya template). Mounted only after the cover
          opens so the gate flip stays free of a video download. The wrapper
          crops the player's own chrome (title band) off the top edge. */}
      {hasVideo && opened && (
        <div className="se-bgfilm">
          <BackgroundVideo embed={videoEmbed} poster={cover} signal={1} dim />
        </div>
      )}
      {hasVideo && opened && <div className="se-bgveil" aria-hidden="true" />}

      <div className="se-grain" aria-hidden="true" />

      {hasTrack && opened && (
        <button
          type="button"
          className={`se-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="se-music__disc" aria-hidden="true" />
          <span className="se-music__icon" aria-hidden="true">
            {playing ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M8 4.5v15l12-7.5-12-7.5Z" />
              </svg>
            )}
          </span>
        </button>
      )}

      <main className="se-invitation" aria-hidden={!opened}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="se-hero" data-section="hero">
          <div className="se-hero__slides" aria-hidden="true">
            {heroPhotos.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className={`se-hero__slide${index === slide ? " is-active" : ""}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
            <div className="se-hero__scrim" />
          </div>

          <div className="se-hero__body">
            <p className="se-eyebrow">The Wedding</p>
            <span className="se-rule-short" aria-hidden="true" />
            <h1 className="se-hero__names">
              <span>{profile.groom_name || "Groom"}</span>
              <em>&amp;</em>
              <span>{profile.bride_name || "Bride"}</span>
            </h1>
            {dateBlock && (
              <p className="se-hero__date">
                <time dateTime={profile.estimated_wedding_date}>{dateBlock.full}</time>
              </p>
            )}
          </div>

          <div className="se-scroll-hint" aria-hidden="true">
            <i />
            <span>Scroll to read</span>
          </div>
        </section>

        {/* ── Quote ────────────────────────────────────────────── */}
        {profile.quote_text && (
          <section className="se-section se-quote" data-section="quote">
            <div className="se-wrap se-quote__inner" data-se-reveal>
              <p className="se-eyebrow">{tc.quote_title || "A Word From Us"}</p>
              <blockquote className="se-quote__text">{profile.quote_text}</blockquote>
              {profile.quote_source && <cite className="se-quote__source">{profile.quote_source}</cite>}
            </div>
          </section>
        )}

        {/* ── Couple ───────────────────────────────────────────── */}
        <section className="se-section se-couple" data-section="couple">
          <div className="se-wrap se-couple__grid">
            <article className="se-person" data-se-reveal>
              <figure className="se-person__photo">
                <img src={groomPhoto} alt={profile.groom_full_name || profile.groom_name || "The groom"} loading="lazy" />
              </figure>
              <h2 className="se-display se-person__name">{profile.groom_name}</h2>
              {profile.groom_full_name && <p className="se-person__full">{profile.groom_full_name}</p>}
              {profile.groom_parents && <p className="se-text se-person__parents">{profile.groom_parents}</p>}
              {profile.groom_instagram && (
                <a
                  className="se-pill se-person__ig"
                  href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{profile.groom_instagram.replace(/^@/, "")}
                </a>
              )}
            </article>

            <article className="se-person se-person--bride" data-se-reveal>
              <figure className="se-person__photo">
                <img src={bridePhoto} alt={profile.bride_full_name || profile.bride_name || "The bride"} loading="lazy" />
              </figure>
              <h2 className="se-display se-person__name">{profile.bride_name}</h2>
              {profile.bride_full_name && <p className="se-person__full">{profile.bride_full_name}</p>}
              {profile.bride_parents && <p className="se-text se-person__parents">{profile.bride_parents}</p>}
              {profile.bride_instagram && (
                <a
                  className="se-pill se-person__ig"
                  href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  @{profile.bride_instagram.replace(/^@/, "")}
                </a>
              )}
            </article>
          </div>
        </section>

        {/* ── Turut Mengundang ─────────────────────────────────── */}
        {honored.length > 0 && (
          <section className="se-section se-honored" data-section="inviting">
            <div className="se-wrap se-honored__inner" data-se-reveal>
              <h2 className="se-display se-heading">With Honour</h2>
              <span className="se-rule-short se-rule-short--center" aria-hidden="true" />
              <p className="se-text se-honored__intro">
                With deep gratitude we also present the families who extend this invitation alongside us.
              </p>
              <ul className="se-honored__list">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Story ────────────────────────────────────────────── */}
        {stories.length > 0 && (
          <section className="se-section se-story" data-section="story">
            <div className="se-wrap">
              <header className="se-story__head" data-se-reveal>
                <div>
                  <p className="se-eyebrow">Our Story</p>
                  <h2 className="se-display se-heading">{tc.love_story_title || "How Our Story Began"}</h2>
                </div>
              </header>

              <div className="se-chapters">
                {stories.map((story, index) => (
                  <article className="se-chapter" key={`${story.title || "story"}-${index}`} data-se-reveal>
                    <div className="se-chapter__copy">
                      <p className="se-chapter__year">{String(index + 1).padStart(2, "0")}</p>
                      <h3 className="se-display se-chapter__title">{story.title || `Chapter ${index + 1}`}</h3>
                      {story.description && <p className="se-text">{story.description}</p>}
                    </div>
                    {story.image_url && (
                      <figure className="se-chapter__photo">
                        <img src={story.image_url} alt="" loading="lazy" />
                      </figure>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Countdown ────────────────────────────────────────── */}
        {dateBlock && (
          <section className="se-section se-countdown" data-section="countdown">
            <div className="se-wrap" data-se-reveal>
              <p className="se-eyebrow">The Day We Wait For</p>
              <div className="se-dateblock">
                <span className="se-dateblock__day">{dateBlock.day}</span>
                <span className="se-dateblock__side">
                  <span>{dateBlock.weekday}</span>
                  <span>{dateBlock.month}</span>
                  <span>{dateBlock.year}</span>
                </span>
              </div>
              <hr className="se-hr" />
              <CountdownClock iso={profile.estimated_wedding_date} sessions={profile.sessions} lang={lang} />
              {calendarUrl && (
                <a className="se-pill se-countdown__cta" href={calendarUrl} target="_blank" rel="noreferrer">
                  Save the date
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Events ───────────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="se-section se-events" data-section="events">
            <div className="se-wrap">
              <header className="se-events__head" data-se-reveal>
                <p className="se-eyebrow">The Celebration</p>
                <h2 className="se-display se-heading">When We Say Yes</h2>
              </header>

              <div className="se-events__list">
                {events.map((event, index) => {
                  const block = dateBlockOf(event.date, lang) || dateBlock
                  const mapsUrl =
                    event.maps_url ||
                    (event.venue || event.address
                      ? `https://maps.google.com/?q=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "))}`
                      : "")
                  return (
                    <article className="se-event" key={`${event.name || "event"}-${index}`} data-se-reveal>
                      <p className="se-eyebrow">{event.name || "Wedding Event"}</p>
                      {block && (
                        <div className="se-dateblock se-dateblock--sm">
                          <span className="se-dateblock__day">{block.day}</span>
                          <span className="se-dateblock__side">
                            <span>{block.weekday}</span>
                            <span>{block.month}</span>
                            <span>{block.year}</span>
                          </span>
                        </div>
                      )}
                      {event.time && <p className="se-event__time">{event.time}</p>}
                      <hr className="se-hr" />
                      {event.venue && <h3 className="se-display se-event__venue">{event.venue}</h3>}
                      {event.address && <p className="se-text se-event__address">{event.address}</p>}
                      {mapsUrl && (
                        <a className="se-pill se-event__map" href={mapsUrl} target="_blank" rel="noreferrer">
                          View location
                        </a>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Rundown ──────────────────────────────────────────── */}
        {rundown.length > 0 && (
          <section className="se-section se-rundown" data-section="rundown">
            <div className="se-wrap">
              <header className="se-section__head" data-se-reveal>
                <p className="se-eyebrow">Rundown</p>
                <h2 className="se-display se-heading">The Order of the Day</h2>
              </header>

              <ol className="se-rundown__list">
                {rundown.map((item, index) => (
                  <li className="se-rundown__item" key={`${item.time || "rundown"}-${index}`} data-se-reveal>
                    {item.time && <span className="se-rundown__time">{item.time}</span>}
                    {item.description && <span className="se-rundown__desc">{item.description}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* ── Dress code ───────────────────────────────────────── */}
        {hasDresscode && (
          <section className="se-section se-dresscode" data-section="dresscode">
            <div className="se-wrap se-dresscode__inner" data-se-reveal>
              <p className="se-eyebrow">Attire</p>
              <h2 className="se-display se-heading">{profile.dresscode?.title || "What to Wear"}</h2>
              {profile.dresscode?.description && <p className="se-text se-dresscode__desc">{profile.dresscode.description}</p>}
              <div className="se-swatches" aria-label="Dress code palette">
                {dressColors.map((color, index) => (
                  <div className="se-swatch" key={`${color.hex || color.name}-${index}`}>
                    <i style={{ "--se-swatch": color.hex || "#ccc" } as CSSProperties} aria-hidden="true" />
                    {color.name && <span>{color.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ──────────────────────────────────────────── */}
        {gallery.length > 0 && (
          <section className="se-section se-gallery-section" data-section="gallery">
            <div className="se-wrap">
              <header className="se-section__head" data-se-reveal>
                <p className="se-eyebrow">Moments Together</p>
                <h2 className="se-display se-heading">{tc.gallery_title || "The Days We Kept"}</h2>
              </header>

              <div className="se-gallery">
                {gallery.slice(0, 12).map((src, index) => (
                  <button
                    type="button"
                    className="se-gallery__item"
                    key={`${src}-${index}`}
                    onClick={() => setLightbox(index)}
                    aria-label={`Open photo ${index + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>

              {(tc.gallery_quote || coupleLabel) && (
                <figure className="se-gallery__quote" data-se-reveal>
                  <blockquote>
                    “{tc.gallery_quote || "A lifetime with you is the story I would choose again and again."}”
                  </blockquote>
                  <figcaption>, {coupleLabel}</figcaption>
                </figure>
              )}
            </div>
          </section>
        )}

        {/* ── Livestream ───────────────────────────────────────── */}
        {hasStreaming && (
          <section className="se-section se-stream" data-section="livestream">
            <div className="se-wrap">
              <header className="se-section__head" data-se-reveal>
                <p className="se-eyebrow">{t("secLivestream", lang)}</p>
                <h2 className="se-display se-heading">Join From Anywhere</h2>
              </header>

              <div className="se-frame" data-se-reveal>
                <div className="se-frame__media" style={{ backgroundImage: `url(${mediaPoster})` }} aria-hidden="true">
                  <span className="se-frame__badge">◉ Live</span>
                </div>
                <div className="se-frame__body">
                  <h3 className="se-display se-frame__title">{profile.livestream?.title || "Our Wedding Live Stream"}</h3>
                  <p className="se-text">
                    {profile.livestream?.description || "If you cannot be with us in person, watch the celebration as it happens."}
                  </p>
                  <a className="se-pill" href={profile.livestream!.url} target="_blank" rel="noreferrer">
                    {profile.livestream?.buttonLabel || "Watch live"}
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Video ────────────────────────────────────────────── */}
        {hasVideo && (
          <section className="se-section se-video" data-section="video">
            <div className="se-wrap">
              <header className="se-section__head" data-se-reveal>
                <p className="se-eyebrow">In Motion</p>
                <h2 className="se-display se-heading">A Piece Of Our Story</h2>
              </header>

              <div className="se-frame se-frame--video" data-se-reveal>
                <div className="se-frame__video">
                  {directVideo ? (
                    <video src={profile.video_url} controls playsInline preload="metadata" poster={storyPhoto} />
                  ) : isYouTubeEmbed ? (
                    // Built through the IFrame API (not a bare <iframe>) so the
                    // reference behaviour carries over: the guest starts the
                    // film with sound, and the background track stops the
                    // moment the film plays.
                    <AutoplayYouTube
                      videoId={youtubeId}
                      title={`Video ${coupleLabel}`}
                      controls
                      autoplay={false}
                      onPlay={pauseMusic}
                    />
                  ) : (
                    <iframe
                      src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=0&mute=0&modestbranding=1&rel=0&playsinline=1`}
                      title={`Video ${coupleLabel}`}
                      loading="lazy"
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Gift ─────────────────────────────────────────────── */}
        {hasGift && (
          <section className="se-section se-gift" data-section="gift">
            <div className="se-wrap se-gift__inner" data-se-reveal>
              <p className="se-eyebrow">{t("secClosing", lang)}</p>
              <h2 className="se-display se-heading">{tc.gift_intro_title || t("secGift", lang)}</h2>
              <p className="se-text se-gift__intro">
                {tc.gift_intro_description ||
                  "Your presence is the greatest gift. Should you wish to send a token of love, the details are below."}
              </p>

              {giftTabs && (
                <div className="se-tabs" role="tablist" aria-label="Gift details">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={giftTab === "accounts"}
                    className={`se-tab${giftTab === "accounts" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("accounts")}
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={giftTab === "address"}
                    className={`se-tab${giftTab === "address" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("address")}
                  >
                    Send a gift
                  </button>
                </div>
              )}

              {(!giftTabs || giftTab === "accounts") && accounts.length > 0 && (
                <div className="se-gift__cards">
                  {accounts.map((account, index) => (
                    <div className="se-gift-card" key={`${account.account_number || "account"}-${index}`}>
                      <p className="se-gift-card__provider">{account.provider_name || "Bank Account"}</p>
                      <p className="se-gift-card__number">{account.account_number}</p>
                      {account.account_name && <p className="se-gift-card__holder">{account.account_name}</p>}
                      <button type="button" className="se-pill se-gift-card__copy" onClick={() => copyAccount(account.account_number)}>
                        Copy number
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!giftTabs || giftTab === "address") && giftAddress && (
                <div className="se-gift-card se-gift-card--address">
                  <p className="se-gift-card__provider">Send a Gift</p>
                  {profile.gift_address_name && <p className="se-gift-card__holder">{profile.gift_address_name}</p>}
                  <p className="se-gift-card__address">{giftAddress}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Wishes ───────────────────────────────────────────── */}
        <section className="se-section se-wishes-section" data-section="wishes" id="wishes">
          <div className="se-wrap">
            <header className="se-section__head" data-se-reveal>
              <p className="se-eyebrow">With Love</p>
              <h2 className="se-display se-heading">A Word For Us</h2>
              <p className="se-text se-wishes__intro">
                {tc.wishes_intro || "Leave a wish, a prayer, or a memory for us to keep."}
              </p>
            </header>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel} language={profile.language}
            />
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────────── */}
        <section className="se-closing" data-section="closing">
          <div className="se-closing__media" style={{ backgroundImage: `url(${closingPhoto})` }} aria-hidden="true" />
          <div className="se-closing__body">
            <div className="se-closing__inner" data-se-reveal>
              <p className="se-eyebrow">With All Our Hearts</p>
              <h2 className="se-display se-closing__title">Until We Meet</h2>
              <p className="se-text se-closing__message">{closingMessage}</p>
              <p className="se-closing__names">{coupleLabel}</p>
              {profile.display_name && <p className="se-closing__hashtag">{profile.display_name}</p>}

              <footer className="tpl-footer se-footer">
                <a
                  className="tpl-footer__link"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hubungi Aksaraa Wedding via WhatsApp"
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
          </div>
        </section>
      </main>

      {/* ── Envelope cover gate ────────────────────────────────── */}
      <div
        className={`se-gate${opening ? " is-opening" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
      >
        <div className="se-gate__body">
          <div className="se-gate__shell">
            {/* Inside back of the jacket: lit paper, not a window onto the
                page. Grows brighter as the flap lifts so the envelope reads as
                throwing light out instead of going dark. */}
            <span className="se-gate__inner" aria-hidden="true" />
            <div className="se-gate__pocket">
              <span className="se-gate__grain" />
              <span className="se-gate__glow" />
              <svg className="se-gate__creases" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 29 50 64 100 29" />
                <path d="M0 100 50 64 100 100" />
              </svg>
            </div>
          </div>

          <div className="se-gate__lid">
            {/* The lid is a two-sided plane: a printed front (flap + card) and a
                plain paper back, so the fold reads as card stock instead of the
                print showing through mirrored once it passes 90deg. */}
            <div className="se-gate__lid-back" aria-hidden="true">
              <span className="se-gate__grain" />
            </div>

            <div className="se-gate__lid-front">
              <span className="se-gate__flap-shadow" aria-hidden="true" />
              <div className="se-gate__flap">
                <span className="se-gate__grain" />
                <svg className="se-gate__creases" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0 45 50 100 100 45" />
                </svg>
              </div>

              <div className="se-gate__card">
                <p className="se-gate__guest">
                  Dear,
                  <strong>{guestName}</strong>
                </p>
                <p className="se-gate__kicker">{t("theWeddingOf", lang)}</p>
                <h2 className="se-display se-gate__names">{coupleLabel}</h2>
                {dateBlock && <p className="se-gate__date">{dateBlock.full}</p>}
                <p className="se-gate__apology">
                  {tc.cover_apology || "We apologize for any misspelling of your name or title."}
                </p>
              </div>
            </div>
          </div>

          <button type="button" className="se-gate__seal" onClick={openEnvelope} aria-label="Open the invitation">
            <span style={monogramCount > 2 ? { fontSize: `${monogramFontSize(monogram, 19)}px` } : undefined}>{monogram}</span>
          </button>

          <div className="se-gate__action">
            <button type="button" className="se-gate__open" onClick={openEnvelope}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
                <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
              </svg>
              Open Invitation
            </button>
            <span className="se-gate__signature">Wedding by Aksaraa</span>
          </div>
        </div>
      </div>

      {/* ── Photo lightbox ─────────────────────────────────────── */}
      {lightbox !== null && gallery[lightbox] && (
        <div className="se-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button type="button" className="se-lightbox__close" onClick={() => setLightbox(null)} aria-label="Close photo">
            ✕
          </button>
          <button
            type="button"
            className="se-lightbox__nav se-lightbox__nav--prev"
            onClick={() => setLightbox((value) => (value === null ? value : (value - 1 + gallery.length) % gallery.length))}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <img src={gallery[lightbox]} alt="" />
          <button
            type="button"
            className="se-lightbox__nav se-lightbox__nav--next"
            onClick={() => setLightbox((value) => (value === null ? value : (value + 1) % gallery.length))}
            aria-label="Next photo"
          >
            ›
          </button>
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
          anchor="bottom"
          bottom={88}
                  language={profile.language}
        />
      )}

      {toast && (
        <div className="se-toast" role="status">
          {toast}
        </div>
      )}

      {/* Light out of the envelope: a warm bloom peaks while the flap lands
          face-down, then lifts to reveal the invitation out of the light. */}
      <div className={`se-bloom${bloom === "in" ? " is-in" : ""}${bloom === "out" ? " is-out" : ""}`} aria-hidden="true" />
    </div>
  )
}
