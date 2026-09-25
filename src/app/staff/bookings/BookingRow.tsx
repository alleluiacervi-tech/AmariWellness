"use client"

import { useActionState } from "react"
import {
  applyDiscountAction,
  cancelBooking,
  refundBookingAction,
  type ActionState,
} from "@/server/admin/bookingActions"
import { checkInAction, type CheckInState } from "@/server/admin/floorActions"
import type { StaffBookingRow } from "@/server/availability/bookingsForStaff"
import { bookingReference } from "@/lib/booking"

const initial: ActionState = {}

const STATUS_LABELS: Record<StaffBookingRow["status"], string> = {
  held: "Held",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kigali" })
}

const CHANNEL_LABELS = { email: "Email", whatsapp: "WhatsApp" } as const
const TEMPLATE_LABELS = {
  booking_confirmed: "confirmation",
  booking_rescheduled: "new time",
  booking_cancelled: "cancellation",
  reminder_24h: "24-hour reminder",
  reminder_2h: "2-hour reminder",
} as const

function formatRWF(amount: number) {
  return `${amount.toLocaleString("en-RW")} RWF`
}

export default function BookingRow({
  booking,
  canCancel,
  canRefund,
  canDiscount,
  canCheckIn,
}: {
  booking: StaffBookingRow
  canCancel: boolean
  canRefund: boolean
  canDiscount: boolean
  canCheckIn: boolean
}) {
  const [checkInState, checkInFormAction, checkInPending] = useActionState<CheckInState, FormData>(checkInAction, {})
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelBooking, initial)
  const [refundState, refundAction, refundPending] = useActionState(refundBookingAction, initial)
  const [discountState, discountAction, discountPending] = useActionState(applyDiscountAction, initial)

  const isVoidable = booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show"
  const isRefundable = booking.status === "confirmed" && booking.paymentStatus === "succeeded"
  const isDiscountable = booking.status === "confirmed" || booking.status === "checked_in" || booking.status === "completed"

  return (
    <li className="form-card" aria-labelledby={`booking-${booking.id}-title`}>
      <div className="cluster justify-between">
        <div className="stack--tight">
          <span className="h4" id={`booking-${booking.id}-title`}>
            {formatTime(booking.startAt)} · {booking.sessionName}
          </span>
          <span className="meta">
            {booking.suiteName} — {booking.clientName}
            {booking.clientPhone ? ` (${booking.clientPhone})` : ""}
          </span>
          <span className="meta font-mono">
            {formatRWF(booking.priceAtBookingRwf)}
            {booking.paymentStatus ? ` — payment ${booking.paymentStatus}` : ""}
          </span>
          <span className="meta font-mono">{bookingReference(booking.id)}</span>
          {booking.lastMessages.length > 0 && (
            <span className="meta">
              {booking.lastMessages
                .map((m) => `${CHANNEL_LABELS[m.channel]} ${TEMPLATE_LABELS[m.template]} ${m.status === "sent" ? "sent" : "FAILED"}`)
                .join(", ")}
            </span>
          )}
        </div>
        <span className="tag">{STATUS_LABELS[booking.status]}</span>
      </div>

      <div className="cluster items-start">
        {canCheckIn && booking.status === "confirmed" && (
          <form action={checkInFormAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <button className="btn btn--sm" type="submit" disabled={checkInPending}>
              {checkInPending ? "Checking in…" : "Check in"}
            </button>
          </form>
        )}
        {canCancel && isVoidable && (
          <form className="cluster items-start" action={cancelAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input className="input max-w-48" name="reason" placeholder="Reason" required maxLength={300} />
            <button className="btn btn--outline btn--sm" type="submit" disabled={cancelPending}>
              {cancelPending ? "Cancelling…" : "Cancel"}
            </button>
          </form>
        )}
        {canRefund && isRefundable && (
          <form className="cluster items-start" action={refundAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input
              className="input input--mono max-w-28"
              name="amountRwf"
              type="number"
              min={1}
              max={booking.paymentAmountRwf ?? booking.priceAtBookingRwf}
              defaultValue={booking.paymentAmountRwf ?? booking.priceAtBookingRwf}
              required
            />
            <input className="input max-w-48" name="reason" placeholder="Reason" required maxLength={300} />
            <button className="btn btn--outline btn--sm" type="submit" disabled={refundPending}>
              {refundPending ? "Refunding…" : "Refund"}
            </button>
          </form>
        )}
        {canDiscount && isDiscountable && (
          <form className="cluster items-start" action={discountAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <input className="input input--mono max-w-28" name="amountRwf" type="number" min={1} required />
            <input className="input max-w-48" name="reason" placeholder="Reason" required maxLength={300} />
            <button className="btn btn--outline btn--sm" type="submit" disabled={discountPending}>
              {discountPending ? "Applying…" : "Discount"}
            </button>
          </form>
        )}
      </div>

      {checkInState.result && !checkInState.result.ok && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {checkInState.result.message}
        </p>
      )}
      {checkInState.result?.ok && <p className="small">Checked in to {checkInState.result.preview.suiteName}.</p>}
      {cancelState.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {cancelState.error}
        </p>
      )}
      {refundState.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {refundState.error}
        </p>
      )}
      {discountState.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {discountState.error}
        </p>
      )}
      {(cancelState.ok || refundState.ok || discountState.ok) && <p className="small">Done.</p>}
    </li>
  )
}
