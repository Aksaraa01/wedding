"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { copyPlainText } from "@/lib/clipboard"
import { resolveCoupleName } from "@/lib/coupleName"
import { normalizeLanguage, t } from "@/lib/i18n"
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
} from "../shared/lib"
import Wishes from "./Wishes"
import "./noir-reference.css"
import "./noir.css"

const GUEST_FALLBACK_ID = "Tamu Undangan"
const GUEST_FALLBACK_EN = "Guest"

const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const pad2 = (n: number) => String(n).padStart(2, "0")

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return "th"
  const mod10 = n % 10
  if (mod10 === 1) return "st"
  if (mod10 === 2) return "nd"
  if (mod10 === 3) return "rd"
  return "th"
}

function parseDate(value?: string | null): Date | null {
  const raw = String(value || "").trim()
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// The reference prints "Saturday, February 24th 2024" / "Sabtu, 24 Februari 2024".
function dateParts(value: string | null | undefined, lang: "id" | "en") {
  const d = parseDate(value)
  if (!d) return null
  return {
    weekday: (lang === "en" ? EN_DAYS : ID_DAYS)[d.getDay()],
    day: d.getDate(),
    month: (lang === "en" ? EN_MONTHS : ID_MONTHS)[d.getMonth()],
    year: d.getFullYear(),
    ord: lang === "en" ? ordinal(d.getDate()) : "",
  }
}

function dateLine(value: string | null | undefined, lang: "id" | "en"): string {
  const p = dateParts(value, lang)
  if (!p) return ""
  return lang === "en"
    ? `${p.weekday}, ${p.month} ${p.day}${p.ord} ${p.year}`
    : `${p.weekday}, ${p.day} ${p.month} ${p.year}`
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

// The cover prints the bride under the groom: "Groom &" then a line break.
function splitCoupleName(name: string): [string, string] | null {
  const i = name.lastIndexOf(" & ")
  if (i < 0) return null
  const left = name.slice(0, i).trim()
  const right = name.slice(i + 3).trim()
  return left && right ? [left, right] : null
}

export default function Noir(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const gates = profile.feature_gates || {}
  const tc = profile.template_content || {}

  const groomShort = (profile.groom_name || "").trim()
  const brideShort = (profile.bride_name || "").trim()
  const coupleShort =
    [groomShort, brideShort].filter(Boolean).join(" & ") ||
    resolveCoupleName(profile) ||
    (lang === "en" ? "The Couple" : "Mempelai")
  const groomName = (profile.groom_full_name || groomShort).trim()
  const brideName = (profile.bride_full_name || brideShort).trim()
  const guestName = (profile.guest_name || "").trim()
  const guestLabel = guestName || (lang === "en" ? GUEST_FALLBACK_EN : GUEST_FALLBACK_ID)
  const hashtag = (profile.display_name || "").trim()

  const rootRef = useRef<HTMLDivElement | null>(null)
  const paneRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const storyRef = useRef<HTMLDivElement | null>(null)
  // Mouse drag: touch already scrolls natively, a desktop guest expects to drag.
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0, moved: false })
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoOn, setVideoOn] = useState(false)
  const [giftTab, setGiftTab] = useState<"account" | "address">("account")
  const [toast, setToast] = useState("")

  const cover = coverPhoto(profile)
  const coverSlides = flattenPhotos(profile.cover_photos)
  // Each surface takes its own cover slot so the invitation is not one photo
  // repeated down the page. Missing slots fall back to the cover photo.
  const coverAt = (index: number) => coverSlides[index] || ""
  const gatePhoto = coverAt(1) || cover
  const quotePhoto = coverAt(2) || coverAt(1) || cover
  const closingPhoto = coverAt(3) || coverAt(1) || cover
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const gallery = flattenPhotos(profile.gallery_photos)

  const sessions = (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue))
  const stories =
    gates.story !== false && profile.story_visible !== false
      ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url))
      : []
  const rundown =
    profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).map((s) => String(s)).filter(Boolean)
      : []

  const giftOn = profile.gift_section_visible !== false
  const accounts = giftOn
    ? (profile.gift_accounts || []).filter((a) => a && (a.provider_name || a.account_number))
    : []
  const giftAddressName = (profile.gift_address_name || "").trim()
  const giftAddress = giftOn && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const dresscodeOn = profile.dresscode_visible !== false
  const dresscode = dresscodeOn ? profile.dresscode : undefined
  const dresscodeColors = (dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const dresscodeTitle = tc.dresscode_title || dresscode?.title || t("secDresscode", lang)
  const dresscodeIntro = tc.dresscode_intro || dresscode?.description || ""
  const hasDresscode = dresscodeOn && (dresscodeColors.length > 0 || !!dresscodeIntro)

  const video = videoSource(profile.video_url)
  const hasVideo = !!video && gates.video !== false && profile.video_section_visible !== false
  const videoPoster = video ? youtubeId(video.src) : ""

  const ceremony = sessions[0]
  const coverDate = dateLine(profile.estimated_wedding_date || ceremony?.date, lang)
  const sessionDates = (profile.sessions || []).map((s) => (s?.date ? String(s.date) : "")).join("|")
  const targetMs = useMemo(
    () => countdownTarget(profile.sessions || [], profile.estimated_wedding_date)?.getTime() ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionDates, profile.estimated_wedding_date]
  )
  const calendar = gcalLink(ceremony, groomName, brideName)
  const trackUrl = profile.track_url || ""

  // Copy: a field, or the shared dictionary — never a literal in the JSX.
  const kicker = tc.cover_kicker || t("weddingInvitation", lang)
  const greeting = tc.cover_guest_label || t("toGuest", lang)
  const openLabel = tc.open_button || t("openInvitation", lang)
  const welcomeTitle = tc.welcome_title || coupleShort
  const welcomeNote = tc.welcome_note || t("withLoveAndGratitude", lang)
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const agendaTitle = tc.agenda_title || t("secEvent", lang)
  const eventsIntro = tc.events_intro || ""
  const mapsLabel = tc.maps_label || t("viewLocation", lang)
  const countdownTitle = tc.countdown_title || t("countdown", lang)
  const calendarLabel = tc.calendar_button || t("saveToCalendar", lang)
  const storyTitle = tc.love_story_title || t("secStory", lang)
  const rundownTitle = tc.rundown_title || t("rundownHeading", lang)
  const galleryTitle = tc.gallery_title || t("secGallery", lang)
  const galleryIntro = tc.gallery_intro || ""
  const videoTitle = tc.video_title || t("secVideo", lang)
  const videoCaption = tc.video_caption || ""
  const giftTitle = tc.gift_intro_title || t("secGift", lang)
  const giftIntro = tc.gift_intro_description || ""
  const copyAccountLabel = tc.copy_account_button || t("copyNumber", lang)
  const addressTitle = tc.gift_address_title || t("sendGift", lang)
  const copyAddressLabel = tc.copy_address_button || t("copyAddress", lang)
  const copyAccountToast = tc.copy_account_toast || t("copied", lang)
  const copyAddressToast = tc.copy_address_toast || t("copied", lang)
  const wishesTitle = tc.wishes_title || t("secWishes", lang)
  const wishesIntro = tc.wishes_intro || ""
  const invitingTitle = tc.inviting_title || t("secInviting", lang)
  const invitingIntro = tc.inviting_intro || ""
  const closingTitle = tc.closing_title || t("thankYou", lang)
  const closingMessage = tc.closing_message || t("withLoveAndGratitude", lang)
  const closingBrand = tc.closing_brand || t("digitalWeddingInvitation", lang)

  const countdownLabels = [
    { key: "days", label: tc.countdown_days || t("days", lang) },
    { key: "hours", label: tc.countdown_hours || t("hours", lang) },
    { key: "minutes", label: tc.countdown_minutes || t("minutes", lang) },
    { key: "seconds", label: tc.countdown_seconds || t("seconds", lang) },
  ]

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
    const pane = paneRef.current
    if (pane) pane.scrollTop = 0
  }, [playMusic])

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
    if (targetMs === null) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  const countdown = useMemo(() => {
    if (targetMs === null) return null
    const diff = Math.max(0, targetMs - (now ?? targetMs))
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    }
  }, [targetMs, now])

  // ── reveal: one observer, the reference's AOS attributes ─────────────────
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-aos]"))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
    const observe = els.filter(
      (el) => !el.classList.contains("aos-animate") && !el.closest(".top-cover") && !el.closest(".cover")
    )
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("aos-animate")
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 100% -15% 100%", threshold: 0.01 }
    )
    for (const el of observe) io.observe(el)
    return () => io.disconnect()
  }, [])

  // The gate carries its own entrance; it runs on load, not on scroll.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const gate = root.querySelector(".top-cover")
    if (!gate || opened) return
    const els = Array.from(gate.querySelectorAll<HTMLElement>("[data-aos]"))
    for (const el of els) {
      const dur = el.dataset.aosDuration
      const delay = el.dataset.aosDelay
      if (dur) el.style.transitionDuration = `${dur}ms`
      if (delay) el.style.transitionDelay = `${delay}ms`
    }
    const id = window.setTimeout(() => {
      for (const el of els) el.classList.add("aos-animate")
    }, 80)
    return () => window.clearTimeout(id)
  }, [opened])

  // The cover is the first screen after the gate. Its photo zooms out over 2 s and
  // the countdown items stagger in — replayed on every open, like the reference.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const cover = root.querySelector(".cover")
    if (!cover) return
    const els = Array.from(cover.querySelectorAll<HTMLElement>("[data-aos]"))
    for (const el of els) {
      const dur = el.dataset.aosDuration
      const delay = el.dataset.aosDelay
      if (dur) el.style.transitionDuration = `${dur}ms`
      if (delay) el.style.transitionDelay = `${delay}ms`
    }
    if (!opened) {
      for (const el of els) el.classList.remove("aos-animate")
      return
    }
    const id = window.setTimeout(() => {
      for (const el of els) el.classList.add("aos-animate")
    }, 260)
    return () => window.clearTimeout(id)
  }, [opened])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (lightbox !== null) {
        if (event.key === "Escape") setLightbox(null)
        if (event.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
        if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
        return
      }
      if (event.key === "ArrowRight" && stories.length > 1) setStoryIndex((i) => (i + 1) % stories.length)
      if (event.key === "ArrowLeft" && stories.length > 1) setStoryIndex((i) => (i - 1 + stories.length) % stories.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length, stories.length])

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const dragHandlers = (ref: React.RefObject<HTMLDivElement | null>) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") return
      const el = ref.current
      if (!el) return
      dragRef.current = { active: true, startX: event.clientX, startLeft: el.scrollLeft, moved: false }
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const el = ref.current
      if (!drag.active || !el) return
      const dx = event.clientX - drag.startX
      if (Math.abs(dx) > 6) {
        drag.moved = true
        el.scrollLeft = drag.startLeft - dx
      }
    },
    onPointerUp: () => {
      dragRef.current.active = false
    },
    onPointerLeave: () => {
      dragRef.current.active = false
    },
  })

  // A slide is one card wide; on desktop the track is much wider than a card,
  // so stepping by clientWidth used to jump two or three milestones at once.
  const storyStep = () => {
    const el = storyRef.current
    const item = el?.querySelector<HTMLElement>(".story-chitra__slider-for__item")
    return item ? item.getBoundingClientRect().width + 10 : (el?.clientWidth ?? 0)
  }

  const scrollStory = (dir: number) => {
    const el = storyRef.current
    if (!el) return
    el.scrollBy({ left: dir * storyStep(), behavior: "smooth" })
  }

  // The reference's gallery advances on its own (slick autoplay, ~4 s). One
  // card per tick, no hover pause, and a cooldown after the guest intervenes.
  useEffect(() => {
    const el = galleryRef.current
    if (!el || gallery.length < 2 || lightbox !== null) return
    // Reduced motion keeps the autoplay but advances without the glide, so the
    // strip still moves on phones that disable animations system-wide.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let holding = false
    let holdUntil = 0
    let inView = false
    let visibleAt = 0
    // Only advance while the strip is on screen; otherwise a guest who scrolls
    // down after a while arrives mid-list.
    const visibility = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting)
        if (visible && !inView) visibleAt = Date.now()
        inView = visible
      },
      { threshold: 0.1 }
    )
    visibility.observe(el)
    const hold = () => {
      holding = true
    }
    const release = () => {
      holding = false
      holdUntil = Date.now() + 3000
    }
    el.addEventListener("pointerdown", hold)
    el.addEventListener("pointerup", release)
    el.addEventListener("pointercancel", release)
    el.addEventListener("touchstart", hold, { passive: true })
    el.addEventListener("touchend", release)
    el.addEventListener("touchcancel", release)
    const id = window.setInterval(() => {
      if (!inView || Date.now() - visibleAt < 4200 || holding || document.hidden || Date.now() < holdUntil) return
      const step = galleryStep()
      if (!step) return
      const current = Math.round(el.scrollLeft / step)
      const next = current + 1 >= gallery.length ? 0 : current + 1
      el.scrollTo({ left: next * step, behavior: reduceMotion ? "auto" : "smooth" })
    }, 4200)
    return () => {
      window.clearInterval(id)
      visibility.disconnect()
      el.removeEventListener("pointerdown", hold)
      el.removeEventListener("pointerup", release)
      el.removeEventListener("pointercancel", release)
      el.removeEventListener("touchstart", hold)
      el.removeEventListener("touchend", release)
      el.removeEventListener("touchcancel", release)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gallery.length, lightbox])

  const galleryStep = () => {
    const el = galleryRef.current
    const item = el?.querySelector<HTMLElement>(".slider-item")
    return item ? item.getBoundingClientRect().width + 12 : (el?.clientWidth ?? 0)
  }

  const scrollGallery = (dir: number) => {
    const el = galleryRef.current
    if (!el) return
    el.scrollBy({ left: dir * galleryStep(), behavior: "smooth" })
  }

  const rootStyle = { "--bg-cover": `url("${cover}")` } as CSSProperties
  const brideFirst = tc.couple_order === "bride-first"
  const nameParts = splitCoupleName(coupleShort)
  const coupleNameNode = nameParts ? (
    <>
      {nameParts[0]} &amp;
      <br />
      {nameParts[1]}
    </>
  ) : (
    coupleShort
  )

  const person = (kind: "groom" | "bride") => {
    const isGroom = kind === "groom"
    const photo = isGroom ? groomPhoto : bridePhoto
    const name = isGroom ? groomName : brideName
    const short = isGroom ? groomShort : brideShort
    const parents = isGroom ? profile.groom_parents : profile.bride_parents
    const instagram = isGroom ? profile.groom_instagram : profile.bride_instagram
    if (!name && !short) return null
    return (
      <div className={`couple-info ${kind}`} key={kind}>
        <div className="couple-preview-wrap">
          <div className="couple-picture" data-aos="fade-up" data-aos-duration="500" data-aos-once="false">
            <a className="img-wrap" href={photo} target="_blank" rel="noreferrer noopener">
              <img className="img" src={photo} alt="" loading="lazy" />
            </a>
          </div>
        </div>
        <div className="couple-details-wrap previewed">
          <div className="couple-details">
            <h2 className="couple-name" data-aos="fade-up" data-aos-duration="1000">
              {name || short}
            </h2>
            {parents ? (
              <p className="couple-parents" data-aos="fade-up" data-aos-duration="1000">
                {isGroom ? t("sonOf", lang) : t("daughterOf", lang)} {parents}
              </p>
            ) : null}
            {instagram ? (
              <div className="couple-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                <a
                  href={`https://www.instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="couple-link"
                  aria-label={`Instagram ${instagram.replace(/^@/, "")}`}
                >
                  <i className="noir-instagram" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </i>{" "}
                  {instagram}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="noir-root" ref={rootRef} style={rootStyle}>
      <section className="kat-page__side-to-side" ref={paneRef}>
        {/* ───── fixed poster pane (desktop) ───── */}
        <section className="primary-pane">
          <div className="inner">
            <div className="details">
              <p className="top-text" data-aos="fade-down" data-aos-duration="1200">
                {kicker}
              </p>
              <h1 data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="700">
                {coupleNameNode}
              </h1>
              {hashtag ? (
                <p className="bottom-text" data-aos="fade-up" data-aos-duration="1200">
                  {hashtag}
                </p>
              ) : null}
              <p data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100">
                {greeting}
                <br />
                {guestLabel}
              </p>
            </div>
            <div className="highlight" data-aos="zoom-out" data-aos-duration="1000">
              {hasVideo && video ? (
                video.kind === "file" ? (
                  <video className="pane-media" src={video.src} autoPlay muted loop playsInline />
                ) : videoPoster ? (
                  <AutoplayYouTube videoId={videoPoster} title={videoTitle} autoplay />
                ) : (
                  <div className="preview-container cover-show">
                    <div className="picture" style={{ backgroundImage: `url("${cover}")` }} />
                  </div>
                )
              ) : (
                <div className="preview-container cover-show">
                  <div className="picture" style={{ backgroundImage: `url("${cover}")` }} />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="secondary-pane">
          <section className="hero">
            <div className="inner">
              <div className="body highlight" data-aos="zoom-out" data-aos-duration="2000">
                <div className="preview-container cover-show">
                  <div className="picture" style={{ backgroundImage: `url("${cover}")` }} />
                </div>
              </div>
            </div>
          </section>

          {/* ───── mobile gate: the reference's top-cover ───── */}
          <section className={`top-cover${opened ? " hide" : ""}`}>
            <div className="inner">
              <div className="head">
                <p className="top-text" data-aos="fade-down" data-aos-duration="1200">
                  {kicker}
                </p>
                <h1 data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="700">
                  {coupleNameNode}
                </h1>
                {hashtag ? (
                  <p className="bottom-text" data-aos="fade-up" data-aos-duration="1200">
                    {hashtag}
                  </p>
                ) : null}
              </div>
              <div className="details">
                <p data-aos="fade-up" data-aos-duration="1200" data-aos-delay="800">
                  {greeting}
                  <br />
                  {guestLabel}
                </p>
                <div className="link-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="850">
                  <a
                    className="link"
                    role="button"
                    tabIndex={0}
                    onClick={openInvitation}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openInvitation()
                      }
                    }}
                  >
                    {openLabel}
                  </a>
                </div>
              </div>
              <div className="highlight">
                <div className="preview-container cover-show">
                  <div className="picture" style={{ backgroundImage: `url("${gatePhoto}")` }} />
                </div>
              </div>
            </div>
          </section>

          {/* 1 — Cover */}
          <section className="cover">
            <div className="inner">
              <div className="head" data-aos="fade-down" data-aos-duration="1000">
                <p data-aos="fade-down" data-aos-duration="1000">
                  {kicker}
                </p>
                <h1 data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100">
                  {coupleNameNode}
                </h1>
                {coverDate ? (
                  <p className="date" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                    {coverDate}
                  </p>
                ) : null}
              </div>
              <div className="body highlight" data-aos="zoom-out" data-aos-duration="2000">
                <div className="cover-frame">
                  <div className="preview-container cover-show">
                    <div className="picture" style={{ backgroundImage: `url("${cover}")` }} />
                  </div>
                </div>
              </div>
              <div className="foot" data-aos="fade-up" data-aos-duration="2000">
                {countdown ? (
                  <div className="cover-countdown">
                    {countdownLabels.map((unit, index) => (
                      <div
                        className="count-item"
                        key={unit.key}
                        data-aos="fade-up"
                        data-aos-duration="1200"
                        data-aos-delay={String(100 + index * 200)}
                      >
                        <h2 className="count-num">{pad2(countdown[unit.key as keyof typeof countdown])}</h2>
                        <small className="count-text">{unit.label}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
                {calendar ? (
                  <div className="add-to-calendar-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="800">
                    <a className="add-to-calendar" href={calendar} target="_blank" rel="noreferrer noopener">
                      {calendarLabel}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* 2 — Opening video: the design opens on a still cover (REA_NOIR §3). */}

          {/* 3 — Quote (the design has no separate "kalimat pembuka" block) */}
          {quoteText ? (
            <section className="quote-wrap" style={{ "--section-photo": `url("${quotePhoto}")` } as CSSProperties}>
              <div className="quote">
                {quoteText ? (
                  <p className="quote-caption" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="250">
                    &ldquo;{quoteText}&rdquo;
                    {quoteSource ? (
                      <>
                        <br />
                        <br />
                        ({quoteSource})
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 4 — Welcome (the reference's couple-head block) */}
          <section className="couple-wrap welcome-wrap">
            <div className="couple">
              <div className="couple-head">
                <h1 className="couple-title" data-aos="zoom-in" data-aos-duration="1000">
                  {welcomeTitle}
                </h1>
                <p className="couple-description" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200">
                  {welcomeNote}
                </p>
                {coverDate ? (
                  <p className="date" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="350">
                    {coverDate}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {/* 5 — Mempelai */}
          <section className="couple-wrap">
            <div className="couple">
              {/* The theme reverses this column with .bride-first, so the DOM
                  order stays groom→bride and the editor's order is honoured. */}
              <div className={`couple-body${brideFirst ? " bride-first" : ""} show-picture`}>
                {person("groom")}
                {person("bride")}
              </div>
            </div>
          </section>

          {/* 6 — Event */}
          {sessions.length > 0 ? (
            <section className="agenda-wrap">
              <div className="section-media" aria-hidden>
                {hasVideo && video ? (
                  video.kind === "file" ? (
                    <video className="section-media__video" src={video.src} autoPlay muted loop playsInline />
                  ) : videoPoster ? (
                    <AutoplayYouTube videoId={videoPoster} title={videoTitle} autoplay />
                  ) : (
                    <div className="section-media__photo" style={{ backgroundImage: `url("${cover}")` }} />
                  )
                ) : (
                  <div className="section-media__photo" style={{ backgroundImage: `url("${cover}")` }} />
                )}
              </div>
              <div className="agenda-inner">
                <div className="agenda-head">
                  <h1 className="agenda-title" data-aos="zoom-in" data-aos-duration="1500">
                    {agendaTitle}
                  </h1>
                  {eventsIntro ? (
                    <p className="agenda-description" data-aos="fade-up" data-aos-duration="1200">
                      {eventsIntro}
                    </p>
                  ) : null}
                </div>
                <div className="agenda-body">
                  <div className="event-item" data-aos="fade-up" data-aos-duration="1200">
                    <div className="activity-wrap">
                      {sessions.map((session, index) => {
                        const p = dateParts(session.date, lang)
                        return (
                          <div className="activity-item" key={`${session.name || "event"}-${index}`}>
                            <div className="activity-head">
                              {session.name ? (
                                <h1 className="activity-title" data-aos="fade-up" data-aos-duration="1000">
                                  {session.name}
                                </h1>
                              ) : null}
                              {p ? (
                                <p className="event-date" data-aos="fade-up" data-aos-duration="1000">
                                  {lang === "en" ? (
                                    <>
                                      {p.weekday}, {p.month}{" "}
                                      <span>
                                        {p.day}
                                        <sup>{p.ord}</sup>
                                      </span>{" "}
                                      {p.year}
                                    </>
                                  ) : (
                                    <>
                                      {p.weekday},{" "}
                                      <span>{p.day}</span> {p.month} {p.year}
                                    </>
                                  )}
                                </p>
                              ) : null}
                              {session.time ? (
                                <p className="activity-time" data-aos="fade-up" data-aos-duration="1000">
                                  {session.time}
                                </p>
                              ) : null}
                            </div>
                            {session.venue || session.address ? (
                              <div className="activity-details">
                                {session.venue ? (
                                  <p className="activity-hall" data-aos="fade-up" data-aos-duration="1000">
                                    {session.venue}
                                  </p>
                                ) : null}
                                {session.address ? (
                                  <p className="activity-address" data-aos="fade-up" data-aos-duration="1000">
                                    {session.address}
                                  </p>
                                ) : null}
                                {session.maps_url ? (
                                  <div className="activity-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                                    <a className="activity-link" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                                      {mapsLabel}
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 7 — Countdown lives on the cover foot, exactly like the reference. */}

          {/* 6 — Rundown (right after the events, like the reference) */}
          {rundown.length > 0 ? (
            <section className="rundown-container">
              <div className="rundown-inner">
                <h3 className="rundown-title">{rundownTitle}</h3>
                <div className="rundown-event-list">
                  <div className="rundown-event">
                    <div className="rundown-agenda-list">
                      {rundown.map((row, index) => (
                        <div className="rundown-agenda" key={`${row.time || "row"}-${index}`}>
                          <p className="rundown-agenda-time">{row.time}</p>
                          <div className="rundown-divider">
                            <div className="rundown-line" />
                            <div className="rundown-circle" />
                          </div>
                          <div className="rundown-agenda-content">
                            <p className="rundown-agenda-text">{row.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 8 — Love story */}
          {stories.length > 0 ? (
            <section className="love-story-wrap">
              <div className="love-story-inner">
                <div className="love-story-head">
                  <h1 className="love-story-title">{storyTitle}</h1>
                </div>
                <div className="love-story-body">
                  <div className="story-chitra__slider-wrap">
                    <div
                      className="story-chitra__slider-for"
                      ref={storyRef}
                      onScroll={(event) => {
                        const el = event.currentTarget
                        if (!el.clientWidth) return
                        setStoryIndex(Math.min(stories.length - 1, Math.round(el.scrollLeft / storyStep())))
                      }}
                      {...dragHandlers(storyRef)}
                    >
                      {stories.map((story, index) => (
                        <div
                          className="story-chitra__slider-for__item"
                          key={`${story.title || "story"}-${index}`}
                          style={
                            {
                              // A milestone typed without a photo still gets a full-bleed
                              // frame (the second cover slot, else the cover) instead of a
                              // flat black card.
                              "--story-background": `url("${story.image_url || coverSlides[1] || cover}")`,
                            } as CSSProperties
                          }
                        >
                          <div className="story-chitra__content">
                            {story.title ? (
                              <h2
                                className={`story-chitra__title${index === storyIndex ? " aos-animate" : ""}`}
                                data-aos="fade-up"
                                data-aos-duration="1000"
                              >
                                {story.title}
                              </h2>
                            ) : null}
                            {story.description ? (
                              <p
                                className={`story-chitra__caption${index === storyIndex ? " aos-animate" : ""}`}
                                data-aos="fade-up"
                                data-aos-duration="1000"
                              >
                                {story.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    {stories.length > 1 ? (
                      <div className="story-chitra__slider-nav">
                        <button
                          type="button"
                          className="story-chitra__arrow-btn prev"
                          onClick={() => scrollStory(-1)}
                          aria-label={t("previousPhoto", lang)}
                        >
                          <svg viewBox="0 0 12 22" aria-hidden>
                            <path d="M10 1 2 11l8 10" fill="none" stroke="currentColor" strokeWidth="1.4" />
                          </svg>
                        </button>
                        {stories.map((story, index) => (
                          <button
                            type="button"
                            key={`${story.title || "bar"}-${index}`}
                            className={`story-chitra__slider-nav__item__manual${index === storyIndex ? " is-active" : ""}`}
                            onClick={() => {
                              const el = storyRef.current
                              if (el) el.scrollTo({ left: index * storyStep(), behavior: "smooth" })
                            }}
                            aria-label={t("storyPart", lang).replace("{n}", pad2(index + 1))}
                          />
                        ))}
                        <button
                          type="button"
                          className="story-chitra__arrow-btn next"
                          onClick={() => scrollStory(1)}
                          aria-label={t("nextPhoto", lang)}
                        >
                          <svg viewBox="0 0 12 22" aria-hidden>
                            <path d="M2 1l8 10-8 10" fill="none" stroke="currentColor" strokeWidth="1.4" />
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 10 — Gallery */}
          {gallery.length > 0 ? (
            <section className="gallery">
              <div className="gallery-inner">
                <div className="title" data-aos="zoom-out" data-aos-duration="1000">
                  <h1 data-aos="fade-up" data-aos-duration="1000">
                    {galleryTitle}
                  </h1>
                  {galleryIntro ? <p className="gallery-description">{galleryIntro}</p> : null}
                </div>
                <div className="body">
                  <div className="gallery__single-slider" data-aos="fade-left" data-aos-duration="1200">
                    <div
                      className="slider-container"
                      ref={galleryRef}
                      {...dragHandlers(galleryRef)}
                      onScroll={(event) => {
                        const el = event.currentTarget
                        if (!el.clientWidth) return
                        const step = galleryStep()
                        if (step) setGalleryIndex(Math.round(el.scrollLeft / step))
                      }}
                    >
                      {gallery.map((src, index) => (
                        <div className="slider-item" key={`${src}-${index}`}>
                          <div className="preview">
                            <button
                              type="button"
                              className="anchor"
                              onClick={() => {
                                if (dragRef.current.moved) {
                                  dragRef.current.moved = false
                                  return
                                }
                                setLightbox(index)
                              }}
                              aria-label={t("photoGallery", lang)}
                            >
                              <img src={src} alt="" className="img" loading="lazy" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 11 — Video */}
          {hasVideo && video ? (
            <section className="video-gallery">
              <div className="inner">
                <div className="title" data-aos="zoom-out" data-aos-duration="1000">
                  <h1 data-aos="zoom-out-up" data-aos-duration="1000">
                    {videoTitle}
                  </h1>
                </div>
                <div className="video-outer">
                  <div className="video">
                    <div
                      className={`preview${videoOn ? " is-playing" : ""}`}
                      data-aos="zoom-in"
                      data-aos-duration="1000"
                    >
                      {videoOn ? (
                        video.kind === "file" ? (
                          <video src={video.src} controls autoPlay muted loop playsInline />
                        ) : videoPoster ? (
                          <AutoplayYouTube videoId={videoPoster} title={videoTitle} controls autoplay />
                        ) : (
                          <iframe src={video.src} title={videoTitle} allow="autoplay; encrypted-media" />
                        )
                      ) : (
                        <>
                          {videoPoster ? (
                            <img
                              src={`https://i.ytimg.com/vi/${videoPoster}/maxresdefault.jpg`}
                              alt=""
                              loading="lazy"
                              onError={(event) => {
                                const img = event.currentTarget
                                const fallback = `https://i.ytimg.com/vi/${videoPoster}/hqdefault.jpg`
                                if (img.src !== fallback) img.src = fallback
                              }}
                            />
                          ) : null}
                          <button type="button" className="play-btn" onClick={() => setVideoOn(true)} aria-label={videoTitle}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    {videoCaption ? (
                      <div className="title">
                        <h2 data-aos="fade-up" data-aos-duration="1000">{videoCaption}</h2>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 12 — Wedding gift */}
          {hasGift ? (
            <section className="wedding-gift-wrap">
              <div className="wedding-gift-inner">
                <div className="wedding-gift-head">
                  <h1 className="wedding-gift-title" data-aos="zoom-in" data-aos-duration="1500">
                    {giftTitle}
                  </h1>
                  {giftIntro ? (
                    <p className="wedding-gift-description" data-aos="fade-up" data-aos-duration="1000">
                      {giftIntro}
                    </p>
                  ) : null}
                </div>
                <div className="wedding-gift-body">
                  <div className="wedding-gift-form">
                    {accounts.length > 0 && giftAddress ? (
                      <div className="wedding-gift-select-bank-wrap">
                        <button
                          type="button"
                          className={`noir-gift-tab${giftTab === "account" ? " is-active" : ""}`}
                          onClick={() => setGiftTab("account")}
                        >
                          {giftTitle}
                        </button>
                        <button
                          type="button"
                          className={`noir-gift-tab${giftTab === "address" ? " is-active" : ""}`}
                          onClick={() => setGiftTab("address")}
                        >
                          {addressTitle}
                        </button>
                      </div>
                    ) : null}

                    {accounts.length > 0 && (giftTab === "account" || !giftAddress) ? (
                      <div className="wedding-gift-bank-wrap">
                        {accounts.map((account, index) => (
                          <div className="bank-item show" key={`${account.account_number || "acc"}-${index}`}>
                            <div className="bank-detail">
                              <div>
                                {account.provider_name ? (
                                  <span className="bank-account-number-label">{account.provider_name}</span>
                                ) : null}
                                <h4 className="bank-account-number">{account.account_number}</h4>
                              </div>
                              <div>
                                {account.account_name ? <h4 className="bank-account-name">{account.account_name}</h4> : null}
                              </div>
                            </div>
                            {account.account_number ? (
                              <div className="copy-wrap">
                                <button
                                  type="button"
                                  className="copy-num"
                                  onClick={() => copyValue(account.account_number || "", copyAccountToast)}
                                >
                                  {copyAccountLabel}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {giftAddress && (giftTab === "address" || accounts.length === 0) ? (
                      <div className="wedding-gift-bank-wrap">
                        <div className="bank-item show">
                          <div className="bank-detail">
                            <div>
                              <span className="bank-account-number-label">{addressTitle}</span>
                              {giftAddressName ? <h4 className="bank-account-name">{giftAddressName}</h4> : null}
                              <p className="gift-address-text">{giftAddress}</p>
                            </div>
                            <div className="copy-wrap">
                              <button
                                type="button"
                                className="copy-num"
                                onClick={() => copyValue(giftAddress, copyAddressToast)}
                              >
                                {copyAddressLabel}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 13 — Dress code */}
          {hasDresscode ? (
            <section className="wedding-gift-wrap dresscode-wrap">
              <div className="wedding-gift-inner">
                <div className="wedding-gift-head">
                  <h1 className="wedding-gift-title" data-aos="zoom-in" data-aos-duration="1500">
                    {dresscodeTitle}
                  </h1>
                  {dresscodeIntro ? (
                    <p className="wedding-gift-description" data-aos="fade-up" data-aos-duration="1000">
                      {dresscodeIntro}
                    </p>
                  ) : null}
                </div>
                {dresscodeColors.length > 0 ? (
                  <ul className="dresscode-colors">
                    {dresscodeColors.map((color, index) => (
                      <li
                        className="dresscode-item"
                        key={`${color.hex || color.name}-${index}`}
                        data-aos="zoom-in"
                        data-aos-duration="900"
                        data-aos-delay={String(index * 80)}
                      >
                        <span className="dresscode-dot" style={{ backgroundColor: color.hex || "transparent" }} />
                        {color.name ? <span className="dresscode-name">{color.name}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* 14 — Wishes */}
          <section className="wedding-wish-wrap">
            <div className="wedding-wish-inner">
              <div className="wedding-wish-head">
                <h1 className="wedding-wish-title" data-aos="fade-up" data-aos-duration="1200">
                  {wishesTitle}
                </h1>
                {wishesIntro ? <p className="wedding-wish-description">{wishesIntro}</p> : null}
              </div>
              <div className="wedding-wish-body">
                <Wishes
                  weddingProfileId={profile.wedding_profile_id}
                  guestId={profile.guest_id}
                  guestName={guestName}
                  guestLinkStrict={profile.guest_link_strict}
                  nameFallback={guestLabel}
                  language={lang}
                  copy={{
                    nameLabel: tc.wishes_name_label || t("dearGuest", lang),
                    namePlaceholder: tc.wishes_name_placeholder || t("dearGuest", lang),
                    messageLabel: tc.wishes_message_label || t("secWishes", lang),
                    messagePlaceholder: tc.wishes_message_placeholder || t("secWishes", lang),
                    submit: tc.wishes_submit || t("sendWishes", lang),
                    empty: tc.wishes_empty || t("noWishesYet", lang),
                    more: tc.wishes_more || t("loadingWishes", lang),
                    loading: tc.wishes_loading || t("loading", lang),
                  }}
                />
              </div>
            </div>
          </section>

          {/* 15 — Turut mengundang */}
          {honored.length > 0 ? (
            <section className="wedding-wish-wrap inviting-wrap">
              <div className="wedding-wish-inner">
                <div className="wedding-wish-head">
                  <h1 className="wedding-wish-title" data-aos="fade-up" data-aos-duration="1200">
                    {invitingTitle}
                  </h1>
                  {invitingIntro ? <p className="wedding-wish-description">{invitingIntro}</p> : null}
                </div>
                <ul className="inviting-list">
                  {honored.map((name, index) => (
                    <li className="inviting-name" key={`${name}-${index}`}>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* 16 — Closing (greet_thanks + footnote) */}
          <section className="notes-container">
            <div className="note">
              <h4 className="note-title">{closingTitle}</h4>
              <p className="note-description">{closingMessage}</p>
            </div>
          </section>

          <section className="footnote-wrap" style={{ "--section-photo": `url("${closingPhoto}")` } as CSSProperties}>
            <div className="footnote">
              <p className="top-text" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="100">
                {kicker}
              </p>
              <h2 className="footnote-title" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="200">
                {coupleShort}
              </h2>
              {coverDate ? (
                <p className="date" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="300">
                  {coverDate}
                </p>
              ) : null}
              {hashtag ? (
                <p className="bottom-text" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="400">
                  {hashtag}
                </p>
              ) : null}
              <div className="footer" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="500">
                <div className="footer-inner flex-column">
                  <p>{closingBrand}</p>
                  <a
                    className="footer-brand"
                    href="https://aksaraa.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Aksaraa Wedding"
                  >
                    <img
                      className="footer-logo"
                      src={ASSETS.galeriEnvelope.aksaraaLogo}
                      alt="Aksaraa Wedding"
                      loading="lazy"
                    />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </section>
      </section>

      {trackUrl ? <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio /> : null}

      {trackUrl ? (
        <button
          type="button"
          className={`noir-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? t("pauseMusic", lang) : t("playMusic", lang)}
        >
          <span className="noir-music__bars" aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </button>
      ) : null}

      {lightbox !== null && gallery[lightbox] ? (
        <div className="noir-lightbox" role="dialog" aria-modal="true" aria-label={t("photoViewer", lang)}>
          <button type="button" className="noir-lightbox__close" onClick={() => setLightbox(null)} aria-label={t("close", lang)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <img className="noir-lightbox__img" src={gallery[lightbox]} alt="" />
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="noir-lightbox__arrow noir-lightbox__arrow--prev"
                onClick={() => setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))}
                aria-label={t("previousPhoto", lang)}
              >
                <svg viewBox="0 0 12 22" width="10" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                  <path d="M10 1 2 11l8 10" />
                </svg>
              </button>
              <button
                type="button"
                className="noir-lightbox__arrow noir-lightbox__arrow--next"
                onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))}
                aria-label={t("nextPhoto", lang)}
              >
                <svg viewBox="0 0 12 22" width="10" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                  <path d="M2 1l8 10-8 10" />
                </svg>
              </button>
              <p className="noir-lightbox__count">
                {pad2(lightbox + 1)} / {pad2(gallery.length)}
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <div className="noir-toast show" role="status">
          {toast}
        </div>
      ) : null}

      <noscript
        dangerouslySetInnerHTML={{
          __html: ".noir-root [data-aos]{opacity:1!important;transform:none!important}",
        }}
      />

      {showGuestDock ? (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestLabel}
          coupleName={coupleShort}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={24}
          language={lang}
        />
      ) : null}
    </div>
  )
}
