"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "@/components/Link"
import Bloom from "@/components/Bloom"
import PaymentMethods from "@/components/PaymentMethods"
import { SESSIONS } from "@/data/sessions"

const METHODS = ["MTN MoMo", "Airtel Money", "Visa", "Mastercard"]
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))

export default function BookingFlow() {
  const params = useSearchParams()
  const initial =
    SESSIONS.find((s) => s.id === params.get("session"))?.id ?? "half"
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState(initial)
  const [days, setDays] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [pay, setPay] = useState(METHODS[0])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const heading = useRef<HTMLHeadingElement>(null)
  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[1]
  const weekend = date
    ? [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())
    : false
  const offPeak = Boolean(slot && !weekend && Number(slot.slice(0, 2)) < 16)
  const total = offPeak ? session.offPeakPrice : session.price
  const slots = Array.from({ length: 12 }, (_, i) => i + (weekend ? 9 : 10))
    .filter(
      (hour) =>
        hour * 60 + session.durationMinutes + 15 <= (weekend ? 20 : 21) * 60,
    )
    .map((hour) => `${String(hour).padStart(2, "0")}:00`)

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Kigali",
    })
    const dates = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(`${today}T12:00:00Z`)
      day.setUTCDate(day.getUTCDate() + index + 1)
      return day.toISOString().slice(0, 10)
    })
    setDays(dates)
    setDate(dates[0])
  }, [])

  function go(next: number) {
    setStep(next)
    requestAnimationFrame(() => heading.current?.focus())
  }

  return (
    <main id="main-content" className="booking-page home surface-paper">
      <div className="wrap sec--tight">
        <p className="label">A little time. Entirely yours.</p>
        <div className="booking-heading">
          <h1 className="h1">Book your quiet moment.</h1>
          <span className="demo-badge">Interactive design preview</span>
        </div>
        <p className="meta booking-demo">
          Explore the booking experience with sample details. No reservation,
          payment or message will be sent.
        </p>
        <ol className="booking-progress" aria-label="Booking progress">
          {["Your session", "Day & time", "Details & payment"].map(
            (label, i) => (
              <li key={label}>
                <button
                  disabled={step === 4 || i + 1 > step}
                  aria-current={step === i + 1 ? "step" : undefined}
                  onClick={() => go(i + 1)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </button>
              </li>
            ),
          )}
        </ol>
        <div className="book">
          <div className="book__main stack">
            <h2 ref={heading} tabIndex={-1} className="h2 booking-step-title">
              {
                [
                  "Choose your session",
                  "Make time for yourself",
                  "The finishing touches",
                  "A moment to look forward to.",
                ][step - 1]
              }
            </h2>
            {step === 1 && (
              <>
                <p className="body">
                  Choose the pause that fits your day. Every session includes
                  your own suite and time in the lounge.
                </p>
                <div className="stack">
                  {SESSIONS.map((s) => (
                    <button
                      key={s.id}
                      className="choice booking-choice"
                      aria-pressed={sessionId === s.id}
                      onClick={() => {
                        setSessionId(s.id)
                        setSlot("")
                      }}
                    >
                      <span className="stack--tight">
                        <span className="h3">{s.name}</span>
                        <span className="meta">
                          {s.duration} · Private suite
                        </span>
                      </span>
                      <span className="booking-choice__price">
                        {s.price}
                        <span aria-hidden="true">
                          {sessionId === s.id ? "✓" : "○"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <button className="btn booking-next" onClick={() => go(2)}>
                  Choose a time
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <p className="meta">
                  Sample availability · All times are Kigali time (CAT).
                </p>
                <fieldset className="booking-fieldset">
                  <legend>Choose a day</legend>
                  <div className="days">
                    {days.map((d) => (
                      <button
                        key={d}
                        className="day"
                        aria-pressed={date === d}
                        onClick={() => {
                          setDate(d)
                          setSlot("")
                        }}
                      >
                        {dateLabel(d)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="booking-fieldset">
                  <legend>Choose a time</legend>
                  <div className="slots">
                    {slots.map((time) => (
                      <button
                        key={time}
                        className="slot"
                        aria-pressed={slot === time}
                        onClick={() => setSlot(time)}
                      >
                        <span>{time}</span>
                        {!weekend && Number(time.slice(0, 2)) < 16 && (
                          <span className="slot__note">Quiet hours</span>
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="booking-actions">
                  <button className="btn btn--outline" onClick={() => go(1)}>
                    Back
                  </button>
                  <button
                    className="btn"
                    disabled={!date || !slot}
                    onClick={() => go(3)}
                  >
                    Your details
                  </button>
                </div>
              </>
            )}
            {step === 3 && (
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault()
                  go(4)
                }}
              >
                <p className="meta">
                  Use sample information to try the form. Details stay on this
                  screen only.
                </p>
                <div className="booking-fields">
                  <label className="field">
                    <span>Name</span>
                    <input
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="off"
                      placeholder="e.g. Alex Guest"
                    />
                  </label>
                  <label className="field">
                    <span>Phone number</span>
                    <input
                      required
                      type="tel"
                      pattern={"\\+?[0-9 ]{7,20}"}
                      maxLength={20}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="off"
                      placeholder="e.g. +250 700 000 000"
                    />
                  </label>
                </div>
                <fieldset className="booking-fieldset">
                  <legend>Choose a payment method</legend>
                  <div className="payment-options">
                    {METHODS.map((method) => (
                      <label className="payment-option" key={method}>
                        <input
                          type="radio"
                          name="payment"
                          aria-label={method}
                          checked={pay === method}
                          onChange={() => setPay(method)}
                        />
                        <PaymentMethods method={method} />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="payment-preview">
                  <Bloom />
                  <div>
                    <h3>
                      {pay === "Visa" || pay === "Mastercard"
                        ? "Card payment preview"
                        : "Mobile money preview"}
                    </h3>
                    <p>
                      {pay === "Visa" || pay === "Mastercard"
                        ? "A secure card checkout would open here. No card details are collected in this preview."
                        : "A payment request would be sent to your mobile wallet. No request will be sent in this preview."}
                    </p>
                  </div>
                </div>
                <div className="booking-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => go(2)}
                  >
                    Back
                  </button>
                  <button className="btn" type="submit">
                    Preview confirmation
                  </button>
                </div>
              </form>
            )}
            {step === 4 && (
              <div className="stack booking-confirmation" role="status">
                <span className="booking-confirmation__bloom">
                  <Bloom />
                </span>
                <p className="lead">
                  Thank you, {name.trim() || "guest"}. Here’s how your session
                  confirmation will look.
                </p>
                <p className="body">
                  {session.name} · {dateLabel(date)} at {slot}
                  <br />
                  {session.duration} · {total} · {pay}
                </p>
                <p className="meta">
                  Preview complete. No booking was made, no payment was taken,
                  and no notification was sent.
                </p>
                <div className="booking-actions">
                  <Link className="btn" href="/">
                    Back to Amari
                  </Link>
                  <button
                    className="btn btn--outline"
                    onClick={() => {
                      setName("")
                      setPhone("")
                      setSlot("")
                      go(1)
                    }}
                  >
                    Try another session
                  </button>
                </div>
              </div>
            )}
          </div>
          <aside
            className="book__aside booking-summary"
            aria-label="Session summary"
          >
            <p className="label">Your moment of calm</p>
            <h2 className="h3">{session.name}</h2>
            <dl className="stack--tight">
              <div className="summary__row">
                <dt>Duration</dt>
                <dd>{session.duration}</dd>
              </div>
              <div className="summary__row">
                <dt>Date</dt>
                <dd>{date ? dateLabel(date) : "Choose a day"}</dd>
              </div>
              <div className="summary__row">
                <dt>Time</dt>
                <dd>{slot || "Choose a time"}</dd>
              </div>
              <div className="summary__row">
                <dt>Space</dt>
                <dd>Private suite · 1 guest</dd>
              </div>
            </dl>
            <div className="booking-total">
              <span>Session total</span>
              <strong>{total}</strong>
            </div>
            {offPeak && <p className="meta">Quiet-hours rate applied.</p>}
            <p className="meta">
              Lounge access included. Fifteen minutes reserved between sessions
              to prepare your suite.
            </p>
            <span className="demo-badge">Sample booking · No charge</span>
          </aside>
        </div>
      </div>
    </main>
  )
}
