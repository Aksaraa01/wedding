"use client"

import { Backdrop } from "../Ornaments"
import { rundown0, rundown1 } from "../ornamentData"

type Props = {
  families: string[]
  title: string
  intro: string
}

// Not in the reference. The 16-section contract requires "Turut Mengundang",
// so it is rebuilt with the reference's own primitives: the rundown paper card
// (same frame, same ornaments) with the script heading and Halant names.
export default function Families({ families, title, intro }: Props) {
  const list = families.map((f) => f.trim()).filter(Boolean)
  if (!list.length) return null
  return (
    <section className="rundown-container sw-families" data-section-order="inviting">
      <div className="rundown-inner">
        <h3 className="rundown-title">{title}</h3>
        <div className="rundown-event-list">
          <div className="rundown-event-outer">
            <Backdrop items={rundown0} />
            <div className="bg-rundown" />
            <Backdrop items={rundown1} />
            <div className="rundown-event">
              {intro ? <p className="sw-families__intro">{intro}</p> : null}
              <div className="sw-families__list">
                {list.map((name, i) => (
                  <p className="sw-families__name" key={i}>
                    {name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
