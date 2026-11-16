"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  countdownTarget,
  coverPhoto,
  flattenPhotos,
  groomPhoto,
  bridePhoto,
  initialsGlyphs,
  initialsOf,
  monogramFontSize,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import Gift from "./Gift"
import layoutJson from "./layout.json"
import gateJson from "./gate.json"
import "./lunar-blossom.css"

type LayoutElement = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  src?: string
  html?: string
  role?: string
  r?: number
  opacity?: number
  flipX?: boolean
  bg?: string
  color?: string
}

type LayoutSection = {
  id: string
  kind: string
  top: number
  height: number
  background: string
  elements: LayoutElement[]
}

type Layout = {
  canvasWidth: number
  totalHeight: number
  sections: LayoutSection[]
}

const layout = layoutJson as unknown as Layout
const gate = gateJson as unknown as {
  width: number
  height: number
  background: string
  elements: { role: string; x: number; y: number; w: number; h: number }[]
}

const A = (name: string) => `/templates/lunar-blossom/assets/${name}`

const COPY = {
  EN: {
    guest: "Dear",
    invite: "You are invited to celebrate the wedding of",
    open: "Open Invitation",
    heroSub: "We are getting married",
    coupleTitle: "Bride & Groom",
    eventsTitle: "Events & Venue",
    countdownTitle: "Save The Date",
    rsvpTitle: "Rsvp",
    wishesTitle: "Wishes",
    giftTitle: "E-Gift",
    galleryTitle: "Gallery",
    galleryCaption: "Captured in Love",
    closingTitle: "Thank You",
    closingText:
      "Thanks for your presence, participation and blessing. It is our honor and joy to share this special moment with you.",
    eventsIntro:
      "By the grace of God, we cordially request the honour of your presence at the marriage of our beloved children",
    honoredTitle: "Also Inviting",
    storyTitle: "Love Story",
    quoteSource: "Colossians 3:14",
    quoteText: "Love binds them all together in perfect unity.",
    giftIntro:
      "Your presence is the greatest gift. If you wish to send a token of love, the details are available below.",
    holyMatrimony: "Holy Matrimony",
    reception: "Reception",
    seeLocation: "See Location",
    noVideo: "Our wedding film",
    copied: "Copied to clipboard",
  },
  ID: {
    guest: "Kepada",
    invite: "Anda diundang untuk merayakan pernikahan",
    open: "Buka Undangan",
    heroSub: "Kami akan menikah",
    coupleTitle: "Mempelai",
    eventsTitle: "Acara & Lokasi",
    countdownTitle: "Simpan Tanggal",
    rsvpTitle: "Konfirmasi",
    wishesTitle: "Ucapan",
    giftTitle: "Hadiah",
    galleryTitle: "Galeri",
    galleryCaption: "Terkabadikan dalam Cinta",
    closingTitle: "Terima Kasih",
    closingText:
      "Terima kasih atas kehadiran, partisipasi, dan doa restu Anda. Merupakan kehormatan dan kebahagiaan bagi kami dapat berbagi momen istimewa ini.",
    eventsIntro:
      "Dengan kasih karunia Tuhan, kami dengan hormat memohon kehadiran Anda pada pernikahan anak-anak kami tercinta",
    honoredTitle: "Turut Mengundang",
    storyTitle: "Kisah Cinta",
    quoteSource: "Kolose 3:14",
    quoteText: "Kasih adalah pengikat yang mempersatukan dan menyempurnakan.",
    giftIntro:
      "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
    holyMatrimony: "Akad Nikah",
    reception: "Resepsi",
    seeLocation: "Lihat Lokasi",
    noVideo: "Film pernikahan kami",
    copied: "Tersalin ke clipboard",
  },
} as const

const DEFAULT_EVENTS = [
  {
    name: "Holy Matrimony",
    date: "2026-09-22",
    time: "09.00 - 11.00 WIB",
    venue: "Bride House",
    address: "Jakarta",
    maps_url: "",
  },
  {
    name: "Reception",
    date: "2026-09-22",
    time: "12.00 - 14.00 WIB",
    venue: "Reception Hall",
    address: "Jakarta",
    maps_url: "",
  },
]

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
const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const ID_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

