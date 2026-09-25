import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "../password"

describe("password hashing", () => {
  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true)
  })

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(await verifyPassword("wrong password", hash)).toBe(false)
  })

  it("never stores the password itself in the hash", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(hash).not.toContain("correct horse battery staple")
  })

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("same password")
    const b = await hashPassword("same password")
    expect(a).not.toBe(b)
    expect(await verifyPassword("same password", a)).toBe(true)
    expect(await verifyPassword("same password", b)).toBe(true)
  })

  it("rejects a malformed stored value instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false)
    expect(await verifyPassword("anything", "")).toBe(false)
  })
})
