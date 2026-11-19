"use client"

import { Backdrop } from "../Ornaments"
import { rundown0, rundown1 } from "../ornamentData"

type Item = { time?: string; description?: string }

type Props = {
  items: Item[]
  title: string
  eventTitle: string
}

export default function Rundown({ items, title, eventTitle }: Props) {
  const list = items.filter((i) => i.time || i.description)
  if (!list.length) return null
  return (
    <section className="rundown-container" data-section-order="rundown">
      <div className="rundown-inner">
        <h3 className="rundown-title">{title}</h3>
        <div className="rundown-event-list">
          <div className="rundown-event-outer">
            <Backdrop items={rundown0} />
            <div className="bg-rundown" />
            <Backdrop items={rundown1} />
            <div className="rundown-event">
              {eventTitle ? <h5 className="rundown-event-title">{eventTitle}</h5> : null}
              <div className="rundown-agenda-list">
                {list.map((item, i) => (
                  <div className="rundown-agenda" key={i}>
                    <p className="rundown-agenda-time">{item.time || ""}</p>
                    <div className="rundown-divider">
                      <div className="rundown-line" />
                      <div className="rundown-circle" />
                    </div>
                    <div className="rundown-agenda-content">
                      <p className="rundown-agenda-text">{item.description || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
