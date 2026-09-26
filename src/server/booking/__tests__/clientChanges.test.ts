import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { and, eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, ledgerEntries, payments } from "../../db/schema"
import { createHold, SlotTakenError } from "../../availability/createHold"
import { beginSandboxPayment, confirmSandboxPayment, recordWalkInPayment } from "../../availability/confirm"
import { applyDiscount } from "../../ledger/discount"
import { BookingChangeError, cancelByClient, changePolicy, rescheduleByClient } from "../clientChanges"

process.env.QR_SECRET ??= "test-qr-secret"

const MIN = 60_000
const HOUR = 60 * MIN
const START = new Date("2027-01-10T10:00:00Z")
const SPAN = 45 * MIN // 30-minute session + 15 turnover
const WINDOW = 4

type Catalog = Awaited<ReturnType<typeof seedMinimalCatalog>>

/** A booking paid online, the way the public flow makes one. */
async function onlineBooking(catalog: Catalog, startAt = START, suiteId?: string) {
  const held = await createHold(testDb, {
    locationId: catalog.location.id,
    sessionTypeId: catalog.sessionType.id,
    clientId: catalog.client.id,
    startAt,
    endAt: new Date(startAt.getTime() + SPAN),
    priceAtBookingRwf: 15000,
    offPeak: false,
    holdMinutes: 10,
    source: "online",
    suiteId,
  })
  const payment = await beginSandboxPayment(testDb, {
    locationId: catalog.location.id,
    bookingId: held.id,
    clientId: catalog.client.id,
    amountRwf: 15000,
    method: "momo",
  })
  return confirmSandboxPayment(testDb, payment.id)
}

const input = (catalog: Catalog, bookingId: string, now: Date) => ({
  bookingId,
  clientId: catalog.client.id,
  cancellationWindowHours: WINDOW,
  now,
})

beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("changePolicy", () => {
  const booking = { status: "confirmed", startAt: START, source: "online" }
  it("is free up to and including the window's edge, then late, then closed once started", () => {
    expect(changePolicy(booking, WINDOW, new Date(START.getTime() - 5 * HOUR)).kind).toBe("free")
    expect(changePolicy(booking, WINDOW, new Date(START.getTime() - 4 * HOUR)).kind).toBe("free")
    expect(changePolicy(booking, WINDOW, new Date(START.getTime() - 4 * HOUR + MIN)).kind).toBe("late")
    expect(changePolicy(booking, WINDOW, START).kind).toBe("closed")
  })
  it("sends desk bookings back to the desk, and closes anything not confirmed", () => {
    expect(changePolicy({ ...booking, source: "walk_in" }, WINDOW, new Date(START.getTime() - 5 * HOUR)).kind).toBe("desk")
    expect(changePolicy({ ...booking, status: "checked_in" }, WINDOW, new Date(START.getTime() - 5 * HOUR)).kind).toBe("closed")
  })
})

