"use client"

/**
 * The real booking flow (Phase 1.4b — see CLAUDE.md). Same visual
 * scaffold as the original design preview, but every step now talks to
 * the database: step 2's slots come from `getSlotsAction` (live
 * availability), step 3 verifies a real phone number by one-time code
 * before creating anything, and step 4 is a genuinely confirmed booking
 * with a real reference and QR code — not a client-side simulation.
 *
 * A booking is only ever created once a client is signed in (see
 * `needsHealthAck`/`phase` below) — the hold itself isn't reserved
 * until the "Pay" step, so an abandoned name/phone/code attempt never
 * ties up a suite.
 */

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import Link from "@/components/Link"
import Bloom from "@/components/Bloom"
import Dial from "@/components/Dial"
import { Calendar, Check } from "@/components/icons"
import type { SessionItem, SiteConfig } from "@/server/db/content"
import type { Slot } from "@/server/availability/slots"
import { paymentMethodValues, type PaymentMethod } from "@/server/db/schema"
import { bookingReference } from "@/lib/booking"
import { bookableDates, formatISODate } from "@/lib/kigaliTime"
import { requestOtp, verifyOtpForBooking, acknowledgeHealth, type OtpRequestState, type VerifyBookingState } from "@/server/client-auth/actions"
import { getSlotsAction, beginPaymentAction, confirmPaymentAction, type BeginPaymentState, type ConfirmPaymentState } from "@/server/booking/actions"

const STEPS = ["Your session", "Day & time", "Details & payment"]
const TITLES = ["Choose your session", "Choose a day and time", "The finishing touches", "A moment to look forward to."]

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  momo: "MTN MoMo",
  airtel: "Airtel Money",
  card: "Card",
  other: "Other",
}

const HEALTH_QUESTIONS = ["Pregnancy", "A pacemaker or other implanted device", "Recent surgery", "A spinal injury"]

const dateLabel = (date: string) => formatISODate(date, { weekday: "short", day: "numeric", month: "short" })
const isWeekendDisplay = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())
const pad = (n: number) => String(n).padStart(2, "0")

