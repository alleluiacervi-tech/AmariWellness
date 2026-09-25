import { eq } from "drizzle-orm"
import type { Database } from "../db/client"
import { staffUsers } from "../db/schema"

/**
 * Login/TOTP lockout. Takes the database as a parameter rather than
 * importing the app's singleton (`../db/client`, guarded with
 * `server-only`) so this file has no Next.js-runtime dependency at all
 * — it can be exercised directly in a plain test against a real
 * database (`__tests__/lockout.test.ts`, passing `testDb`), the same
 * way `actions.ts` passes the app's real `db`. Only `cookies()`/
 * `redirect()` genuinely need a running Next server to test (Playwright,
 * not vitest) — this logic doesn't, so it shouldn't be trapped behind
 * the same restriction.
 */
export const MAX_ATTEMPTS = 5
export const LOCKOUT_MS = 15 * 60 * 1000

export async function registerFailedAttempt(db: Database, staffId: string, currentAttempts: number) {
  const attempts = currentAttempts + 1
  const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null
  await db
    .update(staffUsers)
    .set({ failedAttempts: lockedUntil ? 0 : attempts, lockedUntil })
    .where(eq(staffUsers.id, staffId))
}

export async function clearFailedAttempts(db: Database, staffId: string) {
  await db.update(staffUsers).set({ failedAttempts: 0, lockedUntil: null }).where(eq(staffUsers.id, staffId))
}

export function lockoutMessage(lockedUntil: Date): string {
  const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000))
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
}
