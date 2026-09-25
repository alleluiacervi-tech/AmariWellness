"use client"

/**
 * The home page's one bold element. Amari sells time, so the hero asks
 * the only question that matters — how long have you got? — and the
 * gold dial answers by sweeping to it. Name, price and the booking
 * button follow the choice. Works as plain radios without JavaScript.
 */

import { useState } from "react"
import Dial from "@/components/Dial"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import { FEATURED_SESSION_ID, OFF_PEAK } from "@/data/sessions"
import type { HoursSchedule } from "@/components/Hours"
import type { SessionItem } from "@/server/db/content"

export default function HeroTime({
  sessions,
  schedule,
}: {
  sessions: SessionItem[]
  schedule: HoursSchedule
}) {
  const [id, setId] = useState(FEATURED_SESSION_ID)
  const session = sessions.find((s) => s.id === id) ?? sessions[1] ?? sessions[0]
  if (!session) return null

  return (
    <div className="instrument">
      <fieldset className="segmented">
        <legend className="sr-only">How long have you got?</legend>
        {sessions.map((s) => (
          <label key={s.id}>
            <input
              type="radio"
              name="hero-length"
              value={s.id}
              checked={id === s.id}
              onChange={() => setId(s.id)}
            />
            {s.durationMinutes} min
          </label>
        ))}
      </fieldset>

      <div className="instrument__readout" aria-live="polite">
        <Dial minutes={session.durationMinutes} size="xl" sweep unit />
        <div className="instrument__text">
          <p className="h3">{session.name}</p>
          <p className="small">{session.summary}</p>
          <p className="price">
            {session.price}
            <small>
              {session.offPeakPrice} on weekdays before{" "}
              {String(OFF_PEAK.endsAt).padStart(2, "0")}:00
            </small>
          </p>
        </div>
      </div>

      <div className="instrument__actions">
        <Link className="btn" href={`/book?session=${session.id}`}>
          Book {session.durationMinutes} minutes
        </Link>
        <OpenStatus schedule={schedule} />
      </div>
    </div>
  )
}
