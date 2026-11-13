"use client"

import { useState } from "react"
import { copyPlainText } from "@/lib/clipboard"

export function useCopy(): {
  copiedKey: string | null
  copy: (key: string, value: string) => Promise<void>
} {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = async (key: string, value: string) => {
    const ok = await copyPlainText(value)
    if (ok) {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000)
    }
  }
  return { copiedKey, copy }
}

export function CopyButton({
  copyKey,
  value,
  display,
  copiedDisplay = "Copied!",
  className = "",
  iconClassName = "",
}: {
  copyKey: string
  value: string
  display: string
  copiedDisplay?: string
  className?: string
  iconClassName?: string
}) {
  const { copiedKey, copy } = useCopy()
  const copied = copiedKey === copyKey
  return (
    <button
      type="button"
      onClick={() => copy(copyKey, value)}
      className={`${className} ${copied ? "border-emerald-500/50 text-emerald-300" : ""}`}
    >
      <span className={`material-symbols-outlined text-[16px] ${iconClassName}`}>
        {copied ? "check" : "content_copy"}
      </span>
      <span>{copied ? copiedDisplay : display}</span>
    </button>
  )
}
