import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings } from "../../db/schema"
import { expireStaleHolds } from "../expireStaleHolds"

describe("expireStaleHolds", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("cancels every held booking whose hold has expired, and leaves the rest alone", async () => {
    const { location, suites, sessionType, client } = await seedMinimalCatalog({ suiteCount: 2 })
    const [expired] = await testDb
      .insert(bookings)
      .values({
        locationId: location.id,
        suiteId: suites[0].id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2027-01-10T10:00:00Z"),
        endAt: new Date("2027-01-10T10:45:00Z"),
        status: "held",
        holdExpiresAt: new Date(Date.now() - 60_000),
        priceAtBookingRwf: 15000,
      })
      .returning()
    const [stillLive] = await testDb
      .insert(bookings)
      .values({
        locationId: location.id,
        suiteId: suites[1].id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2027-01-10T10:00:00Z"),
        endAt: new Date("2027-01-10T10:45:00Z"),
        status: "held",
        holdExpiresAt: new Date(Date.now() + 5 * 60_000),
        priceAtBookingRwf: 15000,
      })
      .returning()

    const count = await expireStaleHolds(testDb)
    expect(count).toBe(1)

    const [expiredAfter] = await testDb.select().from(bookings).where(eq(bookings.id, expired.id))
    expect(expiredAfter.status).toBe("cancelled")
    const [stillLiveAfter] = await testDb.select().from(bookings).where(eq(bookings.id, stillLive.id))
    expect(stillLiveAfter.status).toBe("held")
  })

  it("returns 0 when nothing is stale", async () => {
    const count = await expireStaleHolds(testDb)
    expect(count).toBe(0)
  })
})
