// No `server-only` guard, deliberately — see conflicts.ts's comment.
// The caller (a Server Action) is responsible for `recordActivity`
// afterward, the same separation `src/server/admin/actions.ts` already
// uses — keeps this function pure database logic, directly testable.
import { and, eq } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, ledgerEntries, payments } from "../db/schema"

export class RefundError extends Error {}

/**
 * Refunds a confirmed booking's payment and cancels the booking, freeing
 * its slot. `amountRwf` may be less than what was paid (a partial
 * refund) but never more. The ledger entry's sign is enforced by a
 * database check constraint (migration 0001) as well as here — belt and
 * braces, the same reasoning as every other money rule in this app.
 */
export async function refundBooking(
  db: Database,
  input: { bookingId: string; amountRwf: number; reason: string; staffUserId: string },
) {
  if (input.amountRwf <= 0) throw new RefundError("The refund amount must be greater than zero.")
  if (!input.reason.trim()) throw new RefundError("A reason is required for every refund.")

  return db.transaction(async (tx) => {
    const [bookingRow] = await tx.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1)
    if (!bookingRow) throw new RefundError("Booking not found.")

    const [payment] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.bookingId, bookingRow.id), eq(payments.status, "succeeded")))
      .limit(1)
    if (!payment) throw new RefundError("No successful payment found for this booking.")
    if (input.amountRwf > payment.amountRwf) throw new RefundError("The refund cannot exceed the amount paid.")

    await tx.update(payments).set({ status: "refunded", updatedAt: new Date() }).where(eq(payments.id, payment.id))
    await tx
      .update(bookings)
      .set({
        status: "cancelled",
        cancelReason: input.reason,
        cancelledByStaffId: input.staffUserId,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingRow.id))
    await tx.insert(ledgerEntries).values({
      locationId: bookingRow.locationId,
      type: "refund",
      amountRwf: -input.amountRwf,
      bookingId: bookingRow.id,
      paymentId: payment.id,
      clientId: bookingRow.clientId,
      staffUserId: input.staffUserId,
      reason: input.reason,
    })

    return bookingRow
  })
}
