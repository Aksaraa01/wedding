"use client"

import { Backdrop } from "../Ornaments"
import { savedate0 } from "../ornamentData"
import { useCountdown } from "../../shared/useCountdown"

type Props = {
  target: Date | null
  calendarUrl: string
  title: string
  addLabel: string
  lang?: "id" | "en"
}

const pad = (n: number) => String(n).padStart(2, "0")

export default function SaveDate({ target, calendarUrl, title, addLabel, lang = "id" }: Props) {
  const t = useCountdown(target)
  const days = target ? String(t.days) : "00"
  const hours = target ? pad(t.hours) : "00"
  const minutes = target ? pad(t.minutes) : "00"
  const seconds = target ? pad(t.seconds) : "00"

  return (
    <section className="save-date-wrap" data-section-order="save_the_date">
      <Backdrop items={savedate0} />
      <div className=" save-date">
        <div className="save-date-head">
          <h1 className="save-date-title">{title}</h1>
        </div>
        <div className="save-date-body">
          <div className="countdown">
            <div className="count-item">
              <h2 className="count-num count-day">{days}</h2>
              <small className="count-text">Days</small>
            </div>
            <div className="count-item">
              <h2 className="count-num count-hour">{hours}</h2>
              <small className="count-text">Hours</small>
            </div>
          </div>
        </div>
        <div className="save-date-body">
          <div className="countdown">
            <div className="count-item">
              <h2 className="count-num count-minute">{minutes}</h2>
              <small className="count-text">Minutes</small>
            </div>
            <div className="count-item">
              <h2 className="count-num count-second">{seconds}</h2>
              <small className="count-text">Seconds</small>
            </div>
          </div>
        </div>
        {calendarUrl ? (
          <div className="add-to-calendar-wrap">
            <a className="add-to-calendar" href={calendarUrl} target="_blank" rel="nofollow noreferrer">
              {addLabel}
            </a>
          </div>
        ) : null}
      </div>
      <div className="sd-mask" />
    </section>
  )
}
