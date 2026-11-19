"use client"

import { useEffect, useState } from "react"
import { Backdrop } from "../Ornaments"
import { story0, story1 } from "../ornamentData"
import { SG } from "../assets"

type Story = { title?: string; description?: string; image_url?: string }

type Props = {
  stories: Story[]
  title: string
  coverPhoto: string
  onPhoto: (photos: string[], index: number) => void
}

export default function Story({ stories, title, coverPhoto, onPhoto }: Props) {
  const list = stories.filter((s) => s.title || s.description || s.image_url)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (list.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 6000)
    return () => window.clearInterval(id)
  }, [list.length])

  if (!list.length) return null
  const active = list[Math.min(index, list.length - 1)]
  const photo = active.image_url || coverPhoto

  return (
    <section className="love-story" data-section-order="love_story">
      <Backdrop items={story0} />
      <div className=" story-inner">
        <div className="story-head">
          <h1 className="story-title">{title}</h1>
        </div>
        <div className="story-body">
          <div className="story__slider-preview">
            <div className="story-preview">
              <div className="story-picture-wrapper">
                <Backdrop items={story1} />
                <div className="story-picture">
                  <button
                    type="button"
                    onClick={() => onPhoto([photo], 0)}
                    aria-label={active.title || title}
                  >
                    {photo ? (
                      <div className="ls-img-content">
                        <img src={photo} alt="" loading="lazy" />
                      </div>
                    ) : null}
                    <img src={SG.frameStory} alt="" aria-hidden="true" width={722} height={608} loading="eager" />
                  </button>
                </div>
              </div>
              {active.title ? <h3 className="story-sub-title">{active.title}</h3> : null}
            </div>
          </div>
          <div className="story__slider-caption-wrap">
            <div className="story__slider-caption">
              <div className="story-details-wrapper">
                <div className="story-details">
                  <p className="story-caption">{active.description || ""}</p>
                </div>
              </div>
            </div>
          </div>
          {list.length > 1 ? (
            <div className="story__slider-dots">
              {list.map((s, i) => (
                <button
                  type="button"
                  key={i}
                  className={`sw-dot${i === index ? " active" : ""}`}
                  aria-label={s.title || `${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
