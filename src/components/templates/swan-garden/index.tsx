"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, firstImage, gcalLink } from "../shared/lib"
import TopCover from "./sections/TopCover"
import PrimaryPane from "./sections/PrimaryPane"
import Cover from "./sections/Cover"
import Quote from "./sections/Quote"
import Couple from "./sections/Couple"
import SaveDate from "./sections/SaveDate"
import Agenda from "./sections/Agenda"
import Rundown from "./sections/Rundown"
import Families from "./sections/Families"
import Live from "./sections/Live"
import Gallery from "./sections/Gallery"
import Film from "./sections/Film"
import Story from "./sections/Story"
import Gift from "./sections/Gift"
import Closing from "./sections/Closing"
import Footnote from "./sections/Footnote"
import Wishes from "./Wishes"
import "./swan-garden.css"
import "./overrides.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const COPY_EN = {
  cover_kicker: "Wedding Invitation",
  open_button: "Open Invitation",
  mempelai_title: "The Wedding Of",
  mempelai_intro: "We cordially invite you to celebrate our wedding",
  countdown_title: "Save the Date",
  save_date_label: "Add to Calendar",
  events_title: "The Wedding Day",
  maps_label: "View Maps",
  dresscode_title: "Dresscode",
  dresscode_note: "We kindly ask that guests please attend wearing our wedding colors.",
  rundown_title: "Rundown",
  rundown_event_title: "Reception",
  inviting_title: "With Honor",
  inviting_intro: "Together with the families who make this day possible.",
  live_title: "Live Streaming",
  live_button: "Open Link",
  gallery_title: "Portraits of Us",
  video_title: "Our Footage",
  video_intro: "A short film from the days before the wedding.",
  video_caption: "The Film",
  story_title: "Our Story",
  gift_title: "Wedding Gift",
  gift_intro:
    "Your blessing and coming to our wedding are enough for us. However, if you want to give a gift we provide a Digital Envelope to make it easier for you. Thank you.",
  gift_address_title: "Send a Gift",
  copy_label: "Copy",
  copied_label: "Copied",
  wishes_title: "Wedding Wish",
  wishes_intro: "Leave a wish or a prayer for us to keep.",
  wishes_name_placeholder: "Name",
  wishes_message_placeholder: "Give your wish",
  wishes_submit: "Send",
  wishes_empty: "Be the first to send a wish.",
  closing_title: "Thank You",
  closing_message:
    "From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives and honored you could be here with us.",
  live_description: "Join our ceremony from wherever you are.",
} as const

const COPY_ID: Record<keyof typeof COPY_EN, string> = {
  cover_kicker: "Undangan Pernikahan",
  open_button: "Buka Undangan",
  mempelai_title: "Pernikahan",
  mempelai_intro: "Dengan hormat kami mengundang Anda untuk merayakan pernikahan kami",
  countdown_title: "Simpan Tanggal",
  save_date_label: "Simpan ke Kalender",
  events_title: "Hari Pernikahan",
  maps_label: "Lihat Lokasi",
  dresscode_title: "Dresscode",
  dresscode_note: "Kami mohon tamu hadir dengan pakaian yang selaras dengan warna pernikahan kami.",
  rundown_title: "Susunan Acara",
  rundown_event_title: "Resepsi",
  inviting_title: "Turut Mengundang",
  inviting_intro: "Bersama keluarga yang mewujudkan hari ini.",
  live_title: "Siaran Langsung",
  live_button: "Buka Tautan",
  gallery_title: "Potret Kami",
  video_title: "Video Kami",
  video_intro: "Film singkat dari hari-hari sebelum pernikahan.",
  video_caption: "Video",
  story_title: "Kisah Kami",
  gift_title: "Hadiah Pernikahan",
  gift_intro:
    "Doa restu dan kehadiran Anda sudah lebih dari cukup bagi kami. Namun jika ingin memberi hadiah, kami menyediakan amplop digital untuk memudahkan Anda. Terima kasih.",
  gift_address_title: "Kirim Hadiah",
  copy_label: "Salin",
  copied_label: "Tersalin",
  wishes_title: "Ucapan & Doa",
  wishes_intro: "Tinggalkan ucapan atau doa untuk kami.",
  wishes_name_placeholder: "Nama",
  wishes_message_placeholder: "Tulis ucapan Anda",
  wishes_submit: "Kirim",
  wishes_empty: "Jadilah yang pertama mengirim ucapan.",
  closing_title: "Terima Kasih",
  closing_message:
    "Dari lubuk hati kami, terima kasih telah menjadi bagian dari hari bahagia kami. Kami sangat bersyukur memiliki Anda dalam hidup kami dan merasa terhormat Anda dapat hadir bersama kami.",
  live_description: "Ikuti upacara kami dari mana pun Anda berada.",
}

