"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import {
  countdownTarget,
  coverPhoto as coverPhotoOf,
  flattenPhotos,
  gcalLink,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import InvitationOverlay from "@/components/InvitationOverlay"
import { resolveBankLogo } from "@/lib/bankList"
import "./manjari.css"
import { normalizeLanguage, t } from "@/lib/i18n"
import { formatDate } from "@/lib/formatDate"

const A = (name: string) => `/templates/manjari/${name}`
const DEMO_TRACK = "/templates/manjari/lee-hi-only.mp3"
const DEFAULT_CLOSING =
  "Thank you for being part of our story. Your presence, prayers, and warm wishes mean more to us than words can express."
const DEFAULT_CLOSING_ID =
  "Terima kasih telah menjadi bagian dari kisah kami. Kehadiran, doa, dan ucapan hangat Anda berarti lebih dari yang dapat kami ungkapkan."

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

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

function youtubeBackground(url: string): string {
  const id = url.match(/\/embed\/([^?&/]+)/)?.[1] || url.match(/[?&]v=([^&]+)/)?.[1] || ""
  if (!id) return url
  const base = url.split("?")[0]
  return `${base}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&iv_load_policy=3&rel=0&playsinline=1`
}

export default function Manjari(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const photos = flattenPhotos(profile.gallery_photos)
  const coverSlots = flattenPhotos(profile.cover_photos)
  const cover = coverSlots[0] || coverPhotoOf(profile)
  const groomPhoto = flattenPhotos(profile.groom_photo_url)[0] || cover
  const bridePhoto = flattenPhotos(profile.bride_photo_url)[0] || cover
  const middleSlots = coverSlots.slice(1, -1)
  const loveStoryPhotos = middleSlots.length > 0 ? middleSlots : coverSlots.slice(1).length > 0 ? coverSlots.slice(1) : [cover]
  const closingPhoto = coverSlots.length > 2 ? coverSlots[coverSlots.length - 1] : cover || photos[0]
  const events = (profile.sessions || []).filter(Boolean)
  const stories = (profile.stories || []).filter((s) => s && (s.title || s.description))
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false
    ? (profile.inviting_families || []).filter(Boolean)
    : []
  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const hasStreaming = profile.livestream_visible !== false && !!profile.livestream?.url
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const directVideo = isDirectVideo(profile.video_url || "")
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const hasGallery = photos.length > 0 || hasVideo
  const trackUrl = profile.track_url || (profile.template_demo ? DEMO_TRACK : "")
  const hasTrack = !!trackUrl
  const guestName = profile.guest_name || t("honoredGuest", lang)
  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || (lang === "en" ? "The Wedding" : "Pernikahan")
  const dateLong = formatDate(profile.estimated_wedding_date || "", lang)
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const calendarUrl = gcalLink(events[0], profile.groom_name || "", profile.bride_name || "")
  const closingMessage = tc.closing_message || (lang === "en" ? DEFAULT_CLOSING : DEFAULT_CLOSING_ID)
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  // Shared floating dock (RSVP modal + guest QR). Same rule as the other
  // in-house templates: only after the cover opens, and only for resolved
  // guests (or flexible links that carry a slug).
  const showGuestDock =
    opened &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    if (hasTrack) {
      const audio = audioRef.current
      if (audio) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    }
  }, [hasTrack])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => { document.body.style.overflow = "" }
  }, [opened])

  useEffect(() => {
    if (!opened || loveStoryPhotos.length < 2) return
    const id = window.setInterval(() => setStoryIndex((v) => (v + 1) % loveStoryPhotos.length), 4000)
    return () => window.clearInterval(id)
  }, [opened, loveStoryPhotos.length])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    else { audio.pause(); setPlaying(false) }
  }

  const rootStyle = {
    "--names-len": Math.max(1, coupleLabel.length),
    "--guest-len": Math.max(1, guestName.length),
  } as CSSProperties

  return (
    <div ref={rootRef} className={`manjari-root preloader-done${opened ? "" : " locked"}`} style={rootStyle}>
      {hasTrack && <audio ref={audioRef} loop preload="metadata" data-warm-audio="" src={trackUrl} />}
      {hasTrack && (
        <button type="button" className={`manjari-music${playing ? " is-playing" : ""}`} onClick={toggleMusic} aria-label={playing ? "Pause music" : "Play music"}>
          <span>{playing ? "❚❚" : "♪"}</span>
        </button>
      )}

      <div className="page-shell">
        <aside className="desktop-cover" aria-hidden="true" style={{ backgroundImage: `url(${cover})` }}>
          <div className="desktop-cover__content">
            <p>{t("theWeddingOf", lang).toUpperCase()}</p>
            <h1>{coupleLabel}</h1>
          </div>
        </aside>

        <main className="invitation" id="invitation" aria-hidden={!opened}>
          <div className="parallax-photo" aria-hidden="true" style={{ backgroundImage: `url(${cover})` }} />

          <section className="verse burgundy manjari-verse" data-section="verse">
            <div className="pointer-events-none absolute inset-0 z-0">
              {opened && directVideo ? (
                <video className="manjari-verse-media" src={profile.video_url} autoPlay muted loop playsInline aria-hidden="true" />
              ) : opened && videoEmbed ? (
                <iframe className="manjari-verse-media" src={youtubeBackground(videoEmbed)} title="" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" aria-hidden="true" />
              ) : null}
            </div>
            <div className="manjari-verse-shade" />
            <p className="verse__hashtag reveal">{profile.display_name || `#${`${profile.groom_name || ""}${profile.bride_name || ""}`.replace(/\s+/g, "")}`}</p>
            <blockquote className="reveal">{profile.quote_text || ""}</blockquote>
            {profile.quote_source && <p className="script-source reveal">{profile.quote_source}</p>}
          </section>

          <section className="profile profile-bride section-photo" data-section="bride" style={{ backgroundImage: `url(${groomPhoto})` }}>
            <div className="profile__copy">
              <h2 style={{ "--name-len": Math.max(1, (profile.groom_full_name || profile.groom_name || "").length) } as CSSProperties}>
                {profile.groom_full_name || profile.groom_name}
              </h2>
              <i /><i className="short" />
              {profile.groom_parents && (
                <p className="profile__parents" style={{ "--parent-len": Math.max(1, profile.groom_parents.length) } as CSSProperties}>
                  {profile.groom_parents}
                </p>
              )}
              {profile.groom_instagram && (
                <a className="pill pill-ivory profile__instagram" href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  @{profile.groom_instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          </section>

          <section className="profile profile-groom section-photo" data-section="groom" style={{ backgroundImage: `url(${bridePhoto})` }}>
            <div className="profile__copy profile__copy--right">
              <h2 style={{ "--name-len": Math.max(1, (profile.bride_full_name || profile.bride_name || "").length) } as CSSProperties}>
                {profile.bride_full_name || profile.bride_name}
              </h2>
              <i /><i className="short" />
              {profile.bride_parents && (
                <p className="profile__parents" style={{ "--parent-len": Math.max(1, profile.bride_parents.length) } as CSSProperties}>
                  {profile.bride_parents}
                </p>
              )}
              {profile.bride_instagram && (
                <a className="pill pill-ivory profile__instagram" href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  @{profile.bride_instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          </section>

          <section className="love-story ivory" data-section="love-story">
            <h2 className="reveal">{tc.love_story_title || "A Love Written in Time"}</h2>
            <div className="story-stage reveal">
              <div className="story-carousel" aria-label={`${coupleLabel}'s story gallery`}>
                {loveStoryPhotos.slice(0, 4).map((src, index) => (
                  <img key={`${src}-${index}`} className={index === storyIndex % loveStoryPhotos.length ? "active" : ""} src={src} alt="" />
                ))}
              </div>
              {stories.map((story, index) => (
                <article key={`${story.title || "story"}-${index}`} className={`story story-${["one", "two", "three"][index] || "three"}`}>
                  <h3>{story.title || `Chapter ${index + 1}`}</h3>
                  {story.description && <p>{story.description}</p>}
                </article>
              ))}
            </div>
          </section>

          <div className="events__countdown section-photo">
            <div className="countdown-wrap reveal">
              <h2>{tc.countdown_title || t("countdown", lang)}</h2>
              <div className="countdown" aria-label={t("countdown", lang)}>
                <div><strong>{countdown?.d ?? "00"}</strong><span>{t("days", lang)}</span></div>
                <div><strong>{countdown?.h ?? "00"}</strong><span>{t("hours", lang)}</span></div>
                <div><strong>{countdown?.m ?? "00"}</strong><span>{t("minutes", lang)}</span></div>
                <div><strong>{countdown?.s ?? "00"}</strong><span>{t("seconds", lang)}</span></div>
              </div>
              {calendarUrl && (
                <a className="pill pill-ivory calendar-button" href={calendarUrl} target="_blank" rel="noreferrer">{t("saveToCalendar", lang).toUpperCase()}</a>
              )}
            </div>
          </div>

          <section className="events ivory" data-section="events">
            <div className="events__title">
              <img className="reveal" src={A("wedding-title.webp")} alt="" aria-hidden="true" />
              <h2 className="reveal">{tc.events_title || t("secEvent", lang)}</h2>
            </div>
            {events.map((event, index) => {
              const mapsUrl = event.maps_url || (event.venue || event.address ? `https://maps.google.com/?q=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "))}` : "")
              return (
                <article className="event reveal" key={`${event.name || "event"}-${index}`}>
                  <h2>{event.name || t("weddingEventFallback", lang)}</h2>
                  <h3>{formatDate(event.date || profile.estimated_wedding_date || "", lang)}</h3>
                  {event.time && <p>{event.time}</p>}
                  <i />
                  {event.venue && <h4>{event.venue}</h4>}
                  {event.address && <p>{event.address}</p>}
                  {mapsUrl && <a className="pill pill-burgundy maps-button" href={mapsUrl} target="_blank" rel="noreferrer">{t("viewLocation", lang).toUpperCase()}</a>}
                </article>
              )
            })}
          </section>

          {hasStreaming && (
            <section className="streaming burgundy" data-section="live-stream">
              <img className="reveal" src={A("confirmation-title.webp")} alt="" aria-hidden="true" />
              <div className="reveal">
                <h2>{profile.livestream?.title || t("secLivestream", lang)}</h2>
                <p>{profile.livestream?.description || (lang === "en" ? "Join us virtually as we share our wedding celebration live." : "Bergabunglah bersama kami secara virtual saat kami menyiarkan perayaan pernikahan secara langsung.")}</p>
                <a className="pill pill-ivory" href={profile.livestream!.url} target="_blank" rel="noreferrer">{profile.livestream?.buttonLabel || (lang === "en" ? "JOIN LIVE" : "TONTON LIVE")}</a>
              </div>
            </section>
          )}

          {hasDresscode && (
            <section className="dresscode-section ivory" data-section="dress-code">
              <div className="dresscode reveal">
                <h2>{profile.dresscode?.title || tc.dresscode_title || t("secDresscode", lang)}</h2>
                {profile.dresscode?.description && <p>{profile.dresscode.description}</p>}
                <div className="palette" aria-label={lang === "en" ? "Dress code color palette" : "Palet warna dress code"}>
                  {dressColors.map((color, index) => <span key={`${color.hex || color.name}-${index}`} style={{ "--color": color.hex || "#ccc" } as CSSProperties} title={color.name || ""} />)}
                </div>
              </div>
            </section>
          )}

          {hasGallery && (
            <section className="gallery ivory" data-section="gallery">
              <h2 className="reveal">{tc.gallery_title || t("secGallery", lang)}</h2>
              {photos.length > 0 && (
                <div className="gallery__grid">
                  {photos.slice(0, 6).map((src, index) => <img key={`${src}-${index}`} className="reveal" src={src} alt="" loading="lazy" />)}
                </div>
              )}
              {(tc.gallery_quote || profile.display_name) && (
                <figure className="gallery__quote reveal">
                  <blockquote>“{tc.gallery_quote || "A lifetime with you is the most beautiful story I could ever choose."}”</blockquote>
                  <figcaption>, {coupleLabel}</figcaption>
                </figure>
              )}
              {hasVideo && (
                <div className="gallery__video reveal">
                  {directVideo ? (
                    <video src={profile.video_url} controls playsInline />
                  ) : (
                    <iframe src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1`} title={`Video ${coupleLabel}`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" />
                  )}
                </div>
              )}
            </section>
          )}

          <section className="rsvp burgundy" data-section="rsvp">
            <div className="section-script reveal">
              <img className="reveal" src={A("wish-title.webp")} alt="" aria-hidden="true" />
              <h2>{tc.wishes_title || t("secWishes", lang)}</h2>
              <p>{tc.wishes_intro || (lang === "en" ? "Please let us know whether you will join our wedding celebration by completing the form below." : "Mohon konfirmasi kehadiran Anda dengan mengisi form di bawah ini.")}</p>
            </div>
            <div className="manjari-rsvp">
              <Wishes weddingProfileId={profile.wedding_profile_id} guestId={profile.guest_id} guestName={profile.guest_name} guestLinkStrict={profile.guest_link_strict} coupleName={coupleLabel} language={profile.language} />
            </div>
          </section>

          {hasGift && (
            <section className="digital-envelope burgundy" data-section="digital-envelope">
              <div className="digital-envelope__heading reveal">
                <h2>{tc.gift_intro_title || t("secGift", lang)}</h2>
                <p>{tc.gift_intro_description || (lang === "en" ? "Your presence is the greatest gift to us." : "Kehadiran Anda adalah hadiah terindah bagi kami.")}</p>
              </div>
              <div className="digital-envelope__list reveal">
                {accounts.map((account, index) => {
                  const logo = resolveBankLogo(account.provider_name || "")
                  return (
                    <div className="manjari-gift-card" key={`${account.account_number || "account"}-${index}`}>
                      {logo && <img src={logo} alt="" className="manjari-gift-logo" />}
                      <p className="manjari-gift-name">{account.account_name}</p>
                      <p className="manjari-gift-number">{account.account_number}</p>
                    </div>
                  )
                })}
                {giftAddress && (
                  <div className="manjari-gift-card">
                    <p className="manjari-gift-provider">{t("sendGift", lang)}</p>
                    {profile.gift_address_name && <p className="manjari-gift-name">{profile.gift_address_name}</p>}
                    <p className="manjari-gift-address">{giftAddress}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {honored.length > 0 && (
            <section className="honored ivory" data-section="honored-guests">
              <img className="manjari-section-ornament" src={A("wish-title.webp")} alt="" aria-hidden="true" />
              <h2 className="reveal">{t("secInviting", lang)}</h2>
              <div className="honored__grid">
                <div className="honored__col reveal">
                  <ul className="honored__names">
                    {honored.map((name, index) => <li className="honored__name" key={`${name}-${index}`}>{name}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {rundown.length > 0 && (
            <section className="manjari-rundown ivory" data-section="rundown">
              <img className="manjari-section-ornament" src={A("wish-title.webp")} alt="" aria-hidden="true" />
              <h2>{tc.rundown_title || t("secRundown", lang)}</h2>
              <ul>
                {rundown.map((item, index) => (
                  <li key={`${item.time || "rundown"}-${index}`}>
                    <strong>{item.time}</strong>
                    {item.description && <span>{item.description}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="thanks section-photo" data-section="thank-you">
            <div className="thanks__content reveal">
              <h2>{lang === "en" ? "With Grateful Hearts" : "Dengan Penuh Syukur"}</h2>
              <p>{closingMessage}</p>
              <div className="envelope-art envelope-art--closing">
                <img className="envelope-art__back" src={A("envelope-back.webp")} alt="" loading="lazy" />
                <div className="polaroid polaroid--single"><img src={closingPhoto} alt="" loading="lazy" /></div>
                <img className="envelope-art__front" src={A("envelope-front.webp")} alt="" loading="lazy" />
                <img className="envelope-art__flower-side envelope-art__flower-side--left" src={A("flower-right-left-envelope.webp")} alt="" loading="lazy" />
                <img className="envelope-art__flower-side envelope-art__flower-side--right" src={A("flower-right-left-envelope.webp")} alt="" loading="lazy" />
              </div>
              <h3>{coupleLabel}</h3>
              {profile.display_name && <span className="thanks__hashtag">{profile.display_name}</span>}
              <footer className="tpl-footer manjari-footer">
                <a
                  className="tpl-footer__link"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={lang === "en" ? "Contact Aksaraa Wedding via WhatsApp" : "Hubungi Aksaraa Wedding via WhatsApp"}
                >
                  <span className="tpl-footer__badge">
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="tpl-footer__logo" draggable={false} />
                  </span>
                  <span className="tpl-footer__cta">{lang === "en" ? "Wedding by Aksaraa" : "Undangan Pernikahan oleh Aksaraa"}</span>
                </a>
                <p className="tpl-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
              </footer>
            </div>
          </section>
        </main>
      </div>

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || t("honoredGuest", lang)}
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
                  language={profile.language}
        />
      )}

      <div className={`opening${opened ? " opened" : ""}`} id="cover" role="dialog" aria-modal="true" aria-labelledby="opening-title">
        <div className="opening__panel">
          <div className="opening__slides" aria-hidden="true" />
          <div className="opening__content">
            <div className="opening__top">
              <p>{t("theWeddingOf", lang).toUpperCase()}</p>
              <h2 id="opening-title">{coupleLabel}</h2>
              {dateLong && <time>{dateLong}</time>}
            </div>
            <div className="opening__envelope">
              <div className="envelope-art envelope-art--cover">
                <img className="envelope-art__back" src={A("envelope-back.webp")} alt="" />
                <img className="envelope-art__flower-inside" src={A("flower-center-inside-envelope.webp")} alt="" />
                <div className="polaroid polaroid--left"><img src={cover} alt="" /></div>
                <div className="polaroid polaroid--right"><img src={loveStoryPhotos[0] || cover} alt="" /></div>
                <img className="envelope-art__front" src={A("envelope-front.webp")} alt="" />
                <img className="envelope-art__flower-side envelope-art__flower-side--left" src={A("flower-right-left-envelope.webp")} alt="" />
                <img className="envelope-art__flower-side envelope-art__flower-side--right" src={A("flower-right-left-envelope.webp")} alt="" />
              </div>
            </div>
            <div className="opening__bottom">
              <span>{lang === "en" ? "Dear," : "Kepada Yth,"}</span>
              <strong>{guestName}</strong>
              <small>{tc.cover_apology || (lang === "en" ? "We apologize for any misspelling of your name." : "Kami mohon maaf apabila terdapat kesalahan penulisan nama.")}</small>
              <button className="pill pill-burgundy" type="button" onClick={openInvitation}>{t("openInvitation", lang)}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
