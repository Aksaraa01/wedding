"use client"

import { useEffect, useMemo } from "react"
import type { TemplateProps } from "@/types/template"
import { normalizeLanguage, t } from "@/lib/i18n"
import { resolveCoupleName } from "@/lib/coupleName"
import {
  countdownTarget,
  flattenPhotos,
  gcalLink,
  initialsOf,
  normalizeVideoUrl,
  photoList,
  type GiftAccountData,
} from "../shared/lib"
import { useTibraBlur } from "./Atmosphere"
import type { PanelMedia } from "./LeftPanel"
import Events from "./sections/Events"
import Closing from "./sections/Closing"
import GiftTeaser from "./sections/GiftTeaser"
import Inviting from "./sections/Inviting"
import Opening from "./sections/Opening"
import Person from "./sections/Person"
import Portrait from "./sections/Portrait"
import SaveTheDate from "./sections/SaveTheDate"
import Story from "./sections/Story"
import Wishes from "./sections/Wishes"

type Props = {
  profile: TemplateProps
  accounts: GiftAccountData[]
  giftAddress?: string
  giftAddressName?: string
  onOpenGift: () => void
  onActiveMedia: (media: PanelMedia) => void
}

const pad = (n: number) => String(n).padStart(2, "0")

function dotShort(iso?: string): string {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d.getTime())) return ""
  return `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${String(d.getFullYear()).slice(2)}`
}

export default function Rail({ profile, accounts, giftAddress, giftAddressName, onOpenGift, onActiveMedia }: Props) {
  const lang = normalizeLanguage(profile.language)
  useTibraBlur()

  const tc = profile.template_content ?? {}
  const openingKicker = (tc.opening_kicker || "").trim()
  const storyTitle = (tc.story_title || "").trim() || (tc.love_story_title || "").trim()
  const eventsTitle = (tc.events_title || "").trim()
  const invitingTitle = (tc.inviting_title || "").trim()
  const saveDateLabel = (tc.save_date_label || "").trim()
  const galleryTitle = (tc.gallery_title || "").trim()
  const galleryIntro = (tc.gallery_intro || "").trim()
  const giftTitle = (tc.gift_intro_title || "").trim()
  const giftIntro = (tc.gift_intro_description || "").trim()
  const wishesTitle = (tc.wishes_title || "").trim()
  const wishesIntro = (tc.wishes_intro || "").trim()
  const closingMessage = (tc.closing_message || "").trim()

  const coupleLabel = resolveCoupleName(profile)
  const initials =
    (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "VF"
  const hashtag = (profile.display_name || "").trim()

  const groomPhotos = useMemo(() => photoList(profile.groom_photo_url), [profile.groom_photo_url])
  const bridePhotos = useMemo(() => photoList(profile.bride_photo_url), [profile.bride_photo_url])
  const gallery = useMemo(() => (profile.gallery_photos || []).filter(Boolean), [profile.gallery_photos])
  const coverPhotos = useMemo(() => flattenPhotos(profile.cover_photos), [profile.cover_photos])
  const saveDatePhoto = coverPhotos[1] || coverPhotos[0] || gallery[0]
  const closingPhoto = coverPhotos[2] || coverPhotos[1] || coverPhotos[0] || gallery[0]
  const sessions = profile.sessions || []
  const stories = profile.stories || []
  const target = useMemo(
    () => countdownTarget(profile.sessions, profile.estimated_wedding_date),
    [profile.sessions, profile.estimated_wedding_date]
  )
  const gcal = useMemo(() => gcalLink(sessions[0], profile.groom_name, profile.bride_name), [sessions, profile.groom_name, profile.bride_name])
  const videoEmbed = normalizeVideoUrl(profile.video_url)

  const gates = profile.feature_gates || {}
  const storyOn = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const videoOn = !!videoEmbed && gates.video !== false && profile.video_section_visible !== false
  const inviting = (profile.inviting_families || []).map((f) => (f || "").trim()).filter(Boolean)
  const invitingOn =
    gates.inviting_families !== false &&
    profile.inviting_families_visible !== false &&
    inviting.length > 0
  const giftOn =
    profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)

  // Report the section nearest the viewport centre so the desktop media panel
  // can cross-fade between cover / video / story.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"))
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return
    const media: Record<string, PanelMedia> = {
      story: "story",
      portrait: videoOn ? "video" : "story",
    }
    const ratios = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).dataset.section || ""
          ratios.set(id, e.intersectionRatio)
        })
        let bestId = ""
        let best = 0
        ratios.forEach((r, id) => {
          if (r > best) {
            best = r
            bestId = id
          }
        })
        if (best > 0.4) onActiveMedia(media[bestId] || "cover")
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-20% 0px -20% 0px" }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [onActiveMedia, videoOn])

  return (
    <div className="w-full bg-black/5 lg:w-[450px] lg:shrink-0">
      <Opening
        eyebrow={openingKicker || undefined}
        coupleLabel={coupleLabel}
        hashtag={hashtag}
        dateShort={dotShort(profile.estimated_wedding_date)}
        quoteText={profile.quote_text}
        quoteSource={profile.quote_source}
        language={lang}
      />

      <Person
        id="groom"
        heading={lang === "en" ? "The Groom" : "Mempelai Pria"}
        language={lang}
        shortName={profile.groom_name}
        fullName={profile.groom_full_name}
        parents={profile.groom_parents}
        instagram={profile.groom_instagram}
        photos={groomPhotos}
      />

      <Person
        id="bride"
        heading={lang === "en" ? "The Bride" : "Mempelai Wanita"}
        shortName={profile.bride_name}
        fullName={profile.bride_full_name}
        parents={profile.bride_parents}
        instagram={profile.bride_instagram}
        photos={bridePhotos}
        language={lang}
      />

      <Events sessions={sessions} language={lang} title={eventsTitle} />

      <SaveTheDate photos={saveDatePhoto ? [saveDatePhoto] : []} target={target} gcal={gcal} coupleLabel={coupleLabel} language={lang} label={saveDateLabel} />

      {giftOn && <GiftTeaser onOpen={onOpenGift} language={lang} title={giftTitle} description={giftIntro} />}

      {storyOn && <Story stories={stories} coupleLabel={coupleLabel} language={lang} title={storyTitle} />}

      {(videoOn || gallery.length > 0) && (
        <Portrait
          videoEmbed={videoOn ? videoEmbed : undefined}
          photos={gallery}
          language={lang}
          title={galleryTitle}
          intro={galleryIntro}
        />
      )}

      {invitingOn && <Inviting families={inviting} language={lang} title={invitingTitle} />}

      <Wishes
        weddingProfileId={profile.wedding_profile_id}
        guestId={profile.guest_id}
        guestName={profile.guest_name}
        guestLinkStrict={profile.guest_link_strict} language={profile.language}
        title={wishesTitle}
        intro={wishesIntro}
      />

      <Closing photos={closingPhoto ? [closingPhoto] : []} coupleLabel={coupleLabel} language={lang} message={closingMessage} />
    </div>
  )
}
