"use client"

/* Three steps — programme, day & time, pay — with a sticky summary that
   fills in as you go, and a confirmation state. Gold marks machine data
   (prices, slot times), never the primary button. */

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "@/components/Link"
import { SESSIONS, OFF_PEAK } from "@/data/sessions"
import { SITE_CONFIG } from "@/data/site"

const DAYS = [
  { dow: "Mon", date: "14" },
  { dow: "Tue", date: "15" },
  { dow: "Wed", date: "16" },
  { dow: "Thu", date: "17" },
  { dow: "Fri", date: "18" },
  { dow: "Sat", date: "19" },
  { dow: "Sun", date: "20" },
]

/* Slot availability is mock data until the booking system is wired up. */
const SLOTS = [
  { time: "10:00", note: "quiet", taken: false },
  { time: "10:45", note: "quiet", taken: false },
  { time: "11:30", note: "quiet", taken: true },
  { time: "12:15", note: "quiet", taken: false },
  { time: "13:00", note: "quiet", taken: false },
  { time: "14:30", note: "quiet", taken: false },
  { time: "15:15", note: "quiet", taken: true },
  { time: "16:00", note: "", taken: false },
  { time: "17:00", note: "", taken: false },
  { time: "17:45", note: "", taken: true },
  { time: "18:30", note: "", taken: false },
  { time: "19:15", note: "", taken: false },
  { time: "20:00", note: "last", taken: false },
]

