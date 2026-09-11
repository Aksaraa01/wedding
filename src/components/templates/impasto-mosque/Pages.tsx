"use client"

import { useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { countdownTarget, type GiftAccountData } from "../shared/lib"
import ImpastoAtmosphere, { IM_ATMOSPHERE_CSS } from "./Atmosphere"
import MainPage from "./pages/MainPage"
import PersonPage from "./pages/PersonPage"
import GalleryPage from "./pages/GalleryPage"
import StoryPage from "./pages/StoryPage"
import EventPage from "./pages/EventPage"
import CountdownPage from "./pages/CountdownPage"
import CombinedPage from "./pages/CombinedPage"
import ClosingPage from "./pages/ClosingPage"

export type ImpastoPageKey =
  | "main" | "groom" | "bride" | "gallery" | "story"
  | "event0" | "event1" | "countdown" | "combined" | "closing"

type Props = {
  profile: TemplateProps
  onWishOpenChange: (open: boolean) => void
}

// Scroll-snap page stack over ONE fixed background. Each page is at least one
// device screen (snap-start); the bg never moves while content cross-fades.
// Each page carries its own atmosphere mix (doves / birds / petals / motes)
// mirroring the reference designs.

// Per-page atmosphere mix matching ~/Downloads/design reference files.
const ATMO: Record<ImpastoPageKey, { doves: number; birds: boolean; petals: boolean; motes: boolean }> = {
  main: { doves: 4, birds: false, petals: true, motes: true },
  groom: { doves: 5, birds: false, petals: false, motes: false },
  bride: { doves: 6, birds: false, petals: false, motes: false },
  gallery: { doves: 0, birds: true, petals: false, motes: false },
  story: { doves: 3, birds: false, petals: false, motes: true },
  event0: { doves: 4, birds: false, petals: false, motes: false },
  event1: { doves: 0, birds: true, petals: false, motes: false },
  countdown: { doves: 4, birds: false, petals: false, motes: false },
  combined: { doves: 4, birds: false, petals: false, motes: true },
  closing: { doves: 4, birds: false, petals: false, motes: false },
}
export default function ImpastoPages({ profile, onWishOpenChange }: Props) {
  const stories = Array.isArray(profile.stories) ? profile.stories : []
  const families = Array.isArray(profile.inviting_families) ? profile.inviting_families.filter(Boolean) : []
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const galleryPhotos = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  const accounts: GiftAccountData[] = Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []
  const gates = profile.feature_gates || {}

  const storyOn = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const eventOn = (s: unknown) => !!s && typeof s === "object" && (((s as any).date as string) || ((s as any).venue as string))
  const giftOn =
    profile.gift_section_visible !== false &&
    (accounts.length > 0 || (gates.gift_address !== false && !!profile.gift_address))
  const invitingOn = gates.inviting_families !== false && profile.inviting_families_visible !== false && families.length > 0
  const videoOn = gates.video !== false && profile.video_section_visible !== false && !!profile.video_url
  const countdownOn = !!countdownTarget(sessions as any, profile.estimated_wedding_date)
  const galleryOn = galleryPhotos.length > 0
  const combinedOn = giftOn || invitingOn || videoOn

  const pages: ImpastoPageKey[] = ([
    "main", "groom", "bride", "gallery", "story", "event0", "event1", "countdown", "combined", "closing",
  ] as ImpastoPageKey[]).filter((k) => {
    if (k === "main" || k === "groom" || k === "bride" || k === "closing") return true
    if (k === "gallery") return galleryOn
    if (k === "story") return storyOn
    if (k === "event0") return eventOn(sessions[0])
    if (k === "event1") return eventOn(sessions[1])
    if (k === "countdown") return countdownOn
    return combinedOn
  })

  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        let best = -1
        let bestRatio = 0
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.idx)
          if (e.isIntersecting && e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio
            best = idx
          }
        }
        if (best >= 0) setActiveIdx(best)
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    pageRefs.current.forEach((el) => {
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [pages.length])

  const renderPage = (key: ImpastoPageKey) => {
    switch (key) {
      case "main":
        return <MainPage profile={profile} />
      case "groom":
        return <PersonPage profile={profile} side="groom" />
      case "bride":
        return <PersonPage profile={profile} side="bride" />
      case "gallery":
        return <GalleryPage photos={galleryPhotos} />
      case "story":
        return <StoryPage stories={stories} />
      case "event0":
        return <EventPage session={sessions[0]} anchor="top" />
      case "event1":
        return <EventPage session={sessions[1]} anchor="bottom" />
      case "countdown":
        return <CountdownPage profile={profile} sessions={sessions as any} />
      case "combined":
        return <CombinedPage profile={profile} accounts={accounts} families={families} videoOn={videoOn} giftOn={giftOn} invitingOn={invitingOn} />
      case "closing":
        return <ClosingPage profile={profile} onWishOpenChange={onWishOpenChange} />
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{IM_ATMOSPHERE_CSS}</style>
      {/* Fixed background layer — never moves while pages scroll over it */}
      <div className="absolute inset-0 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSETS.impastoMosque.bg} alt="" draggable={false} className="w-full h-full object-cover object-center" />
      </div>

      {/* Scrollable content layer (snap = page change) */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory custom-scrollbar">
        {pages.map((key, i) => (
          <section
            key={key}
            data-idx={i}
            ref={(el) => {
              pageRefs.current[i] = el
            }}
            className="relative min-h-full snap-start snap-always flex flex-col"
          >
            <ImpastoAtmosphere {...ATMO[key]} />
            <div className={`flex-1 flex flex-col min-h-0 transition-all duration-500 ${i === activeIdx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {renderPage(key)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
