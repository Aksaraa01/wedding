"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import AutoplayYouTube from "../shared/AutoplayYouTube"
import {
  countdownTarget,
  coverPhoto as coverPhotoOf,
  flattenPhotos,
  groomPhoto as groomPhotoOf,
  bridePhoto as bridePhotoOf,
  formatLongDate,
  initialsOf,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import { copyPlainText } from "@/lib/clipboard"
import "./cinnabar-seal.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const ART = (name: string) => `/templates/cinnabar-seal/${name}.webp`

const DEFAULT_OPENING_TITLE = "Salam Hangat"
const DEFAULT_OPENING_DESCRIPTION =
  "Dengan memohon rahmat dan karunia Tuhan, kami bermaksud mengundang Anda untuk ikut serta dalam hari paling berarti bagi kami."
const DEFAULT_CLOSING =
  "Merupakan suatu kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari cerita kami."

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// "20 · 03 · 2027" — the reference's cover date.
function dottedDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} · ${pad2(d.getMonth() + 1)} · ${d.getFullYear()}`
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return (t.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  return t.replace(/^@/, "")
}

const WISH_ME = "Tamu Undangan"

// animate.css 4.1.1 drives the reference: fadeIn for copy, fadeInUp for
// titles/rows, fadeInDown for the hanging lanterns, zoomIn for medallions.
// `IN` tags an element with the same animation and delay; one observer adds
// `.is-in`. Cover elements use `ON_LOAD` so they play without scrolling.
type Reveal = "fade" | "up" | "down" | "zoom"
type RevealProps = { "data-cn-reveal"?: Reveal; "data-cn-load"?: Reveal; style?: CSSProperties }

const IN = (kind: Reveal, delay = 0): RevealProps => ({
  "data-cn-reveal": kind,
  style: { "--cn-delay": `${delay}s` } as CSSProperties,
})
const ON_LOAD = (kind: Reveal, delay = 0): RevealProps => ({
  "data-cn-load": kind,
  style: { "--cn-delay": `${delay}s` } as CSSProperties,
})

function Seal({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const chars = Array.from(initials)
  // Two glyphs keep the reference's stacked slash mark; a longer abbreviation
  // prints every letter in the seal (auto-shrunk) instead of losing the third.
  const stacked = chars.length > 2
  return (
    <span className={`cn-seal cn-seal--${size}`} aria-hidden="true">
      <span className="cn-seal__mark" />
      <span
        className={`cn-seal__chars${stacked ? " cn-seal__chars--stacked" : ""}`}
        style={stacked ? ({ "--cn-count": chars.length } as CSSProperties) : undefined}
      >
        {chars.map((char, index) => (
          <Fragment key={index}>
            {index > 0 && !stacked && <i className="cn-seal__slash" />}
            <span className="cn-seal__char">{char}</span>
          </Fragment>
        ))}
      </span>
    </span>
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
    { value: pad2(Math.floor((diff % 3600000) / 60000)), label: "Minutes" },
    { value: pad2(Math.floor((diff % 60000) / 1000)), label: "Seconds" },
  ]

  return (
    <div className="cn-clock" aria-label="Hitung mundur menuju hari bahagia">
      {units.map((unit) => (
        <div className="cn-clock__cell" key={unit.label}>
          <span className="cn-clock__value">{target ? unit.value : "--"}</span>
          <small className="cn-clock__label">{unit.label}</small>
        </div>
      ))}
    </div>
  )
}

// Split the last word so the reference's italic accent survives editable copy
// ("Shades of Red" → "Shades of" + italic "Red").
function SplitAccent({ text }: { text: string }) {
  const words = text.trim().split(/\s+/)
  if (words.length < 2) return <>{text}</>
  const last = words.pop() as string
  return (
    <>
      {words.join(" ")} <em>{last}</em>
    </>
  )
}

function AccentTitle({ text, className }: { text: string; className?: string }) {
  const words = text.trim().split(/\s+/)
  if (words.length < 2) return <h2 className={className}>{text}</h2>
  const last = words.pop() as string
  return (
    <h2 className={className}>
      {words.join(" ")} <em>{last}</em>
    </h2>
  )
}

export default function CinnabarSeal(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [giftOpen, setGiftOpen] = useState(false)
  const [openingStarted, setOpeningStarted] = useState(false)
  const [openingFallback, setOpeningFallback] = useState(false)
  const [filmStarted, setFilmStarted] = useState(false)
  const [filmFallback, setFilmFallback] = useState(false)
  const [toast, setToast] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])

  const baseStill = coverPhotoOf(profile) || gallery[0] || ""
  const coverStill = slots[0] || baseStill
  const heroStill = slots[1] || gallery[0] || baseStill
  const closingStill = slots[2] || slots[0] || heroStill
  const groomShot = groomPhotoOf(profile.groom_photo_url) || gallery[1] || baseStill
  const brideShot = bridePhotoOf(profile.bride_photo_url) || gallery[2] || groomShot

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () =>
      gates.story === false || profile.story_visible === false
        ? []
        : (profile.stories || []).filter((story) => story && (story.title || story.description)),
    [profile.stories, gates.story, profile.story_visible]
  )
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((item) => item && (item.time || item.description))
      : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((family) => !!family && !!family.trim())
      : []

  const dressColors = (profile.dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const dressTitle = (profile.dresscode?.title || "").trim()
  const dressIntro = (tc.dresscode_intro || profile.dresscode?.description || "").trim()
  const hasDresscode = profile.dresscode_visible !== false && (dressColors.length > 0 || !!dressTitle || !!dressIntro)

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!film
  const openingFilm = hasVideo && film && film.kind === "file" ? film.src : ""
  const youtubeId =
    hasVideo && film && film.kind === "embed"
      ? film.src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)?.[1] || ""
      : ""
  const hasOpeningMedia = !!openingFilm || (hasVideo && !!youtubeId) || !!coverStill
  const youtubeEmbedBase = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`
    : ""
  const openingEmbedUrl = `${youtubeEmbedBase}&controls=0&fs=0`
  const filmEmbedUrl = `${youtubeEmbedBase}&controls=1&fs=1`

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || (lang === "en" ? "The Wedding" : "Pernikahan")
  const guestName = (profile.guest_name || "").trim() || WISH_ME
  const dateLong = formatLongDate(profile.estimated_wedding_date)
  const dateDotted = dottedDate(profile.estimated_wedding_date)
  // The editor owns the cover monogram ("Singkatan Pasangan"); only fall back
  // to the names when the couple has not filled it.
  const editorInitials = (profile.couple_initials || "").replace(/[^A-Za-z]/g, "").toUpperCase()
  const initials = editorInitials || initialsOf(groomName, brideName) || "CS"
  const year = String(parseDate(profile.estimated_wedding_date)?.getFullYear() || new Date().getFullYear())

  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  const openingTitle = (profile.opening_title || "").trim() || DEFAULT_OPENING_TITLE
  const openingDescription = (profile.opening_description || "").trim() || DEFAULT_OPENING_DESCRIPTION
  const quoteText = (profile.quote_text || "").trim()
  const closingMessage = (tc.closing_message || "").trim() || (lang === "en" ? "It is a joy for us if you would honour us with your presence and prayers. Thank you for being part of our story." : DEFAULT_CLOSING)

  const coverKicker = (tc.cover_kicker || "").trim() || t("theWeddingOf", lang)
  const openLabel = (tc.open_button || "").trim() || t("openInvitation", lang)
  const saveLabel = (tc.save_date_label || "").trim() || t("saveTheDate", lang)
  const copyAddressLabel = (tc.copy_address_button || "").trim() || t("copyAddress", lang)
  const apology = (tc.cover_apology || "").trim()
  const welcomeLine = (tc.welcome_message || "").trim()
  const openingKicker = (tc.opening_kicker || "").trim() || (lang === "en" ? "With Blessings" : "Dengan Restu")
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || t("secCouple", lang)
  const parentsLabel = (tc.parents_label || "").trim() || (lang === "en" ? "Child of" : "Anak dari")
  const storyKicker = (tc.story_kicker || "").trim() || (lang === "en" ? "Our" : "Kisah")
  const storyTitle = (tc.love_story_title || "").trim() || (lang === "en" ? "Love Story" : "Kisah Cinta")
  const storyIntro = (tc.story_intro || "").trim()
  const eventsKicker = (tc.events_kicker || "").trim() || t("saveTheDate", lang)
  const eventsTitle = (tc.events_title || "").trim() || t("secEvent", lang)
  const eventsIntro = (tc.events_intro || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || t("viewLocation", lang)
  const invitingKicker = (tc.inviting_kicker || "").trim() || t("secInviting", lang)
  const invitingTitle = (tc.inviting_title || "").trim() || (lang === "en" ? "Family & Friends" : "Keluarga & Sahabat")
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownKicker = (tc.rundown_kicker || "").trim() || t("rundownTitle", lang)
  const rundownTitle = (tc.rundown_title || "").trim() || t("rundownTitle", lang)
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryKicker = (tc.gallery_kicker || "").trim() || (lang === "en" ? "Precious" : "Momen")
  const galleryTitle = (tc.gallery_title || "").trim() || (lang === "en" ? "Moments" : "Galeri")
  const galleryIntro = (tc.gallery_intro || "").trim()
  const videoKicker = (tc.video_kicker || "").trim() || t("secVideo", lang)
  const videoTitle = (tc.video_title || "").trim() || t("secVideo", lang)
  const videoIntro = (tc.video_intro || "").trim()
  const giftKicker = (tc.gift_kicker || "").trim() || (lang === "en" ? "Digital Envelope" : "Amplop Digital")
  const giftTitle = (tc.gift_intro_title || "").trim() || t("secGift", lang)
  const giftIntro = (tc.gift_intro_description || "").trim()
  const giftButton = (tc.gift_button || "").trim() || t("sendGift", lang)
  const dressKicker = (tc.dresscode_kicker || "").trim() || t("secDresscode", lang)
  const wishesKicker = (tc.wishes_kicker || "").trim() || t("secWishes", lang)
  const wishesTitle = (tc.wishes_title || "").trim() || t("secWishes", lang)
  const wishesIntro = (tc.wishes_intro || "").trim()
  const closingKicker = (tc.closing_kicker || "").trim() || t("thankYou", lang)
  const accountToast = (tc.copy_account_toast || "").trim() || t("copiedToClipboard", lang)
  const addressToast = (tc.copy_address_toast || "").trim() || t("copiedToClipboard", lang)

  const wishCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || (lang === "en" ? "Name" : "Nama"),
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || (lang === "en" ? "Full name" : "Nama lengkap"),
    messageLabel: (tc.wishes_message_label || "").trim() || t("secWishes", lang),
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || (lang === "en" ? "Leave your best wishes and prayers" : "Titipkan pesan dan doa terbaik"),
    submit: (tc.wishes_submit || "").trim() || t("sendWishes", lang),
    empty: (tc.wishes_empty || "").trim() || t("noWishesYet", lang),
  }

  const target = useMemo(
    () => countdownTarget(events, profile.estimated_wedding_date),
    [events, profile.estimated_wedding_date]
  )

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

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

  const stepLightbox = useCallback(
    (direction: number) => {
      setLightbox((current) => {
        if (current === null) return null
        return (current + direction + gallery.length) % gallery.length
      })
    },
    [gallery.length]
  )

  const copyText = useCallback(
    async (value: string, message: string) => {
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  // Cover reveal on load (the reference animates the gate without a scroll
  // trigger). One rAF so the initial opacity:0 frame is painted first.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const frame = window.requestAnimationFrame(() => {
      root.querySelectorAll<HTMLElement>("[data-cn-load]").forEach((el) => el.classList.add("is-in"))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  // One observer for every scroll reveal.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-cn-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-in"))
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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [stories.length, rundown.length, honored.length, gallery.length, accounts.length, events.length, giftOpen])

  useEffect(() => {
    const locked = !opened
    document.body.classList.toggle("cn-locked", locked)
    return () => document.body.classList.remove("cn-locked")
  }, [opened])

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

  const albumCover = stories.find((story) => story.image_url)?.image_url || heroStill
  const eventCover = heroStill || gallery[0] || baseStill

  return (
    <div ref={rootRef} className={`cn-root${opened ? " is-open" : ""}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="cn-page">
        {/* 1 — cover gate */}
        <section className={`cn-cover${opened ? " is-open" : ""}`} data-section="sampul" aria-label="Buka undangan">
        {coverStill ? (
          <img className="cn-cover__photo" src={coverStill} alt="" aria-hidden="true" draggable={false} />
        ) : null}
        <span className="cn-vignette cn-vignette--top" aria-hidden="true" />
        <span className="cn-vignette cn-vignette--bottom" aria-hidden="true" />

        <div className="cn-cover__body">
          <p className="cn-kicker cn-kicker--cream" {...ON_LOAD("fade")}>
            {coverKicker}
          </p>
          <span className="cn-cover__seal" {...ON_LOAD("fade", 0.08)}>
            <Seal initials={initials} size="sm" />
          </span>
          <h1 className="cn-names" {...ON_LOAD("up", 0.12)}>
            {groomName || (lang === "en" ? "Groom" : "Mempelai Pria")}
            {brideName && (
              <>
                <br />
                &amp; {brideName}
              </>
            )}
          </h1>
          <span className="cn-rule cn-rule--short" {...ON_LOAD("fade", 0.2)} />
          {dateDotted && (
            <p className="cn-date" {...ON_LOAD("fade", 0.24)}>
              {dateDotted}
            </p>
          )}
          <p className="cn-dear" {...ON_LOAD("fade", 0.28)}>
            Dear
          </p>
          <p className="cn-guest" {...ON_LOAD("fade", 0.3)}>
            {guestName}
          </p>
          <button type="button" className="cn-open" onClick={openInvitation} {...ON_LOAD("up", 0.36)}>
            {openLabel}
          </button>
          {apology && (
            <p className="cn-apology" {...ON_LOAD("fade", 0.42)}>
              {apology}
            </p>
          )}
        </div>
      </section>

      <main className="cn-main">
        {/* 2 — opening film: autoplay when allowed, cover photo otherwise */}
        {hasOpeningMedia && (
        <section className="cn-opening-film" data-section="video-pembuka" aria-label="Video pembuka">
          {openingFilm ? (
            <video
              src={openingFilm}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroStill}
              onPlaying={() => setOpeningStarted(true)}
            />
          ) : hasVideo && youtubeId ? (
            openingFallback ? (
              <iframe
                className="cn-opening-film__iframe"
                src={openingEmbedUrl}
                title={videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="cn-opening-film__embed">
                <AutoplayYouTube
                  videoId={youtubeId}
                  title={videoTitle}
                  autoplay
                  onPlay={() => setOpeningStarted(true)}
                />
              </div>
            )
          ) : null}
          {coverStill && (!openingStarted || !hasVideo) && (
            <img className="cn-opening-film__poster" src={coverStill} alt="" aria-hidden="true" />
          )}
          {hasVideo && !openingStarted && (
            <button
              type="button"
              className="cn-play"
              onClick={() => {
                setOpeningFallback(true)
                setOpeningStarted(true)
              }}
              aria-label="Putar video pembuka"
            />
          )}
        </section>
        )}

        {/* 3 — welcome / hero */}
        <section className="cn-hero" data-section="welcome" aria-label="Undangan pernikahan">
          {heroStill ? (
            <img className="cn-hero__photo" src={heroStill} alt="" aria-hidden="true" draggable={false} />
          ) : null}
          <span className="cn-vignette cn-vignette--hero-top" aria-hidden="true" />
          <span className="cn-vignette cn-vignette--hero-bottom" aria-hidden="true" />

          <div className="cn-hero__body">
            <span className="cn-hero__seal" {...IN("fade")}>
              <Seal initials={initials} size="md" />
            </span>
            <h2 className="cn-names cn-names--hero" {...IN("up", 0.06)}>
              {groomName || (lang === "en" ? "Groom" : "Mempelai Pria")}
              {brideName && (
                <>
                  <br />
                  &amp; {brideName}
                </>
              )}
            </h2>
            {welcomeLine && (
              <p className="cn-hero__line" {...IN("fade", 0.12)}>
                {welcomeLine}
              </p>
            )}
            <span className="cn-rule cn-rule--wide" {...IN("fade", 0.16)} />
            {(target || dateDotted) && (
              <div className="cn-hero__foot" {...IN("up", 0.2)}>
                {target && <Clock target={target} />}
                {target && dateDotted && <span className="cn-hero__divider" aria-hidden="true" />}
                {dateDotted && (
                  <div className="cn-hero__save">
                    <p className="cn-hero__saveTitle">
                      <SplitAccent text={saveLabel} />
                    </p>
                    <p className="cn-hero__saveDate">{dateDotted}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 4 — kalimat pembuka */}
        <section className="cn-section cn-ink" data-section="pembuka" aria-label="Salam hangat">
          <div className="cn-medallion cn-medallion--quote" {...IN("zoom")}>
            <span className="cn-ring" aria-hidden="true" />
            <span className="cn-glyph cn-glyph--xi" aria-hidden="true" />
            <span className="cn-glyph cn-glyph--blossom" aria-hidden="true" />
          </div>
          <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up", 0.06)}>
            {openingKicker}
          </p>
          <h2 className="cn-title cn-center" {...IN("up", 0.1)}>
            {openingTitle}
          </h2>
          <p className="cn-body cn-center" {...IN("fade", 0.16)}>
            {openingDescription}
          </p>
          {quoteText && (
            <blockquote className="cn-quote" {...IN("fade", 0.24)}>
              <p>{quoteText}</p>
              {profile.quote_source && <cite>{profile.quote_source}</cite>}
            </blockquote>
          )}
        </section>

        {/* 5 — mempelai */}
        <section className="cn-section cn-people" data-section="mempelai" aria-label="Mempelai">
          {[
            { key: "bride", name: profile.bride_full_name || brideName, short: brideName, photo: brideShot, parents: profile.bride_parents, ig: brideIg, mask: "bride", role: mempelaiKicker },
            { key: "groom", name: profile.groom_full_name || groomName, short: groomName, photo: groomShot, parents: profile.groom_parents, ig: groomIg, mask: "groom", role: mempelaiKicker },
          ]
            .filter((person) => !!person.name)
            .map((person, index) => (
              <article className={`cn-person cn-person--${person.key}`} key={person.key}>
                <div className="cn-person__art" {...IN("fade")}>
                  <span className={`cn-person__hanzi cn-person__hanzi--${person.mask}`} aria-hidden="true" />
                  <span className="cn-person__ring" aria-hidden="true" />
                  {person.photo ? (
                    <img className="cn-person__photo" src={person.photo} alt={person.name} draggable={false} />
                  ) : (
                    <span className="cn-person__photo cn-person__photo--empty" aria-hidden="true" />
                  )}
                  <span className="cn-person__frame" aria-hidden="true" />
                  <p className="cn-person__role" aria-hidden="true">
                    {person.role}
                  </p>
                </div>
                <div className="cn-person__copy">
                  <h3 className="cn-person__name" {...IN("up", 0.06 + index * 0.04)}>
                    {person.name}
                  </h3>
                  {person.parents && (
                    <>
                      <p className="cn-person__label" {...IN("up", 0.12 + index * 0.04)}>
                        {parentsLabel}
                      </p>
                      <p className="cn-person__parents" {...IN("fade", 0.16 + index * 0.04)}>
                        {person.parents}
                      </p>
                    </>
                  )}
                  {person.ig && (
                    <a
                      className="cn-person__ig"
                      href={`https://instagram.com/${person.ig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...IN("up", 0.2 + index * 0.04)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.2 3.2 0 0 0-.7-1.2 3.2 3.2 0 0 0-1.2-.7c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                      </svg>
                      <span>@{person.ig}</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
        </section>

        {/* 6 — love story */}
        {stories.length > 0 && (
          <section className="cn-section cn-story" data-section="story" aria-label="Kisah kami">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {storyKicker}
            </p>
            <h2 className="cn-title cn-title--lg cn-center" {...IN("up", 0.06)}>
              <em>{storyTitle}</em>
            </h2>
            {storyIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.1)}>
                {storyIntro}
              </p>
            )}
            <div className="cn-medallion cn-medallion--story" {...IN("zoom", 0.1)}>
              <span className="cn-ring" aria-hidden="true" />
              {albumCover ? <img src={albumCover} alt="" aria-hidden="true" /> : null}
              <span className="cn-glyph cn-glyph--cloud" aria-hidden="true" />
            </div>
            <div className="cn-story__list">
              {stories.map((story, index) => (
                <article className="cn-story__item" key={`${story.title || "story"}-${index}`}>
                  {story.image_url && (
                    <div className="cn-story__photo" {...IN("fade")}>
                      <img src={story.image_url} alt={story.title || ""} draggable={false} />
                    </div>
                  )}
                  {story.title && (
                    <h3 className="cn-story__title" {...IN("up", 0.08)}>
                      {story.title}
                    </h3>
                  )}
                  {story.description && (
                    <p className="cn-story__body" {...IN("fade", 0.14)}>
                      {story.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7 — event */}
        {events.length > 0 && (
          <section className="cn-section cn-events" data-section="acara" aria-label="Jadwal acara">
            <span className="cn-lantern cn-lantern--a" aria-hidden="true" {...IN("down")} />
            <span className="cn-lantern cn-lantern--b" aria-hidden="true" {...IN("down", 0.08)} />
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {eventsKicker}
            </p>
            <AccentTitle text={eventsTitle} className="cn-title cn-center" />
            {eventsIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.1)}>
                {eventsIntro}
              </p>
            )}
            <div className="cn-medallion cn-medallion--event" {...IN("zoom", 0.08)}>
              <span className="cn-ring" aria-hidden="true" />
              {eventCover ? <img src={eventCover} alt="" aria-hidden="true" /> : null}
            </div>
            <div className="cn-events__list">
              {events.map((event, index) => (
                <article className="cn-event" key={`${event.name || "event"}-${index}`}>
                  {event.name && (
                    <h3 className="cn-event__name" {...IN("up")}>
                      {event.name}
                    </h3>
                  )}
                  <span className="cn-rule cn-rule--dot" aria-hidden="true" />
                  {event.date && (
                    <p className="cn-event__date" {...IN("fade")}>
                      {formatLongDate(event.date)}
                    </p>
                  )}
                  {event.time && (
                    <p className="cn-event__time" {...IN("fade")}>
                      {event.time}
                    </p>
                  )}
                  {event.venue && (
                    <p className="cn-event__venue" {...IN("up")}>
                      {event.venue}
                    </p>
                  )}
                  {event.address && (
                    <p className="cn-event__address" {...IN("fade")}>
                      {event.address}
                    </p>
                  )}
                  {event.maps_url && (
                    <a
                      className="cn-btn cn-btn--outline"
                      href={event.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...IN("up")}
                    >
                      {mapsLabel}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 9 — turut mengundang */}
        {honored.length > 0 && (
          <section className="cn-section cn-inviting" data-section="inviting" aria-label="Turut mengundang">
            <span className="cn-fret" aria-hidden="true" {...IN("fade")} />
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {invitingKicker}
            </p>
            <h2 className="cn-title cn-center" {...IN("up", 0.06)}>
              {invitingTitle}
            </h2>
            {invitingIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.12)}>
                {invitingIntro}
              </p>
            )}
            <ul className="cn-family">
              {honored.map((family, index) => (
                <li key={`${family}-${index}`} {...IN("fade", Math.min(0.06 * index, 0.3))}>
                  {family}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 10 — rundown */}
        {rundown.length > 0 && (
          <section className="cn-section cn-rundown" data-section="rundown" aria-label="Rundown acara">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {rundownKicker}
            </p>
            <h2 className="cn-title cn-center" {...IN("up", 0.06)}>
              {rundownTitle}
            </h2>
            {rundownIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.1)}>
                {rundownIntro}
              </p>
            )}
            <ol className="cn-timeline">
              {rundown.map((item, index) => (
                <li className="cn-timeline__row" key={`${item.time || "r"}-${index}`} {...IN("up", Math.min(0.05 * index, 0.3))}>
                  {item.time && <span className="cn-timeline__time">{item.time}</span>}
                  <span className="cn-timeline__dot" aria-hidden="true" />
                  {item.description && <span className="cn-timeline__text">{item.description}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 11 — gallery */}
        {gallery.length > 0 && (
          <section className="cn-section cn-gallery" data-section="galeri" aria-label="Galeri foto">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {galleryKicker}
            </p>
            <h2 className="cn-title cn-title--lg cn-center" {...IN("up", 0.06)}>
              <em>{galleryTitle}</em>
            </h2>
            {galleryIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.12)}>
                {galleryIntro}
              </p>
            )}
            <span className="cn-fret" aria-hidden="true" {...IN("fade", 0.16)} />
            <div className="cn-gallery__grid">
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className={`cn-gallery__item${gallery.length === 1 ? " is-single" : ""}`}
                  key={`${photo}-${index}`}
                  onClick={() => setLightbox(index)}
                  aria-label={`Foto ${index + 1}`}
                >
                  <img src={photo} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 12 — film, playing inline */}
        {hasVideo && film && (
          <section className="cn-section cn-film" data-section="video" aria-label="Film pernikahan">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {videoKicker}
            </p>
            <AccentTitle text={videoTitle} className="cn-title cn-center" />
            {videoIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.1)}>
                {videoIntro}
              </p>
            )}
            <div className="cn-film__inline" {...IN("up", 0.12)}>
              <div className="cn-film__media">
                {film.kind === "file" ? (
                  <video
                    src={film.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                    poster={eventCover}
                    onPlaying={() => setFilmStarted(true)}
                  />
                ) : youtubeId ? (
                  filmFallback ? (
                    <iframe
                      className="cn-film__iframe"
                      src={filmEmbedUrl}
                      title={videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <AutoplayYouTube
                      videoId={youtubeId}
                      title={videoTitle}
                      controls
                      autoplay
                      onPlay={() => setFilmStarted(true)}
                    />
                  )
                ) : (
                  <iframe
                    src={film.src}
                    title={videoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              {eventCover && !filmStarted && (
                <img className="cn-film__poster" src={eventCover} alt="" aria-hidden="true" />
              )}
              {!filmStarted && (
                <button
                  type="button"
                  className="cn-play"
                  onClick={() => {
                    setFilmFallback(true)
                    setFilmStarted(true)
                  }}
                  aria-label="Putar film"
                />
              )}
            </div>
          </section>
        )}

        {/* 13 — gift. The reference prints the copy on the white card, on paper. */}
        {hasGift && (
          <section className="cn-section cn-gift" data-section="gift" aria-label="Tanda kasih">
            <div className="cn-envelope" {...IN("fade")}>
              <img className="cn-envelope__branch" src={ART("envelope-seal")} alt="" aria-hidden="true" />
              <img className="cn-envelope__red" src={ART("envelope-back")} alt="" aria-hidden="true" />
              <div className="cn-envelope__card">
                <img src={ART("envelope-card")} alt="" aria-hidden="true" />
                <div className="cn-envelope__copy">
                  <p className="cn-envelope__kicker">{giftKicker}</p>
                  <p className="cn-envelope__title">
                    <SplitAccent text={giftTitle} />
                  </p>
                  <span className="cn-glyph cn-glyph--cloud cn-envelope__cloud" aria-hidden="true" />
                </div>
              </div>
            </div>

            {giftIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.12)}>
                {giftIntro}
              </p>
            )}

            <button
              type="button"
              className="cn-btn cn-btn--solid cn-gift__btn"
              onClick={() => setGiftOpen((open) => !open)}
              aria-expanded={giftOpen}
              {...IN("up", 0.18)}
            >
              {giftButton}
            </button>

            {giftOpen && (
              <div className="cn-gift__details">
                {accounts.length > 0 && (
                  <div className="cn-accounts">
                    {accounts.map((account, index) => (
                      <button
                        type="button"
                        className="cn-account"
                        key={`${account.account_number || "acc"}-${index}`}
                        onClick={() => copyText(account.account_number || "", accountToast)}
                        {...IN("up", Math.min(0.06 * index, 0.24))}
                      >
                        {account.provider_name && <span className="cn-account__bank">{account.provider_name}</span>}
                        {account.account_number && <span className="cn-account__number">{account.account_number}</span>}
                        {account.account_name && <span className="cn-account__name">{account.account_name}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {giftAddress && (
                  <div className="cn-address" {...IN("up", 0.1)}>
                    {profile.gift_address_name && <p className="cn-address__name">{profile.gift_address_name}</p>}
                    <p className="cn-address__text">{giftAddress}</p>
                    <button
                      type="button"
                      className="cn-btn cn-btn--outline"
                      onClick={() => copyText(giftAddress, addressToast)}
                    >
                      {copyAddressLabel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 14 — dress code */}
        {hasDresscode && (
          <section className="cn-section cn-dress" data-section="dresscode" aria-label="Dress code">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {dressKicker}
            </p>
            {dressTitle && <AccentTitle text={dressTitle} className="cn-title cn-title--md cn-center" />}
            {dressIntro && (
              <p className="cn-body cn-center" {...IN("fade", 0.1)}>
                {dressIntro}
              </p>
            )}
            {dressColors.length > 0 && (
              <ul className="cn-swatches">
                {dressColors.map((color, index) => (
                  <li className="cn-swatch" key={`${color.hex || color.name}-${index}`} {...IN("up", Math.min(0.06 * index, 0.24))}>
                    <span className="cn-swatch__dot" style={{ background: color.hex || "transparent" }} aria-hidden="true" />
                    {color.name && <span className="cn-swatch__name">{color.name}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 15 — wishes */}
        <section className="cn-section cn-ink cn-wishes" data-section="wishes" aria-label="Ucapan dan doa">
          <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
            {wishesKicker}
          </p>
          <h2 className="cn-title cn-title--lg cn-center" {...IN("up", 0.06)}>
            <em>{wishesTitle}</em>
          </h2>
          {wishesIntro && (
            <p className="cn-body cn-center" {...IN("fade", 0.12)}>
              {wishesIntro}
            </p>
          )}
          <div className="cn-wishes__body" {...IN("up", 0.18)}>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel}
              copy={wishCopy} language={profile.language}
            />
          </div>
        </section>

        {/* 16 — closing */}
        <section className="cn-closing" data-section="closing" aria-label="Penutup">
          {closingStill ? (
            <img className="cn-closing__photo" src={closingStill} alt="" aria-hidden="true" draggable={false} />
          ) : null}
          <span className="cn-vignette cn-vignette--closing-top" aria-hidden="true" />
          <span className="cn-vignette cn-vignette--closing-bottom" aria-hidden="true" />
          <span className="cn-closing__seal" {...IN("fade")}>
            <Seal initials={initials} size="md" />
          </span>
          <div className="cn-closing__body">
            <p className="cn-kicker cn-kicker--gold cn-center" {...IN("up")}>
              {closingKicker}
            </p>
            <p className="cn-body cn-center" {...IN("fade", 0.1)}>
              {closingMessage}
            </p>
            <p className="cn-names cn-names--closing" {...IN("up", 0.16)}>
              {coupleLabel}
            </p>
            {dateDotted && (
              <p className="cn-date cn-center" {...IN("fade", 0.22)}>
                {dateDotted}
              </p>
            )}
          </div>
          <span className="cn-glyph cn-glyph--cloud cn-closing__cloud" aria-hidden="true" {...IN("fade", 0.24)} />
        </section>

        <footer className="cn-footer">
          <a
            className="cn-footer__link"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Aksaraa Wedding via WhatsApp"
          >
            <span className="cn-footer__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
            </span>
            <span className="cn-footer__cta">Wedding by Aksaraa</span>
          </a>
          <p className="cn-footer__text">
            © {new Date().getFullYear()} {coupleLabel}. All rights reserved.
          </p>
        </footer>
        </main>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className={`cn-music${playing ? " is-on" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? (lang === "en" ? "Pause music" : "Jeda musik") : (lang === "en" ? "Play music" : "Putar musik")}
          aria-pressed={playing}
        >
          <span className="cn-music__bar" aria-hidden="true" />
          <span className="cn-music__bar" aria-hidden="true" />
          <span className="cn-music__bar" aria-hidden="true" />
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div
          className="cn-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("photoViewer", lang)}
          onClick={() => setLightbox(null)}
        >
          <button type="button" className="cn-lightbox__close" aria-label={t("closeViewer", lang)} onClick={() => setLightbox(null)}>
            ×
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="cn-lightbox__nav cn-lightbox__nav--prev"
              aria-label={t("previousPhoto", lang)}
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
              className="cn-lightbox__nav cn-lightbox__nav--next"
              aria-label={t("nextPhoto", lang)}
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
          <span className="cn-lightbox__count" aria-hidden="true">
            {lightbox + 1} / {gallery.length}
          </span>
        </div>
      )}

      {toast && (
        <div className="cn-toast" role="status">
          {toast}
        </div>
      )}

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
          language={profile.language}
          anchor="center"
        />
      )}
    </div>
  )
}
