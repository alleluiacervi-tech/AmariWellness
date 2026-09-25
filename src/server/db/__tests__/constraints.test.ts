/**
 * These tests exist to prove the database-level guarantees in
 * migration 0001 actually hold — not to re-test Drizzle or Postgres
 * themselves. Each one matches a claim made in CLAUDE.md §3–4.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { sql } from "drizzle-orm"
import { closeTestDatabase, expectPgError, resetTestDatabase, testDb } from "../test-helpers"
import { bookings, clients, ledgerEntries, locations, sessionTypes, suites } from "../schema"

async function seedMinimalCatalog() {
  const [location] = await testDb
    .insert(locations)
    .values({ name: "Test Location", slug: "test", street: "Test St", neighborhood: "Test", city: "Kigali" })
    .returning()
  const [suite] = await testDb.insert(suites).values({ locationId: location.id, name: "Suite One" }).returning()
  const [sessionType] = await testDb
    .insert(sessionTypes)
    .values({
      locationId: location.id,
      slug: "half",
      name: "The Half Hour",
      durationMinutes: 30,
      label: "x",
      intro: "x",
      summary: "x",
      about: "x",
    })
    .returning()
  const [client] = await testDb.insert(clients).values({ name: "Alex Guest", phone: "+250780000001" }).returning()
  return { location, suite, sessionType, client }
}

describe("database constraints", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("rejects a second booking that overlaps an existing live booking on the same suite", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2026-10-01T10:00:00Z"),
      endAt: new Date("2026-10-01T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    await expectPgError(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:15:00Z"), // overlaps the booking above
        endAt: new Date("2026-10-01T11:00:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      }),
      /bookings_no_overlap/,
    )
  })

  it("allows a booking immediately after another ends on the same suite", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2026-10-01T10:00:00Z"),
      endAt: new Date("2026-10-01T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    await expect(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:45:00Z"),
        endAt: new Date("2026-10-01T11:30:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      }),
    ).resolves.toBeDefined()
  })

  it("does not let a cancelled booking block a new one at the same time", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2026-10-01T10:00:00Z"),
      endAt: new Date("2026-10-01T10:45:00Z"),
      status: "cancelled",
      priceAtBookingRwf: 15000,
    })

    await expect(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:00:00Z"),
        endAt: new Date("2026-10-01T10:45:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      }),
    ).resolves.toBeDefined()
  })

  it("still blocks an overlap across two different session types on the same suite", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    const [longer] = await testDb
      .insert(sessionTypes)
      .values({
        locationId: location.id,
        slug: "full",
        name: "The Full Session",
        durationMinutes: 60,
        label: "x",
        intro: "x",
        summary: "x",
        about: "x",
      })
      .returning()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2026-10-01T10:00:00Z"),
      endAt: new Date("2026-10-01T10:45:00Z"),
      status: "held",
      priceAtBookingRwf: 15000,
    })

    await expectPgError(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: longer.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:30:00Z"),
        endAt: new Date("2026-10-01T11:30:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 25000,
      }),
      /bookings_no_overlap/,
    )
  })

  it("allows the same time slot on a different suite", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    const [otherSuite] = await testDb
      .insert(suites)
      .values({ locationId: location.id, name: "Suite Two" })
      .returning()
    await testDb.insert(bookings).values({
      locationId: location.id,
      suiteId: suite.id,
      sessionTypeId: sessionType.id,
      clientId: client.id,
      startAt: new Date("2026-10-01T10:00:00Z"),
      endAt: new Date("2026-10-01T10:45:00Z"),
      status: "confirmed",
      priceAtBookingRwf: 15000,
    })

    await expect(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: otherSuite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:00:00Z"),
        endAt: new Date("2026-10-01T10:45:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      }),
    ).resolves.toBeDefined()
  })

  it("rejects a booking whose end is not after its start", async () => {
    const { location, suite, sessionType, client } = await seedMinimalCatalog()
    await expectPgError(
      testDb.insert(bookings).values({
        locationId: location.id,
        suiteId: suite.id,
        sessionTypeId: sessionType.id,
        clientId: client.id,
        startAt: new Date("2026-10-01T10:00:00Z"),
        endAt: new Date("2026-10-01T10:00:00Z"),
        status: "confirmed",
        priceAtBookingRwf: 15000,
      }),
      /bookings_end_after_start/,
    )
  })

  it("enforces one phone number per client, but allows any number of clients with no phone", async () => {
    await testDb.insert(clients).values({ name: "First", phone: "+250780000009" })
    await expectPgError(
      testDb.insert(clients).values({ name: "Impersonator", phone: "+250780000009" }),
      /clients_phone_unique/,
    )
    await expect(
      testDb.insert(clients).values([{ name: "Walk-in A" }, { name: "Walk-in B" }]),
    ).resolves.toBeDefined()
  })

  describe("the ledger is append-only", () => {
    async function seedOneEntry() {
      const { location } = await seedMinimalCatalog()
      const [entry] = await testDb
        .insert(ledgerEntries)
        .values({ locationId: location.id, type: "payment_received", amountRwf: 15000 })
        .returning()
      return entry
    }

    it("rejects an UPDATE", async () => {
      const entry = await seedOneEntry()
      await expectPgError(
        testDb.update(ledgerEntries).set({ amountRwf: 999_999 }).where(sql`${ledgerEntries.id} = ${entry.id}`),
        /append-only/,
      )
    })

    it("rejects a DELETE", async () => {
      const entry = await seedOneEntry()
      await expectPgError(
        testDb.delete(ledgerEntries).where(sql`${ledgerEntries.id} = ${entry.id}`),
        /append-only/,
      )
    })

    it("requires a reason for a refund", async () => {
      const { location } = await seedMinimalCatalog()
      await expectPgError(
        testDb.insert(ledgerEntries).values({ locationId: location.id, type: "refund", amountRwf: -5000 }),
        /ledger_entries_reason_required/,
      )
      await expect(
        testDb.insert(ledgerEntries).values({
          locationId: location.id,
          type: "refund",
          amountRwf: -5000,
          reason: "Client cancelled outside the window, goodwill refund",
        }),
      ).resolves.toBeDefined()
    })

    it("rejects a payment recorded with a negative amount", async () => {
      const { location } = await seedMinimalCatalog()
      await expectPgError(
        testDb.insert(ledgerEntries).values({ locationId: location.id, type: "payment_received", amountRwf: -1 }),
        /ledger_entries_amount_sign/,
      )
    })

    it("rejects a refund recorded with a positive amount", async () => {
      const { location } = await seedMinimalCatalog()
      await expectPgError(
        testDb
          .insert(ledgerEntries)
          .values({ locationId: location.id, type: "refund", amountRwf: 1, reason: "typo test" }),
        /ledger_entries_amount_sign/,
      )
    })
  })
})
