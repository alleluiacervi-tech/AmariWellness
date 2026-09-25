// No `server-only` guard, deliberately: this has zero Next.js-runtime
// dependency (just `node:crypto` and `process.env.QR_SECRET`), so it
// should be directly testable in a plain vitest run — the same
// reasoning `src/server/auth/lockout.ts` documents for leaving it off.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * The QR a confirmed booking's client receives, and staff scan at the
 * door (Phase 1.5). `bookings.qrToken` stores only the random token —
 * see the column's comment in `src/server/db/schema/bookings.ts` — the
 * signature is never persisted, only recomputed here and compared at
 * scan time, so nobody with database access alone (a backup, a leaked
 * export) could mint a valid QR without `QR_SECRET` too.
 */

function secret(): string {
  const value = process.env.QR_SECRET
  if (!value) throw new Error("QR_SECRET is not set — see .env.example")
  return value
}

/** A fresh opaque token for a newly confirmed booking, stored in `bookings.qrToken`. */
export function generateQrToken(): string {
  return randomBytes(16).toString("hex")
}

function sign(bookingId: string, token: string): string {
  return createHmac("sha256", secret()).update(`${bookingId}.${token}`).digest("hex").slice(0, 32)
}

/** The string encoded into the QR image: booking id, its stored token, and a signature over both. */
export function encodeQrPayload(bookingId: string, token: string): string {
  return `${bookingId}.${token}.${sign(bookingId, token)}`
}

/**
 * Verifies the signature and returns the claimed booking id/token —
 * callers still need to check that `token` matches `bookings.qrToken`
 * for that id (this only proves the payload wasn't forged or altered,
 * not that the booking still exists or hasn't already been used).
 */
export function decodeQrPayload(payload: string): { bookingId: string; token: string } | null {
  const parts = payload.split(".")
  if (parts.length !== 3) return null
  const [bookingId, token, signature] = parts
  if (!bookingId || !token || !signature) return null
  const expected = sign(bookingId, token)
  const provided = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) return null
  return { bookingId, token }
}
