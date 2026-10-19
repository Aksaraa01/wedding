"use client"

import type { ReactNode } from "react"
import { FONT_DISPLAY } from "./fonts"

export function SectionHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-[20px] uppercase text-white/95 ${className}`} style={{ ...FONT_DISPLAY, letterSpacing: "2px" }}>
      {children}
    </h2>
  )
}

type Props = {
  id?: string
  children: ReactNode
  className?: string
  reveal?: boolean
}

// Content block inside the rail. `reveal` opts into the .dsr-reveal entrance.
export default function Section({ id, children, className = "", reveal = true }: Props) {
  return (
    <section id={id} data-section={id} className={`relative ${className}`}>
      <div className={`${reveal ? "dsr-reveal" : ""} px-9 py-14`}>{children}</div>
    </section>
  )
}
