"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
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
import "./iris.css"

const ART = (name: string) => `/templates/iris/${name}.webp`

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

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]

function coverDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

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

type Reveal = "fade" | "up" | "zoom"
type RevealProps = { "data-ir-reveal"?: Reveal; "data-ir-load"?: Reveal; style?: CSSProperties }

const IN = (kind: Reveal, delay = 0): RevealProps => ({
  "data-ir-reveal": kind,
  style: { "--ir-delay": `${delay}s` } as CSSProperties,
})
const ON_LOAD = (kind: Reveal, delay = 0): RevealProps => ({
  "data-ir-load": kind,
  style: { "--ir-delay": `${delay}s` } as CSSProperties,
})

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

// "SAVE the DATE": the reference puts the middle word in the script face.
function SaveDateLabel({ text }: { text: string }) {
  const words = text.trim().split(/\s+/)
  if (words.length !== 3) return <span className="ir-save__label">{text}</span>
  return (
    <span className="ir-save__label">
      {words[0]} <em>{words[1]}</em> {words[2]}
    </span>
  )
}

function OvalPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="ir-oval">
      {src ? <img className="ir-oval__photo" src={src} alt={alt} draggable={false} /> : <span className="ir-oval__photo ir-oval__photo--empty" />}
      <img className="ir-oval__frame" src={ART("green-oval")} alt="" aria-hidden="true" draggable={false} />
    </div>
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
    { value: pad2(Math.floor(diff / 86400000)), label: "Hari" },
    { value: pad2(Math.floor((diff % 86400000) / 3600000)), label: "Jam" },
    { value: pad2(Math.floor((diff % 3600000) / 60000)), label: "Menit" },
    { value: pad2(Math.floor((diff % 60000) / 1000)), label: "Detik" },
  ]
  return (
    <div className="ir-clock" aria-label="Hitung mundur menuju hari bahagia">
      {units.map((u) => (
        <div className="ir-clock__cell" key={u.label}>
          <span className="ir-clock__value">{target ? u.value : "--"}</span>
          <small className="ir-clock__label">{u.label}</small>
        </div>
      ))}
    </div>
  )
}

