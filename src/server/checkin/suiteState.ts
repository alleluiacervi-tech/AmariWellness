// No `server-only` guard, deliberately — takes a transaction as a
// parameter, like the rest of the check-in rules (see checkIn.ts).
import { and, eq } from "drizzle-orm"
import type { Tx } from "../db/client"
import { bookings, suites } from "../db/schema"

/**
 * The only two places a suite's floor state follows a booking. Every
 * path that puts a guest into a suite or takes one out of it — a
 * check-in, a finished session, a cancellation or refund while the guest
 * is checked in — goes through these, inside the same transaction as the
 * booking change, so the floor board can't drift from the bookings.
 */

/** A guest has been checked in to this suite. */
export async function occupySuite(tx: Tx, suiteId: string): Promise<void> {
  await tx.update(suites).set({ status: "occupied" }).where(eq(suites.id, suiteId))
}

/**
 * A guest has left this suite: the session finished, or their booking
 * was cancelled or refunded while they were checked in. Call it after
 * the booking has left `checked_in`. The suite goes from occupied to
 * cleaning, the turnover the schedule already reserves, unless someone
 * else is still checked in to it (the desk can check the next guest in a
 * few minutes early, and their suite must not flip to cleaning
 * underneath them). Staff mark it ready again once it's been cleaned.
 */
export async function releaseSuite(tx: Tx, suiteId: string): Promise<void> {
  // Lock the suite first. A check-in updates the suite row in its own
  // transaction, so it either finishes before this reads the bookings
  // (and is seen below) or waits for this and sets "occupied" after it —
  // never a guest checked in to a suite this has just marked for cleaning.
  await tx.select({ id: suites.id }).from(suites).where(eq(suites.id, suiteId)).for("update")
  const [stillInUse] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.suiteId, suiteId), eq(bookings.status, "checked_in")))
    .limit(1)
  if (stillInUse) return
  await tx.update(suites).set({ status: "cleaning" }).where(and(eq(suites.id, suiteId), eq(suites.status, "occupied")))
}
