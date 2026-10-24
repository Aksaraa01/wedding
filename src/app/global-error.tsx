"use client"

import { useEffect } from "react"
import { isChunkLoadError, reloadForChunkError } from "@/lib/chunk-error"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
    <html lang="id">
      <body style={{ margin: 0, background: "#FBF8F3", color: "#1A1817", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Terjadi Kesalahan</h1>
          <p style={{ fontSize: 14, color: "#6B6560", marginBottom: 32, maxWidth: 340 }}>
            {isChunkLoadError(error)
              ? "Versi halaman ini sudah kedaluwarsa. Silakan muat ulang untuk memuat pembaruan."
              : "Maaf, terjadi gangguan. Silakan coba lagi."}
          </p>
          <button
            onClick={handleRetry}
            style={{ background: "#4f1519", color: "#fff", border: 0, borderRadius: 999, padding: "12px 32px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  )
}
