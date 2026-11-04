"use client"

import type { ReactNode } from "react"

export type FaqItem = { q: string; a: string }

// Minimal inline-link markup: [label](/path) or [label](https://...).
// Internal links stay in-tab; external links open in a new tab.
function renderRichText(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const href = m[2]
    const external = /^https?:\/\//.test(href)
    parts.push(
      <a
        key={key++}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="font-semibold text-[#B34E3F] underline underline-offset-2 hover:text-[#9E3B2D]"
      >
        {m[1]}
      </a>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}

// Keyword-rich FAQ block with FAQPage JSON-LD (eligible for rich results).
// Rendered server-side as plain <details> so crawlers read it without JS.
export default function SeoFaq({ heading, items }: { heading: string; items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plainText(item.a) },
    })),
  }
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto py-10 md:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="font-headline-lg text-[19px] md:text-[32px] text-primary text-center mb-5 md:mb-8">
        {heading}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group bg-white border border-[#E2D9CF] rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 open:shadow-md transition-shadow"
          >
            <summary className="cursor-pointer font-semibold text-[13.5px] md:text-base text-[#2C2A29] list-none flex items-center justify-between gap-4">
              {item.q}
              <span className="material-symbols-outlined text-[#B34E3F] group-open:rotate-180 transition-transform shrink-0">
                expand_more
              </span>
            </summary>
            <p className="mt-2 md:mt-3 text-[12.5px] md:text-sm leading-relaxed text-on-surface-variant">{renderRichText(item.a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
