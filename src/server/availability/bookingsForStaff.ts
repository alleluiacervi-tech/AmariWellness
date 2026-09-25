import "server-only"
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm"
import { db } from "../db/client"
import { bookings, clients, payments, sessionTypes, suites, type BookingStatus, type PaymentMethod } from "../db/schema"
import { getLocation } from "../db/content"
import { kigaliWallTimeToUtc } from "./slots"

export type StaffBookingRow = {
  id: string
  suiteName: string
  sessionName: string
  clientName: string
  clientPhone: string | null
  startAt: Date
  endAt: Date
  status: BookingStatus
  priceAtBookingRwf: number
  paymentStatus: string | null
  paymentMethod: PaymentMethod | null
  paymentAmountRwf: number | null
}

/**
 * One calendar day's bookings for the staff board, each joined to its
 * "primary" payment — the succeeded one if there is one, otherwise the
 * most recent attempt. A booking can in principle accumulate more than
 * one payment row (a failed try followed by a successful retry, once
 * Phase 1.4b's online flow allows retrying), so this is a real reduction
 * step rather than a plain join, which would duplicate the booking row.
 */
export async function getBookingsForDay(dateISO: string): Promise<StaffBookingRow[]> {
  const location = await getLocation()
  const dayStart = kigaliWallTimeToUtc(dateISO, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      id: bookings.id,
      suiteName: suites.name,
      sessionName: sessionTypes.name,
      clientName: clients.name,
      clientPhone: clients.phone,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      status: bookings.status,
      priceAtBookingRwf: bookings.priceAtBookingRwf,
    })
    .from(bookings)
    .innerJoin(suites, eq(suites.id, bookings.suiteId))
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .where(and(eq(bookings.locationId, location.id), gte(bookings.startAt, dayStart), lt(bookings.startAt, dayEnd)))
    .orderBy(asc(bookings.startAt))

  if (rows.length === 0) return []

  const bookingIds = rows.map((r) => r.id)
  const paymentRows = await db.select().from(payments).where(inArray(payments.bookingId, bookingIds))
  const paymentByBooking = new Map<string, (typeof paymentRows)[number]>()
  for (const payment of paymentRows) {
    if (!payment.bookingId) continue
    const existing = paymentByBooking.get(payment.bookingId)
    const isBetter =
      !existing || payment.status === "succeeded" || (existing.status !== "succeeded" && payment.createdAt > existing.createdAt)
    if (isBetter) paymentByBooking.set(payment.bookingId, payment)
  }

  return rows.map((row) => {
    const payment = paymentByBooking.get(row.id)
    return {
      ...row,
      paymentStatus: payment?.status ?? null,
      paymentMethod: payment?.method ?? null,
      paymentAmountRwf: payment?.amountRwf ?? null,
    }
  })
}
