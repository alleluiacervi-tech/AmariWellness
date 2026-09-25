import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, testDb } from "../../db/test-helpers"
import { staffUsers } from "../../db/schema"
import { hashPassword } from "../password"
import { clearFailedAttempts, lockoutMessage, MAX_ATTEMPTS, registerFailedAttempt } from "../lockout"

async function seedStaff() {
  const [staff] = await testDb
    .insert(staffUsers)
    .values({
      email: "test@amari.rw",
      name: "Test Staff",
      role: "owner",
      passwordHash: await hashPassword("irrelevant"),
    })
    .returning()
  return staff
}

async function reload(id: string) {
  const [row] = await testDb.select().from(staffUsers).where(eq(staffUsers.id, id)).limit(1)
  return row
}

describe("login lockout", () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })
  afterAll(async () => {
    await closeTestDatabase()
  })

  it("increments failed attempts one at a time, below the threshold", async () => {
    const staff = await seedStaff()
    await registerFailedAttempt(testDb, staff.id, staff.failedAttempts)
    let row = await reload(staff.id)
    expect(row.failedAttempts).toBe(1)
    expect(row.lockedUntil).toBeNull()

    await registerFailedAttempt(testDb, staff.id, row.failedAttempts)
    row = await reload(staff.id)
    expect(row.failedAttempts).toBe(2)
    expect(row.lockedUntil).toBeNull()
  })

  it(`locks the account on the ${MAX_ATTEMPTS}th failed attempt and resets the counter`, async () => {
    const staff = await seedStaff()
    let attempts = staff.failedAttempts
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      await registerFailedAttempt(testDb, staff.id, attempts)
      attempts = (await reload(staff.id)).failedAttempts
    }
    const beforeLock = await reload(staff.id)
    expect(beforeLock.lockedUntil).toBeNull()

    await registerFailedAttempt(testDb, staff.id, beforeLock.failedAttempts)
    const locked = await reload(staff.id)
    expect(locked.lockedUntil).toBeInstanceOf(Date)
    expect(locked.lockedUntil!.getTime()).toBeGreaterThan(Date.now())
    // The counter resets once locked, so unlocking doesn't start halfway to the next lockout.
    expect(locked.failedAttempts).toBe(0)
  })

  it("clears both the counter and the lock on a successful login", async () => {
    const staff = await seedStaff()
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const current = await reload(staff.id)
      await registerFailedAttempt(testDb, staff.id, current.failedAttempts)
    }
    expect((await reload(staff.id)).lockedUntil).not.toBeNull()

    await clearFailedAttempts(testDb, staff.id)
    const cleared = await reload(staff.id)
    expect(cleared.failedAttempts).toBe(0)
    expect(cleared.lockedUntil).toBeNull()
  })

  it("describes the remaining lockout time in whole minutes, rounded up", () => {
    const inNinetySeconds = new Date(Date.now() + 90_000)
    expect(lockoutMessage(inNinetySeconds)).toBe("Too many attempts. Try again in 2 minutes.")
    const inThirtySeconds = new Date(Date.now() + 30_000)
    expect(lockoutMessage(inThirtySeconds)).toBe("Too many attempts. Try again in 1 minute.")
  })
})