export default function Iris(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [giftOpen, setGiftOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [filmStarted, setFilmStarted] = useState(false)
  const [filmFallback, setFilmFallback] = useState(false)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])

  const baseStill = coverPhotoOf(profile) || gallery[0] || ""
  const coverStill = slots[0] || baseStill
  const welcomeStill = slots[1] || gallery[0] || baseStill
  const closingStill = slots[2] || slots[0] || welcomeStill
  const groomShot = groomPhotoOf(profile.groom_photo_url) || gallery[1] || baseStill
  const brideShot = bridePhotoOf(profile.bride_photo_url) || gallery[2] || groomShot

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
  const dressIntro = (tc.dresscode_intro || profile.dresscode?.description || "").trim()
  const hasDresscode = profile.dresscode_visible !== false && (dressColors.length > 0 || !!dressIntro)

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
  const ytBase = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&playsinline=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`
    : ""
  const filmEmbedUrl = `${ytBase}&controls=1&fs=1`

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const guestName = (profile.guest_name || "").trim() || WISH_ME
  const dateLong = formatLongDate(profile.estimated_wedding_date)
  const dateDotted = dottedDate(profile.estimated_wedding_date)
  const dateShort = coverDate(profile.estimated_wedding_date)
  const dateParts = dateShort.split(" ")
  const mirrorTop = dateParts.slice(0, -1).join(" ")
  const mirrorYear = dateParts[dateParts.length - 1] || ""
  const editorInitials = (profile.couple_initials || "").replace(/[^A-Za-z]/g, "").toUpperCase()
  const initials = editorInitials.slice(0, 2) || initialsOf(groomName, brideName) || "IR"

  const groomIg = igHandle(profile.groom_instagram)
  const brideIg = igHandle(profile.bride_instagram)

  const openingTitle = (profile.opening_title || "").trim() || DEFAULT_OPENING_TITLE
  const openingDescription = (profile.opening_description || "").trim() || DEFAULT_OPENING_DESCRIPTION
  const quoteText = (profile.quote_text || "").trim()
  const closingMessage = (tc.closing_message || "").trim() || DEFAULT_CLOSING

  const coverKicker = (tc.cover_kicker || "").trim() || "The Wedding of"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const apology = (tc.cover_apology || "").trim()
  const openingKicker = (tc.opening_kicker || "").trim() || "Ayat Suci"
  const mempelaiKicker = (tc.mempelai_kicker || "").trim() || "With Love"
  const mempelaiIntro = (tc.profiles_intro || "").trim()
  const parentsLabel = (tc.parents_label || "").trim() || "Anak dari"
  const storyTitle = (tc.love_story_title || "").trim() || "Kisah Cinta"
  const storyIntro = (tc.story_intro || "").trim()
  const saveDateLabel = (tc.save_date_label || "").trim() || "SAVE the DATE"
  const eventsIntro = (tc.events_intro || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "Turut Mengundang"
  const invitingTitle = (tc.inviting_title || "").trim() || "Keluarga & Sahabat"
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownKicker = (tc.rundown_kicker || "").trim() || "Rundown"
  const rundownTitle = (tc.rundown_title || "").trim() || "Rangkaian Acara"
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryTitle = (tc.gallery_title || "").trim() || "Gallery"
  const galleryIntro = (tc.gallery_intro || "").trim()
  const videoTitle = (tc.video_title || "").trim() || "Our Film"
  const videoIntro = (tc.video_intro || "").trim()
  const giftTitle = (tc.gift_intro_title || "").trim() || "Wedding Gift"
  const giftIntro = (tc.gift_intro_description || "").trim()
  const giftButton = (tc.gift_button || "").trim() || "Kirim Hadiah"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dresscode"
  const wishesKicker = (tc.wishes_kicker || "").trim() || "Ucapan & Doa"
  const wishesTitle = (tc.wishes_title || "").trim() || ""
  const wishesIntro = (tc.wishes_intro || "").trim()
  const closingKicker = (tc.closing_kicker || "").trim() || "Terima Kasih"
  const closingSee = (tc.closing_see || "").trim() || "See you on our wedding day!"
  const accountToast = (tc.copy_account_toast || "").trim() || "Nomor rekening disalin"
  const addressToast = (tc.copy_address_toast || "").trim() || "Alamat disalin"

  const wishCopy = {
    nameLabel: (tc.wishes_name_label || "").trim() || "Nama",
    namePlaceholder: (tc.wishes_name_placeholder || "").trim() || "Nama lengkap",
    messageLabel: (tc.wishes_message_label || "").trim() || "Ucapan & Doa",
    messagePlaceholder: (tc.wishes_message_placeholder || "").trim() || "Titipkan pesan dan doa terbaik",
    submit: (tc.wishes_submit || "").trim() || "Kirim Ucapan",
    empty: (tc.wishes_empty || "").trim() || "Belum ada ucapan. Jadilah yang pertama.",
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
    (dir: number) => {
      setLightbox((cur) => (cur === null ? null : (cur + dir + gallery.length) % gallery.length))
    },
    [gallery.length]
  )

  const copyText = useCallback(
    (value: string, message: string) => {
      const done = () => showToast(message)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, done)
        return
      }
      const area = document.createElement("textarea")
      area.value = value
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand("copy")
      } catch {
        /* ignore */
      }
      document.body.removeChild(area)
      done()
    },
    [showToast]
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const frame = window.requestAnimationFrame(() => {
      root.querySelectorAll<HTMLElement>("[data-ir-load]").forEach((el) => el.classList.add("is-in"))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-ir-reveal]"))
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
  }, [stories.length, rundown.length, honored.length, gallery.length, accounts.length, events.length, giftOpen])

  useEffect(() => {
    document.body.classList.toggle("ir-locked", !opened)
    return () => document.body.classList.remove("ir-locked")
  }, [opened])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (gallery.length > 1) {
        if (e.key === "ArrowLeft") stepLightbox(-1)
        if (e.key === "ArrowRight") stepLightbox(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length, stepLightbox])

  const albumCover = stories.find((s) => s.image_url)?.image_url || welcomeStill

  return (
    <div ref={rootRef} className={`ir-root${opened ? " is-open" : ""}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="ir-page">
        {/* 1 — cover gate */}
        <section className={`ir-cover${opened ? " is-open" : ""}`} data-section="sampul" aria-label="Buka undangan">
          {coverStill && <img className="ir-cover__bg" src={ART("iris-cover")} alt="" aria-hidden="true" draggable={false} />}
          <div className="ir-cover__frame">
            <p className="ir-cover__kicker" {...ON_LOAD("fade")}>{coverKicker}</p>
            <h1 className="ir-cover__names" {...ON_LOAD("up", 0.08)}>
              {groomName || "Mempelai"}
              {brideName && (
                <>
                  <span className="ir-cover__and">and</span>
                  {brideName}
                </>
              )}
            </h1>
          </div>
          <div className="ir-cover__foot">
            <p className="ir-cover__to" {...ON_LOAD("fade", 0.22)}>
              Kepada Yth.
              <br />
              Bapak/ Ibu/ Saudara/ i
            </p>
            <p className="ir-cover__guest" {...ON_LOAD("fade", 0.26)}>{guestName}</p>
            <button type="button" className="ir-btn ir-btn--gold" onClick={openInvitation} {...ON_LOAD("up", 0.32)}>
              {openLabel}
            </button>
            {apology && (
              <p className="ir-cover__apology" {...ON_LOAD("fade", 0.38)}>{apology}</p>
            )}
          </div>
        </section>

        {/* 3/4 — verse / kalimat pembuka */}
        <section className="ir-section ir-verse" data-section="pembuka" aria-label="Salam hangat">
          <img className="ir-verse__top" src={ART("floral-top")} alt="" aria-hidden="true" />
          <div className="ir-verse__oval" {...IN("zoom")}>
            <OvalPhoto src={welcomeStill} alt={coupleLabel} />
          </div>
          {quoteText ? (
            <blockquote className="ir-quote ir-quote--verse" {...IN("fade", 0.08)}>
              <p>{quoteText}</p>
              {profile.quote_source && <cite>{profile.quote_source}</cite>}
            </blockquote>
          ) : (
            <>
              <p className="ir-kicker" {...IN("up", 0.06)}>{openingKicker}</p>
              {openingTitle && <h2 className="ir-script ir-script--md" {...IN("up", 0.08)}>{openingTitle}</h2>}
              <p className="ir-body" {...IN("fade", 0.12)}>{openingDescription}</p>
            </>
          )}
        </section>

        {/* 5 — mempelai */}
        <section className="ir-section ir-people" data-section="mempelai" aria-label="Mempelai">
          <img className="ir-people__drape" src={ART("closing-drape")} alt="" aria-hidden="true" />
          <div className="ir-people__head">
            <img className="ir-people__dove" src={ART("dove")} alt="" aria-hidden="true" />
            <p className="ir-people__kicker">{mempelaiKicker}</p>
            {mempelaiIntro && (
              <p className="ir-body" {...IN("fade", 0.06)}>{mempelaiIntro}</p>
            )}
          </div>
          {[
            { key: "bride", name: profile.bride_full_name || brideName, photo: brideShot, parents: profile.bride_parents, ig: brideIg },
            { key: "groom", name: profile.groom_full_name || groomName, photo: groomShot, parents: profile.groom_parents, ig: groomIg },
          ]
            .filter((p) => !!p.name)
            .map((person, index) => (
              <article className={`ir-person ir-person--${person.key}`} key={person.key}>
                <div className="ir-person__portrait" {...IN("fade")}>
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} draggable={false} />
                  ) : (
                    <span className="ir-person__empty" aria-hidden="true" />
                  )}
                  <img className="ir-person__corner" src={ART(index % 2 ? "floral-corner-b" : "floral-corner-a")} alt="" aria-hidden="true" />
                </div>
                <h3 className="ir-person__name" {...IN("up", 0.06)}>{person.name}</h3>
                {person.parents && (
                  <>
                    <p className="ir-person__label" {...IN("up", 0.1)}>{parentsLabel}</p>
                    <p className="ir-person__parents" {...IN("fade", 0.12)}>{person.parents}</p>
                  </>
                )}
                {person.ig && (
                  <a
                    className="ir-pill ir-pill--ig"
                    href={`https://instagram.com/${person.ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...IN("up", 0.16)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.7-.3.3-.5.7-.7 1.2-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.7 1.2.3.3.7.5 1.2.7.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.7.3-.3.5-.7.7-1.2.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1a3.2 3.2 0 0 0-.7-1.2 3.2 3.2 0 0 0-1.2-.7c-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.2-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                    </svg>
                    @{person.ig}
                  </a>
                )}
                {index === 0 && (
                  <span className="ir-people__amp" aria-hidden="true">&amp;</span>
                )}
              </article>
            ))}
        </section>

        {/* 6 — story */}
        {stories.length > 0 && (
          <section className="ir-section ir-story" data-section="story" aria-label="Kisah kami">
            <h2 className="ir-script" {...IN("up")}>{storyTitle}</h2>
            {storyIntro && <p className="ir-body" {...IN("fade", 0.08)}>{storyIntro}</p>}
            <div className="ir-story__list">
              {stories.map((story, index) => (
                <article className={`ir-story__item${index % 2 ? " is-right" : ""}`} key={`${story.title || "s"}-${index}`}>
                  {story.image_url && (
                    <div className="ir-story__photo" {...IN("fade")}>
                      <img src={story.image_url} alt={story.title || ""} draggable={false} />
                    </div>
                  )}
                  {story.title && <h3 className="ir-story__title" {...IN("up", 0.08)}>{story.title}</h3>}
                  {story.description && <p className="ir-story__body" {...IN("fade", 0.14)}>{story.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 7/8 — save date, countdown, event */}
        <section className="ir-section ir-save" data-section="acara" aria-label="Jadwal acara">
          <div className="ir-save__stage" {...IN("fade")}>
            <img className="ir-save__envelope" src={ART("envelope")} alt="" aria-hidden="true" />
            {coverStill && <img className="ir-save__photo ir-save__photo--a" src={coverStill} alt="" aria-hidden="true" />}
            {welcomeStill && <img className="ir-save__photo ir-save__photo--b" src={welcomeStill} alt="" aria-hidden="true" />}
            <img className="ir-save__dove" src={ART("dove")} alt="" aria-hidden="true" />
            <div className="ir-save__mirror">
              <img src={ART("mirror")} alt="" aria-hidden="true" />
              <span className="ir-save__mirrorDate">
                {mirrorTop}
                {mirrorYear && (
                  <>
                    <br />
                    {mirrorYear}
                  </>
                )}
              </span>
            </div>
            <div className="ir-save__heart">
              <img src={ART("heart-lace")} alt="" aria-hidden="true" />
              <span className="ir-save__heartNames">{coupleLabel}</span>
            </div>
            <img className="ir-save__umbrellas" src={ART("umbrellas")} alt="" aria-hidden="true" />
          </div>

          <p className="ir-save__heading" {...IN("up")}>
            <SaveDateLabel text={saveDateLabel} />
          </p>
          {target && <div {...IN("up", 0.08)}><Clock target={target} /></div>}

          <div className="ir-events">
            {eventsIntro && <p className="ir-body" {...IN("fade", 0.1)}>{eventsIntro}</p>}
            {events.map((event, index) => (
              <article className="ir-event" key={`${event.name || "e"}-${index}`}>
                {event.name && <h3 className="ir-event__name" {...IN("up")}>{event.name}</h3>}
                {event.date && <p className="ir-event__date" {...IN("fade", 0.04)}>{formatLongDate(event.date)}</p>}
                {event.time && <p className="ir-event__time" {...IN("fade", 0.06)}>{event.time}</p>}
                {event.venue && <p className="ir-event__venue" {...IN("up", 0.08)}>{event.venue}</p>}
                {event.address && <p className="ir-event__address" {...IN("fade", 0.1)}>{event.address}</p>}
                {event.maps_url && (
                  <a className="ir-btn ir-btn--gold ir-btn--sm" href={event.maps_url} target="_blank" rel="noopener noreferrer" {...IN("up", 0.12)}>
                    {mapsLabel}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 9 — inviting */}
        {honored.length > 0 && (
          <section className="ir-section ir-inviting" data-section="inviting" aria-label="Turut mengundang">
            <img className="ir-corner ir-corner--left" src={ART("floral-corner-a")} alt="" aria-hidden="true" />
            <p className="ir-script ir-script--sm" {...IN("up")}>{invitingKicker}</p>
            <h2 className="ir-script ir-script--md" {...IN("up", 0.04)}>{invitingTitle}</h2>
            {invitingIntro && <p className="ir-body" {...IN("fade", 0.08)}>{invitingIntro}</p>}
            <ul className="ir-family">
              {honored.map((family, index) => (
                <li key={`${family}-${index}`} {...IN("fade", Math.min(0.05 * index, 0.25))}>{family}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 10 — rundown */}
        {rundown.length > 0 && (
          <section className="ir-section ir-rundown" data-section="rundown" aria-label="Rundown acara">
            <p className="ir-kicker" {...IN("up")}>{rundownKicker}</p>
            <h2 className="ir-script ir-script--md" {...IN("up", 0.04)}>{rundownTitle}</h2>
            {rundownIntro && <p className="ir-body" {...IN("fade", 0.08)}>{rundownIntro}</p>}
            <ol className="ir-timeline">
              {rundown.map((item, index) => (
                <li className="ir-timeline__row" key={`${item.time || "r"}-${index}`} {...IN("up", Math.min(0.04 * index, 0.24))}>
                  {item.time && <span className="ir-timeline__time">{item.time}</span>}
                  <span className="ir-timeline__dot" aria-hidden="true" />
                  {item.description && <span className="ir-timeline__text">{item.description}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 11 — gallery */}
        {gallery.length > 0 && (
          <section className="ir-section ir-gallery" data-section="galeri" aria-label="Galeri foto">
            <h2 className="ir-script ir-script--xl">{galleryTitle}</h2>
            {galleryIntro && <p className="ir-body" {...IN("fade", 0.08)}>{galleryIntro}</p>}
            <div className={`ir-gallery__grid${gallery.length === 1 ? " is-single" : ""}`}>
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className="ir-gallery__item"
                  key={`${photo}-${index}`}
                  onClick={() => setLightbox(index)}
                  aria-label={`Foto ${index + 1}`}
                  {...IN("fade", Math.min(0.04 * index, 0.2))}
                >
                  <img src={photo} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 12 — film */}
        {hasVideo && film && (
          <section className="ir-section ir-film" data-section="video" aria-label="Film pernikahan">
            <p className="ir-kicker" {...IN("up")}>{videoTitle}</p>
            {videoIntro && <p className="ir-body" {...IN("fade", 0.08)}>{videoIntro}</p>}
            <div className="ir-film__inline" {...IN("up", 0.1)}>
              <div className="ir-film__media">
                {film.kind === "file" ? (
                  <video
                    src={film.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                    poster={albumCover}
                    onPlaying={() => setFilmStarted(true)}
                  />
                ) : youtubeId ? (
                  filmFallback ? (
                    <iframe
                      className="ir-film__iframe"
                      src={filmEmbedUrl}
                      title={videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <AutoplayYouTube videoId={youtubeId} title={videoTitle} controls autoplay onPlay={() => setFilmStarted(true)} />
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
              {coverStill && !filmStarted && <img className="ir-film__poster" src={coverStill} alt="" aria-hidden="true" />}
              {!filmStarted && (
                <button
                  type="button"
                  className="ir-play"
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

        {/* 13 — gift */}
        {hasGift && (
          <section className="ir-section ir-gift" data-section="gift" aria-label="Tanda kasih">
            <img className="ir-gift__flower" src={ART("flower")} alt="" aria-hidden="true" />
            <h2 className="ir-script ir-script--md" {...IN("up")}>{giftTitle}</h2>
            {giftIntro && <p className="ir-body" {...IN("fade", 0.08)}>{giftIntro}</p>}
            <button
              type="button"
              className="ir-btn ir-btn--gold"
              onClick={() => setGiftOpen((o) => !o)}
              aria-expanded={giftOpen}
              {...IN("up", 0.12)}
            >
              {giftButton}
            </button>
            {giftOpen && (
              <div className="ir-gift__details">
                {accounts.map((a, index) => (
                  <button
                    type="button"
                    className="ir-account"
                    key={`${a.account_number || "a"}-${index}`}
                    onClick={() => copyText(a.account_number || "", accountToast)}
                    {...IN("up", Math.min(0.05 * index, 0.2))}
                  >
                    {a.provider_name && <span className="ir-account__bank">{a.provider_name}</span>}
                    {a.account_number && <span className="ir-account__number">{a.account_number}</span>}
                    {a.account_name && <span className="ir-account__name">{a.account_name}</span>}
                  </button>
                ))}
                {giftAddress && (
                  <button type="button" className="ir-account ir-account--address" onClick={() => copyText(giftAddress, addressToast)} {...IN("up", 0.08)}>
                    {profile.gift_address_name && <span className="ir-account__bank">{profile.gift_address_name}</span>}
                    <span className="ir-account__name">{giftAddress}</span>
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* 14 — dresscode */}
        {hasDresscode && (
          <section className="ir-section ir-dress" data-section="dresscode" aria-label="Dress code">
            <h2 className="ir-script ir-script--md" {...IN("up")}>{dressKicker}</h2>
            {dressIntro && <p className="ir-body" {...IN("fade", 0.08)}>{dressIntro}</p>}
            {dressColors.length > 0 && (
              <ul className="ir-swatches">
                {dressColors.map((c, index) => (
                  <li className="ir-swatch" key={`${c.hex || c.name}-${index}`} {...IN("up", Math.min(0.05 * index, 0.2))}>
                    <span className="ir-swatch__dot" style={{ background: c.hex || "transparent" }} aria-hidden="true" />
                    {c.name && <span className="ir-swatch__name">{c.name}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 15 — wishes */}
        <section className="ir-section ir-wishes" data-section="wishes" aria-label="Ucapan dan doa">
          <img className="ir-wishes__curve" src={ART("curve-divider")} alt="" aria-hidden="true" />
          <img className="ir-wishes__floral" src={ART("floral-corner-a")} alt="" aria-hidden="true" />
          <p className="ir-script ir-script--lg" {...IN("up")}>{wishesKicker}</p>
          {wishesTitle && <p className="ir-kicker" {...IN("up", 0.04)}>{wishesTitle}</p>}
          {wishesIntro && <p className="ir-body" {...IN("fade", 0.08)}>{wishesIntro}</p>}
          <div className="ir-wishes__body" {...IN("up", 0.12)}>
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

        {/* 16 — closing */}
        <section className="ir-closing" data-section="closing" aria-label="Penutup">
          <div className="ir-closing__oval" {...IN("zoom")}>
            {closingStill ? <img src={closingStill} alt="" aria-hidden="true" /> : null}
          </div>
          <p className="ir-body" {...IN("fade", 0.08)}>{closingMessage}</p>
          <p className="ir-closing__see" {...IN("up", 0.12)}>{closingSee}</p>
          <p className="ir-closing__names" {...IN("up", 0.16)}>{coupleLabel}</p>
          <img className="ir-closing__garden" src={ART("closing-garden")} alt="" aria-hidden="true" />
        </section>

        <footer className="ir-footer">
          <a className="ir-footer__link" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Hubungi Aksaraa Wedding via WhatsApp">
            <span className="ir-footer__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
            </span>
            <span className="ir-footer__cta">Wedding by Aksaraa</span>
          </a>
          <p className="ir-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
        </footer>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className={`ir-music${playing ? " is-on" : " is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
          aria-pressed={playing}
        >
          <span className="ir-music__bar" aria-hidden="true" />
          <span className="ir-music__bar" aria-hidden="true" />
          <span className="ir-music__bar" aria-hidden="true" />
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="ir-lightbox" role="dialog" aria-modal="true" aria-label="Penampil foto" onClick={() => setLightbox(null)}>
          <button type="button" className="ir-lightbox__close" aria-label="Tutup" onClick={() => setLightbox(null)}>×</button>
          {gallery.length > 1 && (
            <button type="button" className="ir-lightbox__nav ir-lightbox__nav--prev" aria-label="Foto sebelumnya" onClick={(e) => { e.stopPropagation(); stepLightbox(-1) }}>‹</button>
          )}
          <img src={gallery[lightbox]} alt="" onClick={(e) => e.stopPropagation()} />
          {gallery.length > 1 && (
            <button type="button" className="ir-lightbox__nav ir-lightbox__nav--next" aria-label="Foto berikutnya" onClick={(e) => { e.stopPropagation(); stepLightbox(1) }}>›</button>
          )}
          <span className="ir-lightbox__count" aria-hidden="true">{lightbox + 1} / {gallery.length}</span>
        </div>
      )}

      {toast && <div className="ir-toast" role="status">{toast}</div>}

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
          anchor="center"
        />
      )}
    </div>
  )
}
