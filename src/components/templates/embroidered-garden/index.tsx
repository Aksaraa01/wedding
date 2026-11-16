"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, coverPhoto as coverSlotPhoto, flattenPhotos, gcalLink, initialsOf, monogramFontSize, videoSource } from "../shared/lib"
import Wishes from "./Wishes"
import "./embroidered-garden.css"

// Art shipped with the template. These are decorative surfaces only — never
// couple data. Photo slots come from the profile.
const A = (name: string) => `/templates/embroidered-garden/${name}`
const ART_SWANS = A("welcome-swans.webp")
const ART_COUNTDOWN_FRAME = A("countdown-frame.webp")
const ART_COUNTDOWN_MEDALLION = A("countdown-medallion.webp")
const ART_CEREMONY_FRAME = A("ceremony-bg.webp")
const ART_DRESSCODE_GARLAND = A("dresscode-garland.webp")
const ART_DRESSCODE_GUESTS = A("dresscode-guests.webp")
const ART_STORY_FRAME = A("story-frame.webp")
const ART_PEARL = A("timeline-pearl.webp")
const ART_GARLAND = A("garland-divider.webp")
const ART_GIFT_FRAME = A("gift-frame.webp")
const ART_RSVP_ENVELOPE = A("rsvp-envelope.webp")
const ART_RSVP_TOPIARY = A("rsvp-topiary.webp")
const ART_CLOSING = A("closing-chateau.webp")
const ART_DOOR_POSTER = A("cover-door-poster.webp")
// The film was re-muxed with `moov` before `mdat` (scripts/mp4-faststart.mjs):
// the bytes are identical, but the browser can now start playing after the
// first few hundred KB instead of waiting for the whole file. `?v=2` busts the
// week-long cache that otherwise keeps the old, non-faststart file.
const DOOR_FILM = `${A("cover-door.mp4")}?v=2`
// Rundown rows get one illustration each. The first and last rows always use
// the champagne vignette (the client wants 1 & 5 to match); rows in between
// cycle the three middle vignettes, so a list longer than five repeats them in
// a predictable order instead of running out of artwork.
const ART_RUNDOWN_END = A("timeline-5.webp")
const ART_RUNDOWN_CYCLE = [A("timeline-2.webp"), A("timeline-3.webp"), A("timeline-4.webp")]

function rundownArt(index: number, total: number): string {
  if (total < 2 || index === 0 || index === total - 1) return ART_RUNDOWN_END
  return ART_RUNDOWN_CYCLE[(index - 1) % ART_RUNDOWN_CYCLE.length]
}

const MEDALLION_TRACK: { t: number; cx: number; w: number; h: number }[] = [
  { t: 0.0, cx: 50.7, w: 36.5, h: 28.8 },
  { t: 0.4, cx: 51.8, w: 36.6, h: 29.0 },
  { t: 0.8, cx: 53.8, w: 36.5, h: 29.7 },
  { t: 1.2, cx: 56.3, w: 36.2, h: 30.1 },
  { t: 1.6, cx: 58.9, w: 36.5, h: 30.7 },
  { t: 2.0, cx: 63.3, w: 34.9, h: 30.7 },
  { t: 2.4, cx: 67.7, w: 33.9, h: 31.3 },
  // From here the door swings away from camera, so the medallion accelerates
  // out of frame. These centres were measured frame by frame on the film
  // (2.8s → 74.4%, 3.2s → 81.3%, 3.6s → 90.0%, 4.0s → 100.0%): the old
  // 10.5%/s drift could not keep up and let the baked-on reference initials
  // peek out from under the plaque.
  { t: 2.8, cx: 74.4, w: 33.2, h: 31.7 },
  { t: 3.0, cx: 77.9, w: 32.9, h: 31.9 },
  { t: 3.2, cx: 81.3, w: 32.5, h: 32.1 },
  { t: 3.4, cx: 85.2, w: 32.2, h: 32.3 },
  { t: 3.6, cx: 90.0, w: 31.9, h: 32.4 },
  { t: 3.8, cx: 95.3, w: 31.6, h: 32.5 },
  { t: 4.0, cx: 100.0, w: 31.3, h: 32.6 },
  { t: 4.2, cx: 104.5, w: 31.0, h: 32.7 },
  { t: 4.4, cx: 109.0, w: 30.7, h: 32.8 },
]

