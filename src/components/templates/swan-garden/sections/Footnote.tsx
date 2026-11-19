"use client"

import { Backdrop } from "../Ornaments"
import { footnote0, footnote1 } from "../ornamentData"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"

type Props = {
  coupleLabel: string
  kicker: string
  hashtag: string
}

export default function Footnote({ coupleLabel, kicker, hashtag }: Props) {
  const names = coupleLabel.split(" & ")
  return (
    <section className="footnote-wrap" data-section-order="footnote">
      <Backdrop items={footnote0} />
      <div className="footnote">
        <div className="orn-wrapper" />
        <div className="content">
          <p className="top-text">{kicker}</p>
          <h2 className="footnote-title">
            {names.map((n, i) => (
              <span key={i}>
                {n}
                {i < names.length - 1 ? (
                  <>
                    <br />
                    {"&"}
                    <br />
                  </>
                ) : null}
              </span>
            ))}
          </h2>
          {hashtag ? <p className="bottom-text">{hashtag}</p> : null}
        </div>
      </div>
      <Backdrop items={footnote1} />
      <div className="sw-footer">
        <a
          className="tpl-footer__link"
          href={`https://wa.me/${AKSARAA_WA_NUMBER}`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="tpl-footer__badge">
            <img className="tpl-footer__logo" src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa" loading="lazy" />
          </span>
          <span className="tpl-footer__cta">Wedding by Aksaraa</span>
        </a>
      </div>
    </section>
  )
}
