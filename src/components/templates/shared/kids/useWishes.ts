"use client"

// Wish-wall data for the Ceriavite templates. Presentation stays in each
// template (the three designs have nothing in common visually); this hook owns
// the fetch/submit contract so a change to /api/wishes is made once.

import { useCallback, useEffect, useState } from "react"

export type KidsWish = {
  id: string
  name: string | null
  message: string
  created_at: string
}

export type WishSendState = "idle" | "sending" | "done" | "error"

export function useWishes(weddingProfileId?: string, guestId?: string) {
  const [wishes, setWishes] = useState<KidsWish[]>([])
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<WishSendState>("idle")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    if (!weddingProfileId) {
      setLoaded(true)
      return
    }
    let alive = true
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(weddingProfileId)}&status=approved`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return
        setWishes(Array.isArray(data?.wishes) ? data.wishes.slice(0, 40) : [])
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [weddingProfileId])

  const send = useCallback(
    async (name: string, message: string) => {
      const text = message.trim()
      if (!text || state === "sending") return false
      if (!weddingProfileId) {
        setState("done")
        setFeedback("Mode pratinjau, ucapan tidak tersimpan.")
        return true
      }
      setState("sending")
      setFeedback("")
      try {
        const res = await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: weddingProfileId,
            guest_id: guestId || null,
            name: (name || "").trim() || "Tamu Undangan",
            message: text,
            source: "invitation",
          }),
        })
        setState(res.status === 409 || res.ok ? "done" : "error")
        setFeedback(
          res.ok
            ? "Terima kasih! Doa dan ucapan Anda sudah kami terima."
            : res.status === 409
              ? "Ucapan Anda sudah tersampaikan sebelumnya."
              : "Terlalu banyak kiriman. Coba lagi nanti.",
        )
        return res.ok || res.status === 409
      } catch {
        setState("error")
        setFeedback("Gagal terkirim. Periksa koneksi Anda.")
        return false
      }
    },
    [weddingProfileId, guestId, state],
  )

  return { wishes, loaded, state, feedback, send }
}