describe("cancelByClient", () => {
  it("refunds in full, through the ledger, when cancelled in the free window", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    const result = await cancelByClient(testDb, input(catalog, booking.id, new Date(START.getTime() - 5 * HOUR)))
    expect(result).toEqual({ refundedRwf: 15000, late: false })

    const [after] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(after.status).toBe("cancelled")
    expect(after.cancelledByStaffId).toBeNull()
    const [payment] = await testDb.select().from(payments).where(eq(payments.bookingId, booking.id))
    expect(payment.status).toBe("refunded")
    const [refund] = await testDb
      .select()
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.bookingId, booking.id), eq(ledgerEntries.type, "refund")))
    expect(refund).toMatchObject({ amountRwf: -15000, staffUserId: null })
    expect(refund.reason).toContain("Cancelled by the client")
  })

  it("refunds only what's still held after a discount", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    await applyDiscount(testDb, {
      bookingId: booking.id,
      amountRwf: 2000,
      reason: "Goodwill",
      staffUserId: "00000000-0000-4000-8000-000000000099",
    })
    const result = await cancelByClient(testDb, input(catalog, booking.id, new Date(START.getTime() - 5 * HOUR)))
    expect(result.refundedRwf).toBe(13000)
  })

  it("forfeits the session inside the window: cancelled, and the money untouched", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    const result = await cancelByClient(testDb, input(catalog, booking.id, new Date(START.getTime() - HOUR)))
    expect(result).toEqual({ refundedRwf: 0, late: true })

    const [after] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(after.status).toBe("cancelled")
    expect(after.cancelReason).toContain("session forfeited")
    const [payment] = await testDb.select().from(payments).where(eq(payments.bookingId, booking.id))
    expect(payment.status).toBe("succeeded")
    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries.map((e) => e.type)).toEqual(["payment_received"])
  })

  it("won't touch another client's booking, a desk booking, or one that's started", async () => {
    const catalog = await seedMinimalCatalog({ suiteCount: 2 })
    const booking = await onlineBooking(catalog, START, catalog.suites[0].id)
    const early = new Date(START.getTime() - 5 * HOUR)
    await expect(
      cancelByClient(testDb, { ...input(catalog, booking.id, early), clientId: "00000000-0000-4000-8000-000000000123" }),
    ).rejects.toThrow("Booking not found.")
    await expect(cancelByClient(testDb, input(catalog, booking.id, START))).rejects.toThrow(BookingChangeError)

    const held = await createHold(testDb, {
      locationId: catalog.location.id,
      sessionTypeId: catalog.sessionType.id,
      clientId: catalog.client.id,
      startAt: START,
      endAt: new Date(START.getTime() + SPAN),
      priceAtBookingRwf: 15000,
      offPeak: false,
      holdMinutes: 10,
      source: "walk_in",
      suiteId: catalog.suites[1].id,
    })
    const walkIn = await recordWalkInPayment(
      testDb,
      held.id,
      { locationId: catalog.location.id, clientId: catalog.client.id, amountRwf: 15000, method: "other" },
      "00000000-0000-4000-8000-000000000099",
    )
    await expect(cancelByClient(testDb, input(catalog, walkIn.id, early))).rejects.toThrow(/made at reception/)
  })

  it("can't be done twice", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    const early = new Date(START.getTime() - 5 * HOUR)
    const results = await Promise.allSettled([
      cancelByClient(testDb, input(catalog, booking.id, early)),
      cancelByClient(testDb, input(catalog, booking.id, early)),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const refunds = await testDb
      .select()
      .from(ledgerEntries)
      .where(and(eq(ledgerEntries.bookingId, booking.id), eq(ledgerEntries.type, "refund")))
    expect(refunds).toHaveLength(1)
  })
})