export default function BookingFlow() {
  const params = useSearchParams()
  const initial = SESSIONS.find((s) => s.id === params.get("session"))?.id ?? "half"

  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState(initial)
  const [dayIdx, setDayIdx] = useState(3)
  const [slot, setSlot] = useState("18:30")
  const [pay, setPay] = useState(SITE_CONFIG.payments.methods[0])

  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[1]
  const day = DAYS[dayIdx]
  const offPeak = SLOTS.find((s) => s.time === slot)?.note === "quiet"
  const total = offPeak ? session.offPeakPrice : session.price
  const ref = `AMR-8${1200 + dayIdx * 7 + session.durationMinutes}`

  const steps = [
    { n: 1, num: "01", label: "Programme" },
    { n: 2, num: "02", label: "Day & time" },
    { n: 3, num: "03", label: "Pay" },
  ]

  return (
    <main id="main-content" className="surface-deep" style={{ minHeight: "calc(100vh - var(--nav-h))" }}>
      <div className="wrap" style={{ paddingBlock: "clamp(40px, 6vw, 72px) clamp(64px, 9vw, 112px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--s-rule)", paddingBottom: 20 }}>
          <h1 className="h1">Book a chair</h1>
          <div className="book__steps">
            {steps.map((s) => (
              <button
                key={s.n}
                className="book__step"
                data-state={step === s.n ? "current" : step > s.n ? "done" : "todo"}
                onClick={() => step !== 4 && setStep(s.n)}
              >
                {s.num} {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="book">
          <div className="book__main stack" style={{ gap: 24 }}>
            {step === 1 && (
              <>
                <h2 className="h2">Which programme?</h2>
                {SESSIONS.map((s) => (
                  <button key={s.id} className="choice" aria-pressed={s.id === sessionId} onClick={() => setSessionId(s.id)}>
                    <span className="stack--tight">
                      <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 26 }}>{s.name}</span>
                      <span className="meta">{s.tagline}</span>
                    </span>
                    <span className="stack--tight" style={{ alignItems: "flex-end", gap: 4 }}>
                      <span className="data" style={{ fontSize: 19 }}>{s.price}</span>
                      <span className="data" style={{ fontSize: 11, color: "var(--s-meta)" }}>{s.duration}</span>
                    </span>
                  </button>
                ))}
                <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setStep(2)}>
                  Choose a time &rarr;
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="h2">Which day and time?</h2>
                <div className="days">
                  {DAYS.map((d, i) => (
                    <button key={d.date} className="day" aria-pressed={i === dayIdx} onClick={() => setDayIdx(i)}>
                      <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75 }}>{d.dow}</span>
                      <span style={{ fontSize: 17 }}>{d.date}</span>
                    </button>
                  ))}
                </div>
                <div className="stack" style={{ gap: 14, borderTop: "1px solid var(--s-rule)", paddingTop: 22 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", alignItems: "baseline" }}>
                    <p className="label">Available suites · {day.dow.toUpperCase()} {day.date} SEP</p>
                    <p className="data">{OFF_PEAK.label.toUpperCase()} {OFF_PEAK.window} · −20%</p>
                  </div>
                  <div className="slots">
                    {SLOTS.map((t) => (
                      <button key={t.time} className="slot" aria-pressed={t.time === slot} disabled={t.taken} onClick={() => setSlot(t.time)}>
                        <span style={{ fontSize: 15 }}>{t.time}</span>
                        <span className="slot__note">{t.taken ? "taken" : t.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <button className="btn btn--outline" onClick={() => setStep(1)}>&larr; Back</button>
                  <button className="btn" onClick={() => setStep(3)}>Pay and confirm &rarr;</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="h2">Who is coming, and how are you paying?</h2>
                <div className="grid-3" style={{ gap: 16 }}>
                  <label className="field">
                    <span className="label">Your name</span>
                    <input type="text" placeholder="Full name" />
                  </label>
                  <label className="field">
                    <span className="label">Phone (your booking record)</span>
                    <input type="tel" placeholder="+250 7…" />
                  </label>
                </div>
                <div className="stack" style={{ gap: 12, borderTop: "1px solid var(--s-rule)", paddingTop: 22 }}>
                  <p className="label">Payment</p>
                  {SITE_CONFIG.payments.methods.map((m) => (
                    <button key={m} className="choice" aria-pressed={pay === m} onClick={() => setPay(m)} style={{ minHeight: 56, padding: "18px 20px" }}>
                      <span>{m}</span>
                      {pay === m && <span className="data">SELECTED</span>}
                    </button>
                  ))}
                </div>
                <p className="meta" style={{ maxWidth: "56ch" }}>{SITE_CONFIG.payments.note}</p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <button className="btn btn--outline" onClick={() => setStep(2)}>&larr; Back</button>
                  <button className="btn" onClick={() => setStep(4)}>Confirm · {total}</button>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="stack rise" style={{ gap: 20 }}>
                <p className="label">Confirmed · {ref}</p>
                <h2 className="h1" style={{ maxWidth: "24ch" }}>The suite is yours. The door locks from the inside.</h2>
                <p className="body">
                  We have sent the details by WhatsApp. Come five minutes early on your first
                  visit — there is nothing to fill in at the door.
                </p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <Link className="btn" href="/account">See my bookings</Link>
                  <button className="btn btn--outline" onClick={() => setStep(1)}>Book another</button>
                </div>
              </div>
            )}
          </div>

          <aside className="book__aside">
            <p className="label">Your booking</p>
            <h3 className="h2" style={{ fontSize: 29 }}>{session.name}</h3>
            <dl className="stack--tight" style={{ margin: 0, borderTop: "1px solid var(--s-rule)", paddingTop: 16 }}>
              <div className="summary__row"><dt>DURATION</dt><dd>{session.duration}</dd></div>
              <div className="summary__row"><dt>DAY</dt><dd>{day.dow.toUpperCase()} {day.date} SEP</dd></div>
              <div className="summary__row"><dt>TIME</dt><dd>{slot}</dd></div>
              <div className="summary__row"><dt>SUITE</dt><dd>PRIVATE · 1 PERSON</dd></div>
              <div className="summary__row"><dt>TURNOVER</dt><dd>+15 MIN RESERVED</dd></div>
            </dl>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, borderTop: "1px solid var(--s-rule-2)", paddingTop: 16 }}>
              <span className="label">Total</span>
              <span className="data--lg">{total}</span>
            </div>
            {offPeak && <p className="label">Quiet-hours rate applied · −20%</p>}
            <p className="meta">{SITE_CONFIG.address.full} · {SITE_CONFIG.address.plusCode}. {SITE_CONFIG.address.parking}.</p>
          </aside>
        </div>
      </div>
    </main>
  )
}
