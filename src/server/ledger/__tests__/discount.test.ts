import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, ledgerEntries } from "../../db/schema"
import { DiscountError, applyDiscount } from "../discount"

const STAFF_ID = "00000000-0000-4000-8000-000000000099"

async function bookingWithStatus(status: "held" | "confirmed" | "checked_in" | "completed") {
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
      priceAtBookingRwf: 15000,
    })
    .returning()
  return booking
}

describe("applyDiscount", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("writes a negative discount_applied ledger entry against a confirmed booking", async () => {
    const booking = await bookingWithStatus("confirmed")
    await applyDiscount(testDb, { bookingId: booking.id, amountRwf: 1000, reason: "Chair was acting up", staffUserId: STAFF_ID })

    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe("discount_applied")
    expect(entries[0].amountRwf).toBe(-1000)
    expect(entries[0].reason).toBe("Chair was acting up")
  })

  it("does not touch the booking's own priceAtBookingRwf", async () => {
    const booking = await bookingWithStatus("confirmed")
    await applyDiscount(testDb, { bookingId: booking.id, amountRwf: 1000, reason: "x", staffUserId: STAFF_ID })
    const [after] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(after.priceAtBookingRwf).toBe(15000)
  })

  it("allows a discount on a checked-in booking", async () => {
    const booking = await bookingWithStatus("checked_in")
    await expect(
      applyDiscount(testDb, { bookingId: booking.id, amountRwf: 500, reason: "x", staffUserId: STAFF_ID }),
    ).resolves.toBeDefined()
  })

  it("allows a discount on a completed booking", async () => {
    const booking = await bookingWithStatus("completed")
    await expect(
      applyDiscount(testDb, { bookingId: booking.id, amountRwf: 500, reason: "x", staffUserId: STAFF_ID }),
    ).resolves.toBeDefined()
  })

  it("rejects a discount on a booking that isn't confirmed yet", async () => {
    const booking = await bookingWithStatus("held")
    await expect(
      applyDiscount(testDb, { bookingId: booking.id, amountRwf: 500, reason: "x", staffUserId: STAFF_ID }),
    ).rejects.toThrow(DiscountError)
  })

  it("rejects a missing reason", async () => {
    const booking = await bookingWithStatus("confirmed")
    await expect(
      applyDiscount(testDb, { bookingId: booking.id, amountRwf: 500, reason: "", staffUserId: STAFF_ID }),
    ).rejects.toThrow(DiscountError)
  })

  it("rejects a zero or negative amount", async () => {
    const booking = await bookingWithStatus("confirmed")
    await expect(
      applyDiscount(testDb, { bookingId: booking.id, amountRwf: -5, reason: "x", staffUserId: STAFF_ID }),
    ).rejects.toThrow(DiscountError)
  })
})
