"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { copyPlainText } from "@/lib/clipboard"
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
import Wishes, { type WishesCopy } from "./Wishes"
import { EH_ASSETS } from "./assets"
import "./emerald-heirloom.css"

const GUEST_FALLBACK = "Tamu Undangan"

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

const pad2 = (value: number) => String(value).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(raw)
  return isNaN(date.getTime()) ? null : date
}

function longDate(value?: string | null, withWeekday = false): string {
  const date = parseDate(value)
  if (!date) return ""
  const core = `${date.getDate()} ${EN_MONTHS[date.getMonth()]} ${date.getFullYear()}`
  return withWeekday ? `${EN_DAYS[date.getDay()]}, ${core}` : core
}

function weekdayName(value?: string | null): string {
  const date = parseDate(value)
  return date ? EN_DAYS[date.getDay()] : ""
}

function slashDate(value?: string | null): string {
  const date = parseDate(value)
  if (!date) return ""
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

function igHandle(raw?: string): string {
  const text = (raw || "").trim()
  if (!text) return ""
  if (/^https?:\/\//i.test(text)) {
    return (text.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  }
  return text.replace(/^@/, "")
}

function Countdown({ target }: { target: Date | null }) {
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
    <div className="eh-count__grid" role="group" aria-label="Countdown to the wedding day">
      {units.map((unit) => (
        <div className="eh-count__unit" key={unit.label}>
          <b>{target ? unit.value : "--"}</b>
          <span>{unit.label}</span>
        </div>
      ))}
    </div>
  )
}

function InstagramMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" />
    </svg>
  )
}

// Portrait plate window, measured from the vendored frame
// (12.4% / 12.9% / 73% x 61% of 1119x1883).
const PORTRAIT_WINDOW = { left: "12.4%", top: "12.9%", width: "73%", height: "61%" }

// The reference sprinkles loose ornaments (flowers, fans, swans) across every
// section, mostly bleeding off the edges. `left`/`width` are percentages of the
// section width, `top` of its height, so the composition keeps its proportions
// at any column width.
type DecoSpec = {
  src: string
  still: string
  /* darkened silhouette drawn behind the ornament, like the reference's pair */
  shadow?: string
  left: number
  top: number
  width: number
  rotate?: number
  delay?: number
  flip?: boolean
  opacity?: number
  behind?: boolean
}

function Deco({ spec }: { spec: DecoSpec }) {
  return (
    <span
      className={`eh-deco${spec.behind ? " eh-deco--behind" : ""}`}
      aria-hidden="true"
      style={
        {
          left: `${spec.left}%`,
          top: `${spec.top}%`,
          width: `${spec.width}%`,
          rotate: `${spec.rotate ?? 0}deg`,
          opacity: spec.opacity ?? 1,
          scale: spec.flip ? "-1 1" : undefined,
          "--eh-deco-delay": `${spec.delay ?? 0}s`,
        } as CSSProperties
      }
    >
      {spec.shadow && <img className="eh-deco__shadow" src={spec.shadow} alt="" loading="lazy" draggable={false} />}
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={spec.still} />
        <img src={spec.src} alt="" loading="lazy" draggable={false} />
      </picture>
    </span>
  )
}

