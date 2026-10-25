"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { resolveBankLogo } from "@/lib/bankList"
import {
  countdownTarget,
  coverPhoto as coverPhotoOf,
  flattenPhotos,
  formatLongDate,
  gcalLink,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./minang-royal.css"

const A = (name: string) => `/templates/minang-royal/${name}`
const DEMO_TRACK = "/templates/minang-royal/bergema.mp3"
const DEFAULT_CLOSING =
  "Family & Friends. From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives."

function youtubeId(url?: string): string {
  if (!url) return ""
  const id = url.match(/[?&]v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?&/]+)/)?.[1] || url.match(/\/live\/([^?&/]+)/)?.[1] || ""
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : ""
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

function Ornaments() {
  return (
    <>
      <div className="coconut-tree left"><div className="image-wrap"><img src={A("pohon.png")} alt="" /></div></div>
      <div className="coconut-tree right"><div className="image-wrap"><img src={A("pohon.png")} alt="" /></div></div>
      <div className="flowers bottom-01 left"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
      <div className="flowers bottom-02 left"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
      <div className="flowers bottom-01 right"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
      <div className="flowers bottom-02 right"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
    </>
  )
}

export default function MinangRoyal(profile: TemplateProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const photos = flattenPhotos(profile.gallery_photos)
  const coverSlots = flattenPhotos(profile.cover_photos)
  const cover = coverSlots[0] || coverPhotoOf(profile)
  const groomPhoto = flattenPhotos(profile.groom_photo_url)[0] || cover
  const bridePhoto = flattenPhotos(profile.bride_photo_url)[0] || cover
  const closingPhoto = coverSlots[2] || cover || photos[0]
  const storyPhoto = coverSlots[1] || cover
  const events = (profile.sessions || []).filter(Boolean)
  const stories = (profile.stories || []).filter((s) => s && (s.title || s.description))
  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false ? (profile.inviting_families || []).filter(Boolean) : []
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const hasStreaming = profile.livestream_visible !== false && !!profile.livestream?.url
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const trackUrl = profile.track_url || (profile.template_demo ? DEMO_TRACK : "")
  const hasTrack = !!trackUrl
  const guestName = profile.guest_name || "Our Beloved Guest"
  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || "The Wedding"
  const groomFull = profile.groom_full_name || profile.groom_name || ""
  const brideFull = profile.bride_full_name || profile.bride_name || ""
  const dateLong = formatLongDate(profile.estimated_wedding_date)
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const calendarUrl = gcalLink(events[0], profile.groom_name || "", profile.bride_name || "")
  const closingMessage = tc.closing_message || DEFAULT_CLOSING

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    if (hasTrack) audioRef.current?.play().then(() => setPlaying(true), () => setPlaying(false))
  }, [hasTrack])

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => { document.body.style.overflow = "" }
  }, [opened])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    else { audio.pause(); setPlaying(false) }
  }

  return (
    <div className={`minang-royal-root${opened ? " is-open" : " is-locked"}`}>
      {hasTrack && <audio ref={audioRef} loop preload="auto" src={trackUrl} />}
      {hasTrack && <button type="button" className={`mr-music${playing ? " is-playing" : ""}`} onClick={toggleMusic}>{playing ? "❚❚" : "♪"}</button>}

      <section className="kat-page__side-to-side">
        <section className="primary-pane">
          <div className="inner">
            <Ornaments />
            <div className="details">
              <h1 className="prime-title">{coupleLabel}</h1>
              <p>Hai<br />{guestName}</p>
            </div>
          </div>
        </section>

        <section className="secondary-pane">
          {!opened && (
            <section className="top-cover">
              <div className="rumah-gadang"><div className="image-wrap"><img src={A("orn-topcover-1.png")} alt="" /></div></div>
              <Ornaments />
              <div className="inner">
                <div className="details">
                  <h1 className="prime-title">{coupleLabel}</h1>
                  <p>Hai<br />{guestName}</p>
                  <div><a href="#" className="link" onClick={(e) => { e.preventDefault(); openInvitation() }}>Open Invitation</a></div>
                </div>
              </div>
            </section>
          )}

          {opened && (
            <>
              <section className="couple-wrap">
                <div className="couple">
                  <div className="couple-head">
                    <h1 className="couple-title">The Wedding Of</h1>
                    <p className="couple-description">{profile.opening_description || "Dengan memohon rahmat Allah SWT, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami."}</p>
                  </div>
                  <div className="couple-body show-picture">
                    <div className="couple-info groom">
                      <div className="couple-preview-wrap"><div className="couple-picture couple-preview"><a className="img-wrap"><img className="img" src={groomPhoto} alt="" /></a></div></div>
                      <div className="couple-details">
                        <h2 className="couple-name">{groomFull}</h2>
                        {profile.groom_parents && <p className="couple-parents">{profile.groom_parents}</p>}
                        {profile.groom_instagram && <div className="couple-link-wrap"><a className="couple-link" href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{profile.groom_instagram.replace(/^@/, "")}</a></div>}
                      </div>
                    </div>
                    <div className="separator-wrap"><div className="orn-kupu-kupu-2"><div className="image-wrap"><img src={A("kupu-kupu-2.png")} alt="" /></div></div><div className="separator"><h2 className="couple-separator">&amp;</h2></div></div>
                    <div className="couple-info bride">
                      <div className="couple-preview-wrap"><div className="couple-picture couple-preview"><a className="img-wrap"><img className="img" src={bridePhoto} alt="" /></a></div></div>
                      <div className="couple-details">
                        <h2 className="couple-name">{brideFull}</h2>
                        {profile.bride_parents && <p className="couple-parents">{profile.bride_parents}</p>}
                        {profile.bride_instagram && <div className="couple-link-wrap"><a className="couple-link" href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{profile.bride_instagram.replace(/^@/, "")}</a></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="save-date-wrap">
                <div className="save-date">
                  <div className="save-date-head"><h1 className="save-date-title">Save The Date</h1></div>
                  <div className="save-date-body">
                    <div className="countdown">
                      <div className="count-item"><h2 className="count-num count-day">{countdown?.d ?? "0"}</h2><small className="count-text">Days</small></div>
                      <div className="count-item"><h2 className="count-num count-hour">{countdown?.h ?? "0"}</h2><small className="count-text">Hours</small></div>
                      <div className="count-item"><h2 className="count-num count-minute">{countdown?.m ?? "0"}</h2><small className="count-text">Minutes</small></div>
                      <div className="count-item"><h2 className="count-num count-second">{countdown?.s ?? "0"}</h2><small className="count-text">Seconds</small></div>
                    </div>
                    {calendarUrl && <div className="add-to-calendar-wrap"><a className="add-to-calendar" href={calendarUrl} target="_blank" rel="noreferrer">Add to Calendar</a></div>}
                  </div>
                </div>
              </section>

              {stories.length > 0 && (
                <section className="love-story">
                  <div className="inner"><div className="body"><div className="stories">
                    {stories.map((story, index) => (
                      <div className="story" key={`${story.title || "story"}-${index}`}>
                        <div className="content">
                          <div className="preview"><a><img src={story.image_url || photos[index] || storyPhoto} alt="" /></a></div>
                          <div className="details"><h2>{story.title || `Story ${index + 1}`}</h2>{story.description && <p>{story.description}</p>}</div>
                        </div>
                      </div>
                    ))}
                  </div></div></div>
                </section>
              )}

              <section className="agenda-wrap">
                <div className="agenda-inner">
                  <div className="agenda-head"><h1 className="agenda-title">Wedding Day</h1><p className="agenda-description">{profile.opening_description || "Dengan memohon rahmat Allah SWT, kami mengundang Anda untuk menghadiri rangkaian pernikahan kami."}</p></div>
                  <div className="agenda-body">
                    {events.map((event, index) => {
                      const mapsUrl = event.maps_url || (event.venue || event.address ? `https://maps.google.com/?q=${encodeURIComponent([event.venue, event.address].filter(Boolean).join(", "))}` : "")
                      return (
                        <div className="event-item" key={`${event.name || "event"}-${index}`}>
                          <div className="event-content">
                            <div className="event-head"><h1 className="event-day">{formatLongDate(event.date || profile.estimated_wedding_date)}</h1><p className="event-date">{event.time}</p></div>
                            <div className="event-details">
                              <div className="event-description">{event.name}</div>
                              {event.venue && <h3 className="event-hall">{event.venue}</h3>}
                              {event.address && <p className="event-address">{event.address}</p>}
                              {mapsUrl && <div className="event-link-wrap"><a className="event-link" href={mapsUrl} target="_blank" rel="noreferrer">View Maps</a></div>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>

              {hasDresscode && (
                <section className="dress-wrapper">
                  <div className="dress-inner">
                    <div className="dress-header"><h1 className="dress-title">{profile.dresscode?.title || "Dresscode"}</h1><p className="dress-desc">{profile.dresscode?.description || "We would be delighted if our guests wore outfits inspired by the following color palette."}</p></div>
                    <div className="dress-body"><div className="dress-color-list">{dressColors.map((c, i) => <div className="dress-color-item" key={`${c.hex || c.name}-${i}`} style={{ background: c.hex || "#ccc" }} title={c.name || ""} />)}</div></div>
                  </div>
                </section>
              )}

              {rundown.length > 0 && (
                <section className="rundown-container">
                  <div className="rundown-inner">
                    <h3 className="rundown-title">Rundown</h3>
                    <div className="rundown-event-list"><div className="rundown-event"><div className="rundown-agenda-list">
                      {rundown.map((item, index) => (
                        <div className="rundown-agenda" key={`${item.time || "rundown"}-${index}`}>
                          <p className="rundown-agenda-time">{item.time}</p>
                          <div className="rundown-divider"><div className="rundown-line" /><div className="rundown-circle" /></div>
                          <div className="rundown-agenda-content"><p className="rundown-agenda-text">{item.description}</p></div>
                        </div>
                      ))}
                    </div></div></div>
                  </div>
                </section>
              )}

              {photos.length > 0 && (
                <section className="photo-wrap">
                  <div className="photo-inner"><div className="photo-head"><h1 className="photo-title">Photo Gallery</h1></div><div className="photo-body"><div className="photo-box">{photos.slice(0, 8).map((src, i) => <a key={`${src}-${i}`} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" loading="lazy" /></a>)}</div></div></div>
                </section>
              )}

              {hasStreaming && (
                <section className="live-streaming">
                  <div className="inner"><div className="head"><h1>Live Streaming</h1><p>{profile.livestream?.description || "Please join and watch us become husband & wife"}</p></div><div className="body"><div className="streaming-info"><div><div className="preview wide youtube"><img src={youtubeId(profile.livestream?.url) ? `https://i3.ytimg.com/vi/${youtubeId(profile.livestream?.url)}/maxresdefault.jpg` : cover} alt="" /><a className="play-btn" href={profile.livestream!.url} target="_blank" rel="noreferrer">▶</a></div></div></div></div></div>
                </section>
              )}

              {hasVideo && (
                <section className="photo-wrap"><div className="photo-inner"><div className="photo-head"><h1 className="photo-title">Our Video</h1></div><div className="photo-body"><div className="preview wide youtube"><iframe src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=0&mute=1&controls=1&rel=0&playsinline=1`} title="Video" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" /></div></div></div></section>
              )}

              {hasGift && (
                <section className="wedding-gift-wrap">
                  <div className="wedding-gift-inner">
                    <div className="wedding-gift-head"><h1 className="wedding-gift-title">{tc.gift_intro_title || "Wedding Gift"}</h1><p className="wedding-gift-description">{tc.gift_intro_description || "Your blessing and coming to our wedding are enough for us. However, if you want to give a gift we provide a Digital Envelope."}</p></div>
                    <div className="wedding-gift-body"><div className="wedding-gift-bank-wrap">
                      {accounts.map((account, index) => {
                        const logo = resolveBankLogo(account.provider_name || "")
                        return (
                          <div className="bank-item" key={`${account.account_number || "account"}-${index}`}>
                            <div className="bank-detail">
                              {logo && <img className="mr-bank-logo" src={logo} alt="" />}
                              <h3 className="bank-name">{account.provider_name}</h3>
                              <small className="bank-account-number-label">Account Number</small>
                              <h4 className="bank-account-number">{account.account_number}</h4>
                              <small className="bank-account-name-label">Account Name</small>
                              <h4 className="bank-account-name">{account.account_name}</h4>
                            </div>
                          </div>
                        )
                      })}
                      {giftAddress && <div className="bank-item"><div className="bank-detail"><h3 className="bank-name">Send a Gift</h3>{profile.gift_address_name && <h4 className="bank-account-name">{profile.gift_address_name}</h4>}<p className="bank-account-name">{giftAddress}</p></div></div>}
                    </div></div>
                  </div>
                </section>
              )}

              <section className="wedding-wish-wrap">
                <div className="wedding-wish-inner">
                  <div className="wedding-wish-head"><h1 className="wedding-wish-title">Wedding Wish</h1></div>
                  <div className="wedding-wish-body"><Wishes weddingProfileId={profile.wedding_profile_id} guestId={profile.guest_id} guestName={profile.guest_name} coupleName={coupleLabel} /></div>
                </div>
              </section>

              {honored.length > 0 && (
                <section className="notes-container"><div className="note"><h4 className="note-title">Turut Mengundang</h4><p className="note-description">{honored.join("\n")}</p></div></section>
              )}

              <section className="notes-container"><div className="note"><h4 className="note-title">Thank You</h4><p className="note-description">{closingMessage}</p></div></section>

              <section className="footnote-wrap">
                <div className="footnote">
                  <p className="top-text">Wedding Invitation</p>
                  <h2 className="footnote-title">{coupleLabel}</h2>
                  <p className="date">{dateLong}</p>
                  {profile.display_name && <p className="bottom-text">{profile.display_name}</p>}
                </div>
              </section>
            </>
          )}
        </section>
      </section>
    </div>
  )
}
