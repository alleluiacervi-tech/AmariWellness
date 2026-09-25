// No `server-only` guard, deliberately — takes `db` and `now` as
// parameters so the cancellation policy is tested directly against a
// real Postgres (see `src/server/availability/conflicts.ts`). The
// Server Actions in `accountActions.ts` are the only real callers.
import { and, eq } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings } from "../db/schema"
import { pickAvailableSuite, suiteHasConflict } from "../availability/conflicts"
import { SlotTakenError } from "../availability/createHold"
import { netKeptForBooking, refundInTransaction } from "../ledger/refund"

export class BookingChangeError extends Error {}

/**
 * What a client may do with one of their own bookings, from the draft
 * policy (docs/phase-0-decisions.md §2) the site already promises:
 *
 * - `free`: at least `cancellationWindowHours` before the start — cancel
 *   with a full refund of what's still held, or move to another time.
 * - `late`: inside that window — cancel only, and the session is
 *   forfeited. Moving is no longer offered.
 * - `desk`: booked at reception (a walk-in or phone booking, often paid
 *   in cash) — changed at the desk, where a cash refund can be handed
 *   back, not online.
 * - `closed`: not an upcoming confirmed booking any more.
 */
export type ChangePolicy = { kind: "free" | "late"; freeUntil: Date } | { kind: "desk" } | { kind: "closed" }

export function changePolicy(
  booking: { status: string; startAt: Date; source: string },
  cancellationWindowHours: number,
  now: Date,
): ChangePolicy {
  if (booking.status !== "confirmed" || booking.startAt <= now) return { kind: "closed" }
  if (booking.source !== "online") return { kind: "desk" }
  const freeUntil = new Date(booking.startAt.getTime() - cancellationWindowHours * 60 * 60 * 1000)
  return { kind: now <= freeUntil ? "free" : "late", freeUntil }
}

type OwnedBookingInput = { bookingId: string; clientId: string; cancellationWindowHours: number; now?: Date }

/**
 * A client cancelling their own booking. Everything happens with the
 * booking row locked (`FOR UPDATE`), so the policy decision and the
 * change it justifies can't be split by a check-in, a no-show sweep or a
 * second click landing in between.
 *
 * Inside the free window, the refund is whatever is still held for the
 * booking (the payment less any discount), written through the same
 * `refundInTransaction` staff refunds use — a negative `refund` ledger
 * entry, never an edit. Inside the late window, the booking is cancelled
 * and the money stays exactly as it is.
 */
export async function cancelByClient(db: Database, input: OwnedBookingInput): Promise<{ refundedRwf: number; late: boolean }> {
  const now = input.now ?? new Date()
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.clientId, input.clientId)))
      .for("update")
    if (!booking) throw new BookingChangeError("Booking not found.")

    const policy = changePolicy(booking, input.cancellationWindowHours, now)
    if (policy.kind === "closed") throw new BookingChangeError("This booking can no longer be changed.")
    if (policy.kind === "desk") throw new BookingChangeError("This booking was made at reception — contact us to change it.")

    if (policy.kind === "free") {
      const held = await netKeptForBooking(tx, booking.id)
      if (held > 0) {
        await refundInTransaction(tx, {
          bookingId: booking.id,
          amountRwf: held,
          reason: `Cancelled by the client at least ${input.cancellationWindowHours} hours before the start`,
          staffUserId: null,
        })
        return { refundedRwf: held, late: false }
      }
    }

    await tx
      .update(bookings)
      .set({
        status: "cancelled",
        cancelReason:
          policy.kind === "late"
            ? `Cancelled by the client within ${input.cancellationWindowHours} hours of the start; session forfeited`
            : "Cancelled by the client",
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id))
    return { refundedRwf: 0, late: policy.kind === "late" }
  })
}

/**
 * A client moving their own booking to another time, free of charge,
 * while it's still in the free window. The new slot keeps the price
 * already paid, so it may not cost more at today's prices than that
 * (moving a quiet-hours booking into peak hours would otherwise be a way
 * round the quiet-hours price); cancelling and rebooking is always open
 * instead. It stays in the same suite when that suite is free, and the
 * `bookings_no_overlap` exclusion constraint has the final word on a
 * race, exactly as for a new booking. Both reminders are re-armed for
 * the new time; the QR code is unchanged.
 */
export async function rescheduleByClient(
  db: Database,
  input: OwnedBookingInput & { newStartAt: Date; newEndAt: Date; newSlotPriceRwf: number },
) {
  const now = input.now ?? new Date()
  if (input.newStartAt <= now) throw new BookingChangeError("Choose a time that hasn't started yet.")

  try {
    return await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.clientId, input.clientId)))
        .for("update")
      if (!booking) throw new BookingChangeError("Booking not found.")

      const policy = changePolicy(booking, input.cancellationWindowHours, now)
      if (policy.kind === "desk") throw new BookingChangeError("This booking was made at reception — contact us to change it.")
      if (policy.kind !== "free") {
        throw new BookingChangeError(`A booking can only be moved up to ${input.cancellationWindowHours} hours before it starts.`)
      }
      if (booking.startAt.getTime() === input.newStartAt.getTime()) throw new BookingChangeError("That's the time you already have.")
      if (input.newSlotPriceRwf > booking.priceAtBookingRwf) {
        throw new BookingChangeError(
          "That time costs more than you paid. Cancel this booking (free of charge) and book the new time instead.",
        )
      }

      const suiteId = (await suiteHasConflict(tx, booking.suiteId, input.newStartAt, input.newEndAt, booking.id))
        ? await pickAvailableSuite(tx, booking.locationId, input.newStartAt, input.newEndAt, booking.id)
        : booking.suiteId
      if (!suiteId) throw new SlotTakenError()

      const [moved] = await tx
        .update(bookings)
        .set({
          startAt: input.newStartAt,
          endAt: input.newEndAt,
          suiteId,
          reminder24hSentAt: null,
          reminder2hSentAt: null,
          updatedAt: now,
        })
        .where(and(eq(bookings.id, booking.id), eq(bookings.status, "confirmed")))
        .returning()
      return { before: booking, after: moved }
    })
  } catch (err) {
    const message = err instanceof Error ? ((err.cause as Error | undefined)?.message ?? err.message) : String(err)
    if (message.includes("bookings_no_overlap")) throw new SlotTakenError()
    throw err
  }
}
