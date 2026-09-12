"use client"

import { useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { countdownTarget, type GiftAccountData } from "../shared/lib"
import PastelAtmosphere, { PC_ATMOSPHERE_CSS } from "./Atmosphere"
import MainPage from "./pages/MainPage"
import PersonPage from "./pages/PersonPage"
import GalleryPage from "./pages/GalleryPage"
import StoryPage from "./pages/StoryPage"
import EventPage from "./pages/EventPage"
import CountdownPage from "./pages/CountdownPage"
import CombinedPage from "./pages/CombinedPage"
import ClosingPage from "./pages/ClosingPage"

export type PastelPageKey =
  | "main" | "groom" | "bride" | "gallery" | "story"
  | "events" | "countdown" | "combined" | "closing"

type Props = {
  profile: TemplateProps
  onWishOpenChange: (open: boolean) => void
}

type AtmoMix = {
  doves: number
  clouds: number
  petals: boolean
  motes: boolean
  pearls: boolean
  waves: boolean
  flocks: boolean
}

const ATMO: Record<PastelPageKey, AtmoMix> = {
  main: { doves: 0, clouds: 0, petals: true, motes: true, pearls: false, waves: false, flocks: false },
  groom: { doves: 3, clouds: 0, petals: false, motes: false, pearls: true, waves: false, flocks: false },
  bride: { doves: 3, clouds: 0, petals: false, motes: false, pearls: true, waves: false, flocks: false },
  gallery: { doves: 3, clouds: 1, petals: false, motes: false, pearls: true, waves: true, flocks: false },
  story: { doves: 3, clouds: 1, petals: false, motes: true, pearls: false, waves: false, flocks: false },
  events: { doves: 4, clouds: 0, petals: false, motes: false, pearls: false, waves: false, flocks: true },
  countdown: { doves: 4, clouds: 0, petals: false, motes: false, pearls: false, waves: false, flocks: false },
  combined: { doves: 4, clouds: 0, petals: false, motes: true, pearls: false, waves: false, flocks: false },
  closing: { doves: 4, clouds: 0, petals: false, motes: false, pearls: true, waves: false, flocks: true },
}

export default function PastelPages({ profile, onWishOpenChange }: Props) {
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

  const pages: PastelPageKey[] = ([
    "main", "groom", "bride", "gallery", "story", "events", "countdown", "combined", "closing",
  ] as PastelPageKey[]).filter((k) => {
    if (k === "main" || k === "groom" || k === "bride" || k === "closing") return true
    if (k === "gallery") return galleryOn
    if (k === "story") return storyOn
    if (k === "events") return eventOn(sessions[0]) || eventOn(sessions[1])
    if (k === "countdown") return countdownOn
    return combinedOn
  })

  const [vis, setVis] = useState<Record<number, number>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        setVis((prev) => {
          const next = { ...prev }
          let changed = false
          for (const e of entries) {
            const idx = Number((e.target as HTMLElement).dataset.idx)
            const targetH = (e.target as HTMLElement).offsetHeight || e.boundingClientRect.height || 1
            const viewH = e.rootBounds?.height || root.clientHeight || 1
            const v = Math.max(0, Math.min(1, e.intersectionRect.height / (Math.min(targetH, viewH) || 1)))
            if (Math.abs((next[idx] ?? 1) - v) > 0.01) {
              next[idx] = Math.round(v * 100) / 100
              changed = true
            }
          }
          return changed ? next : prev
        })
      },
      { root, threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    )
    pageRefs.current.forEach((el) => {
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [pages.length])

  const renderPage = (key: PastelPageKey) => {
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
      case "events":
        return <EventPage sessions={sessions as any} />
      case "countdown":
        return <CountdownPage profile={profile} sessions={sessions as any} />
      case "combined":
        return <CombinedPage profile={profile} accounts={accounts} families={families} videoOn={videoOn} giftOn={giftOn} invitingOn={invitingOn} />
      case "closing":
        return <ClosingPage profile={profile} onWishOpenChange={onWishOpenChange} />
    }
  }

  let landedIdx = 0
  let landedVis = -1
  pages.forEach((_, i) => {
    const v = vis[i] ?? 1
    if (v > landedVis) {
      landedVis = v
      landedIdx = i
    }
  })
  const bgZoomed = pages[landedIdx] === "events" && landedVis > 0.5

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{PC_ATMOSPHERE_CSS}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.pastelCoastal.bg}
          alt=""
          draggable={false}
          className={`w-full h-full object-cover object-center transition-transform duration-[1400ms] ease-out ${bgZoomed ? "scale-[1.5]" : "scale-100"}`}
          style={{ transformOrigin: "50% 18%" }}
        />
      </div>

      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory custom-scrollbar">
        {pages.map((key, i) => {
          const o = vis[i] ?? 1
          return (
            <section
              key={key}
              data-idx={i}
              ref={(el) => {
                pageRefs.current[i] = el
              }}
              className="relative min-h-full snap-start snap-always flex flex-col"
            >
              <PastelAtmosphere {...ATMO[key]} />
              <div
                className="flex-1 flex flex-col min-h-0"
                style={{ opacity: o, transform: `translateY(${(1 - o) * 24}px)`, transition: "opacity 0.12s linear" }}
              >
                {renderPage(key)}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
