import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { activityLog, bookings, ledgerEntries, notifications, payments, suites } from "../../db/schema"
import { createHold } from "../../availability/createHold"
import { recordWalkInPayment } from "../../availability/confirm"
import { capturingDeps } from "../../notify/__tests__/testAdapters"
import { sendDueReminders } from "../reminders"
import { completeFinishedSessions, finishSession, markNoShows } from "../sessionLifecycle"
import { runTick } from "../tick"

process.env.QR_SECRET ??= "test-qr-secret"

const MIN = 60_000
const HOUR = 60 * MIN
const STAFF = "00000000-0000-4000-8000-000000000099"

type Catalog = Awaited<ReturnType<typeof seedMinimalCatalog>>

/** A paid, confirmed booking starting at `startAt` — created (and so "booked") at the real current time. */
async function confirmedAt(catalog: Catalog, startAt: Date, suiteId?: string) {
  const held = await createHold(testDb, {
    locationId: catalog.location.id,
    sessionTypeId: catalog.sessionType.id,
    clientId: catalog.client.id,
    startAt,
    endAt: new Date(startAt.getTime() + 45 * MIN), // 30-minute session + 15 turnover
    priceAtBookingRwf: 15000,
    offPeak: false,
    holdMinutes: 10,
    source: "walk_in",
    suiteId,
  })
  return recordWalkInPayment(
    testDb,
    held.id,
    { locationId: catalog.location.id, clientId: catalog.client.id, amountRwf: 15000, method: "momo" },
    STAFF,
  )
}

async function bookingById(id: string) {
  const [row] = await testDb.select().from(bookings).where(eq(bookings.id, id))
  return row
}

beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("sendDueReminders", () => {
  it("sends the 24-hour reminder once, when the session is under a day away", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 3 * 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    const { deps, whatsapps } = capturingDeps()

    // 25 hours out: too early.
    expect((await sendDueReminders(testDb, deps, new Date(start.getTime() - 25 * HOUR))).reminders24h).toBe(0)

    const now = new Date(start.getTime() - 23 * HOUR)
    const first = await sendDueReminders(testDb, deps, now)
    expect(first).toMatchObject({ reminders24h: 1, reminders2h: 0 })
    expect(whatsapps.map((m) => m.template)).toEqual(["reminder_24h"])
    expect((await bookingById(booking.id)).reminder24hSentAt?.getTime()).toBe(now.getTime())

    // The next run, an hour later, must not send it again.
    const second = await sendDueReminders(testDb, deps, new Date(now.getTime() + HOUR))
    expect(second.reminders24h).toBe(0)
    expect(whatsapps).toHaveLength(1)
  })

  it("sends the 2-hour reminder inside two hours, and skips a 24-hour reminder that would now be redundant", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 3 * 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    const { deps, whatsapps } = capturingDeps()

    const result = await sendDueReminders(testDb, deps, new Date(start.getTime() - 90 * MIN))
    expect(result).toMatchObject({ reminders24h: 0, reminders2h: 1 })
    expect(whatsapps.map((m) => m.template)).toEqual(["reminder_2h"])
    expect(whatsapps[0].image).toBeDefined() // the 2-hour reminder carries the QR again
    expect((await bookingById(booking.id)).reminder24hSentAt).toBeNull()
  })

  it("doesn't remind a booking made inside the reminder's own window", async () => {
    const catalog = await seedMinimalCatalog()
    // Booked (now, in real time) for 20 hours from now: inside the 24h window from the moment it exists.
    const start = new Date(Date.now() + 20 * HOUR)
    await confirmedAt(catalog, start)
    const { deps } = capturingDeps()

    expect((await sendDueReminders(testDb, deps, new Date(Date.now() + HOUR))).reminders24h).toBe(0)
    // ...but the 2-hour reminder, whose window it was booked well before, still goes out.
    expect((await sendDueReminders(testDb, deps, new Date(start.getTime() - 90 * MIN))).reminders2h).toBe(1)
  })

  it("never reminds a cancelled booking or an unpaid hold", async () => {
    const catalog = await seedMinimalCatalog({ suiteCount: 2 })
    const start = new Date(Date.now() + 3 * 24 * HOUR)
    const cancelled = await confirmedAt(catalog, start, catalog.suites[0].id)
    await testDb.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, cancelled.id))
    await createHold(testDb, {
      locationId: catalog.location.id,
      sessionTypeId: catalog.sessionType.id,
      clientId: catalog.client.id,
      startAt: start,
      endAt: new Date(start.getTime() + 45 * MIN),
      priceAtBookingRwf: 15000,
      offPeak: false,
      holdMinutes: 10,
      source: "online",
      suiteId: catalog.suites[1].id,
    })
    const { deps, whatsapps } = capturingDeps()
    const result = await sendDueReminders(testDb, deps, new Date(start.getTime() - 23 * HOUR))
    expect(result.reminders24h).toBe(0)
    expect(whatsapps).toHaveLength(0)
  })

  it("sends each reminder once even when two job runs overlap", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 3 * 24 * HOUR)
    await confirmedAt(catalog, start)
    const { deps, whatsapps } = capturingDeps()
    const now = new Date(start.getTime() - 23 * HOUR)

    const [a, b] = await Promise.all([sendDueReminders(testDb, deps, now), sendDueReminders(testDb, deps, now)])
    expect(a.reminders24h + b.reminders24h).toBe(1)
    expect(whatsapps).toHaveLength(1)
  })

  it("claims the reminder even if the provider fails, logging the failure instead of retrying into a burst", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 3 * 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    const { deps } = capturingDeps({ failWhatsApp: true })

    await sendDueReminders(testDb, deps, new Date(start.getTime() - 23 * HOUR))
    const [logged] = await testDb.select().from(notifications).where(eq(notifications.bookingId, booking.id))
    expect(logged).toMatchObject({ template: "reminder_24h", status: "failed", error: "WhatsApp provider is down" })
    expect((await sendDueReminders(testDb, deps, new Date(start.getTime() - 22 * HOUR))).reminders24h).toBe(0)
  })
})