// The cream curtain is painted into the film, so the names cannot sit "behind"
// it in the DOM — they are clipped to the gap the curtains actually open. These
// are the measured inner edges of that gap as a percentage of the film width,
// at the top (30%) and bottom (43%) of the names' band, sampled every 0.4s.
// The clip is a hair inside the pearl trim, so the copy never spills onto the
// fabric, and the reveal follows the real opening instead of a timer.
const CURTAIN_GAP: { t: number; lt: number; rt: number; lb: number; rb: number }[] = [
  { t: 0.0, lt: 50, rt: 50, lb: 50, rb: 50 },
  { t: 5.4, lt: 50, rt: 50, lb: 50, rb: 50 },
  { t: 5.8, lt: 46.2, rt: 53.1, lb: 45.6, rb: 54.6 },
  { t: 6.2, lt: 42.7, rt: 56.2, lb: 41.6, rb: 58.8 },
  { t: 6.6, lt: 38.2, rt: 60.0, lb: 36.6, rb: 63.6 },
  { t: 7.0, lt: 34.3, rt: 64.2, lb: 32.0, rb: 68.2 },
  { t: 7.4, lt: 30.8, rt: 67.6, lb: 27.8, rb: 72.3 },
  { t: 7.8, lt: 27.2, rt: 70.7, lb: 23.7, rb: 76.1 },
  { t: 8.2, lt: 24.6, rt: 72.9, lb: 20.2, rb: 78.1 },
  { t: 8.6, lt: 22.8, rt: 74.7, lb: 19.8, rb: 79.1 },
  { t: 9.0, lt: 21.6, rt: 75.8, lb: 18.9, rb: 80.1 },
  { t: 9.4, lt: 21.4, rt: 76.3, lb: 17.9, rb: 80.9 },
  { t: 10.3, lt: 21.4, rt: 76.3, lb: 17.9, rb: 80.9 },
]

function curtainGapAt(time: number) {
  const first = CURTAIN_GAP[0]
  if (time <= first.t) return first
  const last = CURTAIN_GAP[CURTAIN_GAP.length - 1]
  if (time >= last.t) return last
  for (let i = 1; i < CURTAIN_GAP.length; i++) {
    const b = CURTAIN_GAP[i]
    if (time > b.t) continue
    const a = CURTAIN_GAP[i - 1]
    const k = (time - a.t) / (b.t - a.t)
    return {
      t: time,
      lt: a.lt + (b.lt - a.lt) * k,
      rt: a.rt + (b.rt - a.rt) * k,
      lb: a.lb + (b.lb - a.lb) * k,
      rb: a.rb + (b.rb - a.rb) * k,
    }
  }
  return last
}

function medallionAt(time: number) {
  const first = MEDALLION_TRACK[0]
  if (time <= first.t) return first
  const last = MEDALLION_TRACK[MEDALLION_TRACK.length - 1]
  if (time >= last.t) {
    // Keep drifting off to the right once the sampling window ends.
    const drift = (time - last.t) * 30
    return { t: time, cx: last.cx + drift, w: last.w, h: last.h }
  }
  for (let i = 1; i < MEDALLION_TRACK.length; i++) {
    const b = MEDALLION_TRACK[i]
    if (time > b.t) continue
    const a = MEDALLION_TRACK[i - 1]
    const k = (time - a.t) / (b.t - a.t)
    return {
      t: time,
      cx: a.cx + (b.cx - a.cx) * k,
      w: a.w + (b.w - a.w) * k,
      h: a.h + (b.h - a.h) * k,
    }
  }
  return last
}

const DEFAULT_WELCOME =
  "We are so happy to celebrate this day with you, surrounded by the people we love most."
const DEFAULT_CLOSING =
  "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say."

const pad2 = (n: number) => String(n).padStart(2, "0")

// The invitation copy is English throughout (the reference ships in French), so
// dates are formatted here rather than through the Indonesian helper.
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function longDate(value?: string | null): string {
  if (!value) return ""
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  if (isNaN(d.getTime())) return ""
  return `${EN_DAYS[d.getDay()]}, ${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
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

// The seconds tick is isolated so it never reconciles the whole invitation.
function CountdownClock({ iso, sessions }: { iso?: string; sessions?: TemplateProps["sessions"] }) {
  const c = useCountdown(iso, sessions)
  return (
    <div className="eg-clock" aria-label="Wedding countdown">
      <div className="eg-clock__dial">
        <img src={ART_COUNTDOWN_MEDALLION} alt="" aria-hidden="true" loading="lazy" />
        <strong>{c?.d ?? "00"}</strong>
        <span>Days</span>
      </div>
      <div className="eg-clock__dial">
        <img src={ART_COUNTDOWN_MEDALLION} alt="" aria-hidden="true" loading="lazy" />
        <strong>{c?.h ?? "00"}</strong>
        <span>Hours</span>
      </div>
      <div className="eg-clock__dial">
        <img src={ART_COUNTDOWN_MEDALLION} alt="" aria-hidden="true" loading="lazy" />
        <strong>{c?.m ?? "00"}</strong>
        <span>Minutes</span>
      </div>
      <div className="eg-clock__dial eg-clock__dial--seconds">
        <img src={ART_COUNTDOWN_MEDALLION} alt="" aria-hidden="true" loading="lazy" />
        <strong>{c?.s ?? "00"}</strong>
        <span>Seconds</span>
      </div>
    </div>
  )
}

// Baroque cartouche drawn over the monogram baked into the door film. The
// silhouette is generated, not hand-traced: a lobed ellipse whose radius is
// modulated six times around the ring (a scalloped medallion), sampled through
// a Catmull-Rom spline so it stays perfectly symmetric at any size.
function cartouchePath(cx: number, cy: number, rx: number, ry: number, lobes = 6, amp = 0.045, steps = 36): string {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2
    const k = 1 + amp * Math.cos(lobes * (a + Math.PI / 2))
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k })
  }
  // Catmull-Rom → cubic Bézier, closed.
  const f = (n: number) => n.toFixed(2)
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const p3 = pts[(i + 2) % pts.length]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2.x)},${f(p2.y)}`
  }
  return `${d}Z`
}

