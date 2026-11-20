"use client"

import type { TemplateProps } from "@/types/template"
import { Backdrop } from "../Ornaments"
import { cover0, cover1, cover2, cover3 } from "../ornamentData"
import { SG } from "../assets"

type Props = {
  profile: TemplateProps
  coupleLabel: string
  kicker: string
  hashtag: string
  photo: string
}

export default function Cover({ profile, coupleLabel, kicker, hashtag, photo }: Props) {
  const desktop = photo
  const mobile = photo

  return (
    <section className="cover " data-section-order="cover">
      <Backdrop items={cover0} eager />
      <div className="inner">
        <div className="head">
          <p className="top-text">{kicker}</p>
          <h1 className="prime-title">{coupleLabel}</h1>
        </div>
        <div className="body highlight">
          <Backdrop items={cover1} />
          <div className="orn-cover-frame">
            <div className="cover-frame">
              <div className="cover-picture cover-show">
                <div className="picture desktop">
                  {desktop ? <img src={desktop} alt={coupleLabel} fetchPriority="high" loading="eager" /> : null}
                </div>
                <div className="picture mobile">
                  {mobile ? <img src={mobile} alt={coupleLabel} fetchPriority="high" loading="eager" /> : null}
                </div>
              </div>
            </div>
            <img src={SG.frameCover} alt="" aria-hidden="true" width={681} height={858} loading="eager" />
            <Backdrop items={cover2} />
          </div>
          <Backdrop items={cover3} />
        </div>
        <div className="foot">{hashtag ? <p className="fade-up">{hashtag}</p> : null}</div>
      </div>
    </section>
  )
}
