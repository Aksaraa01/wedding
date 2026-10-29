"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, gcalLink, initialsOf } from "../shared/lib"
import Wishes from "./Wishes"
import "./lace.css"

// Art shipped with the template. Decorative surfaces only — never couple data.
const A = (name: string) => `/templates/lace/${name}`
const ART_SEALED = A("cover-sealed.jpg")
const COVER_FILM = A("cover-film.mp4")
const ART_FRAME = A("cover-frame.webp")
const ART_VILLA = A("villa.svg")
const ART_BAND = A("band-lace.webp")
const ART_BORDER = A("band-border.webp")
const ART_PANEL = A("panel-lace.webp")
const ART_BOWS = A("bow-frame.webp")
const ART_OVAL = A("oval-location.webp")
const ART_DRESS_FRAME = A("dress-frame.webp")
const ART_DRESS_COUPLE = A("dress-couple.webp")
const ART_TULLE = A("tulle.webp")
const ART_BALCONY = A("balcony.webp")
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
const DEFAULT_LOCATION =
  "We look forward to welcoming you to the place where we will say our vows."
const DEFAULT_INVITING =
  "Together with the families who share this invitation."
const DEFAULT_CLOSING =
  "We cannot wait to celebrate with you. Thank you for the love and the prayers you have given us along the way."

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

export default function Lace(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gateRef = useRef(false)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [opening, setOpening] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [openAccount, setOpenAccount] = useState(-1)
  const [toast, setToast] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const sessions = (profile.sessions || []).filter(Boolean)
  const main = sessions[0]
  const venue = main?.venue?.trim() || ""
  const address = main?.address?.trim() || ""

  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
      : []
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((i) => i && (i.time || i.description))
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const groom = profile.groom_name || "The Groom"
  const bride = profile.bride_name || "The Bride"
  const coupleLabel = [groom, bride].join(" & ")
  const initials = initialsOf(profile.groom_name, profile.bride_name)
  const sealText = initials.length === 2 ? `${initials[0]} & ${initials[1]}` : initials || "A & E"
  const guestName = profile.guest_name || "Tamu Undangan"
  const dateDot = formatDotDate(profile.estimated_wedding_date || main?.date)
  const dateLong = longDate(profile.estimated_wedding_date || main?.date)
  const welcomeMessage = tc.welcome_message || DEFAULT_WELCOME
  const closingMessage = tc.closing_message || DEFAULT_CLOSING

  const mapsHref =
    main?.maps_url ||
    (venue || address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(", "))}`
      : "")
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

  // The wax seal is the tap: it lifts, the frame film plays, and the invitation
  // is handed over when it finishes (or after a hard cap, so a stalled download
  // can never trap the guest).
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
    const reveal = () => {
      setOpened(true)
      window.scrollTo(0, 0)
    }
    const video = videoRef.current
    if (video && !reduced) {
      const cap = window.setTimeout(reveal, 4_500)
      video.addEventListener(
        "ended",
        () => {
          window.clearTimeout(cap)
          reveal()
        },
        { once: true }
      )
      video.play().catch(() => {
        window.clearTimeout(cap)
        window.setTimeout(reveal, 900)
      })
      return
    }
    window.setTimeout(reveal, reduced ? 120 : 900)
  }, [hasTrack])

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
            <div className="lc-cover__body">
              <p className="lc-kicker">{tc.cover_kicker || "Together with their families"}</p>
              <h1 className="lc-cover__names">
                <span>{groom}</span>
                <em>&amp;</em>
                <span>{bride}</span>
              </h1>
              {dateDot && <p className="lc-cover__date">{dateDot}</p>}
              <img className="lc-cover__villa" src={ART_VILLA} alt="" aria-hidden="true" />
              {venue && <p className="lc-cover__venue">{venue}</p>}              {address && <p className="lc-cover__city">{address}</p>}
            </div>
          </div>
        </section>

        {/* ── Welcome ──────────────────────────────────────────── */}
        <section className="lc-section lc-welcome" data-section="welcome">
          <span className="lc-band lc-band--lead" style={bandStyle(ART_BAND)} aria-hidden="true" />
          <div className="lc-wrap lc-welcome__body" data-lc-reveal>
            <img className="lc-welcome__art" src={STEP_CORE[0]} alt="" aria-hidden="true" loading="lazy" />
            <h2 className="lc-display lc-welcome__title">
              {tc.welcome_invite || "Together with their families"}
            </h2>
            <p className="lc-body lc-welcome__message">{welcomeMessage}</p>
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

        {/* ── Location ─────────────────────────────────────────── */}
        {(venue || address) && (
          <section className="lc-section lc-location" data-section="location">
            <div className="lc-wrap lc-location__body" data-lc-reveal>
              <h2 className="lc-display lc-heading">Location</h2>
              {venue && <p className="lc-script lc-location__venue">{venue}</p>}
              {address && <p className="lc-location__city">{address}</p>}
              <p className="lc-body lc-location__intro">{tc.location_intro || DEFAULT_LOCATION}</p>
              <img className="lc-location__oval" src={ART_OVAL} alt="" aria-hidden="true" loading="lazy" />
              {mapsHref && (
                <a className="lc-pill" href={mapsHref} target="_blank" rel="noreferrer">
                  Get directions
                </a>
              )}
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

        {/* ── Turut Mengundang (the reference's Transportation slot) ── */}
        {honored.length > 0 && (
          <section className="lc-panel lc-honored" data-section="inviting">
            <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
            <div className="lc-panel__body lc-honored__body" data-lc-reveal>
              <h2 className="lc-display lc-panel__title lc-honored__title">Turut Mengundang</h2>
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

        {/* ── Gifts ────────────────────────────────────────────── */}
        {hasGift && (
          <section className="lc-section lc-gift" data-section="gift">
            <div className="lc-wrap lc-gift__body" data-lc-reveal>
              <h2 className="lc-display lc-heading lc-gift__heading">
                {tc.gift_intro_title || "Wedding Gift"}
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

        {/* ── RSVP & wishes ────────────────────────────────────── */}
        <section className="lc-panel lc-wishes" data-section="wishes">
          <span className="lc-band lc-band--top" style={bandStyle(ART_BAND)} aria-hidden="true" />
          <div className="lc-panel__body lc-wishes__body" data-lc-reveal>
            <h2 className="lc-display lc-panel__title">RSVP</h2>
            <p className="lc-body lc-wishes__intro">
              {tc.wishes_intro || "Nothing would make us happier than celebrating this day surrounded by you."}
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

        {/* ── Closing ──────────────────────────────────────────── */}
        <section className="lc-closing" data-section="closing">
          <span className="lc-closing__art" style={bandStyle(ART_BALCONY)} aria-hidden="true" />
          <div className="lc-wrap lc-closing__body" data-lc-reveal>
            <p className="lc-display lc-closing__lead">We cannot wait to celebrate with you.</p>
            <p className="lc-body lc-closing__message">{closingMessage}</p>
            <p className="lc-script lc-closing__names">{coupleLabel}</p>
            {dateLong && <p className="lc-closing__date">{dateLong}</p>}

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
        className={`lc-gate${opening ? " is-opening" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
        onClick={openGate}
      >
        <div className="lc-gate__card">
          <div className="lc-gate__stage">
            <img className="lc-gate__sealed" src={ART_SEALED} alt="" />
            <video
              ref={videoRef}
              className="lc-gate__film"
              src={COVER_FILM}
              poster={ART_FRAME}
              muted
              playsInline
              preload="metadata"
            />
            <span className="lc-gate__seal">
              <SealPlaque text={sealText} />
            </span>
          </div>
        </div>

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
