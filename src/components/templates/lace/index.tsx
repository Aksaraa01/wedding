"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, flattenPhotos, formatDotDate, gcalLink, groomPhoto, bridePhoto, initialsOf, videoSource } from "../shared/lib"
import Wishes from "./Wishes"
import WishesHeart from "./WishesHeart"
import "./lace.css"
import { normalizeLanguage, t } from "@/lib/i18n"

// Art shipped with the template. Decorative surfaces only — never couple data.
const A = (name: string) => `/templates/lace/${name}`
// The landing is the reference's own opening film: a tulle veil, gathered by a
// wax seal, that lifts away to reveal the lace frame. The seal is painted into
// the film (it cannot be edited), so we cover it with our own plaque and ride
// the film's clock — the same approach as Embroidered Garden's door medallion.
const ART_OPENING = A("opening.mp4")
const ART_SEALED = A("cover-sealed.jpg")
const ART_HERO = A("hero-bg.mp4")
const ART_FRAME = A("cover-frame.webp")
const ART_VILLA = A("villa.svg")
const ART_BAND = A("band-lace.webp")
const ART_BORDER = A("band-border.webp")
const ART_PANEL = A("panel-lace.webp")
const ART_BOWS = A("bow-frame.webp")
const ART_DRESS_FRAME = A("dress-frame.webp")
const ART_DRESS_COUPLE = A("dress-couple.webp")
const ART_BALCONY = A("balcony.webp")
// Lace bow + empty oval medallion, borrowed from the reference's hotel cards.
const ART_CARD = A("card-ornament.webp")
const ART_GARLAND = A("garland.webp")
const ART_GARLAND_STRANDS = [
  A("garland-0.webp"),
  A("garland-1.webp"),
  A("garland-2.webp"),
  A("garland-3.webp"),
  A("garland-4.webp"),
]
const ART_PEARLS = A("pearls.webp")
const ART_TABLE = A("table.webp")

// One vignette per timeline row. Five rows is the served length, so the first
// five are matched to the reference beats (arrive → vow → toast → dine → dance);
// longer lists fall back to a six-step cycle that ends on the champagne coupe.
const STEP_CORE = [
  A("step-welcome.webp"),
  A("step-ceremony.webp"),
  A("step-cocktail.webp"),
  A("step-dinner.webp"),
  A("step-dancing.webp"),
]
const STEP_CYCLE = [...STEP_CORE, A("step-champagne.webp")]

function stepArt(index: number, total: number): string {
  return total <= STEP_CORE.length ? STEP_CORE[index] : STEP_CYCLE[index % STEP_CYCLE.length]
}

const DEFAULT_WELCOME =
  "We are so happy to celebrate this day with you, surrounded by the people we love most."
const DEFAULT_EVENTS_INTRO =
  "We would be honoured to have you with us as we say our vows."
const DEFAULT_INVITING =
  "Together with the families who share this invitation."

// Roman numerals for the medallion in the event-card ornament.
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const pad2 = (n: number) => String(n).padStart(2, "0")

