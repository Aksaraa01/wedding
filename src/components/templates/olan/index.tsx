"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { copyPlainText } from "@/lib/clipboard"
import { resolveCoupleName } from "@/lib/coupleName"
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
import { OLAN } from "./assets"
import "./olan.css"
import "./olan-extra.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const GUEST_FALLBACK_ID = "Tamu Undangan"
const GUEST_FALLBACK_EN = "Guest"
const DRESSCODE_DEFAULT_INTRO = "Elegant attire in warm earth tones — please reserve white for the couple."

const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const ID_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return "th"
  return n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"
}

// EN: "January 04th, 2025" (reference). ID: "04 Januari 2025" (no ordinal).
function longDate(value?: string | null, lang: "id" | "en" = "id"): { day: string; month: string; year: string; ord: string } | null {
  const d = parseDate(value)
  if (!d) return null
  const isEn = lang === "en"
  return {
    day: pad2(d.getDate()),
    month: (isEn ? EN_MONTHS : ID_MONTHS)[d.getMonth()],
    year: String(d.getFullYear()),
    ord: isEn ? ordinal(d.getDate()) : "",
  }
}

function shortDate(value?: string | null, lang: "id" | "en" = "id"): { day: string; month: string; year: string; ord: string; weekday: string } | null {
  const d = parseDate(value)
  if (!d) return null
  const isEn = lang === "en"
  return {
    day: pad2(d.getDate()),
    month: (isEn ? EN_MONTHS_SHORT : ID_MONTHS_SHORT)[d.getMonth()],
    year: String(d.getFullYear()),
    ord: isEn ? ordinal(d.getDate()) : "",
    weekday: (isEn ? EN_DAYS : ID_DAYS)[d.getDay()],
  }
}

// "09:00 - 10:00" or a single time: keep whatever the couple typed.
function timeLabel(value?: string) {
  return (value || "").trim()
}

function youtubeId(url?: string | null): string {
  const raw = (url || "").trim()
  if (!raw) return ""
  const short = raw.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  if (short) return short[1]
  const v = raw.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (v) return v[1]
  const embed = raw.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)
  if (embed) return embed[1]
  return ""
}

type SessionEntry = NonNullable<TemplateProps["sessions"]>[number]

