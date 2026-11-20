"use client"

import { Backdrop } from "../Ornaments"
import { primary0, primary2 } from "../ornamentData"

type Props = {
  coupleLabel: string
  guestLabel: string
  openLabel: string
  opened: boolean
  onOpen: () => void
}

export default function PrimaryPane({ coupleLabel, guestLabel, openLabel, opened, onOpen }: Props) {
  return (
    <section className="primary-pane" aria-hidden="true">
      <div className="inner">
        <Backdrop items={primary0} eager />
        <div className="inner-wrapper">
          <div className=" head-wrap">
            <div className="invitation-category vip">
              <div className="category-icon">
                <svg className="icon ic-filled ic-star" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z" />
                </svg>
              </div>
              <p className="category-label">VIP</p>
            </div>
            <h1 className="primary-pane-title">{coupleLabel}</h1>
          </div>
          <div className=" details">
            <p>{guestLabel}</p>
            {!opened ? (
              <div className="link-wrap">
                <button type="button" className="sw-open-btn" onClick={onOpen}>
                  {openLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Backdrop items={primary2} />
    </section>
  )
}
