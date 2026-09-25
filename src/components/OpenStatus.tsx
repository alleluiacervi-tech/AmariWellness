"use client"

/**
 * "Open now · until 21:00", read live off the clock in Kigali.
 * Renders an empty line on the server and fills in after mount, so the
 * visitor's clock — not the build machine's — decides what it says.
 */

import { useEffect, useState } from "react"
import { SITE_CONFIG } from "@/data/site"

type Status = { open: boolean; text: string; time: string }

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`

function kigaliNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kigali",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const day = get("weekday")
  return {
    weekend: day === "Sat" || day === "Sun",
    // Friday and Saturday evenings roll into a weekend / weekday morning
    tomorrowWeekend: day === "Fri" || day === "Sat",
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  }
}

function compute(): Status {
  const { weekday, weekend } = SITE_CONFIG.hours.schedule
  const now = kigaliNow()
  const today = now.weekend ? weekend : weekday
  const tomorrow = now.tomorrowWeekend ? weekend : weekday
  if (now.minutes < today.open * 60)
    return { open: false, text: "Opens today at", time: pad(today.open) }
  if (now.minutes < today.close * 60)
    return { open: true, text: "Open now · until", time: pad(today.close) }
  return { open: false, text: "Closed · opens tomorrow at", time: pad(tomorrow.open) }
}

export default function OpenStatus({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    const tick = () => setStatus(compute())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span
      className={`open-status ${className}`}
      data-open={status ? String(status.open) : undefined}
    >
      {status && (
        <>
          <span className="open-status__dot" aria-hidden="true" />
          <span>
            {status.text}{" "}
            <span className="open-status__time">{status.time}</span>
          </span>
        </>
      )}
    </span>
  )
}
