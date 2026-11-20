"use client"

import { Backdrop } from "../Ornaments"
import { quote0, quote1 } from "../ornamentData"
import { SG } from "../assets"

type Props = {
  text: string
  source: string
}

export default function Quote({ text, source }: Props) {
  if (!text && !source) return null

  return (
    <section className="quote-wrap" data-section-order="quote">
      <Backdrop items={quote0} />
      <div className="quote">
        <div className="quotes-frame">
          <img src={SG.frameQuote} alt="" aria-hidden="true" width={1200} height={1112} loading="eager" />
          <div className="quotes-content">
            <p className="quote-caption">
              {text ? <>&ldquo;{text}&rdquo;</> : null}
              {text && source ? <br /> : null}
              {source ? <span className="sw-quote__source">{source}</span> : null}
            </p>
          </div>
          <Backdrop items={quote1} />
        </div>
      </div>
    </section>
  )
}
