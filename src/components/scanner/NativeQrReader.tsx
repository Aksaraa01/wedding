"use client"

import { useEffect, useRef } from "react"
import jsQR from "jsqr"

interface NativeQrReaderProps {
  onScan: (decodedText: string) => void
  isPaused?: boolean
}

export default function NativeQrReader({ onScan, isPaused = false }: NativeQrReaderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onScanRef = useRef(onScan)
  const isPausedRef = useRef(isPaused)

  useEffect(() => {
    onScanRef.current = onScan
    isPausedRef.current = isPaused
  }, [onScan, isPaused])

  useEffect(() => {
    let animationFrameId: number
    let stream: MediaStream | null = null
    let isMounted = true

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        })

        if (!isMounted || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})

        const scanFrame = () => {
          if (!isMounted) return

          const video = videoRef.current
          const canvas = canvasRef.current

          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !isPausedRef.current) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              })

              if (code && code.data) {
                onScanRef.current(code.data)
              }
            }
          }

          animationFrameId = requestAnimationFrame(scanFrame)
        }

        animationFrameId = requestAnimationFrame(scanFrame)
      } catch (err) {
        console.error("Camera access error:", err)
      }
    }

    startCamera()

    return () => {
      isMounted = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (stream) stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <>
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
