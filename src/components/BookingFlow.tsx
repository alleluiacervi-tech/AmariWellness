"use client"

/**
 * The booking experience, as an honest preview: every choice is a real
 * radio input, the summary follows along, and the confirmation is the
 * ticket a guest would actually receive — minus the charge.
 */

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "@/components/Link"
import Bloom from "@/components/Bloom"
import Dial from "@/components/Dial"
import {
  PaymentMark,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/components/PaymentMethods"
import { Calendar, Check } from "@/components/icons"
import {
  SESSIONS,
  OFF_PEAK,
  FEATURED_SESSION_ID,
  type SessionItem,
} from "@/data/sessions"
import { SITE_CONFIG } from "@/data/site"

const STEPS = ["Your session", "Day & time", "Details & payment"]
const TITLES = [
  "Choose your session",
  "Choose a day and time",
  "The finishing touches",
  "A moment to look forward to.",
]
const TURNOVER_MINUTES = 15

/* Dates are plain YYYY-MM-DD strings, formatted at noon UTC so no
   timezone can tip them onto the neighbouring day. */
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(
    new Date(`${date}T12:00:00Z`),
  )
const dateLabel = (date: string) =>
  fmt(date, { weekday: "short", day: "numeric", month: "short" })
const isWeekend = (date: string) =>
  [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())
const pad = (n: number) => String(n).padStart(2, "0")

/** A few slots are shown as taken so the preview reads like a real week. */
const isTaken = (date: string, hour: number) =>
  (Number(date.slice(-2)) * 7 + hour * 3) % 5 === 0

function makeReference() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return `AM-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`
}

