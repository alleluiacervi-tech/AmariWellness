import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, ledgerEntries, payments } from "../../db/schema"
import { BookingNotHeldError, PaymentNotPendingError, beginSandboxPayment, confirmSandboxPayment, recordWalkInPayment } from "../confirm"
import { createHold } from "../createHold"

const START = new Date("2027-01-10T10:00:00Z")
const END = new Date("2027-01-10T10:45:00Z")

async function heldBooking() {
  const { location, sessionType, client } = await seedMinimalCatalog()
  const booking = await createHold(testDb, {
    locationId: location.id,
    sessionTypeId: sessionType.id,
    clientId: client.id,
    startAt: START,
    endAt: END,
    priceAtBookingRwf: 15000,
    offPeak: false,
    holdMinutes: 10,
    source: "online",
  })
  return { location, client, booking }
}

// One shared `beforeEach`/`afterAll` for the whole file — `testDb`'s
// underlying connection is a module-level singleton, so a second
// `afterAll(closeTestDatabase)` in a later describe block would close it
// out from under this one (they run in the same file/module instance).
beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("beginSandboxPayment", () => {
  it("creates a pending payment without touching the booking's status", async () => {
    const { location, client, booking } = await heldBooking()
    const payment = await beginSandboxPayment(testDb, {
      locationId: location.id,
      bookingId: booking.id,
      clientId: client.id,
      amountRwf: 15000,
      method: "momo",
      phone: "+250780000001",
    })
    expect(payment.status).toBe("pending")
    expect(payment.provider).toBe("sandbox")

    const [bookingAfter] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(bookingAfter.status).toBe("held")
  })

  it("chains into confirmSandboxPayment to reach a confirmed booking", async () => {
    const { location, client, booking } = await heldBooking()
    const payment = await beginSandboxPayment(testDb, {
      locationId: location.id,
      bookingId: booking.id,
      clientId: client.id,
      amountRwf: 15000,
      method: "airtel",
    })
    const confirmed = await confirmSandboxPayment(testDb, payment.id)
    expect(confirmed.status).toBe("confirmed")
  })
})

describe("confirmSandboxPayment", () => {
  it("flips a pending payment to succeeded, confirms the booking, and records a positive ledger entry", async () => {
    const { location, client, booking } = await heldBooking()
    const [payment] = await testDb
      .insert(payments)
      .values({
        locationId: location.id,
        provider: "sandbox",
        providerReference: "sandbox_ref_1",
        bookingId: booking.id,
        clientId: client.id,
        amountRwf: 15000,
        method: "momo",
        status: "pending",
      })
      .returning()

    const confirmed = await confirmSandboxPayment(testDb, payment.id)
    expect(confirmed.status).toBe("confirmed")
    expect(confirmed.qrToken).toBeTruthy()

    const [paymentAfter] = await testDb.select().from(payments).where(eq(payments.id, payment.id))
    expect(paymentAfter.status).toBe("succeeded")

    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe("payment_received")
    expect(entries[0].amountRwf).toBe(15000)
  })

  it("throws PaymentNotPendingError for a payment that isn't pending", async () => {
    const { location, client, booking } = await heldBooking()
    const [payment] = await testDb
      .insert(payments)
      .values({
        locationId: location.id,
        provider: "sandbox",
        providerReference: "sandbox_ref_2",
        bookingId: booking.id,
        clientId: client.id,
        amountRwf: 15000,
        method: "momo",
        status: "failed",
      })
      .returning()

    await expect(confirmSandboxPayment(testDb, payment.id)).rejects.toThrow(PaymentNotPendingError)
  })
})

describe("recordWalkInPayment", () => {
  it("records a succeeded payment and confirms the booking with the staff member attributed", async () => {
    const { location, client, booking } = await heldBooking()
    const confirmed = await recordWalkInPayment(
      testDb,
      booking.id,
      { locationId: location.id, clientId: client.id, amountRwf: 15000, method: "other" },
      "00000000-0000-4000-8000-000000000099",
    )
    expect(confirmed.status).toBe("confirmed")

    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries).toHaveLength(1)
    expect(entries[0].amountRwf).toBe(15000)
    expect(entries[0].staffUserId).toBe("00000000-0000-4000-8000-000000000099")
  })

  it("throws BookingNotHeldError, and rolls back the payment insert, when the booking isn't held", async () => {
    const { location, client, booking } = await heldBooking()
    // Simulate the booking having been confirmed by some other path already.
    await testDb.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, booking.id))

    await expect(
      recordWalkInPayment(
        testDb,
        booking.id,
        { locationId: location.id, clientId: client.id, amountRwf: 15000, method: "other" },
        "00000000-0000-4000-8000-000000000099",
      ),
    ).rejects.toThrow(BookingNotHeldError)

    // The transaction must have rolled back: no payment row, no ledger entry.
    const paymentRows = await testDb.select().from(payments).where(eq(payments.bookingId, booking.id))
    expect(paymentRows).toHaveLength(0)
    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries).toHaveLength(0)
  })
})