function toDate(value?: string): Date | null {
  if (!value) return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function dateParts(value: string | undefined, lang: "EN" | "ID") {
  const d = toDate(value)
  if (!d) return { day: "", month: "" }
  const days = lang === "ID" ? ID_DAYS : EN_DAYS
  const months = lang === "ID" ? ID_MONTHS : EN_MONTHS
  return {
    day: `${days[d.getDay()]}, ${d.getDate()}`,
    month: `${months[d.getMonth()]} ${d.getFullYear()}`,
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
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

function elementStyle(e: LayoutElement): CSSProperties {
  const transforms = [`translate(${e.x}px, ${e.y}px)`]
  if (e.r) transforms.push(`rotate(${e.r}deg)`)
  if (e.flipX) transforms.push("scaleX(-1)")
  return {
    width: e.w,
    height: e.h,
    transform: transforms.join(" "),
    ...(e.opacity != null && e.opacity < 1 ? { opacity: e.opacity } : {}),
  }
}

function roleStyle(e: LayoutElement, extra?: CSSProperties): CSSProperties {
  return {
    ...elementStyle(e),
    ...extra,
  }
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h15M5 1v3M12 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function GateEnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.5 6.7501H10.5C10.7763 6.7501 11 6.52635 11 6.2501V5.7501C11 5.47385 10.7763 5.2501 10.5 5.2501H5.5C5.22375 5.2501 5 5.47385 5 5.7501V6.2501C5 6.52635 5.22375 6.7501 5.5 6.7501ZM5 9.2501C5 9.52635 5.22375 9.7501 5.5 9.7501H10.5C10.7763 9.7501 11 9.52635 11 9.2501V8.7501C11 8.47385 10.7763 8.2501 10.5 8.2501H5.5C5.22375 8.2501 5 8.47385 5 8.7501V9.2501ZM8 13.0354C7.48687 13.0354 6.97375 12.8773 6.53562 12.5607L0 7.83947V14.5001C0 15.3285 0.671562 16.0001 1.5 16.0001H14.5C15.3284 16.0001 16 15.3285 16 14.5001V7.83947L9.46437 12.5607C9.02625 12.877 8.51313 13.0354 8 13.0354ZM15.4253 5.09228C15.1487 4.87541 14.8866 4.67135 14.5 4.37947V3.0001C14.5 2.17166 13.8284 1.5001 13 1.5001H10.5766C10.4816 1.43135 10.3931 1.36697 10.2941 1.2951C9.76875 0.911659 8.725 -0.0108411 8 9.64178e-05C7.275 -0.0108411 6.23156 0.911659 5.70594 1.2951C5.60687 1.36697 5.51844 1.43135 5.42344 1.5001H3C2.17156 1.5001 1.5 2.17166 1.5 3.0001V4.37947C1.11344 4.67103 0.85125 4.87541 0.574687 5.09228C0.395683 5.23258 0.250926 5.41175 0.151364 5.61623C0.0518019 5.82072 4.23371e-05 6.04516 0 6.2726L0 6.60541L3 8.7726V3.0001H13V8.7726L16 6.60541V6.2726C16 5.81197 15.7881 5.37666 15.4253 5.09228Z"
        fill="currentColor"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function instagramHandle(raw?: string): string {
  return (raw || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
}

function GalleryWidget({
  photos,
  lang,
  onOpen,
}: {
  photos: string[]
  lang: "EN" | "ID"
  onOpen: (index: number) => void
}) {
  const [index, setIndex] = useState(0)
  const list = photos.length > 0 ? photos : [A("hero-art.webp")]

  useEffect(() => {
    if (list.length <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 4500)
    return () => window.clearInterval(id)
  }, [list.length])

  return (
    <div className="lb-gallery">
      <button type="button" className="lb-gallery__stage" onClick={() => onOpen(index % list.length)} aria-label="Open photo">
        <img src={list[index % list.length]} alt="" draggable={false} />
        <span className="lb-gallery__count">
          {String((index % list.length) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
      </button>
      <div className="lb-gallery__bar">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
          aria-label={lang === "ID" ? "Foto sebelumnya" : "Previous photo"}
        >
          ‹
        </button>
        <div className="lb-gallery__dots">
          {list.slice(0, 8).map((photo, i) => (
            <button
              key={`${photo}-${i}`}
              type="button"
              className={i === index % list.length ? "is-active" : ""}
              onClick={() => setIndex(i)}
              aria-label={`${lang === "ID" ? "Foto" : "Photo"} ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % list.length)}
          aria-label={lang === "ID" ? "Foto berikutnya" : "Next photo"}
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default function LunarBlossom(profile: TemplateProps) {
  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const [opened, setOpened] = useState(false)
  const [lang, setLang] = useState<"EN" | "ID">("EN")
  const [scale, setScale] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [lightbox, setLightbox] = useState<number | null>(null)

  const shellRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const c = COPY[lang]
  const groomShort = (profile.groom_name || "").trim() || "Groom"
  const brideShort = (profile.bride_name || "").trim() || "Bride"
  const groomFull = (profile.groom_full_name || groomShort).trim()
  const brideFull = (profile.bride_full_name || brideShort).trim()
  const groomIg = instagramHandle(profile.groom_instagram)
  const brideIg = instagramHandle(profile.bride_instagram)
  const coupleLabel =
    profile.display_name?.trim() || [groomShort, brideShort].filter(Boolean).join(" & ") || "The Wedding"
  const guestName = profile.guest_name || (lang === "ID" ? "Tamu Undangan" : "Our Beloved Guest")
  const initials = (profile.couple_initials || "").trim() || initialsOf(brideShort, groomShort)
  const initialsList = initialsGlyphs(initials)
  // The reference stacks two glyphs; a longer abbreviation prints as one line
  // (second slot hidden) so no character is dropped.
  const longInitials = initialsList.length > 2
  const cover = coverPhoto(profile)
  const groomImage = groomPhoto(profile.groom_photo_url)
  const brideImage = bridePhoto(profile.bride_photo_url)
  const photos = flattenPhotos(profile.gallery_photos)
  const gallery = photos.length > 0 ? photos : [cover]
  const events = (profile.sessions || []).filter(Boolean)
  const event0 = events[0] || DEFAULT_EVENTS[0]
  const event1 = events[1]
  const hasSecondEvent = events.length > 1
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => (s.title || s.description || s.image_url))
      : []
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const accounts =
    profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false
      ? profile.gift_address || ""
      : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  const showGuestDock =
    opened &&
    !profile.template_demo &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const quoteSource = profile.quote_source || c.quoteSource
  const quoteText = profile.quote_text || c.quoteText
  const giftIntro = tc.gift_intro_description || c.giftIntro
  const closingText = tc.closing_message || c.closingText
  const eventsIntro = tc.events_intro || c.eventsIntro
  const welcomeInvite = tc.welcome_invite || c.invite
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter(Boolean)
      : []

  const day0 = dateParts(event0.date, lang)
  const month0 = day0.month
  const day1 = dateParts(event1?.date, lang)
  const month1 = day1.month
  const gateDateLabel = (() => {
    const d = toDate(event0.date)
    return d
      ? d.toLocaleDateString(lang === "ID" ? "id-ID" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : ""
  })()

  const calendarUrl = (() => {
    const d = toDate(event0.date) || toDate(profile.estimated_wedding_date)
    if (!d) return ""
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const text = encodeURIComponent(`The Wedding of ${groomShort} & ${brideShort}`)
    const details = encodeURIComponent("You're invited to our wedding!")
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${y}${m}${day}T000000/${y}${m}${day}T001500&details=${details}`
  })()

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  const copy = useCallback(
    async (text: string) => {
      if (!text) return
      try {
        await navigator.clipboard.writeText(text)
        showToast(c.copied)
      } catch {
        showToast(lang === "ID" ? "Gagal menyalin" : "Could not copy")
      }
    },
    [c.copied, lang, showToast]
  )

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    window.setTimeout(() => {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    }, 60)
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setPlaying(true), () => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  useEffect(() => {
    if (!opened) return
    const el = shellRef.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / layout.canvasWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [opened])

  useEffect(() => {
    if (!opened) return
    let raf = 0
    const reveal = () => {
      raf = 0
      const vh = window.innerHeight || document.documentElement.clientHeight
      document.querySelectorAll<HTMLElement>(".lb-el:not(.is-visible)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.96) el.classList.add("is-visible")
      })
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(reveal)
    }
    reveal()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [opened])

  useEffect(() => {
    const value = opened ? "" : "hidden"
    document.body.style.overflow = value
    document.documentElement.style.overflow = value
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [opened])

  useEffect(() => {
    if (!opened || !hasTrack) return
    const audio = audioRef.current
    if (!audio) return
    audio.play().then(() => setPlaying(true), () => setPlaying(false))
  }, [opened, hasTrack])

  const roleNode = (role: string): ReactNode => {
    switch (role) {
      case "display-names":
        return (
          <>
            <span>{groomShort}</span>
            <span className="lb-amp">&amp;</span>
            <span>{brideShort}</span>
          </>
        )
      case "hero-subtitle":
        return c.heroSub
      case "quote":
        return (
          <>
            <span className="lb-quote__source">{quoteSource}</span>
            <span className="lb-quote__text">&ldquo;{quoteText}&rdquo;</span>
          </>
        )
      case "initial-1":
        return longInitials ? initialsList.join("") : (initialsList[0] || "")
      case "initial-2":
        return longInitials ? null : (initialsList[1] || initialsList[0] || "")
      case "couple-title":
        return c.coupleTitle
      case "bride-name":
        return (
          <>
            <span className="lb-name__short">{brideShort}</span>
            {brideFull && brideFull !== brideShort && <span className="lb-name__full">{brideFull}</span>}
          </>
        )
      case "bride-parents":
        return (
          <>
            <span className="lb-parents__text">{profile.bride_parents || ""}</span>
            {brideIg && (
              <a className="lb-ig" href={`https://instagram.com/${brideIg}`} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                <span>@{brideIg}</span>
              </a>
            )}
          </>
        )
      case "groom-name":
        return (
          <>
            <span className="lb-name__short">{groomShort}</span>
            {groomFull && groomFull !== groomShort && <span className="lb-name__full">{groomFull}</span>}
          </>
        )
      case "groom-parents":
        return (
          <>
            <span className="lb-parents__text">{profile.groom_parents || ""}</span>
            {groomIg && (
              <a className="lb-ig" href={`https://instagram.com/${groomIg}`} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                <span>@{groomIg}</span>
              </a>
            )}
          </>
        )
      case "countdown-title":
        return c.countdownTitle
      case "events-title":
        return c.eventsTitle
      case "events-intro":
        return eventsIntro
      case "honored-title":
        return c.honoredTitle
      case "story-title":
        return c.storyTitle
      case "story-list":
        return (
          <ol className="lb-chapters">
            {stories.map((story, i) => (
              <li key={i} className={i % 2 === 1 ? "is-alt" : ""}>
                {story.image_url && (
                  <div className="lb-chapter__photo">
                    <img src={story.image_url} alt="" loading="lazy" draggable={false} />
                  </div>
                )}
                {story.title && <p className="lb-chapter__title">{story.title}</p>}
                {story.description && <p className="lb-chapter__text">{story.description}</p>}
              </li>
            ))}
          </ol>
        )
      case "honored-list":
        return (
          <ul className="lb-honored">
            {honored.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )
      case "event-0-name":
        return event0.name || c.holyMatrimony
      case "event-0-day":
        return day0.day
      case "event-0-month":
        return month0
      case "event-0-time":
        return event0.time || ""
      case "event-0-venue":
        return event0.venue || ""
      case "event-0-address":
        return event0.address || ""
      case "event-1-name":
        return event1?.name || c.reception
      case "event-1-day":
        return day1.day
      case "event-1-month":
        return month1
      case "event-1-time":
        return event1?.time || ""
      case "event-1-venue":
        return event1?.venue || ""
      case "event-1-address":
        return event1?.address || ""
      case "rsvp-title":
        return c.rsvpTitle
      case "wishes-title":
        return c.wishesTitle
      case "gift-title":
        return c.giftTitle
      case "gallery-title":
        return c.galleryTitle
      case "gallery-caption":
        return (
          <>
            <span>{c.galleryCaption.split(" ")[0]}</span>
            <span>{c.galleryCaption.split(" ").slice(1).join(" ")}</span>
          </>
        )
      case "closing-title":
        return c.closingTitle
      case "closing-text":
        return closingText
      default:
        return null
    }
  }

  const renderElement = (e: LayoutElement) => {
    const style = elementStyle(e)
    const key = e.id

    if (e.role === "countdown") {
      return (
        <div key={key} className="lb-el lb-countdown" style={style}>
          <div className="lb-countdown__grid">
            {[
              [countdown?.d ?? "00", lang === "ID" ? "Hari" : "Days"],
              [countdown?.h ?? "00", lang === "ID" ? "Jam" : "Hours"],
              [countdown?.m ?? "00", lang === "ID" ? "Menit" : "Minutes"],
              [countdown?.s ?? "00", lang === "ID" ? "Detik" : "Seconds"],
            ].map(([value, label]) => (
              <div key={label} className="lb-countdown__cell">
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {calendarUrl && (
            <a className="lb-countdown__cta" href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <CalendarIcon />
              <span>{c.countdownTitle}</span>
            </a>
          )}
        </div>
      )
    }

    if (e.role === "wishes") {
      return (
        <div key={key} className="lb-el lb-widget" style={style}>
          <Wishes
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            guestLinkStrict={profile.guest_link_strict}
            coupleName={coupleLabel}
            lang={lang}
          />
        </div>
      )
    }

    if (e.role === "gift") {
      return (
        <div key={key} className="lb-el lb-widget" style={style}>
          {hasGift ? (
            <Gift
              accounts={accounts}
              address={giftAddress}
              addressName={profile.gift_address_name}
              intro={giftIntro}
              lang={lang}
              onCopy={copy}
            />
          ) : (
            <p className="lb-widget__empty">
              {lang === "ID" ? "Detail hadiah belum tersedia." : "Gift details are not available yet."}
            </p>
          )}
        </div>
      )
    }

    if (e.role === "gallery") {
      return (
        <div key={key} className="lb-el lb-widget" style={style}>
          <GalleryWidget photos={gallery} lang={lang} onOpen={setLightbox} />
        </div>
      )
    }

    if (e.role === "video") {
      if (!hasVideo) return null
      return (
        <div key={key} className="lb-el lb-video" style={style}>
          <iframe
            src={videoEmbed}
            title={c.noVideo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )
    }

    if (e.role === "event-0-map" || e.role === "event-1-map") {
      const session = e.role === "event-0-map" ? event0 : event1
      if (!session || !session.maps_url) return null
      return (
        <a
          key={key}
          className="lb-el lb-map"
          style={style}
          href={session.maps_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {c.seeLocation}
        </a>
      )
    }

    if (e.role === "couple-frame") {
      return (
        <div key={key} className="lb-el lb-frame" style={style}>
          <img src={cover} alt="" draggable={false} />
        </div>
      )
    }

    if (e.role === "cover-photo") {
      return (
        <div key={key} className="lb-el lb-photo lb-photo--cover" style={style}>
          <img src={cover} alt="" draggable={false} />
        </div>
      )
    }
    if (e.role === "bride-photo") {
      return (
        <div key={key} className="lb-el lb-photo lb-photo--person" style={style}>
          <img src={brideImage} alt={brideShort} draggable={false} />
        </div>
      )
    }
    if (e.role === "groom-photo") {
      return (
        <div key={key} className="lb-el lb-photo lb-photo--person" style={style}>
          <img src={groomImage} alt={groomShort} draggable={false} />
        </div>
      )
    }

    if (e.role === "display-hashtag") {
      if (!profile.display_name) return null
      return <div key={key} className="lb-el lb-t lb-r-display-hashtag" style={roleStyle(e)}>{profile.display_name}</div>
    }

    if (e.role === "groom-instagram" || e.role === "bride-instagram") {
      const handle = instagramHandle(e.role === "groom-instagram" ? profile.groom_instagram : profile.bride_instagram)
      if (!handle) return null
      return (
        <div key={key} className={`lb-el lb-t lb-r-${e.role}`} style={roleStyle(e)}>
          <a className="lb-ig" href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer">
            <InstagramIcon />
            <span>@{handle}</span>
          </a>
        </div>
      )
    }

    if (e.role === "initial-2" && longInitials) return null

    if (e.role) {
      const longInitialStyle =
        longInitials && e.role === "initial-1" ? { fontSize: monogramFontSize(initials, 64) } : undefined
      return (
        <div key={key} className={`lb-el lb-t lb-r-${e.role}`} style={roleStyle(e, longInitialStyle)}>
          {roleNode(e.role)}
        </div>
      )
    }

    if (e.src) {
      return (
        <div key={key} className="lb-el lb-photo" style={style}>
          <img src={e.src} alt="" loading="lazy" draggable={false} />
        </div>
      )
    }

    if (e.html) {
      return (
        <div
          key={key}
          className="lb-el lb-t lb-html"
          style={roleStyle(e, e.color ? { color: e.color } : undefined)}
          dangerouslySetInnerHTML={{ __html: e.html }}
        />
      )
    }

    return null
  }

  if (!opened) {
    return (
      <div className="lb-root lb-gate" style={{ backgroundImage: `url(${gate.background})` }}>
        {hasTrack && <audio src={trackUrl} loop preload="metadata" data-warm-audio="" />}
        <div className="lb-gate__scrim" aria-hidden="true" />
        <div className="lb-gate__lang">
          <button type="button" onClick={() => setLang((v) => (v === "EN" ? "ID" : "EN"))}>
            {lang}
          </button>
        </div>
        <div className="lb-gate__content">
          <p className="lb-gate__guest">
            <span className="lb-gate__guest-label">
              {c.guest}
              {lang === "EN" ? "," : ""}
            </span>
            <b className="lb-gate__guest-name">{guestName}</b>
          </p>
          <p className="lb-gate__invite">{welcomeInvite}</p>
          <h1 className="lb-gate__names">
            {groomShort} <span>&amp;</span> {brideShort}
          </h1>
          <p className="lb-gate__date">{gateDateLabel}</p>
        </div>
        <button type="button" className="lb-gate__button" onClick={openInvitation}>
          <span>{c.open}</span>
          <GateEnvelopeIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="lb-root">
      {hasTrack && (
        <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}

      <div className="lb-desktop-cover" aria-hidden="true">
        <img src={A("desktop-cover.webp")} alt="" />
        <h1 className="lb-desktop-cover__names">
          {groomShort} &amp; {brideShort}
        </h1>
      </div>

      <div className="lb-lang">
        <button type="button" onClick={() => setLang((v) => (v === "EN" ? "ID" : "EN"))}>
          {lang}
        </button>
      </div>

      <div className="lb-shell" ref={shellRef}>
        {layout.sections.map((section) => {
          if (section.kind === "honored" && honored.length === 0) return null
          if (section.kind === "story" && stories.length === 0) return null
          if (section.kind === "gift" && !hasGift) return null
          if (section.kind === "video" && !hasVideo) return null
          if (section.kind === "gallery" && (!hasVideo || photos.length === 0)) return null
          if (section.kind === "event-2" && !hasSecondEvent) return null
          const background = section.background.startsWith("/")
            ? { backgroundImage: `url(${section.background})`, backgroundSize: "cover", backgroundPosition: "center top" }
            : { background: section.background }
          return (
            <section
              key={section.id}
              className={`lb-section lb-section--${section.kind}`}
              style={{ height: section.height * scale, ...background }}
            >
              {section.kind === "hero" && (
                <video
                  className="lb-hero-video"
                  src="/templates/lunar-blossom/opening.mp4"
                  poster={A("hero-art.webp")}
                  muted
                  playsInline
                  preload="metadata"
                  autoPlay
                />
              )}
              <div
                className="lb-art"
                style={{
                  width: layout.canvasWidth,
                  height: section.height,
                  transform: `scale(${scale})`,
                }}
              >
                {section.elements.map(renderElement)}
              </div>
            </section>
          )
        })}

        <footer className="lb-footer">
          <a
            href={`https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Aksaraa Wedding via WhatsApp"
            className="lb-footer__link"
          >
            <span className="lb-footer__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="lb-footer__logo" draggable={false} />
            </span>
            <span className="lb-footer__cta">Wedding by Aksaraa</span>
          </a>
          <p className="lb-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
        </footer>
      </div>

      {hasTrack && (
        <button
          type="button"
          className={`lb-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
        >
          <span className="lb-music__disc" />
          <span className="lb-music__note">{playing ? "❚❚" : "♪"}</span>
        </button>
      )}

      <div className={`lb-toast${toast ? " is-show" : ""}`}>{toast}</div>

      {lightbox !== null && gallery[lightbox] && (
        <div className="lb-lightbox" onClick={() => setLightbox(null)}>
          <button type="button" className="lb-lightbox__close" onClick={() => setLightbox(null)} aria-label="Close">
            ×
          </button>
          <span className="lb-lightbox__count">
            {lightbox + 1} / {gallery.length}
          </span>
          {gallery.length > 1 && (
            <button
              type="button"
              className="lb-lightbox__nav lb-lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((lightbox - 1 + gallery.length) % gallery.length)
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          <img
            src={gallery[lightbox]}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
          {gallery.length > 1 && (
            <button
              type="button"
              className="lb-lightbox__nav lb-lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((lightbox + 1) % gallery.length)
              }}
              aria-label="Next"
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
          guestName={guestName}
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
    </div>
  )
}
