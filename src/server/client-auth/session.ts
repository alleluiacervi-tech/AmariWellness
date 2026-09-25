import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { and, eq, gt } from "drizzle-orm"
import { db } from "../db/client"
import { clientAuthSessions, clients } from "../db/schema"

const COOKIE_NAME = "amari_client_session"
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — a returning guest shouldn't have to re-verify every visit

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set — see .env.example")
  return new TextEncoder().encode(secret)
}

/** Same "database session" pattern as staff auth (`src/server/auth/session.ts`): the cookie names a row in `client_auth_sessions`, so signing out — or, later, a staff member revoking a client's access — actually ends it server-side. */
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
    return null
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

async function readSessionIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Called once an OTP is verified. */
export async function createClientSession(clientId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS)
  const [session] = await db.insert(clientAuthSessions).values({ clientId, expiresAt }).returning({ id: clientAuthSessions.id })
  const token = await signSessionToken(session.id, expiresAt)
  await setCookie(token, expiresAt)
}

export async function destroyCurrentClientSession(): Promise<void> {
  const sessionId = await readSessionIdFromCookie()
  if (sessionId) await db.delete(clientAuthSessions).where(eq(clientAuthSessions.id, sessionId))
  await clearCookie()
}

export interface ClientSummary {
  id: string
  name: string
  phone: string | null
  healthAcknowledgedAt: Date | null
}

export type ClientSessionState = { status: "unauthenticated" } | { status: "authenticated"; client: ClientSummary }

/** The authoritative check — verifies the cookie's signature, then loads the session and client rows from the database, so a revoked session stops working immediately. */
export async function readClientSessionState(): Promise<ClientSessionState> {
  const sessionId = await readSessionIdFromCookie()
  if (!sessionId) return { status: "unauthenticated" }

  const rows = await db
    .select({
      sessionId: clientAuthSessions.id,
      clientId: clients.id,
      name: clients.name,
      phone: clients.phone,
      healthAcknowledgedAt: clients.healthAcknowledgedAt,
    })
    .from(clientAuthSessions)
    .innerJoin(clients, eq(clientAuthSessions.clientId, clients.id))
    .where(and(eq(clientAuthSessions.id, sessionId), gt(clientAuthSessions.expiresAt, new Date())))
    .limit(1)

  const row = rows[0]
  if (!row) return { status: "unauthenticated" }

  return {
    status: "authenticated",
    client: { id: row.clientId, name: row.name, phone: row.phone, healthAcknowledgedAt: row.healthAcknowledgedAt },
  }
}
