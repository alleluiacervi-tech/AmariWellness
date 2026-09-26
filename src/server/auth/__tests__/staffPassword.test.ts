import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { closeTestDatabase, resetTestDatabase, testDb } from "../../db/test-helpers"
import { staffAuthSessions, staffUsers } from "../../db/schema"
import { hashPassword, verifyPassword } from "../password"
import { MAX_ATTEMPTS } from "../lockout"
import { changeOwnPassword, PasswordError, passwordProblem, SEED_DEFAULT_PASSWORD, setStaffPassword } from "../staffPassword"

const NEW_PASSWORD = "quiet chairs at noon"

async function seedStaff(password = SEED_DEFAULT_PASSWORD) {
  const [staff] = await testDb
    .insert(staffUsers)
    .values({
      email: "owner@amari.test",
      name: "Test Owner",
      role: "owner",
      passwordHash: await hashPassword(password),
      totpSecret: "JBSWY3DPEHPK3PXP",
    })
    .returning()
  return staff
}

async function sessionFor(staffUserId: string) {
  const [session] = await testDb
    .insert(staffAuthSessions)
    .values({ staffUserId, expiresAt: new Date(Date.now() + 60 * 60_000), mfaVerifiedAt: new Date() })
    .returning()
  return session
}

async function reload(id: string) {
  const [row] = await testDb.select().from(staffUsers).where(eq(staffUsers.id, id))
  return row
}

beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("passwordProblem", () => {
  it("wants at least 12 characters, and never the public seed password", () => {
    expect(passwordProblem("short")).toMatch(/at least 12/)
    expect(passwordProblem("x".repeat(201))).toMatch(/at most 200/)
    expect(passwordProblem(NEW_PASSWORD)).toBeNull()
    expect(passwordProblem(SEED_DEFAULT_PASSWORD)).not.toBeNull()
  })
})

describe("setStaffPassword", () => {
  it("replaces the password, records that they chose it, clears a lockout and signs out every other session", async () => {
    const staff = await seedStaff()
    await testDb.update(staffUsers).set({ failedAttempts: 3, lockedUntil: new Date(Date.now() + 60_000) }).where(eq(staffUsers.id, staff.id))
    const current = await sessionFor(staff.id)
    await sessionFor(staff.id)
    await sessionFor(staff.id)

    const result = await setStaffPassword(testDb, staff.id, NEW_PASSWORD, { keepSessionId: current.id })
    expect(result.sessionsEnded).toBe(2)

    const after = await reload(staff.id)
    expect(await verifyPassword(NEW_PASSWORD, after.passwordHash)).toBe(true)
    expect(await verifyPassword(SEED_DEFAULT_PASSWORD, after.passwordHash)).toBe(false)
    expect(after.passwordChangedAt).not.toBeNull()
    expect(after.failedAttempts).toBe(0)
    expect(after.lockedUntil).toBeNull()
    expect(after.totpSecret).toBe("JBSWY3DPEHPK3PXP")
    const left = await testDb.select().from(staffAuthSessions).where(eq(staffAuthSessions.staffUserId, staff.id))
    expect(left.map((s) => s.id)).toEqual([current.id])
  })

  it("from the command line: signs out everywhere, can leave it temporary and can reset two-step verification", async () => {
    const staff = await seedStaff()
    await sessionFor(staff.id)
    const result = await setStaffPassword(testDb, staff.id, NEW_PASSWORD, { temporary: true, resetTwoFactor: true })
    expect(result.sessionsEnded).toBe(1)
    const after = await reload(staff.id)
    expect(after.passwordChangedAt).toBeNull()
    expect(after.totpSecret).toBeNull()
  })

  it("refuses a password that breaks the rules, changing nothing", async () => {
    const staff = await seedStaff()
    await expect(setStaffPassword(testDb, staff.id, "too short")).rejects.toThrow(PasswordError)
    await expect(setStaffPassword(testDb, staff.id, SEED_DEFAULT_PASSWORD)).rejects.toThrow(PasswordError)
    expect(await verifyPassword(SEED_DEFAULT_PASSWORD, (await reload(staff.id)).passwordHash)).toBe(true)
  })
})

describe("changeOwnPassword", () => {
  it("needs the current password, and a wrong guess counts towards the lockout", async () => {
    const staff = await seedStaff()
    const current = await sessionFor(staff.id)
    const input = { staffUserId: staff.id, newPassword: NEW_PASSWORD, keepSessionId: current.id }

    await expect(changeOwnPassword(testDb, { ...input, currentPassword: "a wrong guess" })).rejects.toThrow("That isn't your current password.")
    expect((await reload(staff.id)).failedAttempts).toBe(1)

    await changeOwnPassword(testDb, { ...input, currentPassword: SEED_DEFAULT_PASSWORD })
    expect(await verifyPassword(NEW_PASSWORD, (await reload(staff.id)).passwordHash)).toBe(true)
  })

  it("locks after too many wrong guesses, then refuses even the right one until the lock runs out", async () => {
    const staff = await seedStaff()
    const current = await sessionFor(staff.id)
    const input = { staffUserId: staff.id, newPassword: NEW_PASSWORD, keepSessionId: current.id }
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await expect(changeOwnPassword(testDb, { ...input, currentPassword: "a wrong guess" })).rejects.toThrow(PasswordError)
    }
    await expect(changeOwnPassword(testDb, { ...input, currentPassword: SEED_DEFAULT_PASSWORD })).rejects.toThrow(/Too many attempts/)
  })

  it("won't keep the same password", async () => {
    const staff = await seedStaff(NEW_PASSWORD)
    const current = await sessionFor(staff.id)
    await expect(
      changeOwnPassword(testDb, { staffUserId: staff.id, currentPassword: NEW_PASSWORD, newPassword: NEW_PASSWORD, keepSessionId: current.id }),
    ).rejects.toThrow(/different from your current one/)
  })
})
