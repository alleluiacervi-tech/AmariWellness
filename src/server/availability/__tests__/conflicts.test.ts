import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, maintenanceBlocks } from "../../db/schema"
import { pickAvailableSuite, suiteHasConflict } from "../conflicts"

describe("suiteHasConflict / pickAvailableSuite", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("reports no conflict for an empty suite", async () => {
    const { suite } = await seedMinimalCatalog()
    const conflict = await suiteHasConflict(testDb, suite.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(conflict).toBe(false)
  })

  it("reports a conflict against a confirmed booking that overlaps", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2027-01-10T10:00:00Z"),
      endAt: new Date("2027-01-10T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })
    const conflict = await suiteHasConflict(testDb, suite.id, new Date("2027-01-10T10:30:00Z"), new Date("2027-01-10T11:15:00Z"))
    expect(conflict).toBe(true)
  })

  it("does not count a held booking whose hold already expired", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2027-01-10T10:00:00Z"),
      endAt: new Date("2027-01-10T10:45:00Z"),
      status: "held",
      holdExpiresAt: new Date(Date.now() - 60_000), // expired a minute ago
      priceAtBookingRwf: 15000,
    })
    const conflict = await suiteHasConflict(testDb, suite.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(conflict).toBe(false)
  })

  it("counts a held booking whose hold has not expired yet", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2027-01-10T10:00:00Z"),
      endAt: new Date("2027-01-10T10:45:00Z"),
      status: "held",
      holdExpiresAt: new Date(Date.now() + 5 * 60_000),
      priceAtBookingRwf: 15000,
    })
    const conflict = await suiteHasConflict(testDb, suite.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(conflict).toBe(true)
  })

  it("reports a conflict against an overlapping maintenance block", async () => {
    const { suite } = await seedMinimalCatalog()
    await testDb.insert(maintenanceBlocks).values({
      suiteId: suite.id,
      startAt: new Date("2027-01-10T09:00:00Z"),
      endAt: new Date("2027-01-10T11:00:00Z"),
      reason: "Chair repair",
    })
    const conflict = await suiteHasConflict(testDb, suite.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(conflict).toBe(true)
  })

  it("picks the first active suite with no conflict, in sortOrder", async () => {
    const {
      location,
      suites: [suiteOne, suiteTwo],
      sessionType,
      client,
    } = await seedMinimalCatalog({ suiteCount: 2 })

    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suiteOne.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2027-01-10T10:00:00Z"),
      endAt: new Date("2027-01-10T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    const picked = await pickAvailableSuite(testDb, location.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(picked).toBe(suiteTwo.id)
  })

  it("returns null when every suite conflicts", async () => {
    const { location, suites, sessionType, client } = await seedMinimalCatalog({ suiteCount: 2 })
    for (const suite of suites) {
      await testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2027-01-10T10:00:00Z"),
        endAt: new Date("2027-01-10T10:45:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      })
    }
    const picked = await pickAvailableSuite(testDb, location.id, new Date("2027-01-10T10:00:00Z"), new Date("2027-01-10T10:45:00Z"))
    expect(picked).toBeNull()
  })
})
