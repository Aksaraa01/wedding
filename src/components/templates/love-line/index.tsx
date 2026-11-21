"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, gcalLink } from "../shared/lib"
import Wishes from "./Wishes"
import { copyPlainText } from "@/lib/clipboard"
import "./love-line.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const ART = (name: string) => `/templates/love-line/${name}.webp`

const DEFAULT_OPENING =
  "By the grace of God, we are getting married. Your presence and prayers will make the day so much happier."
const DEFAULT_CLOSING =
  "Thank you for being part of our story. See you on the big day!"
const DEFAULT_APOLOGY = "We apologize for any misspelling of your name or title."
const DEFAULT_GIFT_INTRO =
  "Your blessings are more than enough. If you'd like to give more, we'll receive it with deep gratitude."

const pad2 = (n: number) => String(n).padStart(2, "0")

const STORY_ART = ["story-1", "story-2", "story-3", "story-4"]
const GALLERY_ART = ["gallery-1", "gallery-2", "gallery-3", "gallery-4"]

// The reference only draws four story scenes. A fifth chapter borrows the four
// gallery illustrations (eight unique images total); beyond that the row is
// text-only instead of repeating art that belongs to another scene.
function storyArtAt(index: number): string {
  if (index < STORY_ART.length) return STORY_ART[index]
  const g = index - STORY_ART.length
  if (g < GALLERY_ART.length) return GALLERY_ART[g]
  return ""
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return (t.replace(/\/+$/, "").split("/").pop() || "").replace(/^@/, "")
  return t.replace(/^@/, "")
}

type Reveal = "fade" | "up" | "left" | "right" | "zoom"
type RevealProps = { "data-ll-reveal"?: Reveal; "data-ll-load"?: Reveal; style?: CSSProperties }

const IN = (kind: Reveal, delay = 0): RevealProps => ({
  "data-ll-reveal": kind,
  style: { "--ll-delay": `${delay}s` } as CSSProperties,
})
const ON_LOAD = (kind: Reveal, delay = 0): RevealProps => ({
  "data-ll-load": kind,
  style: { "--ll-delay": `${delay}s` } as CSSProperties,
})

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
    { value: Math.floor(diff / 86400000), label: "Days" },
    { value: Math.floor((diff % 86400000) / 3600000), label: "Hours" },
    { value: Math.floor((diff % 3600000) / 60000), label: "Minutes" },
    { value: Math.floor((diff % 60000) / 1000), label: "Seconds" },
  ]
  return (
    <div className="ll-clock" aria-label="Countdown to the wedding day">
      {units.map((u) => (
        <div className="ll-clock__cell" key={u.label}>
          <span className="ll-clock__value">{target ? pad2(u.value) : "--"}</span>
          <small className="ll-clock__label">{u.label}</small>
        </div>
      ))}
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.2 3.2 0 0 0-.7-1.2 3.2 3.2 0 0 0-1.2-.7c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  )
}