function youtubeId(url?: string): string {
  if (!url) return ""
  const m =
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ""
}

function prettyHashtag(value?: string): string {
  const raw = (value || "").trim()
  if (!raw) return ""
  return raw.startsWith("#") ? raw : `#${raw.replace(/\s+/g, "")}`
}

function instagramValue(value?: string): string {
  return (value || "").trim()
}

export default function SwanGardenTemplate(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const extras = profile.template_content || {}
  // Language-aware house copy. A blank EKSTRA field must fall back to it: a
  // real invitation should never show a bare heading where a sentence belongs.
  const C = lang === "en" ? COPY_EN : COPY_ID
  // Every EKSTRA this template renders, normalised once, then read as
  // `tc.<key> || C.<key>` at the element that shows it. Property reads (not
  // dynamic lookups) are what lets `npm run audit:extras` prove each editable
  // field actually reaches the page.
  const extra = (value?: string) => (typeof value === "string" ? value.trim() : "")
  const tc = {
    cover_kicker: extra(extras.cover_kicker),
    open_button: extra(extras.open_button),
    mempelai_title: extra(extras.mempelai_title),
    mempelai_intro: extra(extras.mempelai_intro),
    countdown_title: extra(extras.countdown_title),
    save_date_label: extra(extras.save_date_label),
    events_title: extra(extras.events_title),
    maps_label: extra(extras.maps_label),
    dresscode_title: extra(extras.dresscode_title),
    dresscode_note: extra(extras.dresscode_note),
    rundown_title: extra(extras.rundown_title),
    rundown_event_title: extra(extras.rundown_event_title),
    inviting_title: extra(extras.inviting_title),
    inviting_intro: extra(extras.inviting_intro),
    gallery_title: extra(extras.gallery_title),
    video_title: extra(extras.video_title),
    video_intro: extra(extras.video_intro),
    video_caption: extra(extras.video_caption),
    story_title: extra(extras.story_title),
    gift_title: extra(extras.gift_title),
    gift_intro: extra(extras.gift_intro),
    gift_address_title: extra(extras.gift_address_title),
    copy_label: extra(extras.copy_label),
    copied_label: extra(extras.copied_label),
    wishes_title: extra(extras.wishes_title),
    wishes_intro: extra(extras.wishes_intro),
    wishes_name_placeholder: extra(extras.wishes_name_placeholder),
    wishes_message_placeholder: extra(extras.wishes_message_placeholder),
    wishes_submit: extra(extras.wishes_submit),
    wishes_empty: extra(extras.wishes_empty),
    closing_title: extra(extras.closing_title),
    closing_message: extra(extras.closing_message),
  }

  const [opened, setOpened] = useState(false)
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const groom = profile.groom_name || profile.groom_full_name || ""
  const bride = profile.bride_name || profile.bride_full_name || ""
  const coupleLabel = [groom, bride].filter(Boolean).join(" & ") || (lang === "en" ? "The Couple" : "Mempelai")
  const guestName = (profile.guest_name || "").trim()
  const guestLabel = lang === "en" ? `Dear, ${guestName || (lang === "en" ? "Guest" : "Tamu")}` : `Kepada Yth. ${guestName || "Tamu Undangan"}`
  const hashtag = prettyHashtag(profile.display_name)
  const coverSlots = Array.isArray(profile.cover_photos) ? profile.cover_photos : []
  const coverPhoto = firstImage(coverSlots[0])
  const gatePhoto = firstImage(coverSlots[1])

  const gates = profile.feature_gates || {}
  const sessions = profile.sessions || []
  const target = useMemo(() => countdownTarget(sessions, profile.estimated_wedding_date), [sessions, profile.estimated_wedding_date])
  const calendarUrl = useMemo(() => gcalLink(sessions[0], groom, bride), [sessions, groom, bride])

  const stories =
    gates.story !== false && profile.story_visible !== false && Array.isArray(profile.stories) ? profile.stories : []
  const galleryPhotos = Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean) : []
  const families =
    gates.inviting_families !== false && profile.inviting_families_visible !== false
      ? Array.isArray(profile.inviting_families)
        ? profile.inviting_families
        : []
      : []
  const giftAccounts = profile.gift_section_visible !== false ? profile.gift_accounts || [] : []
  const giftAddress = gates.gift_address !== false && profile.gift_section_visible !== false ? profile.gift_address || "" : ""
  const hasVideo = Boolean(profile.video_url) && gates.video !== false && profile.video_section_visible !== false
  const live = profile.livestream || {}
  const liveUrl = live.url || ""
  const track = profile.track_url || ASSETS.defaultMusic

  // Autoplay is blocked without a gesture, so the first interaction starts the
  // music on the desktop path (and is a no-op on phones, where Open did it).
  useEffect(() => {
    if (!opened) return
    const unlock = () => {
      const audio = audioRef.current
      if (!audio || !audio.paused) return
      void audio.play().then(
        () => setPlaying(true),
        () => undefined
      )
    }
    window.addEventListener("pointerdown", unlock, { once: true, capture: true })
    window.addEventListener("keydown", unlock, { once: true, capture: true })
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true })
      window.removeEventListener("keydown", unlock, { capture: true })
    }
  }, [opened])

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
      void audio.play().then(
        () => setPlaying(true),
        () => undefined
      )
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  // Body scroll stays locked under the gate, exactly like the reference. On
  // desktop the gate is replaced by the pinned pane, so the page must scroll.
  useEffect(() => {
    if (opened) return
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 961px)").matches) return
    const { body, documentElement } = document
    const prevBody = body.style.overflow
    const prevHtml = documentElement.style.overflow
    body.style.overflow = "hidden"
    documentElement.style.overflow = "hidden"
    return () => {
      body.style.overflow = prevBody
      documentElement.style.overflow = prevHtml
    }
  }, [opened])

  // One IntersectionObserver for every reveal target (AOS semantics): the class
  // is added once, and no per-section listener exists.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".swan-garden [data-aos]"))
    if (!nodes.length) return
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("aos-animate"))
      return
    }
    nodes.forEach((n) => {
      if (n.closest(".top-cover") && !opened) return
    })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          el.classList.add("aos-animate")
          io.unobserve(el)
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [opened])

  // Lightbox keyboard controls + scroll lock.
  useEffect(() => {
    if (!lightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const release = () => {
      document.body.style.overflow = prev
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowRight")
        setLightbox((s) => (s ? { ...s, index: (s.index + 1) % s.photos.length } : s))
      if (e.key === "ArrowLeft")
        setLightbox((s) => (s ? { ...s, index: (s.index - 1 + s.photos.length) % s.photos.length } : s))
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      release()
    }
  }, [lightbox])

  const openLightbox = useCallback((photos: string[], index: number) => {
    const list = photos.filter(Boolean)
    if (!list.length) return
    setLightbox({ photos: list, index: Math.max(0, Math.min(index, list.length - 1)) })
  }, [])

  const showGuestDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const activePhoto = lightbox ? lightbox.photos[lightbox.index] : ""

  return (
    <div className={`swan-garden${opened ? " is-open" : " is-locked"}`}>
      <section className="kat-page__side-to-side">
        <PrimaryPane
          coupleLabel={coupleLabel}
          guestLabel={guestLabel}
          openLabel={tc.open_button || C.open_button}
          opened={opened}
          onOpen={openInvitation}
        />
        <section className="secondary-pane">
          <TopCover
            hidden={opened}
            onOpen={openInvitation}
            coupleLabel={coupleLabel}
            guestLabel={guestLabel}
            openLabel={tc.open_button || C.open_button}
            photo={gatePhoto}
          />
          <Cover
            profile={profile}
            coupleLabel={coupleLabel}
            kicker={tc.cover_kicker || C.cover_kicker}
            hashtag={hashtag}
            photo={coverPhoto}
          />
          <Quote text={profile.quote_text || ""} source={profile.quote_source || ""} />
          <Couple
            profile={profile}
            title={tc.mempelai_title || C.mempelai_title}
            description={tc.mempelai_intro || C.mempelai_intro}
            onPhoto={openLightbox}
          />
          {target ? (
            <SaveDate target={target} calendarUrl={calendarUrl} title={tc.countdown_title || C.countdown_title} addLabel={tc.save_date_label || C.save_date_label} lang={lang} />
          ) : null}
          <Agenda
            profile={profile}
            title={tc.events_title || C.events_title}
            mapsLabel={tc.maps_label || C.maps_label}
            dressTitle={tc.dresscode_title || C.dresscode_title}
            dressNote={tc.dresscode_note || C.dresscode_note}
            showDresscode={profile.dresscode_visible !== false && Boolean((profile.dresscode?.colors || []).length || profile.dresscode?.title)}
            dressIcons={{ man: "", woman: "" }}
            lang={lang}
          />
          <Rundown
            items={profile.rundown || []}
            title={tc.rundown_title || C.rundown_title}
            eventTitle={tc.rundown_event_title || C.rundown_event_title}
          />
          <Families families={families} title={tc.inviting_title || C.inviting_title} intro={tc.inviting_intro || C.inviting_intro} />
          {profile.livestream_visible !== false && liveUrl ? (
            <Live
              title={live.title || C.live_title}
              description={(live.description || "").trim() || C.live_description}
              buttonLabel={live.buttonLabel || C.live_button}
              url={liveUrl}
              youtubeId={youtubeId(liveUrl)}
              poster={coverPhoto}
            />
          ) : null}
          <Gallery photos={galleryPhotos} title={tc.gallery_title || C.gallery_title} onPhoto={openLightbox} />
          {hasVideo ? (
            <Film
              videoUrl={profile.video_url || ""}
              title={tc.video_title || C.video_title}
              intro={tc.video_intro || C.video_intro}
              caption={tc.video_caption || C.video_caption}
              poster={galleryPhotos[0] || ""}
            />
          ) : null}
          <Story
            stories={stories}
            title={tc.story_title || C.story_title}
            coverPhoto={coverPhoto}
            onPhoto={openLightbox}
          />
          <Gift
            accounts={giftAccounts}
            addressName={profile.gift_address_name || ""}
            address={giftAddress}
            title={tc.gift_title || C.gift_title}
            intro={tc.gift_intro || C.gift_intro}
            addressTitle={tc.gift_address_title || C.gift_address_title}
            copyLabel={tc.copy_label || C.copy_label}
            copiedLabel={tc.copied_label || C.copied_label}
            showAddress={gates.gift_address !== false}
            lang={lang}
          />
          <Wishes
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            guestLinkStrict={profile.guest_link_strict}
            title={tc.wishes_title || C.wishes_title}
            intro={tc.wishes_intro || C.wishes_intro}
            namePlaceholder={tc.wishes_name_placeholder || C.wishes_name_placeholder}
            messagePlaceholder={tc.wishes_message_placeholder || C.wishes_message_placeholder}
            submitLabel={tc.wishes_submit || C.wishes_submit}
            emptyLabel={tc.wishes_empty || C.wishes_empty} language={lang}
          />
          <Closing title={tc.closing_title || C.closing_title} message={tc.closing_message || C.closing_message} />
          <Footnote coupleLabel={coupleLabel} kicker={tc.cover_kicker || C.cover_kicker} hashtag={hashtag} />
        </section>
      </section>

      {track ? (
        <audio ref={audioRef} src={track} loop preload="auto" data-warm-audio onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      ) : null}

      {track ? (
        <section className={`music-outer${opened ? "" : " hide"}`} aria-hidden={!opened}>
          <button
            type="button"
            className={`music-box${playing ? " playing" : ""}`}
            onClick={toggleMusic}
            aria-label={playing ? (lang === "en" ? "Pause music" : "Jeda musik") : (lang === "en" ? "Play music" : "Putar musik")}
          >
            <span className="sw-vinyl" aria-hidden="true" />
          </button>
        </section>
      ) : null}

      {lightbox ? (
        <div className="sw-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button type="button" className="sw-lightbox__close" aria-label={lang === "en" ? "Close" : "Tutup"} onClick={() => setLightbox(null)}>
            ×
          </button>
          <img src={activePhoto} alt="" onClick={(e) => e.stopPropagation()} />
          {lightbox.photos.length > 1 ? (
            <>
              <button
                type="button"
                className="sw-lightbox__nav prev"
                aria-label={lang === "en" ? "Previous" : "Sebelumnya"}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((s) => (s ? { ...s, index: (s.index - 1 + s.photos.length) % s.photos.length } : s))
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="sw-lightbox__nav next"
                aria-label={lang === "en" ? "Next" : "Berikutnya"}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((s) => (s ? { ...s, index: (s.index + 1) % s.photos.length } : s))
                }}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {showGuestDock ? (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || (lang === "en" ? "Guest" : "Tamu Undangan")}
          coupleName={coupleLabel}
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
      ) : null}
    </div>
  )
}
