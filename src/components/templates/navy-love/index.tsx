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
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./navy-love.css"

// ── Vendored reference art (see docs/REA_NAVY_IVORY.md §5) ──────────────────
const ART = (name: string) => `/templates/navy-love/${name}`
const ART_WALLPAPER = ART("wallpaper.webp")
const ART_ENVELOPE = ART("envelope.webp")
const ART_CREST = ART("crest.webp")
const ART_ARCH = ART("arch.webp")
const ART_POCKET = ART("pocket.webp")
const ART_PLAQUE = ART("plaque.webp")
const ART_CARD_NAVY = ART("card-navy.webp")
const ART_FRAME_PORTRAIT = ART("frame-portrait.webp")
const ART_FRAME_LANDSCAPE = ART("frame-landscape.webp")
const ART_LABEL = ART("label.webp")
const ART_LABEL_SM = ART("label-sm.webp")
const ART_TAPE_LABEL = ART("tape-label.webp")
const ART_FOIL = ART("foil.webp")
const ART_VINYL = ART("vinyl.webp")
const ART_VENUE = ART("venue-etching.webp")
const ART_REGISTRY = ART("registry.webp")
const ART_SPRIG_B = ART("sprig-b.webp")
const ART_SPRIG_C = ART("sprig-c.webp")
const ART_BAND_DETAILS = ART("band-details.webp")
const ART_BAND_CLOSING = ART("band-closing.webp")
const ART_PAPER = ART("paper.webp")
const ART_CANVAS = ART("canvas.webp")

// The reference's timeline icon set, top to bottom.
const STEP_ICONS = [
  ART("icon-rings.webp"),
  ART("icon-drinks.webp"),
  ART("icon-chandelier.webp"),
  ART("icon-table.webp"),
  ART("icon-heels.webp"),
]

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DEFAULT_WELCOME = "Together with their families"
const DEFAULT_WELCOME_NOTE = "invite you to celebrate their marriage"
const DEFAULT_STORY =
  "Every love story begins with a simple hello. Ours grew through laughter, adventures, and the little moments that became everything."
const DEFAULT_INVITING = "Together with the families who share this invitation."
const DEFAULT_MUSIC_CAPTION = "Our favourite song, the soundtrack to our story"

const pad2 = (n: number) => String(n).padStart(2, "0")

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

// ── Drawn ornaments (nothing licensed is shipped as art) ───────────────────

function Fleuron() {
  return (
    <svg className="nl-fleuron" viewBox="0 0 40 22" aria-hidden="true">
      <path d="M20 4v14" />
      <path d="M20 8c-3-4-7-4-8-1 1 3 5 4 8 1z" />
      <path d="M20 8c3-4 7-4 8-1-1 3-5 4-8 1z" />
      <path d="M20 14c-3 4-7 4-8 1 1-3 5-4 8-1z" />
      <path d="M20 14c3 4 7 4 8 1-1-3-5-4-8-1z" />
    </svg>
  )
}

function Garland({ className }: { className?: string }) {
  return (
    <svg className={`nl-garland${className ? ` ${className}` : ""}`} viewBox="0 0 200 14" aria-hidden="true">
      <path d="M4 7h74" />
      <path d="M122 7h74" />
      <path d="M100 1.6 106 7l-6 5.4L94 7z" />
    </svg>
  )
}

