"use client"

import { useEffect } from "react"

export default function InvitationOpenedTracker({ guestId }: { guestId?: string }) {
  useEffect(() => {
    if (!guestId) return
    fetch(`/api/guests/${guestId}/open`, { method: "POST" }).catch(() => {})
  }, [guestId])
  return null
}
