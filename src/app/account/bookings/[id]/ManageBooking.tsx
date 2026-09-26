"use client"

/**
 * Cancel or move one booking, from the client's own account (Phase 1.5).
 * What's offered follows the policy the server worked out — and every
 * action re-checks it with the booking row locked (see
 * `src/server/booking/clientChanges.ts`), so this component only
 * decides what to show, never what's allowed.
 */

import { useActionState, useEffect, useState, useTransition } from "react"
import {
  cancelMyBookingAction,
  getMoveSlotsAction,
  rescheduleMyBookingAction,
  type ChangeState,
  type MoveSlots,
} from "@/server/booking/accountActions"
import { bookableDates, formatISODate, formatRwf } from "@/lib/kigaliTime"

type Policy = { kind: "free" | "late"; freeUntilLabel: string } | { kind: "desk" } | { kind: "closed" }

export default function ManageBooking({
  bookingId,
  current,
  policy,
  refundableRwf,
  cancellationWindowHours,
  whatsapp,
}: {
  bookingId: string
  /** The booking's current Kigali date and time, which the move form marks as "your time". */
  current: { date: string; time: string }
  policy: Policy
  refundableRwf: number
  cancellationWindowHours: number
  whatsapp: string
}) {
  const [mode, setMode] = useState<"idle" | "move" | "cancel">("idle")
  const [moved, setMoved] = useState(false)
  const [cancelState, cancelAction, cancelPending] = useActionState<ChangeState, FormData>(cancelMyBookingAction, {})

  function open(next: "move" | "cancel") {
    setMoved(false)
    setMode(next)
  }

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
      {moved && (
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
            <button className="btn" type="button" onClick={() => open("move")}>
              Move to another time
            </button>
          )}
          <button className="btn btn--outline" type="button" onClick={() => open("cancel")}>
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
          current={current}
          onClose={() => setMode("idle")}
          onMoved={() => {
            setMoved(true)
            setMode("idle")
          }}
        />
      )}
    </div>
  )
}

/**
 * Mounted fresh each time "Move to another time" is opened, so its
 * form state (and a previous move's success) never carries over.
 */
function MoveForm({
  bookingId,
  current,
  onClose,
  onMoved,
}: {
  bookingId: string
  current: { date: string; time: string }
  onClose: () => void
  onMoved: () => void
}) {
  const [state, action, pending] = useActionState<ChangeState, FormData>(rescheduleMyBookingAction, {})
  // Only ever rendered after a tap, never on the server, so reading the clock here can't cause a hydration mismatch.
  const [days] = useState(() => bookableDates(new Date()))
  const [date, setDate] = useState(days[0])
  const [slot, setSlot] = useState("")
  const [moveSlots, setMoveSlots] = useState<MoveSlots>({ slots: [], quietHoursOnly: false })
  const [loading, startLoading] = useTransition()

  useEffect(() => {
    setSlot("")
    startLoading(async () => setMoveSlots(await getMoveSlotsAction(bookingId, date)))
  }, [bookingId, date])

  useEffect(() => {
    if (state.done === "moved") onMoved()
  }, [state, onMoved])

  const { slots, quietHoursOnly } = moveSlots

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
        {quietHoursOnly && (
          <p className="meta">You booked at the quiet-hours price, so you can move to another quiet-hours time.</p>
        )}
        {loading ? (
          <p className="meta">Checking availability…</p>
        ) : slots.length === 0 ? (
          <p className="meta">Nothing available this day — try another.</p>
        ) : (
          <div className="slots">
            {slots.map((s) => {
              const yours = date === current.date && s.time === current.time
              const peak = quietHoursOnly && !s.quietHours
              const note = yours ? "Your time" : !s.available ? "Taken" : peak ? "Peak hours" : s.quietHours ? "Quiet hours" : null
              const disabled = yours || !s.available || peak
              return (
                <label className="slot" key={s.time} data-taken={disabled || undefined}>
                  <input
                    type="radio"
                    name="time"
                    value={s.time}
                    checked={slot === s.time}
                    disabled={disabled}
                    onChange={() => setSlot(s.time)}
                  />
                  <span>{s.time}</span>
                  {note && <span className="slot__note">{note}</span>}
                </label>
              )
            })}
          </div>
        )}
      </fieldset>
      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
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
