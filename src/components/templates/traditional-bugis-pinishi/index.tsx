"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import {
  countdownTarget,
  coverPhoto as coverPhotoOf,
  flattenPhotos,
  formatLongDate,
  gcalLink,
  groomPhoto as groomPhotoOf,
  bridePhoto as bridePhotoOf,
  normalizeVideoUrl,
} from "../shared/lib"
import InvitationOverlay from "@/components/InvitationOverlay"
import Wishes from "./Wishes"
import "./traditional-bugis-pinishi.css"

const ASSET = (name: string) => `/templates/traditional-bugis-pinishi/${name}`

const DEFAULT_QUOTE =
  "Bismillahirrahmanirrahim. Semoga Allah SWT senantiasa melimpahkan keberkahan, kasih, dan keharmonisan dalam perjalanan kami."
const DEFAULT_QUOTE_SOURCE = "Doa Pernikahan Adat Bugis"
const DEMO_TRACK = "/templates/traditional-bugis-pinishi/music.mp3"
const DEFAULT_GALLERY_QUOTE =
  "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama."
const DEFAULT_GIFT_DESCRIPTION =
  "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:"
const DEFAULT_CLOSING =
  "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan."
const DEFAULT_WISHES_SUBTITLE =
  "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu."
const EVENTS_INTRO =
  "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:"

function describePalette(colors?: { hex?: string; name?: string }[]): string {
  const names = (colors || []).map((c) => (c.name || "").trim()).filter(Boolean)
  if (!names.length) return ""
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} dan ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, dan ${names[names.length - 1]}`
  return `Kami akan sangat berbahagia bila para tamu berkenan hadir dengan busana bernuansa ${list}.`
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

function fitStyle(text: string): CSSProperties {
  return { "--len": Math.max(1, text.trim().length) } as CSSProperties
}

function delay(ms: number): CSSProperties {
  return { "--aos-delay": `${ms}ms` } as CSSProperties
}

function dottedDate(iso?: string): string {
  const m = (iso || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ""
  return `${m[3]} . ${m[2]} . ${m[1]}`
}

function whatsappHref(value?: string): string {
  const raw = (value || "").trim()
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return raw
  const digits = raw.replace(/\D/g, "")
  return digits ? `https://wa.me/${digits}` : ""
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="1" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="M15.5 11.2 21 8v8l-5.5-3.2z" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7 12 13l8.5-6" />
    </svg>
  )
}

