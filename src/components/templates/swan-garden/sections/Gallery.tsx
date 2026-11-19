"use client"

import { Backdrop } from "../Ornaments"
import { gallery0 } from "../ornamentData"

type Props = {
  photos: string[]
  title: string
  onPhoto: (photos: string[], index: number) => void
}

export default function Gallery({ photos, title, onPhoto }: Props) {
  const list = photos.filter(Boolean)
  if (!list.length) return null
  return (
    <section className="photo-wrap" data-section-order="gallery_photo">
      <Backdrop items={gallery0} />
      <div className="photo-inner">
        <div className="photo-head">
          <h1 className="photo-title">{title}</h1>
        </div>
        <div className="photo-body">
          <div className="photo-box">
            {list.map((src, i) => (
              <a
                key={i}
                href={src}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  onPhoto(list, i)
                }}
              >
                <img src={src} alt="" loading={i < 4 ? "eager" : "lazy"} decoding="async" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
