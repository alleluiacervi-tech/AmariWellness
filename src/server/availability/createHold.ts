// No `server-only` guard, deliberately — see conflicts.ts's comment.
// Callers inside Next (Server Actions, route handlers) pass in the real
// `db` from `src/server/db/client.ts`; tests pass `testDb`.
import type { Database } from "../db/client"
import { bookings } from "../db/schema"
import { pickAvailableSuite } from "./conflicts"
import { expireSuiteStaleHolds } from "./expireStaleHolds"

export class SlotTakenError extends Error {
  constructor() {
    super("That time was just taken — please choose another.")
    this.name = "SlotTakenError"
  }
}

export type CreateHoldInput = {
  locationId: string
  sessionTypeId: string
  clientId: string
  startAt: Date
  endAt: Date
  priceAtBookingRwf: number
  offPeak: boolean
  holdMinutes: number
  source: "online" | "walk_in" | "phone"
  createdByStaffId?: string
  /** Staff can pin a specific suite (e.g. "put them in Suite 2"); the public flow always auto-picks. */
  suiteId?: string
}

/**
 * Reserves a suite for `[startAt, endAt)` with status "held". The actual
 * guarantee against double-booking is the `bookings_no_overlap`
 * exclusion constraint (migration 0001), not this function — a genuine
 * race between two requests is decided by Postgres, and the loser gets
 * `SlotTakenError` from the `catch` below, never a silent overwrite.
 *
 * Before inserting, this suite's own stale ("held" past `holdExpiresAt`)
 * bookings are expired inside the same transaction
 * (`expireSuiteStaleHolds` — see its comment on why the exclusion
 * constraint itself can't know about hold expiry).
 */
export async function createHold(db: Database, input: CreateHoldInput) {
  const suiteId = input.suiteId ?? (await pickAvailableSuite(db, input.locationId, input.startAt, input.endAt))
  if (!suiteId) throw new SlotTakenError()

  try {
    return await db.transaction(async (tx) => {
      await expireSuiteStaleHolds(tx, suiteId)

      const [row] = await tx
        .insert(bookings)
        .values({
          locationId: input.locationId,
          suiteId,
          sessionTypeId: input.sessionTypeId,
          clientId: input.clientId,
          startAt: input.startAt,
          endAt: input.endAt,
          status: "held",
          source: input.source,
          priceAtBookingRwf: input.priceAtBookingRwf,
          offPeak: input.offPeak,
          holdExpiresAt: new Date(Date.now() + input.holdMinutes * 60_000),
          createdByStaffId: input.createdByStaffId,
        })
        .returning()
      return row
    })
  } catch (err) {
    if (isOverlapError(err)) throw new SlotTakenError()
    throw err
  }
}

/** Whether a failed write was the `bookings_no_overlap` exclusion constraint deciding a race — Drizzle puts the Postgres error on `.cause`. */
export function isOverlapError(err: unknown): boolean {
  const message = err instanceof Error ? ((err.cause as Error | undefined)?.message ?? err.message) : String(err)
  return message.includes("bookings_no_overlap")
}