describe("markNoShows", () => {
  it("marks a confirmed booking nobody checked in for as a no-show once the 15-minute grace has passed", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const booking = await confirmedAt(catalog, start)

    expect(await markNoShows(testDb, new Date(start.getTime() + 14 * MIN))).toBe(0)
    expect((await bookingById(booking.id)).status).toBe("confirmed")

    expect(await markNoShows(testDb, new Date(start.getTime() + 15 * MIN))).toBe(1)
    expect((await bookingById(booking.id)).status).toBe("no_show")

    const [logged] = await testDb.select().from(activityLog).where(eq(activityLog.entityId, booking.id))
    expect(logged).toMatchObject({ action: "booking.noShow", staffUserId: null })
  })

  it("forfeits the session without touching the money", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    await markNoShows(testDb, new Date(start.getTime() + HOUR))

    const [payment] = await testDb.select().from(payments).where(eq(payments.bookingId, booking.id))
    expect(payment.status).toBe("succeeded")
    const entries = await testDb.select().from(ledgerEntries).where(eq(ledgerEntries.bookingId, booking.id))
    expect(entries.map((e) => [e.type, e.amountRwf])).toEqual([["payment_received", 15000]])
  })

  it("leaves a checked-in booking alone", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    await testDb.update(bookings).set({ status: "checked_in" }).where(eq(bookings.id, booking.id))
    expect(await markNoShows(testDb, new Date(start.getTime() + HOUR))).toBe(0)
  })
})

describe("completeFinishedSessions", () => {
  it("completes a checked-in session once its time is up and sends the suite to cleaning", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    await testDb.update(bookings).set({ status: "checked_in" }).where(eq(bookings.id, booking.id))
    await testDb.update(suites).set({ status: "occupied" }).where(eq(suites.id, catalog.suite.id))

    expect(await completeFinishedSessions(testDb, new Date(start.getTime() + 29 * MIN))).toBe(0)
    expect(await completeFinishedSessions(testDb, new Date(start.getTime() + 30 * MIN))).toBe(1)
    expect((await bookingById(booking.id)).status).toBe("completed")
    const [suite] = await testDb.select().from(suites).where(eq(suites.id, catalog.suite.id))
    expect(suite.status).toBe("cleaning")
  })

  it("keeps a suite occupied when the next guest was already checked in to it", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const first = await confirmedAt(catalog, start, catalog.suite.id)
    const next = await confirmedAt(catalog, new Date(start.getTime() + 45 * MIN), catalog.suite.id)
    await testDb.update(bookings).set({ status: "checked_in" }).where(eq(bookings.id, first.id))
    await testDb.update(bookings).set({ status: "checked_in" }).where(eq(bookings.id, next.id))
    await testDb.update(suites).set({ status: "occupied" }).where(eq(suites.id, catalog.suite.id))

    expect(await completeFinishedSessions(testDb, new Date(start.getTime() + 31 * MIN))).toBe(1)
    const [suite] = await testDb.select().from(suites).where(eq(suites.id, catalog.suite.id))
    expect(suite.status).toBe("occupied")
  })
})

describe("runTick", () => {
  it("runs every job in one pass and reports what each did", async () => {
    const catalog = await seedMinimalCatalog({ suiteCount: 2 })
    const start = new Date(Date.now() + 2 * 24 * HOUR)
    const late = await confirmedAt(catalog, new Date(start.getTime() - 24 * HOUR + 30 * MIN), catalog.suites[0].id)
    const upcoming = await confirmedAt(catalog, start, catalog.suites[1].id)
    const { deps } = capturingDeps()

    const result = await runTick(testDb, deps, new Date(start.getTime() - 23 * HOUR))
    expect(result).toMatchObject({ noShows: 1, completed: 0, reminders24h: 1, errors: [] })
    expect((await bookingById(late.id)).status).toBe("no_show")
    expect((await bookingById(upcoming.id)).reminder24hSentAt).not.toBeNull()
  })
})

describe("finishSession", () => {
  it("lets the desk end a session early, freeing the suite for cleaning", async () => {
    const catalog = await seedMinimalCatalog()
    const start = new Date(Date.now() + 24 * HOUR)
    const booking = await confirmedAt(catalog, start)
    expect(await finishSession(testDb, booking.id, start)).toBe(false) // not checked in yet

    await testDb.update(bookings).set({ status: "checked_in" }).where(eq(bookings.id, booking.id))
    await testDb.update(suites).set({ status: "occupied" }).where(eq(suites.id, catalog.suite.id))
    expect(await finishSession(testDb, booking.id, new Date(start.getTime() + 10 * MIN))).toBe(true)
    expect((await bookingById(booking.id)).status).toBe("completed")
    const [suite] = await testDb.select().from(suites).where(eq(suites.id, catalog.suite.id))
    expect(suite.status).toBe("cleaning")
  })
})
