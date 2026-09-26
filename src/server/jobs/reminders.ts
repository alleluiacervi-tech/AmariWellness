// No `server-only` guard, deliberately — takes `db`, the adapters and
// `now` as parameters so vitest can drive the clock against a real
// Postgres (see `src/server/availability/conflicts.ts`).
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings } from "../db/schema"
import { sendBookingMessage, type NotifyDeps } from "../notify/bookingMessages"
import { REMINDER_24H_MINUTES, REMINDER_2H_MINUTES } from "./policy"

const minutesFrom = (now: Date, minutes: number) => new Date(now.getTime() + minutes * 60_000)

/**
 * Sends the 24-hour and 2-hour reminders that are due. Each reminder is
 * *claimed* before it's sent — one UPDATE sets `reminder24hSentAt` (or
 * `reminder2hSentAt`) only where it's still null and returns the rows it
 * changed — so two overlapping job runs can never both send the same
 * reminder. The trade-off is deliberate: a send that fails after the
 * claim is logged to `notifications` as failed rather than retried, so a
 * client gets at most one of each reminder, never a burst.
 *
 * Which bookings get which reminder:
 * - Only `confirmed` bookings — never a hold, a cancellation, or someone
 *   already checked in.
 * - 24-hour: the session is between 2 and 24 hours away. Once it's
 *   inside 2 hours, the 2-hour reminder covers it instead.
 * - Neither reminder goes to a booking made inside its own window (a
 *   session booked this morning for tonight doesn't need a "2 hours to
 *   go" message on top of a confirmation that just arrived).
 */
export async function sendDueReminders(db: Database, deps: NotifyDeps, now: Date = new Date()) {
  const claimed24h = await db
    .update(bookings)
    .set({ reminder24hSentAt: now })
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.reminder24hSentAt),
        gt(bookings.startAt, minutesFrom(now, REMINDER_2H_MINUTES)),
        lte(bookings.startAt, minutesFrom(now, REMINDER_24H_MINUTES)),
        lte(bookings.createdAt, sql`${bookings.startAt} - make_interval(mins => ${REMINDER_24H_MINUTES})`),
      ),
    )
    .returning({ id: bookings.id })

  const claimed2h = await db
    .update(bookings)
    .set({ reminder2hSentAt: now })
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.reminder2hSentAt),
        gt(bookings.startAt, now),
        lte(bookings.startAt, minutesFrom(now, REMINDER_2H_MINUTES)),
        lte(bookings.createdAt, sql`${bookings.startAt} - make_interval(mins => ${REMINDER_2H_MINUTES})`),
      ),
    )
    .returning({ id: bookings.id })

  const failures: string[] = []
  async function send(id: string, template: "reminder_24h" | "reminder_2h") {
    try {
      await sendBookingMessage(db, id, template, deps, { now })
    } catch (err) {
      // One bad row (a database hiccup mid-send) must not stop every
      // other client's reminder in the same run.
      failures.push(`${template} ${id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  for (const { id } of claimed24h) await send(id, "reminder_24h")
  for (const { id } of claimed2h) await send(id, "reminder_2h")

  return { reminders24h: claimed24h.length, reminders2h: claimed2h.length, failures }
}
