import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { bookings, suites } from "../../db/schema"
import { createHold } from "../../availability/createHold"
import { recordWalkInPayment } from "../../availability/confirm"
import { encodeQrPayload } from "../../qr"
import { checkIn, lookupQr } from "../checkIn"
import { getFloor } from "../floor"

process.env.QR_SECRET ??= "test-qr-secret"

// 08:00 UTC = 10:00 in Kigali on Sunday 10 January.
const START = new Date("2027-01-10T08:00:00Z")
const SAME_DAY = new Date("2027-01-10T07:50:00Z")
const STAFF = "00000000-0000-4000-8000-000000000099"

async function setup(options: { confirm?: boolean } = {}) {
  const catalog = await seedMinimalCatalog()
  const held = await createHold(testDb, {
    locationId: catalog.location.id,
    sessionTypeId: catalog.sessionType.id,
    clientId: catalog.client.id,
    startAt: START,
    endAt: new Date(START.getTime() + 45 * 60_000),
    priceAtBookingRwf: 15000,
    offPeak: false,
    holdMinutes: 10,
    source: "online",
  })
  if (options.confirm === false) return { ...catalog, booking: held, payload: encodeQrPayload(held.id, "no-token-yet") }
  const booking = await recordWalkInPayment(
    testDb,
    held.id,
    { locationId: catalog.location.id, clientId: catalog.client.id, amountRwf: 15000, method: "momo" },
    STAFF,
  )
  return { ...catalog, booking, payload: encodeQrPayload(booking.id, booking.qrToken!) }
}

beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("lookupQr", () => {
  it("shows the client, session and suite for a valid code on the day", async () => {
    const { booking, payload, suite } = await setup()
    const result = await lookupQr(testDb, payload, SAME_DAY)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.preview).toMatchObject({
      bookingId: booking.id,
      clientName: "Alex Guest",
      sessionName: "The Half Hour",
      suiteName: suite.name,
      status: "confirmed",
    })
    expect(result.preview.reference).toMatch(/^AM-[0-9A-F]{8}$/)
  })

  it("rejects a forged or altered code before looking anything up", async () => {
    const { payload } = await setup()
    const tampered = payload.slice(0, -1) + (payload.endsWith("0") ? "1" : "0")
    expect(await lookupQr(testDb, tampered, SAME_DAY)).toMatchObject({ ok: false, problem: "unreadable" })
    expect(await lookupQr(testDb, "https://example.com/not-ours", SAME_DAY)).toMatchObject({ ok: false, problem: "unreadable" })
  })

  it("only works on the day of the booking", async () => {
    const { payload } = await setup()
    const dayBefore = await lookupQr(testDb, payload, new Date("2027-01-09T08:00:00Z"))
    expect(dayBefore).toMatchObject({ ok: false, problem: "wrong_day" })
    if (!dayBefore.ok) expect(dayBefore.message).toContain("Sunday 10 January at 10:00")
    // 22:30 UTC on the 9th is already 00:30 on the 10th in Kigali — the right day.
    expect((await lookupQr(testDb, payload, new Date("2027-01-09T22:30:00Z"))).ok).toBe(true)
  })

  it("rejects a genuine signature for a token the booking no longer carries", async () => {
    const { booking, payload } = await setup()
    await testDb.update(bookings).set({ qrToken: "a-newer-token" }).where(eq(bookings.id, booking.id))
    expect(await lookupQr(testDb, payload, SAME_DAY)).toMatchObject({ ok: false, problem: "superseded" })
  })

  it("explains a cancelled or unpaid booking", async () => {
    const { booking, payload } = await setup()
    await testDb.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, booking.id))
    expect(await lookupQr(testDb, payload, SAME_DAY)).toMatchObject({ ok: false, problem: "closed" })

    await resetTestDatabase()
    const unpaid = await setup({ confirm: false })
    await testDb.update(bookings).set({ qrToken: "no-token-yet" }).where(eq(bookings.id, unpaid.booking.id))
    expect(await lookupQr(testDb, unpaid.payload, SAME_DAY)).toMatchObject({ ok: false, problem: "not_paid" })
  })
})

describe("checkIn", () => {
  it("checks the booking in, records who did it, and marks the suite occupied", async () => {
    const { booking, payload, suite } = await setup()
    const result = await checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY)
    expect(result).toMatchObject({ ok: true, preview: { status: "checked_in" } })

    const [after] = await testDb.select().from(bookings).where(eq(bookings.id, booking.id))
    expect(after.status).toBe("checked_in")
    expect(after.checkedInAt?.getTime()).toBe(SAME_DAY.getTime())
    expect(after.checkedInByStaffId).toBe(STAFF)
    const [suiteAfter] = await testDb.select().from(suites).where(eq(suites.id, suite.id))
    expect(suiteAfter.status).toBe("occupied")
  })

  it("works only once — a second scan says when it was used", async () => {
    const { booking, payload } = await setup()
    await checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY)
    const again = await checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY)
    expect(again).toMatchObject({ ok: false, problem: "already_checked_in" })
    if (!again.ok) expect(again.message).toContain("Already checked in at 09:50")
  })

  it("lets exactly one of two simultaneous scans succeed", async () => {
    const { booking, payload } = await setup()
    const results = await Promise.all([
      checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY),
      checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.find((r) => !r.ok)).toMatchObject({ problem: "already_checked_in" })
  })

  it("supports a manual check-in without a code, under the same day rule", async () => {
    const { booking } = await setup()
    expect(await checkIn(testDb, { bookingId: booking.id, staffUserId: STAFF }, new Date("2027-01-11T08:00:00Z"))).toMatchObject({
      ok: false,
      problem: "wrong_day",
    })
    expect(await checkIn(testDb, { bookingId: booking.id, staffUserId: STAFF }, SAME_DAY)).toMatchObject({ ok: true })
  })

  it("refuses a code that belongs to a different booking than the one being checked in", async () => {
    const { payload } = await setup()
    const otherId = "00000000-0000-4000-8000-000000000123"
    expect(await checkIn(testDb, { bookingId: otherId, payload, staffUserId: STAFF }, SAME_DAY)).toMatchObject({
      ok: false,
      problem: "unreadable",
    })
  })
})

describe("getFloor", () => {
  it("shows who is in each suite and who is next", async () => {
    const { booking, payload, suite, location } = await setup()
    const before = await getFloor(testDb, location.id, SAME_DAY)
    expect(before).toHaveLength(1)
    expect(before[0]).toMatchObject({ id: suite.id, status: "ready", current: null, stillToCome: 1 })
    expect(before[0].next?.bookingId).toBe(booking.id)

    await checkIn(testDb, { bookingId: booking.id, payload, staffUserId: STAFF }, SAME_DAY)
    const [after] = await getFloor(testDb, location.id, SAME_DAY)
    expect(after).toMatchObject({ status: "occupied", next: null, stillToCome: 0 })
    expect(after.current?.clientName).toBe("Alex Guest")
    expect(after.current?.sessionEndsAt.toISOString()).toBe("2027-01-10T08:30:00.000Z")
  })
})
