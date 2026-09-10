"use client"

import { useState } from "react"

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallbackCopy(text)
    )
  }
  return Promise.resolve(fallbackCopy(text))
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

export function useCopy(): {
  copiedKey: string | null
  copy: (key: string, value: string) => Promise<void>
} {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = async (key: string, value: string) => {
    const ok = await copyText(value)
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
        {copied ? "done" : "content_copy"}
      </span>
      <span>{copied ? copiedDisplay : display}</span>
    </button>
  )
}
