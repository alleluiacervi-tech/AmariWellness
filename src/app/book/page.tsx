"use client"

/* Design-only. No availability is fetched and no payment is taken — the slot
   grid and sold-out states below are deterministic placeholders standing in
   for a real resource-scheduling backend. */
/* ignore a malformed draft */
/* On a phone the slots render below the fold; without this the
       flow looks like it has stalled. */

/* ── CONFIRMATION ── */ /* ── STEP 1 — PROGRAMME ── */ /* ── STEP 2 — DATE + TIME ── */ /* ── STEP 3 — DETAILS + PAYMENT ── */ /* The promise that matters most, where the decision is made. */ /* ── SUMMARY RAIL — the room, the price and the reassurance,
             all the way to the pay button. ── */

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "@/components/Link"
import Figure from "@/components/Figure"
import { useSearchParams } from "next/navigation"
import { SESSIONS, PARTNER_SESSIONS } from "@/data/sessions"
import { PACKS } from "@/data/packs"
import { SITE_CONFIG } from "@/data/site"
import { IMAGES } from "@/data/images"

interface BookingForm {
  session: string
  date: Date | null
  time: string
  name: string
  phone: string
  email: string
  notes: string
  payment: string
  agreed: boolean
}

interface FormErrors {
  name?: string
  phone?: string
  agreed?: string
  payment?: string
}

const ALL_ITEMS = [...SESSIONS, ...PARTNER_SESSIONS].map((s) => ({
  id: s.id,
  label: s.name,
  meta: `${s.duration} · ${s.capacity}`,
  price: s.price,
  priceNumber: s.priceNumber,
  minutes: s.durationMinutes,
}))

const TIME_GROUPS = [
  { label: "Morning", slots: ["09:00", "10:00", "11:00"] },
  {
    label: "Midday — quiet hours",
    slots: ["12:00", "13:00", "14:00", "15:00"],
    offPeak: true,
  },
  { label: "Evening", slots: ["16:30", "17:30", "18:30", "19:30"] },
]

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const PAYMENT_METHODS = [
  {
    id: "momo",
    label: "MTN Mobile Money",
    hint: "You will get a prompt on your phone",
  },
  {
    id: "airtel",
    label: "Airtel Money",
    hint: "You will get a prompt on your phone",
  },
  {
    id: "card",
    label: "Visa or Mastercard",
    hint: "Entered on the next screen",
  },
]

const STEP_TITLES = [
  "Choose a programme.",
  "Pick a day and a time.",
  "Your details.",
]

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookPageContent />
    </Suspense>
  )
}