function ArchRule({ className }: { className?: string }) {
  return (
    <svg
      className={`nl-archrule${className ? ` ${className}` : ""}`}
      viewBox="0 0 120 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M60 2v156" />
      <path d="M60 2C22 8 6 40 6 78v80" />
      <path d="M60 2c38 6 54 38 54 76v80" />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function NavyLove(profile: TemplateProps) {
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

  const groom = profile.groom_name || "The Groom"
  const bride = profile.bride_name || "The Bride"
  const groomFull = profile.groom_full_name || groom
  const brideFull = profile.bride_full_name || bride
  const coupleLabel = [groom, bride].join(" & ")

  const initials = initialsOf(profile.groom_name, profile.bride_name)
  const derivedMonogram = initials.length === 2 ? `${initials[0]}${initials[1]}` : initials
  const monogram = ((profile.couple_initials || "").trim() || derivedMonogram || "A&M").replace(/\s|&/g, "")

  const covers = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  // Semantic slots (see TEMPLATE_CONFIGS): 0 the welcome card, 1 the love-story
  // plate, 2 the closing.
  const cardPhoto = covers[0] || ""
  const storyPhoto = covers[1] || covers[0] || ""
  const closingPhoto = covers[2] || covers[1] || covers[0] || ""

  const galleryPhotos = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])

  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description))
      : []
  const storyShot = stories.find((s) => !!s.image_url)?.image_url || ""

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
  // The intro plate plays silently on loop; the film plate waits for a tap.
  const filmWatch = useMemo(() => {
    if (!film || film.kind === "file") return film
    const src = film.src.replace(/([?&])autoplay=0?1/g, "$1autoplay=0").replace(/&mute=1/g, "")
    return { kind: "embed" as const, src }
  }, [film])

  const eventDay = useMemo(() => eventDate(profile), [profile])
  const dateDot = formatDotDate(profile.estimated_wedding_date || main?.date)
  const longEventDate = longDate(profile.estimated_wedding_date || main?.date)
  const guestName = profile.guest_name || "Tamu Undangan"
  const calendarUrl = gcalLink(main, profile.groom_name || "", profile.bride_name || "")

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl

  const rawHashtag = (profile.display_name || "").trim()
  const hashtag = rawHashtag.startsWith("#")
    ? rawHashtag
    : `#${`${groom}${bride}`.replace(/[^A-Za-z0-9]/g, "")}`

  const welcomeHeading = (tc.welcome_invite || DEFAULT_WELCOME).trim()
  const welcomeNote = (tc.card_invite || DEFAULT_WELCOME_NOTE).trim()
  const welcomeMessage = (profile.opening_description || "").trim() || DEFAULT_STORY

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

  // Reveal-on-scroll, armed once the invitation opens.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !opened) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-nl-reveal]"))
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
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
    )
    items.forEach((item) => io.observe(item))
    return () => io.disconnect()
  }, [opened])

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

  const style = (image: string) => ({ backgroundImage: `url(${image})` }) as CSSProperties

  return (
    <div ref={rootRef} className={`nl-root${opened ? " is-open" : " is-locked"}`}>
      {hasTrack && (
        <audio
          ref={audioRef}
          loop
          preload="auto"
          src={trackUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      <main className="nl-invitation" aria-hidden={!opened}>
        {/* ── 3+4. Welcome / kalimat pembuka ───────────────────── */}
        <section className="nl-welcome" data-section="welcome">
          <div className="nl-keepsake">
            {/* The open envelope: lace flap behind, pocket in front, petals
                rising out of the V — the card is tucked into it. */}
            <div className="nl-keepsake__envelope" aria-hidden="true">
              <img className="nl-keepsake__flap" src={ART_ARCH} alt="" />
              <img className="nl-keepsake__pocket" src={ART_POCKET} alt="" />
              <img className="nl-keepsake__petals is-a" src={ART_SPRIG_B} alt="" />
              <img className="nl-keepsake__petals is-b" src={ART_SPRIG_C} alt="" />
            </div>

            <div className="nl-keepsake__card">
              <img className="nl-card__back" src={ART_CARD_NAVY} alt="" aria-hidden="true" />
              <div className="nl-card" data-nl-reveal>
                <p className="nl-eyebrow nl-card__invite">{welcomeHeading}</p>
                <h2 className="nl-card__names">
                  <span>{groom}</span>
                  <i>&amp;</i>
                  <span>{bride}</span>
                </h2>
                <p className="nl-eyebrow nl-card__invite">{welcomeNote}</p>
                <span className="nl-card__rule" aria-hidden="true" />
                {longEventDate && <p className="nl-card__date">{longEventDate}</p>}
                {main?.venue && <p className="nl-card__venue">{main.venue}</p>}
                <Fleuron />
              </div>
            </div>

            {cardPhoto && (
              <figure className="nl-keepsake__photo" data-nl-reveal>
                <span className="nl-keepsake__photo-inner">
                  <img src={cardPhoto} alt="" loading="lazy" />
                </span>
                <img className="nl-keepsake__photo-frame" src={ART_FRAME_PORTRAIT} alt="" aria-hidden="true" loading="lazy" />
              </figure>
            )}

            <img className="nl-keepsake__sprig" src={ART_SPRIG_C} alt="" aria-hidden="true" loading="lazy" />
          </div>

          {welcomeMessage && (
            <p className="nl-wrap nl-welcome__note" data-nl-reveal>
              {welcomeMessage}
            </p>
          )}

          {hasTrack && opened && (
            <div className="nl-music" data-nl-reveal>
              <button
                type="button"
                className={`nl-music__disc${playing ? " is-playing" : ""}`}
                onClick={toggleMusic}
                aria-label={playing ? "Pause music" : "Play music"}
                aria-pressed={playing}
              >
                <img src={ART_VINYL} alt="" draggable={false} />
                <span className="nl-music__glyph" aria-hidden="true">
                  {playing ? <i className="nl-music__pause" /> : <i className="nl-music__play" />}
                </span>
              </button>
              <span className="nl-music__caption">
                <img className="nl-music__plaque" src={ART_LABEL} alt="" aria-hidden="true" />
                <span>{tc.music_caption || DEFAULT_MUSIC_CAPTION}</span>
              </span>
            </div>
          )}
        </section>

        {/* ── 2. Opening film ──────────────────────────────────── */}
        {hasVideo && (
          <section className="nl-filmintro" data-section="video-intro">
            <div className="nl-wrap">
              <p className="nl-eyebrow nl-eyebrow--ivory">{tc.film_eyebrow || "A Film"}</p>
            </div>
            <div className="nl-filmintro__stage" data-nl-reveal>
              <div className="nl-filmintro__mat">
                {film!.kind === "file" ? (
                  <video src={film!.src} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <iframe
                    src={film!.src}
                    title={tc.video_title || "Wedding film"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. Mempelai ──────────────────────────────────────── */}
        <section className="nl-section nl-couple" data-section="couple">
          <div className="nl-wrap nl-couple__head" data-nl-reveal>
            <h2 className="nl-display">The Bride &amp; Groom</h2>
            <Garland />
            {tc.profiles_intro && <p className="nl-body nl-couple__intro">{tc.profiles_intro}</p>}
          </div>

          <div className="nl-wrap nl-couple__pair">
            <article className="nl-person" data-nl-reveal>
              <figure className="nl-person__photo">
                <img src={groomPhoto(profile.groom_photo_url)} alt={groomFull} loading="lazy" />
              </figure>
              <h3 className="nl-person__name">{groomFull}</h3>
              {profile.groom_parents && <p className="nl-body nl-person__parents">{profile.groom_parents}</p>}
              {profile.groom_instagram && (
                <a
                  className="nl-micro nl-person__ig"
                  href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.groom_instagram.startsWith("@") ? profile.groom_instagram : `@${profile.groom_instagram}`}
                </a>
              )}
            </article>

            <span className="nl-amp" aria-hidden="true">
              &amp;
            </span>

            <article className="nl-person" data-nl-reveal>
              <figure className="nl-person__photo">
                <img src={bridePhoto(profile.bride_photo_url)} alt={brideFull} loading="lazy" />
              </figure>
              <h3 className="nl-person__name">{brideFull}</h3>
              {profile.bride_parents && <p className="nl-body nl-person__parents">{profile.bride_parents}</p>}
              {profile.bride_instagram && (
                <a
                  className="nl-micro nl-person__ig"
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

        {/* ── 6. Love story ────────────────────────────────────── */}
        {stories.length > 0 && (
          <section className="nl-story" data-section="story" style={style(ART_PAPER)}>
            <div className="nl-wrap nl-story__head" data-nl-reveal>
              <h2 className="nl-display">{tc.love_story_title || "Our Love Story"}</h2>
            </div>

            <div className="nl-wrap nl-story__plates">
              {storyPhoto && (
                <figure className="nl-story__torn" data-nl-reveal>
                  <img src={storyPhoto} alt="" loading="lazy" />
                </figure>
              )}
              {storyShot && (
                <figure className="nl-story__polaroid" data-nl-reveal>
                  <img src={storyShot} alt="" loading="lazy" />
                  <img className="nl-story__tape" src={ART_FOIL} alt="" aria-hidden="true" loading="lazy" />
                  <figcaption>
                    <img className="nl-story__caption-plate" src={ART_TAPE_LABEL} alt="" aria-hidden="true" loading="lazy" />
                    <span>
                      <b>
                        {groom} &amp; {bride}
                      </b>
                      {dateDot && <i>{dateDot.replace(/-/g, ".")}</i>}
                    </span>
                  </figcaption>
                </figure>
              )}
            </div>

            <div className="nl-wrap nl-story__body">
              <p className="nl-story__intro" data-nl-reveal>
                {tc.story_intro || DEFAULT_STORY}
              </p>
              {stories.map((story, index) => (
                <div className="nl-story__chapter" key={`${story.title || "chapter"}-${index}`} data-nl-reveal>
                  {story.title && <p className="nl-story__chaptertitle">{story.title}</p>}
                  {story.description && <p className="nl-story__text">{story.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Events ────────────────────────────────────────── */}
        {events.length > 0 && (
          <section className="nl-section nl-glance" data-section="events">
            <div className="nl-wrap nl-glance__head" data-nl-reveal>
              <h2 className="nl-display">Wedding At A Glance</h2>
              <Garland />
              {tc.events_intro && <p className="nl-body nl-glance__intro">{tc.events_intro}</p>}
              <img className="nl-glance__etching" src={ART_VENUE} alt="" aria-hidden="true" loading="lazy" />
            </div>

            <div className="nl-wrap nl-glance__body">
              {longEventDate && (
                <div className="nl-glance__row" data-nl-reveal>
                  <p className="nl-glance__label">Date</p>
                  <p className="nl-glance__value">{longEventDate}</p>
                </div>
              )}

              {events.map((event, index) => {
                const maps =
                  event.maps_url ||
                  (event.venue || event.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [event.venue, event.address].filter(Boolean).join(", ")
                      )}`
                    : "")
                return (
                  <div className="nl-glance__row" key={`${event.name || "event"}-${index}`} data-nl-reveal>
                    <p className="nl-glance__label">{event.name || "Wedding Event"}</p>
                    {event.time && <p className="nl-glance__value">{event.time}</p>}
                    {event.venue && <p className="nl-glance__value nl-glance__venue">{event.venue}</p>}
                    {event.address && <p className="nl-body nl-glance__address">{event.address}</p>}
                    {maps && (
                      <a className="nl-pill" href={maps} target="_blank" rel="noreferrer">
                        Get Directions
                      </a>
                    )}
                  </div>
                )
              })}
            </div>

            {calendarUrl && (
              <div className="nl-wrap nl-glance__cal" data-nl-reveal>
                <a className="nl-link" href={calendarUrl} target="_blank" rel="noreferrer">
                  Add to calendar
                </a>
              </div>
            )}
          </section>
        )}

        {/* ── 8. Countdown ─────────────────────────────────────── */}
        {eventDay && (
          <section className="nl-countdown" data-section="countdown">
            <img className="nl-countdown__sprig is-left" src={ART_SPRIG_C} alt="" aria-hidden="true" loading="lazy" />
            <img className="nl-countdown__sprig is-right" src={ART_SPRIG_C} alt="" aria-hidden="true" loading="lazy" />
            <div className="nl-wrap nl-countdown__body" data-nl-reveal>
              <p className="nl-countdown__kicker">Counting every second until forever,</p>
              <CountdownClock iso={profile.estimated_wedding_date} sessions={profile.sessions} />
              <p className="nl-countdown__names">{coupleLabel}</p>
              {dateDot && <p className="nl-countdown__date">{dateDot.replace(/-/g, " . ")}</p>}
            </div>
          </section>
        )}

        {/* ── 9. Turut mengundang ──────────────────────────────── */}
        {honored.length > 0 && (
          <section className="nl-section nl-inviting" data-section="inviting">
            <div className="nl-wrap nl-inviting__body" data-nl-reveal>
              <div className="nl-inviting__plaque">
                <img src={ART_PLAQUE} alt="" aria-hidden="true" loading="lazy" />
                <h2 className="nl-display nl-display--ivory">With Honour</h2>
              </div>
              <p className="nl-body nl-inviting__intro">{tc.inviting_intro || DEFAULT_INVITING}</p>
              <ul className="nl-inviting__list">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>
                    <img src={ART_LABEL_SM} alt="" aria-hidden="true" loading="lazy" />
                    <span>{family}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── 10. Rundown ──────────────────────────────────────── */}
        {rundown.length > 0 && (
          <section className="nl-rundown" data-section="rundown">
            <div className="nl-wrap nl-rundown__head" data-nl-reveal>
              <h2 className="nl-display nl-display--ivory">{tc.rundown_title || "Wedding Timeline"}</h2>
              {tc.rundown_intro && <p className="nl-body nl-rundown__intro">{tc.rundown_intro}</p>}
            </div>
            <ol className="nl-wrap nl-rundown__list">
              {rundown.map((item, index) => (
                <li className="nl-step" key={`${item.time || "step"}-${index}`} data-nl-reveal>
                  <span
                    className="nl-step__icon"
                    aria-hidden="true"
                    style={{ ["--nl-icon" as string]: `url(${STEP_ICONS[index % STEP_ICONS.length]})` } as CSSProperties}
                  />
                  <span className="nl-step__text">
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
          <section className="nl-section nl-gallery" data-section="gallery">
            <div className="nl-wrap nl-gallery__head" data-nl-reveal>
              <h2 className="nl-display">{tc.gallery_title || "Our Moments"}</h2>
              <Garland />
              {tc.gallery_intro && <p className="nl-body nl-gallery__intro">{tc.gallery_intro}</p>}
            </div>
            <div className="nl-wrap nl-gallery__grid">
              {galleryPhotos.map((photo, index) => (
                <button
                  type="button"
                  className="nl-gallery__tile"
                  key={`${photo}-${index}`}
                  data-nl-reveal
                  style={{ transitionDelay: `${(index % 2) * 90}ms` }}
                  onClick={() => setLightbox(index)}
                  aria-label={`Open photograph ${index + 1} of ${galleryPhotos.length}`}
                >
                  <img src={photo} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 12. Film ─────────────────────────────────────────── */}
        {hasVideo && (
          <section className="nl-section nl-film" data-section="video">
            <div className="nl-wrap nl-film__body" data-nl-reveal>
              <h2 className="nl-display">{tc.video_title || "Our Film"}</h2>
              <Garland />
              {tc.video_intro && <p className="nl-body nl-film__intro">{tc.video_intro}</p>}

              {tc.video_caption && <p className="nl-film__caption">{tc.video_caption}</p>}
              <div className="nl-film__mat">
                {filmWatch!.kind === "file" ? (
                  <video src={filmWatch!.src} controls playsInline preload="metadata" poster={closingPhoto || undefined} />
                ) : (
                  <iframe
                    src={filmWatch!.src}
                    title={tc.video_title || "Our Film"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── 13. Gift ─────────────────────────────────────────── */}
        {hasGift && (
          <section className="nl-gift" data-section="gift" style={style(ART_CANVAS)}>
            <div className="nl-wrap nl-gift__body" data-nl-reveal>
              <img className="nl-gift__art" src={ART_REGISTRY} alt="" aria-hidden="true" loading="lazy" />
              <h2 className="nl-display">{tc.gift_intro_title || "Wedding Gift"}</h2>
              <p className="nl-gift__lede">
                {tc.gift_lede || "Your presence is the greatest gift of all"}
              </p>
              <p className="nl-body nl-gift__intro">
                {tc.gift_intro_description || "If you would like to send a token of love, the details are below."}
              </p>

              {accounts.length > 0 && (
                <ul className="nl-accounts">
                  {accounts.map((account, index) => {
                    const open = openAccount === index
                    return (
                      <li className={`nl-account${open ? " is-open" : ""}`} key={`${account.account_number || "acc"}-${index}`}>
                        <button
                          type="button"
                          className="nl-account__head"
                          aria-expanded={open}
                          onClick={() => setOpenAccount(open ? -1 : index)}
                        >
                          <span>{account.provider_name || "Bank"}</span>
                          <svg className="nl-account__chev" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 9.5 12 15l6-5.5" />
                          </svg>
                        </button>
                        <div className="nl-account__panel">
                          <div className="nl-account__inner">
                            {account.account_number && <p className="nl-account__number">{account.account_number}</p>}
                            {account.account_name && <p className="nl-account__name">{account.account_name}</p>}
                            {account.account_number && (
                              <button type="button" className="nl-link" onClick={() => copyText(account.account_number)}>
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
                <div className="nl-address">
                  {profile.gift_address_name && <p className="nl-address__name">{profile.gift_address_name}</p>}
                  <p className="nl-body nl-address__text">{giftAddress}</p>
                  <button type="button" className="nl-link" onClick={() => copyText(giftAddress)}>
                    Copy address
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 14. Dress code ───────────────────────────────────── */}
        {hasDresscode && (
          <section className="nl-section nl-dress" data-section="dresscode">
            <div className="nl-wrap nl-dress__body" data-nl-reveal>
              <h2 className="nl-display">Dress Code</h2>
              {profile.dresscode?.title && <p className="nl-dress__title">{profile.dresscode.title}</p>}
              {profile.dresscode?.description && (
                <p className="nl-body nl-dress__note">{profile.dresscode.description}</p>
              )}
              {dressColors.length > 0 && (
                <div className="nl-swatches" aria-label="Dress code palette">
                  {dressColors.map((color, index) => (
                    <span className="nl-swatch" key={`${color.hex || color.name}-${index}`}>
                      <i style={{ ["--nl-swatch" as string]: color.hex || "#ccc" } as CSSProperties} aria-hidden="true" />
                      {color.name && <em>{color.name}</em>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 15. Wishes ───────────────────────────────────────── */}
        <section className="nl-section nl-wishes" data-section="wishes">
          <div className="nl-wrap nl-wishes__body" data-nl-reveal>
            <h2 className="nl-display">Wishes</h2>
            <Garland />
            <p className="nl-body nl-wishes__intro">
              {tc.wishes_intro ||
                "Nothing would make us happier than celebrating this day surrounded by the people we love. Leave us a wish."}
            </p>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel}
            />
          </div>
        </section>

        {/* ── 16. Closing ──────────────────────────────────────── */}
        <section className="nl-closing" data-section="closing">
          <img className="nl-closing__band" src={ART_BAND_CLOSING} alt="" aria-hidden="true" loading="lazy" />
          <div className="nl-wrap nl-closing__body" data-nl-reveal>
            {closingPhoto && (
              <figure className="nl-closing__photo">
                <img src={closingPhoto} alt="" loading="lazy" />
                <img className="nl-closing__frame" src={ART_FRAME_LANDSCAPE} alt="" aria-hidden="true" loading="lazy" />
              </figure>
            )}
            <p className="nl-closing__title">Thank You</p>
            <p className="nl-body nl-closing__message">
              {tc.closing_message || "We cannot wait to celebrate with you."}
            </p>
            <p className="nl-closing__names">{coupleLabel}</p>
            <p className="nl-hashtag">{hashtag}</p>
            {tc.cover_apology && <p className="nl-closing__apology">{tc.cover_apology}</p>}

            <footer className="tpl-footer nl-footer">
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

      {/* ── Cover: sealed envelope ───────────────────────────────── */}
      <div
        className={`nl-gate${opened ? " is-open" : ""}`}
        data-section="cover"
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
        onClick={openInvitation}
      >
        <span className="nl-gate__wallpaper" style={style(ART_WALLPAPER)} aria-hidden="true" />
        <div className="nl-gate__card">
          <p className="nl-gate__eyebrow">{tc.cover_kicker || "The Wedding"}</p>
          <h1 className="nl-gate__names">
            <span>{groom}</span>
            <em>&amp;</em>
            <span>{bride}</span>
          </h1>

          <div className="nl-gate__envelope">
            <img className="nl-gate__flap" src={ART_ENVELOPE} alt="" aria-hidden="true" draggable={false} />
            <img className="nl-gate__crest" src={ART_CREST} alt="" aria-hidden="true" draggable={false} />
          </div>

          <button type="button" className="nl-gate__open" onClick={openInvitation}>
            Buka Undangan
          </button>

          <p className="nl-gate__guest">
            <span>Dear,</span>
            <strong>{guestName}</strong>
          </p>
        </div>
        <span className="nl-gate__brand">Wedding by Aksaraa</span>
      </div>

      {lightbox !== null && galleryPhotos[lightbox] && (
        <div className="nl-lightbox" role="dialog" aria-modal="true" aria-label="Photograph">
          <button
            type="button"
            className="nl-lightbox__nav nl-lightbox__nav--prev"
            onClick={() => setLightbox((lightbox - 1 + galleryPhotos.length) % galleryPhotos.length)}
            aria-label="Previous photograph"
          >
            ‹
          </button>
          <img src={galleryPhotos[lightbox]} alt="" />
          <button
            type="button"
            className="nl-lightbox__nav nl-lightbox__nav--next"
            onClick={() => setLightbox((lightbox + 1) % galleryPhotos.length)}
            aria-label="Next photograph"
          >
            ›
          </button>
          <button type="button" className="nl-lightbox__close" onClick={() => setLightbox(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || "Guest"}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={92}
        />
      )}

      {toast && (
        <div className="nl-toast" role="status">
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
    <div className="nl-clock" aria-label="Wedding countdown">
      {cells.map(([value, label], index) => (
        <Fragment key={label}>
          <div className="nl-clock__cell">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
          {index < cells.length - 1 && (
            <span className="nl-clock__sep" aria-hidden="true">
              :
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
