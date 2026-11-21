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
  firstImage,
  flattenPhotos,
  groomPhoto,
  bridePhoto,
  initialsOf,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import Gift from "./Gift"
import layoutJson from "./layout.json"
import gateJson from "./gate.json"
import "./adat-jawa.css"
import { normalizeLanguage, t, tf } from "@/lib/i18n"
import { formatDate } from "@/lib/formatDate"

type LayoutElement = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  src?: string
  txt?: string
  font?: string | null
  size?: string | null
  color?: string | null
  role?: string
  hidden?: boolean
  opacity?: number
  flip?: boolean
  flipV?: boolean
  rotate180?: boolean
}

type LayoutSection = {
  id: string
  kind: string
  top: number
  height: number
  bg: string
  elements: LayoutElement[]
}

type Layout = { canvasWidth: number; totalHeight: number; sections: LayoutSection[] }

const layout = layoutJson as unknown as Layout
const gate = gateJson as unknown as { width: number; height: number; background: string }

const A = (name: string) => `/templates/adat-jawa/assets/${name}`


const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const ID_MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
const EN_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const ID_DAYS = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]

function toDate(value?: string): Date | null {
  if (!value) return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function dateParts(value: string | undefined, lang: "id" | "en") {
  const d = toDate(value)
  if (!d) return { day: "", weekday: "", date: "", month: "", year: "" }
  const days = lang === "id" ? ID_DAYS : EN_DAYS
  const months = lang === "id" ? ID_MONTHS : EN_MONTHS
  return {
    day: `${days[d.getDay()]}, ${d.getDate()}`,
    weekday: `${days[d.getDay()]},`,
    date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
    month: `${months[d.getMonth()]} ${d.getFullYear()}`,
    year: String(d.getFullYear()),
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
  const transforms = [
    `translate(${e.x}px, ${e.y}px)`,
    ...(e.flip ? ["scaleX(-1)"] : []),
    ...(e.flipV ? ["scaleY(-1)"] : []),
    ...(e.rotate180 ? ["rotate(180deg)"] : []),
  ]
  return { width: e.w, height: e.h, transform: transforms.join(" "), ...(e.opacity != null ? { opacity: e.opacity } : {}) }
}

function roleStyle(e: LayoutElement): CSSProperties {
  return { ...elementStyle(e) }
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h15M5 1v3M12 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 4.5 8 9l7-4.5M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function GalleryWidget({
  photos,
  lang,
  onOpen,
}: {
  photos: string[]
  lang: "id" | "en"
  onOpen: (index: number) => void
}) {
  const [index, setIndex] = useState(0)
  const list = photos.length > 0 ? photos : [A("gate-cover.webp")]
  useEffect(() => {
    if (list.length <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 4500)
    return () => window.clearInterval(id)
  }, [list.length])
  return (
    <div className="aj-gallery">
      <button type="button" className="aj-gallery__stage" onClick={() => onOpen(index % list.length)} aria-label={tf("viewPhoto", lang, { n: (index % list.length) + 1 })}>
        <img src={list[index % list.length]} alt="" draggable={false} />
        <span className="aj-gallery__count">
          {String((index % list.length) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
      </button>
      <div className="aj-gallery__bar">
        <button type="button" onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)} aria-label={t("prevPhoto", lang)}>‹</button>
        <div className="aj-gallery__dots">
          {list.slice(0, 8).map((photo, i) => (
            <button key={`${photo}-${i}`} type="button" className={i === index % list.length ? "is-active" : ""} onClick={() => setIndex(i)} aria-label={`${i + 1}`} />
          ))}
        </div>
        <button type="button" onClick={() => setIndex((i) => (i + 1) % list.length)} aria-label={t("nextPhoto", lang)}>›</button>
      </div>
    </div>
  )
}

export default function AdatJawa(profile: TemplateProps) {
  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const [opened, setOpened] = useState(false)
  const lang = normalizeLanguage(profile.language)
  const [scale, setScale] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [lightbox, setLightbox] = useState<number | null>(null)

  const shellRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const heroVideoRef = useRef<HTMLVideoElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const groomShort = (profile.groom_name || "").trim() || (lang === "en" ? "Groom" : "Mempelai Pria")
  const brideShort = (profile.bride_name || "").trim() || (lang === "en" ? "Bride" : "Mempelai Wanita")
  const groomFull = (profile.groom_full_name || groomShort).trim()
  const brideFull = (profile.bride_full_name || brideShort).trim()
  const coupleLabel = [groomShort, brideShort].filter(Boolean).join(" & ") || (lang === "en" ? "The Wedding" : "Pernikahan")
  const guestName = profile.guest_name || t("honoredGuest", lang)
  const initials = (profile.couple_initials || "").trim() || initialsOf(brideShort, groomShort)
  const cover = coverPhoto(profile)
  const groomImage = groomPhoto(profile.groom_photo_url)
  const brideImage = bridePhoto(profile.bride_photo_url)
  const photos = flattenPhotos(profile.gallery_photos)
  const gallery = photos.length > 0 ? photos : [cover]
  const events = (profile.sessions || []).filter(Boolean)
  const event0 = events[0]
  const event1 = events[1]
  const hasSecondEvent = events.length > 1
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  const stories = gates.story !== false && profile.story_visible !== false ? (profile.stories || []).filter((st) => st.title || st.description || st.image_url) : []
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false ? (profile.inviting_families || []).filter(Boolean) : []
  const honoredH = Math.max(560, 175 + honored.length * 64 + 240)

  const day0 = dateParts(event0?.date, lang)
  const day1 = dateParts(event1?.date, lang)
  const gateDate = (() => {
    const d = toDate(event0?.date) || toDate(profile.estimated_wedding_date)
    if (!d) return ""
    return formatDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`, lang)
  })()
  const calendarUrl = (() => {
    const d = toDate(event0?.date) || toDate(profile.estimated_wedding_date)
    if (!d) return ""
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0")
    const text = encodeURIComponent(`The Wedding of ${groomShort} & ${brideShort}`)
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${y}${m}${day}T000000/${y}${m}${day}T001500`
  })()

  const showGuestDock =
    opened &&
    !profile.template_demo &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

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
        showToast(t("copiedToClipboard", lang))
      } catch {
        showToast(t("failedToCopy", lang))
      }
    },
    [lang, showToast]
  )

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    window.setTimeout(() => {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
      const video = heroVideoRef.current
      if (video) video.play().catch(() => {})
    }, 60)
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    else { audio.pause(); setPlaying(false) }
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
      document.querySelectorAll<HTMLElement>(".aj-el:not(.is-visible)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.96) el.classList.add("is-visible")
      })
    }
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(reveal) }
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
    if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
  }, [opened, hasTrack])

  useEffect(() => {
    if (!opened) return
    const video = heroVideoRef.current
    if (video) video.play().catch(() => {})
  }, [opened])

  const roleNode = (role: string): ReactNode => {
    switch (role) {
      case "hero-kicker": return tc.hero_kicker || t("theWeddingOf", lang)
      case "hero-name": return `${groomShort} & ${brideShort}`
      case "quote": return profile.quote_text || ""
      case "quote-mark": return "“"
      case "quote-source": return profile.quote_source || ""
      case "groom-title": return groomShort
      case "groom-full": return groomFull
      case "groom-parents": return profile.groom_parents || ""
      case "groom-initial": return initials
      case "bride-title": return brideShort
      case "bride-full": return brideFull
      case "bride-parents": return profile.bride_parents || ""
      case "couple-and": return "&"
      case "hashtag": return profile.display_name || ""
      case "event-0-name": return event0?.name || (lang === "en" ? "Holy Matrimony" : "Akad Nikah")
      case "event-0-day": return day0.weekday
      case "event-0-date": return day0.date
      case "event-0-month": return day0.month
      case "event-0-time": return event0?.time || ""
      case "event-0-venue": return event0?.venue || ""
      case "event-0-address": return event0?.address || ""
      case "event-1-name": return event1?.name || (lang === "en" ? "Reception" : "Resepsi")
      case "event-1-day": return day1.weekday
      case "event-1-date": return day1.date
      case "event-1-month": return day1.month
      case "event-1-time": return event1?.time || ""
      case "event-1-venue": return event1?.venue || ""
      case "event-1-address": return event1?.address || ""
      case "wishes-title": return tc.wishes_title || t("secWishes", lang)
      case "gift-title": return tc.gift_title || t("secGift", lang)
      case "gallery-title": return tc.gallery_title || t("secGallery", lang)
      case "video-title": return tc.video_title || t("secVideo", lang)
      case "closing-title": return tc.closing_title || t("thankYou", lang)
      case "closing-names": return `${t("withLoveAndGratitude", lang)}\n${coupleLabel}`
      case "closing-message": return tc.closing_message || (lang === "en" ? "A beautiful day becomes even more meaningful because of your presence and prayers. Thank you for being part of our happiness." : "Hari yang indah menjadi lebih bermakna karena kehadiran dan doa restu Anda. Terima kasih telah menjadi bagian dari kebahagiaan kami.")
      case "story-title": return tc.love_story_title || t("secStory", lang)
      case "honored-title": return tc.inviting_title || t("secInviting", lang)
      case "story-list":
        return (
          <ol className="aj-chapters">
            {stories.map((st, i) => (
              <li key={i}>
                {st.image_url && <div className="aj-chapter__photo"><img src={st.image_url} alt="" draggable={false} /></div>}
                {st.title && <p className="aj-chapter__title">{st.title}</p>}
                {st.description && <p className="aj-chapter__text">{st.description}</p>}
              </li>
            ))}
          </ol>
        )
      case "honored-list":
        return <ul className="aj-honored">{honored.map((h, i) => <li key={i}>{h}</li>)}</ul>
      default: return null
    }
  }

  const renderElement = (e: LayoutElement) => {
    if (e.hidden) return null
    if (e.type === "video" && !e.role) return null
    const key = e.id
    const style = e.id === "ho-gebyok"
      ? { ...elementStyle(e), transform: `translate(${e.x}px, ${honoredH - 200}px)${e.rotate180 ? " rotate(180deg)" : ""}` }
      : elementStyle(e)

    if (e.role === "countdown") {
      return (
        <div key={key} className="aj-el aj-countdown" style={style}>
          <div className="aj-countdown__grid">
            {[
              [countdown?.d ?? "00", t("days", lang)],
              [countdown?.h ?? "00", t("hours", lang)],
              [countdown?.m ?? "00", t("minutes", lang)],
              [countdown?.s ?? "00", t("seconds", lang)],
            ].map(([value, label]) => (
              <div key={label} className="aj-countdown__cell">
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {calendarUrl && (
            <a className="aj-countdown__cta" href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <CalendarIcon />
              <span>{t("saveToCalendar", lang)}</span>
            </a>
          )}
        </div>
      )
    }

    if (e.role === "wishes") {
      return (
        <div key={key} className="aj-el aj-widget" style={style}>
          <Wishes
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            guestLinkStrict={profile.guest_link_strict}
            coupleName={coupleLabel}
            language={profile.language}
          />
        </div>
      )
    }

    if (e.role === "gift") {
      return (
        <div key={key} className="aj-el aj-widget" style={style}>
          {hasGift ? (
            <Gift accounts={accounts} address={giftAddress} addressName={profile.gift_address_name} intro={tc.gift_intro_description || (lang === "en" ? "For those who wish to send a token of love, the details are available below." : "Bagi Anda yang ingin memberikan tanda kasih, detailnya tersedia di bawah ini.")} language={profile.language} onCopy={copy} />
          ) : null}
        </div>
      )
    }

    if (e.role === "gallery") {
      return (
        <div key={key} className="aj-el aj-widget" style={style}>
          <GalleryWidget photos={gallery} lang={lang} onOpen={setLightbox} />
        </div>
      )
    }

    if (e.role === "event-0-map" || e.role === "event-1-map") {
      const session = e.role === "event-0-map" ? event0 : event1
      if (!session || !session.maps_url) return null
      return (
        <a key={key} className="aj-el aj-map" style={style} href={session.maps_url} target="_blank" rel="noopener noreferrer">
          {t("viewLocation", lang)}
        </a>
      )
    }

    if (e.role === "groom-instagram" || e.role === "bride-instagram") {
      const raw = e.role === "groom-instagram" ? profile.groom_instagram : profile.bride_instagram
      const handle = (raw || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "")
      if (!handle) return null
      return (
        <div key={key} className={`aj-el aj-t aj-r-${e.role}`} style={roleStyle(e)}>
          <a className="aj-ig" href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer"><InstagramIcon /><span>@{handle}</span></a>
        </div>
      )
    }

    if (e.role === "video") {
      if (!hasVideo) return null
      return <div key={key} className="aj-el aj-video" style={style}><iframe src={videoEmbed} title={lang === "en" ? "Our wedding film" : "Film pernikahan kami"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
    }

    if (e.role === "cover-photo") {
      return <div key={key} className="aj-el aj-photo aj-photo--cover" style={style}><img src={cover} alt="" draggable={false} /></div>
    }
    if (e.role === "closing-photo") {
      const closingCover = firstImage(Array.isArray(profile.cover_photos) ? profile.cover_photos[1] : undefined) || cover
      return <div key={key} className="aj-el aj-photo aj-photo--cover" style={style}><img src={closingCover} alt="" draggable={false} /></div>
    }
    if (e.role === "groom-photo") {
      return <div key={key} className="aj-el aj-photo aj-photo--person" style={style}><img src={groomImage} alt={groomShort} draggable={false} /></div>
    }
    if (e.role === "bride-photo") {
      return <div key={key} className="aj-el aj-photo aj-photo--person" style={style}><img src={brideImage} alt={brideShort} draggable={false} /></div>
    }

    if (e.role) {
      return (
        <div key={key} className={`aj-el aj-t aj-r-${e.role}`} style={roleStyle(e)}>
          {roleNode(e.role)}
        </div>
      )
    }

    if (e.src) {
      return <div key={key} className="aj-el aj-photo" style={style}><img src={e.src} alt="" draggable={false} /></div>
    }

    if (e.txt) {
      const s: CSSProperties = { ...style }
      if (e.font) s.fontFamily = `"${e.font}", serif`
      if (e.size) s.fontSize = e.size
      if (e.color) s.color = e.color
      return <div key={key} className="aj-el aj-t aj-static" style={s}>{e.txt}</div>
    }

    return null
  }

  if (!opened) {
    return (
      <div className="aj-root aj-gate" style={{ backgroundImage: `url(${gate.background})` }}>
        {hasTrack && <audio src={trackUrl} loop preload="metadata" data-warm-audio="" />}
        <div className="aj-gate__scrim" aria-hidden="true" />
        <div className="aj-gate__content">
          <p className="aj-gate__kicker">{tc.cover_kicker || t("theWeddingOf", lang)}</p>
          <h1 className="aj-gate__names">{groomShort} <span>&amp;</span> {brideShort}</h1>
          <p className="aj-gate__date">{gateDate}</p>
        </div>
        <p className="aj-gate__guest">{lang === "en" ? "Dear" : "Kepada"},<br /><b>{guestName}</b></p>
        <button type="button" className="aj-gate__button" onClick={openInvitation}>
          <span>{t("openInvitation", lang)}</span>
          <EnvelopeIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="aj-root">
      {hasTrack && (
        <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}

      <div className="aj-desktop-cover" aria-hidden="true">
        <img src={A("cover-desktop.webp")} alt="" />
        <h1 className="aj-desktop-cover__names">{groomShort} &amp; {brideShort}</h1>
      </div>

      <div className="aj-shell" ref={shellRef}>
        {layout.sections.map((section) => {
          if (section.kind === "story" && stories.length === 0) return null
          if (section.kind === "honored" && honored.length === 0) return null
          if (section.kind === "gift" && !hasGift) return null
          if (section.kind === "video" && !hasVideo) return null
          if (section.kind === "gallery" && photos.length === 0) return null
          const singleEvent = section.kind === "events" && events.length < 2
          const evEls = singleEvent
            ? section.elements.filter((el) => !el.role?.startsWith("event-1") && el.id !== "j7-28" && el.id !== "j7-29")
            : section.elements
          const showEls = section.kind === "wishes" && honored.length === 0
            ? evEls.filter((el) => el.id !== "j9-gebyok")
            : evEls
          const secH = section.kind === "honored" ? honoredH : section.height
          return (
            <section key={section.id} className={`aj-section aj-section--${section.kind}${singleEvent ? " aj-section--events-single" : ""}`} style={{ height: (singleEvent ? Math.min(section.height, 1180) : secH) * scale, background: section.bg }}>
              {section.kind === "hero" && (
                <video ref={heroVideoRef} className="aj-hero-video" src={A("opening.mp4")} muted playsInline preload="auto" autoPlay />
              )}
              <div className="aj-art" style={{ width: layout.canvasWidth, height: singleEvent ? Math.min(section.height, 1180) : secH, transform: `scale(${scale})` }}>
                {section.kind === "closing"
                  ? [...section.elements].sort((a, b) => (a.role?.startsWith("closing-") ? 1 : 0) - (b.role?.startsWith("closing-") ? 1 : 0)).map(renderElement)
                  : showEls.map(renderElement)}
              </div>
            </section>
          )
        })}

        <footer className="aj-footer">
          <a href={`https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`} target="_blank" rel="noopener noreferrer" aria-label={lang === "en" ? "Contact Aksaraa Wedding via WhatsApp" : "Hubungi Aksaraa Wedding via WhatsApp"} className="aj-footer__link">
            <span className="aj-footer__badge"><img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="aj-footer__logo" draggable={false} /></span>
            <span className="aj-footer__cta">{t("weddingInvitationByAksaraa", lang)}</span>
          </a>
          <p className="aj-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
        </footer>
      </div>

      {hasTrack && (
        <button type="button" className={`aj-music${playing ? " is-playing" : ""}`} onClick={toggleMusic} aria-label={t("playPauseMusic", lang)}>
          <span className="aj-music__disc" />
          <span className="aj-music__note">{playing ? "❚❚" : "♪"}</span>
        </button>
      )}

      <div className={`aj-toast${toast ? " is-show" : ""}`}>{toast}</div>

      {lightbox !== null && gallery[lightbox] && (
        <div className="aj-lightbox" onClick={() => setLightbox(null)}>
          <button type="button" className="aj-lightbox__close" onClick={() => setLightbox(null)} aria-label={t("closeGallery", lang)}>×</button>
          <span className="aj-lightbox__count">{lightbox + 1} / {gallery.length}</span>
          {gallery.length > 1 && (
            <button type="button" className="aj-lightbox__nav aj-lightbox__nav--prev" onClick={(ev) => { ev.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length) }} aria-label={t("prevPhoto", lang)}>‹</button>
          )}
          <img src={gallery[lightbox]} alt="" onClick={(ev) => ev.stopPropagation()} />
          {gallery.length > 1 && (
            <button type="button" className="aj-lightbox__nav aj-lightbox__nav--next" onClick={(ev) => { ev.stopPropagation(); setLightbox((lightbox + 1) % gallery.length) }} aria-label={t("nextPhoto", lang)}>›</button>
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
          language={profile.language}
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
