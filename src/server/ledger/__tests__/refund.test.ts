import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { and, eq } from "drizzle-orm"
import { closeTestDatabase, concurrentTestDb, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, ledgerEntries, payments, suites } from "../../db/schema"
import { RefundError, netKeptForBooking, refundBooking } from "../refund"
import { applyDiscount } from "../discount"

const STAFF_ID = "00000000-0000-4000-8000-000000000099"

async function confirmedBookingWithPayment(
  amountRwf = 15000,
  status: "confirmed" | "checked_in" | "completed" = "confirmed",
) {
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
      status,
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
  // Every real confirmation writes this alongside the payment (see availability/confirm.ts).
  await testDb.insert(ledgerEntries).values({
    locationId: location.id,
    type: "payment_received",
    amountRwf,
    bookingId: booking.id,
    paymentId: payment.id,
    clientId: client.id,
  })
  return { location, suite, client, booking, payment }
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
    expect(entries.map((e) => e.type).sort()).toEqual(["payment_received", "refund"])
    const refund = entries.find((e) => e.type === "refund")!
    expect(refund.amountRwf).toBe(-15000)
    expect(refund.reason).toBe("Chair malfunctioned")
  })

  it("allows a partial refund smaller than the amount paid", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await refundBooking(testDb, { bookingId: booking.id, amountRwf: 5000, reason: "Partial goodwill refund", staffUserId: STAFF_ID })
    const [entry] = await testDb
      .select()
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.bookingId, booking.id), eq(ledgerEntries.type, "refund")))
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

  it("never refunds more than is still held after a discount", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    await applyDiscount(testDb, { bookingId: booking.id, amountRwf: 3000, reason: "Chair acting up", staffUserId: STAFF_ID })
    await expect(
      refundBooking(testDb, { bookingId: booking.id, amountRwf: 15000, reason: "Full refund", staffUserId: STAFF_ID }),
    ).rejects.toThrow(/12,000 RWF after discounts/)
    await refundBooking(testDb, { bookingId: booking.id, amountRwf: 12000, reason: "Refund the rest", staffUserId: STAFF_ID })
    expect(await netKeptForBooking(testDb, booking.id)).toBe(0)
  })

  it("pays out only once when two refunds of the same booking land at the same moment", async () => {
    const { booking } = await confirmedBookingWithPayment(15000)
    const concurrent = concurrentTestDb()
    try {
      const results = await Promise.allSettled([
        refundBooking(concurrent.db, { bookingId: booking.id, amountRwf: 15000, reason: "Desk, tab one", staffUserId: STAFF_ID }),
        refundBooking(concurrent.db, { bookingId: booking.id, amountRwf: 15000, reason: "Desk, tab two", staffUserId: STAFF_ID }),
      ])
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
      const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult
      expect(rejected.reason).toBeInstanceOf(RefundError)
    } finally {
      await concurrent.close()
    }
    const refunds = await testDb
      .select()
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.bookingId, booking.id), eq(ledgerEntries.type, "refund")))
    expect(refunds).toHaveLength(1)
    expect(await netKeptForBooking(testDb, booking.id)).toBe(0)
  })

  it("frees the suite when a checked-in guest is refunded mid-session", async () => {
    const { booking, suite } = await confirmedBookingWithPayment(15000, "checked_in")
    await testDb.update(suites).set({ status: "occupied" }).where(eq(suites.id, suite.id))
    const result = await refundBooking(testDb, { bookingId: booking.id, amountRwf: 15000, reason: "Chair failed", staffUserId: STAFF_ID })
    expect(result.statusAfter).toBe("cancelled")
    const [suiteAfter] = await testDb.select().from(suites).where(eq(suites.id, suite.id))
    expect(suiteAfter.status).toBe("cleaning")
  })

  it("keeps a completed session completed when it's refunded afterwards", async () => {
    const { booking } = await confirmedBookingWithPayment(15000, "completed")
    const result = await refundBooking(testDb, { bookingId: booking.id, amountRwf: 5000, reason: "Goodwill", staffUserId: STAFF_ID })
    expect(result.statusAfter).toBe("completed")
    const [after] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(after.status).toBe("completed")
  })
})
