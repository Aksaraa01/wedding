"use client"

import { useEffect, useState } from "react"

function diff(target: Date) {
  const now = Date.now()
  const ms = target.getTime() - now
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return { days, hours, minutes, seconds }
}

export function useCountdown(target: Date | null) {
  const [t, setT] = useState(() => diff(target || new Date()))
  useEffect(() => {
    if (!target) return
    setT(diff(target))
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])
  return t
}