import { describe, expect, it } from "vitest"
import { base32Encode, generateTotpSecret, hotp, totpProvisioningUri, verifyTotp } from "../totp"

describe("hotp", () => {
  // RFC 4226 Appendix D: the official test vectors for the counter-based
  // algorithm TOTP is built on. The RFC's secret is the ASCII string
  // "12345678901234567890"; base32-encoding it here (rather than hand
  // -deriving the encoded form) still exercises the real code path,
  // since base32Encode is the same function used everywhere else.
  const rfcSecret = base32Encode(Buffer.from("12345678901234567890", "ascii"))
  const expected = [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489",
  ]

  it.each(expected.map((code, counter) => [counter, code]))(
    "matches the RFC 4226 vector for counter %i",
    (counter, code) => {
      expect(hotp(rfcSecret, counter as number)).toBe(code)
    },
  )
})

describe("verifyTotp", () => {
  const secret = generateTotpSecret()

  it("accepts the code for the current 30-second step", () => {
    const now = 1_700_000_000_000
    const code = hotp(secret, Math.floor(now / 1000 / 30))
    expect(verifyTotp(secret, code, { at: now })).toBe(true)
  })

  it("accepts a code from one step either side (clock drift)", () => {
    const now = 1_700_000_000_000
    const step = Math.floor(now / 1000 / 30)
    expect(verifyTotp(secret, hotp(secret, step - 1), { at: now })).toBe(true)
    expect(verifyTotp(secret, hotp(secret, step + 1), { at: now })).toBe(true)
  })

  it("rejects a code from two steps away", () => {
    const now = 1_700_000_000_000
    const step = Math.floor(now / 1000 / 30)
    expect(verifyTotp(secret, hotp(secret, step + 2), { at: now })).toBe(false)
  })

  it("rejects garbage input without throwing", () => {
    expect(verifyTotp(secret, "not-a-code")).toBe(false)
    expect(verifyTotp(secret, "12345")).toBe(false) // too short
    expect(verifyTotp(secret, "1234567")).toBe(false) // too long
  })

  it("two different secrets do not accept each other's codes", () => {
    const otherSecret = generateTotpSecret()
    const now = 1_700_000_000_000
    const code = hotp(secret, Math.floor(now / 1000 / 30))
    expect(verifyTotp(otherSecret, code, { at: now })).toBe(false)
  })
})

describe("totpProvisioningUri", () => {
  it("produces a scannable otpauth:// URI with the account label and issuer", () => {
    const uri = totpProvisioningUri("JBSWY3DPEHPK3PXP", "owner@amari.rw")
    expect(uri).toMatch(/^otpauth:\/\/totp\//)
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP")
    expect(uri).toContain("issuer=Amari")
    expect(decodeURIComponent(uri)).toContain("Amari:owner@amari.rw")
  })
})
