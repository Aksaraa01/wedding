"use client"

import type { TemplateProps } from "@/types/template"
import { Backdrop, ornAsset } from "../Ornaments"
import { agenda0, agenda2, agenda3, agenda4, agenda10 } from "../ornamentData"
import { SG } from "../assets"
import { EventIcon } from "./EventIcon"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const raw = String(value).trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(raw)
  return isNaN(date.getTime()) ? null : date
}

type Props = {
  profile: TemplateProps
  title: string
  mapsLabel: string
  dressTitle: string
  dressNote: string
  showDresscode: boolean
  dressIcons: { man: string; woman: string }
}

export default function Agenda({ profile, title, mapsLabel, dressTitle, dressNote, showDresscode }: Props) {
  const sessions = profile.sessions || []
  if (!sessions.length) return null
  const date = parseDate(sessions[0]?.date || profile.estimated_wedding_date)
  const dress = profile.dresscode || {}
  const colors = (dress.colors || []).filter((c) => c.hex)

  const dressItem = (label: string, icon: string, cls: string) => (
    <div className="dress-item">
      <p className="dress-item-title">{label}</p>
      <div className={`dress-preview ${cls}`}>
        <div className="dress-icon">
          <img className="dress-icon-img" src={icon} alt="" aria-hidden="true" loading="lazy" width={36} height={36} />
          {dress.description ? <p className="dress-icon-label">{dress.description}</p> : null}
        </div>
      </div>
      <div className="dress-color-list">
        {colors.map((c, i) => (
          <div key={i} className="dress-color-item" style={{ ["--bg-color" as string]: c.hex }} title={c.name || c.hex} />
        ))}
      </div>
    </div>
  )

  return (
    <section className="agenda-wrap" data-section-order="event">
      <div className="agenda-inner">
        <div className="agenda-head">
          <h2 className="agenda-title">{title}</h2>
        </div>
        <div className="agenda-body">
          <div className="event-item">
            <div className="event-head">
              <div className="event-head-wrapper">
                {date ? <h3 className="event-day">{DAYS[date.getDay()]}</h3> : null}
                {date ? (
                  <div className="event-date">
                    <div className="item-side">
                      <p>{MONTHS[date.getMonth()]}</p>
                    </div>
                    <div className="divider" />
                    <div className="item-mid">
                      <p>{date.getDate()}</p>
                    </div>
                    <div className="divider" />
                    <div className="item-side right">
                      <p>{date.getFullYear()}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="activity-wrap same-location ">
              {sessions.map((session, index) => (
                <div className="activity-item-outer p-relative" key={index}>
                  <Backdrop items={agenda0} />
                  <div className="activity-item">
                    <div className="frame-wrap">
                      <div className={`activity-frame ${index === 0 ? "first" : ""}`}>
                        <div className="image-wrap">
                          <div className="blur-mask" />
                          <img className="event-image-frame" src={SG.frameEvent} alt="" aria-hidden="true" width={1202} height={1828} loading="eager" />
                        </div>
                      </div>
                      <Backdrop items={agenda2} />
                      <Backdrop items={agenda3} />
                      <Backdrop items={agenda4} />
                    </div>
                    <div className="activity-content no-scrollbar">
                      <div className="activity-content-inner no-scrollbar">
                        <div className="activity-head">
                          <div>
                            <EventIcon index={index} name={session.name || ""} />
                          </div>
                          <h3 className="activity-title">{session.name || ""}</h3>
                          <p className="activity-time">{session.time || ""}</p>
                        </div>
                        <div className="event-details no-scrollbar">
                          <div className="act-place-wrap">
                            <div className="hc-wrap">
                              {session.venue ? <p className="event-hall">{session.venue}</p> : null}
                              {session.address ? <p className="event-address">{session.address}</p> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {session.maps_url ? (
                    <div className="event-link-wrap">
                      <a href={session.maps_url} className="event-link" target="_blank" rel="noreferrer">
                        {mapsLabel}
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          {showDresscode ? (
            <div className="dress-outer p-relative">
              <Backdrop items={agenda10} />
              <div className="dress-wrapper same-location">
                <div className="dress-inner">
                  <div className="dress-header">
                    <h2 className="dress-title">{dressTitle}</h2>
                    {dress.title ? <p className="dress-desc">{dress.title}</p> : null}
                  </div>
                  <div className="dress-body">
                    <div className="dress-list">
                      {dressItem("Men", SG.dressMan, "man-preview")}
                      {dressItem("Women", SG.dressWoman, "woman-preview")}
                    </div>
                  </div>
                  {dressNote ? (
                    <div className="dress-footer">
                      <p className="dress-note">{dressNote}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export const AGENDA_ART = {
  frame: ornAsset("frame-event.png"),
}
