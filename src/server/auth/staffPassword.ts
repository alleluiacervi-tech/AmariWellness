// No `server-only` guard, deliberately — takes `db` as a parameter, like
// `lockout.ts`, so it's tested directly against a real Postgres and is
// usable from the `pnpm staff:password` command, which runs outside Next.
import { and, eq, ne } from "drizzle-orm"
import type { Database } from "../db/client"
import { staffAuthSessions, staffUsers } from "../db/schema"
import { hashPassword, verifyPassword } from "./password"
import { lockoutMessage, registerFailedAttempt } from "./lockout"

/** The password the seed script uses when none is given. It's written in this public repository, so it's never accepted as anyone's real password. */
export const SEED_DEFAULT_PASSWORD = "change-me-now"

export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 200

export class PasswordError extends Error {}

/**
 * Why a new password isn't acceptable, or null if it is. Length is the
 * rule that matters (a few words together beats a short jumble of
 * symbols), plus never the public seed password. Staff sign-in also
 * needs a two-step code, so this is one of two factors, not the only one.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters. A few words together is long enough and easy to remember.`
  }
  if (password.length > MAX_PASSWORD_LENGTH) return `Use at most ${MAX_PASSWORD_LENGTH} characters.`
  if (password === SEED_DEFAULT_PASSWORD) return "That's the setup password anyone can look up. Choose your own."
  return null
}

/**
 * Sets a staff member's password and signs them out everywhere else:
 * every other session for the account is deleted, so a device that
 * signed in with the old password stops working immediately. Also clears
 * any login lockout.
 *
 * - `keepSessionId`: the session making the change, which stays signed in.
 * - `temporary`: set by somebody else (the owner from the command line),
 *   so the person is asked to choose their own at their next sign-in.
 * - `resetTwoFactor`: forgets the account's authenticator, so the next
 *   sign-in sets it up again. For recovering an account someone else
 *   claimed first, or a lost phone.
 */
export async function setStaffPassword(
  db: Database,
  staffUserId: string,
  newPassword: string,
  options: { keepSessionId?: string; temporary?: boolean; resetTwoFactor?: boolean; now?: Date } = {},
): Promise<{ sessionsEnded: number }> {
  const problem = passwordProblem(newPassword)
  if (problem) throw new PasswordError(problem)
  const now = options.now ?? new Date()
  const passwordHash = await hashPassword(newPassword)

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(staffUsers)
      .set({
        passwordHash,
        passwordChangedAt: options.temporary ? null : now,
        failedAttempts: 0,
        lockedUntil: null,
        ...(options.resetTwoFactor ? { totpSecret: null } : {}),
      })
      .where(eq(staffUsers.id, staffUserId))
      .returning({ id: staffUsers.id })
    if (!updated) throw new PasswordError("Staff account not found.")

    const ended = await tx
      .delete(staffAuthSessions)
      .where(
        and(
          eq(staffAuthSessions.staffUserId, staffUserId),
          options.keepSessionId ? ne(staffAuthSessions.id, options.keepSessionId) : undefined,
        ),
      )
      .returning({ id: staffAuthSessions.id })
    return { sessionsEnded: ended.length }
  })
}

/**
 * A signed-in staff member choosing a new password. The current one is
 * checked first, and a wrong guess counts towards the same lockout as a
 * wrong password at sign-in, so a borrowed, unattended session can't be
 * used to try passwords until one works.
 */
export async function changeOwnPassword(
  db: Database,
  input: { staffUserId: string; currentPassword: string; newPassword: string; keepSessionId: string; now?: Date },
): Promise<{ sessionsEnded: number }> {
  const now = input.now ?? new Date()
  const [staff] = await db.select().from(staffUsers).where(eq(staffUsers.id, input.staffUserId)).limit(1)
  if (!staff || !staff.active) throw new PasswordError("Staff account not found.")
  if (staff.lockedUntil && staff.lockedUntil > now) throw new PasswordError(lockoutMessage(staff.lockedUntil))

  if (!(await verifyPassword(input.currentPassword, staff.passwordHash))) {
    await registerFailedAttempt(db, staff.id, staff.failedAttempts)
    throw new PasswordError("That isn't your current password.")
  }
  if (input.newPassword === input.currentPassword) throw new PasswordError("Choose a password different from your current one.")

  return setStaffPassword(db, staff.id, input.newPassword, { keepSessionId: input.keepSessionId, now })
}
