"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
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
  gcalLink,
  groomPhoto as groomPhotoOf,
  videoSource,
  type VideoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import { copyPlainText } from "@/lib/clipboard"
import "./film-roll.css"

const WISH_ME = "Dear Guest"

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

// "24 . 12 . 2026" — the reference's spaced dot date on the gate and credits.
function dotDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} . ${pad2(d.getMonth() + 1)} . ${d.getFullYear()}`
}

// "24.12.2026" — the compact date inside the poster callout.
function tightDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

function longDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${EN_DAYS[d.getDay()]}, ${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function dayName(value?: string | null): string {
  const d = parseDate(value)
  return d ? EN_DAYS[d.getDay()] : ""
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th"
  if (n % 10 === 1) return "st"
  if (n % 10 === 2) return "nd"
  if (n % 10 === 3) return "rd"
  return "th"
}

function cardDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${EN_DAYS[d.getDay()]}, ${EN_MONTHS[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()}`
}

function timeRange(from?: string, to?: string): string {
  const start = (from || "").trim()
  const end = (to || "").trim()
  if (!start) return end
  if (!end) return start
  return `${start} – ${end}`
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return (t.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  return t.replace(/^@/, "")
}

function shorten(value: string, max: number): string {
  const text = String(value || "").replace(/\s+/g, " ").trim()
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text
}

// The deck wraps around both ends: distance from the current scene, in [-n/2, n/2).
function wrap(value: number, half: number): number {
  return ((((value + half) % (half * 2)) + half * 2) % (half * 2)) - half
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Balances two lines by the smallest |left − right| (reference `splitTitle`).
// Cover slots must keep their positions: an empty slot is a gap, not a reason
// to shift every slot after it (the cover_photos array is index-addressed).
function coverSlotsOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") return entry.trim()
      if (Array.isArray(entry)) return (entry.find((item) => typeof item === "string" && item.trim()) || "").trim()
      return ""
    })
  }
  if (typeof value === "string") {
    const text = value.trim()
    if (!text) return []
    if (text.startsWith("[")) {
      try {
        return coverSlotsOf(JSON.parse(text))
      } catch {
        return [text]
      }
    }
    return [text]
  }
  return []
}

// "Sand, Terracotta and Cocoa" — the palette sentence for an empty intro.
function nameList(values: string[]): string {
  const list = values.filter(Boolean)
  if (list.length === 0) return ""
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
}

function splitTitle(value: string): string[] {
  const words = String(value || "").replace(/\s+/g, " ").trim().split(" ")
  if (words.length < 2) return [words[0] || ""]
  let cut = 1
  let best = Infinity
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ").length
    const right = words.slice(i).join(" ").length
    const diff = Math.abs(left - right)
    if (diff < best) {
      best = diff
      cut = i
    }
  }
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")]
}

type SceneKind =
  | "poster"
  | "title"
  | "cast"
  | "chapter"
  | "event"
  | "rundown"
  | "strip"
  | "trailer"
  | "gift"
  | "dress"
  | "wishes"
  | "credits"

type Scene = {
  id: string
  kind: SceneKind
  kicker: string
  title: string[]
  cap: [number, number]
  img: string
  pos: string
  dim: number
  lead?: string
  flip?: boolean
  meta?: [string, string][]
  facts?: { label: string; value: string }[]
  person?: "groom" | "bride"
}

// Reference caps per scene kind: mobile / desktop.
const CAPS: Record<SceneKind, [number, number]> = {
  poster: [48, 90],
  title: [48, 90],
  cast: [44, 76],
  event: [40, 76],
  rundown: [40, 76],
  strip: [40, 76],
  trailer: [40, 76],
  chapter: [38, 68],
  gift: [38, 72],
  dress: [38, 72],
  wishes: [38, 72],
  credits: [44, 80],
}

function titlePx(kind: SceneKind, lines: string[], vw: number, desktop: boolean): number {
  const cap = CAPS[kind]
  const longest = Math.max(...lines.map((line) => String(line).length), 1)
  const size = desktop
    ? Math.min(cap[1], (kind === "poster" ? 395 : 440) / (longest * 0.56))
    : Math.min(cap[0], (Math.min(vw, 430) - 92) / (longest * 0.6))
  return Math.max(18, size)
}

