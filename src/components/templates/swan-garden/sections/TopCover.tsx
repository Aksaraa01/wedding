"use client"

import { Backdrop } from "../Ornaments"
import { topcover0, topcover1 } from "../ornamentData"

type Props = {
  hidden: boolean
  onOpen: () => void
  coupleLabel: string
  guestLabel: string
  openLabel: string
  photo: string
}

export default function TopCover({ hidden, onOpen, coupleLabel, guestLabel, openLabel, photo }: Props) {
  return (
    <section className={`top-cover${hidden ? " hide" : ""}`} data-section-order="opening_cover" aria-hidden={hidden}>
      <Backdrop items={topcover0} eager />
      {photo ? <div className="sw-gate__photo" style={{ backgroundImage: `url(${photo})` }} aria-hidden="true" /> : null}
      <div className=" inner">
        <div className="head-tc">
          <div>
            <div className="invitation-category vip">
              <div className="category-icon">
                <svg className="icon ic-filled ic-star" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z" />
                </svg>
              </div>
              <p className="category-label">VIP</p>
            </div>
          </div>
          <h1 className="top-cover-title">{coupleLabel}</h1>
        </div>
        <div className=" details">
          <p className="sw-gate__guest">{guestLabel}</p>
          <div className="link-wrap">
            <button type="button" className="link sw-open-btn" onClick={onOpen}>
              {openLabel}
            </button>
          </div>
        </div>
      </div>
      <Backdrop items={topcover1} eager />
    </section>
  )
}
