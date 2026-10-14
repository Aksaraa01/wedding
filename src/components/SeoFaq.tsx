"use client"

export type FaqItem = { q: string; a: string }

// Keyword-rich FAQ block with FAQPage JSON-LD (eligible for rich results).
// Rendered server-side as plain <details> so crawlers read it without JS.
export default function SeoFaq({ heading, items }: { heading: string; items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto py-16 md:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="font-headline-lg text-[24px] md:text-[32px] text-primary text-center mb-8">
        {heading}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group bg-white border border-[#E2D9CF] rounded-2xl px-6 py-4 open:shadow-md transition-shadow"
          >
            <summary className="cursor-pointer font-semibold text-[#2C2A29] list-none flex items-center justify-between gap-4">
              {item.q}
              <span className="material-symbols-outlined text-[#B34E3F] group-open:rotate-180 transition-transform shrink-0">
                expand_more
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