// English long date — the reference invitation is written in English, so the
// Indonesian helper in shared/lib is deliberately not used here.
function longDate(value?: string | null): string {
  if (!value) return ""
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  if (isNaN(d.getTime())) return ""
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
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

// The ticking seconds are isolated so they never re-render the invitation.
function CountdownClock({ iso, sessions }: { iso?: string; sessions?: TemplateProps["sessions"] }) {
  const c = useCountdown(iso, sessions)
  const cells: Array<[string, string]> = [
    [c?.d ?? "00", "Days"],
    [c?.h ?? "00", "Hours"],
    [c?.m ?? "00", "Minutes"],
    [c?.s ?? "00", "Seconds"],
  ]
  return (
    <div className="lc-clock" aria-label="Wedding countdown">
      {cells.map(([value, label]) => (
        <div className="lc-clock__cell" key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// Wax-seal plaque drawn over the monogram baked into the cover artwork. The
// bake is not a DOM element, so it can only be covered — this sits on the
// measured footprint of the reference seal (24% × 17%, centred 50.2/50.9) and
// carries OUR couple's initials in an engraved tone.
function SealPlaque({ text }: { text: string }) {
  return (
    <svg className="lc-seal" viewBox="0 0 200 240" role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="lc-seal-fill" cx="50%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#fdfbf7" />
          <stop offset="60%" stopColor="#f8f2e9" />
          <stop offset="100%" stopColor="#ece2d4" />
        </radialGradient>
        <filter id="lc-seal-soft" x="-18%" y="-14%" width="136%" height="128%">
          <feDropShadow dx="0" dy="1.6" stdDeviation="2.2" floodColor="#6b5142" floodOpacity="0.16" />
        </filter>
      </defs>

      <g filter="url(#lc-seal-soft)">
        <ellipse cx="100" cy="120" rx="94" ry="113" fill="url(#lc-seal-fill)" />
        <ellipse cx="100" cy="120" rx="88" ry="106" fill="none" stroke="#fdfaf5" strokeWidth="5" />
        <ellipse cx="100" cy="120" rx="82" ry="99" fill="none" stroke="#d9c9b4" strokeWidth="0.9" opacity="0.9" />
        <ellipse
          cx="100"
          cy="120"
          rx="74"
          ry="89"
          fill="none"
          stroke="#cbb69c"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="0.6 6.4"
          opacity="0.85"
        />
      </g>

      <text
        x="100"
        y="131"
        textAnchor="middle"
        fontFamily="'Cormorant', 'Cormorant Garamond', 'Playfair Display', serif"
        fontSize={text.length > 5 ? 38 : 47}
        fontWeight={400}
        letterSpacing="2"
        fill="#a8917a"
      >
        {text}
      </text>
      <path d="M74 158h52" stroke="#d9c9b4" strokeWidth="0.9" />
    </svg>
  )
}

// Where the baked seal sits, second by second, in % of the 1080×1920 film:
// centred at first, then carried upward with the tulle until it clears the top
// edge. Sampled from frames of `opening.mp4`, so our plaque is glued to it
// rather than floating on its own path.
// Measured on the film itself (normalised cross-correlation against the seal
// crop from frame 0), not eyeballed: the seal barely moves for the first half
// second, then accelerates. `cx` is pulled ~0.8 % left of the baked seal so the
// plaque reads as centred in the frame, and `w` carries the extra margin that
// buys — the seal's rim can still never peek out from under it.
const SEAL_TRACK = [
  { t: 0.0, cx: 50.4, cy: 51.0, w: 22.8 },
  { t: 0.6, cx: 50.4, cy: 50.4, w: 22.8 },
  { t: 1.0, cx: 50.4, cy: 48.1, w: 22.9 },
  { t: 1.4, cx: 50.4, cy: 44.6, w: 23.1 },
  { t: 1.8, cx: 50.5, cy: 37.9, w: 23.4 },
  { t: 2.2, cx: 50.6, cy: 29.4, w: 23.8 },
  { t: 2.6, cx: 50.7, cy: 15.8, w: 24.2 },
  { t: 2.9, cx: 50.8, cy: 4.0, w: 24.8 },
  { t: 3.2, cx: 50.9, cy: -12.0, w: 25.4 },
]

function sealAt(time: number) {
  if (time <= SEAL_TRACK[0].t) return SEAL_TRACK[0]
  for (let i = 1; i < SEAL_TRACK.length; i++) {
    const prev = SEAL_TRACK[i - 1]
    const next = SEAL_TRACK[i]
    if (time > next.t) continue
    const k = (time - prev.t) / (next.t - prev.t)
    return {
      cx: prev.cx + (next.cx - prev.cx) * k,
      cy: prev.cy + (next.cy - prev.cy) * k,
      w: prev.w + (next.w - prev.w) * k,
    }
  }
  return SEAL_TRACK[SEAL_TRACK.length - 1]
}

export default function Lace(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gateFilmRef = useRef<HTMLVideoElement | null>(null)
  const sealRef = useRef<HTMLSpanElement | null>(null)
  const gateRef = useRef(false)
  const toastTimer = useRef<number | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)

  const [opened, setOpened] = useState(false)
  const [opening, setOpening] = useState(false)
  const [fading, setFading] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [openAccount, setOpenAccount] = useState(-1)
  const [toast, setToast] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const sessions = (profile.sessions || []).filter(Boolean)
  const main = sessions[0]
  // Every session that names something (akad, resepsi) is an event card. The
  // reference's separate "Location" block is gone — the venue lives here.
  const events = sessions.filter((s) => !!(s.name || s.venue || s.date || s.address))

  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
      : []
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((i) => i && (i.time || i.description))
      : []
  // Love story: package gate AND the couple's own toggle, then drop milestones
  // that carry nothing at all so an empty list never renders an orphan heading.
  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url))
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const groom = profile.groom_name || "The Groom"
  const bride = profile.bride_name || "The Bride"
  // The mempelai block names the couple in full, the way the families wrote it.
  const groomFull = profile.groom_full_name || groom
  const brideFull = profile.bride_full_name || bride
  const coupleLabel = [groom, bride].join(" & ")
  // Closing: two cover slots. The first is the section backdrop, the second
  // slides across it as a strip. A single filled slot is used for both, so the
  // design still works when only one photo is uploaded.
  const closingCovers = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const closingBackdrop = closingCovers[0] || closingCovers[1] || ""
  const closingStrip = closingCovers[1] || closingCovers[0] || ""
  // The wax stamp carries "Singkatan Pasangan" when the couple set it, and the
  // initials derived from their names otherwise.
  const initials = initialsOf(profile.groom_name, profile.bride_name)
  const derivedSeal = initials.length === 2 ? `${initials[0]} & ${initials[1]}` : initials
  const sealText = (profile.couple_initials || "").trim() || derivedSeal || "A & E"
  const guestName = profile.guest_name || "Tamu Undangan"
  const dateDot = formatDotDate(profile.estimated_wedding_date || main?.date)
  // The welcome block is the couple's "kalimat pembuka": its title is the
  // heading, its description the body. `welcome_invite` / `welcome_message`
  // remain the fallback so invitations authored before this mapping keep copy.
  const welcomeTitle =
    (profile.opening_title || "").trim() || tc.welcome_invite || "Together with their families"
  const welcomeMessage = (profile.opening_description || "").trim() || tc.welcome_message || DEFAULT_WELCOME

  // The lead tile spans both columns, so an even number of photos leaves the
  // grid with a single orphan on the last row. Drop the last photo instead of
  // shipping a ragged edge.
  const galleryPhotos = useMemo(() => {
    const all = flattenPhotos(profile.gallery_photos)
    return all.length > 1 && all.length % 2 === 0 ? all.slice(0, -1) : all
  }, [profile.gallery_photos])
  const film = videoSource(profile.video_url)
  const hasFilm =
    !!film && gates.video !== false && profile.video_section_visible !== false

  const calendarUrl = gcalLink(main, profile.groom_name || "", profile.bride_name || "")

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  const musicStart = Math.max(0, Number(tc.music_start_seconds ?? 0) || 0)
  const musicEnd =
    tc.music_end_seconds == null || tc.music_end_seconds === "" ? null : Number(tc.music_end_seconds)

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  // The wax seal is the tap: the opening film plays from its sealed first frame,
  // the tulle lifts, and the invitation is handed over only once the film has
  // reached its own last frame. The hand-over follows the *media* clock — the
  // fixed eight-second cap used to cut the ending whenever the download ran
  // behind playback. The watchdog below only rescues a stream that has stopped.
  const openGate = useCallback(() => {
    if (gateRef.current) return
    gateRef.current = true
    setOpening(true)
    if (hasTrack) {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    }
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const film = gateFilmRef.current
    if (!film || reduced) {
      setFading(true)
      return
    }

    // A data-saver request is an explicit choice: dissolve straight into the
    // invitation. `effectiveType` alone is only a hint (several browsers report
    // it wrongly), so a 2G report just shortens the first-frame budget below.
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    if (conn?.saveData) {
      setFading(true)
      return
    }
    const startBudget = /^(slow-)?2g$/.test(conn?.effectiveType || "") ? 12_000 : 25_000

    let done = false
    let started = false
    let lastTime = -1
    let lastAdvanceAt = Date.now()
    let watchdog = 0
    let bufferTimer = 0

    const clearBufferTimer = () => {
      if (bufferTimer) window.clearTimeout(bufferTimer)
      bufferTimer = 0
    }

    const cleanup = () => {
      if (watchdog) window.clearInterval(watchdog)
      watchdog = 0
      clearBufferTimer()
      film.removeEventListener("playing", onPlaying)
      film.removeEventListener("waiting", onWaiting)
      film.removeEventListener("stalled", onWaiting)
      film.removeEventListener("timeupdate", onTimeUpdate)
      film.removeEventListener("ended", finish)
      film.removeEventListener("error", finish)
      teardownRef.current = null
    }

    const finish = () => {
      if (done) return
      done = true
      cleanup()
      setBuffering(false)
      setFading(true)
    }

    const onPlaying = () => {
      started = true
      lastTime = film.currentTime
      lastAdvanceAt = Date.now()
      clearBufferTimer()
      setBuffering(false)
    }

    const onWaiting = () => {
      if (bufferTimer) return
      bufferTimer = window.setTimeout(() => {
        bufferTimer = 0
        if (!done) setBuffering(true)
      }, 600)
    }

    const onTimeUpdate = () => {
      // Ignore the tick that a stalled film emits at t=0: it is not playback.
      if (!started && (!film.paused || film.currentTime > 0)) onPlaying()
      if (film.currentTime !== lastTime) {
        lastTime = film.currentTime
        lastAdvanceAt = Date.now()
      }
      const duration = film.duration
      if (Number.isFinite(duration) && duration > 0 && duration - film.currentTime <= 0.15) {
        finish()
      }
    }

    film.addEventListener("playing", onPlaying)
    film.addEventListener("waiting", onWaiting)
    film.addEventListener("stalled", onWaiting)
    film.addEventListener("timeupdate", onTimeUpdate)
    film.addEventListener("ended", finish)
    film.addEventListener("error", finish)
    teardownRef.current = cleanup

    // The first frame is what the guest is waiting for after the tap.
    if (film.readyState < 3) setBuffering(true)

    const tappedAt = Date.now()
    watchdog = window.setInterval(() => {
      if (done) return
      if (!started) {
        // Budget for a slow first frame, but never hold the gate open forever
        // on a link that cannot deliver the file at all.
        if (Date.now() - tappedAt > startBudget) finish()
        return
      }
      if (Date.now() - lastAdvanceAt > 8_000) finish()
    }, 500)

    film.play().catch(() => finish())
  }, [hasTrack])

  // Never leave the interval/listeners behind if the preview unmounts mid-film.
  useEffect(() => {
    return () => {
      teardownRef.current?.()
    }
  }, [])

  // Hand over as soon as the gate has faded. The reference's 2 s fade reads as
  // a long white-out on a slow phone, so both halves are shorter here: the veil
  // has already cleared by the time we start fading.
  useEffect(() => {
    if (!fading || opened) return
    const id = window.setTimeout(() => {
      setOpened(true)
      window.scrollTo(0, 0)
    }, 650)
    return () => window.clearTimeout(id)
  }, [fading, opened])

  // The plaque has to travel with the seal painted into the film, so it is
  // driven by the film's own clock instead of a CSS transition.
  useEffect(() => {
    if (!opening || opened) return
    const plaque = sealRef.current
    const film = gateFilmRef.current
    if (!plaque || !film) return
    let raf = 0
    const apply = () => {
      const { cx, cy, w } = sealAt(film.currentTime)
      plaque.style.left = `${cx}%`
      plaque.style.top = `${cy}%`
      plaque.style.width = `${w}%`
      // Once the film has carried it past the top edge there is nothing left to
      // cover, and a plaque hovering over the frame would look like a sticker.
      plaque.style.opacity = cy < -8 ? "0" : "1"
      raf = window.requestAnimationFrame(apply)
    }
    apply()
    return () => window.cancelAnimationFrame(raf)
  }, [opening, opened])

  // The gate carries the opening film only; once the invitation is handed over
  // the cover's own backdrop takes it from there.
  useEffect(() => {
    if (!opened) return
    gateFilmRef.current?.pause()
  }, [opened])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [opened])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-reveal]"))
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("is-in"))
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    )
    items.forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [opened])

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

  const clampMusic = (audio: HTMLAudioElement) => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0
    const start = Math.min(musicStart, Math.max(0, duration - 0.05))
    if (
      audio.currentTime < start ||
      (musicEnd !== null && Number.isFinite(musicEnd) && audio.currentTime >= musicEnd)
    ) {
      audio.currentTime = start
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

  const bandStyle = (image: string) => ({ backgroundImage: `url(${image})` }) as CSSProperties

  return (
    <div ref={rootRef} className={`lc-root${opened ? " is-open" : " is-locked"}`}>
      {hasTrack && (
        <audio
          ref={audioRef}
          loop
          preload="none"
          src={trackUrl}
          onLoadedMetadata={(e) => {
            const audio = e.currentTarget
            if (musicStart > 0 && Number.isFinite(audio.duration)) {
              audio.currentTime = Math.min(musicStart, Math.max(0, audio.duration - 0.05))
            }
          }}
          onTimeUpdate={(e) => clampMusic(e.currentTarget)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {hasTrack && opened && (
        <button
          type="button"
          className={`lc-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="lc-music__ring" aria-hidden="true" />
          <span className="lc-music__icon" aria-hidden="true">
            {playing ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M8 4.5v15l12-7.5-12-7.5Z" />
              </svg>
            )}
          </span>
        </button>
      )}

      <main className="lc-invitation" aria-hidden={!opened}>
        {/* ── The lace invitation card ─────────────────────────── */}
        <section className="lc-cover" data-section="cover">
          <div className="lc-cover__card">
            <div className="lc-cover__art" style={bandStyle(ART_FRAME)} aria-hidden="true" />
            <video
              className="lc-cover__living"
              src={ART_HERO}
              poster={ART_FRAME}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden="true"
            />
            <div className="lc-cover__body">
              <p className="lc-kicker">{tc.cover_kicker || t("theWeddingOf", lang)}</p>
              <h1 className="lc-cover__names">
                <span>{groom}</span>
                <em>&amp;</em>
                <span>{bride}</span>
              </h1>
              {dateDot && <p className="lc-cover__date">{dateDot}</p>}
              <img className="lc-cover__villa" src={ART_VILLA} alt="" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ── Welcome ──────────────────────────────────────────── */}
        <section className="lc-section lc-welcome" data-section="welcome">
          <span className="lc-band lc-band--lead" style={bandStyle(ART_BAND)} aria-hidden="true" />
          <div className="lc-wrap lc-welcome__body" data-lc-reveal>
            <img className="lc-welcome__art" src={STEP_CORE[0]} alt="" aria-hidden="true" loading="lazy" />
            <h2 className="lc-display lc-welcome__title">{welcomeTitle}</h2>
            <p className="lc-body lc-welcome__message">{welcomeMessage}</p>
          </div>
        </section>

        {/* ── Mempelai (the couple) ────────────────────────────── */}
        <section className="lc-section lc-couple" data-section="couple">
          <div className="lc-wrap lc-couple__head" data-lc-reveal>
            <h2 className="lc-display lc-heading">The Bride &amp; Groom</h2>
            {tc.profiles_intro && <p className="lc-body lc-couple__intro">{tc.profiles_intro}</p>}
          </div>

          <div className="lc-wrap lc-couple__pair">
            <article className="lc-person" data-lc-reveal>
              <figure className="lc-person__photo">
                <img src={groomPhoto(profile.groom_photo_url)} alt={groomFull} loading="lazy" />
              </figure>
              <h3 className="lc-script lc-person__name">{groomFull}</h3>
              {profile.groom_parents && (
                <p className="lc-body lc-person__parents">{profile.groom_parents}</p>
              )}
              {profile.groom_instagram && (
                <a
                  className="lc-link lc-person__ig"
                  href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Instagram ${profile.groom_instagram}`}
                >
                  {profile.groom_instagram.startsWith("@")
                    ? profile.groom_instagram
                    : `@${profile.groom_instagram}`}
                </a>
              )}
            </article>

            <span className="lc-couple__amp" aria-hidden="true">
              <i />
              <em>&amp;</em>
              <i />
            </span>

            <article className="lc-person" data-lc-reveal>
              <figure className="lc-person__photo">
                <img src={bridePhoto(profile.bride_photo_url)} alt={brideFull} loading="lazy" />
              </figure>
              <h3 className="lc-script lc-person__name">{brideFull}</h3>
              {profile.bride_parents && (
                <p className="lc-body lc-person__parents">{profile.bride_parents}</p>
              )}
              {profile.bride_instagram && (
                <a
                  className="lc-link lc-person__ig"
                  href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Instagram ${profile.bride_instagram}`}
                >
                  {profile.bride_instagram.startsWith("@")
                    ? profile.bride_instagram
                    : `@${profile.bride_instagram}`}
                </a>
              )}
            </article>
          </div>
        </section>

        {/* ── Countdown ────────────────────────────────────────── */}
        {(profile.estimated_wedding_date || main?.date) && (
          <section className="lc-panel lc-countdown" data-section="countdown">
            <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
            <span className="lc-bows" style={bandStyle(ART_BOWS)} aria-hidden="true" />
            <div className="lc-panel__body" data-lc-reveal>
              <h2 className="lc-display lc-panel__title">Countdown</h2>
              <CountdownClock iso={profile.estimated_wedding_date} sessions={profile.sessions} />
              {calendarUrl && (
                <a className="lc-link lc-link--light" href={calendarUrl} target="_blank" rel="noreferrer">
                  Add to calendar
                </a>
              )}
            </div>
            <span className="lc-band lc-band--bottom" style={bandStyle(ART_BORDER)} aria-hidden="true" />
          </section>
        )}

        {/* ── The events (akad / resepsi) ──────────────────────── */}
        {events.length > 0 && (
          <section className="lc-section lc-events" data-section="events">
            <div className="lc-wrap lc-events__head" data-lc-reveal>
              <h2 className="lc-display lc-heading">The Celebration</h2>
              <p className="lc-body lc-events__intro">
                {tc.events_intro || DEFAULT_EVENTS_INTRO}
              </p>
            </div>

            <div className="lc-wrap lc-events__list">
              {events.map((event, index) => {
                const eventMaps =
                  event.maps_url ||
                  (event.venue || event.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [event.venue, event.address].filter(Boolean).join(", ")
                      )}`
                    : "")
                return (
                  <article className="lc-event" key={`${event.name || "event"}-${index}`} data-lc-reveal>
                    {/* The reference's "Where to Stay" card: lace bow over an oval
                        medallion, cut-corner plate below. The medallion carries
                        the event number instead of a hotel's. */}
                    <span className="lc-event__ornament" aria-hidden="true">
                      <img src={ART_CARD} alt="" loading="lazy" />
                      <b>{ROMAN[index] || String(index + 1)}</b>
                    </span>

                    <div className="lc-event__card">
                      <div className="lc-event__frame">
                        <h3 className="lc-display lc-event__name">{event.name || "Wedding Event"}</h3>
                        <p className="lc-event__when">
                          {longDate(event.date) && <span>{longDate(event.date)}</span>}
                          {event.time && <span>{event.time}</span>}
                        </p>
                        {event.venue && <p className="lc-display lc-event__venue">{event.venue}</p>}
                        {event.address && <p className="lc-body lc-event__address">{event.address}</p>}
                        {eventMaps && (
                          <div className="lc-event__actions">
                            <a className="lc-pill lc-pill--sm" href={eventMaps} target="_blank" rel="noreferrer">
                              Get directions
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ── The Day ──────────────────────────────────────────── */}
        {rundown.length > 0 && (
          <section className="lc-section lc-day" data-section="day">
            <div className="lc-garland" aria-hidden="true">
              <span className="lc-garland__base" style={bandStyle(ART_GARLAND)} />
              {ART_GARLAND_STRANDS.map((strand, index) => (
                <span
                  className="lc-garland__strand"
                  key={strand}
                  style={{ ...bandStyle(strand), ["--lc-strand" as string]: index } as CSSProperties}
                />
              ))}
            </div>
            <div className="lc-wrap lc-day__head" data-lc-reveal>
              <h2 className="lc-display lc-heading">{tc.rundown_title || "The Day"}</h2>
              {tc.rundown_intro && <p className="lc-body lc-day__intro">{tc.rundown_intro}</p>}
            </div>
            <ol className="lc-wrap lc-day__list">
              {rundown.map((item, index) => (
                <li className="lc-day__row" key={`${item.time || "row"}-${index}`} data-lc-reveal>
                  <figure className="lc-day__art">
                    <img src={stepArt(index, rundown.length)} alt="" aria-hidden="true" loading="lazy" />
                  </figure>
                  <span className="lc-day__time">{item.time || ""}</span>
                  <span className="lc-day__thread" aria-hidden="true">
                    <i />
                  </span>
                  <p className="lc-day__text">{item.description || ""}</p>
                </li>
              ))}
            </ol>
            <img className="lc-day__table" src={ART_TABLE} alt="" aria-hidden="true" loading="lazy" />
          </section>
        )}

        {/* ── Dress code ───────────────────────────────────────── */}
        {hasDresscode && (
          <section className="lc-section lc-dress" data-section="dresscode">
            <span className="lc-dress__pearls lc-dress__pearls--left" style={bandStyle(ART_PEARLS)} aria-hidden="true" />
            <span className="lc-dress__pearls lc-dress__pearls--right" style={bandStyle(ART_PEARLS)} aria-hidden="true" />
            <div className="lc-dress__frame" data-lc-reveal>
              <span className="lc-dress__art" style={bandStyle(ART_DRESS_FRAME)} aria-hidden="true" />
              <div className="lc-dress__inner">
                <h2 className="lc-display lc-heading">Dress Code</h2>
                <p className="lc-display lc-dress__title">{profile.dresscode?.title || "Formal Attire"}</p>
                <img className="lc-dress__couple" src={ART_DRESS_COUPLE} alt="" aria-hidden="true" loading="lazy" />
                {profile.dresscode?.description && (
                  <p className="lc-body lc-dress__note">{profile.dresscode.description}</p>
                )}
                <div className="lc-swatches" aria-label="Dress code palette">
                  {dressColors.map((color, index) => (
                    <span className="lc-swatch" key={`${color.hex || color.name}-${index}`}>
                      <i style={{ ["--lc-swatch" as string]: color.hex || "#ccc" } as CSSProperties} aria-hidden="true" />
                      {color.name && <em>{color.name}</em>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── With Honor (the reference's Transportation slot) ─────── */}
        {honored.length > 0 && (
          <section className="lc-panel lc-honored" data-section="inviting">
            <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
            <div className="lc-panel__body lc-honored__body" data-lc-reveal>
              <h2 className="lc-display lc-panel__title lc-honored__title">With Honor</h2>
              {tc.inviting_intro !== "" && (
                <p className="lc-body lc-honored__intro">{tc.inviting_intro || DEFAULT_INVITING}</p>
              )}
              <ul className="lc-honored__list">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </div>
            <span className="lc-band lc-band--bottom" style={bandStyle(ART_BORDER)} aria-hidden="true" />
          </section>
        )}

        {/* ── Our Story ────────────────────────────────────────── */}
        {stories.length > 0 && (
          <section className="lc-section lc-story" data-section="story">
            <div className="lc-wrap lc-story__head" data-lc-reveal>
              <h2 className="lc-display lc-heading">{tc.love_story_title || "How Our Story Began"}</h2>
              {tc.story_intro && <p className="lc-body lc-story__intro">{tc.story_intro}</p>}
            </div>
            <ol className="lc-wrap lc-story__list">
              {stories.map((story, index) => {
                const label = (story.year || "").trim() || pad2(index + 1)
                return (
                  <li
                    className={`lc-story__chapter${story.image_url ? "" : " lc-story__chapter--note"}`}
                    key={`${story.title || "chapter"}-${index}`}
                    data-lc-reveal
                  >
                    {index > 0 && (
                      <span className="lc-story__seam" aria-hidden="true">
                        <i />
                      </span>
                    )}
                    {story.image_url && (
                      <figure className="lc-story__photo">
                        <img src={story.image_url} alt="" loading="lazy" />
                      </figure>
                    )}
                    <div className="lc-story__text">
                      <p className="lc-story__label">{label}</p>
                      {story.title && <h3 className="lc-display lc-story__title">{story.title}</h3>}
                      {story.description && <p className="lc-body lc-story__desc">{story.description}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* ── Gallery ──────────────────────────────────────────── */}
        {galleryPhotos.length > 0 && (
          <section className="lc-section lc-gallery" data-section="gallery">
            <span className="lc-band lc-band--lead lc-gallery__band" style={bandStyle(ART_BAND)} aria-hidden="true" />
            <div className="lc-wrap lc-gallery__head" data-lc-reveal>
              <h2 className="lc-display lc-heading">{tc.gallery_title || t("secGallery", lang)}</h2>
              {tc.gallery_intro && <p className="lc-body lc-gallery__intro">{tc.gallery_intro}</p>}
            </div>
            <div className="lc-wrap lc-gallery__grid">
              {galleryPhotos.map((url, index) => (
                <figure className="lc-gallery__tile" key={`${url}-${index}`} data-lc-reveal>
                  <img src={url} alt="" loading="lazy" />
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Wedding film ─────────────────────────────────────── */}
        {hasFilm && (
          <section className="lc-panel lc-film" data-section="video">
            <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
            <div className="lc-panel__body lc-film__body" data-lc-reveal>
              <h2 className="lc-display lc-panel__title">{tc.video_title || "Our Film"}</h2>
              {tc.video_intro && <p className="lc-body lc-film__intro">{tc.video_intro}</p>}
              <div className="lc-film__window">
                {film!.kind === "file" ? (
                  <video
                    src={film!.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                  />
                ) : (
                  <iframe
                    src={film!.src}
                    title={tc.video_title || "Our Film"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
              </div>
              {tc.video_caption && <p className="lc-film__caption">{tc.video_caption}</p>}
            </div>
            <span className="lc-band lc-band--bottom" style={bandStyle(ART_BORDER)} aria-hidden="true" />
          </section>
        )}

        {/* ── Gifts ────────────────────────────────────────────── */}
        {hasGift && (
          <section className="lc-section lc-gift" data-section="gift">
            <div className="lc-wrap lc-gift__body" data-lc-reveal>
              <h2 className="lc-display lc-heading lc-gift__heading">
                {tc.gift_intro_title || t("secGift", lang)}
              </h2>
              <div className="lc-gift__panel">
                <span className="lc-gift__lace" style={bandStyle(ART_PANEL)} aria-hidden="true" />
                <div className="lc-gift__inner">
                  <p className="lc-display lc-gift__lead">Your presence is our greatest gift.</p>
                  <p className="lc-body lc-gift__intro">
                    {tc.gift_intro_description ||
                      "Should you wish to give a gift, you may do so in cash or by bank transfer."}
                  </p>

                  {accounts.length > 0 && (
                    <ul className="lc-accounts">
                      {accounts.map((account, index) => {
                        const open = openAccount === index
                        return (
                          <li className={`lc-account${open ? " is-open" : ""}`} key={`${account.account_number || "acc"}-${index}`}>
                            <button
                              type="button"
                              className="lc-account__head"
                              aria-expanded={open}
                              onClick={() => setOpenAccount(open ? -1 : index)}
                            >
                              <span className="lc-account__bank">{account.provider_name || "Bank"}</span>
                              <svg className="lc-account__chev" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M6 9.5 12 15l6-5.5" />
                              </svg>
                            </button>
                            <div className="lc-account__panel">
                              <div className="lc-account__inner">
                                {account.account_number && (
                                  <p className="lc-account__number">{account.account_number}</p>
                                )}
                                {account.account_name && <p className="lc-account__name">{account.account_name}</p>}
                                {account.account_number && (
                                  <button
                                    type="button"
                                    className="lc-link"
                                    onClick={() => copyText(account.account_number)}
                                  >
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
                    <div className="lc-address">
                      {profile.gift_address_name && <p className="lc-address__name">{profile.gift_address_name}</p>}
                      <p className="lc-address__text">{giftAddress}</p>
                      <button type="button" className="lc-link" onClick={() => copyText(giftAddress)}>
                        Copy address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Wishes (RSVP + the wish feed) ─────────────────────── */}
        <section className="lc-panel lc-wishes" data-section="wishes">
          <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
          <div className="lc-panel__body lc-wishes__body" data-lc-reveal>
            <WishesHeart className="lc-wishes__mark" />
            <h2 className="lc-display lc-panel__title">Wishes</h2>
            <p className="lc-body lc-wishes__intro">
              {tc.wishes_intro ||
                "Nothing would make us happier than celebrating this day surrounded by the people we love. Leave us a wish and let us know you are coming."}
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

        {/* ── Closing ──────────────────────────────────────────── */}
        <section className="lc-closing" data-section="closing">
          {closingBackdrop ? (
            <>
              <span
                className="lc-closing__bg"
                style={bandStyle(closingBackdrop)}
                aria-hidden="true"
              />
              <span className="lc-closing__bgveil" aria-hidden="true" />
            </>
          ) : (
            <span className="lc-closing__art" style={bandStyle(ART_BALCONY)} aria-hidden="true" />
          )}
          <div className="lc-wrap lc-closing__body" data-lc-reveal>
            <p className="lc-display lc-closing__lead">We cannot wait to celebrate with you.</p>
            <p className="lc-script lc-closing__names">{coupleLabel}</p>

            {closingStrip && (
              <div className="lc-closing__strip" aria-hidden="true">
                <div className="lc-closing__track">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <img key={index} src={closingStrip} alt="" loading="lazy" draggable={false} />
                  ))}
                </div>
              </div>
            )}

            <footer className="tpl-footer">
              <a
                className="tpl-footer__link"
                href={waHref}
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

      {/* ── Sealed cover ─────────────────────────────────────────── */}
      <div
        className={`lc-gate${opening ? " is-opening" : ""}${fading ? " is-fading" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
        onClick={openGate}
      >
        <div className="lc-gate__card">
          <div className="lc-gate__stage">
            {/* Sealed first frame — what the guest sees before the tap, and the
                stand-in if the film cannot load. */}
            <img className="lc-gate__poster" src={ART_SEALED} alt="" />
            {/* The reference's opening film: the tulle lifts, the veil clears. */}
            <video
              ref={gateFilmRef}
              className="lc-gate__film"
              src={ART_OPENING}
              poster={ART_SEALED}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
            {/* The film ships with the reference couple's seal painted in at
                centre. It is not a DOM element, so it can only be covered,
                this plaque rides the film's clock with it. */}
            <span className="lc-gate__seal" ref={sealRef}>
              <SealPlaque text={sealText} />
            </span>
          </div>
        </div>

        {/* Same badge as the adat family's video spinner: a small circular
            indicator in the corner, so the gate never reads as a status bar. */}
        {buffering && (
          <span className="lc-gate__buffer" role="status" aria-label="Memuat video">
            <span className="lc-gate__buffer-ring" aria-hidden="true" />
          </span>
        )}

        <div className="lc-gate__foot">
          <p className="lc-gate__guest">
            <span>Dear,</span>
            <strong>{guestName}</strong>
          </p>
          <button type="button" className="lc-gate__open" onClick={openGate}>
            <span>Open the Invitation</span>
          </button>
          <span className="lc-gate__signature">Wedding by Aksaraa</span>
        </div>
      </div>

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
          bottom={88}
        />
      )}

      {toast && (
        <div className="lc-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
