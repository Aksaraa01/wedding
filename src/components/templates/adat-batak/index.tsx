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
import "./adat-batak.css"

const ASSET = (name: string) => `/templates/adat-batak/${name}`

const DEFAULT_QUOTE =
  "Bismillahirrahmanirrahim. Semoga Allah SWT senantiasa melimpahkan keberkahan, kasih, dan keharmonisan dalam perjalanan kami."
const DEFAULT_QUOTE_SOURCE = "Doa Pernikahan Adat Melayu"
const DEMO_TRACK = "/templates/adat-batak/dongan-matua.mp3"
const DEFAULT_GALLERY_QUOTE = "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama."
const DEFAULT_GIFT_DESCRIPTION =
  "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:"
const DEFAULT_CLOSING =
  "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan."
const DEFAULT_WISHES_SUBTITLE =
  "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu."

function describePalette(colors?: { hex?: string; name?: string }[]): string {
  const names = (colors || []).map((c) => (c.name || "").trim()).filter(Boolean)
  if (!names.length) return ""
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} dan ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, dan ${names[names.length - 1]}`
  return `Kami akan sangat berbahagia bila para tamu berkenan hadir dengan busana bernuansa ${list}. Motif floral vintage juga sangat kami sambut.`
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

function numericDate(iso?: string): string {
  const m = (iso || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ""
  return `${m[3]} / ${m[2]} / ${m[1].slice(2)}`
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

function HeartMarker() {
  return (
    <span className="story-marker" aria-hidden="true">
      <svg className="story-marker-ring" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="17.5" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
        <path d="M20.8 8.7c0 5.1-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" fill="currentColor" stroke="none" />
      </svg>
    </span>
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

export default function AdatBatak(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)
  const bufferSpinnerTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
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
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const events = (profile.sessions || []).filter(Boolean)
  const photos = flattenPhotos(profile.gallery_photos)
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const coverSlots = flattenPhotos(profile.cover_photos)
  const coverPhoto = coverPhotoOf(profile)
  const quotePhoto = coverSlots[1] || photos[2] || photos[0] || coverPhoto
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
  const giftIntroTitle = tc.gift_intro_title || "Love Gift"
  const giftIntroDescription = tc.gift_intro_description || DEFAULT_GIFT_DESCRIPTION
  const wishesSubtitle = tc.wishes_intro || DEFAULT_WISHES_SUBTITLE
  const closingMessage = tc.closing_message || DEFAULT_CLOSING
  const dressDescription = profile.dresscode?.description || describePalette(profile.dresscode?.colors)
  const livestream = profile.livestream

  const splitAt = photos.length > 8 ? Math.ceil(photos.length / 2) : photos.length
  const galleryRows = [photos.slice(0, splitAt), photos.slice(splitAt)].filter((row) => row.length > 0)
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
    const value = opened ? "" : "hidden"
    document.body.style.overflow = value
    document.documentElement.style.overflow = value
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [opened])

  useEffect(() => {
    if (opened) return
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
  }, [opened])

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
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const articles = Array.from(root.querySelectorAll<HTMLElement>(".story-list article"))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-story-reached")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.4 }
    )
    articles.forEach((article) => observer.observe(article))
    return () => observer.disconnect()
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-rundown-item], [data-contact-item]")
    )
    if (items.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-reached")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.4 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [opened, rundownItems.length, contactItems.length])

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

  const rootStyle = {
    "--warm": "#7D1319",
    "--dark": "#2A1F17",
    "--cream": "#FAF3EA",
    "--cream-2": "#EFE8D8",
    "--brown": "#735B3F",
    "--sage": "#7D1319",
    "--sage-deep": "#735B3F",
    "--adat-primary": "#7D1319",
    "--adat-primary-deep": "#735B3F",
    "--warm-fg": "#ffffff",
    "--adat-primary-text": "#735B3F",
    "--paper": "#FAF3EA",
    "--ink": "#2A1F17",
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={`adat-batak-root aos-ready${opened ? " is-open" : " is-locked"}`}
      style={rootStyle}
    >
      <a className="skip-link" href="#adat-batak-invitation">
        Lewati ke undangan
      </a>

      {hasTrack && (
        <audio
          ref={audioRef}
          loop
          preload={connectionOk ? "auto" : "metadata"}
        >
          <source src={trackUrl} type="audio/mpeg" />
        </audio>
      )}

      {hasTrack && (
        <button
          className={`tpl-music-btn${opened ? " visible" : ""}${playing ? "" : " paused"}`}
          type="button"
          aria-label="Putar atau jeda musik"
          onClick={toggleMusic}
        >
          <span className="tpl-vinyl">
            <span className="tpl-vinyl-groove tpl-vinyl-groove-1" />
            <span className="tpl-vinyl-groove tpl-vinyl-groove-2" />
            <span className="tpl-vinyl-label" />
            <span className="tpl-vinyl-hole" />
          </span>
          <span className="tpl-tonearm">
            <span className="tpl-tonearm-pivot" />
            <span className="tpl-tonearm-arm" />
            <span className="tpl-tonearm-head" />
          </span>
        </button>
      )}

      <div className="page-shell">
        <div className="desktop-blank" aria-hidden="true" />

        <section className="cover" aria-label="Sampul undangan">
          <div className="cover-left">
            <img src={coverPhoto} alt={coupleLabel} />
            <div className="cover-left-shade" />
            <div className="cover-left-copy" data-aos="fade-up">
              <p className="script cover-kicker garden-text-reveal" data-aos="fade-down">
                The Wedding of
              </p>
              <h1 className="name-fit couple-name cover-couple-name" style={fitStyle(coupleLabel)}>
                {groomShort} &amp; {brideShort}
              </h1>
              {dateLong && (
                <p className="cover-date garden-text-reveal" data-aos="fade-up" data-aos-delay="140" style={delay(140)}>
                  {dateLong}
                </p>
              )}
            </div>
          </div>
        </section>

        <main className="right-column" id="adat-batak-invitation">
          <img className="right-parallax-background" src={ASSET("parallax-overlay.webp")} alt="" aria-hidden="true" />

          <section className="cover-gate" aria-label="Sampul undangan" aria-hidden={opened}>
            <div className="gate-stage gate-initial">
              <img src={coverPhoto} alt={coupleLabel} />
              <div className="gate-shade" />
              <div className="gate-copy">
                <div className="gate-heading garden-text-reveal" data-aos="fade-down">
                  <p className="script">The Wedding of</p>
                  <h2 className="name-fit couple-name cover-couple-name" style={fitStyle(coupleLabel)}>
                    {groomShort} &amp; {brideShort}
                  </h2>
                  {dateLong && <p className="gate-date">{dateLong}</p>}
                </div>
                <div className="gate-details" data-aos="fade-up" data-aos-delay="140" style={delay(140)}>
                  <p className="cover-to">Kepada Yth:</p>
                  <p className="guest-name gate-guest name-fit" style={fitStyle(guestName)}>
                    {guestName}
                  </p>
                  <p className="guest-note">{coverApology}</p>
                  <button
                    className="pill-button gate-open garden-text-reveal"
                    type="button"
                    data-aos="zoom-in"
                    data-aos-delay="260"
                    style={delay(260)}
                    onClick={openInvitation}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                      <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
                    </svg>
                    Buka Undangan
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className={`video-intro ${videoFailed ? "is-fallback" : "is-video"}${opened ? "" : " is-preloading"}`}
            id="adat-batak-video-intro"
            aria-label="Video pembuka"
            aria-hidden={!opened}
          >
            <div className="gate-stage gate-video">
              <video
                ref={videoRef}
                muted
                playsInline
                preload={connectionOk ? "auto" : "metadata"}
                poster={ASSET("fallback.webp")}
                onPlaying={handleVideoPlaying}
                onWaiting={handleVideoWaiting}
                onError={handleVideoError}
              >
                <source src={ASSET("opening-garden.mp4")} type="video/mp4" />
              </video>
              {opened && videoBuffering && !videoFailed && (
                <div className="video-buffering" role="status" aria-live="polite" aria-label="Memuat video">
                  <span className="gate-spinner" aria-hidden="true" />
                </div>
              )}
              <div className="gate-shade" />
              <div className={`video-copy${opened ? " is-visible" : ""}`} aria-hidden="true">
                <p className="script">The Wedding of</p>
                <h2 className="name-fit" style={fitStyle(groomShort)}>
                  {groomShort}
                </h2>
                <span className="video-ampersand">&amp;</span>
                <h2 className="name-fit" style={fitStyle(brideShort)}>
                  {brideShort}
                </h2>
                <p>{numericDate(profile.estimated_wedding_date || events[0]?.date)}</p>
              </div>
            </div>
            <div className="gate-stage gate-fallback">
              <img src={ASSET("fallback.webp")} alt="Garden illustration for the invitation" />
              <div className="fallback-copy">
                <p className="script">The Wedding of</p>
                <h2 className="name-fit" style={fitStyle(groomShort)}>
                  {groomShort}
                </h2>
                <span className="fallback-ampersand">&amp;</span>
                <h2 className="name-fit" style={fitStyle(brideShort)}>
                  {brideShort}
                </h2>
                <p>{numericDate(profile.estimated_wedding_date || events[0]?.date)}</p>
              </div>
            </div>
          </section>

          {opened && (
          <>
          <section className="verse-section" data-aos="fade-up" aria-label="Ayat">
            <div className="quote-card" data-aos="zoom-in" data-aos-delay="60" style={delay(60)}>
              <div className="quote-photo-wrap garden-text-reveal" data-aos="zoom-in" data-aos-delay="140" style={delay(140)}>
                <img src={quotePhoto} alt={`${coupleLabel} bersama`} />
              </div>
              <div className="quote-copy" data-aos="fade-up" data-aos-delay="220" style={delay(220)}>
                <p className="verse-hashtag name-fit garden-text-reveal" style={fitStyle(profile.display_name || `#${groomShort}${brideShort}`)} data-aos="fade-down">
                  {profile.display_name || `#${`${groomShort}${brideShort}`.replace(/\s+/g, "")}`}
                </p>
                <blockquote className="garden-text-reveal" data-aos="fade-up" data-aos-delay="100" style={delay(100)}>
                  {quoteText}
                </blockquote>
                {quoteSource && (
                  <p className="quote-source garden-text-reveal" data-aos="fade-up" data-aos-delay="180" style={delay(180)}>
                    - {quoteSource} -
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="groom-bride-section parallax-section" data-aos="fade-up" aria-label="Mempelai">
            <div className="profile-card" data-aos="fade-up" data-aos-delay="60" style={delay(60)}>
              <div className="profile-intro" data-aos="fade-down" data-aos-delay="120" style={delay(120)}>
                <h2 className="script profile-heading garden-text-reveal" data-aos="fade-up">
                  We Are Getting
                  <br />
                  Married!
                </h2>
                <p className="garden-text-reveal" data-aos="fade-up" data-aos-delay="120" style={delay(120)}>
                  Dengan memohon rahmat dan ridho Allah SWT, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.
                </p>
              </div>
              <div>
                <article className="person person-groom" data-aos="slide-left" data-aos-delay="160" style={delay(160)}>
                  <div className="person-image">
                    <img className="person-photo" src={groomPhoto} alt={groomFull} data-aos="zoom-in" />
                    <img className="person-floral floral-left" src={ASSET("couple-2.webp")} alt="" data-aos="leaf-in" data-aos-delay="120" style={delay(120)} />
                    <img className="person-floral floral-right" src={ASSET("couple-1.webp")} alt="" data-aos="leaf-in" data-aos-delay="220" style={delay(220)} />
                  </div>
                  <h3 className="script name-fit person-nickname garden-text-reveal" style={fitStyle(groomShort)} data-aos="fade-up">
                    {groomShort}
                  </h3>
                  <p className="person-fullname name-fit garden-text-reveal" style={fitStyle(groomFull)} data-aos="fade-up" data-aos-delay="100">
                    {groomFull}
                  </p>
                  {profile.groom_parents && (
                    <p className="person-parents garden-text-reveal" data-aos="fade-up" data-aos-delay="160" style={delay(160)}>
                      <span className="name-fit" style={fitStyle(profile.groom_parents)}>
                        {profile.groom_parents}
                      </span>
                    </p>
                  )}
                  {profile.groom_instagram && (
                    <a
                      className="small-pill garden-text-reveal"
                      href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram ${groomFull}`}
                      data-aos="zoom-in"
                      data-aos-delay="220"
                      style={delay(220)}
                    >
                      <InstagramIcon />@{profile.groom_instagram.replace(/^@/, "")}
                    </a>
                  )}
                </article>
                <p className="profile-ampersand garden-text-reveal" aria-hidden="true" data-aos="zoom-in">
                  &amp;
                </p>
              </div>
              <div>
                <article className="person person-bride" data-aos="slide-right" data-aos-delay="160" style={delay(160)}>
                  <div className="person-image">
                    <img className="person-photo" src={bridePhoto} alt={brideFull} data-aos="zoom-in" />
                    <img className="person-floral floral-left" src={ASSET("couple-1.webp")} alt="" data-aos="leaf-in" data-aos-delay="120" style={delay(120)} />
                    <img className="person-floral floral-right" src={ASSET("couple-2.webp")} alt="" data-aos="leaf-in" data-aos-delay="220" style={delay(220)} />
                  </div>
                  <h3 className="script name-fit person-nickname garden-text-reveal" style={fitStyle(brideShort)} data-aos="fade-up">
                    {brideShort}
                  </h3>
                  <p className="person-fullname name-fit garden-text-reveal" style={fitStyle(brideFull)} data-aos="fade-up" data-aos-delay="100">
                    {brideFull}
                  </p>
                  {profile.bride_parents && (
                    <p className="person-parents garden-text-reveal" data-aos="fade-up" data-aos-delay="160" style={delay(160)}>
                      <span className="name-fit" style={fitStyle(profile.bride_parents)}>
                        {profile.bride_parents}
                      </span>
                    </p>
                  )}
                  {profile.bride_instagram && (
                    <a
                      className="small-pill garden-text-reveal"
                      href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram ${brideFull}`}
                      data-aos="zoom-in"
                      data-aos-delay="220"
                      style={delay(220)}
                    >
                      <InstagramIcon />@{profile.bride_instagram.replace(/^@/, "")}
                    </a>
                  )}
                </article>
              </div>
            </div>
          </section>

          {honored.length > 0 && (
            <section className="inviting-section parallax-section" data-aos="fade-up" aria-label="Turut Mengundang">
              <div className="inviting-card" data-aos="zoom-in" data-aos-delay="60" style={delay(60)}>
                <h2 className="script inviting-title garden-text-reveal" data-aos="fade-down">
                  Turut Mengundang
                </h2>
                <ul className="inviting-list">
                  {honored.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="garden-text-reveal"
                      data-aos="fade-up"
                      data-aos-delay={120 + index * 70}
                      style={delay(120 + index * 70)}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="events-section" data-aos="fade-up" aria-label="Acara">
            <img className="bouquet" src={ASSET("bouquet.webp")} alt="" data-aos="leaf-in" />
            <h2 className="script section-title garden-text-reveal" data-aos="fade-down">
              Save The Date
            </h2>
            <div className="countdown" aria-label="Hitung mundur acara" data-aos="scale-in">
              <div data-aos="flip-in" data-aos-delay="0" className="garden-text-reveal" style={delay(0)}>
                <strong>{countdown?.d ?? "00"}</strong>
                <span>Hari</span>
              </div>
              <div data-aos="flip-in" data-aos-delay="70" className="garden-text-reveal" style={delay(70)}>
                <strong>{countdown?.h ?? "00"}</strong>
                <span>Jam</span>
              </div>
              <div data-aos="flip-in" data-aos-delay="140" className="garden-text-reveal" style={delay(140)}>
                <strong>{countdown?.m ?? "00"}</strong>
                <span>Menit</span>
              </div>
              <div data-aos="flip-in" data-aos-delay="210" className="garden-text-reveal" style={delay(210)}>
                <strong>{countdown?.s ?? "00"}</strong>
                <span>Detik</span>
              </div>
            </div>
            <div className="events-intro" data-aos="fade-up" data-aos-delay="140" style={delay(140)}>
              {calendarUrl && (
                <a
                  className="small-pill calendar-button garden-text-reveal"
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aos="zoom-in"
                  data-aos-delay="180"
                  style={delay(180)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                  TAMBAH KE KALENDER
                </a>
              )}
              <p>
                Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Melayu kami:
              </p>
            </div>
            {events.map((event, index) => {
              const mapsUrl =
                event.maps_url ||
                (event.venue || event.address
                  ? `https://maps.google.com/?q=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "))}`
                  : "")
              return (
                <div
                  className="event-card"
                  key={`${event.name || "event"}-${index}`}
                  data-aos={index % 2 === 0 ? "slide-left" : "slide-right"}
                  data-aos-delay={120 + index * 60}
                  style={delay(120 + index * 60)}
                >
                  <div className="event-card-inner" data-aos="fade-up">
                    <h3 className="script name-fit garden-text-reveal" style={fitStyle(event.name || "Acara Pernikahan")} data-aos="fade-up">
                      {event.name || "Acara Pernikahan"}
                    </h3>
                    <strong className="event-date garden-text-reveal" data-aos="fade-up" data-aos-delay="55" style={delay(55)}>
                      {formatLongDate(event.date || profile.estimated_wedding_date)}
                    </strong>
                    {event.time && (
                      <span className="event-time garden-text-reveal" data-aos="fade-up" data-aos-delay="110" style={delay(110)}>
                        {event.time}
                      </span>
                    )}
                    <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                      <circle cx="12" cy="10" r="2" />
                    </svg>
                    {event.venue && (
                      <strong className="event-venue garden-text-reveal" data-aos="fade-up" data-aos-delay="220" style={delay(220)}>
                        {event.venue}
                      </strong>
                    )}
                    {event.address && (
                      <span className="event-address garden-text-reveal" data-aos="fade-up" data-aos-delay="275" style={delay(275)}>
                        <span>{event.address}</span>
                      </span>
                    )}
                    {mapsUrl && (
                      <a
                        className="small-pill garden-text-reveal"
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-aos="fade-up"
                        data-aos-delay="330"
                        style={delay(330)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                          <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
                          <circle cx="12" cy="10" r="2" />
                        </svg>
                        LIHAT LOKASI
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </section>

          {hasLivestream && (
            <section className="live-streams-section parallax-section" data-aos="fade-up" aria-label="Live Streaming">
              <div className="stream-card" data-aos="fade-up">
                <h2 className="script garden-text-reveal" data-aos="fade-down">
                  {livestream?.title || "Live Streaming"}
                </h2>
                <p className="garden-text-reveal" data-aos="fade-up" data-aos-delay="120" style={delay(120)}>
                  {livestream?.description || "Temui kami secara virtual untuk menyaksikan acara pernikahan kami melalui tautan di bawah ini:"}
                </p>
                <a
                  className="stream-link garden-text-reveal"
                  href={livestream!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aos="zoom-in"
                  data-aos-delay="220"
                  style={delay(220)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="m10.3 8.7 5.2 3.3-5.2 3.3Z" fill="currentColor" stroke="none" />
                  </svg>
                  {livestream?.buttonLabel || "Tonton Live Streaming"}
                </a>
              </div>
            </section>
          )}

          {hasRundown && (
            <section className="tpl-rundown" aria-label="Rundown Acara">
              <div className="tpl-rundown__card" data-aos="fade-up">
                <h2 className="tpl-rundown__title">Rundown Acara</h2>
                <div className="tpl-rundown__list">
                  {rundownItems.map((item, index) => (
                    <article
                      className="tpl-rundown__item"
                      data-rundown-item="true"
                      key={`${item.time || "rundown"}-${index}`}
                    >
                      <span className="tpl-rundown__marker" aria-hidden="true" />
                      {item.time && <strong className="tpl-rundown__time">{item.time}</strong>}
                      {item.description && <p className="tpl-rundown__desc">{item.description}</p>}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {hasDresscode && (
            <section className="dress-code-section" data-aos="fade-up" aria-labelledby="dress-code-title">
              <div className="dress-code-card" data-aos="zoom-in" data-aos-delay="60" style={delay(60)}>
                <div className="dress-code-intro garden-text-reveal" data-aos="fade-up" data-aos-delay="120" style={delay(120)}>
                  <h2 id="dress-code-title" className="script">
                    {profile.dresscode?.title || "Dress Code"}
                  </h2>
                  {dressDescription && <p>{dressDescription}</p>}
                </div>
                <ul className="dress-code-swatches" role="list" aria-label="Palet warna dress code" data-aos="fade-up" data-aos-delay="180" style={delay(180)}>
                  {dressColors.map((color, index) => (
                    <li
                      className="dress-code-swatch garden-text-reveal"
                      role="listitem"
                      aria-label={color.name || color.hex || `Warna ${index + 1}`}
                      key={`${color.hex || color.name}-${index}`}
                      data-aos="zoom-in"
                      data-aos-delay={index * 70}
                      style={delay(index * 70)}
                    >
                      <span
                        className="dress-code-swatch-dot"
                        aria-hidden="true"
                        style={{ background: color.hex || "#ccc", borderColor: color.hex || "#ccc" }}
                      />
                      <span>{color.name || ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {hasGallery && (
            <section className="our-gallery-section" data-aos="fade-up" aria-label="Our Gallery">
              <h2 className="script section-title garden-text-reveal" data-aos="fade-down">
                Our Gallery
              </h2>
              {galleryIntro && <p className="gallery-description">{galleryIntro}</p>}

              {galleryRows.map((row, rowIndex) => {
                const offset = rowIndex === 0 ? 0 : splitAt
                return (
                  <div className={`car-row${rowIndex % 2 === 1 ? " car-row--rev" : ""}`} style={{ "--dur": "56s" } as CSSProperties} key={`row-${rowIndex}`}>
                    <div className="car-track">
                      {[...row, ...row].map((src, index) => {
                        const photoIndex = offset + (index % row.length)
                        return (
                          <figure className="car-tile" aria-hidden={index >= row.length} key={`${src}-${index}`}>
                            <button
                              type="button"
                              tabIndex={index >= row.length ? -1 : 0}
                              aria-label={`Lihat foto ${photoIndex + 1}`}
                              onClick={() => setLightbox(photoIndex)}
                            >
                              <img src={src} alt="" loading="lazy" decoding="async" />
                            </button>
                          </figure>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <blockquote className="gallery-quote garden-text-reveal" data-aos="fade-up" data-aos-delay="260" style={delay(260)}>
                <p>{galleryQuote}</p>
                <cite>- {coupleLabel} -</cite>
              </blockquote>

              {hasVideo && (
                <div className="gallery-video-card garden-text-reveal" data-aos="fade-up" data-aos-delay="180" style={delay(180)}>
                  <iframe
                    src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=1&mute=1&controls=1&modestbranding=1&iv_load_policy=3&rel=0&playsinline=1`}
                    title={`Video pernikahan ${coupleLabel}`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              )}
            </section>
          )}

          {hasStory && (
            <section className="love-story-section parallax-section" data-aos="fade-up" aria-label="Love Story">
              <div className="story-card" data-aos="fade-up">
                <img className="story-bouquet" src={ASSET("bouquet.webp")} alt="" data-aos="leaf-in" />
                <h2 className="script garden-text-reveal" data-aos="fade-down">
                  Love Story
                </h2>
                <div className="story-list">
                  {stories.map((story, index) => (
                    <article key={`${story.title || "story"}-${index}`}>
                      <HeartMarker />
                      <h3>{story.title || `Bagian ${index + 1}`}</h3>
                      {story.description && <p>{story.description}</p>}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {hasGift && (
            <section className="gift-section gift-section--covered" data-aos="fade-up" aria-label="Hadiah">
              <svg className="gift-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 10h18v10H3zM2 7h20v3H2zM12 7v13" />
                <path d="M12 7s-1.5-5-4.5-5A2.5 2.5 0 0 0 5 4.5C5 7 12 7 12 7Zm0 0s1.5-5 4.5-5A2.5 2.5 0 0 1 19 4.5C19 7 12 7 12 7Z" />
              </svg>
              <h2 className="script section-title garden-text-reveal" data-aos="fade-down">
                {giftIntroTitle}
              </h2>
              <p className="gift-intro garden-text-reveal" data-aos="fade-up" data-aos-delay="120" style={delay(120)}>
                {giftIntroDescription}
              </p>
              <div className="gift-card-shell" data-aos="zoom-in" data-aos-delay="160" style={delay(160)}>
                <section className="tpl-gift garden-text-reveal" id="gift" data-aos="fade-up">
                  <p className="tpl-gift__label" />
                  {!giftRevealed ? (
                    <div className="tpl-gift__reveal">
                      <button
                        type="button"
                        className="tpl-gift__copy-btn tpl-gift__reveal-btn"
                        aria-expanded="false"
                        onClick={() => setGiftRevealed(true)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Buka Amplop</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {accounts.length > 0 && (
                        <div className="tpl-gift__accounts">
                          {accounts.map((account, index) => (
                            <div className="tpl-gift__account" key={`${account.account_number || "account"}-${index}`}>
                              {account.provider_name && (
                                <p className="tpl-gift__account-type">{account.provider_name}</p>
                              )}
                              <p className="tpl-gift__account-name">{account.account_name}</p>
                              <p className="tpl-gift__account-number">{account.account_number}</p>
                              <button
                                type="button"
                                className="tpl-gift__copy-btn"
                                onClick={() => copy(account.account_number || "")}
                              >
                                Salin Nomor Rekening
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tpl-gift__copy-icon" aria-hidden="true">
                                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {giftAddress && (
                        <div className="tpl-gift__address">
                          <svg className="gift-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" aria-hidden="true">
                            <path d="M3 10h18v10H3zM2 7h20v3H2zM12 7v13" />
                            <path d="M12 7s-1.5-5-4.5-5A2.5 2.5 0 0 0 5 4.5C5 7 12 7 12 7Zm0 0s1.5-5 4.5-5A2.5 2.5 0 0 1 19 4.5C19 7 12 7 12 7Z" />
                          </svg>
                          <p className="tpl-gift__address-label">Kirim Hadiah</p>
                          <p className="tpl-gift__address-text">{giftAddress}</p>
                          <button type="button" className="tpl-gift__copy-btn" onClick={() => copy(giftAddress)}>
                            Salin Alamat
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tpl-gift__copy-icon" aria-hidden="true">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            </section>
          )}

          <section className="rsvp-wishes-section parallax-section" data-aos="fade-up" aria-label="Wishes">
            <h2 className="script garden-text-reveal" data-aos="fade-down">
              Wishes
            </h2>
            <p className="wishes-subtitle garden-text-reveal" data-aos="fade-up" data-aos-delay="100" style={delay(100)}>
              {wishesSubtitle}
            </p>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              coupleName={coupleLabel}
            />
          </section>

          {hasContacts && (
            <section className="tpl-contact" aria-label="Hubungi Kami">
              <div className="tpl-contact__card" data-aos="fade-up">
                <h2 className="tpl-contact__title">Hubungi Kami</h2>
                <div className="tpl-contact__list">
                  {contactItems.map((contact, index) => {
                    const href = whatsappHref(contact.whatsapp)
                    return (
                      <article
                        className="tpl-contact__item"
                        data-contact-item="true"
                        key={`${contact.name || "contact"}-${index}`}
                      >
                        <div className="tpl-contact__info">
                          {contact.name && <strong className="tpl-contact__name">{contact.name}</strong>}
                          {contact.description && <p className="tpl-contact__desc">{contact.description}</p>}
                        </div>
                        {href && (
                          <a
                            className="tpl-contact__wa"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`WhatsApp ${contact.name || "kontak"}`}
                          >
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

          <section className="thank-you-section" data-aos="fade-up" aria-label="Terima Kasih">
            <img className="closing-photo" src={closingPhoto} alt={coupleLabel} />
            <div className="closing-shade" />
            <div className="closing-copy" data-aos="fade-up">
              <div className="closing-message garden-text-reveal" data-aos="fade-up">
                <p>{closingMessage}</p>
                <strong>Dengan penuh hormat dan syukur,</strong>
                <p className="script closing-names name-fit" style={fitStyle(coupleLabel)}>
                  {groomShort} &amp; {brideShort}
                </p>
              </div>
              <footer className="tpl-footer adat-batak-footer garden-text-reveal" data-aos="fade-up" data-aos-delay="70" style={delay(70)}>
                <a className="tpl-footer__link" href={waHref} target="_blank" rel="noopener noreferrer">
                  <span className="tpl-footer__badge">
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="tpl-footer__logo" draggable={false} />
                  </span>
                  <span className="tpl-footer__cta">Undangan Pernikahan oleh Aksaraa</span>
                </a>
                <p className="tpl-footer__text">© {new Date().getFullYear()} {coupleLabel}. Digital Wedding Invitation.</p>
                <div className="tpl-footer__socials">
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="tpl-footer__social" aria-label="WhatsApp Aksaraa Wedding">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                  <a href="https://instagram.com/wedding.aksaraa" target="_blank" rel="noopener noreferrer" className="tpl-footer__social" aria-label="Instagram Aksaraa Wedding">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                </div>
              </footer>
            </div>
          </section>
          </>
          )}
        </main>
      </div>

      {lightbox !== null && photos[lightbox] && (
        <div className="adat-batak-lightbox" role="dialog" aria-modal="true" aria-label="Galeri foto">
          <button type="button" className="adat-batak-lightbox__close" aria-label="Tutup galeri" onClick={() => setLightbox(null)}>
            ×
          </button>
          <button
            type="button"
            className="adat-batak-lightbox__nav adat-batak-lightbox__nav--prev"
            aria-label="Foto sebelumnya"
            onClick={() => setLightbox((value) => (value === null ? value : (value - 1 + photos.length) % photos.length))}
          >
            ‹
          </button>
          <img src={photos[lightbox]} alt={`${coupleLabel} photo ${lightbox + 1}`} />
          <button
            type="button"
            className="adat-batak-lightbox__nav adat-batak-lightbox__nav--next"
            aria-label="Foto berikutnya"
            onClick={() => setLightbox((value) => (value === null ? value : (value + 1) % photos.length))}
          >
            ›
          </button>
        </div>
      )}

      {toast && (
        <div className="adat-batak-toast" role="status">
          {toast}
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
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