export default function TraditionalBugisPinishi(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)
  const bufferSpinnerTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [giftRevealed, setGiftRevealed] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoBuffering, setVideoBuffering] = useState(false)
  const [connectionOk, setConnectionOk] = useState(true)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const groomShort = (profile.groom_name || "").trim()
  const brideShort = (profile.bride_name || "").trim()
  const groomFull = (profile.groom_full_name || groomShort).trim()
  const brideFull = (profile.bride_full_name || brideShort).trim()
  const coupleLabel = [groomShort, brideShort].filter(Boolean).join(" & ") || "Pernikahan"
  const guestName = profile.guest_name || "Tamu Undangan"
  const dateLong = formatLongDate(profile.estimated_wedding_date)
  const dateDots = dottedDate(profile.estimated_wedding_date)
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const events = (profile.sessions || []).filter(Boolean)
  const primaryVenue =
    events.find((event) => event.venue || event.address || event.maps_url) || null
  const photos = flattenPhotos(profile.gallery_photos)
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const coverSlots = flattenPhotos(profile.cover_photos)
  const coverPhoto = coverPhotoOf(profile)
  const versePhoto = coverSlots[1] || photos[0] || coverPhoto
  const closingPhoto = coverSlots[2] || photos[0] || coverPhoto
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const hasGallery = photos.length > 0 || hasVideo
  const stories = gates.story !== false && profile.story_visible !== false
    ? (profile.stories || []).filter((s) => s && (s.title || s.description))
    : []
  const hasStory = stories.length > 0
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const hasLivestream = profile.livestream_visible !== false && !!profile.livestream?.url
  const rundownItems = profile.rundown_visible !== false
    ? (profile.rundown || []).filter((r) => r && (r.time || r.description))
    : []
  const hasRundown = rundownItems.length > 0
  const contactItems = profile.contacts_visible !== false
    ? (profile.contacts || []).filter((c) => c && (c.name || c.description || c.whatsapp))
    : []
  const hasContacts = contactItems.length > 0
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "") : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false
    ? (profile.inviting_families || []).filter(Boolean)
    : []
  const trackUrl = profile.track_url || (profile.template_demo ? DEMO_TRACK : "")
  const hasTrack = !!trackUrl
  const calendarUrl = gcalLink(events[0], groomShort, brideShort)

  const quoteText = profile.quote_text || DEFAULT_QUOTE
  const quoteSource = profile.quote_source || DEFAULT_QUOTE_SOURCE
  const coverApology =
    tc.cover_apology || "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar."
  const galleryIntro = tc.gallery_intro || ""
  const galleryQuote = tc.gallery_quote || DEFAULT_GALLERY_QUOTE
  const giftIntroTitle = tc.gift_intro_title || "Send your gift"
  const giftIntroDescription = tc.gift_intro_description || DEFAULT_GIFT_DESCRIPTION
  const wishesSubtitle = tc.wishes_intro || DEFAULT_WISHES_SUBTITLE
  const closingMessage = tc.closing_message || DEFAULT_CLOSING
  const dressDescription = profile.dresscode?.description || describePalette(profile.dresscode?.colors)
  const livestream = profile.livestream

  const rootOpen = opened || isDesktop
  const showGate = !isDesktop && !opened
  const showContent = isDesktop || opened

  const showGuestDock =
    rootOpen &&
    !profile.preview_mode &&
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
      try {
        await navigator.clipboard.writeText(text)
        showToast("Disalin ke clipboard")
      } catch {
        try {
          const field = document.createElement("textarea")
          field.value = text
          field.style.position = "fixed"
          field.style.opacity = "0"
          document.body.appendChild(field)
          field.select()
          const copied = document.execCommand("copy")
          document.body.removeChild(field)
          showToast(copied ? "Disalin ke clipboard" : "Gagal menyalin")
        } catch {
          showToast("Gagal menyalin")
        }
      }
    },
    [showToast]
  )

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    if (hasTrack) {
      const audio = audioRef.current
      if (audio) {
        audio.play().then(() => setPlaying(true), () => setPlaying(false))
      }
    }
  }, [hasTrack])

  const requestReminder = useCallback(async () => {
    if (typeof Notification === "undefined") {
      showToast("Peramban ini tidak mendukung pengingat")
      return
    }
    if (Notification.permission === "granted") {
      showToast("Pengingat sudah aktif")
      return
    }
    try {
      const result = await Notification.requestPermission()
      showToast(result === "granted" ? "Pengingat diaktifkan" : "Izin pengingat ditolak")
    } catch {
      showToast("Gagal mengaktifkan pengingat")
    }
  }, [showToast])

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)")
    const apply = () => setIsDesktop(query.matches)
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    if (!conn) return
    if (conn.saveData || /(^|-)2g$|^3g$/.test(conn.effectiveType || "")) {
      setConnectionOk(false)
    }
  }, [])

  const handleVideoError = useCallback(() => {
    setVideoFailed(true)
  }, [])

  const handleVideoPlaying = useCallback(() => {
    if (bufferSpinnerTimer.current) {
      window.clearTimeout(bufferSpinnerTimer.current)
      bufferSpinnerTimer.current = null
    }
    setVideoBuffering(false)
  }, [])

  const handleVideoWaiting = useCallback(() => {
    if (bufferSpinnerTimer.current) window.clearTimeout(bufferSpinnerTimer.current)
    bufferSpinnerTimer.current = window.setTimeout(() => setVideoBuffering(true), 1500)
  }, [])

  useEffect(() => {
    if (!opened || videoFailed) return
    const video = videoRef.current
    if (!video) return
    try {
      if (video.currentTime > 0.5) video.currentTime = 0
    } catch {
      // ignore
    }
    video.play().catch(() => undefined)
  }, [opened, videoFailed])

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
    const value = showGate ? "hidden" : ""
    document.body.style.overflow = value
    document.documentElement.style.overflow = value
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [showGate])

  useEffect(() => {
    if (!showGate) return
    const keepOnCover = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    keepOnCover()
    window.addEventListener("scroll", keepOnCover, { passive: true })
    window.addEventListener("touchmove", keepOnCover, { passive: true })
    return () => {
      window.removeEventListener("scroll", keepOnCover)
      window.removeEventListener("touchmove", keepOnCover)
    }
  }, [showGate])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-aos]"))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-aos-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [showContent])

  useEffect(() => {
    if (lightbox === null) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (event.key === "ArrowLeft") setLightbox((value) => (value === null ? value : (value - 1 + photos.length) % photos.length))
      if (event.key === "ArrowRight") setLightbox((value) => (value === null ? value : (value + 1) % photos.length))
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightbox, photos.length])

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (bufferSpinnerTimer.current) window.clearTimeout(bufferSpinnerTimer.current)
    },
    []
  )

  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(
    "Halo Aksaraa Wedding, saya tertarik membuat undangan digital"
  )}`

  const people = [
    {
      side: "bride",
      full: brideFull,
      short: brideShort,
      photo: bridePhoto,
      parents: profile.bride_parents,
      instagram: profile.bride_instagram,
    },
    {
      side: "groom",
      full: groomFull,
      short: groomShort,
      photo: groomPhoto,
      parents: profile.groom_parents,
      instagram: profile.groom_instagram,
    },
  ]

  const galleryShots = photos.length > 0 ? photos : [coverPhoto]

  return (
    <div
      ref={rootRef}
      className={`traditional-bugis-pinishi-root${rootOpen ? " is-open" : " is-locked"}`}
    >
      <a className="skip-link" href="#pinishi-invitation">
        Lewati ke undangan
      </a>

      {hasTrack && (
        <audio ref={audioRef} loop preload={connectionOk ? "auto" : "metadata"}>
          <source src={trackUrl} type="audio/mpeg" />
        </audio>
      )}

      {hasTrack && (
        <button
          className={`pinishi-music${rootOpen ? " is-visible" : ""}${playing ? "" : " is-paused"}`}
          type="button"
          aria-label="Putar atau jeda musik"
          onClick={toggleMusic}
        >
          <span className="pinishi-vinyl">
            <span className="pinishi-vinyl-groove" />
            <span className="pinishi-vinyl-label" />
            <span className="pinishi-vinyl-hole" />
          </span>
        </button>
      )}

      {isDesktop && (
        <aside className="pinishi-stage" aria-hidden="true">
          <img className="pinishi-stage-photo" src={coverPhoto} alt="" />
          <span className="pinishi-stage-spark pinishi-stage-spark--1" />
          <span className="pinishi-stage-spark pinishi-stage-spark--2" />
          <span className="pinishi-stage-spark pinishi-stage-spark--3" />
          <span className="pinishi-stage-spark pinishi-stage-spark--4" />
          <p className="pinishi-stage-names name-fit" style={fitStyle(coupleLabel)}>
            {coupleLabel}
          </p>
        </aside>
      )}

      {showGate && (
        <section className="pinishi-gate" aria-label="Sampul undangan">
          <div className="pinishi-gate-bg" aria-hidden="true">
            <img src={ASSET("cover-bg.webp")} alt="" />
          </div>
          <div className="pinishi-gate-panel">
            <div className="pinishi-gate-photo">
              <img src={coverPhoto} alt={coupleLabel} />
            </div>
            <p className="pinishi-gate-kicker">The Wedding Of</p>
            <h1 className="pinishi-gate-names name-fit" style={fitStyle(coupleLabel)}>
              {groomShort} &amp; {brideShort}
            </h1>
            {dateDots && <p className="pinishi-gate-date">{dateDots}</p>}
            <div className="pinishi-gate-guest">
              <p className="pinishi-gate-guest-label">Kepada Yth.</p>
              <p className="pinishi-gate-guest-name name-fit" style={fitStyle(guestName)}>
                {guestName}
              </p>
              <p className="pinishi-gate-note">{coverApology}</p>
            </div>
            <button className="pinishi-gate-btn" type="button" onClick={openInvitation}>
              <EnvelopeIcon />
              Buka Undangan
            </button>
          </div>
        </section>
      )}

      {showContent && (
        <main id="pinishi-invitation" className="pinishi-main">
          {isDesktop && (
            <section className="pinishi-cover-inline" aria-label="Sampul undangan">
              <div className="pinishi-gate-bg" aria-hidden="true">
                <img src={ASSET("cover-bg.webp")} alt="" />
              </div>
              <div className="pinishi-gate-panel">
                <div className="pinishi-gate-photo">
                  <img src={coverPhoto} alt={coupleLabel} />
                </div>
                <p className="pinishi-gate-kicker">The Wedding Of</p>
                <h1 className="pinishi-gate-names name-fit" style={fitStyle(coupleLabel)}>
                  {groomShort} &amp; {brideShort}
                </h1>
                {dateDots && <p className="pinishi-gate-date">{dateDots}</p>}
                <div className="pinishi-gate-guest">
                  <p className="pinishi-gate-guest-label">Kepada Yth.</p>
                  <p className="pinishi-gate-guest-name name-fit" style={fitStyle(guestName)}>
                    {guestName}
                  </p>
                  <p className="pinishi-gate-note">{coverApology}</p>
                </div>
                <p className="pinishi-scroll-hint" aria-hidden="true">
                  <span className="pinishi-scroll-hint-dot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
                      <path d="M12 5v13M6 13l6 6 6-6" />
                    </svg>
                  </span>
                  scroll down
                </p>
              </div>
            </section>
          )}

          <section className="pinishi-hero" aria-label="Pembuka">
            <img className="pinishi-deco pinishi-hero-ship" src={ASSET("decor-img-0543.webp")} alt="" aria-hidden="true" data-aos="zoom-in" />
            <img className="pinishi-deco pinishi-hero-tree" src={ASSET("decor-puunbugis.webp")} alt="" aria-hidden="true" data-aos="slide-left" />
            <img className="pinishi-deco pinishi-hero-flowerzero" src={ASSET("decor-bngquote.webp")} alt="" aria-hidden="true" data-aos="slide-left" data-aos-delay="120" />
            <img className="pinishi-deco pinishi-hero-flowerone" src={ASSET("decor-bungaQuote2.webp")} alt="" aria-hidden="true" data-aos="zoom-in" data-aos-delay="180" />
            <img className="pinishi-deco pinishi-hero-flowertwo" src={ASSET("decor-bungaBugis4.webp")} alt="" aria-hidden="true" data-aos="zoom-in" data-aos-delay="240" />
            <img className="pinishi-deco pinishi-hero-flowerfour" src={ASSET("decor-bunga-quote-3.webp")} alt="" aria-hidden="true" data-aos="slide-right" data-aos-delay="180" />
            <img className="pinishi-deco pinishi-hero-flowerfive" src={ASSET("decor-puun2bugis.webp")} alt="" aria-hidden="true" data-aos="slide-right" />
            <p className="pinishi-initials" aria-hidden="true">
              <span>{(groomShort || "A").charAt(0)}</span>
              <span>{(brideShort || "N").charAt(0)}</span>
            </p>
            <figure className="pinishi-hero-photo">
              <img src={versePhoto} alt={coupleLabel} />
            </figure>
            <div className="pinishi-birds" aria-hidden="true">
              <span className="pinishi-bird pinishi-bird--1" />
              <span className="pinishi-bird pinishi-bird--2" />
              <span className="pinishi-bird pinishi-bird--3" />
              <span className="pinishi-bird pinishi-bird--4" />
            </div>
          </section>

          <section className="pinishi-quote" aria-label="Kutipan">
            <div className="pinishi-quote-inner" data-aos="fade-up">
              <p className="pinishi-quote-label">Allah&apos;s blessings message</p>
              <blockquote>
                <p>{quoteText}</p>
              </blockquote>
              {quoteSource && <p className="pinishi-quote-source">- {quoteSource} -</p>}
            </div>
          </section>

          <section className="pinishi-couple" aria-label="Mempelai">
            <div className="pinishi-couple-inner">
              {people.map((person, index) => (
                <article
                  className={`pinishi-person pinishi-person--${person.side}`}
                  key={person.side}
                  data-aos={person.side === "bride" ? "slide-left" : "slide-right"}
                  data-aos-delay={index * 120}
                  style={delay(index * 120)}
                >
                  <figure className="pinishi-person-photo">
                    <img className="pinishi-person-img" src={person.photo} alt={person.full} />
                    <span className="pinishi-person-decor" aria-hidden="true">
                      <img className="pinishi-decor-fone" src={ASSET("decor-img-0652.webp")} alt="" />
                      <img className="pinishi-decor-ftwo" src={ASSET("decor-img-0551.webp")} alt="" />
                      <img className="pinishi-decor-ffour" src={ASSET("decor-img-0651.webp")} alt="" />
                      <img className="pinishi-decor-ffive" src={ASSET("decor-img-0692.webp")} alt="" />
                    </span>
                    <span className="pinishi-person-decor-back" aria-hidden="true">
                      <img className="pinishi-decor-fthree" src={ASSET("decor-lily.webp")} alt="" />
                      <img className="pinishi-decor-fsix" src={ASSET("decor-fdsfsd.webp")} alt="" />
                    </span>
                    <img className="pinishi-person-frame" src={ASSET("frame.webp")} alt="" aria-hidden="true" />
                  </figure>
                  <div className="pinishi-person-info">
                    {person.instagram && (
                      <a
                        className="pinishi-person-ig"
                        href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <InstagramIcon />@{person.instagram.replace(/^@/, "")}
                      </a>
                    )}
                    <h3 className="pinishi-person-name name-fit" style={fitStyle(person.full)}>
                      {person.full || person.short}
                    </h3>
                    {person.parents && <p className="pinishi-person-parents">{person.parents}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {hasStory && (
            <section className="pinishi-story" aria-label="Our Love Story">
              <img className="pinishi-deco pinishi-story-flower-one" src={ASSET("decor-mitos-1.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-deco pinishi-story-flower-two" src={ASSET("decor-mitos-2.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-deco pinishi-story-flower-three" src={ASSET("decor-mitos-3.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-story-inner">
                <h2 className="pinishi-title" data-aos="fade-up">
                  Our Love Story
                </h2>
                <div className="pinishi-story-panel" data-aos="zoom-in" data-aos-delay="60" style={delay(60)}>
                  <div className="pinishi-story-track">
                    {stories.map((story, index) => {
                      const shot = story.image_url || photos[index % Math.max(photos.length, 1)] || coverPhoto
                      return (
                        <article className="pinishi-story-card" key={`${story.title || "story"}-${index}`}>
                          <img className="pinishi-story-photo" src={shot} alt="" loading="lazy" />
                          <div className="pinishi-story-body">
                            {story.title && <h3>{story.title}</h3>}
                            {story.description && <p>{story.description}</p>}
                            <span className="pinishi-story-count" aria-hidden="true">
                              {index + 1}/{stories.length}
                            </span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {hasGallery && (
            <section className="pinishi-gallery" aria-label="Galeri Foto">
              <div className="pinishi-gallery-inner">
                <div className="pinishi-gallery-quoteblock" data-aos="fade-in">
                  <img className="pinishi-gallery-orn pinishi-gallery-orn--one" src={ASSET("decor-dup-1.webp")} alt="" aria-hidden="true" />
                  <img className="pinishi-gallery-orn pinishi-gallery-orn--two" src={ASSET("decor-untitled-13-2.webp")} alt="" aria-hidden="true" />
                  <img className="pinishi-gallery-orn pinishi-gallery-orn--three" src={ASSET("decor-dup-2.webp")} alt="" aria-hidden="true" />
                  <h2 className="pinishi-title pinishi-title--left" data-aos="fade-up">
                    Precious Moment
                  </h2>
                  {galleryQuote && (
                    <p className="pinishi-gallery-quote" data-aos="fade-up" data-aos-delay="40" style={delay(40)}>
                      {galleryQuote}
                    </p>
                  )}
                  {galleryIntro && (
                    <p className="pinishi-gallery-intro" data-aos="fade-up" data-aos-delay="60" style={delay(60)}>
                      {galleryIntro}
                    </p>
                  )}
                </div>
                <div className="pinishi-gallery-track" data-aos="fade-up" data-aos-delay="80" style={delay(80)}>
                  {galleryShots.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className="pinishi-gallery-plate"
                      onClick={() => setLightbox(index)}
                      aria-label={`Lihat foto ${index + 1}`}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
                {hasVideo && !videoFailed && (
                  <div className="pinishi-gallery-video" data-aos="fade-up" data-aos-delay="100" style={delay(100)}>
                    <video
                      ref={videoRef}
                      src={videoEmbed}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onError={handleVideoError}
                      onPlaying={handleVideoPlaying}
                      onWaiting={handleVideoWaiting}
                    />
                    {videoBuffering && <span className="pinishi-gallery-spinner" aria-hidden="true" />}
                  </div>
                )}
              </div>
              <div className="pinishi-gallery-bottom" aria-hidden="true">
                <img className="pinishi-gallery-bottom-orn pinishi-gallery-bottom-orn--1" src={ASSET("decor-dfafda.webp")} alt="" />
                <img className="pinishi-gallery-bottom-orn pinishi-gallery-bottom-orn--2" src={ASSET("decor-dsdasfdas.webp")} alt="" />
                <img className="pinishi-gallery-bottom-orn pinishi-gallery-bottom-orn--3" src={ASSET("decor-img-0652.webp")} alt="" />
              </div>
              <div className="pinishi-gallery-art" aria-hidden="true" />
            </section>
          )}

          <section className="pinishi-savedate" aria-label="Save the Date">
            <div className="pinishi-savedate-inner">
              <h2 className="pinishi-title" data-aos="fade-up">
                Save the Date
              </h2>
              <ul className="pinishi-countdown" data-aos="fade-up" data-aos-delay="40" style={delay(40)}>
                <li>
                  <span>{countdown?.d ?? "00"}</span>
                  <b>Days</b>
                </li>
                <li>
                  <span>{countdown?.h ?? "00"}</span>
                  <b>Hours</b>
                </li>
                <li>
                  <span>{countdown?.m ?? "00"}</span>
                  <b>Minutes</b>
                </li>
                <li>
                  <span>{countdown?.s ?? "00"}</span>
                  <b>Seconds</b>
                </li>
              </ul>
              {dateLong && <p className="pinishi-savedate-date">{dateLong}</p>}
              <div className="pinishi-savedate-actions" data-aos="fade-up" data-aos-delay="80" style={delay(80)}>
                {calendarUrl && (
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                    <CalendarIcon />
                    Tambah ke Kalender
                  </a>
                )}
                <button type="button" onClick={() => void requestReminder()}>
                  <BellIcon />
                  Aktifkan Pengingat
                </button>
              </div>
            </div>
            <div className="pinishi-countdown-orn" aria-hidden="true">
              <img className="pinishi-countdown-orn-one" src={ASSET("decor-gll-1.webp")} alt="" />
              <img className="pinishi-countdown-orn-two" src={ASSET("decor-gll-2.webp")} alt="" />
              <img className="pinishi-countdown-orn-three" src={ASSET("decor-gll-3.webp")} alt="" />
            </div>
            <div className="pinishi-countdown-orn pinishi-countdown-orn--flip" aria-hidden="true">
              <img className="pinishi-countdown-orn-one" src={ASSET("decor-gll-1.webp")} alt="" />
              <img className="pinishi-countdown-orn-two" src={ASSET("decor-gll-2.webp")} alt="" />
              <img className="pinishi-countdown-orn-three" src={ASSET("decor-gll-3.webp")} alt="" />
            </div>
            <img className="pinishi-savedate-lily pinishi-savedate-lily--l" src={ASSET("decor-bungaQuote2.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-savedate-lily pinishi-savedate-lily--r" src={ASSET("decor-bungaQuote2.webp")} alt="" aria-hidden="true" />
          </section>

          <section className="pinishi-events" aria-label="Acara Pernikahan">
            <p className="pinishi-events-intro" data-aos="fade-up">
              {EVENTS_INTRO}
            </p>
            {events.map((event, index) => {
              const mapsUrl =
                event.maps_url ||
                (event.venue || event.address
                  ? `https://maps.google.com/?q=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "))}`
                  : "")
              return (
                <article
                  className="pinishi-event"
                  key={`${event.name || "event"}-${index}`}
                  data-aos="zoom-in"
                  data-aos-delay={index * 80}
                  style={delay(index * 80)}
                >
                  <div className="pinishi-event-frame">
                    <h3>{event.name || "Acara Pernikahan"}</h3>
                    <p className="pinishi-event-date">{formatLongDate(event.date || profile.estimated_wedding_date)}</p>
                    {event.time && (
                      <p className="pinishi-event-line">
                        <ClockIcon />
                        <span>{event.time}</span>
                      </p>
                    )}
                    {(event.venue || event.address) && (
                      <p className="pinishi-event-line pinishi-event-line--address">
                        <PinIcon />
                        <span>{[event.venue, event.address].filter(Boolean).join(", ")}</span>
                      </p>
                    )}
                    {mapsUrl && (
                      <a className="pinishi-maps" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        Lihat Lokasi
                      </a>
                    )}
                  </div>
                  <div className="pinishi-event-decor pinishi-event-decor--right" aria-hidden="true">
                    <img src={ASSET("decor-rundown-5.webp")} alt="" />
                    <img src={ASSET("decor-rundown-4.webp")} alt="" />
                    <img src={ASSET("decor-rundown-2.webp")} alt="" />
                  </div>
                  <div className="pinishi-event-decor pinishi-event-decor--left" aria-hidden="true">
                    <img src={ASSET("decor-rundown-3.webp")} alt="" />
                    <img src={ASSET("decor-rundown-1.webp")} alt="" />
                  </div>
                </article>
              )
            })}
          </section>

          {primaryVenue && (
            <section className="pinishi-address" aria-label="Lokasi Acara">
              <div className="pinishi-address-inner" data-aos="fade-up">
                <div className="pinishi-address-map">
                  <iframe
                    title={`Peta ${primaryVenue.venue || primaryVenue.address || "lokasi acara"}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent([primaryVenue.venue, primaryVenue.address].filter(Boolean).join(", "))}&z=16&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {(primaryVenue.address || primaryVenue.venue) && (
                  <p className="pinishi-address-text">
                    {[primaryVenue.venue, primaryVenue.address].filter(Boolean).join(", ")}
                  </p>
                )}
                <a
                  className="pinishi-maps"
                  href={primaryVenue.maps_url || `https://maps.google.com/?q=${encodeURIComponent([primaryVenue.venue, primaryVenue.address].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lihat Lokasi
                </a>
              </div>
            </section>
          )}

          {honored.length > 0 && (
            <section className="pinishi-inviting" aria-label="Turut Mengundang">
              <img className="pinishi-inviting-decor pinishi-inviting-decor--peacock" src={ASSET("decor-merak.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-inviting-decor pinishi-inviting-decor--bngarsvp3" src={ASSET("decor-bngarsvp-3.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-inviting-decor pinishi-inviting-decor--bngarsvp1" src={ASSET("decor-bngarsvp-1.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-inviting-decor pinishi-inviting-decor--bnggg" src={ASSET("decor-bnggg.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-inviting-inner" data-aos="fade-up">
                <h2 className="pinishi-inviting-title">Turut Mengundang</h2>
                <ul>
                  {honored.map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {hasLivestream && (
            <section className="pinishi-livestream" aria-label="Live Streaming">
              <img className="pinishi-livestream-decor pinishi-livestream-decor--l" src={ASSET("decor-bnggg.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-livestream-decor pinishi-livestream-decor--r" src={ASSET("decor-bngarsvp-3.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-livestream-card" data-aos="fade-up">
                <h2>{livestream?.title || "Live Streaming"}</h2>
                <p>{livestream?.description || "Temui kami secara virtual untuk menyaksikan acara pernikahan kami."}</p>
                <a href={livestream!.url} target="_blank" rel="noopener noreferrer">
                  <CameraIcon />
                  {livestream?.buttonLabel || "Tonton Live Streaming"}
                </a>
              </div>
            </section>
          )}

          {hasRundown && (
            <section className="pinishi-rundown" aria-label="Rundown Acara">
              <img className="pinishi-rundown-decor pinishi-rundown-decor--l" src={ASSET("decor-rundown-2.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-rundown-inner" data-aos="fade-up">
                <h2 className="pinishi-title">Rundown Acara</h2>
                <div className="pinishi-rundown-list">
                  {rundownItems.map((item, index) => (
                    <article key={`${item.time || "rundown"}-${index}`}>
                      {item.time && <strong>{item.time}</strong>}
                      {item.description && <p>{item.description}</p>}
                    </article>
                  ))}
                </div>
              </div>
              <img className="pinishi-deco pinishi-deco--rundown-floral" src={ASSET("floral.webp")} alt="" aria-hidden="true" />
            </section>
          )}

          {hasDresscode && (
            <section className="pinishi-dresscode" aria-label="Dress Code">
              <img className="pinishi-dresscode-decor pinishi-dresscode-decor--r" src={ASSET("decor-bungaBugis4.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-dresscode-decor pinishi-dresscode-decor--l" src={ASSET("decor-rundown-3.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-dresscode-inner" data-aos="fade-up">
                <h2 className="pinishi-title">{profile.dresscode?.title || "Dress Code"}</h2>
                {dressDescription && <p>{dressDescription}</p>}
                <ul>
                  {dressColors.map((color, index) => (
                    <li key={`${color.hex || color.name}-${index}`}>
                      <span style={{ background: color.hex || "#ccc" }} />
                      <span>{color.name || ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {hasGift && (
            <section className="pinishi-gift" aria-label="Hadiah">
              <img className="pinishi-gift-decor pinishi-gift-decor--l" src={ASSET("decor-img-0651.webp")} alt="" aria-hidden="true" />
              <img className="pinishi-gift-decor pinishi-gift-decor--r" src={ASSET("decor-mitos-1.webp")} alt="" aria-hidden="true" />
              <div className="pinishi-gift-card" data-aos="fade-up">
                <h2>{giftIntroTitle}</h2>
                <p>{giftIntroDescription}</p>
                {!giftRevealed ? (
                  <button type="button" className="pinishi-gift-btn" onClick={() => setGiftRevealed(true)}>
                    Buka Amplop
                  </button>
                ) : (
                  <div className="pinishi-gift-body">
                    {accounts.length > 0 && (
                      <div className="pinishi-gift-accounts">
                        {accounts.map((account, index) => (
                          <div className="pinishi-gift-account" key={`${account.account_number || "account"}-${index}`}>
                            {account.provider_name && <p className="pinishi-gift-account-type">{account.provider_name}</p>}
                            <p className="pinishi-gift-account-name">{account.account_name}</p>
                            <p className="pinishi-gift-account-number">{account.account_number}</p>
                            <button type="button" onClick={() => copy(account.account_number || "")}>
                              Salin Nomor Rekening
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {giftAddress && (
                      <div className="pinishi-gift-address">
                        <p className="pinishi-gift-address-label">Kirim Hadiah</p>
                        <p className="pinishi-gift-address-text">{giftAddress}</p>
                        <button type="button" onClick={() => copy(giftAddress)}>
                          Salin Alamat
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="pinishi-wishes" aria-label="Ucapan & Doa">
            <img className="pinishi-deco pinishi-deco--wishes-ship" src={ASSET("decor-img-0543.webp")} alt="" aria-hidden="true" />
            <div className="pinishi-wishes-inner" data-aos="fade-in">
              <h2 className="pinishi-title" data-aos="fade-up">
                Wishes
              </h2>
              <p className="pinishi-wishes-subtitle" data-aos="fade-up" data-aos-delay="40" style={delay(40)}>
                {wishesSubtitle}
              </p>
              <div data-aos="fade-up" data-aos-delay="80" style={delay(80)}>
                <Wishes
                  weddingProfileId={profile.wedding_profile_id}
                  guestId={profile.guest_id}
                  guestName={profile.guest_name}
                  guestLinkStrict={profile.guest_link_strict}
                  coupleName={coupleLabel}
                />
              </div>
            </div>
          </section>

          {hasContacts && (
            <section className="pinishi-contacts" aria-label="Hubungi Kami">
              <div className="pinishi-contacts-inner" data-aos="fade-up">
                <h2 className="pinishi-title">Hubungi Kami</h2>
                <div className="pinishi-contacts-list">
                  {contactItems.map((contact, index) => {
                    const href = whatsappHref(contact.whatsapp)
                    return (
                      <article key={`${contact.name || "contact"}-${index}`}>
                        <div>
                          {contact.name && <strong>{contact.name}</strong>}
                          {contact.description && <p>{contact.description}</p>}
                        </div>
                        {href && (
                          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${contact.name || "kontak"}`}>
                            <WhatsAppIcon />
                            WhatsApp
                          </a>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="pinishi-closing" aria-label="Penutup">
            <img className="pinishi-deco pinishi-deco--closing-tree" src={ASSET("decor-tree-left.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-tree-r" src={ASSET("decor-tree-right.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-banana" src={ASSET("decor-banana.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-band" src={ASSET("decor-foliage-band.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-bouquet" src={ASSET("decor-flowers.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-lily" src={ASSET("decor-lily.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-sprig" src={ASSET("decor-purple.webp")} alt="" aria-hidden="true" />
            <img className="pinishi-deco pinishi-deco--closing-ship" src={ASSET("decor-ship.webp")} alt="" aria-hidden="true" />
            <div className="pinishi-closing-content" data-aos="fade-in">
              <p className="pinishi-closing-kicker">Thank You</p>
              <h2 className="pinishi-closing-names name-fit" style={fitStyle(coupleLabel)}>
                {coupleLabel}
              </h2>
              <p className="pinishi-closing-message">{closingMessage}</p>
            </div>
          </section>

          <footer className="pinishi-footer">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <span className="pinishi-footer-badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
              </span>
              <span>Undangan Pernikahan oleh Aksaraa</span>
            </a>
            <p>
              © {new Date().getFullYear()} {coupleLabel}. Digital Wedding Invitation.
            </p>
          </footer>
        </main>
      )}

      {lightbox !== null && photos[lightbox] && (
        <div className="pinishi-lightbox" role="dialog" aria-modal="true" aria-label="Galeri foto">
          <button type="button" className="pinishi-lightbox-close" aria-label="Tutup galeri" onClick={() => setLightbox(null)}>
            ×
          </button>
          <button
            type="button"
            className="pinishi-lightbox-nav pinishi-lightbox-nav--prev"
            aria-label="Foto sebelumnya"
            onClick={() => setLightbox((value) => (value === null ? value : (value - 1 + photos.length) % photos.length))}
          >
            ‹
          </button>
          <img src={photos[lightbox]} alt={`${coupleLabel} photo ${lightbox + 1}`} />
          <button
            type="button"
            className="pinishi-lightbox-nav pinishi-lightbox-nav--next"
            aria-label="Foto berikutnya"
            onClick={() => setLightbox((value) => (value === null ? value : (value + 1) % photos.length))}
          >
            ›
          </button>
        </div>
      )}

      {toast && (
        <div className="pinishi-toast" role="status">
          {toast}
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
          bottom={80}
        />
      )}
    </div>
  )
}
