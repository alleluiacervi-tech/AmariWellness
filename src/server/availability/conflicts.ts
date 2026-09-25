// No `server-only` guard, deliberately: every function here takes `db`
// as a parameter rather than importing the app's singleton, so this is
// directly testable in a plain vitest run against a real Postgres — see
// `src/server/auth/lockout.ts` for the same reasoning applied first.
import { and, asc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, maintenanceBlocks, suites } from "../db/schema"

const LIVE_BOOKING_STATUSES = ["confirmed", "checked_in"] as const

/**
 * Whether `suiteId` has any live booking or maintenance block overlapping
 * `[startAt, endAt)`. Mirrors the `bookings_no_overlap` exclusion
 * constraint's own definition (migration 0001) — including its "held"
 * carve-out: a held booking only counts once its `holdExpiresAt` is
 * still in the future, so an abandoned hold reads as free here even
 * before the sweep (`expireStaleHolds`) or the next hold on that suite
 * (`createHold`) gets around to flipping its status. This is a read for
 * deciding where to *try* a booking, not the source of truth — the
 * exclusion constraint is that, and always has the final word.
 */
export async function suiteHasConflict(db: Database, suiteId: string, startAt: Date, endAt: Date): Promise<boolean> {
  const now = new Date()
  const [bookingConflict] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.suiteId, suiteId),
        lt(bookings.startAt, endAt),
        gt(bookings.endAt, startAt),
        or(
          inArray(bookings.status, LIVE_BOOKING_STATUSES),
          and(eq(bookings.status, "held"), or(isNull(bookings.holdExpiresAt), gt(bookings.holdExpiresAt, now))),
        ),
      ),
    )
    .limit(1)
  if (bookingConflict) return true

  const [maintenanceConflict] = await db
    .select({ id: maintenanceBlocks.id })
    .from(maintenanceBlocks)
    .where(
      and(eq(maintenanceBlocks.suiteId, suiteId), lt(maintenanceBlocks.startAt, endAt), gt(maintenanceBlocks.endAt, startAt)),
    )
    .limit(1)
  return Boolean(maintenanceConflict)
}

/** The first active suite (by `sortOrder`) with no conflict for the span — or null if every suite is taken or blocked. */
export async function pickAvailableSuite(
  db: Database,
  locationId: string,
  startAt: Date,
  endAt: Date,
): Promise<string | null> {
  const activeSuites = await db
    .select({ id: suites.id })
    .from(suites)
    .where(and(eq(suites.locationId, locationId), eq(suites.active, true)))
    .orderBy(asc(suites.sortOrder))

  for (const suite of activeSuites) {
    if (!(await suiteHasConflict(db, suite.id, startAt, endAt))) return suite.id
  }
  return null
}
