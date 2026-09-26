// No `server-only` guard, deliberately — takes `db` and `now` as
// parameters, like the rest of the check-in rules (see checkIn.ts).
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, clients, sessionTypes, suites } from "../db/schema"
import { kigaliWallTimeToUtc } from "../availability/slots"
import { bookingReference } from "../../lib/booking"
import { kigaliDateISO } from "../../lib/kigaliTime"

export type FloorBooking = {
  bookingId: string
  reference: string
  clientName: string
  sessionName: string
  startAt: Date
  /** When the session itself ends — without the turnover that `bookings.endAt` includes. */
  sessionEndsAt: Date
}

export type FloorSuite = {
  id: string
  name: string
  status: "ready" | "occupied" | "cleaning" | "maintenance"
  note: string | null
  /** The guest checked in to this suite right now, if any. */
  current: FloorBooking | null
  /** The next confirmed guest today who hasn't arrived yet. */
  next: FloorBooking | null
  /** How many confirmed guests are still to come today, `next` included. */
  stillToCome: number
}

/** Every active suite with who's in it and who's next — the desk's view of the floor for one day. */
export async function getFloor(db: Database, locationId: string, now: Date = new Date()): Promise<FloorSuite[]> {
  const suiteRows = await db
    .select()
    .from(suites)
    .where(and(eq(suites.locationId, locationId), eq(suites.active, true)))
    .orderBy(asc(suites.sortOrder))

  const dayStart = kigaliWallTimeToUtc(kigaliDateISO(now), 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const todays = await db
    .select({
      bookingId: bookings.id,
      suiteId: bookings.suiteId,
      status: bookings.status,
      clientName: clients.name,
      sessionName: sessionTypes.name,
      durationMinutes: sessionTypes.durationMinutes,
      startAt: bookings.startAt,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .where(
      and(
        eq(bookings.locationId, locationId),
        inArray(bookings.status, ["confirmed", "checked_in"]),
        gte(bookings.startAt, dayStart),
        lt(bookings.startAt, dayEnd),
      ),
    )
    .orderBy(asc(bookings.startAt))

  const toFloorBooking = (b: (typeof todays)[number]): FloorBooking => ({
    bookingId: b.bookingId,
    reference: bookingReference(b.bookingId),
    clientName: b.clientName,
    sessionName: b.sessionName,
    startAt: b.startAt,
    sessionEndsAt: new Date(b.startAt.getTime() + b.durationMinutes * 60_000),
  })

  return suiteRows.map((suite) => {
    const onSuite = todays.filter((b) => b.suiteId === suite.id)
    const current = onSuite.find((b) => b.status === "checked_in")
    const toCome = onSuite.filter((b) => b.status === "confirmed")
    return {
      id: suite.id,
      name: suite.name,
      status: suite.status,
      note: suite.note,
      current: current ? toFloorBooking(current) : null,
      next: toCome[0] ? toFloorBooking(toCome[0]) : null,
      stillToCome: toCome.length,
    }
  })
}
