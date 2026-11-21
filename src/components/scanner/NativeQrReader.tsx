"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"

interface NativeQrReaderProps {
  onScan: (decodedText: string) => void
  isPaused?: boolean
  /** Stop and release the camera stream (e.g. while selfie modal is active).
   *  Unlike isPaused, which only skips decoding, this frees camera ownership
   *  so another component can use getUserMedia on the same device. */
  releaseCamera?: boolean
}

export default function NativeQrReader({ onScan, isPaused = false, releaseCamera = false }: NativeQrReaderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const onScanRef = useRef(onScan)
  const isPausedRef = useRef(isPaused)

  useEffect(() => {
    onScanRef.current = onScan
    isPausedRef.current = isPaused
  }, [onScan, isPaused])

  const [camError, setCamError] = useState<string | null>(null)
  const [camLoading, setCamLoading] = useState(true)
  const [hasCamera, setHasCamera] = useState(true)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const facingCacheRef = useRef<"environment" | "user">("environment")
  const restartRef = useRef<((retry?: boolean) => void) | null>(null)

  useEffect(() => {
    facingCacheRef.current = facing
  }, [facing])

  const switchCamera = () => {
    setFacing((f) => {
      const next = f === "environment" ? "user" : "environment"
      facingCacheRef.current = next
      if (restartRef.current) restartRef.current(true)
      return next
    })
  }

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
      if (code?.data) onScanRef.current(code.data)
      else setCamError("QR tidak terdeteksi pada gambar")
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
    if (e.target) e.target.value = ""
  }

  useEffect(() => {
    if (releaseCamera) {
      setCamLoading(false)
      if (videoRef.current) videoRef.current.srcObject = null
      restartRef.current = () => {}
      return
    }

    let animationFrameId: number
    let stream: MediaStream | null = null
    let isMounted = true
    let barcodeDetector: any = null
    const useBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window

    const startCamera = async (isRetry = false) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCamError("Kamera tidak didukung di browser ini. Gunakan file upload di bawah.")
        setHasCamera(false)
        setCamLoading(false)
        return
      }
      if (!isRetry) setCamLoading(true)
      setCamError(null)
      try {
        if (useBarcodeDetector) {
          try {
            barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] })
          } catch { barcodeDetector = null }
        }
        const tries: MediaStreamConstraints[] = [
          { video: { facingMode: { exact: facingCacheRef.current }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          { video: { facingMode: facingCacheRef.current, width: { ideal: 1280 }, height: { ideal: 720 } } },
          { video: true },
        ]
        let lastErr: any = null
        stream = null
        for (const c of tries) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(c)
            break
          } catch (e: any) {
            lastErr = e
            if (e?.name === "NotAllowedError") throw e
          }
        }
        if (!stream) throw lastErr || new Error("Camera not available")
        if (!isMounted || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          stream = null
          return
        }
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setCamLoading(false)
        setHasCamera(true)

        const scanFrame = async () => {
          if (!isMounted) return
          const video = videoRef.current
          const canvas = canvasRef.current
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !isPausedRef.current) {
            if (barcodeDetector) {
              try {
                const codes = await barcodeDetector.detect(video)
                if (codes?.[0]?.rawValue) {
                  onScanRef.current(codes[0].rawValue)
                }
              } catch {}
            } else {
              const ctx = canvas.getContext("2d", { willReadFrequently: true })
              if (ctx) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" })
                if (code?.data) onScanRef.current(code.data)
              }
            }
          }
          animationFrameId = requestAnimationFrame(scanFrame)
        }
        animationFrameId = requestAnimationFrame(scanFrame as any)
      } catch (err: any) {
        setCamLoading(false)
        const name = err?.name || ""
        if (name === "NotAllowedError") {
          setCamError("Izin kamera ditolak. Aktifkan di pengaturan browser lalu tap Coba Lagi.")
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCamError("Kamera tidak ditemukan di perangkat ini.")
          setHasCamera(false)
        } else if (name === "NotReadableError") {
          setCamError("Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu Coba Lagi.")
        } else if (name === "OverconstrainedError") {
          setCamError("Kamera tidak mendukung mode ini. Coba lagi.")
        } else if (name === "SecurityError") {
          setCamError("Kamera butuh HTTPS. Buka via https://")
        } else {
          setCamError(err?.message || "Gagal mengakses kamera")
        }
        console.error("Camera access error:", err)
      }
    }

    startCamera()
    restartRef.current = (retry = false) => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      stream = null
      startCamera(retry)
    }

    const onVis = () => {
      if (document.visibilityState === "visible" && stream?.getTracks().some(t => t.readyState === "live")) {
        videoRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      isMounted = false
      document.removeEventListener("visibilitychange", onVis)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [releaseCamera])

  const retry = () => {
    setCamError(null)
    setCamLoading(true)
    restartRef.current?.(true)
  }

  return (
    <>
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />
      {!camError && !camLoading && hasCamera && (
        <button
          onClick={switchCamera}
          title="Ganti kamera"
          aria-label="Ganti kamera"
          className="absolute top-3 right-3 z-30 p-2.5 bg-black/40 hover:bg-black/70 backdrop-blur-sm rounded-full text-white border border-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">cameraswitch</span>
        </button>
      )}
      {camLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-3">
          <span className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/80">Meminta izin kamera...</span>
        </div>
      )}
      {camError && !camLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-6 text-center gap-3">
          <span className="material-symbols-outlined text-white text-4xl">videocam_off</span>
          <p className="text-sm text-white font-medium">{camError}</p>
          {hasCamera && (
            <button onClick={retry} className="mt-2 px-6 py-2 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90">Coba Lagi</button>
          )}
          <label className="mt-2 px-6 py-2 bg-secondary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-secondary/90 cursor-pointer">
            Upload dari Galeri
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileScan} />
          </label>
          <p className="text-[10px] text-white/50 mt-1">Pastikan menggunakan HTTPS (https://) dan izinkan kamera.</p>
        </div>
      )}
      {!camError && !camLoading && hasCamera && (
        <label className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-black/60">
          <span className="material-symbols-outlined text-sm">image</span> Galeri
          <input type="file" accept="image/*" className="hidden" onChange={handleFileScan} />
        </label>
      )}
    </>
  )
}