function BookPageContent() {
  const searchParams = useSearchParams()
  const initialSession = searchParams.get("session") || ""
  const initialPack = searchParams.get("pack") || ""

  const [step, setStep] = useState(1)
  const [referenceCode, setReferenceCode] = useState("")
  const [monthOffset, setMonthOffset] = useState(0)
  const slotsRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<BookingForm>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("amari_booking_draft")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          return { ...parsed, date: parsed.date ? new Date(parsed.date) : null }
        } catch {}
      }
    }
    return {
      session: initialSession || (initialPack ? `pack-${initialPack}` : ""),
      date: null,
      time: "",
      name: "",
      phone: "",
      email: "",
      notes: "",
      payment: "",
      agreed: false,
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (initialSession && ALL_ITEMS.some((s) => s.id === initialSession)) {
      setForm((f) => ({ ...f, session: initialSession }))
      setStep(2)
    } else if (initialPack) {
      setForm((f) => ({ ...f, session: `pack-${initialPack}` }))
      setStep(3)
    }
  }, [initialSession, initialPack])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("amari_booking_draft", JSON.stringify(form))
    }
  }, [form])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const viewDate = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1,
  )
  const monthName = viewDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate()
  const firstDayIndex = (viewDate.getDay() + 6) % 7

  const daysList = []
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i)
    const isPast = d < today
    daysList.push({
      date: d,
      dayNum: i,
      disabled: isPast || i % 9 === 4,
      isPast,
    })
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const selectedItem = ALL_ITEMS.find((s) => s.id === form.session)
  const selectedPack = form.session.startsWith("pack-")
    ? PACKS.find((p) => p.id === form.session.replace("pack-", ""))
    : null

  const isOffPeak =
    TIME_GROUPS.find((g) => g.slots.includes(form.time))?.offPeak ?? false
  const sessionForPrice = SESSIONS.find((s) => s.id === form.session)
  const livePrice = selectedPack
    ? selectedPack.price
    : isOffPeak && sessionForPrice
      ? sessionForPrice.offPeakPrice
      : (selectedItem?.price ?? "")

  function pickDay(date: Date) {
    setForm((f) => ({ ...f, date, time: "" }))
    requestAnimationFrame(() => {
      if (window.matchMedia("(min-width: 680px)").matches) return
      slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function validate() {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = "We need a name for the booking."
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 9) {
      e.phone = "Enter a phone number we can reach you on."
    }
    if (!form.payment) e.payment = "Choose how you would like to pay."
    if (!form.agreed)
      e.agreed = "Please confirm you have read the cancellation terms."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) {
      setReferenceCode(`AMR-${Math.floor(10000 + Math.random() * 90000)}`)
      setStep(4)
      sessionStorage.removeItem("amari_booking_draft")
    }
  }

  function downloadCalendarFile() {
    if (!form.date || !form.time) return
    const [hours, mins] = form.time.split(":").map(Number)
    const start = new Date(form.date)
    start.setHours(hours, mins, 0, 0)
    const end = new Date(start)
    end.setMinutes(start.getMinutes() + (selectedItem?.minutes ?? 30))

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${SITE_CONFIG.name}//Kigali//EN`,
      "BEGIN:VEVENT",
      `UID:${referenceCode}@amari.rw`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${SITE_CONFIG.name} — ${selectedItem?.label || "Session"}`,
      `DESCRIPTION:Private suite. Arrive five minutes early on a first visit. Ref: ${referenceCode}`,
      `LOCATION:${SITE_CONFIG.address.full}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute("download", `${SITE_CONFIG.name}-${referenceCode}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  if (step === 4) {
    return (
      <main
        className="book-page book-page--confirm surface-paper"
        id="main-content"
      >
        <div className="confirm">
          <p className="label">Booked</p>
          <h1 className="confirm__title">Your room is held.</h1>

          <div className="confirm__ref">
            <span className="confirm__ref-label">Reference</span>
            <strong className="confirm__ref-code">{referenceCode}</strong>
          </div>

          <div className="confirm__details">
            <div className="confirm__row">
              <span className="confirm__key">What</span>
              <span className="confirm__val">
                {selectedItem?.label || selectedPack?.name} &middot; {livePrice}
              </span>
            </div>
            {form.date && (
              <div className="confirm__row">
                <span className="confirm__key">When</span>
                <span className="confirm__val">
                  {formatDate(form.date)} at {form.time}
                  <br />
                  Arrive five minutes early if this is your first visit.
                </span>
              </div>
            )}
            <div className="confirm__row">
              <span className="confirm__key">Where</span>
              <span className="confirm__val">
                {SITE_CONFIG.address.street}, {SITE_CONFIG.address.neighborhood}
                <br />
                Plus Code {SITE_CONFIG.address.plusCode} &middot;{" "}
                {SITE_CONFIG.address.parking}
              </span>
            </div>
            <div className="confirm__row">
              <span className="confirm__key">Paid with</span>
              <span className="confirm__val">
                {PAYMENT_METHODS.find((p) => p.id === form.payment)?.label}
              </span>
            </div>
            <div className="confirm__row">
              <span className="confirm__key">Changing it</span>
              <span className="confirm__val">
                Cancel or move it free of charge up to four hours before.
                Message us on{" "}
                <a
                  href={`https://wa.me/${SITE_CONFIG.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>{" "}
                or call{" "}
                <a
                  href={`tel:${SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, "")}`}
                >
                  {SITE_CONFIG.contact.phone}
                </a>
                .
              </span>
            </div>
          </div>

          <div className="confirm__actions">
            <button
              type="button"
              className="btn btn--solid"
              onClick={downloadCalendarFile}
            >
              Add to calendar
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => window.print()}
            >
              Print this
            </button>
          </div>

          <p className="confirm__note">
            A confirmation has been sent to <strong>{form.phone}</strong>. We
            will message you again two hours before your session.
          </p>

          <Link className="tlink" href="/">
            Back to the homepage
          </Link>
        </div>
      </main>
    )
  }

  const progress = (step / 3) * 100

  return (
    <main className="book-page surface-paper" id="main-content">
      <div
        className="step-bar"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuetext={`Step ${step} of 3 — ${STEP_TITLES[step - 1]}`}
      >
        <div className="step-bar__fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="book-layout">
        <div className="book-main">
          {}
          {step === 1 && (
            <section aria-labelledby="step1">
              <p className="label">Step 1 of 3</p>
              <h1 id="step1" className="book-step__title">
                Choose a programme.
              </h1>
              <p className="book-step__context">
                Every session is in a private suite with the door locked from
                the inside. If this is your first visit, thirty minutes is the
                usual place to start.
              </p>

              <div
                className="session-options"
                role="radiogroup"
                aria-label="Programmes"
              >
                {ALL_ITEMS.map((s) => {
                  const isSelected = form.session === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`session-option${
                        isSelected ? " session-option--selected" : ""
                      }`}
                      onClick={() => setForm((f) => ({ ...f, session: s.id }))}
                    >
                      <span className="session-option__main">
                        <span className="session-option__name">{s.label}</span>
                        <span className="session-option__meta">{s.meta}</span>
                      </span>
                      <span className="session-option__price">{s.price}</span>
                    </button>
                  )
                })}
              </div>

              <p className="book-step__aside">
                Coming often?{" "}
                <Link className="tlink" href="/packs">
                  Session packs
                </Link>{" "}
                work out cheaper per visit.
              </p>

              <button
                type="button"
                className="btn btn--solid book-step__next"
                disabled={!form.session}
                onClick={() => setStep(2)}
              >
                Pick a time
              </button>
              {!form.session && (
                <p className="book-step__hint">
                  Choose a programme to continue
                </p>
              )}
            </section>
          )}

          {}
          {step === 2 && (
            <section aria-labelledby="step2">
              <p className="label">Step 2 of 3</p>
              <h1 id="step2" className="book-step__title">
                Pick a day and a time.
              </h1>

              {selectedItem && (
                <div className="book-summary">
                  <span>
                    <strong>{selectedItem.label}</strong>
                    <span className="book-summary__when">
                      {selectedItem.meta}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="book-summary__change"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="schedule">
                <div>
                  <div className="cal__nav">
                    <button
                      type="button"
                      disabled={monthOffset <= 0}
                      onClick={() => setMonthOffset((o) => o - 1)}
                      className="cal__nav-btn"
                      aria-label="Previous month"
                    >
                      &larr;
                    </button>
                    <h2 className="cal__month">{monthName}</h2>
                    <button
                      type="button"
                      disabled={monthOffset >= 2}
                      onClick={() => setMonthOffset((o) => o + 1)}
                      className="cal__nav-btn"
                      aria-label="Next month"
                    >
                      &rarr;
                    </button>
                  </div>

                  <div className="cal">
                    <div className="cal__header">
                      {DAY_NAMES.map((d) => (
                        <span key={d} className="cal__day-name">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="cal__grid">
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <span key={`e-${i}`} aria-hidden="true" />
                      ))}
                      {daysList.map(({ date, dayNum, disabled, isPast }) => {
                        const selected =
                          form.date?.toDateString() === date.toDateString()
                        return (
                          <button
                            key={date.toISOString()}
                            type="button"
                            className={`cal-day${
                              selected ? " cal-day--selected" : ""
                            }`}
                            disabled={disabled}
                            onClick={() => pickDay(date)}
                            aria-label={`${formatDate(date)}${
                              disabled
                                ? isPast
                                  ? ", in the past"
                                  : ", fully booked"
                                : ""
                            }`}
                          >
                            {dayNum}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <p className="book-step__hint">
                    Struck-through days are fully booked. Message us and we will
                    tell you if something opens up.
                  </p>
                </div>

                <div className="schedule__slots" ref={slotsRef}>
                  {!form.date && (
                    <p className="schedule__empty">
                      Choose a day to see free suites.
                    </p>
                  )}

                  {form.date &&
                    TIME_GROUPS.map((group) => (
                      <div key={group.label}>
                        <h3 className="slot-group__label">
                          {group.label}
                          {group.offPeak && (
                            <span className="slot-group__tag">&minus;20%</span>
                          )}
                        </h3>
                        <div
                          className="time-slots"
                          role="radiogroup"
                          aria-label={group.label}
                        >
                          {group.slots.map((t) => {
                            const soldOut = t === "17:30" || t === "10:00"
                            const isSelected = form.time === t
                            return (
                              <button
                                key={t}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                className={`time-slot${
                                  isSelected ? " time-slot--selected" : ""
                                }`}
                                disabled={soldOut}
                                onClick={() =>
                                  setForm((f) => ({ ...f, time: t }))
                                }
                                aria-label={`${t}${
                                  soldOut ? ", fully booked" : ""
                                }`}
                              >
                                {t}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="book-step__nav">
                <button
                  type="button"
                  className="tlink"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn--solid"
                  disabled={!form.date || !form.time}
                  onClick={() => setStep(3)}
                >
                  Your details
                </button>
              </div>
            </section>
          )}

          {}
          {step === 3 && (
            <section aria-labelledby="step3">
              <p className="label">Step 3 of 3</p>
              <h1 id="step3" className="book-step__title">
                Your details.
              </h1>

              <form className="book-form" onSubmit={submit} noValidate>
                <div className="field">
                  <label className="field__label" htmlFor="b-name">
                    Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="b-name"
                    name="name"
                    className={`field__input${
                      errors.name ? " field__input--error" : ""
                    }`}
                    type="text"
                    required
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-err" : undefined}
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  {errors.name && (
                    <span id="name-err" className="field__error" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="b-phone">
                    Phone number <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="b-phone"
                    name="phone"
                    className={`field__input${
                      errors.phone ? " field__input--error" : ""
                    }`}
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+250 7.."
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-err" : "phone-hint"}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                  {errors.phone ? (
                    <span id="phone-err" className="field__error" role="alert">
                      {errors.phone}
                    </span>
                  ) : (
                    <span id="phone-hint" className="field__hint">
                      Your confirmation and reminder come here, by SMS and
                      WhatsApp.
                    </span>
                  )}
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="b-email">
                    Email <span className="field__optional">(optional)</span>
                  </label>
                  <input
                    id="b-email"
                    name="email"
                    className="field__input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="b-notes">
                    Anything we should know{" "}
                    <span className="field__optional">(optional)</span>
                  </label>
                  <textarea
                    id="b-notes"
                    name="notes"
                    className="field__input field__textarea"
                    rows={3}
                    placeholder="Back or neck problems, first visit, preferred intensity…"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>

                <fieldset className="pay">
                  <legend className="field__label">
                    How would you like to pay? <span aria-hidden="true">*</span>
                  </legend>
                  <div
                    className="pay__options"
                    role="radiogroup"
                    aria-label="Payment method"
                  >
                    {PAYMENT_METHODS.map((m) => {
                      const isSelected = form.payment === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`pay__option${
                            isSelected ? " pay__option--selected" : ""
                          }`}
                          onClick={() =>
                            setForm((f) => ({ ...f, payment: m.id }))
                          }
                        >
                          <span className="pay__name">{m.label}</span>
                          <span className="pay__hint">{m.hint}</span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.payment && (
                    <span className="field__error" role="alert">
                      {errors.payment}
                    </span>
                  )}
                </fieldset>

                <div className="field field--check">
                  <label className="field__check-label" htmlFor="b-agreed">
                    <input
                      id="b-agreed"
                      type="checkbox"
                      checked={form.agreed}
                      aria-invalid={!!errors.agreed}
                      aria-describedby={
                        errors.agreed ? "agreed-err" : undefined
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agreed: e.target.checked }))
                      }
                    />
                    <span>
                      I understand the suite is paid for now, and that I can
                      cancel or move it free of charge up to four hours
                      beforehand.
                    </span>
                  </label>
                  {errors.agreed && (
                    <span id="agreed-err" className="field__error" role="alert">
                      {errors.agreed}
                    </span>
                  )}
                </div>

                <div className="book-step__nav">
                  <button
                    type="button"
                    className="tlink"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn btn--solid">
                    Pay {livePrice} and book
                  </button>
                </div>
                {}
                <p className="pay-reassure">
                  Free cancellation up to four hours before your session. We
                  refund in full, to the method you paid with.
                </p>
              </form>
            </section>
          )}
        </div>

        {}
        <aside className="book-rail" aria-label="Your booking">
          <div className="book-rail__media">
            <Figure
              {...IMAGES.timberRoom}
              sizes="(min-width: 1000px) 34vw, 100vw"
            />
          </div>
          <div className="book-rail__body">
            <h2 className="book-rail__title">Your booking</h2>
            <div className="book-rail__rows">
              <div className="book-rail__row">
                <span className="book-rail__k">Programme</span>
                <span className="book-rail__v">
                  {selectedItem?.label ||
                    selectedPack?.name ||
                    "Not chosen yet"}
                </span>
              </div>
              <div className="book-rail__row">
                <span className="book-rail__k">When</span>
                <span className="book-rail__v book-rail__v--num">
                  {form.date
                    ? `${formatDate(form.date)}${
                        form.time ? `, ${form.time}` : ""
                      }`
                    : "—"}
                </span>
              </div>
              <div className="book-rail__row">
                <span className="book-rail__k">Where</span>
                <span className="book-rail__v">
                  {SITE_CONFIG.address.neighborhood}, {SITE_CONFIG.address.city}
                </span>
              </div>
            </div>

            <div className="book-rail__total">
              <span className="book-rail__total-k">Total</span>
              <span className="book-rail__total-v">{livePrice || "—"}</span>
            </div>

            <ul className="book-rail__promises">
              <li>Nobody touches you. The chair is fully automated.</li>
              <li>The suite is private and locks from the inside.</li>
              <li>Fresh covers and a disinfected room before you enter.</li>
              <li>Cancel free up to four hours before.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
