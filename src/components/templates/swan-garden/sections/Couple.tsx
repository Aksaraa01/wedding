"use client"

import type { TemplateProps } from "@/types/template"
import { ornAsset } from "../Ornaments"
import { SG } from "../assets"

const CP = {
  cp5: ornAsset("orn-08.png"),
  cp4: ornAsset("orn-06.png"),
  cp41: ornAsset("orn-13.png"),
  cp3: ornAsset("orn-02.png"),
  cp2: ornAsset("orn-23.png"),
  cp21: ornAsset("orn-04.png"),
  cp1: ornAsset("orn-22.png"),
  cp14: ornAsset("orn-18.png"),
  cp131: ornAsset("orn-20.png"),
  cp13: ornAsset("orn-19.png"),
  cp11: ornAsset("orn-12.png"),
  cp12: ornAsset("orn-17.png"),
  cp6: ornAsset("orn-24.png"),
}

type Props = {
  profile: TemplateProps
  title: string
  description: string
  onPhoto: (photos: string[], index: number) => void
}

function PersonFrame({ photo, name, onPhoto }: { photo: string; name: string; onPhoto: Props["onPhoto"] }) {
  return (
    <div className="couple-preview">
      <div className="couple-frame">
        <div className="orn-cp-5">
          <img src={CP.cp5} alt="" aria-hidden="true" loading="lazy" />
        </div>
        <div className="orn-cp-4">
          <img src={CP.cp4} alt="" aria-hidden="true" loading="lazy" />
          <div className="orn-cp-4-1">
            <img src={CP.cp41} alt="" aria-hidden="true" loading="lazy" />
          </div>
        </div>
        <div className="cp-frame-wrap">
          <div className="orn-cp-3">
            <img src={CP.cp3} alt="" aria-hidden="true" loading="lazy" />
          </div>
          <div className="orn-cp-2">
            <img src={CP.cp2} alt="" aria-hidden="true" loading="lazy" />
            <div className="orn-cp-2-1">
              <img src={CP.cp21} alt="" aria-hidden="true" loading="lazy" />
            </div>
          </div>
          <div className="couple-picture-wrap">
            <div className="couple-picture">
              <button type="button" className="img-wrap" onClick={() => onPhoto([photo], 0)} aria-label={name}>
                {photo ? <img className="img" src={photo} alt={name} loading="lazy" /> : <span className="sw-frame__empty" />}
              </button>
            </div>
          </div>
          <img className="img-couple-frame" src={SG.frameCouple} alt="" aria-hidden="true" width={600} height={730} loading="eager" />
          <div className="orn-cp-1">
            <div className="orn-cp-1-4">
              <img src={CP.cp14} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <div className="orn-cp-1-3">
              <div className="orn-cp-1-3-1">
                <img src={CP.cp131} alt="" aria-hidden="true" loading="lazy" />
              </div>
              <img src={CP.cp13} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <div className="orn-cp-1-1">
              <img src={CP.cp11} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <div className="orn-cp-1-2">
              <img src={CP.cp12} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <img src={CP.cp1} alt="" aria-hidden="true" loading="lazy" />
          </div>
        </div>
        <div className="orn-cp-6">
          <img src={CP.cp6} alt="" aria-hidden="true" loading="lazy" />
        </div>
      </div>
    </div>
  )
}

function Instagram({ handle }: { handle: string }) {
  if (!handle) return null
  const user = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, "")
  return (
    <div className="couple-link-wrap">
      <a href={`https://www.instagram.com/${user}`} target="_blank" rel="noreferrer" className="couple-link">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <span>@{user}</span>
      </a>
    </div>
  )
}

function PersonBlock({
  variant,
  name,
  parents,
  instagram,
  photo,
  onPhoto,
}: {
  variant: "groom" | "bride"
  name: string
  parents: string
  instagram: string
  photo: string
  onPhoto: Props["onPhoto"]
}) {
  return (
    <div className={`couple-info ${variant}`}>
      <div className="couple-details">
        <h2 className="couple-name">{name}</h2>
      </div>
      <PersonFrame photo={photo} name={name} onPhoto={onPhoto} />
      <div className="couple-details">
        {parents ? <p className="couple-parents">{parents}</p> : null}
        <Instagram handle={instagram} />
      </div>
    </div>
  )
}

export default function Couple({ profile, title, description, onPhoto }: Props) {
  const groom = profile.groom_full_name || profile.groom_name || ""
  const bride = profile.bride_full_name || profile.bride_name || ""
  const groomPhoto = Array.isArray(profile.groom_photo_url) ? profile.groom_photo_url[0] : profile.groom_photo_url || ""
  const bridePhoto = Array.isArray(profile.bride_photo_url) ? profile.bride_photo_url[0] : profile.bride_photo_url || ""
  const photos = Boolean(groomPhoto || bridePhoto)

  return (
    <section className="couple-wrap " data-section-order="couple">
      <div className="couple">
        <div className="couple-head">
          <div className="couple-head-wrap-1">
            <h1 className="couple-title">{title}</h1>
          </div>
          {description ? (
            <div className="couple-head-wrap-1">
              <p className="couple-description">{description}</p>
            </div>
          ) : null}
        </div>
        <div className={`couple-body ${photos ? "show-picture" : "hide-picture"}`}>
          <PersonBlock
            variant="groom"
            name={groom}
            parents={profile.groom_parents || ""}
            instagram={profile.groom_instagram || ""}
            photo={groomPhoto}
            onPhoto={onPhoto}
          />
          <div className="separator-wrap">
            <div className="separator">
              <h2 className="couple-separator">&amp;</h2>
            </div>
          </div>
          <PersonBlock
            variant="bride"
            name={bride}
            parents={profile.bride_parents || ""}
            instagram={profile.bride_instagram || ""}
            photo={bridePhoto}
            onPhoto={onPhoto}
          />
        </div>
      </div>
    </section>
  )
}
