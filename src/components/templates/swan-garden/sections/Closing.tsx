"use client"

import { Backdrop } from "../Ornaments"
import { notes0 } from "../ornamentData"

type Props = {
  title: string
  message: string
}

export default function Closing({ title, message }: Props) {
  if (!title && !message) return null
  return (
    <section className="notes-container" data-section-order="greet_thanks">
      <Backdrop items={notes0} />
      <div className="note">
        <h4 className="note-title">{title}</h4>
        <p className="note-description">{message}</p>
      </div>
    </section>
  )
}
