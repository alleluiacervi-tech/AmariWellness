import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, ledgerEntries, payments } from "../../db/schema"
import { RefundError, refundBooking } from "../refund"

const STAFF_ID = "00000000-0000-4000-8000-000000000099"

async function confirmedBookingWithPayment(amountRwf = 15000) {
  const { location, suite, sessionType, client } = await seedMinimalCatalog()
  const [booking] = await testDb
    .insert(bookings)
    .values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2027-01-10T10:00:00Z"),
      endAt: new Date("2027-01-10T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: amountRwf,
    })
    .returning()
  const [payment] = await testDb
    .insert(payments)
    .values({
      locationId: location.id,
      provider: "sandbox",
      providerReference: `ref_${booking.id}`,
      bookingId: booking.id,
      clientId: client.id,
      amountRwf,
      method: "momo",
      status: "succeeded",
    })
    .returning()
  return { location, client, booking, payment }
}

describe("refundBooking", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("refunds the payment, cancels the booking, and writes a negative ledger entry", async () => {
    const { booking, payment } = await confirmedBookingWithPayment(15000)
    await refundBooking(testDb, { bookingId: booking.id, amountRwf: 15000, reason: "Chair malfunctioned", staffUserId: STAFF_ID })

    const [bookingAfter] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(bookingAfter.status).toBe("cancelled")
    expect(bookingAfter.cancelReason).toBe("Chair malfunctioned")

    const [paymentAfter] = await testDb.select().from(payments).where(eq(payments.id, payment.id))
    expect(paymentAfter.status).toBe("refunded")

    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe("refund")
    expect(entries[0].amountRwf).toBe(-15000)
    expect(entries[0].reason).toBe("Chair malfunctioned")
  })

  it("allows a partial refund smaller than the amount paid", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await refundBooking(testDb, { bookingId: booking.id, amountRwf: 5000, reason: "Partial goodwill refund", staffUserId: STAFF_ID })
    const [entry] = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entry.amountRwf).toBe(-5000)
  })

  it("rejects a refund larger than the amount paid", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await expect(
      refundBooking(testDb, { bookingId: booking.id, amountRwf: 20000, reason: "Too much", staffUserId: STAFF_ID }),
    ).rejects.toThrow(RefundError)
  })

  it("rejects a refund with no reason", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await expect(
      refundBooking(testDb, { bookingId: booking.id, amountRwf: 5000, reason: "   ", staffUserId: STAFF_ID }),
    ).rejects.toThrow(RefundError)
  })

  it("rejects a zero or negative amount", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await expect(
      refundBooking(testDb, { bookingId: booking.id, amountRwf: 0, reason: "x", staffUserId: STAFF_ID }),
    ).rejects.toThrow(RefundError)
  })

  it("rejects a booking with no successful payment", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    const [booking] = await testDb
      .insert(bookings)
      .values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2027-01-10T10:00:00Z"),
        endAt: new Date("2027-01-10T10:45:00Z"),
        status: "held",
        priceAtBookingRwf: 15000,
      })
      .returning()
    await expect(
      refundBooking(testDb, { bookingId: booking.id, amountRwf: 5000, reason: "x", staffUserId: STAFF_ID }),
    ).rejects.toThrow(RefundError)
  })
})