export default function EmeraldHeirloom(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const filmRef = useRef<HTMLDivElement | null>(null)
  const countdownRef = useRef<HTMLElement | null>(null)
  const slideTrackRef = useRef<HTMLDivElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)
  const [toast, setToast] = useState("")
  const [filmOn, setFilmOn] = useState(false)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])

  const stagePhoto = slots[0] || coverPhoto(profile)
  const gardenPhoto = slots[0] || (profile.couple_illustration_url || "").trim() || gallery[0] || ""
  const groomShot = groomPhotoOf(profile.groom_photo_url) || gallery[0] || stagePhoto
  const brideShot = bridePhotoOf(profile.bride_photo_url) || gallery[1] || groomShot

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const groomFull = (profile.groom_full_name || "").trim() || groomName
  const brideFull = (profile.bride_full_name || "").trim() || brideName
  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)
  const guestName = (profile.guest_name || "").trim() || GUEST_FALLBACK

  const rawHashtag = (profile.display_name || "").trim()
  const derivedHashtag = `#${`${groomName}${brideName}`.replace(/[^A-Za-z0-9]/g, "") || "OurWedding"}`
  const hashtag = rawHashtag.startsWith("#") ? rawHashtag : derivedHashtag

  const dateObject = parseDate(profile.estimated_wedding_date)
  const dateLong = longDate(profile.estimated_wedding_date)
  const coverDate = dateLong

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () =>
      gates.story === false || profile.story_visible === false
        ? []
        : (profile.stories || []).filter((story) => story && (story.title || story.description)),
    [profile.stories, gates.story, profile.story_visible]
  )
  const rundown =
    profile.rundown_visible !== false ? (profile.rundown || []).filter((row) => row && (row.time || row.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((family) => !!family && !!family.trim())
      : []

  const dressColors = (profile.dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const dressTitle = (profile.dresscode?.title || "").trim() || (tc.dresscode_title || "").trim()
  const dressBody =
    (profile.dresscode?.description || "").trim() ||
    (tc.dresscode_intro || "").trim() ||
    "We would be delighted if you joined us in the palette below."
  const dressNote = (tc.dresscode_note || "").trim()
  const hasDresscode = profile.dresscode_visible !== false && (!!dressTitle || !!dressBody || dressColors.length > 0)

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

  const livestream = profile.livestream || {}
  const liveUrl = (livestream.url || "").trim()
  const liveEmbed = liveUrl
    ? liveUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/").split("&")[0]
    : ""
  const liveCta = (tc.livestream_cta || "").trim() || "Join Live"
  const hasLive = profile.livestream_visible !== false && !!liveUrl

  const target = useMemo(
    () => countdownTarget(events, profile.estimated_wedding_date),
    [events, profile.estimated_wedding_date]
  )
  const calendarHref = useMemo(() => gcalLink(events[0], groomName, brideName), [events, groomName, brideName])

  const openingBody = (profile.opening_description || "").trim()
  const quoteText = (profile.quote_text || "").trim()
  const coverKicker = (tc.cover_kicker || "").trim() || "We invite you to\nthe wedding of"
  const openLabel = (tc.open_button || "").trim() || "Open Invitation"
  const apology = (tc.cover_apology || "").trim()
  const guestLabel = (tc.cover_guest_label || "").trim() || "Dear,"
  const welcomeLine = (tc.welcome_invite || "").trim() || "We're getting married."
  const openingKicker = (tc.opening_kicker || "").trim()
  const saveDateLabel = (tc.save_date_label || "").trim() || "Save The Date"
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || "Bride & Groom"
  const mempelaiTitle = (tc.mempelai_title || "").trim() || mempelaiKicker
  const mempelaiIntro =
    (tc.profiles_intro || "").trim() || "With great joy and respect, we cordially invite you to attend the wedding celebration of our beloved son and daughter."
  const parentsLabel = (tc.parents_label || "").trim() || "Child of"
  const storyTitle = (tc.love_story_title || "").trim() || "Our Story"
  const storyKicker = (tc.story_kicker || "").trim()
  const storyIntro = (tc.story_intro || "").trim()
  const eventsTitle = (tc.events_title || "").trim() || "Event & Venue"
  const eventsKicker = (tc.events_kicker || "").trim()
  const eventsIntro = (tc.events_intro || "").trim() || "With due respect, we would like to inform you that for those who wish to attend, below are the details of the time and venue of the event."
  const eventsNote = (tc.events_note || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "See Location"
  const invitingKicker = (tc.inviting_kicker || "").trim()
  const invitingTitle = (tc.inviting_title || "").trim() || "With Honor"
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownTitle = (tc.rundown_title || "").trim() || "Rundown"
  const rundownKicker = (tc.rundown_kicker || "").trim()
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryTitle = (tc.gallery_title || "").trim() || "Gallery"
  const galleryIntro = (tc.gallery_intro || "").trim()
  const galleryQuote = (tc.gallery_quote || "").trim()
  const videoKicker = (tc.video_kicker || "").trim() || "The Film"
  const videoTitle = (tc.video_title || "").trim()
  const videoIntro = (tc.video_intro || "").trim()
  const giftTitle = (tc.gift_intro_title || "").trim() || "Wedding Gift"
  const giftIntro = (tc.gift_intro_description || "").trim()
  const giftWish = (tc.gift_wish || "").trim()
  const giftButton = (tc.gift_button || "").trim() || "Wedding Gift"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dress Code"
  const wishesTitle = (tc.wishes_title || "").trim() || "Wedding Wishes"
  const wishesIntro = (tc.wishes_intro || "").trim()
  const closingKicker = (tc.closing_kicker || "").trim() || "Thank You"
  const closingMessage = (tc.closing_message || "").trim()
  const accountToast = (tc.copy_account_toast || "").trim() || "Account number copied"
  const addressToast = (tc.copy_address_toast || "").trim() || "Address copied"
  const addressButton = (tc.copy_address_button || "").trim() || "Copy address"
  const accountButton = (tc.copy_account_button || "").trim() || "Copy account number"

  const wishCopy: WishesCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || "Name",
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || "Your full name",
    messageLabel: (tc.wishes_message_label || "").trim() || "Message",
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || "Leave a wish for the couple",
    submit: (tc.wishes_submit || "").trim() || "Send Greeting",
    empty: (tc.wishes_empty || "").trim() || "No wishes yet. Be the first.",
  }

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
    setOpened(true)
    window.scrollTo(0, 0)
    playMusic()
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

  const copyText = useCallback(
    async (value: string, message: string) => {
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  // One observer, one class. Reveal targets stay visible without JS (see CSS).
  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-eh-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-in"))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
    )
    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [
    opened,
    stories.length,
    rundown.length,
    honored.length,
    gallery.length,
    accounts.length,
    events.length,
    hasDresscode,
    hasGift,
    hasLive,
  ])

  // Cover gate locks body scroll until the invitation is opened, with a CSS
  // fallback (`:has`) in case a route-change effect resets inline styles.
  useEffect(() => {
    document.body.classList.toggle("eh-locked", !opened)
    rootRef.current?.classList.toggle("is-locked", !opened)
    return () => {
      document.body.classList.remove("eh-locked")
      rootRef.current?.classList.remove("is-locked")
    }
  }, [opened])

  // Mount the film only when its frame is near the viewport (invitation
  // performance invariant: never pull video on load).
  useEffect(() => {
    if (!hasVideo && !hasLive) return
    const node = filmRef.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setFilmOn(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setFilmOn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasVideo, hasLive])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (gallery.length > 1) {
        if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
        if (event.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % gallery.length))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

  const filmPoster = gallery[0] || stagePhoto
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0&controls=1&fs=1`
    : ""

  // Loose ornaments, positioned as the reference places them: big clusters
  // bleeding off both edges, a fan or a swan behind nearly every plate.
  // Welcome: hanging trumpets at both top corners, white lilies at both bottom
  // corners — exactly the reference's four clusters (no swan on this band).
  const welcomeDecos: DecoSpec[] = [
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -30, top: -13, width: 78, rotate: -7, delay: -0.8 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: 33, top: -13, width: 78, rotate: 7, flip: true, delay: -2.6 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: -10, top: 60, width: 52, delay: -1.6 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 54, top: 58, width: 50, flip: true, delay: -3.8 },
  ]

  const openingDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -34, top: 8, width: 70, delay: -2, behind: true, opacity: 0.85 },
    { src: EH_ASSETS.lilySpray, still: EH_ASSETS.lilySprayStill, shadow: EH_ASSETS.shadowLilies, left: 76, top: 58, width: 44, delay: -3.2 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -20, top: 62, width: 40, delay: -4.4, opacity: 0.9 },
  ]

  // The reference dresses each portrait differently: the groom's frame has a
  // trumpet cluster top-right, lilies on the left, a swan at the caption; the
  // bride's has a swan top-right, the trumpet top-left and lilies bottom-right.
  const personOneDecos: DecoSpec[] = [
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: 58, top: -3, width: 66, rotate: 6, delay: -1 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: -14, top: 42, width: 46, delay: -2.4 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: 74, top: 74, width: 34, delay: -3.6 },
  ]

  const personTwoDecos: DecoSpec[] = [
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: 70, top: -4, width: 38, delay: -1.4 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -34, top: -5, width: 62, rotate: -6, flip: true, delay: -2.6 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 56, top: 48, width: 46, delay: -3.8 },
  ]

  const eventDecos: DecoSpec[] = [
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -22, top: 18, width: 42, delay: -1.6 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: 70, top: 46, width: 58, rotate: 8, delay: -3 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -32, top: 72, width: 68, delay: -4.6, behind: true, opacity: 0.85 },
  ]

  const countDecos: DecoSpec[] = [
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -34, top: -4, width: 54, rotate: -8, delay: -1.2 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 74, top: 44, width: 46, delay: -4.2, behind: true },
  ]

  const invitingDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -28, top: -6, width: 62, delay: -2.4, behind: true, opacity: 0.85 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: 80, top: 74, width: 34, delay: -3.6, behind: true, opacity: 0.9 },
  ]

  const rundownDecos: DecoSpec[] = [
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 72, top: 2, width: 46, delay: -2.8, behind: true },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -30, top: 82, width: 36, delay: -4, behind: true },
  ]

  const galleryDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 64, top: -2, width: 58, delay: -1.8, behind: true, opacity: 0.8 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -30, top: 74, width: 54, rotate: -6, delay: -3.2, behind: true },
  ]

  const videoDecos: DecoSpec[] = [
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: -24, top: -4, width: 46, delay: -2.2 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 62, top: 58, width: 64, delay: -4.4, behind: true, opacity: 0.75 },
  ]

  const liveDecos: DecoSpec[] = [
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -24, top: 10, width: 42, delay: -1.4 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 62, top: 52, width: 60, delay: -3.8, behind: true, opacity: 0.8 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -78, top: -26, width: 88, delay: -2.2, behind: true, opacity: 0.6 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 86, top: -20, width: 86, delay: -4.4, behind: true, opacity: 0.6 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -76, top: 62, width: 86, delay: -1.6, behind: true, opacity: 0.55 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 84, top: 70, width: 86, delay: -3.2, behind: true, opacity: 0.55 },
  ]

  const giftDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -40, top: -10, width: 90, delay: -2.6, behind: true, opacity: 0.75 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -22, top: -4, width: 82, delay: -1.4, behind: true, opacity: 0.4 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: 80, top: 62, width: 38, delay: -4.2, behind: true },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -30, top: 74, width: 52, rotate: -8, delay: -1.6, behind: true },
  ]

  const dressDecos: DecoSpec[] = [
    { src: EH_ASSETS.lilySpray, still: EH_ASSETS.lilySprayStill, shadow: EH_ASSETS.shadowLilies, left: 78, top: 4, width: 40, delay: -3, behind: true },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: 86, top: 78, width: 32, delay: -4.6, behind: true, opacity: 0.9 },
  ]

  const wishesDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -34, top: 4, width: 70, delay: -2, behind: true, opacity: 0.85 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 62, top: 10, width: 70, delay: -4.6, behind: true, opacity: 0.8 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -78, top: 2, width: 94, delay: -1.2, behind: true, opacity: 0.7 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 86, top: 3, width: 92, delay: -3.4, behind: true, opacity: 0.7 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -22, top: 34, width: 88, delay: -5, behind: true, opacity: 0.6 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -30, top: 54, width: 56, rotate: -7, delay: -1.4 },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 72, top: 44, width: 48, delay: -3.6 },
    { src: EH_ASSETS.swan, still: EH_ASSETS.swanStill, shadow: EH_ASSETS.shadowSwan, left: -20, top: 84, width: 40, delay: -5.2 },
  ]

  const closingDecos: DecoSpec[] = [
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: -40, top: -10, width: 78, delay: -2.2, behind: true, opacity: 0.8 },
    { src: EH_ASSETS.fan, still: EH_ASSETS.fanStill, shadow: EH_ASSETS.shadowFan, left: 66, top: -6, width: 66, delay: -4.8, behind: true, opacity: 0.75 },
    { src: EH_ASSETS.flowerTrumpet, still: EH_ASSETS.flowerTrumpetStill, shadow: EH_ASSETS.shadowTrumpet, left: -34, top: 60, width: 62, rotate: -6, delay: -1.2, behind: true },
    { src: EH_ASSETS.lilies, still: EH_ASSETS.liliesStill, shadow: EH_ASSETS.shadowLilies, left: 70, top: 54, width: 50, delay: -3.4, behind: true },
  ]

  // The carousel runs on the milestone photographs; a couple who has not added
  // them yet sees the gallery frames instead (never an empty frame).
  const storyCarousel = useMemo(() => {
    const fromStories = stories.map((story) => story.image_url).filter(Boolean) as string[]
    if (fromStories.length === 0) return gallery.slice(0, 6)
    // The reference's carousel always shows a full thumb row; the gallery tops
    // it up with the couple's other frames.
    const merged = [...fromStories]
    for (const url of gallery) {
      if (merged.length >= 4) break
      if (!merged.includes(url)) merged.push(url)
    }
    return merged
  }, [stories, gallery])

  const goStory = useCallback(
    (direction: number) => {
      setStoryIndex((current) => {
        const next = current + direction
        if (next < 0) return stories.length - 1
        if (next >= stories.length) return 0
        return next
      })
    },
    [stories.length]
  )

  return (
    <div
      ref={rootRef}
      className={`eh-root${opened ? " is-open" : ""}`}
      data-opened={opened ? "1" : "0"}
    >
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      {/* Cover gate. On desktop it stays as the fixed art panel after opening —
          the reference's split layout — and the invitation scrolls beside it.
          The stage keeps the cover art's 1500×938 geometry, so the couple's
          photograph can be seated inside the carved frame's opening and stay
          aligned at every viewport width. */}
      <div
        className={`eh-gate${opened ? " is-open" : ""}`}
        onClick={opened ? undefined : openInvitation}
        role={opened ? undefined : "button"}
        tabIndex={opened ? undefined : 0}
        onKeyDown={
          opened
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  openInvitation()
                }
              }
        }
      >
        <div className="eh-gate__stage">
          <div className="eh-gate__plate">
            {stagePhoto ? (
              <>
                <img className="eh-gate__shot" src={stagePhoto} alt="" draggable={false} />
                <img className="eh-gate__art" src={EH_ASSETS.coverFrame} alt="" draggable={false} />
                <img className="eh-gate__lily eh-gate__lily--left" src={EH_ASSETS.lilies} alt="" aria-hidden="true" draggable={false} />
                <img className="eh-gate__lily eh-gate__lily--right" src={EH_ASSETS.lilies} alt="" aria-hidden="true" draggable={false} />
              </>
            ) : (
              <img className="eh-gate__art" src={EH_ASSETS.cover} alt="" draggable={false} />
            )}
          </div>
        </div>
        <div className="eh-gate__veil" aria-hidden="true" />
        <div className="eh-gate__copy">
          <p className="eh-gate__kicker">
            {coverKicker.split("\n").map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </p>
          <h1 className="eh-gate__names">
            <span>{groomName || groomFull}</span>
            <i>&amp;</i>
            <span>{brideName || brideFull}</span>
          </h1>
          {coverDate && <p className="eh-gate__date">{coverDate}</p>}
          <p className="eh-gate__guest">
            <span>{guestLabel}</span>
            <b>{guestName}</b>
          </p>
          {!opened && (
            <button type="button" className="eh-gate__open" onClick={openInvitation}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3.5 6.5 8.5 6 8.5-6" />
              </svg>
              <span>{openLabel}</span>
            </button>
          )}
          {!opened && apology && <p className="eh-gate__apology">{apology}</p>}
        </div>
      </div>

      <div className="eh-flow">
        {/* 1 — welcome: the painted garden inside the carved arch */}
        <section className="eh-welcome" data-section="sampul" aria-label="The wedding of">
          <div className="eh-welcome__plate">
            <div className="eh-welcome__window">
              <img className="eh-welcome__scene" src={EH_ASSETS.welcomeScene} alt="" loading="lazy" draggable={false} />
            </div>
            <img className="eh-welcome__frame" src={EH_ASSETS.welcomeFrame} alt="" loading="lazy" draggable={false} />
            <div className="eh-welcome__copy">
              <h2 className="eh-welcome__names">
                <span>{groomName || groomFull}</span>
                <i>&amp;</i>
                <span>{brideName || brideFull}</span>
              </h2>
              <p className="eh-welcome__line">{welcomeLine}</p>
            </div>
          </div>
          {welcomeDecos.map((spec, index) => (
            <Deco key={`welcome-deco-${index}`} spec={spec} />
          ))}
        </section>

        <div className="eh-lace" aria-hidden="true">
          <img src={EH_ASSETS.laceBand} alt="" loading="lazy" draggable={false} />
        </div>

        {/* 2 — countdown: the reference's 2×2 dial, no heading, the fan closing
            the section from lace to lace */}
        {target && (
          <section className="eh-count" ref={countdownRef} data-section="countdown" aria-label="Countdown to the wedding day">
            <div className="eh-count__scene">
              <img src={EH_ASSETS.countdownScene} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </div>
            <div className="eh-count__dial" data-eh-reveal="fade">
              <Countdown target={target} />
            </div>
            {calendarHref && (
              <a
                className="eh-button eh-count__cta"
                href={calendarHref}
                target="_blank"
                rel="noopener noreferrer"
                data-eh-reveal="up"
                style={{ "--eh-delay": "0.08s" } as CSSProperties}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
                {saveDateLabel}
              </a>
            )}
            <div className="eh-count__fan" aria-hidden="true">
              <img className="eh-count__shadow" src={EH_ASSETS.shadowSoft} alt="" loading="lazy" draggable={false} />
              <img className="eh-count__fanArt" src={EH_ASSETS.fan} alt="" loading="lazy" draggable={false} />
            </div>
            {countDecos.map((spec, index) => (
              <Deco key={`count-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 2 — mempelai: the frame, the name under it, and the reference's own
            ornament set per person (groom: trumpet right + lilies left + swan
            right; bride: swan right + trumpet left + lilies right). */}
        {(groomFull || brideFull) && (
          <section className="eh-couple" data-section="mempelai" aria-label="Bride and groom">
            <header className="eh-couple__head" data-eh-reveal="up">
              <h2 className="eh-title">{mempelaiTitle}</h2>
              {mempelaiIntro && <p className="eh-intro">{mempelaiIntro}</p>}
            </header>

            <div className="eh-couple__row">
              {[
                { key: "groom", name: groomFull, photo: groomShot, parents: profile.groom_parents, ig: groomIg },
                { key: "bride", name: brideFull, photo: brideShot, parents: profile.bride_parents, ig: brideIg },
              ]
                .filter((person) => !!person.name)
                .map((person, index) => (
                  <article
                    className="eh-person"
                    key={person.key}
                    data-eh-reveal="up"
                    style={{ "--eh-delay": `${index * 0.1}s` } as CSSProperties}
                  >
                    {index > 0 && (
                      <p className="eh-couple__amp" aria-hidden="true">
                        &amp;
                      </p>
                    )}
                    <div className="eh-person__plate">
                      <div className="eh-person__photo" style={PORTRAIT_WINDOW}>
                        {person.photo ? (
                          <img src={person.photo} alt={person.name} loading="lazy" draggable={false} />
                        ) : (
                          <span className="eh-person__empty" aria-hidden="true" />
                        )}
                      </div>
                      <img className="eh-person__frame" src={EH_ASSETS.portraitFrame} alt="" loading="lazy" draggable={false} />
                    </div>
                    {(index === 0 ? personOneDecos : personTwoDecos).map((spec, decoIndex) => (
                      <Deco key={`${person.key}-deco-${decoIndex}`} spec={spec} />
                    ))}
                    <div className="eh-person__caption">
                      <h3 className="eh-person__name">{person.name}</h3>
                      {person.parents && <p className="eh-person__parents">{person.parents}</p>}
                      {person.ig && (
                        <a
                          className="eh-person__ig"
                          href={`https://instagram.com/${person.ig}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <InstagramMark className="eh-person__igIcon" />@{person.ig}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </section>
        )}

        {/* 2 — kalimat pembuka + kutipan (only when the couple fills it) */}
        {(openingBody || quoteText) && (
        <section className="eh-opening" data-section="pembuka" aria-label="Word of welcome">
          <div className="eh-opening__backdrop" aria-hidden="true">
            <img src={EH_ASSETS.welcomeSceneAlt} alt="" loading="lazy" draggable={false} />
          </div>
          <div className="eh-card eh-card--sage eh-opening__card" data-eh-reveal="up">
            <img className="eh-card__plate" src={EH_ASSETS.cardSage} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <div className="eh-card__body">
              {openingKicker && <p className="eh-kicker eh-kicker--dark">{openingKicker}</p>}
              {profile.opening_title && <h2 className="eh-opening__title">{profile.opening_title}</h2>}
              {profile.opening_description && <p className="eh-opening__body">{profile.opening_description}</p>}
              {profile.quote_text && (
                <blockquote className="eh-quote">
                  <p>{profile.quote_text}</p>
                  {profile.quote_source && <cite>{profile.quote_source}</cite>}
                </blockquote>
              )}
            </div>
          </div>
          {openingDecos.map((spec, index) => (
            <Deco key={`opening-deco-${index}`} spec={spec} />
          ))}
        </section>
        )}

        {/* 3 — our story: the translucent card, the white lace, then the
            full-bleed photo carousel with its burgundy arrows and thumb row */}
        {stories.length > 0 && (
          <section className="eh-story" data-section="story" aria-label="Our story">
            <div className="eh-card eh-card--sage eh-story__card" data-eh-reveal="fade">
              <img className="eh-card__plate" src={EH_ASSETS.cardSage} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="eh-card__body eh-story__copy">
                {storyKicker && <p className="eh-story__kicker">{storyKicker}</p>}
                <h2 className="eh-story__title">{storyTitle}</h2>
                {storyIntro && <p className="eh-story__intro">{storyIntro}</p>}
                {stories.map((story, index) => (
                  <div className="eh-story__block" key={`${story.title || "story"}-${index}`}>
                    {story.title && <p className="eh-story__chapter">{story.title}</p>}
                    {story.description && <p className="eh-story__text">{story.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="eh-lace eh-lace--band" aria-hidden="true">
              <img src={EH_ASSETS.laceBand} alt="" loading="lazy" draggable={false} />
            </div>

            {storyCarousel.length > 0 && (
              <div className="eh-story__gallery" data-eh-reveal="fade">
                <figure className="eh-story__frame">
                  <img src={storyCarousel[storyIndex]} alt="" loading="lazy" draggable={false} />
                  {storyCarousel.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="eh-story__nav eh-story__nav--prev"
                        aria-label="Previous story"
                        onClick={() => goStory(-1)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="eh-story__nav eh-story__nav--next"
                        aria-label="Next story"
                        onClick={() => goStory(1)}
                      >
                        ›
                      </button>
                    </>
                  )}
                </figure>
                {storyCarousel.length > 1 && (
                  <div className="eh-story__thumbs">
                    {storyCarousel.map((url, index) => (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        className={index === storyIndex ? "is-active" : undefined}
                        aria-label={`Photo ${index + 1}`}
                        onClick={() => setStoryIndex(index)}
                      >
                        <img src={url} alt="" loading="lazy" draggable={false} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 5 — event & venue */}
        {events.length > 0 && (
          <section className="eh-events" data-section="acara" aria-label="Event and venue">
            <header className="eh-events__head" data-eh-reveal="up">
              {eventsKicker && <p className="eh-kicker">{eventsKicker}</p>}
              <h2 className="eh-title">{eventsTitle}</h2>
              {eventsIntro && <p className="eh-intro">{eventsIntro}</p>}
            </header>

            <div className="eh-events__list">
              {events.map((event, index) => (
                <article
                  className={`eh-event${index % 2 ? " eh-event--alt" : ""}`}
                  key={`${event.name || "event"}-${index}`}
                  data-eh-reveal="up"
                  style={{ "--eh-delay": `${Math.min(index * 0.06, 0.2)}s` } as CSSProperties}
                >
                  <img
                    className="eh-event__wave"
                    src={index % 2 ? EH_ASSETS.eventWave2 : EH_ASSETS.eventWave}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="eh-event__body">
                    {event.name && <h3 className="eh-event__name">{event.name}</h3>}
                    {event.date && <p className="eh-event__weekday">{weekdayName(event.date)}</p>}
                    {event.date && <p className="eh-event__date">{slashDate(event.date)}</p>}
                    {event.time && <p className="eh-event__time">{event.time}</p>}
                    {event.venue && <p className="eh-event__venue">{event.venue}</p>}
                    {event.address && <p className="eh-event__address">{event.address}</p>}
                    {event.maps_url && (
                      <a className="eh-button eh-button--ghost" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                        {mapsLabel}
                      </a>
                    )}
                  </div>
                  <img className="eh-event__swan" src={EH_ASSETS.swan} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                </article>
              ))}
            </div>
            {eventsNote && (
              <p className="eh-events__note" data-eh-reveal="fade">
                {eventsNote}
              </p>
            )}
            {eventDecos.map((spec, index) => (
              <Deco key={`event-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}


        {/* 7 — turut mengundang on the pale sage card */}
        {honored.length > 0 && (
          <section className="eh-inviting" data-section="inviting" aria-label="With honor">
            <div className="eh-card eh-card--sage" data-eh-reveal="fade">
              <img className="eh-card__plate" src={EH_ASSETS.cardSage} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="eh-card__body">
              {invitingKicker && <p className="eh-kicker eh-kicker--dark">{invitingKicker}</p>}
              <h2 className="eh-title eh-title--dark">{invitingTitle}</h2>
              {invitingIntro && <p className="eh-inviting__intro">{invitingIntro}</p>}
              <ul className="eh-inviting__families">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
              </div>
            </div>
            {invitingDecos.map((spec, index) => (
              <Deco key={`inviting-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 8 — rundown */}
        {rundown.length > 0 && (
          <section className="eh-rundown" data-section="rundown" aria-label="Order of the day">
            <header className="eh-rundown__head" data-eh-reveal="up">
              {rundownKicker && <p className="eh-kicker">{rundownKicker}</p>}
              <h2 className="eh-title">{rundownTitle}</h2>
              {rundownIntro && <p className="eh-intro">{rundownIntro}</p>}
            </header>
            <ol className="eh-rundown__rows">
              {rundown.map((row, index) => (
                <li
                  className="eh-rundown__row"
                  key={`${row.time || "row"}-${index}`}
                  data-eh-reveal="up"
                  style={{ "--eh-delay": `${Math.min(index * 0.05, 0.25)}s` } as CSSProperties}
                >
                  {row.time && <span className="eh-rundown__time">{row.time}</span>}
                  {row.description && <span className="eh-rundown__desc">{row.description}</span>}
                </li>
              ))}
            </ol>
            {rundownDecos.map((spec, index) => (
              <Deco key={`rundown-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 9 — gallery */}
        {gallery.length > 0 && (
          <section className="eh-gallery" data-section="galeri" aria-label="Gallery">
            <header className="eh-gallery__head" data-eh-reveal="up">
              <h2 className="eh-title">{galleryTitle}</h2>
              {galleryIntro && <p className="eh-intro">{galleryIntro}</p>}
            </header>

            <figure className="eh-gallery__stage" data-eh-reveal="fade">
              <button
                type="button"
                className="eh-gallery__photo"
                onClick={() => setLightbox(galleryIndex)}
                aria-label="Open photo"
              >
                <img src={gallery[galleryIndex]} alt="" loading="lazy" draggable={false} />
              </button>
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="eh-gallery__nav eh-gallery__nav--prev"
                    aria-label="Previous photo"
                    onClick={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="eh-gallery__nav eh-gallery__nav--next"
                    aria-label="Next photo"
                    onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)}
                  >
                    ›
                  </button>
                </>
              )}
            </figure>

            {gallery.length > 1 && (
              <div className="eh-gallery__thumbs">
                {gallery.map((url, index) => (
                  <button
                    type="button"
                    key={`${url}-${index}`}
                    className={index === galleryIndex ? "is-active" : undefined}
                    onClick={() => setGalleryIndex(index)}
                    aria-label={`Photo ${index + 1}`}
                  >
                    <img src={url} alt="" loading="lazy" draggable={false} />
                  </button>
                ))}
              </div>
            )}

            {galleryQuote && (
              <p className="eh-gallery__quote" data-eh-reveal="fade">
                {galleryQuote}
              </p>
            )}
            {galleryDecos.map((spec, index) => (
              <Deco key={`gallery-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 10 — the film */}
        {hasVideo && film && (
          <section className="eh-film" data-section="video" aria-label="The wedding film">
            <header className="eh-film__head" data-eh-reveal="up">
              {videoKicker && <p className="eh-kicker">{videoKicker}</p>}
              {(videoTitle || videoKicker) && <h2 className="eh-title">{videoTitle || videoKicker}</h2>}
              {videoIntro && <p className="eh-intro">{videoIntro}</p>}
            </header>
            <div className="eh-film__stage" ref={filmRef} data-eh-reveal="fade">
              <img className="eh-film__frame" src={EH_ASSETS.videoFrame} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="eh-film__window">
                {filmOn && film.kind === "file" ? (
                  <video src={film.src} controls autoPlay muted playsInline poster={filmPoster} />
                ) : filmOn && film.kind === "embed" ? (
                  <iframe
                    src={embedUrl || film.src}
                    title={videoTitle || coupleLabel}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    {filmPoster && <img className="eh-film__poster" src={filmPoster} alt="" aria-hidden="true" />}
                    <button type="button" className="eh-film__play" onClick={() => setFilmOn(true)} aria-label="Play the wedding film">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M8 5v14l11-7Z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
            {videoDecos.map((spec, index) => (
              <Deco key={`video-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 11 — live streaming (reference block, column-backed) */}
        {hasLive && (
          <section className="eh-live" data-section="livestream" aria-label="Live streaming">
            <div className="eh-live__stage" ref={hasVideo ? undefined : filmRef} data-eh-reveal="fade">
              <img className="eh-film__frame" src={EH_ASSETS.videoFrame} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="eh-film__window">
                {filmOn ? (
                  <iframe
                    src={liveEmbed}
                    title={livestream.title || coupleLabel}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button type="button" className="eh-film__play" onClick={() => setFilmOn(true)} aria-label="Play the live stream">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M8 5v14l11-7Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {(livestream.title || livestream.description) && (
              <div className="eh-live__copy">
                {livestream.title && <h2 className="eh-title">{livestream.title}</h2>}
                {livestream.description && <p className="eh-intro">{livestream.description}</p>}
              </div>
            )}
            <a className="eh-button" href={liveUrl} target="_blank" rel="noopener noreferrer">
              {liveCta}
            </a>
            {liveDecos.map((spec, index) => (
              <Deco key={`live-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 12 — wedding gift */}
        {hasGift && (
          <section className="eh-gift" data-section="gift" aria-label="Wedding gift">
            <header className="eh-gift__head" data-eh-reveal="up">
              <h2 className="eh-title">{giftTitle}</h2>
              {giftIntro && <p className="eh-intro">{giftIntro}</p>}
            </header>
            {giftWish && (
              <p className="eh-gift__wish" data-eh-reveal="fade">
                {giftWish}
              </p>
            )}
            <div className="eh-gift__card" data-eh-reveal="fade">
              <img className="eh-gift__plate" src={EH_ASSETS.cardBeige} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="eh-gift__inner">
                {accounts.map((account, index) => (
                  <button
                    type="button"
                    className="eh-account"
                    key={`${account.account_number || "account"}-${index}`}
                    onClick={() => copyText(account.account_number || "", accountToast)}
                  >
                    <span className="eh-account__bank">{account.provider_name || giftButton}</span>
                    {account.account_number && <span className="eh-account__number">{account.account_number}</span>}
                    {account.account_name && <span className="eh-account__name">{account.account_name}</span>}
                    <span className="eh-account__copy">{accountButton}</span>
                  </button>
                ))}
                {giftAddress && (
                  <div className="eh-account eh-account--address">
                    {profile.gift_address_name && <span className="eh-account__bank">{profile.gift_address_name}</span>}
                    <span className="eh-account__address">{giftAddress}</span>
                    <button type="button" className="eh-account__copy" onClick={() => copyText(giftAddress, addressToast)}>
                      {addressButton}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {giftDecos.map((spec, index) => (
              <Deco key={`gift-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 13 — dress code */}
        {hasDresscode && (
          <section className="eh-dress" data-section="dresscode" aria-label="Dress code">
            <header className="eh-dress__head" data-eh-reveal="up">
              <p className="eh-kicker">{dressKicker}</p>
              {dressTitle && <h2 className="eh-title">{dressTitle}</h2>}
            </header>
            {dressBody && (
              <p className="eh-dress__body" data-eh-reveal="fade">
                {dressBody}
              </p>
            )}
            {dressColors.length > 0 && (
              <ul className="eh-swatches">
                {dressColors.map((color, index) => (
                  <li
                    className="eh-swatch"
                    key={`${color.hex || color.name}-${index}`}
                    data-eh-reveal="up"
                    style={{ "--eh-delay": `${Math.min(index * 0.05, 0.2)}s` } as CSSProperties}
                  >
                    <i style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                    {color.name && <span>{color.name}</span>}
                  </li>
                ))}
              </ul>
            )}
            {dressNote && <p className="eh-dress__note">{dressNote}</p>}
            {dressDecos.map((spec, index) => (
              <Deco key={`dress-deco-${index}`} spec={spec} />
            ))}
          </section>
        )}

        {/* 14 — wishes */}
        <section className="eh-wishes" data-section="wishes" aria-label="Wedding wishes">
          <div className="eh-wishes__head" data-eh-reveal="fade">
            <img className="eh-wishes__heart" src={EH_ASSETS.heart} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <h2 className="eh-wishes__title">{wishesTitle}</h2>
          </div>
          <div className="eh-wishes__envelope" aria-hidden="true">
            <img src={EH_ASSETS.envelope} alt="" loading="lazy" draggable={false} />
          </div>
          {wishesIntro && (
            <p className="eh-wishes__intro" data-eh-reveal="fade">
              {wishesIntro}
            </p>
          )}
          <div className="eh-card eh-card--sage eh-wishes__panel" data-eh-reveal="up">
            <img className="eh-card__plate" src={EH_ASSETS.cardSage} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <div className="eh-card__body">
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel}
              copy={wishCopy}
            />
            </div>
          </div>
          {wishesDecos.map((spec, index) => (
            <Deco key={`wishes-deco-${index}`} spec={spec} />
          ))}
        </section>

        {/* 15 — closing */}
        <footer className="eh-closing" data-section="closing" aria-label="Closing">
          <div className="eh-closing__scene" aria-hidden="true">
            <img src={EH_ASSETS.gardenScene} alt="" loading="lazy" draggable={false} />
          </div>
          <div className="eh-closing__plate" data-eh-reveal="fade">
            <img className="eh-closing__frame" src={EH_ASSETS.welcomeFrame} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <div className="eh-closing__copy">
              <p className="eh-closing__kicker">{closingKicker}</p>
              <p className="eh-closing__names">
                <span>{groomName}</span>
                <i>&amp;</i>
                <span>{brideName}</span>
              </p>
              {dateLong && <p className="eh-closing__date">{dateLong}</p>}
              {closingMessage && <p className="eh-closing__message">{closingMessage}</p>}
            </div>
          </div>
          {closingDecos.map((spec, index) => (
            <Deco key={`closing-deco-${index}`} spec={spec} />
          ))}
          <div className="eh-lace eh-lace--thin" aria-hidden="true">
            <img src={EH_ASSETS.laceThin} alt="" loading="lazy" draggable={false} />
          </div>
          {hashtag && <p className="eh-closing__hashtag">{hashtag}</p>}
          <div className="eh-footer">
            <a
              className="eh-footer__link"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Aksaraa Wedding on WhatsApp"
            >
              <span className="eh-footer__badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
              </span>
              <span className="eh-footer__cta">Wedding by Aksaraa</span>
            </a>
            <p className="eh-footer__legal">
              © {new Date().getFullYear()} {coupleLabel}
              <span>. All rights reserved.</span>
            </p>
          </div>
        </footer>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className="eh-music"
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
        <div className="eh-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="eh-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>
            ×
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="eh-lightbox__nav eh-lightbox__nav--prev"
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation()
                setLightbox((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
              }}
            >
              ‹
            </button>
          )}
          <img src={gallery[lightbox]} alt="" onClick={(event) => event.stopPropagation()} />
          {gallery.length > 1 && (
            <button
              type="button"
              className="eh-lightbox__nav eh-lightbox__nav--next"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                setLightbox((i) => (i === null ? null : (i + 1) % gallery.length))
              }}
            >
              ›
            </button>
          )}
          <span className="eh-lightbox__count" aria-hidden="true">
            {lightbox + 1} / {gallery.length}
          </span>
        </div>
      )}

      {toast && (
        <div className="eh-toast" role="status">
          {toast}
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || GUEST_FALLBACK}
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
