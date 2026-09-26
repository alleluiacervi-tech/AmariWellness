import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { db } from "../db/client"
import { isUuid } from "../../lib/uuid"
import { bookings, ledgerEntries, payments, sessionTypes, suites, type BookingStatus, type PaymentMethod } from "../db/schema"

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

export type ClientBookingDetail = {
  id: string
  sessionTypeId: string
  sessionName: string
  durationMinutes: number
  suiteName: string
  startAt: Date
  status: BookingStatus
  source: "online" | "walk_in" | "phone"
  priceAtBookingRwf: number
  qrToken: string | null
  createdAt: Date
  checkedInAt: Date | null
  cancelledAt: Date | null
  cancelReason: string | null
  payment: {
    method: PaymentMethod
    amountRwf: number
    status: string
    providerReference: string
    paidAt: Date
  } | null
  /**
   * Sums of this booking's ledger entries — the receipt shows money
   * moved, never an editable number. `heldRwf` is all of them together,
   * corrections included: what the business still holds, and so what a
   * free cancellation refunds (the same sum as `netKeptForBooking`).
   */
  money: { paidRwf: number; discountRwf: number; refundedRwf: number; heldRwf: number }
}

/** One of the signed-in client's bookings, with what a receipt needs — or null if it isn't theirs. The client id is part of the query, not a check after it. */
export async function getClientBooking(clientId: string, bookingId: string): Promise<ClientBookingDetail | null> {
  if (!isUuid(bookingId)) return null
  const [row] = await db
    .select({
      id: bookings.id,
      sessionTypeId: sessionTypes.id,
      sessionName: sessionTypes.name,
      durationMinutes: sessionTypes.durationMinutes,
      suiteName: suites.name,
      startAt: bookings.startAt,
      status: bookings.status,
      source: bookings.source,
      priceAtBookingRwf: bookings.priceAtBookingRwf,
      qrToken: bookings.qrToken,
      createdAt: bookings.createdAt,
      checkedInAt: bookings.checkedInAt,
      cancelledAt: bookings.cancelledAt,
      cancelReason: bookings.cancelReason,
    })
    .from(bookings)
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .innerJoin(suites, eq(suites.id, bookings.suiteId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, clientId)))
    .limit(1)
  if (!row) return null

  const [paymentRows, entries] = await Promise.all([
    db.select().from(payments).where(eq(payments.bookingId, row.id)).orderBy(desc(payments.createdAt)),
    db
      .select({ type: ledgerEntries.type, amountRwf: ledgerEntries.amountRwf })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.bookingId, row.id)),
  ])
  // The payment that actually went through (now "succeeded" or later
  // "refunded"), not an abandoned attempt.
  const payment = paymentRows.find((p) => p.status === "succeeded" || p.status === "refunded") ?? null
  const sum = (type: string) => entries.filter((e) => e.type === type).reduce((total, e) => total + e.amountRwf, 0)

  return {
    ...row,
    payment: payment
      ? {
          method: payment.method,
          amountRwf: payment.amountRwf,
          status: payment.status,
          providerReference: payment.providerReference,
          paidAt: payment.createdAt,
        }
      : null,
    money: {
      paidRwf: sum("payment_received"),
      discountRwf: -sum("discount_applied"),
      refundedRwf: -sum("refund"),
      heldRwf: entries.reduce((total, e) => total + e.amountRwf, 0),
    },
  }
}
