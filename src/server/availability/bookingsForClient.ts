import "server-only"
import { desc, eq } from "drizzle-orm"
import { db } from "../db/client"
import { bookings, sessionTypes, suites, type BookingStatus } from "../db/schema"

export type ClientBookingRow = {
  id: string
  sessionName: string
  suiteName: string
  startAt: Date
  endAt: Date
  status: BookingStatus
  priceAtBookingRwf: number
}

/** Every booking a client has ever made, newest first — the real `/account` page (Phase 1.4b) splits this into upcoming and past. */
export async function getBookingsForClient(clientId: string): Promise<ClientBookingRow[]> {
  const rows = await db
    .select({
      id: bookings.id,
      sessionName: sessionTypes.name,
      suiteName: suites.name,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      status: bookings.status,
      priceAtBookingRwf: bookings.priceAtBookingRwf,
    })
    .from(bookings)
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .innerJoin(suites, eq(suites.id, bookings.suiteId))
    .where(eq(bookings.clientId, clientId))
    .orderBy(desc(bookings.startAt))
  return rows
}
