import { describe, expect, it } from "vitest"
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../otp"

describe("otp", () => {
  it("generates a 6-digit code, zero-padded", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode()
      expect(code).toMatch(/^\d{6}$/)
    }
  })

  it("verifies a code against its own hash", () => {
    const code = generateOtpCode()
    expect(verifyOtpCode(code, hashOtpCode(code))).toBe(true)
  })

  it("rejects a wrong code", () => {
    const code = "123456"
    const wrong = "654321"
    expect(verifyOtpCode(wrong, hashOtpCode(code))).toBe(false)
  })

  it("rejects a non-6-digit string", () => {
    expect(verifyOtpCode("12345", hashOtpCode("123456"))).toBe(false)
    expect(verifyOtpCode("abcdef", hashOtpCode("123456"))).toBe(false)
    expect(verifyOtpCode("", hashOtpCode("123456"))).toBe(false)
  })

  it("tolerates surrounding whitespace in the entered code", () => {
    const code = "042817"
    expect(verifyOtpCode(" 042817 ", hashOtpCode(code))).toBe(true)
  })

  it("never stores the plain code — hash is a fixed-length hex digest, not the code itself", () => {
    const code = "042817"
    const hash = hashOtpCode(code)
    expect(hash).not.toContain(code)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})
