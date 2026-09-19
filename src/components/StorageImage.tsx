"use client"

import { useState } from "react"
import { toTransformedUrl } from "@/lib/storageUrl"

interface StorageImageProps {
  src: string
  alt: string
  width?: number
  quality?: number
  resize?: "cover" | "contain"
  className?: string
  loading?: "lazy" | "eager"
  decoding?: "async" | "sync" | "auto"
  draggable?: boolean
  onLoad?: () => void
}

// Egress-safe <img>: serves the Supabase transform at display width instead
// of the full original. If the transform endpoint ever fails (e.g.
// transformation disabled), onError falls back to the raw URL so the image
// still renders — never a blank slot to save bytes.
export default function StorageImage({
  src,
  alt,
  width = 640,
  quality = 70,
  resize = "cover",
  className,
  loading = "lazy",
  decoding = "async",
  draggable,
  onLoad,
}: StorageImageProps) {
  const transformed = toTransformedUrl(src, { width, quality, resize })
  const [current, setCurrent] = useState(transformed)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      draggable={draggable}
      onLoad={onLoad}
      onError={() => {
        if (current !== src) setCurrent(src)
      }}
    />
  )
}
