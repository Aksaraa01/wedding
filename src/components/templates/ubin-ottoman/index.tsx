"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { childFullName, childFullNamesLine, childInitials, childNamesLine, resolveChildren } from "@/lib/children"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, gcalLink, groomPhoto, photoList } from "../shared/lib"
import { formatDate } from "@/lib/formatDate"
import { useWishes } from "../shared/kids/useWishes"
import { LOCKED_FIELD_STYLE, wishNameState } from "../shared/wishName"
import "./ubin-ottoman.css"
import { normalizeLanguage, t, type Language } from "@/lib/i18n"

const ART = (name: string) => `/templates/ubin-ottoman/${name}.webp`

const DEFAULTS = {
  id: {
    opening: "Dengan memohon rahmat dan rido Allah SWT, kami mengundang Bapak/Ibu/Saudara pada tasyakuran khitanan putra kami:",
    closing: "Merupakan kehormatan dan kebahagiaan bagi kami atas kehadiran serta doa restu Bapak/Ibu/Saudara.",
    gift: "Doa dan kehadiran Anda sudah lebih dari cukup. Bila ingin memberi tanda kasih, dapat melalui:",
  },
  en: {
    opening: "By the grace and mercy of Allah SWT, we invite you to the circumcision celebration of our beloved son:",
    closing: "It is our honor and joy to have your presence and prayers.",
    gift: "Your prayers and presence are more than enough. If you wish to send a token of love, you may do so below:",
  },
} satisfies Record<Language, Record<string, string>>

const WISH_PAGE = 10

function delay(seconds: number): CSSProperties {
  return { animationDelay: `${seconds}s` }
}

/**
 * The reference renderer fits a person's name (cover, "Sang Buah Hati", guest,
 * closing) onto one line by shrinking the font size — its payload ships 28px but
 * the rendered node is 19.04px for a 25-character name. Reproduce that instead
 * of letting a long name spill over the arch or the music button.
 */
function useFitOneLine<T extends HTMLElement>(text: string, maxScale = 0.5) {
  const cleanup = useRef<(() => void) | null>(null)
  return useCallback(
    (el: T | null) => {
      cleanup.current?.()
      cleanup.current = null
      if (!el) return
      const fit = () => {
        el.style.removeProperty("font-size")
        const cs = window.getComputedStyle(el)
        const box = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        if (!box) return
        // Measure with a real DOM probe: canvas measureText does not reliably use
        // the just-loaded webfont, which under-measures by ~8% and skips the fit.
        const probe = document.createElement("span")
        probe.textContent = el.textContent || text
        probe.style.cssText = [
          "position:absolute",
          "left:-9999px",
          "top:0",
          "visibility:hidden",
          "white-space:nowrap",
          `font-family:${cs.fontFamily}`,
          `font-size:${cs.fontSize}`,
          `font-weight:${cs.fontWeight}`,
          `font-style:${cs.fontStyle}`,
          `letter-spacing:${cs.letterSpacing}`,
          `text-transform:${cs.textTransform}`,
        ].join(";")
        document.body.appendChild(probe)
        const width = probe.getBoundingClientRect().width
        probe.remove()
        if (width <= box) return
        const base = parseFloat(cs.fontSize)
        const next = Math.max(base * maxScale, (base * box) / width)
        el.style.fontSize = `${next.toFixed(2)}px`
      }
      fit()
      if (document.fonts) void document.fonts.ready.then(fit).catch(() => {})
      window.addEventListener("resize", fit)
      cleanup.current = () => window.removeEventListener("resize", fit)
    },
    [text, maxScale]
  )
}

