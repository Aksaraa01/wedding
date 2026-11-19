"use client"

import { Backdrop } from "../Ornaments"
import { live0 } from "../ornamentData"
import { SG } from "../assets"

type Props = {
  title: string
  description: string
  buttonLabel: string
  url: string
  youtubeId: string
}

export default function Live({ title, description, buttonLabel, url, youtubeId }: Props) {
  if (!url) return null
  const thumb = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : ""
  return (
    <section className="live-streaming" data-section-order="live_streaming">
      <Backdrop items={live0} />
      <div className="inner">
        <div className="head">
          <div className="orn-header-wrapper">
            <div className="orn-live-header">
              <img src={SG.ornLiveHeader} alt="" aria-hidden="true" width={856} height={400} loading="eager" />
            </div>
          </div>
          <h1>{title}</h1>
          {description ? <p className="sw-live__desc">{description}</p> : null}
        </div>
        <div className="body">
          <div className="streaming-info">
            <div>
              <div className="preview wide youtube">
                {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
                <a className="play-btn" href={url} target="_blank" rel="noreferrer" aria-label={buttonLabel}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="link">
              <a href={url} target="_blank" rel="noreferrer">
                {buttonLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