export default function Olan(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const gates = profile.feature_gates || {}
  const content = profile.template_content || {}

  const groomShort = (profile.groom_name || "").trim()
  const brideShort = (profile.bride_name || "").trim()
  const coupleShort = [groomShort, brideShort].filter(Boolean).join(" & ") || resolveCoupleName(profile) || (lang === "en" ? "The Couple" : "Mempelai")
  const coupleFull = resolveCoupleName(profile) || coupleShort
  const groomName = (profile.groom_full_name || groomShort).trim()
  const brideName = (profile.bride_full_name || brideShort).trim()
  const guestName = (profile.guest_name || "").trim()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const paneRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoLive, setVideoLive] = useState<VideoSource | null>(null)
  const [toast, setToast] = useState("")
  const [now, setNow] = useState<number | null>(null)
  const [giftIndex, setGiftIndex] = useState(0)
  const [giftOpen, setGiftOpen] = useState(false)
  const [gatePlaying, setGatePlaying] = useState(false)
  const [gateMounted, setGateMounted] = useState(true)
  const toastTimer = useRef<number | null>(null)

  const cover = coverPhoto(profile)
  const coverSlots = flattenPhotos(profile.cover_photos)
  // Second cover slot ("Penutup"): the framed portrait the closing shows.
  const closingPhoto = coverSlots[1] || ""
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const gallery = flattenPhotos(profile.gallery_photos)
  const sessions: SessionEntry[] = (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue))
  const stories = gates.story !== false && profile.story_visible !== false ? (profile.stories || []).filter((s) => s && (s.title || s.description)) : []
  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).map((s) => String(s)).filter(Boolean)
      : []
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter((a) => a && (a.provider_name || a.account_number)) : []
  const selectedAccount = accounts[Math.min(giftIndex, Math.max(0, accounts.length - 1))]
  const giftAddressName = (profile.gift_address_name || "").trim()
  const giftAddress = gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  // The editor's DRESS CODE card only writes `colors`; the heading and intro are
  // EKSTRA fields (dresscode_title / dresscode_intro), so a couple without a
  // legacy `dresscode.title` still gets editable copy.
  const dresscodeOn = profile.dresscode_visible !== false
  const dresscode = dresscodeOn ? profile.dresscode : undefined
  const dresscodeColors = (dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const dresscodeTitle = content.dresscode_title || dresscode?.title || t("secDresscode", lang)
  // Couples who only pick colours get the template's house line instead of a
  // bare swatch row; EKSTRA's "Pengantar Dress Code" replaces it.
  const dresscodeIntro =
    content.dresscode_intro || dresscode?.description || (dresscodeColors.length > 0 ? DRESSCODE_DEFAULT_INTRO : "")
  const hasDresscode = dresscodeOn && (dresscodeColors.length > 0 || !!dresscodeIntro)
  const livestream = profile.livestream_visible !== false ? profile.livestream : undefined
  const livestreamUrl = (livestream?.url || "").trim()

  const video = videoSource(profile.video_url)
  const hasVideo = !!video && gates.video !== false && profile.video_section_visible !== false
  // The gate (the "Open Invitation" page) plays the couple's film behind the
  // names; with no film it stays the painted cover. "Our Footage" keeps the
  // watch-with-sound copy of the same clip.
  const gateFilm = gates.video !== false && profile.video_section_visible !== false ? videoSource(profile.video_url) : null

  const date = longDate(profile.estimated_wedding_date || sessions[0]?.date, lang)
  const target = useMemo(() => countdownTarget(sessions, profile.estimated_wedding_date), [sessions, profile.estimated_wedding_date])
  const calendar = gcalLink(sessions[0], groomName, brideName)

  const trackUrl = profile.track_url || (profile.template_demo ? "" : "")

  // ── copy / toast ────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  const copyValue = useCallback(
    async (value: string, message: string) => {
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  // ── music ───────────────────────────────────────────────────────────────
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

  const openInvitation = useCallback(() => {
    setOpened(true)
    playMusic()
    const pane = rootRef.current
    if (pane) pane.scrollTo({ top: 0 })
    const scroller = paneRef.current
    if (scroller) scroller.scrollTop = 0
  }, [playMusic])

  // Desktop has no splash (reference behaviour): the split pane is the cover.
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 961px)")
    const sync = () => {
      if (mq.matches) setOpened(true)
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Desktop starts the track on the first interaction (there is no gate).
  useEffect(() => {
    if (!opened || typeof window === "undefined") return
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    const kick = () => {
      playMusic()
      window.removeEventListener("pointerdown", kick)
      window.removeEventListener("keydown", kick)
    }
    window.addEventListener("pointerdown", kick, { once: true })
    window.addEventListener("keydown", kick, { once: true })
    return () => {
      window.removeEventListener("pointerdown", kick)
      window.removeEventListener("keydown", kick)
    }
  }, [opened, playMusic])

  useEffect(() => {
    setGatePlaying(false)
    if (!opened) {
      setGateMounted(true)
      return
    }
    // the gate slides up over 1.8s; drop the film (and its player) afterwards
    const timer = window.setTimeout(() => setGateMounted(false), 1900)
    return () => window.clearTimeout(timer)
  }, [opened])

  // ── countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!target) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  const countdown = useMemo(() => {
    if (!target) return null
    const diff = Math.max(0, target.getTime() - (now ?? target.getTime()))
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [target, now])

  // ── reveal (the reference drives AOS; same mechanism, one observer) ──────
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-aos]"))
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    for (const el of els) {
      const dur = el.dataset.aosDuration
      const delay = el.dataset.aosDelay
      if (dur) el.style.transitionDuration = `${dur}ms`
      if (delay) el.style.transitionDelay = `${delay}ms`
    }
    if (reduce) {
      for (const el of els) el.classList.add("aos-animate")
      return
    }
    for (const el of els) {
      if (el.closest(".top-cover")) el.classList.add("aos-animate")
    }
    const observe = els.filter((el) => !el.classList.contains("aos-animate"))
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("aos-animate")
          io.unobserve(entry.target)
        }
      },
      {
        // AOS (the reference) triggers on the vertical band only, so an ornament
        // whose reveal transform parks it outside the left/right edge still
        // animates. A plain 2D IntersectionObserver would leave it at opacity 0
        // (that is exactly what hid the event card's left branch).
        rootMargin: "0px 100% 160px 100%",
        threshold: 0.01,
      }
    )
    for (const el of observe) io.observe(el)
    return () => io.disconnect()
  }, [])

  // ── keyboard: lightbox + film ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) {
        if (e.key === "Escape") setLightbox(null)
        if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
        if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
      } else if (videoLive) {
        if (e.key === "Escape") setVideoLive(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, videoLive, gallery.length])

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    !videoLive &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const closeVideo = useCallback(() => setVideoLive(null), [])
  const closeLightbox = useCallback(() => setLightbox(null), [])


  return (
    <div
      ref={rootRef}
      className={`olan-root${opened ? " is-open" : " is-locked"}${playing ? " is-playing" : ""}`}
    >
      {/* ───────── left / fixed poster pane (desktop) ───────── */}
      <section className="kat-page__side-to-side" ref={paneRef}>
        <section className="primary-pane">
          <div className="inner">
            <div className="bg-tc" />
            <div className="details">
              <h1>{coupleShort}</h1>
              <p>
                {content.cover_guest_label || (lang === "en" ? "Dear" : "Kepada Yth.")}
                <br />
                {guestName || (lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID)}
              </p>
            </div>
          </div>
        </section>

        <section className="secondary-pane">
          {/* ───── cover ───── */}
          <section className="cover-outer">
            <section className="cover">
              <div className="bg-cover" data-aos="zoom-out" data-aos-duration="500" />
              <div className="inner">
                <div className="head" data-aos="fade-down" data-aos-duration="1000">
                  <p data-aos="fade-down" data-aos-duration="3000" data-aos-delay="1000">
                    {content.cover_kicker || t("weddingInvitation", lang)}
                  </p>
                  <h1 data-aos="zoom-in" data-aos-duration="3200" data-aos-delay="1200">
                    {coupleShort}
                  </h1>
                  {date ? (
                    <p className="date" data-aos="fade-up" data-aos-duration="3000" data-aos-delay="1000">
                      {date.month} {date.day}{date.ord ? <sup>{date.ord}</sup> : null}, {date.year}
                    </p>
                  ) : null}
                </div>

                <div className="ornaments-wrapper">
                  <div className="orn-cover-top-wrap">
                    <div className="orn-cover-top-1">
                      <div className="image-wrap" data-aos="fade-down-right" data-aos-duration="3000" data-aos-delay="1900">
                        <img src={OLAN.branch} alt="" />
                      </div>
                    </div>
                    <div className="orn-cover-top-2">
                      <div className="image-wrap" data-aos="zoom-in" data-aos-duration="3000" data-aos-delay="2000">
                        <img src={OLAN.cloudWide} alt="" />
                      </div>
                    </div>
                    <div className="orn-cover-top-3">
                      <div className="image-wrap" data-aos="zoom-in" data-aos-duration="3000" data-aos-delay="2000">
                        <img src={OLAN.cloudSmall} alt="" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="body highlight" data-aos="zoom-out" data-aos-duration="3500" data-aos-delay="700">
                  <div className="cover-frame">
                    <div className="preview-container cover-show">
                      <div className="picture" style={{ backgroundImage: `url("${cover}")` }} />
                    </div>
                  </div>
                </div>

                <div className="ornaments-wrapper">
                  <div className="orn-cover-bottom-wrap">
                    {OLAN.flowers.map((src, i) => (
                      <div className={`orn-cover-bottom-event-${i + 1}`} key={src}>
                        {/* scroll-reveal can never fire here: the section clips
                            its own overflow, and three of these seven pieces
                            bleed past that edge. A CSS entrance runs on its own. */}
                        <div className="image-wrap olan-orn-in" style={{ animationDelay: `${i * 90}ms` }}>
                          <img src={src} alt="" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </section>

          {/* ───── welcome + couple ───── */}
          <section className="couple-wrap">
            <div className="couple">
              <div className="couple-head">
                <h1 className="couple-title" data-aos="zoom-in" data-aos-duration="1000">
                  {profile.opening_title || t("theWeddingOf", lang)}
                </h1>
                {profile.opening_description ? (
                  <p className="couple-description" data-aos="fade-up" data-aos-duration="1000">
                    {profile.opening_description}
                  </p>
                ) : null}
              </div>

              <div className="couple-body bride-first">
                <div className="couple-info groom previewed">
                  <div className="couple-preview">
                    <div className="couple-frame">
                      <div className="couple-picture-wrap">
                        <div className="couple-picture" data-aos="zoom-out" data-aos-duration="1500" data-aos-delay="500">
                          <div className="img-wrap">
                            <img className="img" src={groomPhoto} alt={groomName} />
                          </div>
                        </div>
                      </div>
                      <div className="decor-frame">
                        <div className="image-wrap" data-aos="zoom-out" data-aos-duration="1000">
                          <img src={OLAN.portraitFrame} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-1">
                        <div className="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="300">
                          <img src={OLAN.wreaths[0]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-2">
                        <div className="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="550">
                          <img src={OLAN.wreaths[1]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-3">
                        <div className="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="650">
                          <img src={OLAN.wreaths[2]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-4">
                        <div className="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="750">
                          <img src={OLAN.wreaths[3]} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="couple-details">
                    <h2 className="couple-name" data-aos="fade-up" data-aos-duration="1000">
                      {groomName}
                    </h2>
                    {profile.groom_parents ? (
                      <p className="couple-parents" data-aos="fade-up" data-aos-duration="1000">
                        {profile.groom_parents}
                      </p>
                    ) : null}
                    {profile.groom_instagram ? (
                      <div className="couple-link-wrap">
                        <a
                          className="couple-link"
                          href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="nofollow noreferrer noopener"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                          </svg>
                          @{profile.groom_instagram.replace(/^@/, "")}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="separator-wrap previewed">
                  <div className="separator">
                    <h2 className="couple-separator" data-aos="zoom-in" data-aos-duration="1000">
                      &amp;
                    </h2>
                  </div>
                </div>

                <div className="couple-info bride previewed">
                  <div className="couple-preview">
                    <div className="couple-frame">
                      <div className="couple-picture-wrap">
                        <div className="couple-picture" data-aos="zoom-out" data-aos-duration="1500" data-aos-delay="500">
                          <div className="img-wrap">
                            <img className="img" src={bridePhoto} alt={brideName} />
                          </div>
                        </div>
                      </div>
                      <div className="decor-frame">
                        <div className="image-wrap" data-aos="zoom-out" data-aos-duration="1000">
                          <img src={OLAN.portraitFrame} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-1">
                        <div className="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="300">
                          <img src={OLAN.wreaths[0]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-2">
                        <div className="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="550">
                          <img src={OLAN.wreaths[1]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-3">
                        <div className="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="650">
                          <img src={OLAN.wreaths[2]} alt="" />
                        </div>
                      </div>
                      <div className="orn-couple-4">
                        <div className="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="750">
                          <img src={OLAN.wreaths[3]} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="couple-details">
                    <h2 className="couple-name" data-aos="fade-up" data-aos-duration="1000">
                      {brideName}
                    </h2>
                    {profile.bride_parents ? (
                      <p className="couple-parents" data-aos="fade-up" data-aos-duration="1000">
                        {profile.bride_parents}
                      </p>
                    ) : null}
                    {profile.bride_instagram ? (
                      <div className="couple-link-wrap">
                        <a
                          className="couple-link"
                          href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="nofollow noreferrer noopener"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                          </svg>
                          @{profile.bride_instagram.replace(/^@/, "")}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ───── gallery ───── */}
          {gallery.length > 0 ? (
            <section className="photo-wrap">
              <div className="photo-inner">
                <div className="photo-head">
                  <h1 className="photo-title" data-aos="fade-up" data-aos-duration="1000">
                    {content.gallery_title || (lang === "en" ? "Portraits of Us" : "Potret Kami")}
                  </h1>
                  {content.gallery_intro ? <p className="photo-description">{content.gallery_intro}</p> : null}
                </div>
                <div className="photo-body">
                  <div className="photo-box">
                    {gallery.map((src, i) => (
                      <a
                        key={`${src}-${i}`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setLightbox(i)
                        }}
                        aria-label={`${content.gallery_title || (lang === "en" ? "Portraits of Us" : "Potret Kami")} ${i + 1}`}
                      >
                        <img src={src} alt="" loading="lazy" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── footage ───── */}
          {hasVideo && video ? (
            <section className="video-gallery autoplay-video-section">
              <div className="inner">
                <div className="title">
                  <h1 data-aos="zoom-out-up" data-aos-duration="1000">
                    {content.video_title || (lang === "en" ? "Our Footage" : "Cuplikan Kami")}
                  </h1>
                  {content.video_caption ? (
                    <p data-aos="fade-up" data-aos-duration="1000">
                      {content.video_caption}
                    </p>
                  ) : null}
                </div>
                <div className="video-outer">
                  <div className="video autoplay-video-box">
                    <div className="preview" data-aos="zoom-in" data-aos-duration="1000">
                      {/* Plays immediately (muted, looped, no controls) so the film
                          is already running when the section scrolls in — the
                          poster only covers the first frames, and the button
                          opens the same clip with sound. */}
                      <div className="olan-footage__media">
                        {video.kind === "file" ? (
                          <video
                            src={video.src}
                            poster={videoPoster(video) || cover}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                          />
                        ) : youtubeId(video.src) ? (
                          <AutoplayYouTube videoId={youtubeId(video.src)} title={content.video_title || (lang === "en" ? "Our Footage" : "Cuplikan Kami")} />
                        ) : (
                          <iframe src={video.src} title={content.video_title || (lang === "en" ? "Our Footage" : "Cuplikan Kami")} allow="autoplay; encrypted-media" />
                        )}
                      </div>
                      <button type="button" className="play-btn" onClick={() => setVideoLive(video)} aria-label={content.video_title || (lang === "en" ? "Our Footage" : "Cuplikan Kami")}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="ornaments-wrapper">
                  <div className="orn-gallery-bottom-right">
                    <div className="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="300">
                      <img src={OLAN.galleryRight} alt="" />
                    </div>
                  </div>
                  <div className="orn-gallery-bottom-left">
                    <div className="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="300">
                      <img src={OLAN.galleryLeft} alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── countdown ───── */}
          {countdown ? (
            <section className="save-date-wrap">
              <div className="save-date">
                <div className="ornaments-wrapper">
                  <div className="bg-preview-wrap">
                    <div className="bg-preview">
                      <div className="image-wrap">
                        <img src={OLAN.countdownPainting} alt="" />
                      </div>
                    </div>
                    <div className="tile">
                      <div className="tile-bottom">
                        <div className="image-wrap">
                          <img src={OLAN.countdown.floor} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bottom-wrap">
                    <div className="bridge">
                      <div className="bridge-bottom">
                        <div className="image-wrap">
                          <img src={OLAN.countdown.bridge} alt="" />
                        </div>
                      </div>
                    </div>
                    <div className="stairs">
                      <div className="stairs-bottom">
                        <div className="image-wrap">
                          <img src={OLAN.countdown.stairs} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="orn-pilar">
                    <div className="roof-top">
                      <div className="image-wrap">
                        <img src={OLAN.countdown.tileTop} alt="" />
                      </div>
                    </div>
                    <div className="pillar-wrap">
                      <div className="pillar left">
                        <div className="image-wrap">
                          <img src={OLAN.countdown.pillar} alt="" />
                        </div>
                      </div>
                      <div className="pillar right">
                        <div className="image-wrap">
                          <img src={OLAN.countdown.pillar} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bunga-upper left">
                    <div className="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="800">
                      <img src={OLAN.countdown.urnFlowers} alt="" />
                    </div>
                  </div>
                  <div className="bunga-upper right">
                    <div className="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="800">
                      <img src={OLAN.countdown.urnFlowers} alt="" />
                    </div>
                  </div>
                  <div className="orn-bunga-kiri">
                    <div className="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="800">
                      <img src={OLAN.countdown.urn} alt="" />
                    </div>
                  </div>
                  <div className="orn-bunga-kanan">
                    <div className="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="800">
                      <img src={OLAN.countdown.urn} alt="" />
                    </div>
                  </div>
                </div>

                <div className="save-date-head">
                  <h1 className="save-date-title" data-aos="zoom-in" data-aos-duration="1000">
                    {content.countdown_title || t("countdown", lang)}
                  </h1>
                </div>
                <div className="save-date-body">
                  <div className="countdown">
                    <div className="count-item" data-aos="fade-down-right" data-aos-duration="1000" data-aos-delay="200">
                      <h2 className="count-num count-day">{countdown.days}</h2>
                      <small className="count-text">{content.countdown_days || t("days", lang)}</small>
                    </div>
                    <div className="count-item" data-aos="fade-down-left" data-aos-duration="1000" data-aos-delay="300">
                      <h2 className="count-num count-hour">{countdown.hours}</h2>
                      <small className="count-text">{content.countdown_hours || t("hours", lang)}</small>
                    </div>
                  </div>
                </div>
                <div className="save-date-body">
                  <div className="countdown">
                    <div className="count-item" data-aos="fade-up-right" data-aos-duration="1000" data-aos-delay="400">
                      <h2 className="count-num count-minute">{countdown.minutes}</h2>
                      <small className="count-text">{content.countdown_minutes || t("minutes", lang)}</small>
                    </div>
                    <div className="count-item" data-aos="fade-up-left" data-aos-duration="1000" data-aos-delay="500">
                      <h2 className="count-num count-second">{countdown.seconds}</h2>
                      <small className="count-text">{content.countdown_seconds || t("seconds", lang)}</small>
                    </div>
                  </div>
                </div>
                {calendar ? (
                  <div className="add-to-calendar-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="500">
                    <a className="add-to-calendar" href={calendar} target="_blank" rel="nofollow noreferrer noopener">
                      {content.calendar_button || t("saveToCalendar", lang)}
                    </a>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* ───── events ───── */}
          {sessions.length > 0 ? (
            <section className="agenda-wrap">
              <div className="agenda-inner">
                <div className="agenda-head">
                  <h2 className="agenda-title" data-aos="zoom-in" data-aos-duration="1500">
                    {content.agenda_title || (lang === "en" ? "Wedding Day" : "Hari Pernikahan")}
                  </h2>
                  {content.events_intro ? (
                    <p className="agenda-description" data-aos="fade-up" data-aos-duration="1200">
                      {content.events_intro}
                    </p>
                  ) : null}
                </div>
                <div className="agenda-body">
                  {sessions.map((session, index) => {
                    const sd = shortDate(session.date, lang)
                    return (
                      <div className="event-item" key={`${session.name || "event"}-${index}`}>
                        {sd ? (
                          <div className="event-head">
                            <h3 className="event-day" data-aos="fade-up" data-aos-duration="1000">
                              {sd.weekday}
                            </h3>
                            <h2 className="event-date" data-aos="fade-up" data-aos-duration="1000">
                              {sd.month} {sd.day}{sd.ord ? <sup>{sd.ord}</sup> : null}, {sd.year}
                            </h2>
                          </div>
                        ) : null}
                        <div className="activity-wrap">
                          <div className="activity-item">
                            <div className="activity-frame">
                              <div className="frame-wrap" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="500">
                                <img src={OLAN.eventFrame} alt="" />
                              </div>
                            </div>
                            <div className="activity-content">
                              <div className="activity-content-inner">
                                <div className="activity-head">
                                  <div data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="800">
                                    {isCeremony(session.name) ? <RingsIcon /> : <WineIcon />}
                                  </div>
                                  <h3 className="activity-title" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="800">
                                    {session.name || content.agenda_title || (lang === "en" ? "Wedding Day" : "Hari Pernikahan")}
                                  </h3>
                                  {timeLabel(session.time) ? (
                                    <p className="activity-time" data-aos="fade-up" data-aos-duration="1000">
                                      {timeLabel(session.time)}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="activity-details">
                                  {session.venue ? (
                                    <p className="activity-hall" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="800">
                                      {session.venue}
                                    </p>
                                  ) : null}
                                  {session.address ? (
                                    <p className="activity-address" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="800">
                                      {session.address}
                                    </p>
                                  ) : null}
                                  {session.maps_url ? (
                                    <div className="activity-link-wrap" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="800">
                                      <a className="activity-link" href={session.maps_url} target="_blank" rel="nofollow noreferrer noopener">
                                        {content.maps_label || t("viewLocation", lang)}
                                      </a>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="ornaments-wrapper">
                              {OLAN.eventOrnaments.map((src, i) => (
                                <div className={`orn-event-frame-${i + 1}`} key={src}>
                                  {/* same reason as the bands: an ornament on
                                      the card edge can sit outside the section
                                      clip, where no observer will ever see it */}
                                  <div className="image-wrap olan-orn-in" style={{ animationDelay: `${300 + i * 90}ms` }}>
                                    <img src={src} alt="" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="ornaments-wrapper">
                  <div className="orn-bottom-wrap">
                    {OLAN.flowers.map((src, i) => (
                      <div className={`orn-bottom-event-${i + 1}`} key={`bottom-${src}`}>
                        <div className="image-wrap olan-orn-in" style={{ animationDelay: `${i * 90}ms` }}>
                          <img src={src} alt="" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── turut mengundang ───── */}
          {honored.length > 0 ? (
            <section className="olan-inviting">
              <h2 className="olan-inviting__title" data-aos="zoom-in" data-aos-duration="1200">
                {content.inviting_title || t("secInviting", lang)}
              </h2>
              <p className="olan-inviting__intro" data-aos="fade-up" data-aos-duration="1000">
                {content.inviting_intro || (lang === "en"
                  ? "We also present the families who extend this invitation alongside us."
                  : "Dengan hormat, kami turut mengundang keluarga besar yang telah mendampingi perjalanan kami.")}
              </p>
              <ul className="olan-inviting__list">
                {honored.map((family, i) => (
                  <li key={`${family}-${i}`} data-aos="fade-up" data-aos-duration="1000" data-aos-delay={i * 60}>
                    {family}
                  </li>
                ))}
              </ul>
              <div className="ornaments-wrapper">
                <div className="orn-bottom-wrap">
                  {OLAN.flowers.map((src, i) => (
                    <div className={`orn-bottom-event-${i + 1}`} key={`inviting-${src}`}>
                      <div className="image-wrap olan-orn-in" style={{ animationDelay: `${i * 90}ms` }}>
                        <img src={src} alt="" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── rundown ───── */}
          {rundown.length > 0 ? (
            <section className="rundown-container">
              <div className="rundown-inner">
                <h3 className="rundown-title">{content.rundown_title || t("rundownTitle", lang)}</h3>
                <div className="rundown-event-list">
                  <div className="rundown-event">
                    {sessions[0]?.name ? <h5 className="rundown-event-title">{sessions[0].name}</h5> : null}
                    <div className="rundown-agenda-list">
                      {rundown.map((item, i) => (
                        <div className="rundown-agenda" key={`${item.time || ""}-${i}`}>
                          <p className="rundown-agenda-time">{item.time || ""}</p>
                          <div className="rundown-divider">
                            <div className="rundown-line" />
                            <div className="rundown-circle" />
                          </div>
                          <div className="rundown-agenda-content">
                            <p className="rundown-agenda-text">{item.description || ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── live streaming ───── */}
          {livestreamUrl ? (
            <section className="live-streaming">
              <div className="streaming-inner">
                <div className="streaming-head">
                  <h2 className="streaming-title" data-aos="zoom-in" data-aos-duration="1200">
                    {livestream?.title || t("secLivestream", lang)}
                  </h2>
                </div>
                <div className="streaming-body">
                  <div className="streaming-content">
                    <div className="streaming-preview-wrap wide youtube">
                      <div className="streaming-preview" data-aos="zoom-in" data-aos-duration="1500">
                        <img src={livestreamPoster(livestreamUrl) || cover} alt="" className="streaming-img" loading="lazy" />
                      </div>
                      <div className="streaming-link-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="600">
                        <a className="streaming-link" href={livestreamUrl} target="_blank" rel="nofollow noreferrer noopener">
                          {livestream?.buttonLabel || t("watchLivestream", lang)}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── love story ───── */}
          {stories.length > 0 ? (
            <section className="love-story-wrap">
              <div className="love-story-inner">
                <div className="ornaments-wrapper">
                  <div className="orn-story-top-left">
                    <div className="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                      <img src={OLAN.storyLeft} alt="" />
                    </div>
                  </div>
                  <div className="orn-story-top-right">
                    <div className="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="300">
                      <img src={OLAN.storyRight} alt="" />
                    </div>
                  </div>
                </div>
                <div className="love-story-head">
                  <h1 className="love-story-title">{content.love_story_title || t("secStory", lang)}</h1>
                </div>
                <div className="love-story-body">
                  <div className="story-chitra__slider-wrap">
                    <div className="story-chitra__slider-for">
                      <div
                        className="olan-story-track"
                        style={{ transform: `translate3d(-${storyIndex * 100}%, 0, 0)` }}
                      >
                        {stories.map((story, index) => (
                          <div
                            className="story-chitra__slider-for__item"
                            key={`story-${index}`}
                            style={
                              {
                                // a story without its own photo keeps the card
                                // legible over the design's painting — never the
                                // couple's cover slot
                                "--story-background": story.image_url
                                  ? `url("${story.image_url}")`
                                  : `url("${OLAN.painting}")`,
                              } as CSSProperties
                            }
                          >
                            <div className="story-chitra__content">
                              <h2 className="story-chitra__title">{story.title || ""}</h2>
                              <p className="story-chitra__caption">{story.description || ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {stories.length > 1 ? (
                      <>
                        <div className="story-chitra__slider-nav">
                          {stories.map((_, i) => (
                            <div
                              className={`story-chitra__slider-nav__item__manual${i === storyIndex ? " is-active" : ""}`}
                              key={`dot-${i}`}
                              role="button"
                              tabIndex={0}
                              aria-label={`Story ${i + 1}`}
                              onClick={() => setStoryIndex(i)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setStoryIndex(i)
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="story-chitra__arrow-btn prev"
                          aria-label={lang === "en" ? "Previous story" : "Cerita sebelumnya"}
                          onClick={() => setStoryIndex((i) => (i - 1 + stories.length) % stories.length)}
                        >
                          <svg viewBox="0 0 108 198" width="26" height="48" fill="none" aria-hidden>
                            <path d="M100 190L8 99L100 8" stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="story-chitra__arrow-btn next"
                          aria-label={lang === "en" ? "Next story" : "Cerita berikutnya"}
                          onClick={() => setStoryIndex((i) => (i + 1) % stories.length)}
                        >
                          <svg viewBox="0 0 108 198" width="26" height="48" fill="none" aria-hidden>
                            <path d="M8 190L100 99L8 8" stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* ───── gift ───── */}
          {accounts.length > 0 || giftAddress ? (
            <div className="section-group top">
              <div className="ornaments-wrapper">
                <div className="orn-top">
                  <div className="image-wrap" data-aos="fade-down-left" data-aos-duration="1200" data-aos-delay="300">
                    <img src={OLAN.giftRight} alt="" />
                  </div>
                </div>
                <div className="orn-bottom-left">
                  <div className="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="300">
                    <img src={OLAN.galleryRight} alt="" />
                  </div>
                </div>
              </div>
              <section className="wedding-gift-wrap">
                <div className="wedding-gift-inner">
                  <div className="wedding-gift-head">
                    <h1 className="wedding-gift-title" data-aos="zoom-in" data-aos-duration="1500">
                      {content.gift_intro_title || t("secGift", lang)}
                    </h1>
                    {content.gift_intro_description ? (
                      <p className="wedding-gift-description" data-aos="fade-up" data-aos-duration="1000">
                        {content.gift_intro_description}
                      </p>
                    ) : null}
                  </div>
                  <div className="wedding-gift-body">
                    <div className="wedding-gift-form">
                      {selectedAccount ? (
                        <div className="olan-bank">
                          {accounts.length > 1 ? (
                            <div className={`olan-bank__picker${giftOpen ? " is-open" : ""}`}>
                              <button
                                type="button"
                                className="olan-bank__select"
                                aria-expanded={giftOpen}
                                onClick={() => setGiftOpen((open) => !open)}
                              >
                                <span>{selectedAccount.provider_name || ""}</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </button>
                              {giftOpen ? (
                                <ul className="olan-bank__list">
                                  {accounts.map((account, index) => (
                                    <li key={`${account.account_number || "acc"}-${index}`}>
                                      <button
                                        type="button"
                                        className={index === giftIndex ? "is-active" : ""}
                                        onClick={() => {
                                          setGiftIndex(index)
                                          setGiftOpen(false)
                                        }}
                                      >
                                        {account.provider_name || ""}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="wedding-gift-bank-wrap">
                            <div className="bank-item show">
                              <div className="bank-detail">
                                <h3 className="bank-name">{selectedAccount.provider_name || ""}</h3>
                                <div>
                                  <small className="bank-account-number-label">{content.gift_account_label || (lang === "en" ? "Account Number" : "Nomor Rekening")}</small>
                                  <h4
                                    className="bank-account-number"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      copyValue(selectedAccount.account_number || "", content.copy_account_toast || t("copiedToClipboard", lang))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ")
                                        copyValue(
                                          selectedAccount.account_number || "",
                                          content.copy_account_toast || t("copiedToClipboard", lang)
                                        )
                                    }}
                                  >
                                    {selectedAccount.account_number || ""}
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                                      <rect x="9" y="9" width="11" height="11" rx="2" />
                                      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                                    </svg>
                                  </h4>
                                </div>
                                <div>
                                  <small className="bank-account-name-label">{content.gift_name_label || (lang === "en" ? "Account Name" : "Nama Pemilik Rekening")}</small>
                                  <h4 className="bank-account-name">{selectedAccount.account_name || ""}</h4>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {giftAddress ? (
                        <div className="olan-gift-address">
                          <h3 className="olan-gift-address__title">{content.gift_address_title || t("sendGift", lang)}</h3>
                          {giftAddressName ? <p className="olan-gift-address__name">{giftAddressName}</p> : null}
                          <p className="olan-gift-address__lines">{giftAddress}</p>
                          <button
                            type="button"
                            className="olan-gift-address__copy"
                            onClick={() => copyValue(giftAddress, content.copy_address_toast || t("copiedToClipboard", lang))}
                          >
                            {content.copy_address_button || t("copyAddress", lang)}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {/* ───── dress code ───── */}
          {hasDresscode ? (
            <section className="olan-dresscode">
              <h2 className="olan-dresscode__title" data-aos="zoom-in" data-aos-duration="1200">
                {dresscodeTitle}
              </h2>
              {dresscodeIntro ? (
                <p className="olan-dresscode__desc" data-aos="fade-up" data-aos-duration="1000">
                  {dresscodeIntro}
                </p>
              ) : null}
              {dresscodeColors.length > 0 ? (
                <div className="olan-dresscode__swatches">
                  {dresscodeColors.map((color, i) => (
                    <div className="olan-dresscode__swatch" key={`${color.hex || ""}-${i}`} data-aos="zoom-in" data-aos-duration="900" data-aos-delay={i * 90}>
                      <span className="olan-dresscode__dot" style={{ backgroundColor: color.hex || "transparent" }} />
                      {color.name ? <span className="olan-dresscode__name">{color.name}</span> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* ───── wishes ───── */}
          <div id="toWish">
            <section className="wedding-wish-wrap">
              <div className="wedding-wish-inner">
                <div className="wedding-wish-head">
                  <h1 className="wedding-wish-title" data-aos="fade-up" data-aos-duration="1200">
                    {content.wishes_title || t("secWishes", lang)}
                  </h1>
                  {content.wishes_intro ? <p className="olan-wish-intro">{content.wishes_intro}</p> : null}
                </div>
                <div className="wedding-wish-body">
                  <Wishes
                    weddingProfileId={profile.wedding_profile_id}
                    guestId={profile.guest_id}
                    guestName={guestName}
                    guestLinkStrict={profile.guest_link_strict}
                    nameFallback={lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID}
                    copy={{
                      nameLabel: content.wishes_name_label || (lang === "en" ? "Name" : "Nama"),
                      namePlaceholder: content.wishes_name_placeholder || (lang === "en" ? "Your name" : "Nama Anda"),
                      messageLabel: content.wishes_message_label || (lang === "en" ? "Message" : "Pesan"),
                      messagePlaceholder: content.wishes_message_placeholder || (lang === "en" ? "Give your wish..." : "Tulis ucapan Anda..."),
                      submit: content.wishes_submit || t("send", lang),
                      empty: content.wishes_empty || t("noWishesYet", lang),
                      more: content.wishes_more || (lang === "en" ? "Show more comments" : "Lihat ucapan lainnya"),
                      loading: content.wishes_loading || t("loadingWishes", lang),
                    }} language={lang}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ───── closing note + quote ───── */}
          <section className="notes-container">
            <div className="note">
              <h4 className="note-title">{content.closing_title || t("thankYou", lang)}</h4>
              <p className="note-description">
                {content.closing_message ||
                  "From the bottom of our hearts we thank you for being part of our big day. We are beyond lucky to have each of you in our lives."}
              </p>
            </div>
          </section>

          {profile.quote_text ? (
            <div className="quote-wrap">
              <div className="quote">
                <p className="quote-caption" data-aos="fade-up" data-aos-duration="1000">
                  &ldquo;{profile.quote_text}&rdquo;
                  {profile.quote_source ? (
                    <>
                      <br />
                      <br />
                      {profile.quote_source}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          ) : null}

          {/* ───── footnote ───── */}
          <section className="footnote-wrap">
            <div className="footnote-inner">
              <div className="footnote-head">
                <p className="top-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="100">
                  {content.cover_kicker || t("weddingInvitation", lang)}
                </p>
                <h2 className="footnote-title" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                  {coupleShort}
                </h2>
                {date ? (
                  <p className="date" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                    {date.month} {date.day}
                    {date.ord ? <sup>{date.ord}</sup> : null}, {date.year}
                  </p>
                ) : null}
                {profile.display_name ? (
                  <p className="bottom-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                    {profile.display_name}
                  </p>
                ) : null}
              </div>
              <div className="footnote-body">
                <div className="preview-container" />
              </div>
              {closingPhoto ? (
                <div className="olan-closing-photo" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="400">
                  <div className="couple-frame">
                    <div className="couple-picture-wrap">
                      <div className="couple-picture">
                        <div className="img-wrap">
                          <img className="img" src={closingPhoto} alt={coupleShort} loading="lazy" />
                        </div>
                      </div>
                    </div>
                    <div className="decor-frame">
                      <div className="image-wrap">
                        <img src={OLAN.portraitFrame} alt="" />
                      </div>
                    </div>
                    {OLAN.wreaths.map((src, i) => (
                      <div className={`orn-couple-${i + 1}`} key={`closing-orn-${src}`}>
                        <div className="image-wrap olan-orn-in" style={{ animationDelay: `${i * 120}ms` }}>
                          <img src={src} alt="" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="ornaments-wrapper">
                <div className="orn-cover-top-wrap">
                  <div className="orn-cover-top-2">
                    <div className="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="500">
                      <img src={OLAN.cloudWide} alt="" />
                    </div>
                  </div>
                  <div className="orn-cover-top-3">
                    <div className="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="500">
                      <img src={OLAN.cloudSmall} alt="" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="ornaments-wrapper">
                <div className="orn-cover-bottom-wrap">
                  {OLAN.flowers.map((src, i) => (
                    <div className={`orn-cover-bottom-event-${i + 1}`} key={`fn-${src}`}>
                      <div className="image-wrap olan-orn-in" style={{ animationDelay: `${i * 90}ms` }}>
                        <img src={src} alt="" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ───── brand footer ───── */}
          <section className="footer">
            <div className="footer-inner flex-column">
              <p>Wedding by</p>
              <a className="olan-brand" href={`https://wa.me/${AKSARAA_WA_NUMBER}`} target="_blank" rel="nofollow noreferrer noopener">
                <img src={OLAN.aksaraaLogo} alt="Aksaraa" />
                <span>Aksaraa</span>
              </a>
            </div>
          </section>
        </section>
      </section>

      {/* ───────── splash gate (mobile only, reference `top-cover`) ───────── */}
      <section className={`top-cover${opened ? " hide" : ""}`}>
        <div className="bg-tc" />
        {gateFilm && gateMounted ? (
          <div className={`top-cover__video${gatePlaying ? " is-playing" : ""}`}>
            {gateFilm.kind === "file" ? (
              <video
                src={gateFilm.src}
                poster={OLAN.painting}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onPlaying={() => setGatePlaying(true)}
              />
            ) : youtubeId(gateFilm.src) ? (
              <AutoplayYouTube videoId={youtubeId(gateFilm.src)} title={coupleShort} onPlay={() => setGatePlaying(true)} />
            ) : (
              <iframe
                src={gateFilm.src}
                title={coupleShort}
                allow="autoplay; encrypted-media"
                onLoad={() => setGatePlaying(true)}
              />
            )}
          </div>
        ) : null}
        <div className="inner">
          <div className="details">
            <div className="body-detail">
              <h1 data-aos="fade-up" data-aos-duration="2000" data-aos-delay="900">
                {coupleShort}
              </h1>
              <p data-aos="fade-up" data-aos-duration="2000" data-aos-delay="1100">
                {content.cover_guest_label || (lang === "en" ? "Dear" : "Kepada Yth.")}
                <br />
                {guestName || (lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID)}
              </p>
              <div data-aos="fade-up" data-aos-duration="2600" data-aos-delay="1500">
                <a
                  className="link"
                  href="#open"
                  onClick={(e) => {
                    e.preventDefault()
                    openInvitation()
                  }}
                >
                  {content.open_button || t("openInvitation", lang)}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── music ───────── */}
      {trackUrl ? (
        <section className="music-outer">
          <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio />
          {/* Sandhya's control: a drawn vinyl + tonearm instead of the
              reference's flat disc image (see olan-extra.css). */}
          <button
            type="button"
            className={`olan-music${playing ? "" : " paused"}`}
            aria-label={playing ? t("pauseMusic", lang) : t("playMusic", lang)}
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
        </section>
      ) : null}

      {/* ───────── lightbox ───────── */}
      {lightbox !== null && gallery[lightbox] ? (
        <div className="olan-lightbox" role="dialog" aria-modal="true" onClick={closeLightbox}>
          <button type="button" className="olan-lightbox__close" onClick={closeLightbox} aria-label={lang === "en" ? "Close" : "Tutup"}>
            ×
          </button>
          <img src={gallery[lightbox]} alt="" onClick={(e) => e.stopPropagation()} />
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="olan-lightbox__nav prev"
                aria-label={lang === "en" ? "Previous photo" : "Foto sebelumnya"}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="olan-lightbox__nav next"
                aria-label={lang === "en" ? "Next photo" : "Foto berikutnya"}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
                }}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ───────── film modal ───────── */}
      {videoLive ? (
        <div className="olan-video-modal" role="dialog" aria-modal="true" onClick={closeVideo}>
          <button type="button" className="olan-lightbox__close" onClick={closeVideo} aria-label={lang === "en" ? "Close" : "Tutup"}>
            ×
          </button>
          <div className="olan-video-modal__frame" onClick={(e) => e.stopPropagation()}>
            {videoLive.kind === "file" ? (
              <video src={videoLive.src} controls autoPlay playsInline />
            ) : (
              <iframe src={videoLive.src} title={content.video_title || (lang === "en" ? "Our Footage" : "Cuplikan Kami")} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            )}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="olan-toast" role="status">
          {toast}
        </div>
      ) : null}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName || (lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID)}
          coupleName={coupleShort}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="center"
          language={lang}
        />
      )}
    </div>
  )
}

// The reference labels the religious ceremony with rings and the reception with
// a wine glass; our `sessions[]` carries no type, so the name decides and the
// first session stays the ceremony by default.
function isCeremony(name?: string) {
  const n = (name || "").toLowerCase()
  if (!n) return true
  return /(akad|ijab|pemberkatan|ceremony|religious|tauhid|nikah|sacrament)/.test(n)
}

function videoPoster(video: VideoSource): string {
  if (video.kind === "file") return ""
  const id = youtubeId(video.src)
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : ""
}

function livestreamPoster(url: string): string {
  const id = youtubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/sddefault.jpg` : ""
}

function RingsIcon() {
  return (
    <svg className="activity-icon ic-rings" viewBox="0 0 512 512" fill="none" aria-hidden>
      <path
        d="M193 148c-38 0-72 14-98 40s-40 60-40 98 14 72 40 98 60 40 98 40 72-14 98-40 40-60 40-98-14-72-40-98-60-40-98-40Zm0 250c-62 0-112-50-112-112s50-112 112-112 112 50 112 112-50 112-112 112Z"
        fill="currentColor"
      />
      <path
        d="M319 148c-38 0-72 14-98 40s-40 60-40 98 14 72 40 98 60 40 98 40 72-14 98-40 40-60 40-98-14-72-40-98-60-40-98-40Zm0 250c-62 0-112-50-112-112s50-112 112-112 112 50 112 112-50 112-112 112Z"
        fill="currentColor"
      />
      <path d="M256 96l26-52h-52l26 52Z" fill="currentColor" />
      <path d="M256 96l14-30 14 30-14 44-14-44Z" fill="currentColor" opacity=".55" />
    </svg>
  )
}

function WineIcon() {
  return (
    <svg className="activity-icon ic-wine" viewBox="0 0 512 512" fill="none" aria-hidden>
      <path
        d="M128 64h256l-24 132c-8 46-48 80-96 80s-88-34-96-80L128 64Zm40 32 18 104c6 34 36 60 70 60s64-26 70-60l18-104H168Z"
        fill="currentColor"
      />
      <path d="M243 276h26v132h-26z" fill="currentColor" />
      <path d="M192 424h128v24H192z" fill="currentColor" />
      <path d="M256 64c-38 0-72 12-96 32h192c-24-20-58-32-96-32Z" fill="currentColor" opacity=".5" />
    </svg>
  )
}