export default function UbinOttoman(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const d = DEFAULTS[lang]
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  // Design QA hook: ?opened=1 starts the invitation open so review tools can
  // screenshot every section without tapping. Harmless for real guests.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("opened") === "1") {
      setOpened(true)
      document.body.classList.remove("uo-locked")
    }
  }, [])
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [now, setNow] = useState<number | null>(null)
  const [wishMessage, setWishMessage] = useState("")
  const [wishPage, setWishPage] = useState(0)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const labels = profile.event_labels || eventLabels(profile.event_type, profile.subject_gender)

  const covers = useMemo(() => photoList(profile.cover_photos as string | string[] | undefined), [profile.cover_photos])
  // One ceremony can introduce several ananda; the legacy single slot remains
  // the fallback so invitations made before the column existed never change.
  const ananda = useMemo(() => resolveChildren(profile), [profile])
  const primary = ananda[0]
  const portrait = primary?.photo_url || groomPhoto(profile.groom_photo_url)
  const cover = covers[0] || portrait || ASSETS.defaults.couple
  const venuePhoto = covers[1] || ""
  const closingPhoto = covers[2] || cover

  const childName = primary ? (primary.name || primary.full_name) : "Ananda"
  const childFull = primary ? childFullName(primary) : childName
  // Several ananda share one ceremony: the cover, the closing card and the RSVP
  // dock name them all as a sentence list ("Raka & Rizky", "Raka, Rizky & Rafa"),
  // never only the first child.
  const childNames = childNamesLine(ananda) || childName
  const groupFullName = childFullNamesLine(ananda) || childFull
  const closingName = childNames
  const parents = (profile.groom_parents || "").trim()
  const guestName = (profile.guest_name || "").trim() || labels.guestFallback

  const events = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const eventDate = (profile.estimated_wedding_date || "").trim()
  const target = useMemo(() => countdownTarget(events, eventDate), [events, eventDate])
  const calendarUrl = useMemo(() => gcalLink(events[0], groupFullName), [events, groupFullName])

  const honored = useMemo(
    () =>
      gates.inviting_families !== false && profile.inviting_families_visible !== false
        ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
        : [],
    [profile.inviting_families, profile.inviting_families_visible, gates.inviting_families]
  )

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean).slice(0, 8) : []),
    [profile.gallery_photos]
  )

  // "Rangkaian Acara" is one section that walks the Acara list: the venue photo,
  // then per event its name, date/time, venue, address and map link. A couple
  // with two acara on the same day (or in two halls) gets two blocks; the same
  // venue repeated across acara is collapsed into the first block's.
  const agenda = useMemo(() => {
    const seen = new Set<string>()
    const out: { key: string; name: string; when: string; place: string; address: string; maps: string }[] = []
    for (const session of events) {
      const venue = (session.venue || "").trim()
      const address = (session.address || "").trim()
      const key = `${(session.name || "").trim().toLowerCase()}|${venue.toLowerCase()}|${address.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        key,
        name: (session.name || "").trim() || labels.mainEventName,
        when: [
          session.date && session.date !== eventDate ? formatDate(session.date, lang) : "",
          (session.time || "").trim(),
        ]
          .filter(Boolean)
          .join(" · "),
        place: venue,
        address: venue ? address : "",
        maps: (session.maps_url || "").trim(),
      })
    }
    return out
  }, [events, eventDate, labels.mainEventName])

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const coverKicker = (tc.cover_kicker || "").trim() || labels.eventKicker
  const coverThanks = (tc.cover_syukur || "").trim() || (lang === "en" ? "with heartfelt gratitude" : "dengan penuh rasa syukur")
  const coverGuestLabel = (tc.cover_guest_label || "").trim() || t("toGuest", lang)
  const openLabel = (tc.open_button || "").trim() || t("openInvitation", lang)
  const salam = (tc.opening_salam || "").trim() || (lang === "en" ? "Peace be upon you" : "Assalamu'alaikum wr. wb.")
  const openingText = (profile.opening_description || "").trim() || d.opening
  const mempelaiTitle = (tc.mempelai_title || "").trim() || (lang === "en" ? "Our Beloved Child" : "Sang Buah Hati")
  const parentsLabel = (tc.parents_label || "").trim() || labels.subjectOf
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const dateKicker = (tc.events_kicker || "").trim() || (lang === "en" ? "God willing, to be held on" : "Insya Allah dilaksanakan pada")
  const dateTitle = (tc.events_title || "").trim() || (lang === "en" ? "The Celebration" : "Hari Bahagia")
  const agendaKicker = (tc.agenda_kicker || "").trim() || t("secRundown", lang)
  const agendaTitle = (tc.agenda_title || "").trim() || t("secEvent", lang)
  const mapsLabel = (tc.maps_label || "").trim() || t("viewLocation", lang)
  const calendarLabel = (tc.calendar_button || "").trim() || t("saveToCalendar", lang)
  const galleryKicker = (tc.gallery_kicker || "").trim() || t("secGallery", lang)
  const galleryTitle = (tc.gallery_title || "").trim() || (lang === "en" ? "Happy Moments" : "Momen Bahagia")
  const wishKicker = (tc.wishes_kicker || "").trim() || labels.wishesTitle
  const wishTitle = (tc.wishes_title || "").trim() || (lang === "en" ? "Send prayers for our child" : "Titip doa untuk ananda")
  const wishIntro = (tc.wishes_intro || "").trim()
  const wishNameLabel = (tc.wishes_name_label || "").trim() || (lang === "en" ? "Your Name" : "Nama Anda")
  const wishNamePlaceholder = (tc.wishes_name_placeholder || "").trim() || (lang === "en" ? "Enter your name" : "Tulis nama Anda")
  const wishMessageLabel = (tc.wishes_message_label || "").trim() || (lang === "en" ? "Prayers & wishes" : "Doa dan ucapan")
  const wishMessagePlaceholder = (tc.wishes_message_placeholder || "").trim() || (lang === "en" ? "Write your prayers and wishes" : "Tulis doa dan ucapan")
  const wishSubmit = (tc.wishes_submit || "").trim() || t("sendWishes", lang)
  const wishEmpty = (tc.wishes_empty || "").trim() || (lang === "en" ? "No wishes yet. Be the first." : "Belum ada ucapan. Jadilah yang pertama.")
  const wishLoading = (tc.wishes_loading || "").trim() || t("loading", lang)
  const giftKicker = (tc.gift_kicker || "").trim() || labels.giftTitle
  const giftTitle = (tc.gift_intro_title || "").trim() || (lang === "en" ? "With all our heart" : "Dengan sepenuh hati")
  const giftLead = (tc.gift_intro_description || "").trim() || d.gift
  const copyAccountButton = (tc.copy_account_button || "").trim() || t("copyNumber", lang)
  const copyAddressButton = (tc.copy_address_button || "").trim() || t("copyAddress", lang)
  const sendGiftLabel = (tc.gift_send_label || "").trim() || t("sendGift", lang)
  const invitingKicker = (tc.inviting_kicker || "").trim() || t("secInviting", lang)
  const invitingTitle = (tc.inviting_title || "").trim() || (lang === "en" ? "Family & Relatives" : "Keluarga & Kerabat")
  const closingKicker = (tc.closing_kicker || "").trim() || t("thankYou", lang)
  const closingText = (tc.closing_message || "").trim() || d.closing
  const closingSalam = (tc.closing_salam || "").trim() || (lang === "en" ? "Peace be upon you" : "Wassalamu'alaikum wr. wb.")

  const parsedDate = eventDate ? new Date(eventDate) : null
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null
  const dayNum = validDate ? String(validDate.getDate()).padStart(2, "0") : "--"
  const monthName = validDate ? validDate.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { month: "long" }) : ""
  const yearNum = validDate ? String(validDate.getFullYear()) : ""
  const weekday = validDate ? validDate.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { weekday: "long" }) : ""

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const wishes = useWishes(profile.wedding_profile_id, profile.guest_id)
  const nameState = useMemo(
    () => wishNameState(profile.guest_name, profile.guest_id, profile.guest_link_strict),
    [profile.guest_name, profile.guest_id, profile.guest_link_strict]
  )
  const [wishName, setWishName] = useState(nameState.value)
  const [wishNameLocked] = useState(nameState.locked)

  const coverNameRef = useFitOneLine<HTMLHeadingElement>(childNames)
  const guestRef = useFitOneLine<HTMLParagraphElement>(guestName)
  const putraNameRef = useFitOneLine<HTMLParagraphElement>(childFull)
  const closingNameRef = useFitOneLine<HTMLParagraphElement>(closingName)

  const wishPages = Math.max(1, Math.ceil(wishes.wishes.length / WISH_PAGE))
  const visibleWishes = wishes.wishes.slice(wishPage * WISH_PAGE, wishPage * WISH_PAGE + WISH_PAGE)

  const showDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
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
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  const submitWish = useCallback(async () => {
    const ok = await wishes.send(wishName || guestName, wishMessage)
    if (ok) {
      setWishMessage("")
      setWishPage(0)
    }
  }, [wishes, wishName, guestName, wishMessage])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    document.body.classList.toggle("uo-locked", !opened)
    return () => document.body.classList.remove("uo-locked")
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-uo-reveal]"))
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
        // A fast swipe can jump an element clean over the viewport between two
        // observer ticks; it must never stay invisible once it is above us.
        for (const el of targets) {
          if (el.getBoundingClientRect().bottom < 0) {
            el.classList.add("is-in")
            io.unobserve(el)
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened, gallery.length, accounts.length, wishes.wishes.length, honored.length, agenda.length])

  return (
    <div ref={rootRef} className={`uo-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      {!opened && (
        <section className="uo-cover" aria-label={coverKicker}>
          <img className="uo-cover__corner uo-cover__corner--left" src={ART("corner-left")} alt="" aria-hidden="true" draggable={false} />
          <img className="uo-cover__corner uo-cover__corner--right" src={ART("corner-right")} alt="" aria-hidden="true" draggable={false} />
          <img className="uo-cover__lantern uo-cover__lantern--left" src={ART("lantern")} alt="" aria-hidden="true" draggable={false} />
          <img className="uo-cover__lantern uo-cover__lantern--right" src={ART("lantern")} alt="" aria-hidden="true" draggable={false} />

          <p className="uo-cover__kicker">{coverKicker}</p>
          <h1 ref={coverNameRef} className="uo-cover__name">{childNames}</h1>

          <div className="uo-cover__arch">
            <img src={cover} alt={childFull} draggable={false} />
          </div>
          <img className="uo-cover__crescent" src={ART("crescent")} alt="" aria-hidden="true" draggable={false} />

          <p className="uo-cover__thanks">{coverThanks}</p>
          {validDate && <p className="uo-cover__date">{formatDate(eventDate, lang)}</p>}
          <p className="uo-cover__guest-label">{coverGuestLabel}</p>
          <div className="uo-cover__foot">
            <p ref={guestRef} className="uo-cover__guest">{guestName}</p>
            <button type="button" className="uo-open" onClick={openInvitation}>
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>mail</span>
              {openLabel}
            </button>
          </div>

          <img className="uo-cover__band" src={ART("flower-band")} alt="" aria-hidden="true" draggable={false} />
        </section>
      )}

      {opened && (
        <main>
          {/* Pembuka */}
          <section className="uo-section uo-section--navy uo-pembuka">
            <img className="uo-pembuka__star" src={ART("tile-star")} alt="" aria-hidden="true" data-uo-reveal />
            <p className="uo-arabic" lang="ar" dir="rtl" data-uo-reveal style={delay(0.04)}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="uo-kicker uo-kicker--center" data-uo-reveal style={delay(0.06)}>{salam}</p>
            <p className="uo-pembuka__text" data-uo-reveal style={delay(0.08)}>{openingText}</p>
          </section>

          {/* Putra / Putri Kami */}
          <section className="uo-section uo-section--cream uo-putra">
            <p className="uo-kicker uo-kicker--center" data-uo-reveal>{labels.subjectPossessive}</p>
            <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
              <i aria-hidden="true" />
              <h2 className="uo-title">{mempelaiTitle}</h2>
              <i aria-hidden="true" />
            </div>

            {ananda.length > 1 ? (
              <div className="uo-ananda" data-uo-reveal>
                {ananda.map((child, index) => (
                  <article className="uo-ananda__item" key={`${child.full_name || child.name}-${index}`}>
                    <div className="uo-stage">
                      <img className="uo-stage__pillar uo-stage__pillar--left" src={ART("pillar-left")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                      <img className="uo-stage__pillar uo-stage__pillar--right" src={ART("pillar-right")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                      <div className="uo-stage__arch">
                        {child.photo_url ? (
                          <img src={child.photo_url} alt={childFullName(child)} loading="lazy" draggable={false} />
                        ) : (
                          <span className="uo-ananda__monogram" aria-hidden="true">{childInitials(child)}</span>
                        )}
                      </div>
                    </div>
                    <p className="uo-ananda__name">{childFullName(child)}</p>
                    {child.instagram && (
                      <p className="uo-putra__ig uo-ananda__ig">@{child.instagram}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <>
                <div className="uo-stage" data-uo-reveal>
                  <img className="uo-stage__pillar uo-stage__pillar--left" src={ART("pillar-left")} alt="" aria-hidden="true" draggable={false} />
                  <img className="uo-stage__pillar uo-stage__pillar--right" src={ART("pillar-right")} alt="" aria-hidden="true" draggable={false} />
                  <div className="uo-stage__arch">
                    <img src={portrait} alt={childFull} loading="lazy" draggable={false} />
                  </div>
                </div>

                <p ref={putraNameRef} className="uo-putra__name" data-uo-reveal style={delay(0.04)}>{childFull}</p>
              </>
            )}
            {parents && (
              <p className="uo-putra__parents" data-uo-reveal style={delay(0.06)}>
                <span className="uo-putra__of">{parentsLabel}</span> {parents}
              </p>
            )}
            <div className="uo-diamond-row" data-uo-reveal style={delay(0.07)} aria-hidden="true">
              <i />
              <span />
              <i />
            </div>
            {ananda.length <= 1 && primary?.instagram && (
              <p className="uo-putra__ig" data-uo-reveal style={delay(0.08)}>
                @{primary.instagram}
              </p>
            )}
            {quoteText && (
              <p className="uo-putra__quote" data-uo-reveal style={delay(0.08)}>
                &ldquo;{quoteText}&rdquo;
                {quoteSource && <span className="uo-putra__source">{quoteSource}</span>}
              </p>
            )}
          </section>

          {/* Hari Acara */}
          {validDate && (
            <section className="uo-section uo-section--navy uo-date">
              <img className="uo-date__lantern uo-date__lantern--a" src={ART("lantern")} alt="" aria-hidden="true" />
              <img className="uo-date__lantern uo-date__lantern--b" src={ART("lantern")} alt="" aria-hidden="true" />

              <p className="uo-kicker uo-kicker--center uo-kicker--cream" data-uo-reveal>{dateKicker}</p>
              <div className="uo-title-row uo-title-row--cream" data-uo-reveal style={delay(0.06)}>
                <i aria-hidden="true" />
                <h2 className="uo-title">{dateTitle}</h2>
                <i aria-hidden="true" />
              </div>

              <div className="uo-date__row" data-uo-reveal style={delay(0.06)}>
                <span className="uo-date__day">{dayNum}</span>
                <i aria-hidden="true" />
                <span className="uo-date__month">{monthName}</span>
                <i aria-hidden="true" />
                <span className="uo-date__year">{yearNum}</span>
              </div>
              <p className="uo-kicker uo-kicker--center uo-kicker--cream uo-date__weekday" data-uo-reveal style={delay(0.08)}>
                {weekday}
              </p>

              {target && (() => {
                const ms = now ? Math.max(0, target.getTime() - now) : 0
                const cells = [
                  { v: Math.floor(ms / 86400000), l: t("days", lang) },
                  { v: Math.floor((ms % 86400000) / 3600000), l: t("hours", lang) },
                  { v: Math.floor((ms % 3600000) / 60000), l: t("minutes", lang) },
                  { v: Math.floor((ms % 60000) / 1000), l: t("seconds", lang) },
                ]
                return (
                  <div className="uo-count" data-uo-reveal style={delay(0.1)}>
                    {cells.map((c) => (
                      <div className="uo-count__cell" key={c.l}>
                        <span>{now ? String(c.v).padStart(2, "0") : "--"}</span>
                        <small>{c.l}</small>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {calendarUrl && (
                <a className="uo-calendar" href={calendarUrl} target="_blank" rel="noreferrer noopener" data-uo-reveal style={delay(0.12)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_month</span>
                  {calendarLabel}
                </a>
              )}
            </section>
          )}

          {/* Rangkaian Acara — venue photo, then one block per acara */}
          {agenda.length > 0 && (
            <section className="uo-section uo-section--cream uo-agenda">
              <p className="uo-kicker uo-kicker--center" data-uo-reveal>{agendaKicker}</p>
              <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
                <i aria-hidden="true" />
                <h2 className="uo-title">{agendaTitle}</h2>
                <i aria-hidden="true" />
              </div>

              {venuePhoto && (
                <div className="uo-agenda__arch" data-uo-reveal style={delay(0.04)}>
                  <img src={venuePhoto} alt="" loading="lazy" draggable={false} />
                </div>
              )}

              {agenda.map((row, i) => (
                <article className={`uo-event${i > 0 ? " uo-event--next" : ""}`} key={row.key} data-uo-reveal style={delay(0.06 + i * 0.05)}>
                  <h3 className="uo-event__name">{row.name}</h3>
                  {row.when && <p className="uo-event__when">{row.when}</p>}
                  {row.place && <p className="uo-event__place">{row.place}</p>}
                  {row.address && <p className="uo-event__address">{row.address}</p>}
                  {row.maps && (
                    <a className="uo-pill" href={row.maps} target="_blank" rel="noreferrer noopener">
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
                      {mapsLabel}
                    </a>
                  )}
                </article>
              ))}
            </section>
          )}

          {/* Galeri */}
          {gallery.length > 0 && (
            <section className="uo-section uo-section--cream uo-gallery">
              <p className="uo-kicker uo-kicker--center" data-uo-reveal>{galleryKicker}</p>
              <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
                <i aria-hidden="true" />
                <h2 className="uo-title">{galleryTitle}</h2>
                <i aria-hidden="true" />
              </div>
              <div className={`uo-gallery__grid${gallery.length === 1 ? " is-single" : ""}`} data-uo-reveal style={delay(0.06)}>
                {gallery.map((src, i) => (
                  <figure key={`${src}-${i}`}>
                    <img src={src} alt="" loading="lazy" draggable={false} />
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Doa & Ucapan */}
          <section className="uo-section uo-section--cream uo-wishes">
            <p className="uo-kicker uo-kicker--center" data-uo-reveal>{wishKicker}</p>
            <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
              <i aria-hidden="true" />
              <h2 className="uo-title">{wishTitle}</h2>
              <i aria-hidden="true" />
            </div>
            {wishIntro && <p className="uo-lead" data-uo-reveal style={delay(0.08)}>{wishIntro}</p>}

            <div className="uo-wish-card" data-uo-reveal style={delay(0.1)}>
              <label className="uo-wish-field">
                <span>{wishNameLabel}</span>
                <input
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder={wishNamePlaceholder}
                  readOnly={wishNameLocked}
                  aria-label={wishNameLabel}
                  style={wishNameLocked ? LOCKED_FIELD_STYLE : undefined}
                />
              </label>
              <label className="uo-wish-field">
                <span>{wishMessageLabel}</span>
                <textarea
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder={wishMessagePlaceholder}
                  maxLength={500}
                  rows={4}
                  aria-label={wishMessageLabel}
                />
              </label>
              <button
                type="button"
                className="uo-wish-send"
                onClick={submitWish}
                disabled={wishes.state === "sending" || !wishMessage.trim()}
              >
                {wishSubmit}
              </button>
              <p className="uo-wish-note" role="status">{wishes.feedback}</p>
            </div>

            <div className="uo-wish-list">
              {!wishes.loaded ? (
                <p className="uo-wish-empty">{wishLoading}</p>
              ) : wishes.wishes.length === 0 ? (
                <p className="uo-wish-empty">{wishEmpty}</p>
              ) : (
                visibleWishes.map((w) => (
                  <article className="uo-wish" key={w.id}>
                    <p className="uo-wish__name">{w.name || labels.guestFallback}</p>
                    <p className="uo-wish__text">{w.message}</p>
                    <span className="uo-wish__time">{formatDotDate(w.created_at)}</span>
                  </article>
                ))
              )}
              {wishes.loaded && wishPages > 1 && (
                <div className="uo-wish-pager">
                  <button
                    type="button"
                    onClick={() => setWishPage((p) => Math.max(0, p - 1))}
                    disabled={wishPage === 0}
                    aria-label="Ucapan sebelumnya"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                  </button>
                  <span>{`${wishPage + 1} / ${wishPages}`}</span>
                  <button
                    type="button"
                    onClick={() => setWishPage((p) => Math.min(wishPages - 1, p + 1))}
                    disabled={wishPage >= wishPages - 1}
                    aria-label="Ucapan berikutnya"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Tanda Kasih */}
          {hasGift && (
            <section className="uo-section uo-section--cream uo-gift">
              <p className="uo-kicker uo-kicker--center" data-uo-reveal>{giftKicker}</p>
              <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
                <i aria-hidden="true" />
                <h2 className="uo-title">{giftTitle}</h2>
                <i aria-hidden="true" />
              </div>
              <p className="uo-lead" data-uo-reveal style={delay(0.08)}>{giftLead}</p>

              {accounts.map((acc, i) => (
                <div className="uo-gift-card" key={`${acc.account_number || acc.provider_name || "acc"}-${i}`} data-uo-reveal style={delay(0.1)}>
                  <p className="uo-gift-card__bank">{acc.provider_name}</p>
                  <p className="uo-gift-card__row">
                    <span className="uo-gift-card__number">{acc.account_number}</span>
                    <button
                      type="button"
                      className="uo-gift-card__copy"
                      onClick={() => copyText(acc.account_number || "", lang === "en" ? "Account number copied" : "Nomor rekening disalin")}
                      aria-label={copyAccountButton}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                    </button>
                  </p>
                  <p className="uo-gift-card__owner">{acc.account_name}</p>
                </div>
              ))}

              {giftAddress && (
                <div className="uo-gift-card" data-uo-reveal style={delay(0.12)}>
                  <p className="uo-gift-card__bank">{sendGiftLabel}</p>
                  {profile.gift_address_name && <p className="uo-gift-card__owner uo-gift-card__owner--top">{profile.gift_address_name}</p>}
                  <p className="uo-gift-card__address">{giftAddress}</p>
                  <button
                    type="button"
                    className="uo-gift-copy"
                    onClick={() => copyText(giftAddress, lang === "en" ? "Address copied" : "Alamat disalin")}
                  >
                    {copyAddressButton}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Turut Mengundang */}
          {honored.length > 0 && (
            <section className="uo-section uo-section--cream uo-inviting">
              <p className="uo-kicker uo-kicker--center" data-uo-reveal>{invitingKicker}</p>
              <div className="uo-title-row" data-uo-reveal style={delay(0.06)}>
                <i aria-hidden="true" />
                <h2 className="uo-title">{invitingTitle}</h2>
                <i aria-hidden="true" />
              </div>
              <ul className="uo-inviting__list">
                {honored.map((f, i) => (
                  <li key={`${f}-${i}`} data-uo-reveal style={delay(0.06 + i * 0.02)}>{f}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Penutup */}
          <section className="uo-section uo-section--navy uo-closing">
            <img className="uo-closing__lantern uo-closing__lantern--a" src={ART("lantern")} alt="" aria-hidden="true" />
            <img className="uo-closing__lantern uo-closing__lantern--b" src={ART("lantern")} alt="" aria-hidden="true" />

            <p className="uo-kicker uo-kicker--center uo-kicker--cream uo-closing__kicker" data-uo-reveal>{closingKicker}</p>
            <div className="uo-closing__photo" data-uo-reveal style={delay(0.02)}>
              <img src={closingPhoto} alt={childFull} loading="lazy" draggable={false} />
            </div>
            <p ref={closingNameRef} className="uo-closing__name" data-uo-reveal style={delay(0.04)}>{closingName}</p>
            <p className="uo-closing__text" data-uo-reveal style={delay(0.06)}>{closingText}</p>
            <p className="uo-closing__salam" data-uo-reveal style={delay(0.08)}>{closingSalam}</p>
            {parents && (
              <p className="uo-closing__family" data-uo-reveal style={delay(0.1)}>
                <span>{labels.closingHeadline}</span>
                {parents}
              </p>
            )}
            <img className="uo-closing__band" src={ART("flower-band")} alt="" aria-hidden="true" loading="lazy" />
          </section>

          <div className="uo-footer">
            <a className="uo-footer__link" href="https://wa.me/6281161613071" target="_blank" rel="noopener noreferrer">
              <span className="uo-footer__badge">
                <img className="uo-footer__logo" src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa" loading="lazy" />
              </span>
              <span className="uo-footer__cta">{labels.brand} by Aksaraa</span>
            </a>
          </div>
        </main>
      )}

      {trackUrl && (
        <button
          type="button"
          className={`uo-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {playing ? "music_note" : "music_off"}
          </span>
        </button>
      )}

      {toast && <div className="uo-toast" role="status">{toast}</div>}

      {showDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName}
          coupleName={groupFullName}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message}
          rsvpMaxPax={profile.rsvp_max_pax}
          qrEnabled={Boolean(gates.qr_code_book)}
          language={lang}
        />
      )}
    </div>
  )
}
