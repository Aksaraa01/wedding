"use client"

import { useEffect } from "react"
import { isChunkLoadError, reloadForChunkError } from "@/lib/chunk-error"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    if (isChunkLoadError(error)) reloadForChunkError()
  }, [error])

  function handleRetry() {
    if (isChunkLoadError(error)) {
      window.location.reload()
      return
    }
    reset()
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <span className="material-symbols-outlined text-6xl text-error/50 mb-4">error</span>
      <h1 className="font-headline-md text-2xl text-primary mb-2">Terjadi Kesalahan</h1>
      <p className="text-sm text-on-surface-variant mb-8 max-w-sm">
        {chunkError
          ? "Versi halaman ini sudah kedaluwarsa. Silakan muat ulang untuk memuat pembaruan."
          : "Maaf, terjadi gangguan. Silakan coba lagi."}
      </p>
      <button onClick={handleRetry} className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-xs uppercase tracking-widest hover:bg-secondary transition-colors">Coba Lagi</button>
    </div>
  )
}
