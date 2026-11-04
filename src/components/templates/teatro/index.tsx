"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import AutoplayYouTube from "../shared/AutoplayYouTube"
import {
  bridePhoto as bridePhotoOf,
  countdownTarget,
  coverPhoto,
  flattenPhotos,
  groomPhoto as groomPhotoOf,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import { TEATRO_ASSETS } from "./assets"
import "./teatro.css"

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
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

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

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return (t.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  return t.replace(/^@/, "")
}

// A torn (deckle) edge shared by the photo clip and the mat plate so the mat's
// aperture and the image can never disagree.
const DECKLE = (() => {
  let seed = 20261104
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const points: Array<[number, number]> = []
  const per = 12
  const push = (x: number, y: number, nx: number, ny: number) => {
    const jitter = 2.4 * (0.2 + rand() * 0.95)
    points.push([Number((x + nx * jitter).toFixed(2)), Number((y + ny * jitter).toFixed(2))])
  }
  for (let i = 0; i < per; i++) push((i / per) * 100, 0, 0, 1)
  for (let i = 0; i < per; i++) push(100, (i / per) * 100, -1, 0)
  for (let i = 0; i < per; i++) push(100 - (i / per) * 100, 100, 0, -1)
  for (let i = 0; i < per; i++) push(0, 100 - (i / per) * 100, 1, 0)
  return {
    clip: `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`,
    path: `M0 0H100V100H0Z M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`,
  }
})()

type RevealKind = "up" | "fade" | "zoom"
type RevealProps = { "data-te-reveal"?: RevealKind; "data-te-load"?: RevealKind; style?: CSSProperties }

const IN = (kind: RevealKind, delay = 0): RevealProps => ({
  "data-te-reveal": kind,
  style: { "--te-delay": `${delay}s` } as CSSProperties,
})
const ON_LOAD = (kind: RevealKind, delay = 0): RevealProps => ({
  "data-te-load": kind,
  style: { "--te-delay": `${delay}s` } as CSSProperties,
})

function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg className={`te-flourish ${className}`} viewBox="0 0 120 16" aria-hidden="true" focusable="false">
      <path d="M2 8h40M78 8h40" />
      <path d="M60 2.5 63.4 8 60 13.5 56.6 8Z" />
      <circle cx="69.5" cy="8" r="1.4" />
      <circle cx="50.5" cy="8" r="1.4" />
    </svg>
  )
}

function DeckledFrame({
  src,
  alt,
  className = "",
  ratio,
}: {
  src?: string
  alt: string
  className?: string
  ratio?: string
}) {
  return (
    <figure className={`te-mat ${className}`.trim()} style={ratio ? ({ "--te-mat-ratio": ratio } as CSSProperties) : undefined}>
      <div className="te-mat__inner">
        {src ? <img src={src} alt={alt} draggable={false} loading="lazy" /> : <span className="te-mat__empty" aria-hidden="true" />}
        <svg className="te-mat__plate" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d={DECKLE.path} fillRule="evenodd" />
        </svg>
      </div>
    </figure>
  )
}

function Frame({ src, alt }: { src?: string; alt: string }) {
  return (
    <figure className="te-portrait">
      <div className="te-portrait__inner">
        {src ? <img src={src} alt={alt} draggable={false} loading="lazy" /> : <span className="te-portrait__empty" aria-hidden="true" />}
      </div>
    </figure>
  )
}

// Deterministic pseudo-random so the confetti layout is identical on the server
// and on the client (a Math.random() list would hydrate differently).
const CONFETTI_PIECES = (() => {
  let seed = 20270619
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  return Array.from({ length: 60 }, (_, index) => ({
    key: index,
    left: Number((rand() * 100).toFixed(2)),
    size: Number((5 + rand() * 8).toFixed(1)),
    sway: Math.round((rand() - 0.5) * 220),
    spin: Math.round(360 + rand() * 360),
    duration: Number((3 + rand() * 2).toFixed(2)),
    delay: Number((rand() * 0.9).toFixed(2)),
  }))
})()

function Confetti() {
  return (
    <div className="te-confetti" aria-hidden="true">
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.key}
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size * 1.7}px`,
              animationDuration: `${piece.duration}s`,
              animationDelay: `${piece.delay}s`,
              "--te-sway": `${piece.sway}px`,
              "--te-spin": `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

// Only used when the vendored foil texture cannot be decoded (offline preview,
// blocked asset): keeps the disc scratchable instead of leaving it blank.
function paintFallbackFoil(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size / 2
  const cy = size / 2
  const base = ctx.createRadialGradient(cx, cy, size * 0.04, cx, cy, size * 0.52)
  base.addColorStop(0, "#f6e8c2")
  base.addColorStop(0.4, "#e2c98f")
  base.addColorStop(0.72, "#c3a166")
  base.addColorStop(1, "#e9d7ad")
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.translate(cx, cy)
  for (let i = 0; i < 44; i++) {
    const angle = (i / 44) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5)
    ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.30)" : "rgba(120,88,38,0.14)"
    ctx.lineWidth = i % 2 ? 1.4 : 1
    ctx.stroke()
  }
  ctx.restore()
}

