// No `server-only` guard, deliberately — see reminders.ts.
import { and, eq, inArray, lte, sql } from "drizzle-orm"
import type { Database, Tx } from "../db/client"
import { activityLog, bookings, sessionTypes, suites } from "../db/schema"
import { NO_SHOW_GRACE_MINUTES } from "./policy"

/**
 * A confirmed booking nobody checked in for by `NO_SHOW_GRACE_MINUTES`
 * after its start becomes a no-show. Under the draft policy the session
 * is forfeited: the payment and its ledger entry stay exactly as they
 * are — nothing is refunded, and nothing about the money changes. (Using
 * a pack credit for a no-show arrives with packs, Phase 2.)
 *
 * Each one is written to the activity log with no staff member, so "why
 * is this a no-show?" always has an answer.
 */
export async function markNoShows(db: Database, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - NO_SHOW_GRACE_MINUTES * 60_000)
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(bookings)
      .set({ status: "no_show", updatedAt: now })
      .where(and(eq(bookings.status, "confirmed"), lte(bookings.startAt, cutoff)))
      .returning({ id: bookings.id })
    if (rows.length) {
      await tx.insert(activityLog).values(
        rows.map((r) => ({
          staffUserId: null,
          action: "booking.noShow",
          entityType: "booking",
          entityId: r.id,
          before: JSON.stringify({ status: "confirmed" }),
          after: JSON.stringify({ status: "no_show" }),
          reason: `Not checked in within ${NO_SHOW_GRACE_MINUTES} minutes of the start`,
        })),
      )
    }
    return rows.length
  })
}

/**
 * Completes the given checked-in bookings and moves each one's suite
 * from occupied to cleaning — the turnover the schedule already
 * reserves. Staff mark the suite ready again from the floor board once
 * it's actually been cleaned; that step stays human.
 *
 * A suite is only moved to cleaning if nobody else is checked in to it:
 * the desk can check the next guest in a few minutes early, and their
 * suite must not flip to "cleaning" underneath them.
 */
async function completeAndFreeSuites(tx: Tx, finished: { id: string; suiteId: string }[], now: Date): Promise<string[]> {
  if (finished.length === 0) return []
  const completed = await tx
    .update(bookings)
    .set({ status: "completed", updatedAt: now })
    .where(and(inArray(bookings.id, finished.map((f) => f.id)), eq(bookings.status, "checked_in")))
    .returning({ id: bookings.id, suiteId: bookings.suiteId })

  for (const suiteId of new Set(completed.map((f) => f.suiteId))) {
    const [stillInUse] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.suiteId, suiteId), eq(bookings.status, "checked_in")))
      .limit(1)
    if (stillInUse) continue
    await tx.update(suites).set({ status: "cleaning" }).where(and(eq(suites.id, suiteId), eq(suites.status, "occupied")))
  }
  return completed.map((c) => c.id)
}

/** The scheduled version: every checked-in session whose time is up. */
export async function completeFinishedSessions(db: Database, now: Date = new Date()): Promise<number> {
  return db.transaction(async (tx) => {
    const finished = await tx
      .select({ id: bookings.id, suiteId: bookings.suiteId })
      .from(bookings)
      .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
      .where(
        and(
          eq(bookings.status, "checked_in"),
          // A raw `sql` comparison gets no column type to map a Date
          // through, so pass the instant as ISO text with an explicit cast.
          sql`${bookings.startAt} + make_interval(mins => ${sessionTypes.durationMinutes}) <= ${now.toISOString()}::timestamptz`,
        ),
      )
    return (await completeAndFreeSuites(tx, finished, now)).length
  })
}

/** The desk's version, from the floor board: this guest has left, whatever the clock says. Returns false if the booking wasn't checked in. */
export async function finishSession(db: Database, bookingId: string, now: Date = new Date()): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: bookings.id, suiteId: bookings.suiteId })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, "checked_in")))
      .limit(1)
    if (!row) return false
    return (await completeAndFreeSuites(tx, [row], now)).length === 1
  })
}
