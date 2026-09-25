// No `server-only` guard here: this module is imported from standalone
// scripts (seed.ts) run outside Next's bundler, where `server-only`
// throws unconditionally rather than acting as a no-op (it only
// resolves correctly inside Next's own build). The `node:crypto` import
// below already makes this unusable from a browser bundle.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

/**
 * scrypt rather than bcrypt: it's in Node's standard library, so there's
 * no native binding to compile or trust — a real concern for a small
 * team's CI and hosting. scrypt is a well-studied, deliberately
 * memory-hard password hash, which is the property that matters here.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":")
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  // Buffers must be equal length for timingSafeEqual; mismatched length
  // means "definitely wrong" without leaking anything by throwing.
  if (derivedKey.length !== expected.length) return false
  return timingSafeEqual(derivedKey, expected)
}