export default function LoveLine(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [giftTab, setGiftTab] = useState<"transfer" | "address">("transfer")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () =>
      gates.story === false || profile.story_visible === false
        ? []
        : (profile.stories || []).filter((s) => s && (s.title || s.description)),
    [profile.stories, gates.story, profile.story_visible]
  )
  const rundown =
    profile.rundown_visible !== false
      ? (profile.rundown || []).filter((r) => r && (r.time || r.description))
      : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
      : []

  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const dressIntro =
    (tc.dresscode_intro || profile.dresscode?.description || "").trim() ||
    "Your presence is the greatest gift, but we'd love it if you dressed in our colour palette."
  const hasDresscode = profile.dresscode_visible !== false && (dressColors.length > 0 || !!dressIntro)

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || (lang === "en" ? "The Wedding" : "Pernikahan")
  const guestName = (profile.guest_name || "").trim() || (lang === "en" ? "Dear Guest" : "Tamu Undangan")

  // Instagram hashtag from the editor only. No derived fallback: empty means
  // hidden. This template does not print a couple-initials monogram.
  const hashtag = (profile.display_name || "").trim()

  const groomFull = (profile.groom_full_name || groomName || "").trim()
  const brideFull = (profile.bride_full_name || brideName || "").trim()
  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  const openingTitle = (profile.opening_title || "").trim()
  const openingDescription = (profile.opening_description || "").trim() || DEFAULT_OPENING
  const quoteText = (profile.quote_text || "").trim()
  const closingMessage = (tc.closing_message || "").trim() || DEFAULT_CLOSING

  const coverKicker = (tc.cover_kicker || "").trim() || "you're invited to our wedding"
  const coverGuestLabel = (tc.cover_guest_label || "").trim() || (lang === "en" ? "Dear honoured guest" : "Tamu yang terhormat")
  const openLabel = (tc.open_button || "").trim() || t("openInvitation", lang)
  const apology = (tc.cover_apology || "").trim() || DEFAULT_APOLOGY
  const openingKicker = (tc.opening_kicker || "").trim() || "with grateful hearts"
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || "two people, one story"
  const mempelaiTitle = (tc.mempelai_title || "").trim() || (lang === "en" ? "The Couple" : "Mempelai")
  const personOneLabel = (tc.person_one_label || "").trim() || "the one"
  const personTwoLabel = (tc.person_two_label || "").trim() || "the beauty"
  const parentsLabelMale = (tc.parents_label_male || "").trim() || "son of"
  const parentsLabelFemale = (tc.parents_label_female || "").trim() || "daughter of"
  const storyKicker = (tc.story_kicker || "").trim() || "our journey"
  const storyTitle = (tc.love_story_title || "").trim() || (lang === "en" ? "Story" : "Kisah")
  const storyIntro = (tc.story_intro || "").trim() || (lang === "en" ? "The small chapters that brought us here." : "Bab-bab kecil yang membawa kami ke sini.")
  const eventsKicker = (tc.events_kicker || "").trim() || "details of our big day"
  const eventsTitle = (tc.events_title || "").trim() || (lang === "en" ? "Date & Venue" : "Tanggal & Tempat")
  const eventsIntro = (tc.events_intro || "").trim() || (lang === "en" ? "We would be honoured to have you with us." : "Merupakan kehormatan bagi kami jika Anda dapat hadir.")
  const mapsLabel = (tc.maps_label || "").trim() || (lang === "en" ? "Open Map" : "Buka Peta")
  const calendarLabel = (tc.events_note || "").trim() || t("saveToCalendar", lang)
  const countdownIntro = (tc.countdown_intro || "").trim() || "counting down"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "with honour"
  const invitingTitle = (tc.inviting_title || "").trim() || t("secInviting", lang)
  const invitingIntro = (tc.inviting_intro || "").trim() || (lang === "en" ? "With gratitude, we also invite our families and friends." : "Dengan rasa syukur, kami juga mengundang keluarga dan sahabat kami.")
  const rundownKicker = (tc.rundown_kicker || "").trim() || "programme"
  const rundownTitle = (tc.rundown_title || "").trim() || (lang === "en" ? "Schedule" : "Jadwal")
  const rundownIntro = (tc.rundown_intro || "").trim() || (lang === "en" ? "How the day will unfold." : "Bagaimana hari akan berlangsung.")
  const galleryKicker = (tc.gallery_kicker || "").trim() || "our moments"
  const galleryTitle = (tc.gallery_title || "").trim() || (lang === "en" ? "Gallery" : "Galeri")
  const giftTitle = (tc.gift_intro_title || "").trim() || t("secGift", lang)
  const giftIntro = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT_INTRO
  const giftTransferLabel = (tc.gift_button || "").trim() || (lang === "en" ? "Direct Transfer" : "Transfer Langsung")
  const giftAddressLabel = (tc.gift_send_label || "").trim() || t("sendGift", lang)
  const transferNote = (tc.gift_transfer_note || "").trim() || (lang === "en" ? "Transfer directly to the account below:" : "Transfer langsung ke rekening di bawah ini:")
  const addressNote = (tc.gift_address_note || "").trim() || (lang === "en" ? "Send your gift to the address below:" : "Kirim hadiah Anda ke alamat di bawah ini:")
  const dressKicker = (tc.dresscode_kicker || "").trim() || (lang === "en" ? "Dress Code" : "Busana")
  const wishesTitle = (tc.wishes_title || "").trim() || (lang === "en" ? "Prayers & Wishes" : "Doa & Ucapan")
  const wishesIntro = (tc.wishes_intro || "").trim() || (lang === "en" ? "Leave your best prayers and wishes for us." : "Tinggalkan doa dan ucapan terbaik Anda untuk kami.")
  const accountToast = (tc.copy_account_toast || "").trim() || (lang === "en" ? "Account number copied" : "Nomor rekening tersalin")
  const addressToast = (tc.copy_address_toast || "").trim() || (lang === "en" ? "Address copied" : "Alamat tersalin")

  const wishCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || (lang === "en" ? "Your name" : "Nama Anda"),
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || (lang === "en" ? "Full name" : "Nama lengkap"),
    messageLabel: (tc.wishes_message_label || "").trim() || (lang === "en" ? "Your wish" : "Ucapan Anda"),
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || (lang === "en" ? "Leave your best prayers and wishes" : "Tinggalkan doa dan ucapan terbaik Anda"),
    submit: (tc.wishes_submit || "").trim() || (lang === "en" ? "Submit now" : "Kirim sekarang"),
    empty: (tc.wishes_empty || "").trim() || (lang === "en" ? "No wishes yet. Be the first." : "Belum ada ucapan. Jadilah yang pertama."),
  }

  const target = useMemo(
    () => countdownTarget(events, profile.estimated_wedding_date),
    [events, profile.estimated_wedding_date]
  )
  const calendarUrl = useMemo(
    () => gcalLink(events[0], groomName, brideName),
    [events, groomName, brideName]
  )

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
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
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const frame = window.requestAnimationFrame(() => {
      root.querySelectorAll<HTMLElement>("[data-ll-load]").forEach((el) => el.classList.add("is-in"))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-ll-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [
    opened,
    stories.length,
    rundown.length,
    honored.length,
    accounts.length,
    events.length,
    giftTab,
  ])

  useEffect(() => {
    document.body.classList.toggle("ll-locked", !opened)
    return () => document.body.classList.remove("ll-locked")
  }, [opened])

  const showTabs = accounts.length > 0 && !!giftAddress
  const activeGiftTab = showTabs ? giftTab : accounts.length > 0 ? "transfer" : "address"

  return (
    <div ref={rootRef} className={`ll-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="auto" data-warm-audio="" />}

      {!opened && (
        <section className="ll-cover" data-section="sampul" aria-label="Open the invitation">
          <div className="ll-cover__inner">
            <p className="ll-cover__kicker" {...ON_LOAD("fade")}>{coverKicker}</p>
            <h1 className="ll-cover__names" {...ON_LOAD("up", 0.08)}>
              <span className="ll-cover__name ll-cover__name--one">{groomName || (lang === "en" ? "The Groom" : "Mempelai Pria")}</span>
              {brideName && (
                <>
                  <span className="ll-cover__amp" aria-hidden="true">&amp;</span>
                  <span className="ll-cover__name ll-cover__name--two">{brideName}</span>
                </>
              )}
            </h1>

            <div className="ll-cover__art" {...ON_LOAD("fade", 0.18)}>
              <img className="ll-cover__couple ll-art--white" src={ART("cover-couple")} alt="" aria-hidden="true" draggable={false} />
              <span className="ll-heart-doodle ll-cover__heart ll-cover__heart--a" aria-hidden="true" />
              <span className="ll-heart-doodle ll-cover__heart ll-cover__heart--b" aria-hidden="true" />
              <span className="ll-cover__hand" aria-hidden="true">better together</span>
            </div>

            <p className="ll-cover__to" {...ON_LOAD("fade", 0.3)}>{coverGuestLabel}</p>
            <p className="ll-cover__guest" {...ON_LOAD("fade", 0.34)}>{guestName}</p>
            <button type="button" className="ll-open" onClick={openInvitation} {...ON_LOAD("up", 0.4)}>
              <span className="ll-open__arrow" aria-hidden="true">→</span>
              {openLabel}
            </button>
            {hashtag && <p className="ll-cover__hashtag" {...ON_LOAD("fade", 0.44)}>{hashtag}</p>}
            {apology && <p className="ll-cover__apology" {...ON_LOAD("fade", 0.46)}>{apology}</p>}
          </div>
        </section>
      )}

      {opened && (
        <main className="ll-page">
          {/* 3/4 — welcome + kalimat pembuka */}
          <section className="ll-section ll-welcome" data-section="pembuka" aria-label="Welcome">
            <p className="ll-kicker" {...IN("up")}>{openingKicker}</p>
            <div className="ll-welcome__art" {...IN("fade", 0.06)}>
              <img className="ll-art ll-art--blend ll-welcome__bench" src={ART("welcome-bench")} alt="" aria-hidden="true" draggable={false} />
              <span className="ll-heart-doodle ll-welcome__heart" aria-hidden="true" />
            </div>
            {openingTitle && <p className="ll-script ll-script--sm" {...IN("up", 0.08)}>{openingTitle}</p>}
            <p className="ll-body" {...IN("fade", 0.1)}>{openingDescription}</p>
            {quoteText && (
              <blockquote className="ll-quote" {...IN("fade", 0.14)}>
                <p>{quoteText}</p>
                {profile.quote_source && <cite>{profile.quote_source}</cite>}
              </blockquote>
            )}
          </section>

          {/* 5 — mempelai */}
          <section className="ll-section ll-people" data-section="mempelai" aria-label="The couple">
            <p className="ll-kicker" {...IN("up")}>{mempelaiKicker}</p>
            <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>{mempelaiTitle}</h2>

            {groomFull && (
              <article className="ll-person ll-person--one">
                <span className="ll-note ll-note--one" {...IN("fade", 0.06)}>{personOneLabel}</span>
                <div className="ll-person__art" {...IN("fade", 0.08)}>
                  <img className="ll-art ll-art--blend" src={ART("groom")} alt="" aria-hidden="true" draggable={false} />
                  <span className="ll-heart-doodle ll-person__heart" aria-hidden="true" />
                </div>
                <h3 className="ll-person__name" {...IN("up", 0.1)}>{groomFull}</h3>
                {profile.groom_parents && (
                  <>
                    <p className="ll-person__label" {...IN("up", 0.12)}>{parentsLabelMale}</p>
                    <p className="ll-person__parents" {...IN("fade", 0.14)}>{profile.groom_parents}</p>
                  </>
                )}
                {groomIg && (
                  <a
                    className="ll-pill"
                    href={`https://instagram.com/${groomIg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...IN("up", 0.16)}
                  >
                    <InstagramIcon />
                    @{groomIg}
                  </a>
                )}
              </article>
            )}

            <span className="ll-amp" aria-hidden="true" {...IN("zoom", 0.06)}>&amp;</span>

            {brideFull && (
              <article className="ll-person ll-person--two">
                <span className="ll-note ll-note--two" {...IN("fade", 0.06)}>{personTwoLabel}</span>
                <div className="ll-person__art" {...IN("fade", 0.08)}>
                  <img className="ll-art ll-art--blend" src={ART("bride")} alt="" aria-hidden="true" draggable={false} />
                  <span className="ll-heart-doodle ll-person__heart" aria-hidden="true" />
                </div>
                <h3 className="ll-person__name" {...IN("up", 0.1)}>{brideFull}</h3>
                {profile.bride_parents && (
                  <>
                    <p className="ll-person__label" {...IN("up", 0.12)}>{parentsLabelFemale}</p>
                    <p className="ll-person__parents" {...IN("fade", 0.14)}>{profile.bride_parents}</p>
                  </>
                )}
                {brideIg && (
                  <a
                    className="ll-pill"
                    href={`https://instagram.com/${brideIg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...IN("up", 0.16)}
                  >
                    <InstagramIcon />
                    @{brideIg}
                  </a>
                )}
              </article>
            )}
          </section>

          {/* 7/8 — event, venue + countdown */}
          <section className="ll-section ll-events" data-section="acara" aria-label="Date and venue">
            <p className="ll-kicker" {...IN("up")}>{eventsKicker}</p>
            <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>{eventsTitle}</h2>
            {eventsIntro && <p className="ll-body" {...IN("fade", 0.08)}>{eventsIntro}</p>}

            <div className="ll-events__list">
              {events.map((event, index) => (
                <article className="ll-event" key={`${event.name || "e"}-${index}`} {...IN("up", Math.min(0.06 * index, 0.18))}>
                  {event.name && <h3 className="ll-event__name">{event.name}</h3>}
                  <div className="ll-event__row">
                    <img className="ll-icon" src={ART("icon-calendar")} alt="" aria-hidden="true" draggable={false} />
                    <span className="ll-event__value">{formatDotDate(event.date) || formatDotDate(profile.estimated_wedding_date)}</span>
                  </div>
                  {event.time && (
                    <div className="ll-event__row">
                      <img className="ll-icon" src={ART("icon-clock")} alt="" aria-hidden="true" draggable={false} />
                      <span className="ll-event__value">{event.time}</span>
                    </div>
                  )}
                  {(event.venue || event.address) && (
                    <div className="ll-event__row ll-event__row--venue">
                      <img className="ll-icon" src={ART("icon-pin")} alt="" aria-hidden="true" draggable={false} />
                      <div className="ll-event__place">
                        {event.venue && <span className="ll-event__value">{event.venue}</span>}
                        {event.address && <span className="ll-event__address">{event.address}</span>}
                      </div>
                    </div>
                  )}
                  {event.maps_url && (
                    <a className="ll-map" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                      <span aria-hidden="true">◎</span>
                      {mapsLabel}
                    </a>
                  )}
                </article>
              ))}
            </div>

            {target && (
              <div className="ll-countdown" {...IN("up", 0.1)}>
                <p className="ll-note ll-countdown__label">{countdownIntro}</p>
                <Clock target={target} />
              </div>
            )}

            {calendarUrl && (
              <a className="ll-calendar" href={calendarUrl} target="_blank" rel="noopener noreferrer" {...IN("up", 0.12)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 2v3M17 2v3M3.5 9.5h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
                  <path d="M8 13h2M14 13h2M8 17h2M14 17h2" />
                </svg>
                {calendarLabel}
              </a>
            )}
          </section>

          {/* 9 — turut mengundang (ADDED in the reference's own language) */}
          {honored.length > 0 && (
            <section className="ll-section ll-inviting" data-section="inviting" aria-label="With honour">
              <p className="ll-kicker" {...IN("up")}>{invitingKicker}</p>
              <h2 className="ll-script ll-script--md" {...IN("up", 0.04)}>{invitingTitle}</h2>
              {invitingIntro && <p className="ll-body" {...IN("fade", 0.08)}>{invitingIntro}</p>}
              <img className="ll-art ll-art--white ll-inviting__art" src={ART("confirm-lineup")} alt="" aria-hidden="true" draggable={false} />
              <ul className="ll-family">
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`} {...IN("fade", Math.min(0.05 * index, 0.25))}>{family}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 10 — rundown */}
          {rundown.length > 0 && (
            <section className="ll-section ll-rundown" data-section="rundown" aria-label="Schedule">
              <p className="ll-kicker" {...IN("up")}>{rundownKicker}</p>
              <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>{rundownTitle}</h2>
              {rundownIntro && <p className="ll-body" {...IN("fade", 0.08)}>{rundownIntro}</p>}
              <ol className="ll-schedule">
                {rundown.map((item, index) => (
                  <li className="ll-schedule__row" key={`${item.time || "r"}-${index}`} {...IN("up", Math.min(0.04 * index, 0.24))}>
                    {item.time && <span className="ll-schedule__time">{item.time}</span>}
                    {item.description && <span className="ll-schedule__text">{item.description}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 6 — story */}
          {stories.length > 0 && (
            <section className="ll-section ll-story" data-section="story" aria-label="Our story">
              <p className="ll-kicker" {...IN("up")}>{storyKicker}</p>
              <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>{storyTitle}</h2>
              {storyIntro && <p className="ll-body" {...IN("fade", 0.08)}>{storyIntro}</p>}
              <div className="ll-story__list">
                {stories.map((story, index) => {
                  const art = storyArtAt(index)
                  return (
                  <article className={`ll-story__item${index % 2 ? " is-right" : ""}${art ? "" : " is-text"}`} key={`${story.title || "s"}-${index}`}>
                    {art && (
                      <div className="ll-story__art" {...IN("fade")}>
                        <img className="ll-art ll-art--blend" src={ART(art)} alt="" aria-hidden="true" draggable={false} />
                      </div>
                    )}
                    <div className="ll-story__copy">
                      {story.title && <h3 className="ll-story__title" {...IN("up", 0.06)}>{story.title}</h3>}
                      {story.description && <p className="ll-story__body" {...IN("fade", 0.1)}>{story.description}</p>}
                    </div>
                    <span className="ll-story__dot" aria-hidden="true" />
                  </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* 11 — decorative illustration gallery (no couple photos) */}
          <section className="ll-section ll-gallery" data-section="galeri" aria-label="Our moments">
            <p className="ll-kicker" {...IN("up")}>{galleryKicker}</p>
            <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>
              {galleryTitle}
              <span className="ll-heart-doodle ll-script__heart" aria-hidden="true" />
            </h2>
            <div className="ll-gallery__grid">
              {GALLERY_ART.map((art, index) => (
                <figure className={`ll-gallery__item ll-gallery__item--${index + 1}`} key={art} {...IN("fade", Math.min(0.05 * index, 0.2))}>
                  <img className="ll-art ll-art--blend" src={ART(art)} alt="" aria-hidden="true" draggable={false} />
                </figure>
              ))}
            </div>
          </section>

          {/* 13 — gift */}
          {hasGift && (
            <section className="ll-section ll-gift" data-section="gift" aria-label="Wedding gift">
              <h2 className="ll-script ll-script--lg" {...IN("up")}>{giftTitle}</h2>
              {giftIntro && <p className="ll-body" {...IN("fade", 0.08)}>{giftIntro}</p>}

              {showTabs && (
                <div className="ll-tabs" {...IN("up", 0.1)}>
                  <button
                    type="button"
                    className={`ll-tab${activeGiftTab === "transfer" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("transfer")}
                  >
                    {giftTransferLabel}
                  </button>
                  <button
                    type="button"
                    className={`ll-tab${activeGiftTab === "address" ? " is-active" : ""}`}
                    onClick={() => setGiftTab("address")}
                  >
                    {giftAddressLabel}
                  </button>
                </div>
              )}

              {activeGiftTab === "transfer" ? (
                <>
                  <p className="ll-gift__note" {...IN("fade", 0.12)}>{transferNote}</p>
                  <div className="ll-accounts">
                    {accounts.map((a, index) => (
                      <button
                        type="button"
                        className="ll-account"
                        key={`${a.account_number || "a"}-${index}`}
                        onClick={() => copyText(a.account_number || "", accountToast)}
                      >
                        {a.provider_name && <span className="ll-account__bank">{a.provider_name}</span>}
                        {a.account_number && (
                          <span className="ll-account__number">
                            {a.account_number}
                            <span className="ll-account__copy" aria-hidden="true">⧉</span>
                          </span>
                        )}
                        {a.account_name && <span className="ll-account__name">{a.account_name}</span>}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="ll-gift__note" {...IN("fade", 0.12)}>{addressNote}</p>
                  <button
                    type="button"
                    className="ll-account ll-account--address"
                    onClick={() => copyText(giftAddress, addressToast)}
                  >
                    {profile.gift_address_name && <span className="ll-account__bank">{profile.gift_address_name}</span>}
                    <span className="ll-account__name">{giftAddress}</span>
                  </button>
                </>
              )}
            </section>
          )}

          {/* 14 — dress code */}
          {hasDresscode && (
            <section className="ll-section ll-dress" data-section="dresscode" aria-label="Dress code">
              {dressIntro && <p className="ll-body" {...IN("fade")}>{dressIntro}</p>}
              <h2 className="ll-script ll-script--lg" {...IN("up", 0.04)}>
                {profile.dresscode?.title || dressKicker}
              </h2>
              {dressColors.length > 0 && (
                <ul className="ll-swatches">
                  {dressColors.map((c, index) => (
                    <li className="ll-swatch" key={`${c.hex || c.name}-${index}`} {...IN("zoom", Math.min(0.05 * index, 0.2))}>
                      <span className="ll-swatch__dot" style={{ background: c.hex || "transparent" }} aria-hidden="true" />
                      {c.name && <span className="ll-swatch__name">{c.name}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* 15 — wishes */}
          <section className="ll-section ll-wishes" data-section="wishes" aria-label="Prayers and wishes">
            <h2 className="ll-script ll-script--lg" {...IN("up")}>
              {wishesTitle}
              <span className="ll-heart-doodle ll-script__heart" aria-hidden="true" />
            </h2>
            {wishesIntro && <p className="ll-body" {...IN("fade", 0.06)}>{wishesIntro}</p>}
            <div className="ll-wishes__body" {...IN("up", 0.1)}>
              <Wishes
                weddingProfileId={profile.wedding_profile_id}
                guestId={profile.guest_id}
                guestName={profile.guest_name}
                guestLinkStrict={profile.guest_link_strict}
                coupleName={coupleLabel}
                copy={wishCopy}
               language={profile.language} />
            </div>
          </section>

          {/* 16 — closing */}
          <section className="ll-closing" data-section="closing" aria-label="Thank you">
            <img className="ll-art ll-art--white ll-closing__art" src={ART("closing-dance")} alt="" aria-hidden="true" draggable={false} />
            <p className="ll-body" {...IN("fade", 0.08)}>{closingMessage}</p>
            <p className="ll-closing__names" {...IN("up", 0.12)}>
              <span>{groomName}</span>
              {brideName && (
                <>
                  <span className="ll-closing__amp" aria-hidden="true">&amp;</span>
                  <span>{brideName}</span>
                </>
              )}
            </p>
            {hashtag && <p className="ll-closing__hashtag" {...IN("fade", 0.18)}>{hashtag}</p>}
          </section>

          <footer className="ll-footer">
            <a className="ll-footer__link" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Contact Aksaraa Wedding on WhatsApp">
              <span className="ll-footer__badge">
                <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
              </span>
              <span className="ll-footer__cta">Wedding by Aksaraa</span>
            </a>
          </footer>
        </main>
      )}

      {opened && trackUrl && (
        <button
          type="button"
          className={`ll-music${playing ? " is-on" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="ll-music__bar" aria-hidden="true" />
          <span className="ll-music__bar" aria-hidden="true" />
          <span className="ll-music__bar" aria-hidden="true" />
        </button>
      )}

      {toast && <div className="ll-toast" role="status">{toast}</div>}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || (lang === "en" ? "Dear Guest" : "Tamu Undangan")}
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
