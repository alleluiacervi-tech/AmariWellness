import { beforeEach, describe, expect, it } from "vitest"
import { decodeQrPayload, encodeQrPayload, generateQrToken } from "../qr"

beforeEach(() => {
  process.env.QR_SECRET = "test-qr-secret"
})

describe("qr", () => {
  const bookingId = "b1f6c1b0-0000-4000-8000-000000000001"

  it("round-trips a booking id and token through encode/decode", () => {
    const token = generateQrToken()
    const payload = encodeQrPayload(bookingId, token)
    expect(decodeQrPayload(payload)).toEqual({ bookingId, token })
  })

  it("rejects a payload with a tampered token", () => {
    const payload = encodeQrPayload(bookingId, generateQrToken())
    const [id, , signature] = payload.split(".")
    const tampered = `${id}.deadbeefdeadbeefdeadbeefdeadbeef.${signature}`
    expect(decodeQrPayload(tampered)).toBeNull()
  })

  it("rejects a payload signed with a different secret", () => {
    const payload = encodeQrPayload(bookingId, generateQrToken())
    process.env.QR_SECRET = "a-different-secret"
    expect(decodeQrPayload(payload)).toBeNull()
  })

  it("rejects a malformed payload", () => {
    expect(decodeQrPayload("not-enough-parts")).toBeNull()
    expect(decodeQrPayload("")).toBeNull()
  })

  it("generates a fresh token every time", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateQrToken()))
    expect(tokens.size).toBe(20)
  })
})