const CARTOUCHE_OUTER = cartouchePath(100, 140, 92, 132, 6, 0.05)
const CARTOUCHE_INNER = cartouchePath(100, 140, 84, 124, 6, 0.04)

function DoorCartouche({ initials }: { initials: string }) {
  return (
    <svg className="eg-cartouche" viewBox="0 0 200 280" role="presentation" aria-hidden="true">
      <defs>
        <radialGradient id="eg-cartouche-fill" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#fdf9f1" />
          <stop offset="62%" stopColor="#f8f0e1" />
          <stop offset="100%" stopColor="#f2e8d4" />
        </radialGradient>
        <linearGradient id="eg-cartouche-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9b878" />
          <stop offset="45%" stopColor="#bd9150" />
          <stop offset="100%" stopColor="#d3ad6c" />
        </linearGradient>
        <filter id="eg-cartouche-shadow" x="-25%" y="-18%" width="150%" height="148%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1d2b23" floodOpacity="0.22" />
        </filter>
      </defs>

      <g filter="url(#eg-cartouche-shadow)">
        <path d={CARTOUCHE_OUTER} fill="url(#eg-cartouche-fill)" stroke="url(#eg-cartouche-gold)" strokeWidth="2.1" />
        <path d={CARTOUCHE_INNER} fill="none" stroke="url(#eg-cartouche-gold)" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Pearl finials, as on the reference medallion. */}
      <g fill="#fdfaf3" stroke="#cbbfa9" strokeWidth="0.7">
        <circle cx="94" cy="26" r="3" />
        <circle cx="100" cy="21" r="3.6" />
        <circle cx="106" cy="26" r="3" />
        <circle cx="94" cy="254" r="3" />
        <circle cx="100" cy="259" r="3.6" />
        <circle cx="106" cy="254" r="3" />
      </g>

      <text
        x="100"
        y="153"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Playfair Display', serif"
        fontSize={monogramFontSize(initials, 50)}
        fontWeight={500}
        letterSpacing={initials.length > 2 ? 2 : 5}
        fill="#b3893f"
      >
        {initials}
      </text>
    </svg>
  )
}

