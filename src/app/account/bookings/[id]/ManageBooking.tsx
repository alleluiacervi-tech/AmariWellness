"use client"

/**
 * Cancel or move one booking, from the client's own account (Phase 1.5).
 * What's offered follows the policy the server worked out — and every
 * action re-checks it with the booking row locked (see
 * `src/server/booking/clientChanges.ts`), so this component only
 * decides what to show, never what's allowed.
 */

import { useActionState, useEffect, useState, useTransition } from "react"
import { cancelMyBookingAction, rescheduleMyBookingAction, type ChangeState } from "@/server/booking/accountActions"
import { getSlotsAction } from "@/server/booking/actions"
import type { Slot } from "@/server/availability/slots"
import { formatRwf } from "@/lib/kigaliTime"

type Policy = { kind: "free" | "late"; freeUntilLabel: string } | { kind: "desk" } | { kind: "closed" }

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" })

export default function ManageBooking({
  bookingId,
  sessionTypeId,
  policy,
  refundableRwf,
  cancellationWindowHours,
  whatsapp,
}: {
  bookingId: string
  sessionTypeId: string
  policy: Policy
  refundableRwf: number
  cancellationWindowHours: number
  whatsapp: string
}) {
  const [mode, setMode] = useState<"idle" | "move" | "cancel">("idle")
  const [cancelState, cancelAction, cancelPending] = useActionState<ChangeState, FormData>(cancelMyBookingAction, {})
  const [moveState, moveAction, movePending] = useActionState<ChangeState, FormData>(rescheduleMyBookingAction, {})

  if (cancelState.done === "cancelled") {
    return (
      <p className="lead" role="status">
        {cancelState.refundedRwf
          ? `Cancelled. ${formatRwf(cancelState.refundedRwf)} is on its way back to the account you paid from.`
          : cancelState.late
            ? "Cancelled. As it was inside the cancellation window, the session isn't refunded."
            : "Cancelled."}
      </p>
    )
  }

  if (policy.kind === "closed") return null

  if (policy.kind === "desk") {
    return (
      <p className="body">
        This booking was made at reception, so it&rsquo;s changed there too.{" "}
        <a className="tlink" href={`https://wa.me/${whatsapp}`}>
          Message us on WhatsApp
        </a>
        .
      </p>
    )
  }

  return (
    <div className="stack">
      {moveState.done === "moved" && (
        <p className="lead" role="status">
          Moved. The new time is above, and a confirmation is on its way. Your QR code stays the same.
        </p>
      )}
      <p className="body">
        {policy.kind === "free"
          ? `Free to move or cancel until ${policy.freeUntilLabel}.`
          : `Your session starts in under ${cancellationWindowHours} hours, so it can no longer be moved, and cancelling forfeits it.`}
      </p>

      {mode === "idle" && (
        <div className="cluster">
          {policy.kind === "free" && (
            <button className="btn" type="button" onClick={() => setMode("move")}>
              Move to another time
            </button>
          )}
          <button className="btn btn--outline" type="button" onClick={() => setMode("cancel")}>
            Cancel booking
          </button>
        </div>
      )}

      {mode === "cancel" && (
        <form action={cancelAction} className="form-card">
          <input type="hidden" name="bookingId" value={bookingId} />
          <p className="body">
            {policy.kind === "free"
              ? refundableRwf > 0
                ? `Cancel, and get ${formatRwf(refundableRwf)} back?`
                : "Cancel this booking?"
              : "Cancel without a refund? The session is forfeited."}
          </p>
          {cancelState.error && (
            <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
              {cancelState.error}
            </p>
          )}
          <div className="cluster">
            <button className="btn" type="submit" disabled={cancelPending}>
              {cancelPending ? "Cancelling…" : policy.kind === "free" ? "Yes, cancel" : "Yes, cancel without refund"}
            </button>
            <button className="btn btn--outline" type="button" onClick={() => setMode("idle")}>
              Keep it
            </button>
          </div>
        </form>
      )}

      {mode === "move" && policy.kind === "free" && (
        <MoveForm
          bookingId={bookingId}
          sessionTypeId={sessionTypeId}
          action={moveAction}
          pending={movePending}
          error={moveState.error}
          onClose={() => setMode("idle")}
          done={moveState.done === "moved"}
        />
      )}
    </div>
  )
}

function MoveForm({
  bookingId,
  sessionTypeId,
  action,
  pending,
  error,
  onClose,
  done,
}: {
  bookingId: string
  sessionTypeId: string
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  onClose: () => void
  done: boolean
}) {
  const [days, setDays] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, startLoading] = useTransition()

  // The same days the booking page offers: the next seven, from tomorrow, in Kigali.
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

  useEffect(() => {
    if (!date) return
    setSlot("")
    startLoading(async () => setSlots(await getSlotsAction(date, sessionTypeId)))
  }, [date, sessionTypeId])

  useEffect(() => {
    if (done) onClose()
  }, [done, onClose])

  return (
    <form action={action} className="form-card">
      <input type="hidden" name="bookingId" value={bookingId} />
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
        {loading ? (
          <p className="meta">Checking availability…</p>
        ) : slots.length === 0 ? (
          <p className="meta">Nothing available this day — try another.</p>
        ) : (
          <div className="slots">
            {slots.map((s) => (
              <label className="slot" key={s.time} data-taken={!s.available || undefined}>
                <input
                  type="radio"
                  name="time"
                  value={s.time}
                  checked={slot === s.time}
                  disabled={!s.available}
                  onChange={() => setSlot(s.time)}
                />
                <span>{s.time}</span>
                {!s.available ? <span className="slot__note">Taken</span> : s.quietHours && <span className="slot__note">Quiet hours</span>}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {error}
        </p>
      )}
      <div className="cluster">
        <button className="btn" type="submit" disabled={!date || !slot || pending}>
          {pending ? "Moving…" : "Move my booking"}
        </button>
        <button className="btn btn--outline" type="button" onClick={onClose}>
          Keep the current time
        </button>
      </div>
    </form>
  )
}