function Title({ lines, size }: { lines: string[]; size: number }) {
  if (!lines.length || !lines[0]) return null
  return (
    <div
      className="fr-h2"
      role="heading"
      aria-level={2}
      aria-label={lines.join(" ")}
      style={{ fontSize: `${size.toFixed(1)}px` }}
    >
      {lines.map((line, lineIndex) => (
        <span className="fr-h2__line" aria-hidden="true" key={lineIndex}>
          {Array.from(line).map((ch, charIndex) => (
            <span className={ch === " " ? "fr-ch is-sp" : "fr-ch"} key={charIndex}>
              <span className="fr-ch__in">
                <i>{ch}</i>
                <i>{ch}</i>
              </span>
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}

function ArrowSvg() {
  return (
    <svg viewBox="0 0 14 13" aria-hidden="true" focusable="false">
      <path d="M1 6.5h11M7.5 1.5l5 5-5 5" />
    </svg>
  )
}

function StarRow() {
  return <span className="fr-stars" aria-hidden="true">★★★★★</span>
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
    <div className="fr-in fr-cd" data-p="24" aria-label="Countdown to the wedding day">
      {units.map((unit) => (
        <div className="fr-cd__c" key={unit.label}>
          <b>{target ? unit.value : "--"}</b>
          <span className="fr-eyeb">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function FilmRoll(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const homeRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const itemRefs = useRef<Array<HTMLElement | null>>([])
  const boxRef = useRef({ H: 0, margin: 0 })
  const toastTimer = useRef<number | null>(null)
  const storyTimer = useRef<number | null>(null)
  const storyHoldTimer = useRef<number | null>(null)

  const [viewport, setViewport] = useState({ vw: 390, desktop: false })
  const [opened, setOpened] = useState(false)
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [smallOpen, setSmallOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toast, setToast] = useState("")
  const [storyIndex, setStoryIndex] = useState(0)
  const [storyPaused, setStoryPaused] = useState(false)
  const [eventIndex, setEventIndex] = useState(0)
  const [videoLive, setVideoLive] = useState(false)
  const [btnOn, setBtnOn] = useState(false)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = useMemo(() => coverSlotsOf(profile.cover_photos), [profile.cover_photos])
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])

  const coverShot = slots[0] || coverPhoto(profile)
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
  const dressIntroWritten = (profile.dresscode?.description || "").trim()
  const dressTitleWritten = (profile.dresscode?.title || "").trim()
  const dressNoteWritten = (tc.dresscode_note || "").trim()
  const hasDresscode =
    profile.dresscode_visible !== false &&
    (dressColors.length > 0 || !!dressIntroWritten || !!dressTitleWritten || !!dressNoteWritten)
  const dressNote = dressNoteWritten

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const film: VideoSource | null = videoSource(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!film
  // The cover film follows the couple's video toggle: hiding the video section
  // falls back to the cover photo. File videos play in a <video>; provider
  // links become a silent, chrome-less background embed.
  const gateFilm = gates.video !== false && profile.video_section_visible !== false && film ? film : null
  const gateEmbed =
    gateFilm && gateFilm.kind === "embed"
      ? gateFilm.src
          .replace(/([?&])controls=1/, "$1controls=0")
          .concat(
            /player\.vimeo\.com/.test(gateFilm.src)
              ? "&background=1"
              : "&disablekb=1&fs=0&iv_load_policy=3&showinfo=0"
          )
      : ""

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const groomFull = (profile.groom_full_name || "").trim() || groomName
  const brideFull = (profile.bride_full_name || "").trim() || brideName
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const editorInitials = (profile.couple_initials || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 2)
  const initials =
    editorInitials ||
    [(groomName || groomFull).charAt(0), (brideName || brideFull).charAt(0)].filter(Boolean).join("")
  const guestName = (profile.guest_name || "").trim()
  const hasGuest = !!guestName

  const dateObject = parseDate(profile.estimated_wedding_date)
  const dateDots = dotDate(profile.estimated_wedding_date)
  const dateTight = tightDate(profile.estimated_wedding_date)
  const dateLongText = longDate(profile.estimated_wedding_date)
  const mainEvent = events[0]
  const calendarSession =
    mainEvent && (mainEvent.date || "").trim()
      ? mainEvent
      : dateObject
        ? { date: profile.estimated_wedding_date }
        : undefined
  const calendarUrl = gcalLink(calendarSession, groomName, brideName)

  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  // ── copy: every visible string is reachable from the editor ──
  const coverTitle = (tc.cover_title || "").trim() || (tc.cover_kicker || "").trim() || "The Wedding Of"
  const saveDateLabel = (tc.save_date_label || "").trim() || "Save the Date"
  const openLabel = (tc.open_button || "").trim() || "Enter"
  const dearLabel = (tc.cover_apology || "").trim() || "Dear"
  const openingKicker = (tc.opening_kicker || "").trim() || "Prologue"
  const openingBody =
    (tc.welcome_message || "").trim() ||
    "Before the credits roll and the lights come up, there was a first look, a first laugh, and a promise we kept rehearsing until it became a life."
  const castKicker = (tc.mempelai_kicker || "").trim() || "Starring"
  const parentsLabel = (tc.parents_label || "").trim() || "With the blessing of"
  const storyKicker = (tc.story_kicker || "").trim() || "Scene"
  const storyTitle = splitTitle((tc.love_story_title || "").trim() || "Our Story")
  const storyLead = (tc.story_intro || "").trim() || "Three scenes that brought us to the same frame."
  const eventsKicker = (tc.events_kicker || "").trim() || "Save the Date"
  const eventsTitle = splitTitle(
    (tc.events_title || "").trim() || (events.length > 1 ? "The Celebration" : (events[0]?.name || "").trim() || "The Celebration")
  )
  const eventsIntro = (tc.events_intro || "").trim() || "We would be honoured to have you with us as we say our vows."
  const mapsLabel = (tc.maps_label || "").trim() || "Open Map"
  const calendarLabel = (tc.events_note || "").trim() || "Save to calendar"
  const rundownKicker = (tc.rundown_kicker || "").trim() || "The Programme"
  const rundownTitle = splitTitle((tc.rundown_title || "").trim() || "Order of the Day")
  const rundownIntro = (tc.rundown_intro || "").trim() || "How the day will unfold, from the first arrival to the last farewell."
  const galleryKicker = (tc.gallery_kicker || "").trim() || "Stills"
  const galleryTitle = splitTitle((tc.gallery_title || "").trim() || "Precious Moments")
  const galleryLead = (tc.gallery_quote || "").trim() || (tc.gallery_intro || "").trim() || "Every love story is beautiful, but ours is our favourite."
  const videoKicker = (tc.video_kicker || "").trim() || "Action!"
  const videoTitle = splitTitle((tc.video_title || "").trim() || "Trailer")
  const videoIntro = (tc.video_intro || "").trim() || "The day as it happened, kept in motion."
  const giftKicker = (tc.gift_kicker || "").trim() || "With Love"
  const giftTitle = splitTitle((tc.gift_intro_title || "").trim() || "Wedding Gift")
  const giftLead =
    (tc.gift_intro_description || "").trim() ||
    "Your blessings are the most beautiful gift to us. Should you wish to give a token of love, you may do so here."
  const giftSignature = (tc.gift_signature || "").trim() || "With love and gratitude"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dresscode"
  const dressHeading = dressTitleWritten || "What to Wear"
  const dressColorNames = dressColors.map((color) => (color.name || "").trim()).filter(Boolean)
  const dressIntro =
    dressIntroWritten ||
    (dressColorNames.length
      ? `We would love to see you in ${nameList(dressColorNames)}.`
      : "We would love to see you in the palette below.")
  const wishesKicker = (tc.wishes_kicker || "").trim() || "Prayers & Wishes"
  const wishesTitle = splitTitle((tc.wishes_title || "").trim() || "Wishes")
  const wishesIntro = (tc.wishes_intro || "").trim() || "Write your best prayers and wishes for us."
  const creditsKicker = (tc.closing_kicker || "").trim() || coverTitle
  const closingSee = (tc.closing_see || "").trim() || "See you at the pictures."
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

  // Each scene takes its own cover slot (the editor's Foto Sampul list); an
  // empty slot falls back to the cover so no scene renders blank.
  const scenes = useMemo<Scene[]>(() => {
    const slotPhoto = (index: number) => (slots[index] || "").trim() || coverShot
    const list: Scene[] = []

    list.push({
      id: "poster",
      kind: "poster",
      kicker: coverTitle,
      title: [groomName || coupleLabel, brideName ? `& ${brideName}` : ""].filter(Boolean),
      cap: CAPS.poster,
      img: coverShot,
      pos: "50% 30%",
      dim: 1,
      facts: [
        dateDots
          ? { label: saveDateLabel, value: `${dayName(profile.estimated_wedding_date)}\n${dateTight}` }
          : null,
        hasGuest ? { label: dearLabel, value: shorten(guestName, 40) } : null,
        mainEvent?.venue || mainEvent?.address
          ? {
              label: (mainEvent?.name || "").trim() || "Venue",
              value: shorten(String(mainEvent?.venue || mainEvent?.address).split("\n")[0], 40),
            }
          : null,
      ].filter(Boolean) as { label: string; value: string }[],
      meta: [
        ["Date", dateTight],
        ["Day", dayName(profile.estimated_wedding_date)],
      ].filter((row) => !!row[1]) as [string, string][],
    })

    list.push({
      id: "prologue",
      kind: "title",
      kicker: openingKicker,
      title: [],
      cap: CAPS.title,
      img: slotPhoto(1),
      pos: "50% 35%",
      dim: 0.3,
      lead: openingBody,
    })

    if (groomFull || brideFull) {
      list.push({
        id: "groom",
        kind: "cast",
        kicker: castKicker,
        title: splitTitle(groomFull || groomName),
        cap: CAPS.cast,
        img: groomShot,
        pos: "50% 22%",
        dim: 1,
        person: "groom",
      })
    }
    if (brideFull || brideName) {
      list.push({
        id: "bride",
        kind: "cast",
        kicker: castKicker,
        title: splitTitle(brideFull || brideName),
        cap: CAPS.cast,
        img: brideShot,
        pos: "50% 22%",
        dim: 1,
        person: "bride",
        flip: true,
      })
    }

    if (stories.length) {
      list.push({
        id: "story",
        kind: "chapter",
        kicker: storyKicker,
        title: storyTitle,
        cap: CAPS.chapter,
        img: (stories[0]?.image_url || "").trim() || slotPhoto(1),
        pos: "50% 35%",
        dim: 0.6,
        lead: storyLead,
      })
    }

    if (events.length) {
      list.push({
        id: "events",
        kind: "event",
        kicker: eventsKicker,
        title: eventsTitle,
        cap: CAPS.event,
        img: slotPhoto(2),
        pos: "50% 40%",
        dim: 0.62,
        lead: eventsIntro,
      })
    }

    if (rundown.length) {
      list.push({
        id: "rundown",
        kind: "rundown",
        kicker: rundownKicker,
        title: rundownTitle,
        cap: CAPS.rundown,
        img: slotPhoto(3),
        pos: "50% 40%",
        dim: 0.5,
        lead: rundownIntro,
      })
    }

    if (gallery.length) {
      list.push({
        id: "gallery",
        kind: "strip",
        kicker: galleryKicker,
        title: galleryTitle,
        cap: CAPS.strip,
        img: coverShot,
        pos: "50% 35%",
        dim: 0.28,
        lead: galleryLead,
      })
    }

    if (hasVideo && film) {
      list.push({
        id: "trailer",
        kind: "trailer",
        kicker: videoKicker,
        title: videoTitle,
        cap: CAPS.trailer,
        img: slotPhoto(4),
        pos: "50% 35%",
        dim: 0.3,
        lead: videoIntro,
      })
    }

    if (hasGift) {
      list.push({
        id: "gift",
        kind: "gift",
        kicker: giftKicker,
        title: giftTitle,
        cap: CAPS.gift,
        img: slotPhoto(5),
        pos: "50% 35%",
        dim: 0.4,
        lead: giftLead,
      })
    }

    if (hasDresscode) {
      list.push({
        id: "dress",
        kind: "dress",
        kicker: dressKicker,
        title: splitTitle(dressHeading),
        cap: CAPS.dress,
        img: slotPhoto(6),
        pos: "50% 35%",
        dim: 0.42,
        lead: dressIntro,
      })
    }

    list.push({
      id: "wishes",
      kind: "wishes",
      kicker: wishesKicker,
      title: wishesTitle,
      cap: CAPS.wishes,
      img: slotPhoto(7),
      pos: "50% 35%",
      dim: 0.36,
      lead: wishesIntro,
    })

    list.push({
      id: "credits",
      kind: "credits",
      kicker: creditsKicker,
      title: [],
      cap: CAPS.credits,
      img: slotPhoto(8),
      pos: "50% 35%",
      dim: 0.46,
    })

    return list
  }, [
    brideFull,
    brideName,
    brideShot,
    brideIg,
    castKicker,
    coverShot,
    coverTitle,
    creditsKicker,
    dateDots,
    dateTight,
    dearLabel,
    dressHeading,
    dressIntro,
    events,
    eventsIntro,
    eventsKicker,
    eventsTitle,
    film,
    gallery,
    galleryKicker,
    galleryLead,
    galleryTitle,
    giftKicker,
    giftLead,
    giftTitle,
    groomFull,
    groomName,
    groomShot,
    guestName,
    hasDresscode,
    hasGift,
    hasGuest,
    hasVideo,
    mainEvent,
    openingBody,
    openingKicker,
    profile.estimated_wedding_date,
    rundown,
    rundownIntro,
    rundownKicker,
    rundownTitle,
    saveDateLabel,
    slots,
    stories,
    storyKicker,
    storyLead,
    storyTitle,
    videoIntro,
    videoKicker,
    videoTitle,
    wishesIntro,
    wishesKicker,
    wishesTitle,
    coupleLabel,
  ])

  const sceneCount = scenes.length
  const activeScene = scenes[Math.min(active, sceneCount - 1)]

  const storySceneActive = activeScene?.kind === "chapter"
  const eventSceneActive = activeScene?.kind === "event"

  const activeStory = stories[storyIndex] || stories[0]
  const storyDuration = Math.round(
    Math.min(14, Math.max(6, (activeStory?.description || "").length / 24)) * 1000
  )
  const stripDuration = `${Math.max(36, Math.min(16, Math.max(8, gallery.length)) * 5)}s`

  const stripRow = useCallback(
    (direction: 1 | 2) => {
      const items = gallery.map((src, index) => ({ src, index }))
      if (!items.length) return [] as { src: string; index: number }[]
      let row: { src: string; index: number }[] = []
      const seed = direction === 1 ? items : items.slice().reverse()
      while (row.length < 8) row = row.concat(seed)
      row = row.slice(0, 16)
      return row.concat(row)
    },
    [gallery]
  )

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2200)
  }, [])

  // A wheel/touch inside the story pauses the auto-advance, then resumes it.
  const holdStory = useCallback(() => {
    setStoryPaused(true)
    if (storyHoldTimer.current) window.clearTimeout(storyHoldTimer.current)
    storyHoldTimer.current = window.setTimeout(() => setStoryPaused(false), 1800)
  }, [])

  const copyText = useCallback(
    async (value: string, message: string) => {
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  const playMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    )
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else {
      audio.pause()
      setPlaying(false)
    }
  }, [playMusic])

  const share = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const title = [coverTitle, coupleLabel].filter(Boolean).join(" ")
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({ title, url }).catch(() => undefined)
      return
    }
    void copyText(url, "Link copied")
  }, [copyText, coupleLabel, coverTitle])

  // ── deck engine (reference motion: wrapped distance → translate3d) ──
  const engineRef = useRef({
    current: 0,
    target: 0,
    speed: 0,
    lspeed: 0,
    intro: false,
    running: false,
    entered: false,
    gest: false,
    done: false,
    anchor: 0,
    lockUntil: 0,
    lastKey: 0,
    dragging: false,
    scrolling: false,
    wordDone: false,
  })
  const blockRef = useRef({ menu: false, lightbox: false, video: false })
  const engineApiRef = useRef<{ measure: () => void; recache: () => void; place: () => void } | null>(null)
  const activeRef = useRef(0)
  const scenesRef = useRef<Scene[]>(scenes)
  scenesRef.current = scenes

  useEffect(() => {
    blockRef.current = { menu: menuOpen || smallOpen, lightbox: lightbox !== null, video: videoLive }
  }, [menuOpen, smallOpen, lightbox, videoLive])

  // Jump to a scene the short way round (the deck wraps; reference `jump`).
  const goToScene = useCallback((index: number) => {
    const state = engineRef.current
    const n = scenesRef.current.length
    setMenuOpen(false)
    setSmallOpen(false)
    if (!n || index < 0 || !state.entered) return
    const currentIndex = ((-Math.round(state.target) % n) + n) % n
    let delta = index - currentIndex
    if (Math.abs(delta) > n / 2) delta = delta > 0 ? delta - n : delta + n
    state.gest = false
    state.done = false
    state.target = Math.round(state.target) - delta
  }, [])

  useEffect(() => {
    const measureViewport = () => {
      const vw = rootRef.current?.clientWidth || window.innerWidth
      setViewport({ vw, desktop: vw >= 992 })
    }
    measureViewport()
    window.addEventListener("resize", measureViewport)
    return () => window.removeEventListener("resize", measureViewport)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setBtnOn(true), 2600)
    return () => window.clearTimeout(timer)
  }, [])

  // Character roll: each glyph cycles through its duplicate once and settles.
  const rollRef = useRef<{
    els: HTMLElement[]
    delay: number[]
    rep: number[]
    t0: number
    base: number
    span: number
  } | null>(null)

  const startRoll = useCallback(
    (els: HTMLElement[], min: number, max: number, step: number, base: number, span: number) => {
      if (!els.length) return
      const order = els.map((_, index) => index).sort(() => Math.random() - 0.5)
      const delay: number[] = []
      order.forEach((index, position) => {
        delay[index] = position * step
      })
      rollRef.current = {
        els,
        delay,
        rep: els.map(() => min + Math.floor(Math.random() * (max - min + 1))),
        t0: performance.now(),
        base,
        span,
      }
    },
    []
  )

  // Gate wordmark rolls in on the same clock as the deck.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const wordChars = Array.from(root.querySelectorAll<HTMLElement>(".fr-wch__in"))
    if (wordChars.length) {
      startRoll(wordChars, 6, 10, 0.1 * Math.min(1, 9 / wordChars.length), 0, 50)
    }
  }, [startRoll])

  const playSceneTitle = useCallback(
    (index: number) => {
      const item = itemRefs.current[index]
      if (!item) return
      const chars = Array.from(item.querySelectorAll<HTMLElement>(".fr-ch__in"))
      startRoll(chars, 8, 14, 0.04, 0, 50)
    },
    [startRoll]
  )

  useEffect(() => {
    if (!opened) return
    const first = window.setTimeout(() => playSceneTitle(0), 700)
    return () => window.clearTimeout(first)
  }, [opened, playSceneTitle])

  useEffect(() => {
    const root = rootRef.current
    const home = homeRef.current
    if (!root || !home) return

    const state = engineRef.current
    let raf = 0
    let frame = 0
    let wheelTimer: number | null = null
    let cache: Array<{ el: HTMLElement; px: Array<[HTMLElement, number]> }> = []

    const cacheItems = () => {
      cache = Array.from(home.querySelectorAll<HTMLElement>(".fr-item")).map((el) => ({
        el,
        px: Array.from(el.querySelectorAll<HTMLElement>("[data-p]")).map(
          (node) => [node, Number(node.getAttribute("data-p")) || 0] as [HTMLElement, number]
        ),
      }))
    }

    const measure = () => {
      const vw = root.clientWidth || window.innerWidth
      const vh = root.clientHeight || window.innerHeight
      const desktop = vw >= 992
      const H = Math.round(vh * (desktop ? 0.85 : 0.9))
      const side = desktop ? 61 : 16
      const gap = desktop ? 48 : 8
      boxRef.current = { H, margin: (vh - H) / 2 }
      root.style.setProperty("--fr-item-h", `${H}px`)
      root.style.setProperty("--fr-side", `${side}px`)
      root.style.setProperty("--fr-gap", `${gap}px`)
    }

    const place = () => {
      if (!boxRef.current.H) measure()
      const box = boxRef.current
      const n = cache.length
      if (!box.H || !n) return
      const mobile = (root.clientWidth || window.innerWidth) < 992
      const blur =
        (!mobile || state.intro) && state.lspeed > 0.004
          ? `blur(${Math.min(state.lspeed * 10, 24).toFixed(2)}px)`
          : ""
      for (let i = 0; i < n; i++) {
        const item = cache[i]
        const w = wrap(state.current + i, n / 2)
        if (Math.abs(w) > 1.6) {
          if (item.el.style.visibility !== "hidden") {
            item.el.style.visibility = "hidden"
            item.el.style.pointerEvents = "none"
          }
          continue
        }
        if (item.el.style.visibility !== "visible") {
          item.el.style.visibility = "visible"
          item.el.style.pointerEvents = ""
        }
        item.el.style.transform = `translate3d(0,${(w * box.H + box.margin).toFixed(2)}px,0)`
        if (item.el.style.filter !== blur) item.el.style.filter = blur
        if (!mobile) {
          for (let p = 0; p < item.px.length; p++) {
            item.px[p][0].style.transform = `translate3d(0,${(w * item.px[p][1] * 10).toFixed(2)}%,0)`
          }
        }
      }
    }

    engineApiRef.current = { measure, recache: cacheItems, place }

    const rollChars = (now: number) => {
      const roll = rollRef.current
      if (!roll) return
      let done = true
      for (let i = 0; i < roll.els.length; i++) {
        const t = (now - roll.t0) / 1000 - roll.delay[i]
        let eased = 0
        if (t < 2) {
          done = false
          if (t > 0) {
            const easedRaw = t / 2 >= 1 ? 1 : 1 - Math.pow(2, -10 * (t / 2))
            eased = ((easedRaw * (roll.rep[i] + 1)) % 1 + 1) % 1
          }
        }
        roll.els[i].style.transform = `translate3d(0,${(roll.base - eased * roll.span).toFixed(2)}%,0)`
      }
      if (done) rollRef.current = null
    }

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick)
      if (typeof document !== "undefined" && document.hidden) return
      rollChars(now)
      if (!state.running) return
      const n = scenesRef.current.length
      if (!n) return
      state.target = lerp(state.target, Math.round(state.target), 0.1)
      state.current = lerp(state.current, state.target, state.intro ? 0.05 : 0.09)
      if (state.intro && Math.abs(state.target - state.current) < 0.02) state.intro = false
      state.speed *= 0.85
      state.lspeed = lerp(state.lspeed, Math.abs(state.speed), 0.1)
      place()
      const index = ((-Math.round(state.current) % n) + n) % n
      if (state.entered && index !== activeRef.current && Math.abs(state.target - state.current) < 1.5) {
        activeRef.current = index
        setActive(index)
        if (frame !== index) {
          frame = index
          playSceneTitle(index)
        }
      }
    }

    const blocked = () => !state.entered || blockRef.current.menu || blockRef.current.lightbox || blockRef.current.video

    const gestStart = () => {
      if (state.gest) return
      state.gest = true
      state.done = false
      state.anchor = Math.round(state.target)
    }

    const gestCommit = (threshold: number) => {
      const offset = state.target - state.anchor
      if (!state.done && Math.abs(offset) >= threshold) {
        state.target = state.anchor + Math.sign(offset)
        state.done = true
        state.lockUntil = Date.now() + 650
      }
    }

    const gestEnd = (threshold?: number) => {
      if (!state.gest) return
      if (threshold) gestCommit(threshold)
      state.gest = false
      state.scrolling = false
    }

    // dir: +1 = the guest is reaching for later content, -1 = earlier content.
    const canScroll = (node: Element, dir: number) => {
      if (node.scrollHeight <= node.clientHeight + 1) return false
      return dir > 0
        ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
        : node.scrollTop > 0
    }

    // A gesture that starts inside a scrollable card (mobile) or a nested
    // `.fr-scroll` (chapter copy, gift, wishes) belongs to that element until it
    // reaches its edge; only then does the deck take over.
    const scrollable = (target: EventTarget | null, dir: number) => {
      if (!(target instanceof Element)) return null
      // Only the card on screen may claim the gesture: the peeking neighbours
      // are also scroll containers, and letting them capture a swipe made the
      // deck feel stuck.
      const item = target.closest(".fr-item")
      if (!item || !item.classList.contains("is-current")) return null
      const inner = target.closest(".fr-scroll")
      if (inner && canScroll(inner, dir)) return inner
      // The scene body scrolls even when the finger lands on the fixed head.
      const body = item.querySelector(".fr-scrollable")
      if (body && canScroll(body, dir)) return body
      return null
    }

    const push = (delta: number, kind: "wheel" | "touch" | "drag") => {
      if (state.dragging) return
      gestStart()
      if (kind === "wheel" && Date.now() < state.lockUntil) return
      if (state.done) return
      state.scrolling = true
      state.speed += delta * 5e-4
      state.target = clamp(state.target + delta * 0.001, state.anchor - 1, state.anchor + 1)
      if (kind === "wheel") gestCommit(0.03)
    }

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return
      if (blocked()) {
        event.preventDefault()
        return
      }
      let delta = event.deltaY
      if (event.deltaMode === 1) delta *= 30
      if (scrollable(event.target, delta > 0 ? 1 : -1)) return
      event.preventDefault()
      push(-delta * 0.5, "wheel")
      if (wheelTimer) window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {
        state.scrolling = false
        gestEnd(0)
      }, 220)
    }

    let touchY: number | null = null
    let touchX = 0
    let touchMode = ""
    let touchTarget: EventTarget | null = null
    let touchClaim: HTMLElement | null = null
    let sideDelta = 0

    const onTouchStart = (event: TouchEvent) => {
      if (blocked()) {
        touchY = null
        return
      }
      touchY = event.touches[0].pageY
      touchX = event.touches[0].pageX
      touchMode = ""
      touchTarget = event.target
      touchClaim = null
      sideDelta = 0
    }

    const onTouchMove = (event: TouchEvent) => {
      if (touchY === null) return
      const touch = event.touches[0]
      const dy = touch.pageY - touchY
      const dx = touch.pageX - touchX
      if (!touchMode) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        if (Math.abs(dx) > Math.abs(dy) && touchTarget instanceof Element && touchTarget.closest(".fr-slide")) {
          touchMode = "side"
        } else {
          touchClaim = scrollable(touchTarget, dy > 0 ? -1 : 1) as HTMLElement | null
          touchMode = touchClaim ? "scroll" : "roll"
        }
      }
      if (touchMode === "side") {
        if (event.cancelable) event.preventDefault()
        sideDelta = dx
        return
      }
      if (touchMode === "scroll") {
        // Drive the scroller ourselves: the finger can land on the card's
        // padding or the fixed head, where native panning has nothing to grab.
        if (event.cancelable) event.preventDefault()
        if (touchClaim) touchClaim.scrollTop -= dy
        touchY = touch.pageY
        return
      }
      if (event.cancelable) event.preventDefault()
      touchY = touch.pageY
      push(dy * 5, "touch")
    }

    const onTouchEnd = () => {
      if (touchY !== null && touchMode === "roll") gestEnd(0.12)
      if (touchMode === "side" && Math.abs(sideDelta) > 40) {
        setEventIndex((current) => clamp(current + (sideDelta < 0 ? 1 : -1), 0, Math.max(0, events.length - 1)))
      }
      touchY = null
    }

    let dragStart = 0
    let dragTarget = 0

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target
      if (
        (root.clientWidth || window.innerWidth) < 992 ||
        blocked() ||
        event.button !== 0 ||
        (target instanceof Element &&
          target.closest("button,a,input,textarea,select,label,iframe,.fr-scroll,.fr-paper,.fr-card"))
      ) {
        return
      }
      state.gest = false
      gestStart()
      state.dragging = true
      dragStart = event.clientY
      dragTarget = state.target
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!state.dragging) return
      const dy = event.clientY - dragStart
      state.speed += dy * 2e-4
      state.target = clamp(dragTarget - dy * 0.005, state.anchor - 1, state.anchor + 1)
    }

    const onMouseUp = () => {
      if (!state.dragging) return
      state.dragging = false
      gestEnd(0.1)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null)
        setMenuOpen(false)
        setSmallOpen(false)
        setVideoLive(false)
        return
      }
      if (blockRef.current.lightbox) return
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return
      if (blocked()) return
      const now = Date.now()
      if (event.code === "Space") event.preventDefault()
      if (now - state.lastKey < 200) return
      if (eventSceneActive && (event.code === "ArrowLeft" || event.code === "ArrowRight")) {
        event.preventDefault()
        setEventIndex((current) =>
          clamp(current + (event.code === "ArrowRight" ? 1 : -1), 0, Math.max(0, events.length - 1))
        )
        return
      }
      if (event.code === "ArrowUp") {
        event.preventDefault()
        state.target = Math.round(state.target) + 1
        state.lastKey = now
      }
      if (event.code === "ArrowDown" || event.code === "Space") {
        event.preventDefault()
        state.target = Math.round(state.target) - 1
        state.lastKey = now
      }
    }

    const onResize = () => {
      measure()
      place()
    }

    home.addEventListener("wheel", onWheel, { passive: false })
    home.addEventListener("touchstart", onTouchStart, { passive: true })
    home.addEventListener("touchmove", onTouchMove, { passive: false })
    home.addEventListener("touchend", onTouchEnd)
    home.addEventListener("touchcancel", onTouchEnd)
    home.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    // iOS collapses its toolbars without firing a window resize; the visual
    // viewport is the only reliable signal, and a stale --fr-item-h makes every
    // card overflow the screen.
    window.visualViewport?.addEventListener("resize", onResize)
    window.visualViewport?.addEventListener("scroll", onResize)

    measure()
    cacheItems()
    place()
    raf = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      window.visualViewport?.removeEventListener("resize", onResize)
      window.visualViewport?.removeEventListener("scroll", onResize)
      home.removeEventListener("wheel", onWheel)
      home.removeEventListener("touchstart", onTouchStart)
      home.removeEventListener("touchmove", onTouchMove)
      home.removeEventListener("touchend", onTouchEnd)
      home.removeEventListener("touchcancel", onTouchEnd)
      home.removeEventListener("mousedown", onMouseDown)
      if (wheelTimer) window.clearTimeout(wheelTimer)
      engineApiRef.current = null
    }
  }, [events.length, playSceneTitle])

  // Re-measure and re-cache when the scene list changes (a photo/wish edit), so
  // a new or removed card never keeps a stale transform from the old deck.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      engineApiRef.current?.measure()
      engineApiRef.current?.recache()
      engineApiRef.current?.place()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sceneCount])

  // Story chapters advance on their own, exactly like the reference reel.
  useEffect(() => {
    if (!opened || !storySceneActive || stories.length < 2 || storyPaused) return
    const timer = window.setTimeout(() => {
      setStoryIndex((current) => (current + 1) % stories.length)
    }, storyDuration)
    return () => window.clearTimeout(timer)
  }, [opened, storySceneActive, stories.length, storyIndex, storyDuration, storyPaused])

  useEffect(() => {
    setStoryIndex(0)
    setEventIndex(0)
    setVideoLive(false)
  }, [active])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (gallery.length > 1) {
        if (event.key === "ArrowLeft") setLightbox((current) => (current === null ? null : (current - 1 + gallery.length) % gallery.length))
        if (event.key === "ArrowRight") setLightbox((current) => (current === null ? null : (current + 1) % gallery.length))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

  const enter = useCallback(() => {
    const state = engineRef.current
    if (state.entered) return
    state.running = true
    state.current = 0
    state.target = 0
    state.speed = 10
    state.lspeed = 10
    state.intro = true
    state.entered = true
    state.lastKey = 0
    activeRef.current = 0
    setActive(0)
    setOpened(true)
    // The gate hides at the same moment iOS resolves its toolbars; measure once
    // the layout has settled so the deck cannot start with a stale item height.
    const remeasure = () => {
      engineApiRef.current?.measure()
      engineApiRef.current?.place()
    }
    window.requestAnimationFrame(remeasure)
    window.setTimeout(remeasure, 260)
    window.setTimeout(remeasure, 900)
    playMusic()
  }, [playMusic])

  const goHome = useCallback(() => {
    setLightbox(null)
    goToScene(0)
  }, [goToScene])

  const embedUrl = film && film.kind === "embed" ? film.src : ""
  const youtubeId = embedUrl.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)?.[1] || ""
  const wordChars = Array.from(`${groomName || groomFull} & ${brideName || brideFull}`.trim())
  const wordSize = `min(${((164 / Math.max(wordChars.length - 1, 6)) || 0).toFixed(1)}vw, ${Math.round(
    1150 / Math.max(wordChars.length - 1, 6)
  )}px)`

  const sceneNo = (index: number) => pad2(index + 1)
  const totalScenes = pad2(sceneCount)

  return (
    <div
      ref={rootRef}
      className={`film-roll-root no-gl is-word${viewport.desktop ? " is-desk" : " is-mobile"}${opened ? " is-open" : ""}`}
    >
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className={`fr-home${opened ? " is-on" : ""}`} ref={homeRef}>
        {scenes.map((scene, index) => (
          <article
            key={scene.id}
            ref={(node) => {
              itemRefs.current[index] = node
            }}
            className={`fr-item fr-item--${scene.kind}${scene.flip ? " is-flip" : ""}${
              index === active ? " is-current" : ""
            }`}
          >
            <div className="fr-item__img" style={{ "--fr-dim": scene.dim } as CSSProperties}>
              {scene.img ? (
                <img src={scene.img} alt="" draggable={false} style={{ objectPosition: scene.pos }} />
              ) : (
                <div className="fr-blank">
                  <span>{sceneNo(index)}</span>
                </div>
              )}
            </div>

            {scene.kind === "chapter" && stories.length > 1 && (
              <div className="fr-chapter__bg" aria-hidden="true">
                {stories.map((story, storyIdx) =>
                  storyIdx > 0 && story.image_url ? (
                    <img
                      key={`bg-${storyIdx}`}
                      src={story.image_url}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className={storyIdx === storyIndex ? "is-on" : ""}
                    />
                  ) : null
                )}
              </div>
            )}

            <div className="fr-item__c" data-p="2">
              {scene.kind === "poster" && (
                <div className="fr-award" data-p="12">
                  <span className="fr-award__y">{dateObject ? dateObject.getFullYear() : ""}</span>
                  <span className="fr-award__l">
                    <svg viewBox="0 0 99 66" aria-hidden="true" focusable="false">
                      <path d="M30 60C14 52 6 38 9 20M30 60c2-8-1-15-8-19M24 50c-8 1-13-3-15-9M19 40c-7-1-10-6-10-12M17 30c-5-3-7-8-5-13M18 21c-3-4-3-8 0-12M69 60c16-8 24-22 21-40M69 60c-2-8 1-15 8-19M75 50c8 1 13-3 15-9M80 40c7-1 10-6 10-12M82 30c5-3 7-8 5-13M81 21c3-4 3-8 0-12" />
                    </svg>
                    <b>{initials}</b>
                  </span>
                </div>
              )}

              {scene.kind !== "title" && scene.kind !== "credits" && (
                <div className="fr-head" data-p="15">
                  <span className="fr-eyeb">{scene.kicker}</span>
                  <Title lines={scene.title} size={titlePx(scene.kind, scene.title, viewport.vw, viewport.desktop)} />
                  {scene.meta && scene.meta.length > 0 && (
                    <ul className="fr-callout">
                      {scene.meta.map(([label, value]) => (
                        <li key={label}>
                          <span>{label}</span>
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {scene.lead && <span className="fr-lead">{scene.lead}</span>}
                </div>
              )}

              {scene.kind === "poster" && (
                <>
                  <div className="fr-reviews" data-p="2">
                    {scene.facts?.map((fact) => (
                      <div className="fr-review" key={fact.label} data-p="15">
                        <StarRow />
                        <span className="fr-src">{fact.label}</span>
                        <span className="fr-quote">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                  <Clock target={target} />
                  {calendarUrl && (
                    <a
                      className="fr-link fr-eyeb fr-cd__cal"
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {calendarLabel}
                    </a>
                  )}
                </>
              )}

              {scene.kind === "title" && (
                <div className="fr-in fr-inter" data-p="10">
                  <span className="fr-stamp">
                    <span>{(initials || "A").charAt(0)}</span>
                    <i>&amp;</i>
                    <span>{(initials || "B").charAt(1) || (initials || "B").charAt(0)}</span>
                  </span>
                  <span className="fr-eyeb">{scene.kicker}</span>
                  {openingBody && (
                    <div className="fr-scroll fr-inter__t">
                      <span className="fr-serif fr-pre">{openingBody}</span>
                    </div>
                  )}
                  {profile.quote_text && profile.quote_text.trim() !== openingBody && (
                    <span className="fr-quote">{profile.quote_text}</span>
                  )}
                  {dateDots && <span className="fr-eyeb">{dateDots}</span>}
                </div>
              )}

              {scene.kind === "cast" && (
                <div className="fr-in fr-cast" data-p="22">
                  <ul className="fr-credits">
                    {(scene.person === "groom" ? profile.groom_parents : profile.bride_parents) && (
                      <li>
                        <span className="fr-eyeb">
                          {parentsLabel}
                        </span>
                        <b>{scene.person === "groom" ? profile.groom_parents || "" : profile.bride_parents || ""}</b>
                      </li>
                    )}
                  </ul>
                  {(scene.person === "groom" ? groomIg : brideIg) && (
                    <a
                      className="fr-link fr-eyeb"
                      href={`https://instagram.com/${scene.person === "groom" ? groomIg : brideIg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{scene.person === "groom" ? groomIg : brideIg}
                    </a>
                  )}
                </div>
              )}

              {scene.kind === "chapter" && (
                <div
                  className="fr-in fr-chapter"
                  data-p="20"
                  onPointerEnter={() => setStoryPaused(true)}
                  onPointerLeave={() => setStoryPaused(false)}
                  onTouchStart={() => setStoryPaused(true)}
                  onTouchEnd={() => setStoryPaused(false)}
                  onWheel={() => holdStory()}
                >
                  {stories.length > 1 && (
                    <div className="fr-chapter__nav">
                      {stories.map((story, storyIdx) => (
                        <button
                          type="button"
                          key={`${story.title || "chapter"}-${storyIdx}`}
                          className={storyIdx < storyIndex ? "is-past" : storyIdx === storyIndex ? "is-on" : ""}
                          onClick={() => setStoryIndex(storyIdx)}
                          aria-label={story.title || `${storyKicker} ${pad2(storyIdx + 1)}`}
                        >
                          <i style={storyIdx === storyIndex ? { animationDuration: `${storyDuration}ms` } : undefined} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="fr-chapter__deck">
                    {stories.map((story, storyIdx) => (
                      <article
                        className={`fr-chapter__it${storyIdx === storyIndex ? " is-on" : ""}`}
                        key={`${story.title || "chapter"}-${storyIdx}`}
                        aria-hidden={storyIdx === storyIndex ? undefined : "true"}
                      >
                        <span className="fr-eyeb">
                          {storyKicker} {pad2(storyIdx + 1)}
                          {stories.length > 1 ? ` / ${pad2(stories.length)}` : ""}
                        </span>
                        {story.title && <span className="fr-chapter__t">{story.title}</span>}
                        {story.description && (
                          <div className="fr-scroll fr-fadeb">
                            <span className="fr-serif fr-pre">{story.description}</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {scene.kind === "event" && (
                <div className="fr-in fr-slide fr-scrollable" data-p="18">
                  <div className="fr-slide__view">
                    <div
                      className="fr-slide__track"
                      style={{ transform: `translate3d(-${eventIndex * 100}%,0,0)` }}
                    >
                      {events.map((event, eventIdx) => (
                        <div className={`fr-slide__it${eventIdx === eventIndex ? " is-on" : ""}`} key={`${event.name || "event"}-${eventIdx}`}>
                          <div className="fr-paper fr-stub">
                            <div className="fr-card__bar fr-eyeb">
                              <span>{event.name || "Admit One"}</span>
                              <span>No. {pad2(eventIdx + 1)}</span>
                            </div>
                            <div className="fr-row fr-stub__title">
                              <span className="fr-name">
                                <b>{event.name || "The Celebration"}</b>
                              </span>
                            </div>
                            <div className="fr-row">
                              <span className="fr-eyeb">Date</span>
                              <span className="fr-name fr-name--sm">
                                <b>{cardDate(event.date || profile.estimated_wedding_date)}</b>
                              </span>
                            </div>
                            <div className="fr-row">
                              <span className="fr-eyeb">Time</span>
                              <span className="fr-name fr-name--sm">
                                <b>{timeRange(event.time) || "—"}</b>
                              </span>
                            </div>
                            <div className="fr-row">
                              <span className="fr-eyeb">Venue</span>
                              <span className="fr-serif fr-pre fr-stub__addr">
                                {[event.venue, event.address].filter(Boolean).join(", ")}
                              </span>
                            </div>
                            <div className="fr-stub__foot">
                              {event.maps_url && (
                                <a
                                  href={event.maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="fr-tix fr-tix--dark"
                                >
                                  <span className="fr-tix__l">{mapsLabel}</span>
                                  <span className="fr-tix__r">
                                    <ArrowSvg />
                                  </span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="fr-slide__nav">
                    <button
                      type="button"
                      className="fr-slide__btn"
                      aria-label="Previous event"
                      disabled={eventIndex === 0}
                      onClick={() => setEventIndex((current) => Math.max(0, current - 1))}
                    >
                      <svg viewBox="0 0 14 13" aria-hidden="true" focusable="false">
                        <path d="M13 6.5H2M6.5 1.5l-5 5 5 5" />
                      </svg>
                    </button>
                    <span className="fr-slide__dots">
                      {events.map((event, eventIdx) => (
                        <button
                          type="button"
                          key={`dot-${eventIdx}`}
                          className={eventIdx === eventIndex ? "is-on" : ""}
                          aria-label={event.name || `Event ${eventIdx + 1}`}
                          onClick={() => setEventIndex(eventIdx)}
                        />
                      ))}
                    </span>
                    <button
                      type="button"
                      className="fr-slide__btn"
                      aria-label="Next event"
                      disabled={eventIndex >= events.length - 1}
                      onClick={() => setEventIndex((current) => Math.min(events.length - 1, current + 1))}
                    >
                      <ArrowSvg />
                    </button>
                  </div>
                </div>
              )}

              {scene.kind === "rundown" && (
                <div className="fr-in fr-rundown" data-p="14">
                  <div className="fr-paper">
                    <div className="fr-card__bar fr-eyeb">
                      <span>{rundownKicker}</span>
                      <span>{pad2(rundown.length)}</span>
                    </div>
                    <ul>
                      {rundown.map((item, itemIdx) => (
                        <li className="fr-row" key={`${item.time || "row"}-${itemIdx}`}>
                          <span className="fr-eyeb">{item.time || "—"}</span>
                          <span className="fr-name fr-name--sm">
                            <b>{item.description || ""}</b>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {scene.kind === "strip" && (
                <div className="fr-in fr-strip fr-scrollable" data-p="10">
                  {[1, 2].map((direction) => (
                    <div className="fr-strip__row" key={`row-${direction}`}>
                      <div className="fr-strip__track" style={{ animationDuration: stripDuration }}>
                        {stripRow(direction as 1 | 2).map((photo, photoIdx) => (
                          <button
                            type="button"
                            className="fr-strip__it"
                            key={`${photo.src}-${photoIdx}`}
                            aria-label={`Photo ${photo.index + 1}`}
                            onClick={() => setLightbox(photo.index)}
                          >
                            <img src={photo.src} alt="" loading="lazy" draggable={false} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {scene.kind === "trailer" && film && (
                <div className="fr-in fr-video" data-p="10">
                  {scene.img && <img className="fr-video__poster" src={scene.img} alt="" aria-hidden="true" draggable={false} />}
                  <button type="button" className="fr-video__play" onClick={() => setVideoLive(true)}>
                    <i>
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </i>
                    <span className="fr-eyeb">Play</span>
                  </button>
                </div>
              )}

              {scene.kind === "gift" && (
                <div className="fr-in fr-gift fr-scroll" data-p="14">
                  {accounts.map((account, accountIdx) => (
                    <div className="fr-paper" key={`${account.account_number || "acc"}-${accountIdx}`}>
                      <div className="fr-card__bar fr-eyeb">
                        <span>{account.provider_name || "Bank"}</span>
                      </div>
                      <div className="fr-row">
                        <span className="fr-name">
                          <b>{account.account_number || ""}</b>
                        </span>
                        {account.account_name && <span className="fr-eyeb">a/n {account.account_name}</span>}
                        {account.account_number && (
                          <button
                            type="button"
                            className="fr-link fr-eyeb"
                            onClick={() => copyText(account.account_number || "", accountToast)}
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {giftAddress && (
                    <div className="fr-card fr-card--black">
                      <div className="fr-row">
                        {profile.gift_address_name && <span className="fr-eyeb">{profile.gift_address_name}</span>}
                        <span className="fr-serif fr-pre">{giftAddress}</span>
                        <button type="button" className="fr-link fr-eyeb" onClick={() => copyText(giftAddress, addressToast)}>
                          {addressButton}
                        </button>
                      </div>
                    </div>
                  )}

                  {giftSignature && <span className="fr-serif fr-center">{giftSignature}</span>}
                </div>
              )}

              {scene.kind === "dress" && (
                <div className="fr-in fr-dress fr-scroll" data-p="14">
                  {dressColors.length > 0 && (
                    <ul className="fr-dress__sw">
                      {dressColors.map((color, colorIdx) => (
                        <li className="fr-dress__c" key={`${color.hex || color.name}-${colorIdx}`}>
                          <span className="fr-dress__d" style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                          {color.name && <span className="fr-dress__l">{color.name}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {dressNote && <span className="fr-eyeb">{dressNote}</span>}
                </div>
              )}

              {scene.kind === "wishes" && (
                <div className="fr-in fr-wish fr-scrollable" data-p="10">
                  <Wishes
                    weddingProfileId={profile.wedding_profile_id}
                    guestId={profile.guest_id}
                    guestName={profile.guest_name}
                    guestLinkStrict={profile.guest_link_strict}
                    nameFallback={guestName || WISH_ME}
                    listLabel={wishesTitle.join(" ")}
                    copy={wishCopy}
                  />
                </div>
              )}

              {scene.kind === "credits" && (
                <div className="fr-in fr-end" data-p="14">
                  <div className="fr-scroll fr-end__t">
                    <span className="fr-serif fr-pre">
                      {(tc.closing_message || "").trim() ||
                        "It is an honour and a happiness for us to have you with us on our wedding day."}
                    </span>
                    {honored.length > 0 && (
                      <ul className="fr-credits fr-credits--c">
                        <li>
                          <span className="fr-eyeb">{(tc.inviting_kicker || "").trim() || "Also inviting"}</span>
                        </li>
                        {honored.map((family, familyIdx) => (
                          <li key={`${family}-${familyIdx}`}>
                            <b>{family}</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {closingSee && <span className="fr-serif fr-center">{closingSee}</span>}
                  <button type="button" className="fr-tix" onClick={share}>
                    <span className="fr-tix__l">Share</span>
                    <span className="fr-tix__r">
                      <ArrowSvg />
                    </span>
                  </button>
                  <a className="fr-brand" href={waHref} target="_blank" rel="noopener noreferrer">
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
                    <span>Wedding by Aksaraa</span>
                  </a>
                  <span className="fr-end__c">
                    ©{new Date().getFullYear()} {coupleLabel}. All rights reserved.
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div
        className={`fr-menu-bg${menuOpen || smallOpen ? " is-on" : ""}`}
        onClick={() => {
          setMenuOpen(false)
          setSmallOpen(false)
        }}
        aria-hidden="true"
      />

      {opened && (
        <div className={`fr-nav${menuOpen ? " is-open" : ""}${smallOpen ? " is-small" : ""}`}>
          <button type="button" className="fr-logo" onClick={goHome} aria-label="Back to the cover">
            <span>{initials.charAt(0) || "A"}</span>
            <i>&amp;</i>
            <span>{initials.charAt(1) || "B"}</span>
          </button>

          <div className="fr-menu">
            <div className="fr-menu__top">
              <button
                type="button"
                className="fr-tk"
                onClick={() => {
                  setSmallOpen((open) => !open)
                  setMenuOpen(false)
                }}
                aria-expanded={smallOpen}
                aria-label="Scene list"
              >
                <span className="fr-tk__top">
                  <span className="fr-tk__img">
                    {activeScene?.img ? <img src={activeScene.img} alt="" draggable={false} /> : null}
                  </span>
                  <span className="fr-tk__t">{activeScene?.title.join(" ") || activeScene?.kicker}</span>
                  <svg className="fr-tk__ar" viewBox="0 0 12 8" aria-hidden="true" focusable="false">
                    <path d="M1 1.5l5 5 5-5" />
                  </svg>
                </span>
                <span className="fr-tk__bot">
                  <span>{activeScene?.kicker}</span>
                  <span>{dateTight}</span>
                  <span>No. {sceneNo(active)} / {totalScenes}</span>
                </span>
              </button>

              <button
                type="button"
                className={`fr-burger${menuOpen ? " is-x" : ""}`}
                onClick={() => {
                  setMenuOpen((open) => !open)
                  setSmallOpen(false)
                }}
                aria-expanded={menuOpen}
                aria-label="Open the menu"
              >
                <i />
                <i />
                <i />
              </button>
            </div>

            <div className="fr-panel fr-panel--small">
              <div className="fr-panel__in">
                <ul className="fr-small">
                  {scenes.map((scene, index) => (
                    <li key={`small-${scene.id}`}>
                      <button
                        type="button"
                        className={index === active ? "is-now" : ""}
                        onClick={() => goToScene(index)}
                        aria-current={index === active ? "true" : undefined}
                      >
                        <span className="fr-small__img">
                          {scene.img ? <img src={scene.img} alt="" loading="lazy" draggable={false} /> : null}
                        </span>
                        <span className="fr-small__t">{scene.title.join(" ") || scene.kicker}</span>
                        <i />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="fr-panel fr-panel--main">
              <div className="fr-panel__in">
                <i className="fr-ln" />
                <ul className="fr-links">
                  {scenes.map((scene, index) => (
                    <li key={`link-${scene.id}`} className={index === active ? "is-now" : ""}>
                      <button type="button" onClick={() => goToScene(index)}>
                        <span
                          className="fr-y"
                          style={{ transitionDelay: menuOpen ? `${0.1 + Math.min(index, 8) * 0.06}s` : "0s" }}
                        >
                          <small>{sceneNo(index)}</small>
                          {scene.title.join(" ") || scene.kicker}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <i className="fr-ln fr-ln--dash" />
                <div className="fr-legal">
                  {hasGift && (
                    <button type="button" onClick={() => goToScene(scenes.findIndex((scene) => scene.kind === "gift"))}>
                      <span className="fr-y" style={{ transitionDelay: menuOpen ? "0.4s" : "0s" }}>
                        {giftKicker}
                      </span>
                    </button>
                  )}
                  <button type="button" onClick={() => goToScene(scenes.findIndex((scene) => scene.kind === "wishes"))}>
                    <span className="fr-y" style={{ transitionDelay: menuOpen ? "0.5s" : "0s" }}>
                      {wishesKicker}
                    </span>
                  </button>
                </div>
                <i className="fr-ln fr-ln--dash" />
                <div className="fr-social">
                  {trackUrl && (
                    <button
                      type="button"
                      className={playing ? "" : "is-off"}
                      onClick={toggleMusic}
                      aria-label={playing ? "Pause the music" : "Play the music"}
                      aria-pressed={playing}
                    >
                      <span className="fr-eq" aria-hidden="true">
                        <b />
                        <b />
                        <b />
                        <b />
                      </span>
                    </button>
                  )}
                  <button type="button" onClick={share} aria-label="Share the invitation">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                      <path d="M12 3v12M8 7l4-4 4 4" />
                    </svg>
                  </button>
                </div>
                <i className="fr-ln fr-ln--dash" />
                <div className="fr-copy">
                  <span className="fr-y" style={{ transitionDelay: menuOpen ? "0.5s" : "0s" }}>
                    ©{new Date().getFullYear()} {coupleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {trackUrl && (
        <button
          type="button"
          className={`fr-music${playing ? "" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause the music" : "Play the music"}
          aria-pressed={playing}
        >
          <span className="fr-eq" aria-hidden="true">
            <b />
            <b />
            <b />
            <b />
          </span>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="fr-light" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <img src={gallery[lightbox]} alt="" />
          <button type="button" className="fr-arrow fr-light__x" aria-label="Close" onClick={() => setLightbox(null)}>
            ✕
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="fr-arrow fr-arrow--light fr-light__p"
              aria-label="Previous photo"
              onClick={() => setLightbox((current) => (current === null ? null : (current - 1 + gallery.length) % gallery.length))}
            >
              ‹
            </button>
          )}
          {gallery.length > 1 && (
            <button
              type="button"
              className="fr-arrow fr-arrow--light fr-light__n"
              aria-label="Next photo"
              onClick={() => setLightbox((current) => (current === null ? null : (current + 1) % gallery.length))}
            >
              ›
            </button>
          )}
        </div>
      )}

      {videoLive && film && (
        <div className="fr-player" role="dialog" aria-modal="true" aria-label={videoTitle.join(" ")}>
          <div className="fr-player__box">
            {youtubeId ? (
              <AutoplayYouTube videoId={youtubeId} title={videoTitle.join(" ")} controls autoplay />
            ) : film.kind === "file" ? (
              <video src={film.src} controls autoPlay playsInline preload="metadata" poster={coverShot} />
            ) : (
              <iframe
                src={film.src}
                title={videoTitle.join(" ")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <button
            type="button"
            className="fr-arrow fr-arrow--light fr-player__x"
            aria-label="Close"
            onClick={() => setVideoLive(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={`fr-gate${opened ? " is-leaving" : ""}`}>
        <div className="fr-gate__bg" aria-hidden="true">
          {gateFilm && gateFilm.kind === "file" ? (
            <video src={gateFilm.src} poster={coverShot} autoPlay muted loop playsInline preload="metadata" />
          ) : gateEmbed ? (
            <iframe
              src={gateEmbed}
              title={videoTitle.join(" ")}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
            />
          ) : (
            <img src={coverShot} alt="" draggable={false} />
          )}
          <i className="fr-gate__vig" />
          <i className="fr-gate__grain" />
        </div>
        <div className="fr-gate__mark">
          <span className="fr-eyeb fr-gate__eyeb">{coverTitle}</span>
          <span className="fr-word" aria-label={coupleLabel} style={{ fontSize: wordSize }}>
            {wordChars.map((ch, index) => (
              <span
                className={`fr-wch${ch === "&" ? " is-amp" : ch === " " ? " is-sp" : ""}`}
                aria-hidden="true"
                key={`${ch}-${index}`}
              >
                <span className="fr-wch__in">
                  <i>{ch}</i>
                  <i>{ch}</i>
                </span>
              </span>
            ))}
          </span>
          {dateDots && <span className="fr-gate__sub">{dateDots}</span>}
        </div>
        <div className={`fr-gate__foot${btnOn ? " is-on" : ""}`}>
          {hasGuest && (
            <div className="fr-gate__guest">
              <span className="fr-eyeb">{dearLabel}</span>
              <span className="fr-gate__name">{guestName}</span>
            </div>
          )}
          <button type="button" className="fr-tix" onClick={enter}>
            <span className="fr-tix__l">{openLabel}</span>
            <span className="fr-tix__r">
              <ArrowSvg />
            </span>
          </button>
        </div>
      </div>

      {toast && <div className="fr-toast is-on" role="status">{toast}</div>}

      {showGuestDock && opened && lightbox === null && !videoLive && (
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