/** A standards-compliant calendar file; Kigali is UTC+2 all year. */
function downloadIcs(ref: string, session: SessionItem, date: string, time: string) {
  const start = new Date(`${date}T${time}:00+02:00`)
  const end = new Date(start.getTime() + session.durationMinutes * 60_000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const escape = (s: string) => s.replace(/[,;\\]/g, (c) => `\\${c}`)
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amari Kigali//Booking preview//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ref}@amari.rw`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`Amari · ${session.name}`)}`,
    `LOCATION:${escape(SITE_CONFIG.address.full)}`,
    `DESCRIPTION:${escape(`Reference ${ref}. Arrive five minutes early — the lounge is yours afterwards.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `amari-${ref.toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function BookingFlow({ initialSession = FEATURED_SESSION_ID }: { initialSession?: string }) {
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState(initialSession)
  const [days, setDays] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [pay, setPay] = useState<PaymentMethod>(PAYMENT_METHODS[0])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const heading = useRef<HTMLHeadingElement>(null)

  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[1]
  const weekend = date ? isWeekend(date) : false
  const hours = weekend ? SITE_CONFIG.hours.schedule.weekend : SITE_CONFIG.hours.schedule.weekday
  const quietHours = (time: string) => !weekend && Number(time.slice(0, 2)) < OFF_PEAK.endsAt
  const offPeak = Boolean(slot && quietHours(slot))
  const total = offPeak ? session.offPeakPrice : session.price
  const slots = Array.from(
    { length: hours.close - hours.open },
    (_, i) => hours.open + i,
  )
    .filter((h) => h * 60 + session.durationMinutes + TURNOVER_MINUTES <= hours.close * 60)
    .map((h) => ({ time: `${pad(h)}:00`, taken: date ? isTaken(date, h) : false }))

  /* The next seven days in Kigali, worked out on the visitor's device. */
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kigali" })
    const next = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${today}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() + i + 1)
      return d.toISOString().slice(0, 10)
    })
    setDays(next)
    setDate(next[0])
  }, [])

  function go(next: number) {
    setStep(next)
    requestAnimationFrame(() => heading.current?.focus())
  }

  return (
    <div className={step < 4 ? "booking--with-bar" : undefined}>
      <ol className="steps" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = step > n ? "done" : step === n ? "current" : "todo"
          return (
            <li key={label}>
              <button
                type="button"
                className="step"
                data-state={state}
                disabled={step === 4 || n >= step}
                aria-current={step === n ? "step" : undefined}
                onClick={() => go(n)}
              >
                <span className="step__num" aria-hidden="true">
                  {state === "done" ? <Check /> : pad(n)}
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ol>

      <div className="booking__layout">
        <div className="booking__main">
          <h2 ref={heading} tabIndex={-1} className="h3 booking__title">
            {TITLES[step - 1]}
          </h2>

          {step === 1 && (
            <>
              <p className="body">
                Every session includes your own suite, a locker, and time in the
                lounge afterwards.
              </p>
              <fieldset className="fieldset">
                <legend className="sr-only">Session</legend>
                <div className="options">
                  {SESSIONS.map((s) => (
                    <label className="option" key={s.id}>
                      <input
                        type="radio"
                        name="session"
                        value={s.id}
                        checked={sessionId === s.id}
                        onChange={() => {
                          setSessionId(s.id)
                          setSlot("")
                        }}
                      />
                      <Dial minutes={s.durationMinutes} size="sm" />
                      <span className="option__body">
                        <span className="h4">{s.name}</span>
                        <span className="meta">
                          {s.summary}
                        </span>
                      </span>
                      <span className="option__price">{s.price}</span>
                      <span className="radio-dot" aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="booking__actions">
                <button type="button" className="btn" onClick={() => go(2)}>
                  Continue to day &amp; time
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="meta">
                Sample availability. All times are Kigali time (CAT). Weekday
                sessions before 16:00 are quiet hours, and cost less.
              </p>
              <fieldset className="fieldset">
                <legend className="legend">Day</legend>
                <div className="dates">
                  {days.map((d) => (
                    <label className="date" key={d}>
                      <input
                        type="radio"
                        name="date"
                        value={d}
                        checked={date === d}
                        onChange={() => {
                          setDate(d)
                          setSlot("")
                        }}
                        aria-label={fmt(d, { weekday: "long", day: "numeric", month: "long" })}
                      />
                      <span className="date__dow" aria-hidden="true">
                        {fmt(d, { weekday: "short" })}
                      </span>
                      <span className="date__day" aria-hidden="true">
                        {fmt(d, { day: "numeric" })}
                      </span>
                      <span className="date__mon" aria-hidden="true">
                        {fmt(d, { month: "short" })}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="fieldset">
                <legend className="legend">Time</legend>
                <div className="slots">
                  {slots.map(({ time, taken }) => (
                    <label className="slot" key={time} data-taken={taken || undefined}>
                      <input
                        type="radio"
                        name="slot"
                        value={time}
                        checked={slot === time}
                        disabled={taken}
                        onChange={() => setSlot(time)}
                      />
                      <span>{time}</span>
                      {taken ? (
                        <span className="slot__note">Taken</span>
                      ) : (
                        quietHours(time) && <span className="slot__note">Quiet hours</span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="booking__actions">
                <button type="button" className="btn btn--outline" onClick={() => go(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!date || !slot}
                  onClick={() => go(3)}
                >
                  Continue to your details
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <form
              className="booking__main"
              onSubmit={(event) => {
                event.preventDefault()
                setReference(makeReference())
                go(4)
              }}
            >
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Name</span>
                  <input
                    className="input"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="e.g. Alex Guest"
                  />
                </label>
                <label className="field">
                  <span className="field__label">Phone number</span>
                  <input
                    className="input input--mono"
                    required
                    type="tel"
                    pattern={"\\+?[0-9 ]{7,20}"}
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+250 7__ ___ ___"
                  />
                  <span className="field__hint">
                    Your confirmation and any pack balance live on this number.
                  </span>
                </label>
              </div>
              <fieldset className="fieldset">
                <legend className="legend">Payment method</legend>
                <div className="pay-options">
                  {PAYMENT_METHODS.map((method) => (
                    <label className="pay-option" key={method}>
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={pay === method}
                        onChange={() => setPay(method)}
                      />
                      <PaymentMark method={method} />
                      <span className="radio-dot" aria-hidden="true" />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="notice">
                <Bloom />
                <div>
                  <strong>
                    {pay === "Visa" || pay === "Mastercard"
                      ? "A secure card checkout would open here"
                      : "A payment request would go to your phone"}
                  </strong>
                  <p>
                    This is a design preview: no card details are collected and
                    no request is sent. {SITE_CONFIG.payments.note}
                  </p>
                </div>
              </div>
              <div className="booking__actions">
                <button type="button" className="btn btn--outline" onClick={() => go(2)}>
                  Back
                </button>
                <button className="btn" type="submit">
                  Preview confirmation
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="booking__main" role="status">
              <p className="lead">
                Thank you, {name.trim().split(" ")[0] || "guest"}. This is the
                confirmation you would receive by SMS and WhatsApp.
              </p>
              <div className="ticket">
                <div className="ticket__top">
                  <div className="cluster justify-between">
                    <span className="label">Booking reference</span>
                    <span className="tag tag--outline">Preview, not booked</span>
                  </div>
                  <span className="ticket__ref">{reference}</span>
                </div>
                <div className="ticket__tear" aria-hidden="true" />
                <dl className="ticket__rows">
                  <div>
                    <dt>Session</dt>
                    <dd className="serif">{session.name}</dd>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd className="serif">
                      {SITE_CONFIG.address.street}, {SITE_CONFIG.address.neighborhood}
                    </dd>
                  </div>
                  <div>
                    <dt>Day</dt>
                    <dd>{fmt(date, { weekday: "long", day: "numeric", month: "long" })}</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>
                      {slot}, {session.durationMinutes} min
                    </dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{total}</dd>
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>{pay}</dd>
                  </div>
                </dl>
              </div>
              <p className="meta">
                Arrive five minutes early. Nothing was booked, charged or sent —
                but the calendar file below is real.
              </p>
              <div className="booking__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => downloadIcs(reference, session, date, slot)}
                >
                  <Calendar /> Add to calendar
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => {
                    setName("")
                    setPhone("")
                    setSlot("")
                    go(1)
                  }}
                >
                  Plan another
                </button>
                <Link className="tlink" href="/">
                  Back to the homepage
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="summary" aria-label="Booking summary">
          <div className="cluster justify-between flex-nowrap">
            <div className="stack--tight">
              <p className="label">Your booking</p>
              <p className="h3">{session.name}</p>
            </div>
            <Dial minutes={session.durationMinutes} />
          </div>
          <dl>
            <div className="summary__row">
              <dt>Duration</dt>
              <dd>{session.duration}</dd>
            </div>
            <div className="summary__row">
              <dt>Day</dt>
              <dd className={date ? undefined : "is-empty"}>
                {date ? dateLabel(date) : "Choose a day"}
              </dd>
            </div>
            <div className="summary__row">
              <dt>Time</dt>
              <dd className={slot ? undefined : "is-empty"}>{slot || "Choose a time"}</dd>
            </div>
            <div className="summary__row">
              <dt>Suite</dt>
              <dd>Private, one guest</dd>
            </div>
          </dl>
          <div className="summary__total">
            <span>Total</span>
            <span className="price">{total}</span>
          </div>
          {offPeak && <p className="meta">Quiet-hours rate applied.</p>}
          <p className="meta">
            Lounge access included. Fifteen minutes are reserved after every
            session to reset the suite.
          </p>
        </aside>
      </div>

      {step < 4 && (
        <div className="booking-bar" aria-hidden="true">
          <span className="booking-bar__copy">
            <strong>{session.name}</strong>
            <span>
              {date ? dateLabel(date) : "Choose a day"}
              {slot ? `, ${slot}` : ""}
            </span>
          </span>
          <span className="price">{total}</span>
        </div>
      )}
    </div>
  )
}

/** Reads ?session= from the URL. Render inside <Suspense> with <BookingFlow /> as the fallback. */
export default function BookingFlowFromParams() {
  const params = useSearchParams()
  const id =
    SESSIONS.find((s) => s.id === params.get("session"))?.id ?? FEATURED_SESSION_ID
  return <BookingFlow key={id} initialSession={id} />
}
