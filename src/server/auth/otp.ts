/**
 * The one-time code a client enters to sign in (CLAUDE.md §3: no
 * passwords, an account is created automatically from a verified phone
 * number). No `server-only` guard and no `db` import, deliberately, the
 * same reasoning as `totp.ts`/`password.ts`: pure generation and
 * hashing, directly testable without Next's runtime. The actual
 * request/verify flow (storing a `client_otp_codes` row, checking
 * `attempts`/`expiresAt`) lives in `src/server/client-auth/actions.ts`.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto"

const CODE_DIGITS = 6

/** A fresh 6-digit code, e.g. "042817" — leading zeros kept. */
export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0")
}

/**
 * SHA-256 is enough here, unlike `password.ts`'s scrypt: a code is
 * short-lived (minutes), single-use, and rate-limited by `attempts` —
 * the threat this defends against is a stolen database dump, not online
 * brute force, which `attempts` already stops at the application layer.
 */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export function verifyOtpCode(code: string, hash: string): boolean {
  const trimmed = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(trimmed)) return false
  const expected = Buffer.from(hashOtpCode(trimmed))
  const actual = Buffer.from(hash)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