/** A standards-compliant calendar file; Kigali is UTC+2 all year. */
function downloadIcs(ref: string, session: SessionItem, date: string, time: string, address: string) {
  const start = new Date(`${date}T${time}:00+02:00`)
  const end = new Date(start.getTime() + session.durationMinutes * 60_000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const escape = (s: string) => s.replace(/[,;\\]/g, (c) => `\\${c}`)
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amari Kigali//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ref}@amari.rw`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`Amari · ${session.name}`)}`,
    `LOCATION:${escape(address)}`,
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

type BookingClient = { id: string; name: string; phone: string; needsHealthAck: boolean } | null

type Phase = "details" | "code" | "health" | "pay" | "paying"

export default function RealBookingFlow({
  sessions,
  siteConfig,
  client,
  initialSessionId,
}: {
  sessions: SessionItem[]
  siteConfig: SiteConfig
  client: BookingClient
  initialSessionId?: string
}) {
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState(initialSessionId ?? sessions[0]?.id ?? "")
  const [days, setDays] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsPending, startSlotsTransition] = useTransition()

  const [phase, setPhase] = useState<Phase>(client ? (client.needsHealthAck ? "health" : "pay") : "details")
  const [name, setName] = useState(client?.name ?? "")
  const [phone, setPhone] = useState(client?.phone ?? "")
  const [email, setEmail] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo")
  const [reference, setReference] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>()
  const [paymentId, setPaymentId] = useState<string | undefined>()

  const heading = useRef<HTMLHeadingElement>(null)

  const session = sessions.find((s) => s.id === sessionId) ?? sessions[0]
  const weekend = date ? isWeekendDisplay(date) : false

  const otpInitial: OtpRequestState = {}
  const [otpState, otpAction, otpPending] = useActionState(requestOtp, otpInitial)
  const verifyInitial: VerifyBookingState = {}
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpForBooking, verifyInitial)
  const [healthState, healthAction, healthPending] = useActionState(acknowledgeHealth, {})
  const beginInitial: BeginPaymentState = {}
  const [beginState, beginAction, beginPending] = useActionState(beginPaymentAction, beginInitial)
  const confirmInitial: ConfirmPaymentState = {}
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmPaymentAction, confirmInitial)

  const offPeakForSlot = (time: string) => !weekend && Number(time.slice(0, 2)) < 16
  const offPeak = beginState.offPeak ?? (slot ? offPeakForSlot(slot) : false)
  const total = session ? (offPeak ? session.offPeakPrice : session.price) : ""

  /* The bookable days in Kigali, worked out on the visitor's device after hydration (the server's clock and theirs may straddle midnight). */
  useEffect(() => {
    const next = bookableDates(new Date())
    setDays(next)
    setDate(next[0])
  }, [])

  /* Live availability for the selected day + session. Depends on
     `session.uuid` (a stable primitive), not `session` itself: a Server
     Action anywhere on this page (OTP request/verify, health ack) makes
     Next re-render the server tree and hand down a fresh `sessions`
     array with new object identities, which would otherwise make this
     effect re-fire on every one of those and silently clear an
     already-chosen `slot`. */
  useEffect(() => {
    if (!date || !session) return
    setSlot("")
    startSlotsTransition(async () => {
      const result = await getSlotsAction(date, session.uuid)
      setSlots(result)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, session?.uuid])

  useEffect(() => {
    if (verifyState.verified) {
      setPhase(verifyState.needsHealthAck ? "health" : "pay")
    }
  }, [verifyState])

  useEffect(() => {
    if (healthState.ok) setPhase("pay")
  }, [healthState])

  useEffect(() => {
    if (beginState.started && beginState.paymentId) {
      setPaymentId(beginState.paymentId)
      setPhase("paying")
    }
  }, [beginState])

  useEffect(() => {
    if (confirmState.confirmed) {
      setReference(confirmState.bookingId ? bookingReference(confirmState.bookingId) : "")
      setQrDataUrl(confirmState.qrDataUrl)
      go(4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState])

  function go(next: number) {
    setStep(next)
    requestAnimationFrame(() => heading.current?.focus())
  }

  if (!session) {
    return (
      <p className="body" role="alert">
        No sessions are available to book right now — please check back soon.
      </p>
    )
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
              <p className="body">Every session includes your own suite, a locker, and time in the lounge afterwards.</p>
              <fieldset className="fieldset">
                <legend className="sr-only">Session</legend>
                <div className="options">
                  {sessions.map((s) => (
                    <label className="option" key={s.id}>
                      <input
                        type="radio"
                        name="session"
                        value={s.id}
                        checked={sessionId === s.id}
                        onChange={() => setSessionId(s.id)}
                      />
                      <Dial minutes={s.durationMinutes} size="sm" />
                      <span className="option__body">
                        <span className="h4">{s.name}</span>
                        <span className="meta">{s.summary}</span>
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
                All times are Kigali time (CAT). Weekday sessions before 16:00 are quiet hours, and cost less.
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
                        onChange={() => setDate(d)}
                        aria-label={formatISODate(d, { weekday: "long", day: "numeric", month: "long" })}
                      />
                      <span className="date__dow" aria-hidden="true">
                        {formatISODate(d, { weekday: "short" })}
                      </span>
                      <span className="date__day" aria-hidden="true">
                        {formatISODate(d, { day: "numeric" })}
                      </span>
                      <span className="date__mon" aria-hidden="true">
                        {formatISODate(d, { month: "short" })}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="fieldset">
                <legend className="legend">Time</legend>
                {slotsPending ? (
                  <p className="meta">Checking availability…</p>
                ) : slots.length === 0 ? (
                  <p className="meta">Nothing available this day — try another.</p>
                ) : (
                  <div className="slots">
                    {slots.map((s) => (
                      <label className="slot" key={s.time} data-taken={!s.available || undefined}>
                        <input
                          type="radio"
                          name="slot"
                          value={s.time}
                          checked={slot === s.time}
                          disabled={!s.available}
                          onChange={() => setSlot(s.time)}
                        />
                        <span>{s.time}</span>
                        {!s.available ? (
                          <span className="slot__note">Taken</span>
                        ) : (
                          s.quietHours && <span className="slot__note">Quiet hours</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <div className="booking__actions">
                <button type="button" className="btn btn--outline" onClick={() => go(1)}>
                  Back
                </button>
                <button type="button" className="btn" disabled={!date || !slot} onClick={() => go(3)}>
                  Continue to your details
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="booking__main stack">
              {phase === "details" && (
                <form
                  className="stack"
                  action={(formData) => {
                    setName(String(formData.get("name") ?? ""))
                    setPhone(String(formData.get("phone") ?? ""))
                    setEmail(String(formData.get("email") ?? ""))
                    otpAction(formData)
                    setPhase("code")
                  }}
                >
                  <div className="form-grid">
                    <label className="field">
                      <span className="field__label">Name</span>
                      <input className="input" name="name" required maxLength={80} defaultValue={name} placeholder="e.g. Alex Guest" />
                    </label>
                    <label className="field">
                      <span className="field__label">Phone number</span>
                      <input
                        className="input input--mono"
                        name="phone"
                        required
                        type="tel"
                        pattern={"\\+?[0-9 ]{7,20}"}
                        maxLength={20}
                        defaultValue={phone}
                        placeholder="+250 7__ ___ ___"
                      />
                      <span className="field__hint">We&rsquo;ll text a 6-digit code to this number.</span>
                    </label>
                    <label className="field">
                      <span className="field__label">Email (optional)</span>
                      <input
                        className="input"
                        name="email"
                        type="email"
                        maxLength={200}
                        autoComplete="email"
                        defaultValue={email}
                        placeholder="you@example.com"
                      />
                      <span className="field__hint">Your confirmation and QR code come by WhatsApp. Add an email to get a copy there too.</span>
                    </label>
                  </div>
                  <div className="booking__actions">
                    <button type="button" className="btn btn--outline" onClick={() => go(2)}>
                      Back
                    </button>
                    <button className="btn" type="submit" disabled={otpPending}>
                      {otpPending ? "Sending…" : "Send code"}
                    </button>
                  </div>
                </form>
              )}

              {phase === "code" && (
                <form className="stack" action={verifyAction}>
                  <input type="hidden" name="phone" value={otpState.phone ?? phone} />
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="email" value={email} />
                  {otpState.devCode && (
                    <div className="notice">
                      <Bloom />
                      <div>
                        <strong>Sandbox mode — no SMS provider is connected yet</strong>
                        <p>
                          Your code is <span className="font-mono">{otpState.devCode}</span>.
                        </p>
                      </div>
                    </div>
                  )}
                  <label className="field">
                    <span className="field__label">6-digit code</span>
                    <input
                      className="input font-mono"
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                      autoFocus
                    />
                  </label>
                  {verifyState.error && (
                    <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                      {verifyState.error}
                    </p>
                  )}
                  <div className="booking__actions">
                    <button type="button" className="btn btn--outline" onClick={() => setPhase("details")}>
                      Back
                    </button>
                    <button className="btn" type="submit" disabled={verifyPending}>
                      {verifyPending ? "Checking…" : "Verify and continue"}
                    </button>
                  </div>
                </form>
              )}

              {phase === "health" && (
                <form className="stack" action={healthAction}>
                  <p className="body">Before your first visit, please confirm none of these apply to you:</p>
                  <ul className="rows">
                    {HEALTH_QUESTIONS.map((q) => (
                      <li className="row" key={q}>
                        {q}
                      </li>
                    ))}
                  </ul>
                  <p className="meta">
                    If one of these does apply, please{" "}
                    <Link className="tlink" href="/contact?subject=other">
                      speak with us first
                    </Link>{" "}
                    before booking.
                  </p>
                  {healthState.error && (
                    <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                      {healthState.error}
                    </p>
                  )}
                  <div className="booking__actions">
                    <button className="btn" type="submit" disabled={healthPending}>
                      {healthPending ? "Confirming…" : "None of these apply — continue"}
                    </button>
                  </div>
                </form>
              )}

              {(phase === "pay" || phase === "paying") && (
                <form className="stack" action={beginAction}>
                  <input type="hidden" name="sessionTypeId" value={session.uuid} />
                  <input type="hidden" name="date" value={date} />
                  <input type="hidden" name="time" value={slot} />
                  <fieldset className="fieldset">
                    <legend className="legend">Payment method</legend>
                    <div className="pay-options">
                      {paymentMethodValues.map((method) => (
                        <label className="pay-option" key={method}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={() => setPaymentMethod(method)}
                            disabled={phase === "paying"}
                          />
                          <span>{PAYMENT_LABELS[method]}</span>
                          <span className="radio-dot" aria-hidden="true" />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {beginState.error && (
                    <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                      {beginState.error}
                    </p>
                  )}
                  {phase === "pay" && (
                    <div className="notice">
                      <Bloom />
                      <div>
                        <strong>A payment request would go to your phone</strong>
                        <p>Sandbox mode: no real charge happens yet. {siteConfig.payments.note}</p>
                      </div>
                    </div>
                  )}
                  <div className="booking__actions">
                    {phase === "pay" && (
                      <button className="btn" type="submit" disabled={beginPending}>
                        {beginPending ? "Starting…" : `Pay ${total}`}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {phase === "paying" && paymentId && (
                <form
                  action={(formData) => {
                    formData.set("paymentId", paymentId)
                    confirmAction(formData)
                  }}
                >
                  <div className="notice">
                    <Bloom />
                    <div>
                      <strong>Waiting for payment confirmation</strong>
                      <p>A real MoMo/Airtel/card prompt would appear on your phone here. In sandbox mode, confirm it yourself.</p>
                    </div>
                  </div>
                  {confirmState.error && (
                    <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                      {confirmState.error}
                    </p>
                  )}
                  <div className="booking__actions">
                    <button className="btn" type="submit" disabled={confirmPending}>
                      {confirmPending ? "Confirming…" : "Simulate payment success"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="booking__main" role="status">
              <p className="lead">Thank you, {name.trim().split(" ")[0] || "guest"}. This is your confirmation.</p>
              <div className="ticket">
                <div className="ticket__top">
                  <span className="label">Booking reference</span>
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
                      {siteConfig.address.street}, {siteConfig.address.neighborhood}
                    </dd>
                  </div>
                  <div>
                    <dt>Day</dt>
                    <dd>{formatISODate(date, { weekday: "long", day: "numeric", month: "long" })}</dd>
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
                </dl>
                {qrDataUrl && (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a locally generated data: URI */}
                    <img src={qrDataUrl} alt="Check-in QR code" width={160} height={160} />
                    <p className="meta">Show this at the door to check in.</p>
                  </div>
                )}
              </div>
              <p className="meta">Arrive five minutes early. A confirmation has also been sent to your phone.</p>
              <div className="booking__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => downloadIcs(reference, session, date, slot, siteConfig.address.full)}
                >
                  <Calendar /> Add to calendar
                </button>
                <Link className="tlink" href="/account">
                  View your bookings
                </Link>
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
              <dd className={date ? undefined : "is-empty"}>{date ? dateLabel(date) : "Choose a day"}</dd>
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
          <p className="meta">Lounge access included. Fifteen minutes are reserved after every session to reset the suite.</p>
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
