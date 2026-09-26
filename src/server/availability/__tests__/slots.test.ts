import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, holidays, maintenanceBlocks } from "../../db/schema"
import { asc, eq } from "drizzle-orm"
import { suites } from "../../db/schema"
import { getDaySlots } from "../slots"

// 2027-01-10 is a Sunday (weekend hours); 2027-01-11 is a Monday (weekday hours, quiet hours apply before 16:00).
const WEEKDAY = "2027-01-11"

describe("getDaySlots", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("lists every hourly slot as available with no bookings", async () => {
    const { location, sessionType } = await seedMinimalCatalog()
    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => s.available)).toBe(true)
  })

  it("marks quiet hours before the location's quietHoursEndHour on a weekday", async () => {
    const { location, sessionType } = await seedMinimalCatalog()
    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    const morning = slots.find((s) => s.hour === 10)
    const evening = slots.find((s) => s.hour === 18)
    expect(morning?.quietHours).toBe(true)
    expect(evening?.quietHours).toBe(false)
  })

  it("marks a slot unavailable once every suite is booked for it", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date(`${WEEKDAY}T10:00:00+02:00`),
      endAt: new Date(`${WEEKDAY}T10:45:00+02:00`),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    const tenOClock = slots.find((s) => s.hour === 10)
    expect(tenOClock?.available).toBe(false)
    expect(tenOClock?.suitesFree).toBe(0)
  })

  it("doesn't count a booking being moved against its own time", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    const [own] = await testDb
      .insert(bookings)
      .values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date(`${WEEKDAY}T10:00:00+02:00`),
        endAt: new Date(`${WEEKDAY}T10:45:00+02:00`),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      })
      .returning()

    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id, { excludeBookingId: own.id })
    expect(slots.find((s) => s.hour === 10)?.available).toBe(true)
  })

  it("keeps a slot available on another suite when only one of several is booked", async () => {
    const { location, sessionType, client } = await seedMinimalCatalog({ suiteCount: 2 })
    const suiteRows = await testDb.select().from(suites).where(eq(suites.locationId, location.id)).orderBy(asc(suites.sortOrder))
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suiteRows[0].id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date(`${WEEKDAY}T10:00:00+02:00`),
      endAt: new Date(`${WEEKDAY}T10:45:00+02:00`),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    const tenOClock = slots.find((s) => s.hour === 10)
    expect(tenOClock?.available).toBe(true)
    expect(tenOClock?.suitesFree).toBe(1)
  })

  it("returns no slots on a day marked closed by a holiday", async () => {
    const { location, sessionType } = await seedMinimalCatalog()
    await testDb.insert(holidays).values({ locationId: location.id, date: WEEKDAY, label: "Test holiday", closed: true })
    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    expect(slots).toHaveLength(0)
  })

  it("excludes a slot blocked by a maintenance block on the only suite", async () => {
    const { location, suite, sessionType } = await seedMinimalCatalog()
    await testDb.insert(maintenanceBlocks).values({
      suiteId: suite.id,
      startAt: new Date(`${WEEKDAY}T09:30:00+02:00`),
      endAt: new Date(`${WEEKDAY}T11:00:00+02:00`),
      reason: "Repair",
    })
    const slots = await getDaySlots(testDb, location, WEEKDAY, sessionType.id)
    const tenOClock = slots.find((s) => s.hour === 10)
    expect(tenOClock?.available).toBe(false)
  })
})