describe("rescheduleByClient", () => {
  const early = new Date(START.getTime() - 24 * HOUR)
  const later = new Date(START.getTime() + 2 * HOUR)

  it("moves the booking, keeps its suite, price and QR, and re-arms the reminders", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    await testDb.update(bookings).set({ reminder24hSentAt: early }).where(eq(bookings.id, booking.id))

    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, booking.id, early),
      newStartAt: later,
      newEndAt: new Date(later.getTime() + SPAN),
      newSlotOffPeak: false,
    })
    expect(after.startAt.getTime()).toBe(later.getTime())
    expect(after.suiteId).toBe(booking.suiteId)
    expect(after.priceAtBookingRwf).toBe(15000)
    expect(after.qrToken).toBe(booking.qrToken)
    expect(after.reminder24hSentAt).toBeNull()
  })

  it("can move to an overlapping time on its own suite (it doesn't conflict with itself)", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    const nudge = new Date(START.getTime() + 15 * MIN)
    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, booking.id, early),
      newStartAt: nudge,
      newEndAt: new Date(nudge.getTime() + SPAN),
      newSlotOffPeak: false,
    })
    expect(after.suiteId).toBe(booking.suiteId)
  })

  it("moves to another suite when its own is taken, and refuses when every suite is", async () => {
    const catalog = await seedMinimalCatalog({ suiteCount: 2 })
    const booking = await onlineBooking(catalog, START, catalog.suites[0].id)
    await onlineBooking(catalog, later, catalog.suites[0].id)

    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, booking.id, early),
      newStartAt: later,
      newEndAt: new Date(later.getTime() + SPAN),
      newSlotOffPeak: false,
    })
    expect(after.suiteId).toBe(catalog.suites[1].id)

    // Fill both suites at a third time, then try to move there.
    const evenLater = new Date(later.getTime() + 3 * HOUR)
    await onlineBooking(catalog, evenLater, catalog.suites[0].id)
    await onlineBooking(catalog, evenLater, catalog.suites[1].id)
    await expect(
      rescheduleByClient(testDb, {
        ...input(catalog, booking.id, early),
        newStartAt: evenLater,
        newEndAt: new Date(evenLater.getTime() + SPAN),
        newSlotOffPeak: false,
      }),
    ).rejects.toThrow(SlotTakenError)
  })

  it("keeps a quiet-hours booking in quiet hours, but lets a peak booking move anywhere", async () => {
    const catalog = await seedMinimalCatalog()
    const quiet = await onlineBooking(catalog)
    await testDb.update(bookings).set({ offPeak: true }).where(eq(bookings.id, quiet.id))
    await expect(
      rescheduleByClient(testDb, {
        ...input(catalog, quiet.id, early),
        newStartAt: later,
        newEndAt: new Date(later.getTime() + SPAN),
        newSlotOffPeak: false,
      }),
    ).rejects.toThrow(/quiet-hours price/)

    // A peak booking moved into quiet hours is recorded as a quiet-hours booking, at the price already paid.
    const peak = await onlineBooking(catalog, new Date(START.getTime() + 6 * HOUR))
    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, peak.id, early),
      newStartAt: later,
      newEndAt: new Date(later.getTime() + SPAN),
      newSlotOffPeak: true,
    })
    expect(after.offPeak).toBe(true)
    expect(after.priceAtBookingRwf).toBe(15000)
  })

  it("isn't blocked by someone else's abandoned payment hold on the new time", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    // Expired well in the past, and never swept: still status "held", which the exclusion constraint counts.
    const [stale] = await testDb
      .insert(bookings)
      .values({
        locationId: catalog.location.id,
        suiteId: catalog.suite.id,
        sessionTypeId: catalog.sessionType.id,
        clientId: catalog.client.id,
        startAt: later,
        endAt: new Date(later.getTime() + SPAN),
        status: "held",
        priceAtBookingRwf: 15000,
        holdExpiresAt: new Date("2026-01-01T00:00:00Z"),
      })
      .returning()

    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, booking.id, early),
      newStartAt: later,
      newEndAt: new Date(later.getTime() + SPAN),
      newSlotOffPeak: false,
    })
    expect(after.startAt.getTime()).toBe(later.getTime())
    const [staleAfter] = await testDb.select().from(bookings).where(eq(bookings.id, stale.id))
    expect(staleAfter.status).toBe("cancelled")
  })

  it("doesn't send a reminder straight after the move message when it moves into the reminder's window", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog, new Date(START.getTime() + 48 * HOUR))
    const now = new Date(START.getTime() - 10 * HOUR) // START is now 10 hours away: inside 24h, outside 2h
    const { after } = await rescheduleByClient(testDb, {
      ...input(catalog, booking.id, now),
      newStartAt: START,
      newEndAt: new Date(START.getTime() + SPAN),
      newSlotOffPeak: false,
    })
    expect(after.reminder24hSentAt?.getTime()).toBe(now.getTime())
    expect(after.reminder2hSentAt).toBeNull()
  })

  it("won't move to a time already inside the cancellation window", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog, new Date(START.getTime() + 48 * HOUR))
    const now = new Date(START.getTime() - 3 * HOUR)
    await expect(
      rescheduleByClient(testDb, {
        ...input(catalog, booking.id, now),
        newStartAt: START,
        newEndAt: new Date(START.getTime() + SPAN),
        newSlotOffPeak: false,
      }),
    ).rejects.toThrow(/at least 4 hours from now/)
  })

  it("isn't offered inside the window, or into the past", async () => {
    const catalog = await seedMinimalCatalog()
    const booking = await onlineBooking(catalog)
    await expect(
      rescheduleByClient(testDb, {
        ...input(catalog, booking.id, new Date(START.getTime() - HOUR)),
        newStartAt: later,
        newEndAt: new Date(later.getTime() + SPAN),
        newSlotOffPeak: false,
      }),
    ).rejects.toThrow(/only be moved up to 4 hours/)
    await expect(
      rescheduleByClient(testDb, {
        ...input(catalog, booking.id, early),
        newStartAt: new Date(early.getTime() - HOUR),
        newEndAt: early,
        newSlotOffPeak: false,
      }),
    ).rejects.toThrow(/at least 4 hours from now/)
  })
})
