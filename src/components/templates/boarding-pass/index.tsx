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
  initialsOf,
  videoSource,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./boarding-pass.css"

const DEFAULT_OPENING_TITLE = "Salam Hangat"
const DEFAULT_OPENING_DESCRIPTION =
  "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk ikut serta dalam perjalanan paling berarti bagi kami: hari pernikahan kami."
const DEFAULT_CLOSING =
  "Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari perjalanan kami."

const pad2 = (n: number) => String(n).padStart(2, "0")

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// "11 . 12 . 26" — the reference's ticket date.
function shortDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${pad2(d.getDate())} . ${pad2(d.getMonth() + 1)} . ${String(d.getFullYear()).slice(-2)}`
}

// "11 December 2026" — the departure-board style long date.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
function longDate(value?: string | null): string {
  const d = parseDate(value)
  if (!d) return ""
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function igHandle(raw?: string): string {
  const t = (raw || "").trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) {
    const tail = t.replace(/\/+$/, "").split("/").pop() || ""
    return tail.replace(/^@/, "")
  }
  return t.replace(/^@/, "")
}

// Machine-readable zone: P<IDN<<NAME<<<<… padded to a fixed width so the line
// looks printed rather than typed.
function mrzLine(name: string): string {
  const base = `P<IDN<<${(name || "").toUpperCase().replace(/[^A-Z ]/g, "").replace(/ +/g, "<")}`
  return base.padEnd(44, "<").slice(0, 44)
}

function leadingYear(title?: string): string {
  const m = (title || "").match(/\b(19|20)\d{2}\b/)
  return m ? m[0] : ""
}

// Reference ornaments, vendored from the preset's own art set.
const ART = (name: string) => `/templates/boarding-pass/${name}.webp`

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
    <div className="bp-flaps" aria-label="Hitung mundur menuju hari bahagia">
      {units.map((unit) => (
        <div className="bp-flap" key={unit.label}>
          <span className="bp-flap__digits">{target ? unit.value : "--"}</span>
          <span className="bp-flap__label">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function BoardingPass(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [giftTab, setGiftTab] = useState<"accounts" | "address">("accounts")
  const [toast, setToast] = useState("")
  const [ratios, setRatios] = useState<Record<number, string>>({})

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const gallery = useMemo(() => flattenPhotos(profile.gallery_photos), [profile.gallery_photos])
  const slots = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])

  const baseStill = coverPhotoOf(profile) || gallery[0] || ""
  const coverStill = slots[0] || baseStill
  const heroStill = slots[1] || gallery[0] || baseStill
  const closingStill = slots[2] || gallery[gallery.length - 1] || heroStill

  const groomShot = groomPhotoOf(profile.groom_photo_url) || heroStill
  const brideShot = bridePhotoOf(profile.bride_photo_url) || heroStill

  const events = useMemo(() => (profile.sessions || []).filter(Boolean), [profile.sessions])
  const stories = useMemo(
    () => (profile.stories || []).filter((story) => story && (story.title || story.description)),
    [profile.stories]
  )
  const rundown =
    profile.rundown_visible !== false ? (profile.rundown || []).filter((item) => item && (item.time || item.description)) : []
  const honored =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? (profile.inviting_families || []).filter((family) => !!family && !!family.trim())
      : []
  const dressColors = (profile.dresscode?.colors || []).filter((color) => color && (color.hex || color.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress
  const canSwitchGiftTab = accounts.length > 0 && !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!film
  const openingFilm = film && film.kind === "file" ? film.src : ""
  const youtubeId =
    film && film.kind === "embed" ? (film.src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)?.[1] || "") : ""

  const groomName = (profile.groom_name || "").trim()
  const brideName = (profile.bride_name || "").trim()
  const coupleLabel = [groomName, brideName].filter(Boolean).join(" & ") || "The Wedding"
  const guestName = (profile.guest_name || "").trim() || "Tamu Undangan"
  const dateShort = shortDate(profile.estimated_wedding_date)
  const dateLong = longDate(profile.estimated_wedding_date)
  const firstSession = events[0]
  const initials = initialsOf(groomName, brideName) || "OWL"
  const yearShort = String(parseDate(profile.estimated_wedding_date)?.getFullYear() || "").slice(-2)
  const ticketCode = (tc.cover_kicker || "").trim() || `${initials} ${yearShort} · 01A`.trim()

  const openingTitle = (profile.opening_title || "").trim() || DEFAULT_OPENING_TITLE
  // The reference prints a kicker ("Salam Hangat") and then the couple's own
  // greeting. When the couple has not set one, the default would repeat the
  // kicker, so it is skipped instead of printed twice.
  const greetingLine = openingTitle && openingTitle !== "Salam Hangat" ? openingTitle : ""
  const openingDescription = (profile.opening_description || "").trim() || DEFAULT_OPENING_DESCRIPTION
  const hasQuote = !!((profile.quote_text || "").trim())
  const closingMessage = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const galleryIntro = (tc.gallery_intro || "").trim() || "oleh-oleh dari perjalanan kami"
  const giftIntroTitle = (tc.gift_intro_title || "").trim() || "Tanda Kasih"
  const giftIntro = (tc.gift_intro_description || "").trim()
  const wishesIntro = (tc.wishes_intro || "").trim() || "Titipkan pesan dan doa terbaik untuk perjalanan baru kami."
  const invitingIntro = (tc.inviting_intro || "").trim()
  const apology = (tc.cover_apology || "").trim() || "Tunjukkan tiket ini dengan senyuman."

  const gateOrSeat = (profile.guest_table_number || "").trim()
  const boardingTime = (firstSession?.time || "").trim()
  const destination = (firstSession?.venue || "").trim()

  const countdown = useMemo(() => countdownTarget(events, profile.estimated_wedding_date), [events, profile.estimated_wedding_date])

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    !videoOpen &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2200)
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    const audio = audioRef.current
    if (audio) {
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      )
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true), () => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-bp-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const hidden = lightbox !== null || videoOpen
    window.dispatchEvent(new CustomEvent("aksaraa:floating", { detail: hidden }))
    if (!hidden) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null)
        setVideoOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, videoOpen])

  const stepLightbox = useCallback(
    (delta: number) => {
      setLightbox((current) => {
        if (current === null || gallery.length === 0) return current
        return (current + delta + gallery.length) % gallery.length
      })
    },
    [gallery.length]
  )

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") stepLightbox(1)
      if (event.key === "ArrowLeft") stepLightbox(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, stepLightbox])

  const copy = useCallback(
    (value: string, label: string) => {
      const done = () => showToast(`${label} disalin`)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(done, () => showToast("Gagal menyalin — salin manual"))
        return
      }
      showToast("Penyalinan tidak tersedia di peramban ini")
    },
    [showToast]
  )

  const rootStyle = {
    "--bp-hero": heroStill ? `url("${heroStill}")` : "none",
  } as CSSProperties

  const passengers = [
    {
      key: "groom",
      role: "Mempelai Pria",
      shot: groomShot,
      name: (profile.groom_full_name || groomName).trim(),
      parents: (profile.groom_parents || "").trim(),
      relation: "Putra dari",
      instagram: igHandle(profile.groom_instagram),
    },
    {
      key: "bride",
      role: "Mempelai Wanita",
      shot: brideShot,
      name: (profile.bride_full_name || brideName).trim(),
      parents: (profile.bride_parents || "").trim(),
      relation: "Putri dari",
      instagram: igHandle(profile.bride_instagram),
    },
  ].filter((person) => person.name)

  return (
    <div
      ref={rootRef}
      className={`bp-root${opened ? " is-open" : " is-locked"}`}
      style={rootStyle}
      data-template="boarding-pass"
    >
      {trackUrl && (
        <audio ref={audioRef} src={trackUrl} loop preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}

      <div className="bp-col">
      {/* 1 — cover: the couple's photograph, a wash, and one boarding pass. */}
      {!opened && (
        <section className="bp-cover" data-section="sampul" aria-label="Buka undangan">
          {coverStill && <img className="bp-cover__photo" src={coverStill} alt="" aria-hidden="true" />}
          <span className="bp-cover__wash" aria-hidden="true" />

          <div className="bp-pass bp-pass--top">
            <div className="bp-pass__head">
              <span className="bp-micro bp-micro--teal">Boarding Pass</span>
              <span className="bp-micro">Kelas VIP</span>
            </div>
            <span className="bp-pass__rule" aria-hidden="true" />

            <div className="bp-pass__duo">
              <span className="bp-micro">Dari</span>
              <span className="bp-micro bp-pass__right">Tujuan</span>
            </div>
            <div className="bp-pass__names">
              <span className="bp-pass__name">{groomName || "Mempelai"}</span>
              <span className="bp-pass__name bp-pass__right">{brideName || "Mempelai"}</span>
            </div>
            <div className="bp-route" aria-hidden="true">
              <span className="bp-route__amp">&amp;</span>
            </div>

            <div className="bp-pass__duo" style={{ marginTop: "3.4cqw" }}>
              <span className="bp-micro">Penumpang</span>
            </div>
            <p className="bp-pass__guest">{guestName}</p>

            <div className="bp-pass__duo">
              <span className="bp-micro">Tanggal</span>
              <span className="bp-micro bp-pass__right">Gerbang</span>
            </div>
            <div className="bp-pass__row">
              <span className="bp-pass__value">{dateShort}</span>
              <span className="bp-pass__script bp-pass__right">{gateOrSeat || "Pelaminan"}</span>
            </div>

            <div className="bp-pass__duo">
              <span className="bp-micro">Boarding</span>
              <span className="bp-micro bp-pass__right">Tujuan</span>
            </div>
            <div className="bp-pass__row">
              <span className="bp-pass__value">{boardingTime || "08.00 WIB"}</span>
              <span className="bp-pass__script bp-pass__right">{destination || coupleLabel}</span>
            </div>

            <p className="bp-pass__note">{apology}</p>
          </div>

          <div className="bp-pass bp-pass--stub">
            <span className="bp-micro bp-micro--teal bp-pass__center">Undangan Pernikahan</span>
            <span className="bp-pass__barcode" aria-hidden="true" />
            <span className="bp-micro bp-pass__center">{ticketCode}</span>
            <button type="button" className="bp-btn bp-pass__open" onClick={openInvitation}>
              Buka Undangan
            </button>
          </div>
        </section>
      )}

        {/* 2/3 — hero: stacked names, oversized ampersand, torn paper edge. */}
        <section className="bp-hero" data-section="hero" aria-label="Undangan pernikahan">
          {heroStill && <img className="bp-hero__photo" src={heroStill} alt="" aria-hidden="true" />}
          {profile.couple_illustration_url && (
            <img
              className="bp-hero__cutout"
              src={profile.couple_illustration_url}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          )}
          <div className="bp-hero__wash" aria-hidden="true" />
          <div className="bp-hero__body">
            <p className="bp-hero__kicker">Pernikahan</p>
            <h1 className="bp-hero__names">
              {groomName || "Mempelai"}
              <span className="bp-hero__amp">&amp;</span>
              {brideName || "Mempelai"}
            </h1>
            {dateShort && <p className="bp-hero__date">{dateShort}</p>}
            <p className="bp-hero__script">tujuan akhir: hari bahagia kami</p>
          </div>
          <span className="bp-hero__wave" aria-hidden="true" />
        </section>

        {/* 4 — welcome: centred stack with a corner ornament either side. */}
        <section className="bp-welcome" data-section="welcome" aria-label="Salam hangat">
          <img className="bp-welcome__sprig bp-welcome__sprig--l" src={ART("palm")} alt="" aria-hidden="true" loading="lazy" />
          <img className="bp-welcome__sprig bp-welcome__sprig--r" src={ART("hibiscus")} alt="" aria-hidden="true" loading="lazy" />
          <div className="bp-welcome__inner">
            <p className="bp-welcome__kicker">Salam Hangat</p>
            {greetingLine && <p className="bp-welcome__greeting">{greetingLine}</p>}
            <p className="bp-welcome__body">{openingDescription}</p>
            <span className="bp-welcome__wave" aria-hidden="true" />
            {hasQuote && (
              <>
                <p className="bp-welcome__verse">&ldquo;{profile.quote_text}&rdquo;</p>
                {profile.quote_source && <p className="bp-welcome__source">{profile.quote_source}</p>}
              </>
            )}
            {dateLong && <p className="bp-welcome__date">{dateLong}</p>}
            <span className="bp-welcome__tail" aria-hidden="true" />
          </div>
        </section>

        {/* 5 — mempelai as a passenger manifest with passport cards. */}
        {passengers.length > 0 && (
          <section className="bp-section bp-section--flush" data-section="mempelai" aria-label="Daftar penumpang">
            <div className="bp-manifest">
              <div className="bp-manifest__head">
                <p className="bp-mono bp-mono--teal">Daftar Penumpang</p>
                <h2 className="bp-title">Kedua Mempelai</h2>
              </div>

              {passengers.map((person, index) => (
                <article className={`bp-passport bp-passport--${index === 0 ? "a" : "b"}`} key={person.key}>
                  <span className="bp-passport__no">Penumpang {pad2(index + 1)}</span>
                  <span className="bp-passport__role">{person.role}</span>
                  <span className="bp-passport__photo">
                    {person.shot && <img src={person.shot} alt={person.name} loading="lazy" />}
                  </span>
                  <span className="bp-passport__label" style={{ top: "18.67%" }}>
                    Nama Lengkap
                  </span>
                  <h3 className="bp-passport__name">{person.name}</h3>
                  {person.parents && (
                    <>
                      <span className="bp-passport__label" style={{ top: "44.67%" }}>
                        {person.relation}
                      </span>
                      <p className="bp-passport__parents">{person.parents}</p>
                    </>
                  )}
                  <p className="bp-passport__mrz">{mrzLine(person.name)}</p>
                  {person.instagram && (
                    <a
                      className="bp-btn bp-passport__ig"
                      href={`https://instagram.com/${person.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{person.instagram}
                    </a>
                  )}
                </article>
              ))}

              <span className="bp-manifest__amp" aria-hidden="true">
                &amp;
              </span>
            </div>
          </section>
        )}

        {/* 6 — love story as stamped postcards. */}
        {stories.length > 0 && (
          <section className="bp-section bp-section--flush" data-section="story" aria-label="Kisah kami">
            <div className="bp-storylist">
              <img className="bp-storylist__orn" src={ART("sprig")} alt="" aria-hidden="true" loading="lazy" />
              <div className="bp-storylist__head">
                <p className="bp-mono bp-mono--teal">Kisah Kami</p>
                <h2 className="bp-title">Catatan Perjalanan</h2>
              </div>

              {stories.slice(0, 3).map((story, index) => {
                const slot = ["a", "b", "c"][index] as "a" | "b" | "c"
                const year = leadingYear(story.title)
                const title = year ? (story.title || "").replace(year, "").replace(/^[\s·—-]+/, "").trim() : story.title
                const photo = story.image_url || gallery[index % Math.max(1, gallery.length)]
                return (
                  <div key={`${story.title || "story"}-${index}`} style={{ display: "contents" }}>
                    <div className={`bp-stamp bp-stamp--${slot}`}>
                      {photo && <img className="bp-stamp__photo" src={photo} alt="" loading="lazy" />}
                      <span className={`bp-stamp__postmark bp-stamp__postmark--${slot === "b" ? "r" : "l"}`}>
                        <span className="bp-stamp__year">{year || String(index + 1).padStart(2, "0")}</span>
                      </span>
                    </div>
                    <div className={`bp-story__copy bp-story__copy--${slot}`}>
                      <h3 className="bp-story__title">{title || "Perjalanan Kami"}</h3>
                      {story.description && <p className="bp-story__text">{story.description}</p>}
                    </div>
                  </div>
                )
              })}

              <p className="bp-storylist__end">…dan perjalanan kami baru saja dimulai.</p>
            </div>
          </section>
        )}

        {/* 7 — events as flight cards with a gate/seat stub. */}
        {events.length > 0 && (
          <section className="bp-section bp-section--flush" data-section="acara" aria-label="Itinerary">
            <div className="bp-flights">
              <div className="bp-flights__head">
                <p className="bp-mono bp-mono--teal">Itinerary</p>
                <h2 className="bp-title">Jadwal Keberangkatan</h2>
                <p className="bp-body bp-body--tight" style={{ marginTop: "1.5cqw" }}>
                  Mohon hadir 30 menit sebelum boarding.
                </p>
              </div>

              {events.map((event, index) => (
                <article className={`bp-flight bp-flight--${index === 0 ? "a" : "b"}`} key={`${event.name || "flight"}-${index}`}>
                  <div className="bp-flight__main">
                    <p className="bp-flight__no">Penerbangan {pad2(index + 1)}</p>
                    <h3 className="bp-flight__name">{event.name || "Acara"}</h3>
                    {event.date && <p className="bp-flight__date">{longDate(event.date) || event.date}</p>}
                    {event.time && <p className="bp-flight__time">{event.time}</p>}
                    {event.venue && <p className="bp-flight__venue">{event.venue}</p>}
                    {event.address && <p className="bp-flight__venue">{event.address}</p>}
                    <div className="bp-flight__actions">
                      {event.maps_url && (
                        <a className="bp-btn bp-btn--solid" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                          Lihat Peta
                        </a>
                      )}
                      <a
                        className="bp-btn"
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          (event.name || "Wedding") + " — " + coupleLabel
                        )}${event.date ? `&dates=${event.date.replace(/-/g, "")}/${event.date.replace(/-/g, "")}` : ""}${
                          event.venue ? `&location=${encodeURIComponent(event.venue)}` : ""
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Simpan
                      </a>
                    </div>
                  </div>
                  <div className="bp-flight__stub">
                    <img className="bp-flight__orn" src={ART(index === 0 ? "rings" : "shells")} alt="" aria-hidden="true" loading="lazy" />
                    <span className="bp-flight__stubLabel" style={{ top: "35.2%" }}>
                      Gerbang
                    </span>
                    <span className="bp-flight__stubValue" style={{ top: "41.4%" }}>
                      {gateOrSeat || (index === 0 ? "A1" : "B2")}
                    </span>
                    <span className="bp-flight__stubLabel" style={{ top: "55.9%" }}>
                      Kursi
                    </span>
                    <span className="bp-flight__stubValue" style={{ top: "62.1%", color: "var(--bp-ink)" }}>
                      VIP
                    </span>
                    <span className="bp-flight__barcode" aria-hidden="true" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 8 — countdown as a departure board. */}
        <section className="bp-section bp-section--flush" data-section="countdown" aria-label="Papan keberangkatan">
          <div className="bp-countdown">
            <div className="bp-board">
              <p className="bp-board__label">Papan Keberangkatan</p>
              <h2 className="bp-board__title">Menuju Hari Bahagia</h2>
              <Clock target={countdown} />
              <div className="bp-board__meta">
                <div>
                  <p className="bp-board__metaLabel">Tujuan</p>
                  <p className="bp-board__metaValue">Hari Bahagia</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="bp-board__metaLabel">Status</p>
                  <p className="bp-board__metaValue" style={{ color: "rgb(191, 214, 208)" }}>
                    Tepat Waktu
                  </p>
                </div>
              </div>
              <div className="bp-board__actions">
                <a
                  className="bp-btn bp-btn--onDark"
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    coupleLabel + " Wedding"
                  )}${
                    profile.estimated_wedding_date
                      ? `&dates=${profile.estimated_wedding_date.replace(/-/g, "")}/${profile.estimated_wedding_date.replace(/-/g, "")}`
                      : ""
                  }${firstSession?.venue ? `&location=${encodeURIComponent(firstSession.venue)}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Simpan ke Kalender
                </a>
              </div>
              <p className="bp-board__foot">sampai jumpa di gerbang keberangkatan</p>
            </div>
          </div>
        </section>

        {/* 9 — turut mengundang. */}
        {honored.length > 0 && (
          <section className="bp-section bp-inviting" data-section="inviting" aria-label="Turut mengundang">
            <div className="bp-card" data-bp-reveal>
              <p className="bp-mono bp-mono--teal">Turut Mengundang</p>
              {invitingIntro && <p className="bp-body" style={{ marginTop: 10 }}>{invitingIntro}</p>}
              <ul className="bp-inviting__list">
                {honored.map((family, index) => (
                  <li className="bp-inviting__row" key={`${family}-${index}`}>
                    {family}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 10 — rundown as a departure timetable. */}
        {rundown.length > 0 && (
          <section className="bp-section" data-section="rundown" aria-label="Jadwal acara">
            <div className="bp-head bp-head--left" data-bp-reveal>
              <p className="bp-mono bp-mono--teal">Jadwal Keberangkatan</p>
              <h2 className="bp-title">Run of Show</h2>
            </div>
            <div data-bp-reveal>
              {rundown.map((item, index) => (
                <div className="bp-run" key={`${item.time || "run"}-${index}`}>
                  <span className="bp-run__time">{item.time}</span>
                  <span className="bp-run__text">{item.description}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 11 — album. */}
        {gallery.length > 0 && (
          <section className="bp-section" data-section="galeri" aria-label="Album perjalanan">
            <div className="bp-head" data-bp-reveal>
              <p className="bp-mono bp-mono--teal">Album Perjalanan</p>
              <h2 className="bp-title">Potret Kami</h2>
              <p className="bp-mono" style={{ textTransform: "lowercase", letterSpacing: "1.2px" }}>
                {galleryIntro}
              </p>
            </div>
            <div className="bp-album">
              {gallery.map((photo, index) => (
                <button
                  type="button"
                  className="bp-shot"
                  key={`${photo}-${index}`}
                  onClick={() => setLightbox(index)}
                  aria-label={`Buka foto ${index + 1} dari ${gallery.length}`}
                  style={{ aspectRatio: ratios[index] || "3 / 4" }}
                  data-bp-reveal
                >
                  <img
                    src={photo}
                    alt=""
                    loading="lazy"
                    ref={(img) => {
                      if (!img || !img.naturalWidth || !img.naturalHeight) return
                      const next = `${img.naturalWidth} / ${img.naturalHeight}`
                      setRatios((current) => (current[index] ? current : { ...current, [index]: next }))
                    }}
                    onLoad={(event) => {
                      const img = event.currentTarget
                      if (!img.naturalWidth || !img.naturalHeight) return
                      const next = `${img.naturalWidth} / ${img.naturalHeight}`
                      setRatios((current) => (current[index] ? current : { ...current, [index]: next }))
                    }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 12 — the film. */}
        {hasVideo && (
          <section className="bp-section" data-section="video" aria-label="Dalam perjalanan">
            <div className="bp-head" data-bp-reveal>
              <p className="bp-mono bp-mono--teal">Dalam Perjalanan</p>
              <h2 className="bp-title">Film Kami</h2>
            </div>
            <div className="bp-film" data-bp-reveal>
              <button type="button" className="bp-film__plate" onClick={() => setVideoOpen(true)} aria-label="Putar film">
                {heroStill && <img src={heroStill} alt="" loading="lazy" />}
                <span className="bp-film__stamp" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 3.5v9l7.5-4.5z" />
                  </svg>
                </span>
              </button>
              <p className="bp-film__caption bp-mono">sentuh untuk memutar</p>
            </div>
          </section>
        )}

        {/* 13 — gift. */}
        {hasGift && (
          <section className="bp-section" data-section="gift" aria-label="Tanda kasih">
            <div className="bp-head" data-bp-reveal>
              <p className="bp-mono bp-mono--teal">Tanda Kasih</p>
              <h2 className="bp-title">{giftIntroTitle}</h2>
              {giftIntro && <p className="bp-body">{giftIntro}</p>}
            </div>

            {canSwitchGiftTab && (
              <div className="bp-tabs" role="tablist" aria-label="Cara memberi hadiah">
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "accounts"}
                  className={`bp-tab${giftTab === "accounts" ? " is-active" : ""}`}
                  onClick={() => setGiftTab("accounts")}
                >
                  Transfer
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={giftTab === "address"}
                  className={`bp-tab${giftTab === "address" ? " is-active" : ""}`}
                  onClick={() => setGiftTab("address")}
                >
                  Kirim Hadiah
                </button>
              </div>
            )}

            {accounts.length > 0 && (!canSwitchGiftTab || giftTab === "accounts") && (
              <div>
                {accounts.map((account, index) => (
                  <div className="bp-account" key={`${account.account_number || "account"}-${index}`}>
                    {account.provider_name && <p className="bp-account__bank">{account.provider_name}</p>}
                    <p className="bp-account__no">
                      <span>{account.account_number}</span>
                      {account.account_number && (
                        <button type="button" className="bp-copy" onClick={() => copy(account.account_number || "", "Nomor rekening")}>
                          Salin
                        </button>
                      )}
                    </p>
                    {account.account_name && <p className="bp-account__name">{account.account_name}</p>}
                  </div>
                ))}
              </div>
            )}

            {giftAddress && (!canSwitchGiftTab || giftTab === "address") && (
              <div className="bp-address">
                {profile.gift_address_name && <p className="bp-address__name">{profile.gift_address_name}</p>}
                <p className="bp-address__text">{giftAddress}</p>
                <button type="button" className="bp-copy" style={{ marginTop: 10 }} onClick={() => copy(giftAddress, "Alamat")}>
                  Salin alamat
                </button>
              </div>
            )}
          </section>
        )}

        {/* 14 — dress code, as a baggage tag on a string. */}
        {hasDresscode && (
          <section className="bp-section bp-section--flush" data-section="dresscode" aria-label="Dress code">
            <div className="bp-dress">
              <div className="bp-dress__head">
                <p className="bp-mono bp-mono--teal">Sebelum Berangkat</p>
                <h2 className="bp-title">Dress Code</h2>
              </div>

              <span className="bp-dress__string" aria-hidden="true" />

              <div className="bp-tag">
                <p className="bp-tag__title">{(profile.dresscode?.title || "").trim() || "Dress Code"}</p>
                {profile.dresscode?.description && <p className="bp-tag__body">{profile.dresscode.description}</p>}
                <div className="bp-swatches">
                  {dressColors.map((color, index) => (
                    <div className="bp-swatch" key={`${color.hex || "swatch"}-${index}`}>
                      <span className="bp-swatch__dot" style={{ background: color.hex || "#e9e5de" }} />
                      {color.name && <span className="bp-swatch__name">{color.name}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <img className="bp-dress__orn" src={ART("frond")} alt="" aria-hidden="true" loading="lazy" />
              <p className="bp-dress__note">sentuh label untuk membuka</p>
            </div>
          </section>
        )}

        {/* 15 — wishes. RSVP is the dock. */}
        <section className="bp-section" data-section="wishes" aria-labelledby="bp-wishes-title">
          <div className="bp-head bp-head--left" data-bp-reveal>
            <p className="bp-mono bp-mono--teal">Buku Tamu</p>
            <h2 className="bp-title" id="bp-wishes-title">
              Pesan &amp; Doa
            </h2>
          </div>
          <Wishes
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            guestLinkStrict={profile.guest_link_strict}
            coupleName={coupleLabel}
            intro={wishesIntro}
          />
        </section>

        {/* 16 — closing over the couple's own film. */}
        <section className="bp-closing" data-section="closing" aria-label="Penutup">
          {youtubeId ? (
            <div className="bp-closing__media bp-closing__media--embed">
              <AutoplayYouTube videoId={youtubeId} title={`Film ${coupleLabel}`} autoplay />
            </div>
          ) : film && film.kind === "file" ? (
            <div className="bp-closing__media">
              <video src={film.src} muted autoPlay loop playsInline preload="metadata" />
            </div>
          ) : (
            closingStill && (
              <div className="bp-closing__media">
                <img src={closingStill} alt="" aria-hidden="true" />
              </div>
            )
          )}

          <span className="bp-closing__wash" aria-hidden="true" />
          <span className="bp-closing__wave bp-closing__wave--top" aria-hidden="true" />
          <span className="bp-closing__wave bp-closing__wave--bottom" aria-hidden="true" />

          <div className="bp-closing__body">
            <p className="bp-closing__script" data-bp-reveal>
              Sampai jumpa di pantai,
            </p>
            <p className="bp-closing__names" data-bp-reveal>
              {coupleLabel}
            </p>
            <p className="bp-closing__message" data-bp-reveal>
              {closingMessage}
            </p>
          </div>
        </section>

        <footer className="bp-foot">
          <a
            className="bp-foot__link"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Aksaraa Wedding via WhatsApp"
          >
            <span className="bp-foot__badge">
              <img className="bp-foot__logo" src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" draggable={false} />
            </span>
            <span className="bp-foot__cta">Wedding by Aksaraa</span>
          </a>
          <p className="bp-foot__text">
            © {new Date().getFullYear()} {coupleLabel}. All rights reserved.
          </p>
        </footer>
      </div>

      {opened && trackUrl && (
        <button
          type="button"
          className={`bp-music ${playing ? "is-on" : "is-off"}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
          aria-pressed={playing}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M12.5 1.6a.6.6 0 0 1 .75.58v8.07a2.3 2.3 0 1 1-1.2-2.02V4.5L6.6 5.6v5.35a2.3 2.3 0 1 1-1.2-2.02V4.3a.6.6 0 0 1 .46-.58l6.64-2.12Z" />
          </svg>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="bp-lightbox" role="dialog" aria-modal="true" aria-label="Penampil foto" onClick={() => setLightbox(null)}>
          <button type="button" className="bp-close" aria-label="Tutup" onClick={() => setLightbox(null)}>
            ×
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              className="bp-nav bp-nav--prev"
              aria-label="Foto sebelumnya"
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
              className="bp-nav bp-nav--next"
              aria-label="Foto berikutnya"
              onClick={(event) => {
                event.stopPropagation()
                stepLightbox(1)
              }}
            >
              ›
            </button>
          )}
        </div>
      )}

      {videoOpen && film && (
        <div className="bp-modal" role="dialog" aria-modal="true" aria-label="Film kami" onClick={() => setVideoOpen(false)}>
          <button type="button" className="bp-close" aria-label="Tutup" onClick={() => setVideoOpen(false)}>
            ×
          </button>
          <div className="bp-modal__box" onClick={(event) => event.stopPropagation()}>
            {film.kind === "file" ? (
              <video src={film.src} controls autoPlay playsInline />
            ) : (
              <iframe
                src={film.src}
                title="Film pernikahan"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="bp-toast" role="status">
          {toast}
        </div>
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || "Tamu Undangan"}
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
