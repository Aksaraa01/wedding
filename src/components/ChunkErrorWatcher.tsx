"use client"

import { useEffect } from "react"
import { isChunkLoadError, isNextStaticAsset, reloadForChunkError } from "@/lib/chunk-error"

export default function ChunkErrorWatcher() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        reloadForChunkError()
        return
      }
      const target = event.target
      if (target instanceof HTMLScriptElement && isNextStaticAsset(target.src)) {
        reloadForChunkError()
      } else if (target instanceof HTMLLinkElement && isNextStaticAsset(target.href)) {
        reloadForChunkError()
      }
    }

    function onRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadError(event.reason)) reloadForChunkError()
    }

    window.addEventListener("error", onError, true)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError, true)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
