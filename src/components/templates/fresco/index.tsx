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
import { FRESCO_ASSETS } from "./assets"
import "./fresco.css"

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
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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

function shortDate(value?: string | null): string {
  const date = parseDate(value)
  if (!date) return ""
  return `${date.getDate()} ${EN_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

function igHandle(raw?: string): string {
  const text = (raw || "").trim()
  if (!text) return ""
  if (/^https?:\/\//i.test(text)) {
    return (text.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  }
  return text.replace(/^@/, "")
}

type CoverCopyProps = {
  // The gate renders a second copy of the cover; it must not mint a second h1.
  headingTag?: "h1" | "div"
  groomName: string
  brideName: string
  invite: string
  hasDate: boolean
  month: string
  day: string
  weekday: string
  year: string
  venue: string
}

function CoverCopy({
  headingTag: Heading = "h1",
  groomName,
  brideName,
  invite,
  hasDate,
  month,
  day,
  weekday,
  year,
  venue,
}: CoverCopyProps) {
  return (
    <>
      <Heading className="fr-cover__names">
        <span>{groomName || "Groom"}</span>
        {brideName && (
          <>
            <span className="fr-cover__amp" aria-hidden="true">
              &amp;
            </span>
            <span>{brideName}</span>
          </>
        )}
      </Heading>
      <p className="fr-cover__invite">{invite}</p>
      {hasDate && (
        <div className="fr-cover__date">
          <img className="fr-cover__sprig fr-cover__sprig--l" src={FRESCO_ASSETS.sprig} alt="" aria-hidden="true" draggable={false} />
          <img className="fr-cover__sprig fr-cover__sprig--r" src={FRESCO_ASSETS.sprig} alt="" aria-hidden="true" draggable={false} />
          <span className="fr-cover__month">{month}</span>
          <span className="fr-cover__day">{day}</span>
          <span className="fr-cover__weekday">{weekday}</span>
          <span className="fr-cover__year">{year}</span>
        </div>
      )}
      {venue && (
        <>
          <p className="fr-cover__venueLabel">To be held at</p>
          <p className="fr-cover__venue">{venue}</p>
        </>
      )}
    </>
  )
}

// The arch plate is a frame: its window is a fixed fraction of the card
// (0.735 wide × 0.606 tall). Sizing the card from the photograph's own aspect
// ratio makes the frame follow the photo — the portrait fills the window with
// no crop, and a taller photo simply gives a taller frame.
const WINDOW_W = 0.735
const WINDOW_H = 0.754

function Portrait({ src, alt }: { src?: string; alt: string }) {
  const [cardAR, setCardAR] = useState<number | null>(null)
  return (
    <div
      className="fr-person__photo"
      style={cardAR ? ({ "--fr-card-ar": cardAR } as CSSProperties) : undefined}
    >
      <div className="fr-person__window">
        {src ? (
          <img
            className="fr-person__portrait"
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            onLoad={(event) => {
              const img = event.currentTarget
              if (!img.naturalWidth || !img.naturalHeight) return
              const photoAR = img.naturalWidth / img.naturalHeight
              const next = photoAR * (WINDOW_H / WINDOW_W)
              // keep the arch a portrait shape; extreme aspects fall back to a crop
              setCardAR(Math.min(0.8, Math.max(0.5, Number(next.toFixed(4)))))
            }}
          />
        ) : (
          <span className="fr-person__portrait fr-person__portrait--empty" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

type Phase = "idle" | "playing" | "done"

function HeartMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
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
    <div className="fr-countdown__frame" role="group" aria-label="Countdown to the wedding day">
      <img src={FRESCO_ASSETS.countdownFrame} alt="" aria-hidden="true" draggable={false} />
      <div className="fr-countdown__days">
        <b>{target ? units[0].value : "--"}</b>
        <span>{units[0].label}</span>
      </div>
      <div className="fr-countdown__units">
        {units.slice(1).map((unit) => (
          <div key={unit.label}>
            <b>{target ? unit.value : "--"}</b>
            <span>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PETALS = [12, 26, 38, 50, 62, 74, 86].map((left, index) => ({
  left,
  size: [26, 20, 30, 22, 27, 19, 24][index],
  fall: [14, 17, 15, 18, 14.5, 17.5, 15.5][index],
  fallDelay: [0, 4.5, 8, 2, 10.5, 6.5, 12.5][index],
  sway: [3.2, 2.6, 3.8, 3, 3.4, 2.8, 3.6][index],
  swayDelay: [0, 3.15, 5.6, 1.4, 7.35, 4.55, 8.75][index],
  petal: index % 3,
}))

export default function Fresco(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gateVideoRef = useRef<HTMLVideoElement | null>(null)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const cloudsRef = useRef<HTMLImageElement | null>(null)
  const countdownRef = useRef<HTMLElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [phase, setPhase] = useState<Phase>("idle")
  const [gateLive, setGateLive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [toast, setToast] = useState("")
  const [filmOn, setFilmOn] = useState(false)
  const filmRef = useRef<HTMLDivElement | null>(null)
  const [giftOpen, setGiftOpen] = useState(false)

  const opened = phase === "done"
  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  const galleryLoop = useMemo(() => (gallery.length > 1 ? [...gallery, ...gallery] : gallery), [gallery])

  const stagePhoto = slots[0] || coverPhoto(profile)
  // The single cover slot feeds the framed photograph at the head of "Our
  // Story"; the gallery and the closing fall back to it when needed.
  const storyPhoto = slots[0] || (profile.couple_illustration_url || "").trim() || gallery[0] || ""
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

  // "Hashtag Instagram Post" in the editor is `display_name`. A stored value
  // that is a plain name is not a hashtag, so derive one from the couple.
  const rawHashtag = (profile.display_name || "").trim()
  const derivedHashtag = `#${`${groomName}${brideName}`.replace(/[^A-Za-z0-9]/g, "") || "OurWedding"}`
  const hashtag = rawHashtag.startsWith("#") ? rawHashtag : derivedHashtag

  const dateObject = parseDate(profile.estimated_wedding_date)
  const dateLong = longDate(profile.estimated_wedding_date)
  const dateWeekday = dateObject ? EN_DAYS[dateObject.getDay()] : ""
  const coverMonth = dateObject ? EN_MONTHS[dateObject.getMonth()] : ""
  const coverDay = dateObject ? pad2(dateObject.getDate()) : ""
  const coverYear = dateObject ? String(dateObject.getFullYear()) : ""

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

  const target = useMemo(
    () => countdownTarget(events, profile.estimated_wedding_date),
    [events, profile.estimated_wedding_date]
  )
  const calendarHref = useMemo(() => gcalLink(events[0], groomName, brideName), [events, groomName, brideName])

  const coverKicker = (tc.cover_kicker || "").trim() || "We invite you to\ncelebrate our wedding"
  const openLabel = (tc.open_button || "").trim() || "Tap to open"
  const apology = (tc.cover_apology || "").trim()
  const venueLine = (events[0]?.venue || "").trim()
  const countdownTitle = (tc.countdown_title || "").trim() || "Countdown"
  const countdownIntro = (tc.countdown_intro || "").trim() || "Until"
  const saveDateLabel = (tc.save_date_label || "").trim() || "Save the Date"
  const openingTitle = (profile.opening_title || "").trim() || "A Word of Welcome"
  const openingBody = (profile.opening_description || "").trim()
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || "The Couple"
  const mempelaiIntro =
    (tc.profiles_intro || "").trim() || "With the blessing of our families, we invite you to share in our joy."
  const parentsLabel = (tc.parents_label || "").trim() || "Blessed by"
  const storyTitle = (tc.love_story_title || "").trim() || "Our Story"
  const eventsTitle = (tc.events_title || "").trim() || "The Celebration"
  const eventsKicker = (tc.events_kicker || "").trim()
  const eventsNote = (tc.events_note || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "View on Map"
  const invitingKicker = (tc.inviting_kicker || "").trim()
  const invitingTitle = (tc.inviting_title || "").trim() || "With Honor"
  const invitingIntro =
    (tc.inviting_intro || "").trim() || "Together with the families who extend this invitation alongside us."
  const rundownTitle = (tc.rundown_title || "").trim() || "The Day"
  const rundownKicker = (tc.rundown_kicker || "").trim() || "Program"
  const rundownIntro = (tc.rundown_intro || "").trim() || "The order of our celebration, from the first arrival to the last dance."
  const galleryTitle = (tc.gallery_title || "").trim() || "Gallery"
  const galleryIntro = (tc.gallery_intro || "").trim() || "A few frames from the days that led us here."
  const galleryQuote = (tc.gallery_quote || "").trim()
  const videoKicker = (tc.video_kicker || "").trim() || "The Film"
  const videoTitle = (tc.video_title || "").trim()
  const videoIntro = (tc.video_intro || "").trim() || "The day as it happened, kept in motion."
  const giftTitle = (tc.gift_intro_title || "").trim() || "Wedding Gift"
  const giftIntro = (tc.gift_intro_description || "").trim() || "Your presence is our greatest gift."
  const giftWish = (tc.gift_wish || "").trim() || "If you wish to honour us with a gift, we kindly prefer monetary contributions."
  const giftButton = (tc.gift_button || "").trim() || "View bank details"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dress Code"
  const wishesTitle = (tc.wishes_title || "").trim() || "Best Wishes"
  const wishesIntro =
    (tc.wishes_intro || "").trim() || "Leave a wish, a prayer, or a memory for us to keep."
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
    submit: (tc.wishes_submit || "").trim() || "Send wishes",
    empty: (tc.wishes_empty || "").trim() || "No wishes yet. Be the first.",
  }

  const dayStrip = useMemo(() => {
    if (!dateObject) return []
    return [-2, -1, 0, 1, 2].map((offset) => {
      const date = new Date(dateObject)
      date.setDate(dateObject.getDate() + offset)
      return { day: date.getDate(), isWedding: offset === 0 }
    })
  }, [dateObject])

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

  const playHero = useCallback(() => {
    const video = heroVideoRef.current
    if (!video) return
    const played = video.play()
    if (played && typeof played.catch === "function") played.catch(() => undefined)
  }, [])

  const openInvitation = useCallback(() => {
    setPhase((current) => {
      if (current !== "idle") return current
      return "playing"
    })
    window.scrollTo(0, 0)
    playMusic()
    playHero()
  }, [playMusic, playHero])

  const finishGate = useCallback(() => {
    const video = gateVideoRef.current
    if (video) {
      try {
        video.pause()
        if (Number.isFinite(video.duration)) video.currentTime = video.duration
      } catch {
        /* ignore */
      }
    }
    setPhase("done")
  }, [])

  // The envelope film only starts downloading once the guest is on the gate,
  // and the gate releases on `ended` (with a cap so a broken file cannot trap
  // the guest). Reduced motion skips the film entirely.
  useEffect(() => {
    if (phase !== "playing") return
    const video = gateVideoRef.current
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done")
      playHero()
      return
    }
    const played = video.play()
    if (played && typeof played.catch === "function") played.catch(() => finishGate())
    const cap = window.setTimeout(() => {
      if (!video.ended) finishGate()
    }, 14000)
    return () => window.clearTimeout(cap)
  }, [phase, finishGate, playHero])

  // Warm the envelope film shortly after the gate is painted: the guest is
  // reading the envelope, and a preloaded film opens without a stall. Only the
  // preload hint is raised — calling load() here would reset the element and
  // freeze a film the guest has already started.
  useEffect(() => {
    if (phase !== "idle") return
    const video = gateVideoRef.current
    if (!video) return
    const timer = window.setTimeout(() => {
      if (video.preload !== "auto") video.preload = "auto"
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [phase])

  // A film that stops advancing must never trap the guest behind the gate:
  // six seconds without a frame and the invitation opens anyway.
  useEffect(() => {
    if (phase !== "playing") return
    const video = gateVideoRef.current
    if (!video) return
    let last = Date.now()
    const bump = () => {
      last = Date.now()
    }
    video.addEventListener("timeupdate", bump)
    video.addEventListener("playing", bump)
    const watchdog = window.setInterval(() => {
      if (Date.now() - last > 6000) finishGate()
    }, 1000)
    return () => {
      window.clearInterval(watchdog)
      video.removeEventListener("timeupdate", bump)
      video.removeEventListener("playing", bump)
    }
  }, [phase, finishGate])

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

  const stepLightbox = useCallback(
    (direction: number) => {
      setLightbox((current) => (current === null ? null : (current + direction + gallery.length) % gallery.length))
    },
    [gallery.length]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-fr-reveal]"))
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )
    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [stories.length, rundown.length, honored.length, gallery.length, accounts.length, events.length, giftOpen, opened])

  useEffect(() => {
    const locked = phase !== "done"
    document.body.classList.toggle("fr-locked", locked)
    rootRef.current?.classList.toggle("is-locked", locked)
    return () => {
      document.body.classList.remove("fr-locked")
      rootRef.current?.classList.remove("is-locked")
    }
  }, [phase])

  // A whisper of parallax on the cloud band, exactly like the reference (a few
  // pixels), driven by one rAF on scroll instead of a per-frame listener.
  useEffect(() => {
    const clouds = cloudsRef.current
    if (!clouds) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const box = clouds.getBoundingClientRect()
      const progress = Math.max(-1, Math.min(1, (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight))
      clouds.style.transform = `translate3d(${(-progress * 9).toFixed(2)}px, ${(progress * 3).toFixed(2)}px, 0) scale(1.006)`
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  // The film starts by itself once its frame is on screen (muted, with
  // controls) instead of waiting for a tap; mounting is deferred so the file
  // is not fetched by guests who never reach the section.
  useEffect(() => {
    if (!hasVideo) return
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
      { threshold: 0.35 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasVideo])

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

  const filmPoster = gallery[0] || stagePhoto
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&controls=1&fs=1`
    : ""

  return (
    <div ref={rootRef} className={`fr-root${opened ? " is-open" : ""}`} data-phase={phase}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="auto" data-warm-audio="" />}

      <div className="fr-gate" data-phase={phase} onClick={phase === "idle" ? openInvitation : undefined}>
        <img src={FRESCO_ASSETS.envelopePoster} alt="" draggable={false} />
        <video
          ref={gateVideoRef}
          className={gateLive ? "is-live" : undefined}
          src={FRESCO_ASSETS.envelopeVideo}
          poster={FRESCO_ASSETS.envelopePoster}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          onPlaying={() => setGateLive(true)}
          onEnded={finishGate}
          onError={finishGate}
        />
        {phase === "idle" && (
          <button
            type="button"
            className="fr-gate__hint"
            onClick={openInvitation}
            aria-label="Open the invitation"
          >
            <span className="fr-gate__to">Dear,</span>
            <span className="fr-gate__guest">{guestName}</span>
            <span className="fr-gate__open">{openLabel}</span>
            {apology && <span className="fr-gate__apology">{apology}</span>}
          </button>
        )}
      </div>

      <div className="fr-page" aria-hidden={!opened}>
        {/* 1 — cover: the painted coast behind the names */}
        <section className="fr-cover" data-section="sampul" aria-label="The wedding of">
          <div className="fr-cover__media">
            <video
              ref={heroVideoRef}
              src={FRESCO_ASSETS.heroVideo}
              poster={FRESCO_ASSETS.heroPoster}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
          <div className="fr-cover__copy">
            <CoverCopy
              groomName={groomName}
              brideName={brideName}
              invite={coverKicker}
              hasDate={!!dateObject}
              month={coverMonth}
              day={coverDay}
              weekday={dateWeekday}
              year={coverYear}
              venue={venueLine}
            />
          </div>
          {opened && (
            <button
              type="button"
              className="fr-cover__scroll"
              aria-label="Scroll down"
              onClick={() => countdownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="fr-cover__scrollRing">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </button>
          )}
        </section>

        {/* 2 — countdown inside the blue-and-white frame */}
        {dateObject && (
          <section className="fr-countdown" ref={countdownRef} data-section="countdown" aria-label="Countdown to the wedding day">
            <div className="fr-countdown__head" data-fr-reveal="up">
              <h2>{countdownTitle}</h2>
              <p>
                {countdownIntro} {dateLong}
              </p>
            </div>
            {calendarHref && (
              <a
                className="fr-countdown__cta"
                href={calendarHref}
                target="_blank"
                rel="noopener noreferrer"
                data-fr-reveal="up"
                style={{ "--fr-delay": "0.06s" } as CSSProperties}
              >
                {saveDateLabel}
              </a>
            )}
            <div data-fr-reveal="up" style={{ "--fr-delay": "0.1s" } as CSSProperties}>
              <Countdown target={target} />
            </div>
          </section>
        )}

        {/* 3 — the couple's own words (Kalimat Pembuka) */}
        {(openingBody || quoteText) && (
          <section className="fr-opening" data-section="pembuka" aria-label="Word of welcome">
            <img
              className="fr-opening__band"
              src={FRESCO_ASSETS.bandLeaves[4]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              draggable={false}
              data-fr-reveal="fade"
            />
            {quoteText && (
              <blockquote className="fr-opening__quote" data-fr-reveal="fade">
                <p>{quoteText}</p>
                {quoteSource && <cite>{quoteSource}</cite>}
              </blockquote>
            )}
            {openingBody && (
              <>
                <h2 data-fr-reveal="up">{openingTitle}</h2>
                <p data-fr-reveal="fade" style={{ "--fr-delay": "0.06s" } as CSSProperties}>
                  {openingBody}
                </p>
              </>
            )}
          </section>
        )}

        {/* 4 — mempelai */}
        {(groomFull || brideFull) && (
          <section className="fr-couple" data-section="mempelai" aria-label="The couple">
            <p className="fr-couple__kicker" data-fr-reveal="up">
              {mempelaiKicker}
            </p>
            {mempelaiIntro && (
              <p className="fr-couple__intro" data-fr-reveal="fade" style={{ "--fr-delay": "0.05s" } as CSSProperties}>
                {mempelaiIntro}
              </p>
            )}
            <div className="fr-couple__row">
              {/* The editor labels the groom "Mempelai Pertama", so he always
                  renders first; the bride follows. */}
              {[
                { key: "groom", name: groomFull, photo: groomShot, parents: profile.groom_parents, ig: groomIg },
                { key: "bride", name: brideFull, photo: brideShot, parents: profile.bride_parents, ig: brideIg },
              ]
                .filter((person) => !!person.name)
                .map((person, index) => (
                  <article className="fr-person" key={person.key} data-fr-reveal="up" style={{ "--fr-delay": `${index * 0.08}s` } as CSSProperties}>
                    <Portrait src={person.photo} alt={person.name} />
                    <h3 className="fr-person__name">{person.name}</h3>
                    {person.parents && (
                      <>
                        <p className="fr-person__parentsLabel">{parentsLabel}</p>
                        <p className="fr-person__parents">{person.parents}</p>
                      </>
                    )}
                    {person.ig && (
                      <a className="fr-person__ig" href={`https://instagram.com/${person.ig}`} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <rect x="3" y="3" width="18" height="18" rx="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.2" cy="6.8" r="1" />
                        </svg>
                        @{person.ig}
                      </a>
                    )}
                  </article>
                ))}
            </div>
          </section>
        )}

        {/* 5 — our story under the painted clouds */}
        {stories.length > 0 && (
          <section
            className={`fr-story${events.length > 0 ? " fr-story--band" : ""}${storyPhoto ? " fr-story--photo" : ""}`}
            data-section="story"
            aria-label="Our story"
          >
            <div className="fr-story__clouds" aria-hidden="true">
              <img ref={cloudsRef} src={FRESCO_ASSETS.clouds} alt="" loading="lazy" draggable={false} />
            </div>
            <div className="fr-story__inner">
              <div className="fr-story__title" data-fr-reveal="fade">
                <h2>{storyTitle}</h2>
              </div>
              {storyPhoto && (
                <figure className="fr-story__photo" data-fr-reveal="fade">
                  <img src={storyPhoto} alt="" loading="lazy" draggable={false} />
                </figure>
              )}
              <div className="fr-story__body">
                {stories.map((story, index) => (
                  <div key={`${story.title || "story"}-${index}`} data-fr-reveal="fade" style={{ "--fr-delay": `${Math.min(index * 0.06, 0.24)}s` } as CSSProperties}>
                    {story.title && <p className="fr-story__chapter">{story.title}</p>}
                    <p>{story.description}</p>
                  </div>
                ))}
              </div>
              <div className="fr-story__sign" data-fr-reveal="fade" style={{ "--fr-delay": "0.1s" } as CSSProperties}>
                <span>
                  {groomName}
                  <i>and</i>
                  {brideName}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 6 — the celebration on the olive band */}
        {events.length > 0 && (
          <div className="fr-band" data-section="acara">
            <div className="fr-band__fountain" aria-hidden="true">
              <img src={FRESCO_ASSETS.fountain} alt="" loading="lazy" draggable={false} />
            </div>
            <section className="fr-celebration" aria-label="Wedding events">
              <div className="fr-celebration__head" data-fr-reveal="up">
                <h2>{eventsTitle}</h2>
                {eventsKicker && <p>{eventsKicker}</p>}
              </div>
              <div className="fr-events">
                {events.map((event, index) => (
                  <article className="fr-event" key={`${event.name || "event"}-${index}`} data-fr-reveal="up" style={{ "--fr-delay": `${Math.min(index * 0.06, 0.2)}s` } as CSSProperties}>
                    {event.name && <h3>{event.name}</h3>}
                    {event.venue && <p className="fr-event__venue">{event.venue}</p>}
                    {event.address && <p className="fr-event__address">{event.address}</p>}
                    {event.date && <p className="fr-event__date">{longDate(event.date, true)}</p>}
                    {event.time && <p className="fr-event__time">{event.time}</p>}
                    {event.maps_url && (
                      <a className="fr-event__map" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                        {mapsLabel}
                      </a>
                    )}
                  </article>
                ))}
              </div>
              {eventsNote && (
                <p className="fr-events__note" data-fr-reveal="fade">
                  {eventsNote}
                </p>
              )}
            </section>
          </div>
        )}

        {/* 7 — the day: villa painting + programme timeline */}
        {rundown.length > 0 && (
          <>
            <div className="fr-villa" aria-hidden="true">
              <img src={FRESCO_ASSETS.villa} alt="" loading="lazy" draggable={false} />
            </div>
            <section className="fr-day" data-section="rundown" aria-label="Order of the day">
              <div className="fr-day__inner">
                <div className="fr-day__head">
                  <h2 data-fr-reveal="up">{rundownTitle}</h2>
                  <p className="fr-day__kicker" data-fr-reveal="fade" style={{ "--fr-delay": "0.04s" } as CSSProperties}>
                    {dateLong ? `${rundownKicker} · ${dateLong}` : rundownKicker}
                  </p>
                  {rundownIntro && (
                    <p className="fr-day__intro" data-fr-reveal="fade" style={{ "--fr-delay": "0.08s" } as CSSProperties}>
                      {rundownIntro}
                    </p>
                  )}
                </div>
                {dayStrip.length > 0 && (
                  <div className="fr-day__strip" data-fr-reveal="fade" style={{ "--fr-delay": "0.1s" } as CSSProperties}>
                    {dayStrip.slice(0, 2).map((day) => (
                      <span key={`pre-${day.day}`}>{pad2(day.day)}</span>
                    ))}
                    <div className="fr-day__heart">
                      <HeartMark />
                      <b>{pad2(dateObject ? dateObject.getDate() : 0)}</b>
                    </div>
                    {dayStrip.slice(3).map((day) => (
                      <span key={`post-${day.day}`}>{pad2(day.day)}</span>
                    ))}
                  </div>
                )}
                <div className="fr-day__timeline">
                  <div className="fr-day__rows">
                    {rundown.map((row, index) => (
                      <div className="fr-row" key={`${row.time || "row"}-${index}`} data-fr-reveal="up" style={{ "--fr-delay": `${Math.min(index * 0.05, 0.25)}s` } as CSSProperties}>
                        <span className="fr-row__marker" aria-hidden="true">
                          <HeartMark />
                        </span>
                        <div className="fr-row__text">
                          {row.time && <p className="fr-row__time">{row.time}</p>}
                          {row.description && <p className="fr-row__desc">{row.description}</p>}
                        </div>
                        <span className="fr-row__icon" aria-hidden="true">
                          <img src={FRESCO_ASSETS.dayIcons[index % FRESCO_ASSETS.dayIcons.length]} alt="" loading="lazy" draggable={false} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* cenefa strip (the reference's shimmering divider) */}
        <div className="fr-strip" aria-hidden="true" data-fr-reveal="fade">
          <div className="fr-strip__inner">
            <img src={FRESCO_ASSETS.bandBase} alt="" loading="lazy" draggable={false} />
            {FRESCO_ASSETS.bandLeaves.map((leaf, index) => (
              <img
                key={leaf}
                className="fr-strip__leaf"
                src={leaf}
                alt=""
                loading="lazy"
                draggable={false}
                style={{ animationDelay: `${(index * 1.7).toFixed(1)}s` }}
              />
            ))}
          </div>
        </div>

        {/* 8 — dress code */}
        {hasDresscode && (
          <section className="fr-dress" data-section="dresscode" aria-label="Dress code">
            <div className="fr-dress__head">
              <h2 data-fr-reveal="up">{dressKicker}</h2>
              {dressTitle && (
                <p className="fr-dress__title" data-fr-reveal="fade" style={{ "--fr-delay": "0.04s" } as CSSProperties}>
                  {dressTitle}
                </p>
              )}
            </div>
            <div className="fr-dress__art" data-fr-reveal="fade">
              <img src={FRESCO_ASSETS.dressGroup} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </div>
            {dressBody && <p className="fr-dress__body">{dressBody}</p>}
            {dressColors.length > 0 && (
              <ul className="fr-swatches">
                {dressColors.map((color, index) => (
                  <li className="fr-swatch" key={`${color.hex || color.name}-${index}`} data-fr-reveal="up" style={{ "--fr-delay": `${Math.min(index * 0.05, 0.2)}s` } as CSSProperties}>
                    <i style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                    {color.name && <span>{color.name}</span>}
                  </li>
                ))}
              </ul>
            )}
            {dressNote && <p className="fr-dress__note">{dressNote}</p>}
          </section>
        )}

        {/* 9 — turut mengundang inside the welcome arch */}
        {honored.length > 0 && (
          <section className="fr-inviting" data-section="inviting" aria-label="With honor">
            <div className="fr-arch">
              <div className="fr-arch__inner">
                <div className="fr-arch__texture" aria-hidden="true">
                  <img src={FRESCO_ASSETS.oliveTexture} alt="" loading="lazy" draggable={false} />
                </div>
                <img className="fr-arch__frame" src={FRESCO_ASSETS.archFrame} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                <img className="fr-arch__garland" src={FRESCO_ASSETS.archGarland} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                <div className="fr-arch__petals" aria-hidden="true">
                  {PETALS.map((petal) => (
                    <div
                      className="fr-petal"
                      key={`${petal.left}-${petal.petal}`}
                      style={{ left: `${petal.left}%`, animationDuration: `${petal.fall}s`, animationDelay: `${petal.fallDelay}s` }}
                    >
                      <img
                        src={FRESCO_ASSETS.petals[petal.petal]}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        style={{ width: `${petal.size}px`, animationDuration: `${petal.sway}s`, animationDelay: `${petal.swayDelay}s` }}
                      />
                    </div>
                  ))}
                </div>
                <img className="fr-arch__bottom" src={FRESCO_ASSETS.archBottom} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                <div className="fr-arch__copy">
                  {invitingKicker && (
                    <p className="fr-arch__kicker" data-fr-reveal="fade">
                      {invitingKicker}
                    </p>
                  )}
                  <h2 className="fr-arch__title" data-fr-reveal="up" style={{ "--fr-delay": "0.06s" } as CSSProperties}>
                    {invitingTitle}
                  </h2>
                  {invitingIntro && (
                    <p className="fr-arch__intro" data-fr-reveal="fade" style={{ "--fr-delay": "0.1s" } as CSSProperties}>
                      {invitingIntro}
                    </p>
                  )}
                  <ul className="fr-arch__families">
                    {honored.map((family, index) => (
                      <li key={`${family}-${index}`} data-fr-reveal="fade" style={{ "--fr-delay": `${Math.min(0.12 + index * 0.04, 0.4)}s` } as CSSProperties}>
                        {family}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10 — gallery */}
        {gallery.length > 0 && (
          <section className="fr-gallery" data-section="galeri" aria-label="Gallery">
            <div className="fr-gallery__head">
              <h2 data-fr-reveal="up">{galleryTitle}</h2>
              {galleryIntro && (
                <p data-fr-reveal="fade" style={{ "--fr-delay": "0.05s" } as CSSProperties}>
                  {galleryIntro}
                </p>
              )}
            </div>
            <div className="fr-gallery__marquee" data-fr-reveal="fade">
              <div className="fr-gallery__track" style={{ "--fr-dur": `${Math.max(34, gallery.length * 7)}s` } as CSSProperties}>
                {galleryLoop.map((url, index) => (
                  <figure className="fr-tile" key={`a-${index}`}>
                    <button type="button" onClick={() => setLightbox(index % gallery.length)} aria-label={`Photo ${(index % gallery.length) + 1}`}>
                      <img src={url} alt="" loading="lazy" draggable={false} />
                    </button>
                  </figure>
                ))}
              </div>
            </div>
            {gallery.length > 2 && (
              <div className="fr-gallery__marquee fr-gallery__marquee--rev" data-fr-reveal="fade" style={{ marginTop: 12 }}>
                <div className="fr-gallery__track" style={{ "--fr-dur": `${Math.max(38, gallery.length * 8)}s` } as CSSProperties}>
                  {[...gallery].reverse().concat([...gallery].reverse()).map((url, index) => (
                    <figure className="fr-tile" key={`b-${index}`}>
                      <button
                        type="button"
                        onClick={() => setLightbox((gallery.length - 1 - (index % gallery.length) + gallery.length) % gallery.length)}
                        aria-label={`Photo ${gallery.length - (index % gallery.length)}`}
                      >
                        <img src={url} alt="" loading="lazy" draggable={false} />
                      </button>
                    </figure>
                  ))}
                </div>
              </div>
            )}
            {galleryQuote && (
              <p className="fr-gallery__quote" data-fr-reveal="fade">
                {galleryQuote}
              </p>
            )}
          </section>
        )}

        {/* 11 — the couple's film */}
        {hasVideo && film && (
          <section className="fr-film" data-section="video" aria-label="The wedding film">
            <h2 data-fr-reveal="up">{videoTitle || videoKicker}</h2>
            {videoIntro && (
              <p className="fr-film__intro" data-fr-reveal="fade">
                {videoIntro}
              </p>
            )}
            <div
              className="fr-film__stage"
              ref={filmRef}
              data-fr-reveal="fade"
              style={filmPoster ? { backgroundImage: `url(${filmPoster})` } : undefined}
            >
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
                  {filmPoster && <img className="fr-film__poster" src={filmPoster} alt="" aria-hidden="true" />}
                  <button type="button" className="fr-film__play" onClick={() => setFilmOn(true)} aria-label="Play the wedding film">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M8 5v14l11-7Z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* 12 — wedding gift */}
        {hasGift && (
          <section className="fr-gift" data-section="gift" aria-label="Wedding gift">
            <div className="fr-gift__inner">
              <h2 data-fr-reveal="fade">{giftTitle}</h2>
              {giftIntro && (
                <p className="fr-gift__intro" data-fr-reveal="fade" style={{ "--fr-delay": "0.05s" } as CSSProperties}>
                  {giftIntro}
                </p>
              )}
              <div className="fr-gift__wreath">
                <img src={FRESCO_ASSETS.giftWreath} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                <div className="fr-gift__wreathText">
                  <p data-fr-reveal="fade">{giftWish}</p>
                </div>
              </div>
              <button
                type="button"
                className="fr-gift__button"
                onClick={() => setGiftOpen((value) => !value)}
                aria-expanded={giftOpen}
                data-fr-reveal="up"
              >
                {giftButton}
              </button>
              {giftOpen && (
                <div className="fr-gift__details">
                  {accounts.map((account, index) => (
                    <button
                      type="button"
                      className="fr-account"
                      key={`${account.account_number || "account"}-${index}`}
                      onClick={() => copyText(account.account_number || "", accountToast)}
                    >
                      {account.provider_name && <span className="fr-account__bank">{account.provider_name}</span>}
                      {account.account_number && <span className="fr-account__number">{account.account_number}</span>}
                      {account.account_name && <span className="fr-account__name">{account.account_name}</span>}
                      <span className="fr-account__copy">{accountButton}</span>
                    </button>
                  ))}
                  {giftAddress && (
                    <div className="fr-account">
                      {profile.gift_address_name && (
                        <span className="fr-account__bank">{profile.gift_address_name}</span>
                      )}
                      <span className="fr-account__name">{giftAddress}</span>
                      <button type="button" className="fr-account__copy" onClick={() => copyText(giftAddress, addressToast)}>
                        {addressButton}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 13 — wishes (the reference's RSVP surface, wishes only) */}
        <section className="fr-wishes" data-section="wishes" aria-label="Wishes for the couple">
          <div className="fr-wishes__inner">
            <img className="fr-wishes__window" src={FRESCO_ASSETS.wishesWindow} alt="" aria-hidden="true" loading="lazy" draggable={false} data-fr-reveal="fade" />
            <h2 data-fr-reveal="up">{wishesTitle}</h2>
            <div className="fr-wishes__rule" aria-hidden="true">
              <i />
              <b />
              <i />
            </div>
            <p className="fr-wishes__intro" data-fr-reveal="fade">
              {wishesIntro}
            </p>
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

        {/* 14 — closing arch */}
        <footer className="fr-closing" data-section="closing" aria-label="Closing">
          <div className="fr-closing__inner">
            <img src={FRESCO_ASSETS.closingArch} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <div className="fr-closing__text">
              <p className="fr-closing__name">{groomName}</p>
              <p className="fr-closing__amp" aria-hidden="true">
                &amp;
              </p>
              <p className="fr-closing__name">{brideName}</p>
              {dateLong && <p className="fr-closing__date">{dateLong}</p>}
            </div>
          </div>
          {hashtag && <p className="fr-closing__hashtag">{hashtag}</p>}
          {closingMessage && <p className="fr-closing__message">{closingMessage}</p>}
          <div className="fr-footer">
            <a
              className="fr-footer__link"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Aksaraa Wedding on WhatsApp"
            >
              <span className="fr-footer__badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
              </span>
              <span className="fr-footer__cta">Wedding by Aksaraa</span>
            </a>
            <p className="fr-footer__text">
              © {new Date().getFullYear()} {coupleLabel}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className="fr-music"
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
        <div className="fr-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightbox(null)}>
          <button type="button" className="fr-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>
            ×
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="fr-lightbox__nav fr-lightbox__nav--prev"
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
              className="fr-lightbox__nav fr-lightbox__nav--next"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
          <span className="fr-lightbox__count" aria-hidden="true">
            {lightbox + 1} / {gallery.length}
          </span>
        </div>
      )}

      {toast && (
        <div className="fr-toast" role="status">
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