// Same foil disc as the reference: a 150px canvas painted with the vendored
// gold texture, erased with a 30px `destination-out` circle under the pointer,
// and revealed once more than half of its pixels are gone.
function ScratchPill({ value, index, onRevealed }: { value: string; index: number; onRevealed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragging = useRef(false)
  const checkedAt = useRef(0)
  const finished = useRef(false)
  const ready = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let cancelled = false
    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      if (cancelled) return
      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ready.current = true
    }
    img.onerror = () => {
      if (cancelled) return
      ctx.globalCompositeOperation = "source-over"
      paintFallbackFoil(ctx, canvas.width)
      ready.current = true
    }
    img.src = TEATRO_ASSETS.scratchGold
    return () => {
      cancelled = true
    }
  }, [])

  const erase = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || finished.current || !ready.current) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const box = canvas.getBoundingClientRect()
    if (!box.width || !box.height) return
    const x = ((clientX - box.left) / box.width) * canvas.width
    const y = ((clientY - box.top) / box.height) * canvas.height
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.fill()
  }

  const measure = () => {
    const canvas = canvasRef.current
    if (!canvas || finished.current) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    let total = 0
    for (let i = 3; i < data.length; i += 4 * 4) {
      total++
      if (data[i] < 40) clear++
    }
    if (!total || clear / total <= 0.5) return
    finished.current = true
    canvas.style.opacity = "0"
    canvas.style.pointerEvents = "none"
    onRevealed()
  }

  const maybeMeasure = () => {
    const now = Date.now()
    if (now - checkedAt.current < 180) return
    checkedAt.current = now
    measure()
  }

  return (
    <div
      className="te-scratch"
      style={{ "--te-disc-delay": `${0.2 + index * 0.15}s` } as CSSProperties}
    >
      <div className="te-scratch__disc">
        <span className="te-scratch__value">{value}</span>
        <canvas
          ref={canvasRef}
          className="te-scratch__foil"
          width={150}
          height={150}
          aria-hidden="true"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            dragging.current = true
            erase(event.clientX, event.clientY)
          }}
          onPointerMove={(event) => {
            if (!dragging.current) return
            erase(event.clientX, event.clientY)
            maybeMeasure()
          }}
          onPointerUp={() => {
            dragging.current = false
            measure()
          }}
          onPointerCancel={() => {
            dragging.current = false
          }}
        />
      </div>
    </div>
  )
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
    { value: pad2(Math.floor((diff % 3600000) / 60000)), label: "Min" },
    { value: pad2(Math.floor((diff % 60000) / 1000)), label: "Sec" },
  ]
  return (
    <div className="te-clock" aria-label="Countdown to the wedding day">
      {units.map((unit) => (
        <div className="te-clock__cell" key={unit.label}>
          <span className="te-clock__value">{target ? unit.value : "--"}</span>
          <small className="te-clock__label">{unit.label}</small>
        </div>
      ))}
    </div>
  )
}

type CurtainPhase = "idle" | "playing" | "done"

// Sampled off the vendored curtain film: the inner edge of the drapery, as a
// percentage of the film's width, at ten evenly spaced rows (GAP_ROWS), every
// quarter second. The programme is clipped to this gap, so it behaves like type
// printed on the paper behind the curtain — each line is uncovered as the
// drapery actually parts, and no timer has to guess at the motion.
const GAP_ROWS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const GAP_FRAMES: { t: number; l: number[] }[] = [
  { t: 0, l: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50] },
  { t: 1.25, l: [50, 50, 50, 50, 47.7, 46.3, 44.4, 46.7, 50, 50, 50] },
  { t: 1.5, l: [50, 49.1, 47.2, 45.3, 42.1, 37.9, 33.6, 40.2, 45.8, 50, 48.6] },
  { t: 1.75, l: [47.7, 46.3, 44.4, 41.1, 36.4, 29.9, 23.4, 32.7, 42.1, 47.2, 47.2] },
  { t: 2, l: [43.5, 42.5, 40.2, 37.4, 32.2, 25.7, 16.8, 22, 33.2, 43.9, 43.9] },
  { t: 2.25, l: [39.3, 38.3, 36.9, 35, 31.3, 26.6, 18.7, 14, 23.8, 36, 36] },
  { t: 2.5, l: [36.4, 36, 34.6, 32.7, 29.4, 24.3, 17.8, 10.3, 17.3, 27.1, 27.1] },
  { t: 2.75, l: [35.5, 34.6, 32.7, 29.9, 26.6, 22.4, 16.4, 8.9, 13.6, 19.2, 19.2] },
  { t: 3, l: [36, 34.6, 32.7, 29.9, 26.6, 22.9, 17.3, 8.9, 13.1, 16.8, 16.8] },
  { t: 3.25, l: [36, 35, 34.1, 31.8, 28.5, 23.8, 17.8, 9.3, 13.6, 17.8, 17.8] },
  { t: 3.5, l: [36, 35, 33.6, 31.3, 28, 23.8, 17.8, 8.9, 14, 19.2, 19.2] },
  { t: 3.75, l: [36, 35, 33.2, 30.8, 27.6, 23.8, 17.3, 8.9, 13.6, 18.7, 18.7] },
  { t: 4, l: [36, 35, 33.2, 30.8, 27.6, 23.8, 17.3, 8.9, 13.6, 18.2, 18.2] },
  { t: 4.25, l: [36, 35, 33.2, 31.3, 28, 23.8, 17.8, 8.9, 13.6, 18.7, 18.7] },
  { t: 4.5, l: [35.5, 35, 33.2, 30.8, 27.6, 23.8, 17.8, 8.9, 13.6, 18.2, 18.2] },
  { t: 4.75, l: [35.5, 35, 33.2, 30.8, 27.6, 23.8, 17.8, 8.4, 13.6, 18.2, 18.2] },
  { t: 5.083, l: [35.5, 34.6, 33.2, 30.8, 27.6, 23.8, 17.8, 8.4, 13.1, 18.2, 18.2] },
]

