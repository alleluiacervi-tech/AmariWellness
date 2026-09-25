// No `server-only` guard, deliberately — see conflicts.ts's comment.
// Callers inside Next pass in the real `db`; tests pass `testDb`.
import { and, eq } from "drizzle-orm"
import type { Database, Tx } from "../db/client"
import { bookings, ledgerEntries, payments, type PaymentMethod } from "../db/schema"
import { generateQrToken } from "../qr"

export class BookingNotHeldError extends Error {
  constructor() {
    super("This booking is no longer awaiting payment.")
    this.name = "BookingNotHeldError"
  }
}

export class PaymentNotPendingError extends Error {
  constructor() {
    super("This payment has already been resolved.")
    this.name = "PaymentNotPendingError"
  }
}

/**
 * The one place a booking moves held → confirmed, and the one place a
 * `payment_received` ledger entry is written for a booking. Every
 * confirmation path — the sandbox/online flow's `confirmSandboxPayment`
 * and a staff walk-in's `recordWalkInPayment`, both below — ends here,
 * inside the same transaction as the payment write that justifies it,
 * so "a booking is confirmed only when a payment provider confirms
 * payment" (CLAUDE.md §4) has exactly one code path to audit.
 */
async function finalizeConfirmedBooking(
  tx: Tx,
  bookingId: string,
  payment: { id: string; amountRwf: number; clientId: string | null },
  staffUserId?: string,
) {
  const [booking] = await tx
    .update(bookings)
    .set({ status: "confirmed", qrToken: generateQrToken(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "held")))
    .returning()
  if (!booking) throw new BookingNotHeldError()

  await tx.insert(ledgerEntries).values({
    locationId: booking.locationId,
    type: "payment_received",
    amountRwf: payment.amountRwf,
    bookingId: booking.id,
    paymentId: payment.id,
    clientId: payment.clientId ?? booking.clientId,
    staffUserId: staffUserId ?? null,
  })

  return booking
}

/** The sandbox "pay" step (Phase 1.4b) calls this once it simulates the provider confirming — standing in for a real provider's webhook, which would call the same finalize logic from a signed callback instead. */
export async function confirmSandboxPayment(db: Database, paymentId: string) {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .update(payments)
      .set({ status: "succeeded", updatedAt: new Date() })
      .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")))
      .returning()
    if (!payment) throw new PaymentNotPendingError()
    if (!payment.bookingId) throw new Error("Payment has no associated booking.")
    return finalizeConfirmedBooking(tx, payment.bookingId, payment, undefined)
  })
}

/** A front-desk walk-in: staff already has the cash/card/momo confirmation in hand, so the payment is recorded as succeeded immediately — there's no pending step to wait on. */
export async function recordWalkInPayment(
  db: Database,
  bookingId: string,
  input: { locationId: string; clientId: string; amountRwf: number; method: PaymentMethod },
  staffUserId: string,
) {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        locationId: input.locationId,
        provider: "staff_recorded",
        providerReference: `staff_${bookingId}`,
        bookingId,
        clientId: input.clientId,
        amountRwf: input.amountRwf,
        method: input.method,
        status: "succeeded",
      })
      .returning()
    return finalizeConfirmedBooking(tx, bookingId, payment, staffUserId)
  })
}
