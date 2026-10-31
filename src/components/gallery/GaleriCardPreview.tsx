"use client"

import { useEffect, useRef, useState } from "react"
import { paintGaleriCardPreview, type FrameSelection } from "@/lib/galeriFrames"

export type GaleriCardPreviewProps = {
  imageUrl: string
  frame: FrameSelection
  couple: string
  date: string
  caption?: string
  cameraFilter?: string
  className?: string
}

// Live preview of the EXACT card the upload will bake: one painter feeds both
// the canvas here and applyGaleriFrame(), so the two can never drift. Repaints
// are debounced (typing) and blitted from an offscreen canvas, so the card
// never flashes blank between keystrokes.
export default function GaleriCardPreview({
  imageUrl,
  frame,
  couple,
  date,
  caption = "",
  cameraFilter = "",
  className = "",
}: GaleriCardPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seqRef = useRef(0)
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading")

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas || frame === "none") return
    let cancelled = false
    const seq = ++seqRef.current
    const paint = () => {
      if (cancelled || seq !== seqRef.current) return
      const cssWidth = Math.max(200, Math.round(wrap.clientWidth || 320))
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
      void paintGaleriCardPreview(canvas, {
        imageUrl,
        frame,
        couple,
        date,
        caption,
        cameraFilter,
        width: Math.round(cssWidth * dpr),
      })
        .then((ok) => {
          if (cancelled || seq !== seqRef.current) return
          setStatus(ok ? "ready" : "fallback")
        })
        .catch(() => {
          if (!cancelled && seq === seqRef.current) setStatus("fallback")
        })
    }
    // Small debounce: caption keystrokes repaint once they pause, while frame
    // or photo changes (fresh shot) paint on the next frame.
    const timer = setTimeout(paint, 60)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [imageUrl, frame, couple, date, caption, cameraFilter])

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={status === "ready" ? undefined : { aspectRatio: "4 / 5" }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Pratinjau bingkai foto"
        className={`block w-full h-auto transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f0eee9]">
          <div className="w-7 h-7 rounded-full border-2 border-[#6b2b2d] border-t-transparent animate-spin" />
        </div>
      )}
      {status === "fallback" && (
        // The bake falls back to the raw photo on failure; mirror that so the
        // guest still sees what will be uploaded.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Pratinjau foto"
          className="block w-full h-full object-cover"
          style={cameraFilter ? { filter: cameraFilter } : undefined}
        />
      )}
    </div>
  )
}
