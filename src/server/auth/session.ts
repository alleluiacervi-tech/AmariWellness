import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../db/client"
import { staffAuthSessions, staffUsers } from "../db/schema"

const COOKIE_NAME = "amari_staff_session"
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set — see .env.example")
  return new TextEncoder().encode(secret)
}

/**
 * The cookie holds only a signed reference to a database row (`staff_auth_sessions`),
 * not the session data itself — the "Database Sessions" pattern the
 * Next.js authentication guide recommends over a fully stateless cookie,
 * because it means a session can be revoked server-side (sign out
 * everywhere, disable a staff account) by deleting one row, without
 * waiting for a token to expire.
 */
async function signSessionToken(sessionId: string, expiresAt: Date): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey())
}

async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return typeof payload.sid === "string" ? payload.sid : null
  } catch {
    return null // expired, tampered, or signed with an old secret — treat all the same
  }
}

async function setCookie(token: string, expiresAt: Date) {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

async function clearCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** Called once a password check succeeds. `mfaVerifiedAt` starts null — the session exists but is not yet fully authenticated until two-step verification completes. */
export async function createStaffSession(staffUserId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS)
  const [session] = await db
    .insert(staffAuthSessions)
    .values({ staffUserId, expiresAt })
    .returning({ id: staffAuthSessions.id })
  const token = await signSessionToken(session.id, expiresAt)
  await setCookie(token, expiresAt)
  return session.id
}

export async function markSessionMfaVerified(sessionId: string) {
  await db
    .update(staffAuthSessions)
    .set({ mfaVerifiedAt: new Date() })
    .where(eq(staffAuthSessions.id, sessionId))
}

export async function destroyCurrentStaffSession() {
  const sessionId = await readSessionIdFromCookie()
  if (sessionId) await db.delete(staffAuthSessions).where(eq(staffAuthSessions.id, sessionId))
  await clearCookie()
}

async function readSessionIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

const ENROLL_COOKIE_NAME = "amari_totp_enroll"
const ENROLL_LIFETIME_MS = 10 * 60 * 1000 // 10 minutes to scan a QR code and enter a code

/**
 * A freshly generated TOTP secret is only trustworthy once its owner has
 * proven they can produce a matching code — until then it's "pending",
 * held in a short-lived signed cookie rather than the database, so an
 * abandoned enrollment never leaves a usable-but-unverified secret
 * sitting on the staff account.
 */
export async function createPendingEnrollment(staffUserId: string, secret: string) {
  const expiresAt = new Date(Date.now() + ENROLL_LIFETIME_MS)
  const token = await new SignJWT({ sid: staffUserId, sec: secret })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey())
  const store = await cookies()
  store.set(ENROLL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function readPendingEnrollment(staffUserId: string): Promise<string | null> {
  const store = await cookies()
  const token = store.get(ENROLL_COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (payload.sid !== staffUserId || typeof payload.sec !== "string") return null
    return payload.sec
  } catch {
    return null
  }
}

export async function clearPendingEnrollment() {
  const store = await cookies()
  store.delete(ENROLL_COOKIE_NAME)
}

export interface StaffSummary {
  id: string
  name: string
  email: string
  role: (typeof staffUsers.$inferSelect)["role"]
}

export type SessionState =
  | { status: "unauthenticated" }
  | { status: "awaiting_mfa"; staff: StaffSummary; sessionId: string }
  | { status: "authenticated"; staff: StaffSummary; sessionId: string }

/**
 * The authoritative check: verifies the cookie's signature, then loads
 * the session and staff rows from the database (not just trusting the
 * cookie's contents) so a revoked session or a deactivated staff
 * account stops working immediately, not just when the JWT expires.
 * Optimistic checks in `proxy.ts` exist only to redirect faster for a
 * signed-out visitor; this function is what every page and action
 * actually relies on.
 */
export async function readSessionState(): Promise<SessionState> {
  const sessionId = await readSessionIdFromCookie()
  if (!sessionId) return { status: "unauthenticated" }

  const rows = await db
    .select({
      sessionId: staffAuthSessions.id,
      mfaVerifiedAt: staffAuthSessions.mfaVerifiedAt,
      staffId: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
      role: staffUsers.role,
      active: staffUsers.active,
    })
    .from(staffAuthSessions)
    .innerJoin(staffUsers, eq(staffAuthSessions.staffUserId, staffUsers.id))
    .where(and(eq(staffAuthSessions.id, sessionId), gt(staffAuthSessions.expiresAt, new Date())))
    .limit(1)

  const row = rows[0]
  if (!row || !row.active) return { status: "unauthenticated" }

  const staff: StaffSummary = { id: row.staffId, name: row.name, email: row.email, role: row.role }
  return row.mfaVerifiedAt
    ? { status: "authenticated", staff, sessionId: row.sessionId }
    : { status: "awaiting_mfa", staff, sessionId: row.sessionId }
}