export default function EmbroideredGarden(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const plaqueRef = useRef<HTMLSpanElement | null>(null)
  const veilRef = useRef<HTMLDivElement | null>(null)
  const gateRef = useRef(false)
  const toastTimer = useRef<number | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)

  const [opened, setOpened] = useState(false)
  const [opening, setOpening] = useState(false)
  const [namesIn, setNamesIn] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [saveData, setSaveData] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null)
  const [giftTab, setGiftTab] = useState<"accounts" | "address">("accounts")
  const [openAccount, setOpenAccount] = useState(-1)

  // Only one account may be open at a time, and switching tabs closes them.
  useEffect(() => {
    setOpenAccount(-1)
  }, [giftTab])
  const [toast, setToast] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = flattenPhotos(profile.cover_photos)
  // The cover is the embroidered door film shipped with the template, exactly
  // as the reference uses it — a couple photo never replaces it. Slot 1 is the
  // closing portrait; `cover` only feeds photo fallbacks.
  const closingSlot = slots[0] || ""
  const cover = coverSlotPhoto(profile)
  const closingPhoto = closingSlot || ""
  const groomPhoto = flattenPhotos(profile.groom_photo_url)[0] || cover
  const bridePhoto = flattenPhotos(profile.bride_photo_url)[0] || cover

  // Love story: package gate AND the couple's own toggle, then drop milestones
  // that carry nothing at all so an empty list never renders an orphan heading.
  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url))
      : []
  const events = (profile.sessions || []).filter(Boolean)
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
  const giftTabs = accounts.length > 0 && !!giftAddress

  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || "The Wedding"
  const monogram = (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "A&E"
  const guestName = profile.guest_name || "Tamu Undangan"
  const dateLong = longDate(profile.estimated_wedding_date)
  // The couple's "kalimat pembuka" — the greeting / doa they write once for
  // every template. It belongs to the mempelai block (the cover carries only
  // names and date), with `welcome_message` as the fallback for invitations
  // authored before this mapping existed.
  const welcomeMessage =
    (profile.opening_description || "").trim() || tc.welcome_message || DEFAULT_WELCOME
  const openingTitle = (profile.opening_title || "").trim() || "Together with their families"
  const closingMessage = tc.closing_message || DEFAULT_CLOSING
  const calendarUrl = gcalLink(events[0], profile.groom_name || "", profile.bride_name || "")

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  const musicStart = Math.max(0, Number(tc.music_start_seconds ?? 0) || 0)
  const musicEnd =
    tc.music_end_seconds == null || tc.music_end_seconds === "" ? null : Number(tc.music_end_seconds)

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  // The cover is a pair of doors: the film only starts on the tap that opens the
  // invitation, and the invitation is revealed when the film reaches its own
  // end. The reveal follows the *media* clock, never a wall-clock cap — a fixed
  // timeout used to cut the last seconds whenever the download ran behind
  // playback. The watchdog below only rescues a stream that has stopped moving.
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
    if (!video || reduced) {
      setNamesIn(true)
      window.setTimeout(reveal, reduced ? 120 : 1200)
      return
    }

    // A data-saver request is an explicit choice: keep the poster and hand
    // over. `effectiveType` alone is only a hint (several browsers report it
    // wrongly), so a 2G report just shortens the first-frame budget below.
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    if (conn?.saveData) {
      setNamesIn(true)
      window.setTimeout(reveal, 800)
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
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("stalled", onWaiting)
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("ended", finish)
      video.removeEventListener("error", onError)
      teardownRef.current = null
    }

    const finish = () => {
      if (done) return
      done = true
      cleanup()
      setBuffering(false)
      reveal()
    }

    const onPlaying = () => {
      started = true
      lastTime = video.currentTime
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
      // Ignore the tick that a stalled video emits at t=0: it is not playback.
      if (!started && (!video.paused || video.currentTime > 0)) onPlaying()
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime
        lastAdvanceAt = Date.now()
      }
      // `ended` is the normal exit; this catches the streams where the event is
      // swallowed after a stalled range request.
      const duration = video.duration
      if (Number.isFinite(duration) && duration > 0 && duration - video.currentTime <= 0.15) {
        finish()
      }
    }

    const onError = () => {
      // No film: the names are the only cover copy left, so show them now.
      setNamesIn(true)
      window.setTimeout(finish, 800)
    }

    video.addEventListener("playing", onPlaying)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("stalled", onWaiting)
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("ended", finish)
    video.addEventListener("error", onError)
    teardownRef.current = cleanup

    // The first frame is what the guest is waiting for after the tap.
    if (video.readyState < 3) setBuffering(true)

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

    video.play().catch(() => {
      setNamesIn(true)
      window.setTimeout(finish, 800)
    })
  }, [hasTrack])

  // Only an explicit data-saver request suppresses the preload. `effectiveType`
  // is not trustworthy (browsers report 2G on fast links), and demoting to
  // `metadata` is what made a 3G guest wait at the gate instead of pressing play.
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) setSaveData(true)
  }, [])

  // Never leave the interval/listeners behind if the preview unmounts mid-film.
  useEffect(() => {
    return () => {
      teardownRef.current?.()
    }
  }, [])

  // The monogram is painted into the film and travels with the right-hand door
  // as it swings. Ride the video's own clock so our cartouche stays glued to
  // that spot instead of sitting still and fading like a sticker.
  //
  // The clock has to be the *presented* frame, not `currentTime`: while the
  // 2.4 MB film buffers the two diverge, the cover slides ahead of the doors and
  // the reference initials under it are exposed. requestVideoFrameCallback
  // reports the frame actually on screen; without it we fall back to
  // currentTime, which is exact on a fully buffered film.
  useEffect(() => {
    if (!opening) return
    const plaque = plaqueRef.current
    const veil = veilRef.current
    const video = videoRef.current
    if (!plaque) return
    let raf = 0
    let presented: number | null = null
    let frameHandle = 0
    const rvfc = video as
      | (HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number
          cancelVideoFrameCallback?: (handle: number) => void
        })
      | null
    const requestFrame = rvfc?.requestVideoFrameCallback?.bind(rvfc)
    if (requestFrame) {
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        presented = meta.mediaTime
        frameHandle = requestFrame(onFrame)
      }
      frameHandle = requestFrame(onFrame)
    }
    const apply = () => {
      const time = presented ?? video?.currentTime ?? 0
      const { cx, w, h } = medallionAt(time)
      plaque.style.left = `${cx}%`
      plaque.style.width = `${w}%`
      plaque.style.height = `${h}%`
      // The names are printed on the paper behind the curtain, so they are
      // clipped to the trapezoid the curtain has opened. Once the curtain is
      // dressed open the clip widens to the whole frame so nothing stays cut.
      if (veil) {
        const gap = curtainGapAt(time)
        const open = Math.min(1, Math.max(0, (time - 9.2) / 0.6))
        const lt = gap.lt * (1 - open)
        const rt = gap.rt + (100 - gap.rt) * open
        const lb = gap.lb * (1 - open)
        const rb = gap.rb + (100 - gap.rb) * open
        veil.style.clipPath = `polygon(${lt.toFixed(2)}% 30%, ${rt.toFixed(2)}% 30%, ${rb.toFixed(2)}% 43%, ${lb.toFixed(2)}% 43%)`
      }
      raf = window.requestAnimationFrame(apply)
    }
    apply()
    return () => {
      window.cancelAnimationFrame(raf)
      rvfc?.cancelVideoFrameCallback?.(frameHandle)
    }
  }, [opening])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [opened])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-eg-reveal]"))
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

  const storyPhotos = useMemo(
    () => stories.map((s) => s.image_url).filter((u): u is string => !!u),
    [stories]
  )
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  // The marquee translates by -50%, so the track must be exactly two copies of
  // the same list for the loop to be seamless.
  const galleryLoop = useMemo(() => [...gallery, ...gallery], [gallery])

  // The couple's own film. YouTube links become an embed; a direct file plays in
  // a <video>. It autoplays muted+looped inline (see `videoSource`) — a poster
  // that waits for a tap buried the film for every guest who never scrolled back
  // to it. Nothing renders when the editor left the URL empty.
  const film = videoSource(profile.video_url)
  const hasFilm =
    !!film && gates.video !== false && profile.video_section_visible !== false

  const stepLightbox = useCallback((delta: number) => {
    setLightbox((v) => {
      if (!v) return v
      const total = v.photos.length
      return total > 0 ? { ...v, index: (v.index + delta + total) % total } : v
    })
  }, [])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowRight") stepLightbox(1)
      if (e.key === "ArrowLeft") stepLightbox(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, stepLightbox])

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

  const copyAccount = (number?: string) => {
    if (!number) return
    if (!navigator.clipboard?.writeText) {
      showToast("Copy is not available in this browser")
      return
    }
    navigator.clipboard.writeText(number).then(
      () => showToast("Account number copied"),
      () => showToast("Could not copy the account number")
    )
  }


  return (
    <div ref={rootRef} className={`eg-root${opened ? " is-open" : " is-locked"}`}>
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
          className={`eg-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="eg-music__disc" aria-hidden="true" />
          <span className="eg-music__icon" aria-hidden="true">
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

      <main className="eg-invitation" aria-hidden={!opened}>
        {/* ── Welcome ──────────────────────────────────────────── */}
        <section className="eg-welcome" data-section="hero">
          <div className="eg-welcome__art" style={{ backgroundImage: `url(${ART_SWANS})` }} aria-hidden="true" />
          <div className="eg-welcome__body" data-eg-reveal>
            <p className="eg-kicker">{tc.welcome_invite || "Welcome to our wedding"}</p>
            <h1 className="eg-display eg-welcome__names">
              <span>{profile.groom_name || "Groom"}</span>
              <em>&amp;</em>
              <span>{profile.bride_name || "Bride"}</span>
            </h1>
            {dateLong && <p className="eg-welcome__date">{dateLong}</p>}
          </div>
        </section>

        {/* ── Countdown ────────────────────────────────────────── */}
        {profile.estimated_wedding_date && (
          <section className="eg-section eg-countdown" data-section="countdown">
            <div className="eg-countdown__frame" style={{ backgroundImage: `url(${ART_COUNTDOWN_FRAME})` }} aria-hidden="true" />
            <div className="eg-wrap eg-countdown__body" data-eg-reveal>
              <h2 className="eg-display eg-heading">Countdown</h2>
              <CountdownClock iso={profile.estimated_wedding_date} sessions={profile.sessions} />
              {calendarUrl && (
                <a className="eg-link" href={calendarUrl} target="_blank" rel="noreferrer">
                  Add to calendar
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Couple ───────────────────────────────────────────── */}
        <section className="eg-section eg-couple" data-section="couple">
          <div className="eg-wrap" data-eg-reveal>
            <p className="eg-kicker">{openingTitle}</p>
            <p className="eg-body eg-couple__intro">{welcomeMessage}</p>
            <div className="eg-couple__grid">
              <article className="eg-person">
                <figure className="eg-gilded">
                  <img src={groomPhoto} alt={profile.groom_full_name || profile.groom_name || "The groom"} loading="lazy" />
                </figure>
                <h3 className="eg-display eg-person__name">
                  {profile.groom_full_name || profile.groom_name || "The Groom"}
                </h3>
                {profile.groom_parents && <p className="eg-person__parents">{profile.groom_parents}</p>}
                {profile.groom_instagram && (
                  <a
                    className="eg-ig"
                    href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Instagram ${profile.groom_instagram}`}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <span>{profile.groom_instagram.startsWith("@") ? profile.groom_instagram : `@${profile.groom_instagram}`}</span>
                  </a>
                )}
              </article>
              <span className="eg-couple__amp" aria-hidden="true">
                &amp;
              </span>
              <article className="eg-person">
                <figure className="eg-gilded">
                  <img src={bridePhoto} alt={profile.bride_full_name || profile.bride_name || "The bride"} loading="lazy" />
                </figure>
                <h3 className="eg-display eg-person__name">
                  {profile.bride_full_name || profile.bride_name || "The Bride"}
                </h3>
                {profile.bride_parents && <p className="eg-person__parents">{profile.bride_parents}</p>}
                {profile.bride_instagram && (
                  <a
                    className="eg-ig"
                    href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Instagram ${profile.bride_instagram}`}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                    </svg>
                    <span>{profile.bride_instagram.startsWith("@") ? profile.bride_instagram : `@${profile.bride_instagram}`}</span>
                  </a>
                )}
              </article>
            </div>
            {tc.cover_apology && <p className="eg-note">{tc.cover_apology}</p>}
          </div>
        </section>

        {/* ── Turut Mengundang ─────────────────────────────────── */}
        {honored.length > 0 && (
          <section className="eg-section eg-honored" data-section="inviting">
            <div className="eg-garland" style={{ backgroundImage: `url(${ART_GARLAND})` }} aria-hidden="true" />
            <div className="eg-wrap eg-honored__body" data-eg-reveal>
              <h2 className="eg-display eg-heading">With Honour</h2>
              <ul className="eg-honored__list">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Ceremony & Reception ─────────────────────────────── */}
        {events.length > 0 && (
          <section className="eg-section eg-events" data-section="events">
            <div
              className="eg-card eg-card--ceremony"
              style={{ ["--eg-card-art" as string]: `url(${ART_CEREMONY_FRAME})` } as CSSProperties}
            >
              <div className="eg-card__frame" data-eg-reveal>
              <p className="eg-kicker">Where we celebrate</p>
              <h2 className="eg-display eg-heading">The Wedding Day</h2>
              {tc.events_intro && <p className="eg-body eg-events__intro">{tc.events_intro}</p>}
              <div className="eg-events__list">
                {events.map((event, index) => (
                  <article className="eg-event" key={`${event.name || "event"}-${index}`}>
                    <h3 className="eg-display eg-event__name">{event.name || "Wedding Event"}</h3>
                    <p className="eg-event__when">
                      {longDate(event.date) && <span>{longDate(event.date)}</span>}
                      {event.time && <span>{event.time}</span>}
                    </p>
                    {event.venue && <p className="eg-event__venue">{event.venue}</p>}
                    {event.address && <p className="eg-event__address">{event.address}</p>}
                    {event.maps_url && (
                      <a className="eg-link" href={event.maps_url} target="_blank" rel="noreferrer">
                        Open in maps
                      </a>
                    )}
                  </article>
                ))}
              </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Rundown ──────────────────────────────────────────── */}
        {rundown.length > 0 && (
          <section className="eg-section eg-rundown" data-section="rundown">
            <div className="eg-wrap" data-eg-reveal>
              <h2 className="eg-display eg-heading">{tc.rundown_title || "Order of the Day"}</h2>
              {tc.rundown_intro && <p className="eg-body eg-rundown__intro">{tc.rundown_intro}</p>}
              <ol className="eg-rundown__list">
                {rundown.map((item, index) => (
                  <li className="eg-rundown__row" key={`${item.time || "row"}-${index}`}>
                    <figure className="eg-rundown__art">
                      <img src={rundownArt(index, rundown.length)} alt="" aria-hidden="true" loading="lazy" />
                    </figure>
                    <div className="eg-rundown__thread" aria-hidden="true">
                      <i />
                    </div>
                    <div className="eg-rundown__text">
                      {item.time && <span className="eg-rundown__time">{item.time}</span>}
                      {item.description && <span className="eg-rundown__desc">{item.description}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* ── Dress code ───────────────────────────────────────── */}
        {hasDresscode && (
          <section className="eg-section eg-dress" data-section="dresscode">
            <div className="eg-dress__garland" style={{ backgroundImage: `url(${ART_DRESSCODE_GARLAND})` }} aria-hidden="true" />
            <div className="eg-wrap eg-dress__body" data-eg-reveal>
              <h2 className="eg-display eg-heading">Dress Code</h2>
              <p className="eg-dress__title">{profile.dresscode?.title || "Formal Attire"}</p>
              {profile.dresscode?.description && <p className="eg-body eg-dress__note">{profile.dresscode.description}</p>}
              <div className="eg-swatches" aria-label="Dress code palette">
                {dressColors.map((color, index) => (
                  <span className="eg-swatch" key={`${color.hex || color.name}-${index}`}>
                    <i style={{ "--eg-swatch": color.hex || "#ccc" } as CSSProperties} aria-hidden="true" />
                    {color.name && <em>{color.name}</em>}
                  </span>
                ))}
              </div>
              <img className="eg-dress__guests" src={ART_DRESSCODE_GUESTS} alt="" aria-hidden="true" loading="lazy" />
            </div>
          </section>
        )}

        {/* ── Our Story ────────────────────────────────────────── */}
        {stories.length > 0 && (
          <section className="eg-section eg-story" data-section="story">
            <div className="eg-wrap eg-story__body" data-eg-reveal>
              <div className="eg-story__arch" style={{ backgroundImage: `url(${ART_STORY_FRAME})` }} aria-hidden="true" />
              <div className="eg-story__inner">
                <h2 className="eg-display eg-heading">{tc.love_story_title || "How Our Story Began"}</h2>
                {tc.story_intro && <p className="eg-body eg-story__intro">{tc.story_intro}</p>}
                <ol className="eg-chapters">
                  {stories.map((story, index) => (
                    <li className="eg-chapter" key={`${story.title || "chapter"}-${index}`}>
                      {story.image_url && (
                        <button
                          type="button"
                          className="eg-gilded eg-chapter__photo"
                          onClick={() => {
                            const at = storyPhotos.indexOf(story.image_url!)
                            if (at >= 0) setLightbox({ photos: storyPhotos, index: at })
                          }}
                          aria-label={story.title ? `Open photo: ${story.title}` : "Open photo"}
                        >
                          <img src={story.image_url} alt="" loading="lazy" />
                        </button>
                      )}
                      <div className="eg-chapter__text">
                        <p className="eg-chapter__index">{pad2(index + 1)}</p>
                        {story.title && <h3 className="eg-display eg-chapter__title">{story.title}</h3>}
                        {story.description && <p className="eg-body eg-chapter__desc">{story.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ──────────────────────────────────────────── */}
        {gallery.length > 0 && (
          <section className="eg-section eg-gallery" data-section="gallery">
            <div className="eg-wrap eg-gallery__head" data-eg-reveal>
              <h2 className="eg-display eg-heading">{tc.gallery_title || "Our Moments"}</h2>
              {tc.gallery_intro && <p className="eg-body eg-gallery__intro">{tc.gallery_intro}</p>}
            </div>

            <div className="eg-gallery__row" data-eg-reveal>
              <div
                className="eg-gallery__track"
                style={{ ["--eg-dur" as string]: `${Math.max(38, gallery.length * 8)}s` } as CSSProperties}
              >
                {galleryLoop.map((url, index) => (
                  <figure className="eg-gilded eg-gallery__tile" key={`g1-${index}-${url}`}>
                    <button
                      type="button"
                      onClick={() => setLightbox({ photos: gallery, index: index % gallery.length })}
                      aria-label={`Open photo ${(index % gallery.length) + 1}`}
                    >
                      <img src={url} alt="" loading="lazy" />
                    </button>
                  </figure>
                ))}
              </div>
            </div>

            <div className="eg-wrap eg-gallery__quote" data-eg-reveal>
              <span className="eg-gallery__mark" aria-hidden="true">&#8220;</span>
              <p className="eg-gallery__quote-text">
                {tc.gallery_quote || "Every love story is beautiful, but ours is my favourite."}
              </p>
              <p className="eg-gallery__sign">{coupleLabel}</p>
            </div>

            {gallery.length > 2 && (
              <div className="eg-gallery__row eg-gallery__row--rev" data-eg-reveal>
                <div
                  className="eg-gallery__track"
                  style={{ ["--eg-dur" as string]: `${Math.max(44, gallery.length * 9)}s` } as CSSProperties}
                >
                  {[...galleryLoop].reverse().map((url, index) => (
                    <figure className="eg-gilded eg-gallery__tile" key={`g2-${index}-${url}`}>
                      <button
                        type="button"
                        onClick={() =>
                          setLightbox({ photos: gallery, index: gallery.length - 1 - (index % gallery.length) })
                        }
                        aria-label={`Open photo ${gallery.length - (index % gallery.length)}`}
                      >
                        <img src={url} alt="" loading="lazy" />
                      </button>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Wedding film ─────────────────────────────────────── */}
        {hasFilm && (
          <section className="eg-section eg-film" data-section="video">
            <div className="eg-wrap eg-film__head" data-eg-reveal>
              <h2 className="eg-display eg-heading">{tc.video_title || "Our Wedding Film"}</h2>
              {tc.video_intro && <p className="eg-body eg-film__intro">{tc.video_intro}</p>}
            </div>

            <div className="eg-wrap eg-film__frame" data-eg-reveal>
              <div className="eg-gilded eg-film__player eg-film__player--inline">
                {film!.kind === "file" ? (
                  <video src={film!.src} autoPlay muted loop playsInline controls preload="metadata" />
                ) : (
                  <iframe
                    src={film!.src}
                    title={tc.video_title || "Our Wedding Film"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
              </div>
              <p className="eg-film__caption">
                {tc.video_caption || "Press play to hear it again"}
              </p>
            </div>
          </section>
        )}

        {/* ── Gifts ────────────────────────────────────────────── */}
        {hasGift && (
          <section className="eg-section eg-gift" data-section="gift">
            <div className="eg-wrap eg-gift__body" data-eg-reveal>
              <div
                className="eg-card eg-card--gift"
                style={{ ["--eg-card-art" as string]: `url(${ART_GIFT_FRAME})` } as CSSProperties}
              >
                <div className="eg-card__frame eg-gift__inner">
                  <p className="eg-kicker">{tc.gift_intro_title || "Wedding Gift"}</p>
                  <p className="eg-body eg-gift__intro">
                    {tc.gift_intro_description ||
                      "Your presence is the greatest gift. Should you wish to send a token of love, the details are below."}
                  </p>

                  {giftTabs && (
                    <div className="eg-tabs" role="tablist" aria-label="Gift details">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={giftTab === "accounts"}
                        className={`eg-tab${giftTab === "accounts" ? " is-active" : ""}`}
                        onClick={() => setGiftTab("accounts")}
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={giftTab === "address"}
                        className={`eg-tab${giftTab === "address" ? " is-active" : ""}`}
                        onClick={() => setGiftTab("address")}
                      >
                        Send a gift
                      </button>
                    </div>
                  )}

                  {accounts.length > 0 && (!giftTabs || giftTab === "accounts") && (
                    <ul className="eg-accounts">
                      {accounts.map((account, index) => {
                        const open = openAccount === index
                        return (
                          <li className={`eg-account${open ? " is-open" : ""}`} key={`${account.account_number || "acc"}-${index}`}>
                            <button
                              type="button"
                              className="eg-account__head"
                              aria-expanded={open}
                              onClick={() => setOpenAccount(open ? -1 : index)}
                            >
                              <span className="eg-account__bank">{account.provider_name || "Bank"}</span>
                              <svg className="eg-account__chev" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M6 9.5 12 15l6-5.5" />
                              </svg>
                            </button>
                            <div className="eg-account__panel">
                              <div className="eg-account__inner">
                                {account.account_number && (
                                  <p className="eg-account__number">{account.account_number}</p>
                                )}
                                {account.account_name && <p className="eg-account__name">{account.account_name}</p>}
                                {account.account_number && (
                                  <button type="button" className="eg-link" onClick={() => copyAccount(account.account_number)}>
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

                  {giftAddress && (!giftTabs || giftTab === "address") && (
                    <div className="eg-address">
                      {profile.gift_address_name && <p className="eg-address__name">{profile.gift_address_name}</p>}
                      <p className="eg-address__text">{giftAddress}</p>
                      <button type="button" className="eg-link" onClick={() => copyAccount(giftAddress)}>
                        Copy address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── RSVP & Wishes ────────────────────────────────────── */}
        <section className="eg-section eg-wishes" data-section="wishes">
          <div className="eg-wishes__frame" style={{ backgroundImage: `url(${ART_RSVP_ENVELOPE})` }} aria-hidden="true" />
          <img className="eg-wishes__topiary" src={ART_RSVP_TOPIARY} alt="" aria-hidden="true" loading="lazy" />
          <div className="eg-wrap eg-wishes__body" data-eg-reveal>
            <h2 className="eg-display eg-heading">Wishes &amp; Prayers</h2>
            <p className="eg-body eg-wishes__intro">
              {tc.wishes_intro || "Leave a wish, a prayer, or a memory for us to keep."}
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
        <section className="eg-closing" data-section="closing">
          {closingPhoto && (
            <figure className="eg-gilded eg-closing__photo">
              <img src={closingPhoto} alt={coupleLabel} loading="lazy" />
            </figure>
          )}
          <div className="eg-wrap eg-closing__body" data-eg-reveal>
            <h2 className="eg-display eg-closing__names">
              {profile.groom_name || "Groom"} &amp; {profile.bride_name || "Bride"}
            </h2>
            <p className="eg-body eg-closing__message">{closingMessage}</p>
            <img className="eg-closing__art" src={ART_CLOSING} alt="" aria-hidden="true" loading="lazy" />

            <footer className="tpl-footer eg-footer">
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

      {/* ── Door cover gate ─────────────────────────────────────── */}
      <div
        className={`eg-gate${opening ? " is-opening" : ""}${namesIn ? " is-names" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Open the invitation"
        onClick={openGate}
      >
        <div className="eg-gate__film">
          <video
            ref={videoRef}
            className="eg-gate__media"
            src={DOOR_FILM}
            poster={ART_DOOR_POSTER}
            muted
            playsInline
            preload={saveData ? "metadata" : "auto"}
          />

          {/* The door film ships with the reference couple's monogram painted
              into the artwork, it is not a DOM element, so it cannot be
              edited, only covered. This cartouche is drawn to the measured
              footprint of that medallion (36.4% x 28.8%, centre 50.4/50.6) and
              carries OUR couple's initials. */}
          <span className="eg-gate__plaque" ref={plaqueRef} aria-hidden="true">
            <DoorCartouche initials={monogram} />
          </span>

          <div className="eg-gate__veil" ref={veilRef}>
            <div className="eg-gate__names">
              <p className="eg-gate__pair">{coupleLabel}</p>
              {dateLong && <p className="eg-gate__date">{dateLong}</p>}
            </div>
          </div>
        </div>

        {/* The guest the door is opened for. It sits above the call to action
            and retires with it, so the parted curtain carries only the names. */}
        <p className="eg-gate__guest">
          <span className="eg-gate__guest-kicker">Dear,</span>
          <strong>{guestName}</strong>
        </p>

        <button type="button" className="eg-gate__open" onClick={openGate}>
          <span>Tap to open</span>
        </button>

        {/* Same badge as the adat family's video spinner: a small circular
            indicator in the corner, so the gate never reads as a status bar. */}
        {buffering && (
          <span className="eg-gate__buffer" role="status" aria-label="Memuat video">
            <span className="eg-gate__buffer-ring" aria-hidden="true" />
          </span>
        )}

        <span className="eg-gate__signature">Wedding by Aksaraa</span>
      </div>

      {/* ── Photo lightbox (story + gallery photos) ────────────── */}
      {lightbox !== null && lightbox.photos[lightbox.index] && (
        <div className="eg-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button type="button" className="eg-lightbox__close" onClick={() => setLightbox(null)} aria-label="Close photo">
            ✕
          </button>
          {lightbox.photos.length > 1 && (
            <button
              type="button"
              className="eg-lightbox__nav eg-lightbox__nav--prev"
              onClick={() => stepLightbox(-1)}
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          <img src={lightbox.photos[lightbox.index]} alt="" />
          {lightbox.photos.length > 1 && (
            <button
              type="button"
              className="eg-lightbox__nav eg-lightbox__nav--next"
              onClick={() => stepLightbox(1)}
              aria-label="Next photo"
            >
              ›
            </button>
          )}
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
          bottom={88}
        />
      )}

      {toast && (
        <div className="eg-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
