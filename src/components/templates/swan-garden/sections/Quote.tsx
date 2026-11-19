"use client"

import { Backdrop } from "../Ornaments"
import { quote0, quote1 } from "../ornamentData"
import { SG } from "../assets"

type Props = {
  text: string
  source: string
  title?: string
  description?: string
}

export default function Quote({ text, source, title, description }: Props) {
  const hasQuote = Boolean(text || source)
  const hasBody = Boolean(title || description)
  if (!hasQuote && !hasBody) return null

  return (
    <section className="quote-wrap" data-section-order="quote">
      <Backdrop items={quote0} />
      <div className="quote">
        <div className="quotes-frame">
          <img src={SG.frameQuote} alt="" aria-hidden="true" width={1200} height={1112} loading="eager" />
          <div className="quotes-content">
            {hasQuote ? (
              <p className="quote-caption">
                {text ? <>&ldquo;{text}&rdquo;</> : null}
                {text && source ? <br /> : null}
                {source ? <span className="sw-quote__source">{source}</span> : null}
              </p>
            ) : null}
            {hasBody ? (
              <div className="sw-quote__body">
                {title ? <p className="sw-quote__title">{title}</p> : null}
                {description ? <p className="sw-quote__text">{description}</p> : null}
              </div>
            ) : null}
          </div>
          <Backdrop items={quote1} />
        </div>
      </div>
    </section>
  )
}
