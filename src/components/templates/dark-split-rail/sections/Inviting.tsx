"use client"

import { FONT_BODY } from "../fonts"
import Section, { SectionHeading } from "../Section"

// "Turut Mengundang" — renders the editor's inviting_families list, one line
// per family. Hidden by the caller when the section is toggled off or empty.
export default function Inviting({ families }: { families: string[] }) {
  const list = families.map((f) => (f || "").trim()).filter(Boolean)
  if (list.length === 0) return null

  return (
    <Section id="inviting" className="bg-black/[0.06]">
      <div className="text-center text-white">
        <SectionHeading>Turut Mengundang</SectionHeading>
        <div className="mt-6 space-y-2">
          {list.map((f, i) => (
            <p key={`${f}-${i}`} className="text-[14px] leading-relaxed" style={{ ...FONT_BODY, color: "rgba(255,255,255,0.85)" }}>
              {f}
            </p>
          ))}
        </div>
      </div>
    </Section>
  )
}
