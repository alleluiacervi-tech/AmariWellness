// No `server-only` guard, deliberately — see conflicts.ts's comment.
import { and, eq, lt } from "drizzle-orm"
import type { Database, Tx } from "../db/client"
import { bookings } from "../db/schema"

/**
 * The global sweep, called from `/api/cron/tick`. `createHold` already
 * self-heals a single suite's own stale holds the moment someone tries
 * to book it again (see migration 0001's comment and
 * `src/server/availability/createHold.ts`) — that's what makes the
 * no-double-booking guarantee hold even if this sweep never runs. This
 * is the belt-and-braces version: it clears every expired hold across
 * every suite on a schedule, so a slot nobody happens to retry still
 * frees up promptly, and a staff view never shows a stale "held" row as
 * if someone were mid-payment.
 */
export async function expireStaleHolds(db: Database): Promise<number> {
  const rows = await db
    .update(bookings)
    .set({ status: "cancelled", cancelReason: "Hold expired without payment", updatedAt: new Date() })
    .where(and(eq(bookings.status, "held"), lt(bookings.holdExpiresAt, new Date())))
    .returning({ id: bookings.id })
  return rows.length
}

/**
 * The same thing for one suite, inside the caller's transaction, right
 * before it writes a booking onto that suite. The `bookings_no_overlap`
 * exclusion constraint counts every `held` row — it can't know about
 * hold expiry (migration 0001's comment) — while availability reads
 * treat an expired hold as free. Without this step, a slot shown as free
 * would be refused by the constraint until the sweep above happened to
 * run. `createHold` and a client moving a booking both call it.
 */
export async function expireSuiteStaleHolds(tx: Database | Tx, suiteId: string, now: Date = new Date()): Promise<void> {
  await tx
    .update(bookings)
    .set({ status: "cancelled", cancelReason: "Hold expired without payment", updatedAt: now })
    .where(and(eq(bookings.suiteId, suiteId), eq(bookings.status, "held"), lt(bookings.holdExpiresAt, now)))
}
