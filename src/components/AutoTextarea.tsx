"use client"

import { useCallback, useEffect, useRef } from "react"

interface AutoTextareaProps {
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  minRows?: number
  disabled?: boolean
}

// Free-text field that grows with its content: long copy flows onto the next
// row instead of scrolling sideways inside a one-line input. Shared by the
// couple editor and the ops queue editor card so both behave the same.
export default function AutoTextarea({ value, onChange, className, placeholder, minRows = 1, disabled }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    // scrollHeight omits the border, so add it back to avoid clipping the last line.
    el.style.height = `${el.scrollHeight + 2}px`
  }, [])

  useEffect(() => { resize() }, [value, resize])

  // A closed <details> renders no body, so scrollHeight is 0 until the
  // accordion is opened — re-measure on the native toggle event.
  useEffect(() => {
    const details = ref.current?.closest("details")
    if (!details) return
    const onToggle = () => resize()
    details.addEventListener("toggle", onToggle)
    return () => details.removeEventListener("toggle", onToggle)
  }, [resize])

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
}
