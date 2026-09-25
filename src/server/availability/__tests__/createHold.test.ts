import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings } from "../../db/schema"
import { createHold, SlotTakenError } from "../createHold"

const START = new Date("2027-01-10T10:00:00Z")
const END = new Date("2027-01-10T10:45:00Z")

describe("createHold", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("creates a held booking on the first free suite", async () => {
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
    expect(booking.status).toBe("held")
    expect(booking.holdExpiresAt).not.toBeNull()
  })

  it("throws SlotTakenError when every suite is already taken for the span", async () => {
    const { location, sessionType, client } = await seedMinimalCatalog()
    await createHold(testDb, {
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

    await expect(
      createHold(testDb, {
        locationId: location.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: START,
        endAt: END,
        priceAtBookingRwf: 15000,
        offPeak: false,
        holdMinutes: 10,
        source: "online",
      }),
    ).rejects.toThrow(SlotTakenError)
  })

  it("self-heals a stale held booking on the same suite, then reuses the freed slot", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    const [stale] = await testDb
      .insert(bookings)
      .values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: START,
        endAt: END,
        status: "held",
        holdExpiresAt: new Date(Date.now() - 60_000), // expired a minute ago
        priceAtBookingRwf: 15000,
      })
      .returning()

    const fresh = await createHold(testDb, {
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

    expect(fresh.suiteId).toBe(suite.id)
    expect(fresh.id).not.toBe(stale.id)

    const [staleAfter] = await testDb.select().from(bookings).where(eq(bookings.id, stale.id))
    expect(staleAfter.status).toBe("cancelled")
  })

  it("honors a pinned suiteId for a staff-created booking", async () => {
    const {
      location,
      suites: [, suiteTwo],
      sessionType,
      client,
    } = await seedMinimalCatalog({ suiteCount: 2 })
    const booking = await createHold(testDb, {
      locationId: location.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: START,
      endAt: END,
      priceAtBookingRwf: 15000,
      offPeak: false,
      holdMinutes: 10,
      source: "walk_in",
      suiteId: suiteTwo.id,
    })
    expect(booking.suiteId).toBe(suiteTwo.id)
  })
})
