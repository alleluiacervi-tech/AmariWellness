// No `server-only` guard, deliberately — see conflicts.ts's comment.
// The caller (a Server Action) is responsible for `recordActivity`
// afterward — see refund.ts's comment for the same separation.
import { eq } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, ledgerEntries } from "../db/schema"

export class DiscountError extends Error {}

/**
 * Records a goodwill credit against an already-confirmed booking — "the
 * chair was acting up, knock 1,000 off" — without touching the payment
 * or the booking's own `priceAtBookingRwf` (that field is the price
 * history record of what was actually charged; see catalog.ts). The
 * discount is its own ledger entry instead, the same add-only pattern
 * every other money movement in this app follows.
 */
export async function applyDiscount(
  db: Database,
  input: { bookingId: string; amountRwf: number; reason: string; staffUserId: string },
) {
  if (input.amountRwf <= 0) throw new DiscountError("The discount amount must be greater than zero.")
  if (!input.reason.trim()) throw new DiscountError("A reason is required for every discount.")

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1)
  if (!booking) throw new DiscountError("Booking not found.")
  if (booking.status !== "confirmed" && booking.status !== "checked_in" && booking.status !== "completed") {
    throw new DiscountError("Only a confirmed booking can receive a discount.")
  }

  await db.insert(ledgerEntries).values({
    locationId: booking.locationId,
    type: "discount_applied",
    amountRwf: -input.amountRwf,
    bookingId: booking.id,
    clientId: booking.clientId,
    staffUserId: input.staffUserId,
    reason: input.reason,
  })

  return booking
}