function gapAt(time: number) {
  const first = GAP_FRAMES[0]
  if (time <= first.t) return first.l
  const last = GAP_FRAMES[GAP_FRAMES.length - 1]
  if (time >= last.t) return last.l
  for (let i = 1; i < GAP_FRAMES.length; i++) {
    const b = GAP_FRAMES[i]
    if (time > b.t) continue
    const a = GAP_FRAMES[i - 1]
    const k = (time - a.t) / (b.t - a.t)
    return a.l.map((value, index) => value + (b.l[index] - value) * k)
  }
  return last.l
}

function gapLeftAt(edges: number[], rowPct: number) {
  const position = Math.min(GAP_ROWS.length - 1, Math.max(0, rowPct / 10))
  const low = Math.floor(position)
  const high = Math.min(GAP_ROWS.length - 1, low + 1)
  return edges[low] + (edges[high] - edges[low]) * (position - low)
}

// The album is `object-fit: cover`, so a portrait frame sees only the middle
// band of the film and a wide frame only its middle columns. Convert those
// visible fractions back to film coordinates before clipping, or the mask would
// drift off the drapery at every viewport.
function veilPolygon(cover: HTMLElement, video: HTMLVideoElement, time: number) {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return ""
  const box = cover.getBoundingClientRect()
  if (!box.width || !box.height) return ""
  const scale = Math.max(box.width / width, box.height / height)
  const visibleW = Math.min(1, box.width / (width * scale))
  const visibleH = Math.min(1, box.height / (height * scale))
  const edges = gapAt(time)
  const steps = 20
  const left: string[] = []
  const right: string[] = []
  for (let index = 0; index <= steps; index++) {
    const y = index / steps
    const filmY = 0.5 + (y - 0.5) * visibleH
    const edge = gapLeftAt(edges, filmY * 100) / 100
    const x = Math.min(0.5, Math.max(0, 0.5 + (edge - 0.5) / visibleW))
    left.push(`${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
    right.push(`${((1 - x) * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
  }
  return `polygon(${left.join(", ")}, ${right.reverse().join(", ")})`
}

// The reference's curtain pull: the closed poster holds the gate, the vendored
// video is pulled with a tap, and the open poster (identical to the video's
// last frame) stays behind the invitation once it finishes.
function Curtain({
  phase,
  videoRef,
  live,
  onLive,
  onEnd,
}: {
  phase: CurtainPhase
  videoRef: RefObject<HTMLVideoElement | null>
  live: boolean
  onLive: () => void
  onEnd: () => void
}) {
  return (
    <div className="te-curtain" data-phase={phase} aria-hidden="true">
      <img className="te-curtain__lay te-curtain__lay--closed" src={TEATRO_ASSETS.curtainClosed} alt="" draggable={false} />
      <video
        ref={videoRef}
        className="te-curtain__lay te-curtain__video"
        data-live={live ? "true" : "false"}
        src={TEATRO_ASSETS.curtainVideo}
        preload="metadata"
        muted
        playsInline
        disablePictureInPicture
        tabIndex={-1}
        onPlaying={onLive}
        onEnded={onEnd}
        onError={onEnd}
      />
      <img className="te-curtain__lay te-curtain__lay--open" src={TEATRO_ASSETS.curtainOpen} alt="" draggable={false} />
    </div>
  )
}

function ReelPlay({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="te-reel" onClick={onClick} aria-label="Play the wedding film">
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="te-reel__rim" cx="60" cy="60" r="46" />
        <circle cx="60" cy="60" r="7" />
        <circle cx="60" cy="30" r="7" />
        <circle cx="60" cy="90" r="7" />
        <circle cx="34" cy="45" r="7" />
        <circle cx="86" cy="45" r="7" />
        <circle cx="34" cy="75" r="7" />
        <circle cx="86" cy="75" r="7" />
        <path className="te-reel__tri" d="M55 49v22l18-11z" />
      </svg>
    </button>
  )
}

export default function Teatro(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [phase, setPhase] = useState<CurtainPhase>("idle")
  const [curtainLive, setCurtainLive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toast, setToast] = useState("")
  const [scratchDone, setScratchDone] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)
  const [filmOn, setFilmOn] = useState(false)
  const [gateLocked, setGateLocked] = useState(false)

  const curtainVideo = useRef<HTMLVideoElement | null>(null)
  const revealRef = useRef<HTMLElement | null>(null)
  const opened = phase === "done"
  const gateDone = scratchDone >= 3

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])

  const stagePhoto = slots[0] || coverPhoto(profile)
  const framePhoto = slots[1] || gallery[0] || ""
  const closingPhoto = slots[2] || slots[0] || gallery[0] || stagePhoto

  const groomShot = groomPhotoOf(profile.groom_photo_url) || gallery[1] || stagePhoto
  const brideShot = bridePhotoOf(profile.bride_photo_url) || gallery[2] || groomShot

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
  const youtubeId =
    hasVideo && film && film.kind === "embed"
      ? film.src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)?.[1] || ""
      : ""

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const guestName = (profile.guest_name || "").trim() || WISH_ME
  const dateLong = longDateEn(profile.estimated_wedding_date)
  const dateFull = longDateEn(profile.estimated_wedding_date, true)
  const dateObject = parseDate(profile.estimated_wedding_date)
  const coverDay = dateObject ? pad2(dateObject.getDate()) : ""
  const coverMonth = dateObject ? EN_MONTHS_SHORT[dateObject.getMonth()] : ""
  const coverYear = dateObject ? String(dateObject.getFullYear()) : ""

  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  const coverKicker = (tc.cover_kicker || "").trim() || "You are cordially invited to celebrate the wedding of"
  const openLabel = (tc.open_button || "").trim() || "Tap to continue"
  const apology = (tc.cover_apology || "").trim()
  const welcomeInvite = (tc.welcome_invite || "").trim()
  const openingKicker = (tc.opening_kicker || "").trim() || "Prologue"
  const quoteTitle = (tc.quote_title || "").trim()
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || "The Cast"
  const mempelaiIntro = (tc.profiles_intro || "").trim()
  const parentsLabel = (tc.parents_label || "").trim() || "Son and daughter of"
  const storyTitle = (tc.love_story_title || "").trim() || "Our Story"
  const storyKicker = (tc.story_kicker || "").trim() || "In Three Acts"
  const storyIntro = (tc.story_intro || "").trim()
  const eventsKicker = (tc.events_kicker || "").trim() || "The celebration will take place at"
  const eventsTitle = (tc.events_title || "").trim() || ""
  const eventsIntro = (tc.events_intro || "").trim()
  const eventsNote = (tc.events_note || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "View location"
  const saveDateLabel = (tc.save_date_label || "").trim() || "Save the Date"
  const revealTitle = (tc.reveal_title || "").trim() || "Reveal"
  const revealHint = (tc.reveal_hint || "").trim() || "Scratch to discover the date"
  const revealScratchHint = (tc.reveal_scratch_hint || "").trim() || "Scratch all three circles to continue"
  const scrollLabel = (tc.scroll_label || "").trim() || "Scroll"
  const countdownIntro = (tc.countdown_intro || "").trim() || "until the big day"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "With the blessing of"
  const invitingTitle = (tc.inviting_title || "").trim() || "Our Families"
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownKicker = (tc.rundown_kicker || "").trim() || "The Programme"
  const rundownTitle = (tc.rundown_title || "").trim() || "Order of the Day"
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryKicker = (tc.gallery_kicker || "").trim() || "Gallery"
  const galleryTitle = (tc.gallery_title || "").trim() || "Scenes"
  const galleryIntro = (tc.gallery_intro || "").trim()
  const galleryQuote = (tc.gallery_quote || "").trim()
  const videoKicker = (tc.video_kicker || "").trim() || "The Film"
  const videoTitle = (tc.video_title || "").trim() || ""
  const videoIntro = (tc.video_intro || "").trim()
  const giftKicker = (tc.gift_kicker || "").trim() || "Wedding Registry"
  const giftTitle = (tc.gift_intro_title || "").trim() || "Gifts"
  const giftIntro = (tc.gift_intro_description || "").trim()
  const giftSignature = (tc.gift_signature || "").trim()
  const giftButton = (tc.gift_button || "").trim() || "Open the registry"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dress Code"
  const wishesKicker = (tc.wishes_kicker || "").trim() || "Wishes"
  const wishesTitle = (tc.wishes_title || "").trim() || "Curtain Call"
  const wishesIntro = (tc.wishes_intro || "").trim()
  const closingKicker = (tc.closing_kicker || "").trim() || "Thank You"
  const closingMessage = (tc.closing_message || "").trim()
  const closingSee = (tc.closing_see || "").trim()
  const accountToast = (tc.copy_account_toast || "").trim() || "Account number copied"
  const addressToast = (tc.copy_address_toast || "").trim() || "Address copied"
  const addressButton = (tc.copy_address_button || "").trim() || "Copy address"

  const wishCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || "Name",
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || "Your full name",
    messageLabel: (tc.wishes_message_label || "").trim() || "Message",
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || "Leave a wish for the couple",
    submit: (tc.wishes_submit || "").trim() || "Send wishes",
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
    opened &&
    lightbox === null &&
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
    setPhase((current) => (current === "idle" ? "playing" : current))
    window.scrollTo(0, 0)
    playMusic()
  }, [playMusic])

  // The programme is clipped to the gap the drapery has actually opened, so the
  // curtain itself uncovers the copy. `requestVideoFrameCallback` reports the
  // frame on screen; without it `currentTime` is exact on a buffered film.
  const veilRef = useRef<HTMLDivElement | null>(null)
  const coverRef = useRef<HTMLElement | null>(null)

  const paintVeil = useCallback((time: number) => {
    const veil = veilRef.current
    const cover = coverRef.current
    const video = curtainVideo.current
    if (!veil || !cover || !video) return
    const polygon = veilPolygon(cover, video, time)
    if (polygon) veil.style.clipPath = polygon
  }, [])

  useEffect(() => {
    if (phase === "idle") {
      paintVeil(0)
      return
    }
    if (phase === "done") {
      const video = curtainVideo.current
      paintVeil(video?.duration || 5.083)
      return
    }
    const video = curtainVideo.current
    if (!video) return
    let raf = 0
    let presented: number | null = null
    let handle = 0
    const frameVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: (now: number, meta: { mediaTime: number }) => void) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }
    const requestFrame = frameVideo.requestVideoFrameCallback?.bind(frameVideo)
    if (requestFrame) {
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        presented = meta.mediaTime
        handle = requestFrame(onFrame)
      }
      handle = requestFrame(onFrame)
    }
    const tick = () => {
      paintVeil(presented ?? video.currentTime)
      raf = window.requestAnimationFrame(tick)
    }
    tick()
    return () => {
      window.cancelAnimationFrame(raf)
      frameVideo.cancelVideoFrameCallback?.(handle)
    }
  }, [phase, paintVeil])

  // A resize changes which band of the film the frame shows, so the mask has to
  // be rebuilt at the frozen final frame.
  useEffect(() => {
    if (phase !== "done") return
    const onResize = () => paintVeil(curtainVideo.current?.duration || 5.083)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [phase, paintVeil])

  // Pull the curtain: the reference plays the vendored video, then hands over to
  // the open poster. Reduced motion, a blocked or broken video, or a stall all
  // fall through to the open invitation instead of trapping the guest.
  useEffect(() => {
    if (phase !== "playing") return
    const video = curtainVideo.current
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done")
      return
    }
    const played = video.play()
    if (played && typeof played.catch === "function") {
      played.catch(() => setPhase("done"))
    }
    const cap = window.setTimeout(() => {
      if (!video.ended) setPhase("done")
    }, 20000)
    return () => window.clearTimeout(cap)
  }, [phase])

  const finishCurtain = useCallback(() => setPhase("done"), [])

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
      root.querySelectorAll<HTMLElement>("[data-te-load]").forEach((el) => el.classList.add("is-in"))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-te-reveal]"))
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
  }, [stories.length, rundown.length, honored.length, gallery.length, accounts.length, events.length, giftOpen, opened])

  useEffect(() => {
    document.body.classList.toggle("te-locked", phase === "idle" || gateLocked)
    return () => document.body.classList.remove("te-locked")
  }, [phase, gateLocked])

  const revealScratch = useCallback(() => setScratchDone((n) => (n >= 3 ? n : n + 1)), [])

  // The reference stops the page at the reveal: it only lets the guest scroll on
  // once all three discs are open. Observe the gate itself (90% visible, as the
  // reference does) rather than the whole page, so a guest who has already
  // revealed the date can come back and leave freely.
  useEffect(() => {
    if (phase !== "done" || !dateObject) return
    const node = revealRef.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio < 0.9) continue
          setGateLocked(scratchDone < 3)
        }
      },
      { threshold: [0.9] }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [phase, dateObject, scratchDone])

  // `overflow: hidden` alone does not stop iOS from rubber-banding the page (or
  // a trackpad from chaining the scroll), so the gestures are swallowed while
  // the gate is closed. Scratching itself still works: the discs opt out, and
  // their canvases already declare `touch-action: none`.
  useEffect(() => {
    if (!gateLocked) return
    const onWheel = (event: WheelEvent) => event.preventDefault()
    const onTouchMove = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null
      if (target && typeof target.closest === "function" && target.closest(".te-scratch")) return
      event.preventDefault()
    }
    const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "])
    const onKey = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key)) event.preventDefault()
    }
    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
    }
  }, [gateLocked])

  useEffect(() => {
    if (scratchDone < 3) return
    setConfetti(true)
    const timer = window.setTimeout(() => setConfetti(false), 6200)
    return () => window.clearTimeout(timer)
  }, [scratchDone])

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

  const filmPoster = slots[1] || gallery[0] || stagePhoto
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&controls=1&fs=1`
    : ""

  return (
    <div
      ref={rootRef}
      className={`te-root${opened ? " is-open" : ""}`}
      data-curtain={phase}
    >
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="te-page">
        {/* 1 / 3 — cover gate + welcome programme behind the curtain */}
        <section className="te-cover" ref={coverRef} data-section="sampul" aria-label="Open the invitation">
          <Curtain
            phase={phase}
            videoRef={curtainVideo}
            live={curtainLive}
            onLive={() => setCurtainLive(true)}
            onEnd={finishCurtain}
          />

          {/* The programme sits above the film but is clipped to the parted
              drapery, so it reads as printed on the paper behind it. */}
          <div className="te-veil" ref={veilRef} aria-hidden={!opened}>
            <div className="te-stage__copy">
              <p className="te-stage__kicker">{coverKicker}</p>
              <h1 className="te-stage__names">
                <span className="te-stage__name">{groomName || "Groom"}</span>
                {brideName && (
                  <>
                    <span className="te-stage__amp" aria-hidden="true">&amp;</span>
                    <span className="te-stage__name">{brideName}</span>
                  </>
                )}
              </h1>
              <Flourish className="te-stage__flourish" />
              {welcomeInvite && <p className="te-stage__invite">{welcomeInvite}</p>}
              {apology && <p className="te-stage__apology">{apology}</p>}
            </div>
          </div>

          {phase === "idle" && (
            <button type="button" className="te-gate" onClick={openInvitation} aria-label="Open the invitation">
              <span className="te-gate__to">Kepada Yth. Bapak/ Ibu/ Saudara/ i</span>
              <span className="te-gate__guest">{guestName}</span>
              <span className="te-gate__ring" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </span>
              <span className="te-gate__label">{openLabel}</span>
            </button>
          )}
          {opened && (
            <div className="te-scroll" aria-hidden="true">
              <span className="te-scroll__label">{scrollLabel}</span>
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 4v15M5 12l7 7 7-7" />
              </svg>
            </div>
          )}
        </section>

        {/* 4 — reveal gate. Split from the countdown on purpose: the reference
            stops the page here, shows the hand + wording, and only lets the
            guest continue once all three discs are open. */}
        {dateObject && (
          <section
            className="te-section te-reveal"
            ref={revealRef}
            data-section="reveal"
            aria-label="Reveal the wedding date"
          >
            {!gateDone && (
              <div className="te-reveal__guide" aria-hidden="true">
                <span className="te-reveal__icon">
                  <span className="te-reveal__ping" />
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                  </svg>
                </span>
                <p className="te-reveal__hint">{revealScratchHint}</p>
              </div>
            )}
            <h2 className="te-script te-script--md">{revealTitle}</h2>
            <p className="te-hint">{revealHint}</p>
            <div className="te-scratchRow">
              <ScratchPill index={0} value={coverDay} onRevealed={revealScratch} />
              <ScratchPill index={1} value={coverMonth} onRevealed={revealScratch} />
              <ScratchPill index={2} value={coverYear} onRevealed={revealScratch} />
            </div>
            <p className="te-srOnly" aria-live="polite">
              {gateDone ? dateFull : ""}
            </p>
            {gateDone && (
              <p className="te-script te-reveal__done">{dateFull}</p>
            )}
          </section>
        )}

        {/* 5 — countdown, its own surface once the date has been revealed */}
        {dateObject && (
          <section className="te-section te-save" data-section="countdown" aria-label="Countdown to the wedding day">
            <h2 className="te-script te-script--sm" {...IN("up")}>{saveDateLabel}</h2>
            <Flourish className="te-save__rule" />
            {target && <div {...IN("up", 0.06)}><Clock target={target} /></div>}
            <p className="te-hint" {...IN("fade", 0.1)}>{countdownIntro}</p>
          </section>
        )}

        {/* 6 — prologue */}
        <section className="te-section te-prologue" data-section="pembuka" aria-label="Word of welcome">
          <p className="te-kicker" {...IN("up")}>{quoteTitle || openingKicker}</p>
          {profile.quote_text ? (
            <blockquote className="te-quote" {...IN("fade", 0.06)}>
              <p>{profile.quote_text}</p>
              {profile.quote_source && <cite>{profile.quote_source}</cite>}
            </blockquote>
          ) : (
            <>
              {profile.opening_title && (
                <h2 className="te-script te-script--sm" {...IN("up", 0.04)}>{profile.opening_title}</h2>
              )}
              {profile.opening_description && (
                <p className="te-body" {...IN("fade", 0.1)}>{profile.opening_description}</p>
              )}
            </>
          )}
          <Flourish className="te-prologue__rule" />
        </section>

        {/* 7 — mempelai */}
        <section className="te-section te-couple" data-section="mempelai" aria-label="The couple">
          <p className="te-kicker" {...IN("up")}>{mempelaiKicker}</p>
          {mempelaiIntro && <p className="te-body" {...IN("fade", 0.06)}>{mempelaiIntro}</p>}
          <div className="te-couple__row">
            {[
              { key: "bride", name: profile.bride_full_name || brideName, photo: brideShot, parents: profile.bride_parents, ig: brideIg },
              { key: "groom", name: profile.groom_full_name || groomName, photo: groomShot, parents: profile.groom_parents, ig: groomIg },
            ]
              .filter((person) => !!person.name)
              .map((person, index) => (
                <article className={`te-person${index === 1 ? " te-person--right" : ""}`} key={person.key}>
                  <Frame src={person.photo} alt={person.name} />
                  <h3 className="te-person__name" {...IN("up", 0.06)}>{person.name}</h3>
                  {person.parents && (
                    <>
                      <p className="te-person__label" {...IN("fade", 0.1)}>{parentsLabel}</p>
                      <p className="te-person__parents" {...IN("fade", 0.12)}>{person.parents}</p>
                    </>
                  )}
                  {person.ig && (
                    <a
                      className="te-person__ig"
                      href={`https://instagram.com/${person.ig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...IN("fade", 0.16)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.2 3.2 0 0 0-.7-1.2 3.2 3.2 0 0 0-1.2-.7c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                      </svg>
                      @{person.ig}
                    </a>
                  )}
                  {index === 0 && <span className="te-couple__amp" aria-hidden="true">&amp;</span>}
                </article>
              ))}
          </div>
        </section>

        {/* 8 — love story as acts */}
        {stories.length > 0 && (
          <section className="te-section te-story" data-section="story" aria-label="Our story">
            <img className="te-story__divider" src={TEATRO_ASSETS.divider} alt="" aria-hidden="true" {...IN("fade")} />
            <p className="te-kicker" {...IN("up")}>{storyKicker}</p>
            <h2 className="te-script te-script--md" {...IN("up", 0.04)}>{storyTitle}</h2>
            {storyIntro && <p className="te-body" {...IN("fade", 0.08)}>{storyIntro}</p>}
            <ol className="te-acts">
              {stories.map((story, index) => (
                <li className="te-act" key={`${story.title || "act"}-${index}`}>
                  <span className="te-act__numeral" {...IN("up")}>{ROMAN[index] || String(index + 1)}</span>
                  {story.title && <h3 className="te-act__title" {...IN("up", 0.04)}>{story.title}</h3>}
                  {story.image_url && (
                    <div className="te-act__frame" {...IN("fade", 0.06)}>
                      <DeckledFrame src={story.image_url} alt={story.title || ""} ratio="16 / 10" />
                    </div>
                  )}
                  {story.description && <p className="te-act__body" {...IN("fade", 0.1)}>{story.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 9 — the venue and the events */}
        <section className="te-section te-venue" data-section="acara" aria-label="Wedding events">
          <p className="te-kicker" {...IN("up")}>{eventsKicker}</p>
          <div className="te-venue__art" {...IN("fade", 0.05)}>
            <img src={TEATRO_ASSETS.venue} alt="" aria-hidden="true" loading="lazy" draggable={false} />
          </div>
          {eventsTitle && <h2 className="te-display" {...IN("up", 0.08)}>{eventsTitle}</h2>}          {eventsIntro && <p className="te-body" {...IN("fade", 0.1)}>{eventsIntro}</p>}
          <div className="te-events">
            {events.map((event, index) => (
              <article className="te-event" key={`${event.name || "event"}-${index}`}>
                {event.name && <h3 className="te-event__name" {...IN("up")}>{event.name}</h3>}
                {event.date && <p className="te-event__date" {...IN("fade", 0.04)}>{longDateEn(event.date, true)}</p>}
                {event.time && <p className="te-event__time" {...IN("fade", 0.06)}>{event.time}</p>}
                {event.venue && <p className="te-event__venue" {...IN("up", 0.08)}>{event.venue}</p>}
                {event.address && <p className="te-event__address" {...IN("fade", 0.1)}>{event.address}</p>}
                {event.maps_url && (
                  <a
                    className="te-link"
                    href={event.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...IN("fade", 0.12)}
                  >
                    {mapsLabel}
                  </a>
                )}
              </article>
            ))}
          </div>
          {eventsNote && <p className="te-note" {...IN("fade", 0.1)}>{eventsNote}</p>}
        </section>

        {/* 10 — turut mengundang */}
        {honored.length > 0 && (
          <section className="te-section te-inviting" data-section="inviting" aria-label="With the blessing of">
            <div className="te-plate te-plate--plain">
              <p className="te-kicker" {...IN("up")}>{invitingKicker}</p>
              <h2 className="te-script te-script--sm" {...IN("up", 0.04)}>{invitingTitle}</h2>
              {invitingIntro && <p className="te-body" {...IN("fade", 0.08)}>{invitingIntro}</p>}
              <ul className="te-families">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`} {...IN("fade", Math.min(0.05 * index, 0.24))}>
                    <span className="te-families__dot" aria-hidden="true" />
                    {family}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 11 — programme / rundown */}
        {rundown.length > 0 && (
          <section className="te-section te-rundown" data-section="rundown" aria-label="Order of the day">
            <div className="te-menu" {...IN("up")}>
              <img
                className="te-menu__frame"
                src={TEATRO_ASSETS.menuFrame}
                alt=""
                aria-hidden="true"
                width={675}
                height={1200}
                draggable={false}
              />
              <div className="te-menu__body">
                <p className="te-kicker">{rundownKicker}</p>
                <h2 className="te-script te-script--sm">{rundownTitle}</h2>
                {rundownIntro && <p className="te-body te-menu__intro">{rundownIntro}</p>}
                <ol className="te-programme">
                  {rundown.map((item, index) => (
                    <li className="te-programme__row" key={`${item.time || "row"}-${index}`}>
                      {item.time && <span className="te-programme__time">{item.time}</span>}
                      {item.description && <span className="te-programme__text">{item.description}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* 12 — gallery */}
        {gallery.length > 0 && (
          <section className="te-section te-gallery" data-section="galeri" aria-label="Gallery">
            <p className="te-kicker" {...IN("up")}>{galleryKicker}</p>
            <h2 className="te-script te-script--md" {...IN("up", 0.04)}>{galleryTitle}</h2>
            {galleryIntro && <p className="te-body" {...IN("fade", 0.08)}>{galleryIntro}</p>}
            {framePhoto && (
              <div className="te-gallery__feature" {...IN("zoom", 0.1)}>
                <DeckledFrame src={framePhoto} alt={coupleLabel} ratio="4 / 5" />
              </div>
            )}
            <div className={`te-gallery__grid${gallery.length === 1 ? " is-single" : ""}`}>
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className="te-gallery__item"
                  key={`${photo}-${index}`}
                  onClick={() => setLightbox(index)}
                  aria-label={`Photo ${index + 1}`}
                  {...IN("fade", Math.min(0.04 * index, 0.2))}
                >
                  <img src={photo} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
            {galleryQuote && <p className="te-script te-quoteScript" {...IN("fade", 0.1)}>{galleryQuote}</p>}
          </section>
        )}

        {/* 13 — the film */}
        {hasVideo && film && (
          <section className="te-section te-film" data-section="video" aria-label="The wedding film">
            <p className="te-kicker" {...IN("up")}>{videoKicker}</p>
            {videoTitle && <h2 className="te-script te-script--md" {...IN("up", 0.04)}>{videoTitle}</h2>}
            {videoIntro && <p className="te-body" {...IN("fade", 0.08)}>{videoIntro}</p>}
            <div className="te-film__stage" {...IN("fade", 0.1)}>
              {filmOn && film.kind === "file" ? (
                <video className="te-film__media" src={film.src} autoPlay controls playsInline poster={filmPoster} />
              ) : filmOn && youtubeId ? (
                <iframe
                  className="te-film__media te-film__iframe"
                  src={embedUrl}
                  title={videoTitle || coupleLabel}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : filmOn && film.kind === "embed" ? (
                <iframe
                  className="te-film__media te-film__iframe"
                  src={film.src}
                  title={videoTitle || coupleLabel}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {filmPoster && <img className="te-film__poster" src={filmPoster} alt="" aria-hidden="true" />}
                  <ReelPlay onClick={() => setFilmOn(true)} />
                </>
              )}
            </div>
          </section>
        )}

        {/* 14 — wedding gift */}
        {hasGift && (
          <section className="te-section te-gift" data-section="gift" aria-label="Wedding registry">
            <p className="te-kicker" {...IN("up")}>{giftKicker}</p>
            <div className="te-gift__art" {...IN("fade", 0.05)}>
              <img src={TEATRO_ASSETS.gift} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </div>
            <h2 className="te-display" {...IN("up", 0.08)}>{giftTitle}</h2>
            {giftIntro && <p className="te-body" {...IN("fade", 0.1)}>{giftIntro}</p>}
            {giftSignature && <p className="te-script te-quoteScript" {...IN("fade", 0.12)}>{giftSignature}</p>}
            <button
              type="button"
              className="te-btn"
              onClick={() => setGiftOpen((value) => !value)}
              aria-expanded={giftOpen}
              {...IN("up", 0.14)}
            >
              {giftButton}
            </button>
            {giftOpen && (
              <div className="te-gift__details">
                {accounts.map((account, index) => (
                  <button
                    type="button"
                    className="te-account"
                    key={`${account.account_number || "acc"}-${index}`}
                    onClick={() => copyText(account.account_number || "", accountToast)}
                    {...IN("up", Math.min(0.05 * index, 0.2))}
                  >
                    {account.provider_name && <span className="te-account__bank">{account.provider_name}</span>}
                    {account.account_number && <span className="te-account__number">{account.account_number}</span>}
                    {account.account_name && <span className="te-account__name">{account.account_name}</span>}
                  </button>
                ))}
                {giftAddress && (
                  <div className="te-account te-account--address" {...IN("up", 0.08)}>
                    {profile.gift_address_name && <span className="te-account__bank">{profile.gift_address_name}</span>}
                    <span className="te-account__name">{giftAddress}</span>
                    <button
                      type="button"
                      className="te-link"
                      onClick={() => copyText(giftAddress, addressToast)}
                    >
                      {addressButton}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 15 — dress code */}
        {hasDresscode && (
          <section className="te-section te-dress" data-section="dresscode" aria-label="Dress code">
            <div className="te-dress__art" {...IN("fade")}>
              <img src={TEATRO_ASSETS.dressCode} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </div>
            <h2 className="te-script te-script--sm" {...IN("up", 0.04)}>{dressKicker}</h2>
            {dressIntro && <p className="te-body" {...IN("fade", 0.08)}>{dressIntro}</p>}
            {dressTitle && <p className="te-dress__title" {...IN("up", 0.1)}>{dressTitle}</p>}
            {dressNote && <p className="te-note" {...IN("fade", 0.12)}>{dressNote}</p>}
            {dressColors.length > 0 && (
              <ul className="te-swatches">
                {dressColors.map((color, index) => (
                  <li className="te-swatch" key={`${color.hex || color.name}-${index}`} {...IN("up", Math.min(0.05 * index, 0.2))}>
                    <span className="te-swatch__dot" style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                    {color.name && <span className="te-swatch__name">{color.name}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 16 — wishes */}
        <section className="te-section te-wishes" data-section="wishes" aria-label="Wishes for the couple">
          <p className="te-kicker" {...IN("up")}>{wishesKicker}</p>
          <h2 className="te-script te-script--lg" {...IN("up", 0.04)}>{wishesTitle}</h2>
          {wishesIntro && <p className="te-body" {...IN("fade", 0.08)}>{wishesIntro}</p>}
          <div className="te-wishes__card" {...IN("up", 0.12)}>
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

        {/* 17 — closing */}
        <section className="te-closing" data-section="closing" aria-label="Closing">
          <p className="te-script te-script--md" {...IN("up")}>{closingKicker}</p>
          <DeckledFrame src={closingPhoto} alt="" className="te-closing__mat" ratio="3 / 4" />
          {closingMessage && <p className="te-body" {...IN("fade", 0.08)}>{closingMessage}</p>}
          {closingSee && <p className="te-quoteScript" {...IN("fade", 0.12)}>{closingSee}</p>}
          <p className="te-closing__names" {...IN("up", 0.16)}>{coupleLabel}</p>
        </section>

        <footer className="te-footer">
          <a
            className="te-footer__link"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Aksaraa Wedding on WhatsApp"
          >
            <span className="te-footer__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
            </span>
            <span className="te-footer__cta">Wedding by Aksaraa</span>
          </a>
          <p className="te-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
        </footer>
      </div>

      {confetti && <Confetti />}

      {opened && trackUrl && (
        <button
          type="button"
          className={`te-music${playing ? " is-on" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause the music" : "Play the music"}
          aria-pressed={playing}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            {playing ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M16 9.5 21 14.5M21 9.5 16 14.5" />}
          </svg>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="te-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="te-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>×</button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="te-lightbox__nav te-lightbox__nav--prev"
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
              className="te-lightbox__nav te-lightbox__nav--next"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
          <span className="te-lightbox__count" aria-hidden="true">{lightbox + 1} / {gallery.length}</span>
        </div>
      )}

      {toast && <div className="te-toast" role="status">{toast}</div>}

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
          anchor="center"
        />
      )}
    </div>
  )
}
