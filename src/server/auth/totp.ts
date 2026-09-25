/**
 * RFC 6238 TOTP (the same algorithm Google Authenticator, 1Password and
 * every other authenticator app implement), from `node:crypto` alone —
 * no dependency, because this is the one piece of the auth system a
 * supply-chain compromise would be most worth planting in.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const STEP_SECONDS = 30
const CODE_DIGITS = 6

export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ""
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** A fresh 160-bit secret, base32-encoded for display and for authenticator apps. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

/** The `otpauth://` URI an authenticator app scans (as a QR code) to enroll the secret. */
export function totpProvisioningUri(secret: string, accountLabel: string, issuer = "Amari"): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${CODE_DIGITS}&period=${STEP_SECONDS}`
}

export function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac("sha1", key).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(binary % 10 ** CODE_DIGITS).padStart(CODE_DIGITS, "0")
}

/**
 * Checks a 6-digit code against the secret, allowing the previous and
 * next 30-second step either side so a slightly slow phone clock or a
 * code entered right at the boundary still works.
 */
export function verifyTotp(secret: string, code: string, { at = Date.now(), windowSteps = 1 } = {}): boolean {
  const trimmed = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(trimmed)) return false
  const currentStep = Math.floor(at / 1000 / STEP_SECONDS)
  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const expected = hotp(secret, currentStep + offset)
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(trimmed))) return true
  }
  return false
}
