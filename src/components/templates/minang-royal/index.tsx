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
  initialsGlyphs,
  monogramFontSize,
  normalizeVideoUrl,
} from "../shared/lib"
import Wishes from "./Wishes"
import "./minang-royal.css"
import { normalizeLanguage, t } from "@/lib/i18n"

const A = (name: string) => `/templates/minang-royal/${name}`
const DEMO_TRACK = "/templates/minang-royal/bergema.mp3"
const DEFAULT_CLOSING =
  "Family & Friends. From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives."

const DAYS = {
  id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
}
const MONTHS = {
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}

type Session = NonNullable<TemplateProps["sessions"]>[number]

function parseEventDate(value?: string | null): Date | null {
  if (!value) return null
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(String(value))
  return isNaN(d.getTime()) ? null : d
}

function dayName(value: string | null | undefined, lang: "id" | "en"): string {
  const d = parseEventDate(value)
  return d ? DAYS[lang][d.getDay()] : ""
}

function longDate(value: string | null | undefined, lang: "id" | "en"): string {
  const d = parseEventDate(value)
  return d ? `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}` : ""
}

function dotDate(value?: string | null): string {
  const d = parseEventDate(value)
  if (!d) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${d.getFullYear()}`
}

// Reference renders one .event-item per date, each holding an .activity-item per
// session (Akad Nikah, Resepsi, …) so a two-session day stays a single block.
function groupSessions(sessions: Session[]): { date: string; items: Session[] }[] {
  const groups: { date: string; items: Session[] }[] = []
  for (const session of sessions) {
    const key = session.date || ""
    const existing = groups.find((group) => group.date === key)
    if (existing) existing.items.push(session)
    else groups.push({ date: key, items: [session] })
  }
  return groups
}

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

function SectionSeparator() {
  return (
    <div className="section-separator-wrap top">
      <img src={A("orn-section-min.png")} alt="" className="section-separator" />
    </div>
  )
}

export default function MinangRoyal(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [bankIndex, setBankIndex] = useState(0)
  const [copied, setCopied] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const photos = flattenPhotos(profile.gallery_photos)
  const coverSlots = flattenPhotos(profile.cover_photos)
  const cover = coverSlots[0] || coverPhotoOf(profile)
  const closingPhoto = coverSlots[1] || ""
  const groomPhoto = flattenPhotos(profile.groom_photo_url)[0] || cover
  const bridePhoto = flattenPhotos(profile.bride_photo_url)[0] || cover
  const storyPhoto = cover
  const events = (profile.sessions || []).filter(Boolean)
  const groups = groupSessions(events)
  const stories = (profile.stories || []).filter((s) => s && (s.title || s.description))
  const rundown = profile.rundown_visible !== false ? (profile.rundown || []).filter((r) => r && (r.time || r.description)) : []
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false ? (profile.inviting_families || []).filter(Boolean) : []
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? profile.gift_address || "" : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const activeAccount = accounts[Math.min(bankIndex, Math.max(accounts.length - 1, 0))]
  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode = profile.dresscode_visible !== false && dressColors.length > 0
  const hasStreaming = profile.livestream_visible !== false && !!profile.livestream?.url
  const streamId = youtubeId(profile.livestream?.url)
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const trackUrl = profile.track_url || (profile.template_demo ? DEMO_TRACK : "")
  const hasTrack = !!trackUrl
  const guestName = profile.guest_name || "Our Beloved Guest"
  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || "The Wedding"
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`
  const groomFull = profile.groom_full_name || profile.groom_name || ""
  const brideFull = profile.bride_full_name || profile.bride_name || ""
  const dateLong = dotDate(profile.estimated_wedding_date || events[0]?.date)
  const countdown = useCountdown(profile.estimated_wedding_date, profile.sessions)
  const calendarUrl = gcalLink(events[0], profile.groom_name || "", profile.bride_name || "")
  const closingMessage = tc.closing_message || DEFAULT_CLOSING
  const quoteText = profile.quote_text || ""
  const quoteSource = profile.quote_source || ""
  const monogram = ((profile.couple_initials || "").trim() || [profile.groom_name, profile.bride_name]
    .map((name) => (name || "").trim()[0] || "")
    .join("")).toUpperCase()
  const monogramCount = initialsGlyphs(monogram).length
  const dressTitle = profile.dresscode?.title || "Dresscode"
  const dressDesc = profile.dresscode?.description || "Formal Attire"

  const openInvitation = useCallback(() => {
    setOpened(true)
    const scroller = document.querySelector(".minang-royal-root .kat-page__side-to-side")
    if (scroller) scroller.scrollTop = 0
    if (hasTrack) audioRef.current?.play().then(() => setPlaying(true), () => setPlaying(false))
  }, [hasTrack])

  // The reference locks scrolling with CSS (`html:has(.minang-royal-root)`), so
  // no body-level overflow juggling here — that used to freeze desktop scroll.
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const toggleMusic = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().then(() => setPlaying(true), () => setPlaying(false))
    else { audio.pause(); setPlaying(false) }
  }

  const copyAccount = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(""), 2000)
    } catch {
      setCopied("")
    }
  }

  return (
    <div className="minang-royal-root">
      {hasTrack && <audio ref={audioRef} loop preload="metadata" data-warm-audio="" src={trackUrl} />}
      {hasTrack && (
        <div className="music-outer">
          <button
            type="button"
            className={`music-box${playing ? " playing" : ""}`}
            onClick={toggleMusic}
            aria-label={playing ? (lang === "en" ? "Pause music" : "Jeda musik") : (lang === "en" ? "Play music" : "Putar musik")}
            aria-pressed={playing}
          >
            <span className="music-vinyl">
              <span className="music-vinyl-groove music-vinyl-groove-1" />
              <span className="music-vinyl-groove music-vinyl-groove-2" />
              <span className="music-vinyl-label" />
              <span className="music-vinyl-hole" />
            </span>
            <span className="music-tonearm">
              <span className="music-tonearm-pivot" />
              <span className="music-tonearm-arm" />
              <span className="music-tonearm-head" />
            </span>
          </button>
        </div>
      )}

      <section className="kat-page__side-to-side">
        <section className="primary-pane">
          <div className="inner">
            <Ornaments />
            <div className="details">
              <h1 className="prime-title">{coupleLabel}</h1>
              <p>{lang === "en" ? "Hello" : "Hai"}<br />{guestName}</p>
            </div>
          </div>
        </section>

        <section className="secondary-pane">
          {/* Mobile-only opening cover. Hidden ≥961px, where section.cover takes over. */}
          <section className={`top-cover${opened ? " hide" : ""}`} data-section-order="opening_cover">
            <div className="rumah-gadang"><div className="image-wrap"><img src={A("orn-topcover-1.png")} alt="" /></div></div>
            <Ornaments />
            <div className="inner">
              <div className="details">
                <h1 className="prime-title">{coupleLabel}</h1>
                <p>{lang === "en" ? "Hello" : "Hai"}<br />{guestName}</p>
                <div>
                  <a href="#invitation" className="link" onClick={(event) => { event.preventDefault(); openInvitation() }}>
                    {t("openInvitation", lang)}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="cover" data-section-order="cover">
            <div className="batik-separator">
              <div className="image-wrap"><img src={A("batik.png")} alt="" /></div>
            </div>
            <div className="inner">
              {monogram && (
                <div className="head">
                  <div className="logo-wrap">
                    <span
                      className="mr-monogram"
                      style={monogramCount > 2 ? { fontSize: monogramFontSize(monogram, 34), letterSpacing: monogramCount > 3 ? 0 : 1 } : undefined}
                    >
                      {monogram}
                    </span>
                  </div>
                </div>
              )}
              <div className="body highlight">
                <div className="orn-kupu-kupu">
                  <div className="image-wrap"><img src={A("kupu-kupu.png")} alt="" /></div>
                </div>
                <div className="cover-frame">
                  <div className="preview-container cover-show">
                    <div className="picture"><img src={cover} alt="" /></div>
                  </div>
                </div>
              </div>
              <div className="foot">
                <p className="top-text">Wedding Invitation</p>
                <h1 className="prime-title">{coupleLabel}</h1>
                {profile.display_name && <p className="bottom-text">{profile.display_name}</p>}
              </div>
            </div>
          </section>

          {quoteText && (
            <div className="section-group top" data-section-order="quote">
              <SectionSeparator />
              <div className="quote-wrap">
                <div className="quote-inner">
                  <p className="quote-caption">
                    &ldquo;{quoteText}&rdquo;
                    {quoteSource && <><br /><br />({quoteSource})</>}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="section-group top" data-section-order="couple">
            <SectionSeparator />
            <section className="couple-wrap">
              <div className="couple">
                <div className="couple-head">
                  <h1 className="couple-title">{t("theWeddingOf", lang)}</h1>
                  <p className="couple-description">
                    {(profile.opening_description || "Bismillahirrahmanirrahim\nAssalamu'alaikum Warahmatullahi Wabarakatuh\nMaha Suci Allah yang telah menciptakan mahkluk-Nya berpasang-pasangan.")
                      .split("\n")
                      .map((line, index) => (
                        <span key={`line-${index}`}>{index > 0 && <br />}{line}</span>
                      ))}
                  </p>
                </div>
                <div className="couple-body show-picture">
                  <div className="couple-info groom">
                    <div className="couple-preview-wrap">
                      <div className="couple-picture couple-preview">
                        <a className="img-wrap"><img className="img" src={groomPhoto} alt="" /></a>
                      </div>
                    </div>
                    <div className="couple-details">
                      <h2 className="couple-name">{groomFull}</h2>
                      {profile.groom_parents && <p className="couple-parents">{profile.groom_parents}</p>}
                      {profile.groom_instagram && (
                        <div className="couple-link-wrap">
                          <a className="couple-link" href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                            @{profile.groom_instagram.replace(/^@/, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="separator-wrap">
                    <div className="orn-kupu-kupu-2"><div className="image-wrap"><img src={A("kupu-kupu-2.png")} alt="" /></div></div>
                    <div className="separator"><h2 className="couple-separator">&amp;</h2></div>
                  </div>
                  <div className="couple-info bride">
                    <div className="couple-preview-wrap">
                      <div className="couple-picture couple-preview">
                        <a className="img-wrap"><img className="img" src={bridePhoto} alt="" /></a>
                      </div>
                    </div>
                    <div className="couple-details">
                      <h2 className="couple-name">{brideFull}</h2>
                      {profile.bride_parents && <p className="couple-parents">{profile.bride_parents}</p>}
                      {profile.bride_instagram && (
                        <div className="couple-link-wrap">
                          <a className="couple-link" href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                            @{profile.bride_instagram.replace(/^@/, "")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="section-group top" data-section-order="save_the_date">
            <SectionSeparator />
            <section className="save-date-wrap">
              <div className="save-date">
                <div className="save-date-head"><h1 className="save-date-title">{t("saveTheDate", lang)}</h1></div>
                <div className="save-date-body">
                  <div className="countdown">
                    <div className="count-item"><h2 className="count-num count-day">{countdown?.d ?? "0"}</h2><small className="count-text">Days</small></div>
                    <div className="count-item"><h2 className="count-num count-hour">{countdown?.h ?? "0"}</h2><small className="count-text">Hours</small></div>
                    <div className="count-item"><h2 className="count-num count-minute">{countdown?.m ?? "0"}</h2><small className="count-text">Minutes</small></div>
                    <div className="count-item"><h2 className="count-num count-second">{countdown?.s ?? "0"}</h2><small className="count-text">Seconds</small></div>
                  </div>
                </div>
                {calendarUrl && (
                  <div className="add-to-calendar-wrap">
                    <a className="add-to-calendar" href={calendarUrl} target="_blank" rel="noreferrer">Add to Calendar</a>
                  </div>
                )}
              </div>
            </section>
          </div>

          {stories.length > 0 && (
            <div className="section-group top" data-section-order="love_story">
              <SectionSeparator />
              <section className="love-story">
                <div className="inner">
                  <div className="body">
                    <div className="stories">
                      {stories.map((story, index) => (
                        <div className="story" key={`${story.title || "story"}-${index}`}>
                          <div className="content">
                            <div className="preview"><a><img src={story.image_url || photos[index] || storyPhoto} alt="" /></a></div>
                            <div className="details">
                              <h2>{story.title || `Story ${index + 1}`}</h2>
                              {story.description && <p>{story.description}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {groups.length > 0 && (
            <section className="agenda-wrap" data-section-order="event">
              <div className="agenda-inner">
                <div className="agenda-head">
                  <div className="orn-kupu-kupu-2"><div className="image-wrap"><img src={A("kupu-kupu-2.png")} alt="" /></div></div>
                  <h1 className="agenda-title">{tc.events_title || t("secEvent", lang)}</h1>
                  <p className="agenda-description">
                    {tc.events_intro ||
                      "Untuk melaksanakan syariat agama-Mu, mengikuti sunnah rasul-Mu dalam membentuk keluarga yang Sakinah, Mawaddah, Warahmah yang Insya Allah akan diselenggarakan pada hari:"}
                  </p>
                </div>
                <div className="agenda-body">
                  {groups.map((group, groupIndex) => (
                    <div className="event-item" key={`event-${group.date || groupIndex}`}>
                      <div className="section-group bottom combine-wrapper-04">
                        <div className="section-separator-wrap bottom">
                          <img src={A("orn-section-min.png")} alt="" className="section-separator" />
                        </div>
                      </div>
                      <div className="event-content">
                        <div className="activity-wrap">
                          {group.items.map((event, index) => {
                            const place = [event.venue, event.address].filter(Boolean).join(", ")
                            const mapsUrl = event.maps_url || (place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : "")
                            return (
                              <div className="activity-item" key={`${event.name || "activity"}-${index}`}>
                                <div className="activity-head">
                                  <h1 className="activity-title">{event.name || "Wedding Ceremony"}</h1>
                                  {(dayName(group.date, lang) || longDate(group.date, lang)) && (
                                    <p className="activity-date">
                                      {dayName(group.date, lang) && <span className="activity-day">{dayName(group.date, lang)}</span>}
                                      {(longDate(group.date, lang) || dateLong) && <span className="activity-date-text">{longDate(group.date, lang) || dateLong}</span>}
                                    </p>
                                  )}
                                  {event.time && <p className="activity-time">{event.time}</p>}
                                </div>
                                <div className="activity-details">
                                  {event.venue && <p className="activity-hall">{event.venue}</p>}
                                  {event.address && <p className="activity-address">{event.address}</p>}
                                  {mapsUrl && (
                                    <div className="activity-link-wrap">
                                      <a href={mapsUrl} className="activity-link" target="_blank" rel="noreferrer">View Maps</a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasDresscode && (
                  <div className="dress-wrapper">
                    <div className="dress-inner">
                      <div className="dress-header">
                        <h2 className="dress-title">{dressTitle}</h2>
                        <p className="dress-desc">{dressDesc}</p>
                      </div>
                      <div className="dress-body">
                        <div className="dress-list">
                          {[
                            { label: "Men", icon: "ic-dress-man-formal.png", preview: "man-preview" },
                            { label: "Women", icon: "ic-dress-woman-formal.png", preview: "woman-preview" },
                          ].map((group) => (
                            <div className="dress-item" key={group.label}>
                              <p className="dress-item-title">{group.label}</p>
                              <div className={`dress-preview ${group.preview}`}>
                                <div className="dress-icon">
                                  <img className="dress-icon-img" src={A(group.icon)} alt="" width={36} height={36} />
                                  <p className="dress-icon-label">Formal</p>
                                </div>
                              </div>
                              <div className="dress-color-list">
                                {dressColors.map((color, index) => (
                                  <div
                                    className="dress-color-item"
                                    key={`${group.label}-${color.hex || color.name || index}`}
                                    style={{ "--bg-color": color.hex || "#ccc" } as CSSProperties}
                                    title={color.name || color.hex || ""}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {tc.dresscode_note && (
                        <div className="dress-footer"><p className="dress-note">{tc.dresscode_note}</p></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {rundown.length > 0 && (
            <section className="rundown-container" data-section-order="rundown">
              <div className="rundown-inner">
                <h3 className="rundown-title">Rundown</h3>
                <div className="rundown-event-list">
                  <div className="rundown-event">
                    <h5 className="rundown-event-title">{groups[0]?.items[0]?.name || "Resepsi"}</h5>
                    <div className="rundown-agenda-list">
                      {rundown.map((item, index) => (
                        <div className="rundown-agenda" key={`${item.time || "rundown"}-${index}`}>
                          <p className="rundown-agenda-time">{item.time}</p>
                          <div className="rundown-divider"><div className="rundown-line" /><div className="rundown-circle" /></div>
                          <div className="rundown-agenda-content"><p className="rundown-agenda-text">{item.description}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {photos.length > 0 && (
            <div className="section-group top" data-section-order="gallery_photo">
              <SectionSeparator />
              <section className="photo-wrap">
                <div className="photo-inner">
                  <div className="photo-head">
                    <h1 className="photo-title">Photo Gallery</h1>
                    {tc.gallery_intro && <p className="photo-description">{tc.gallery_intro}</p>}
                  </div>
                  <div className="photo-body">
                    <div className="photo-box">
                      {photos.slice(0, 8).map((src, index) => (
                        <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer">
                          <img src={src} alt="" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {hasStreaming && (
            <section className="live-streaming" data-section-order="live_streaming">
              <div className="inner">
                <div className="head">
                  <h1>{profile.livestream?.title || "Live Streaming"}</h1>
                  <p>{profile.livestream?.description || "Please join and watch us become husband & wife"}</p>
                </div>
                <div className="body">
                  <div className="streaming-info">
                    <div>
                      <div className="preview wide youtube">
                        <img src={streamId ? `https://i3.ytimg.com/vi/${streamId}/maxresdefault.jpg` : cover} alt="" />
                        <a
                          className="play-btn"
                          href={profile.livestream!.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Tonton live streaming"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {hasVideo && (
            <section className="video-gallery">
              <div className="inner">
                <div className="title"><h1>Our Video</h1></div>
                <div className="video-outer">
                  <div className="video">
                    <div className="preview">
                      <iframe
                        src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=0&mute=1&controls=1&rel=0&playsinline=1`}
                        title="Video"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {hasGift && (
            <div className="section-group top" data-section-order="wedding_gift">
              <SectionSeparator />
              <section className="wedding-gift-wrap">
                <div className="wedding-gift-inner">
                  <div className="wedding-gift-head">
                    <h1 className="wedding-gift-title">{tc.gift_intro_title || "Love Gift"}</h1>
                    <p className="wedding-gift-description">
                      {tc.gift_intro_description ||
                        "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:"}
                    </p>
                  </div>
                  <div className="wedding-gift-body">
                    <div className="wedding-gift-form">
                      <div className="wedding-gift-details wedding-gift-slide">
                        <div className="wedding-gift-slide">
                          {accounts.length > 1 && (
                            <div className="wedding-gift-select-bank-wrap">
                              <select
                                className="mr-bank-select"
                                value={bankIndex}
                                onChange={(event) => setBankIndex(Number(event.target.value))}
                                aria-label="Pilih rekening"
                              >
                                {accounts.map((account, index) => (
                                  <option value={index} key={`${account.provider_name || "bank"}-${index}`}>
                                    {account.provider_name || "Rekening"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="wedding-gift-bank-wrap">
                            {activeAccount && (
                              <div className="bank-item show">
                                <div className="bank-detail">
                                  <h3 className="bank-name">{activeAccount.provider_name}</h3>
                                  {activeAccount.account_number && (
                                    <div>
                                      <small className="bank-account-number-label">Account Number</small>
                                      <h4 className="bank-account-number">
                                        {activeAccount.account_number}
                                        <button type="button" className="mr-copy" onClick={() => copyAccount(activeAccount.account_number || "")}>
                                          {copied === activeAccount.account_number ? "Tersalin" : "Salin"}
                                        </button>
                                      </h4>
                                    </div>
                                  )}
                                  {activeAccount.account_name && (
                                    <div>
                                      <small className="bank-account-name-label">Account Name</small>
                                      <h4 className="bank-account-name">{activeAccount.account_name}</h4>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {giftAddress && (
                            <div className="wedding-gift-bank-wrap mr-gift-address">
                              <div className="bank-item show">
                                <div className="bank-detail">
                                  <h3 className="bank-name">Send a Gift</h3>
                                  {profile.gift_address_name && (
                                    <div>
                                      <small className="bank-account-name-label">Recipient</small>
                                      <h4 className="bank-account-name">{profile.gift_address_name}</h4>
                                    </div>
                                  )}
                                  <div>
                                    <small className="bank-account-number-label">Address</small>
                                    <h4 className="bank-account-name">{giftAddress}</h4>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <section className="wedding-wish-wrap" data-section-order="wedding_wish">
            <div className="wedding-wish-inner">
              <div className="wedding-wish-head">
                <h1 className="wedding-wish-title">Wedding Wish</h1>
                {tc.wishes_intro && <p className="wedding-wish-description">{tc.wishes_intro}</p>}
              </div>
              <div className="wedding-wish-body">
                <Wishes weddingProfileId={profile.wedding_profile_id} guestId={profile.guest_id} guestName={profile.guest_name} guestLinkStrict={profile.guest_link_strict} coupleName={coupleLabel} language={profile.language} />
              </div>
            </div>
          </section>

          {honored.length > 0 && (
            <section className="notes-container mr-inviting" data-section-order="inviting">
              <div className="note">
                <div className="orn-kupu-kupu-2"><div className="image-wrap"><img src={A("kupu-kupu-2.png")} alt="" /></div></div>
                <h4 className="note-title">{t("secInviting", lang)}</h4>
                <ul className="mr-inviting-list">
                  {honored.map((name, index) => (
                    <li key={`${name}-${index}`}>{name}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="notes-container mr-thanks" data-section-order="greet_thanks">
            {closingPhoto && (
              <div className="mr-thanks-photo"><img src={closingPhoto} alt="" /></div>
            )}
            <div className="note">
              <h4 className="note-title">Thank You</h4>
              <p className="note-description">{closingMessage}</p>
              {tc.cover_apology && <p className="note-description note-apology">{tc.cover_apology}</p>}
            </div>
          </section>

          <div className="section-group top" data-section-order="footnote">
            <SectionSeparator />
            <section className="footnote-wrap">
              <div className="footnote-stage">
                <div className="ornaments-wrapper">
                  <div className="orn-1 left"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
                  <div className="orn-1 right"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
                  <div className="orn-2 left"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
                  <div className="orn-2 right"><div className="image-wrap"><img src={A("onr-footnote.png")} alt="" /></div></div>
                </div>
                <div className="footnote">
                  <p className="top-text">Wedding Invitation</p>
                  <h2 className="footnote-title">{coupleLabel}</h2>
                  <p className="date">{dateLong}</p>
                  {profile.display_name && <p className="bottom-text">{profile.display_name}</p>}
                </div>
              </div>
              <footer className="tpl-footer mr-footer">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hubungi Aksaraa Wedding via WhatsApp"
                  className="tpl-footer__link"
                >
                  <span className="tpl-footer__badge">
                    <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="tpl-footer__logo" draggable={false} />
                  </span>
                  <span className="tpl-footer__cta">Wedding by Aksaraa</span>
                </a>
                <p className="tpl-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
              </footer>
            </section>
          </div>
        </section>
      </section>
    </div>
  )
}
