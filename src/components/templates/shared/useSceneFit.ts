"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

const MIN_BOX_W = 200

// Measures the scene container and the art's intrinsic size, then sizes the
// art box so the WHOLE image is always visible and never overflows the screen:
// width = min(container width, available height × image aspect). Hotspots stay
// aligned because they are % of the art box. Works identically in the editor
// preview and on a real device (no dvh/viewport quirks).
export function useSceneFit(topPad: number, fallbackAspect: string) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [boxW, setBoxW] = useState<number | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const compute = () => {
      const W = el.clientWidth
      const H = Math.max(0, el.clientHeight - topPad)
      if (nat && nat.w > 0 && nat.h > 0) {
        setBoxW(Math.max(MIN_BOX_W, Math.min(W, H * (nat.w / nat.h))))
      } else {
        setBoxW(null)
      }
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [nat, topPad])

  const onArtLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget
    if (im.naturalWidth > 0 && im.naturalHeight > 0) {
      setNat({ w: im.naturalWidth, h: im.naturalHeight })
    }
  }

  const boxStyle: CSSProperties =
    nat && boxW
      ? { width: boxW, aspectRatio: `${nat.w} / ${nat.h}` }
      : { width: "100%", aspectRatio: fallbackAspect }

  return { boxRef, boxStyle, onArtLoad }
}