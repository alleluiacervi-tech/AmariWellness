"use client"

import { useActionState } from "react"
import { createWalkInBooking, type ActionState } from "@/server/admin/bookingActions"
import type { SessionItem } from "@/server/db/content"

const initial: ActionState = {}

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "momo", label: "MTN MoMo" },
  { value: "airtel", label: "Airtel Money" },
  { value: "card", label: "Card" },
  { value: "other", label: "Cash / other" },
]

export default function NewWalkInForm({ sessions, date }: { sessions: SessionItem[]; date: string }) {
  const [state, formAction, pending] = useActionState(createWalkInBooking, initial)

  return (
    <form className="stack" action={formAction}>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">Session</span>
          <select className="input" name="sessionTypeId" required defaultValue="">
            <option value="" disabled>
              Choose a session
            </option>
            {sessions.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.name} · {s.duration} · {s.price}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input input--mono" name="date" type="date" defaultValue={date} required />
        </label>
        <label className="field">
          <span className="field__label">Time</span>
          <input className="input input--mono" name="time" type="time" required />
        </label>
        <label className="field">
          <span className="field__label">Client name</span>
          <input className="input" name="clientName" required maxLength={80} placeholder="e.g. Alex Guest" />
        </label>
        <label className="field">
          <span className="field__label">Client phone (optional)</span>
          <input className="input input--mono" name="clientPhone" type="tel" maxLength={20} placeholder="+250 7__ ___ ___" />
        </label>
        <label className="field">
          <span className="field__label">Payment method</span>
          <select className="input" name="paymentMethod" required defaultValue="">
            <option value="" disabled>
              Choose a method
            </option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="cluster items-start">
        <input type="checkbox" name="healthAck" />
        <span className="small">
          I&rsquo;ve asked the health questions (pregnancy, pacemaker, recent surgery, spinal injury) and there&rsquo;s no
          concern.
        </span>
      </label>
      <label className="cluster items-start">
        <input type="checkbox" name="checkInNow" defaultChecked />
        <span className="small">They&rsquo;re here now: check them in as soon as it&rsquo;s booked.</span>
      </label>
      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="small" role="status">
          {state.notice ?? "Booked."}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Booking…" : "Book & mark paid"}
      </button>
    </form>
  )
}
