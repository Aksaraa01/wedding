"use client"

import { useEffect, useState } from "react"

type Props = {
  images: string[]
  alt?: string
  className?: string
  intervalMs?: number
  overlayClassName?: string
  children?: React.ReactNode
  objectPosition?: string
}

// Cross-fading background/photo slideshow. The reference uses Elementor
// background slideshows with directional transitions; a soft cross-fade keeps
// the same feel while staying cheap and robust on low-end phones.
export default function Slideshow({
  images,
  alt = "",
  className = "",
  intervalMs = 4200,
  overlayClassName = "",
  children,
  objectPosition = "center",
}: Props) {
  const list = images.filter(Boolean)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [list.length])

  useEffect(() => {
    if (list.length < 2) return
    const id = setInterval(() => setIndex((p) => (p + 1) % list.length), intervalMs)
    return () => clearInterval(id)
  }, [list.length, intervalMs])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {list.length === 0 ? (
        <div className="absolute inset-0 bg-neutral-800" />
      ) : (
        list.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={alt}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out"
            style={{ opacity: i === index ? 1 : 0, objectPosition }}
          />
        ))
      )}
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
      {children}
    </div>
  )
}
