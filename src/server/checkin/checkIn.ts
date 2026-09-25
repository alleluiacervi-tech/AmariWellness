// No `server-only` guard, deliberately — takes `db` and `now` as
// parameters so every rule below is tested in vitest against a real
// Postgres (see `src/server/availability/conflicts.ts`).
import { and, eq } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, clients, sessionTypes, suites, type BookingStatus } from "../db/schema"
import { decodeQrPayload } from "../qr"
import { bookingReference } from "../../lib/booking"
import { formatKigaliDay, formatKigaliTime, kigaliDateISO } from "../../lib/kigaliTime"

export type CheckInPreview = {
  bookingId: string
  reference: string
  clientName: string
  clientPhone: string | null
  sessionName: string
  durationMinutes: number
  startAt: Date
  suiteId: string
  suiteName: string
  status: BookingStatus
  checkedInAt: Date | null
}

export type CheckInProblem =
  | "unreadable" // not an Amari QR at all, or its signature doesn't match — forged or altered
  | "not_found"
  | "superseded" // a genuine signature for a token this booking no longer carries
  | "wrong_day"
  | "already_checked_in"
  | "not_paid"
  | "closed" // cancelled, no-show or completed

export type CheckInLookup = { ok: true; preview: CheckInPreview } | { ok: false; problem: CheckInProblem; message: string; preview?: CheckInPreview }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadPreview(db: Database, bookingId: string) {
  if (!UUID.test(bookingId)) return null
  const [row] = await db
    .select({
      bookingId: bookings.id,
      qrToken: bookings.qrToken,
      clientName: clients.name,
      clientPhone: clients.phone,
      sessionName: sessionTypes.name,
      durationMinutes: sessionTypes.durationMinutes,
      startAt: bookings.startAt,
      suiteId: suites.id,
      suiteName: suites.name,
      status: bookings.status,
      checkedInAt: bookings.checkedInAt,
    })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .innerJoin(suites, eq(suites.id, bookings.suiteId))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  if (!row) return null
  const { qrToken, ...rest } = row
  return { qrToken, preview: { ...rest, reference: bookingReference(row.bookingId) } satisfies CheckInPreview }
}

/** Why this booking can't be checked in right now — or null if it can. The same rules for a scanned QR and a manual check-in from the bookings board. */
function problemFor(preview: CheckInPreview, now: Date): { problem: CheckInProblem; message: string } | null {
  switch (preview.status) {
    case "checked_in":
      return {
        problem: "already_checked_in",
        message: `Already checked in${preview.checkedInAt ? ` at ${formatKigaliTime(preview.checkedInAt)}` : ""}. This code has been used.`,
      }
    case "held":
      return { problem: "not_paid", message: "This booking was never paid for." }
    case "cancelled":
      return { problem: "closed", message: "This booking was cancelled." }
    case "no_show":
      return { problem: "closed", message: "This booking was marked as a no-show." }
    case "completed":
      return { problem: "closed", message: "This session has already taken place." }
    case "confirmed":
      break
  }
  if (kigaliDateISO(preview.startAt) !== kigaliDateISO(now)) {
    return {
      problem: "wrong_day",
      message: `This booking is for ${formatKigaliDay(preview.startAt)} at ${formatKigaliTime(preview.startAt)}. A code only works on the day.`,
    }
  }
  return null
}

/**
 * What the desk sees the moment a QR is scanned, before anyone taps
 * "Check in": whose booking it is, the session, the suite — or exactly
 * why it won't work. Checks, in order: the signature (a forged or
 * altered code fails here without touching the database), that the
 * booking exists and still carries this token, then the booking rules.
 */
export async function lookupQr(db: Database, payload: string, now: Date = new Date()): Promise<CheckInLookup> {
  const decoded = decodeQrPayload(payload.trim())
  if (!decoded) return { ok: false, problem: "unreadable", message: "This isn't a valid Amari booking code." }

  const found = await loadPreview(db, decoded.bookingId)
  if (!found) return { ok: false, problem: "not_found", message: "No booking matches this code." }
  if (found.qrToken !== decoded.token) {
    return { ok: false, problem: "superseded", message: "This code has been replaced. Ask the client for their latest confirmation." }
  }
  const problem = problemFor(found.preview, now)
  return problem ? { ok: false, ...problem, preview: found.preview } : { ok: true, preview: found.preview }
}

/**
 * Checks a booking in: one tap at the desk after `lookupQr`, or the
 * manual fallback on the bookings board (a flat phone, a walk-in with no
 * QR). Pass the scanned `payload` to re-verify it here — never trust
 * that the preview the browser saw is still true — or omit it for a
 * manual check-in by a signed-in staff member.
 *
 * "Only once" is decided by the database, not by the lookup: the update
 * only matches a booking that is still `confirmed`, so two scans of the
 * same code a second apart can't both succeed. The suite goes to
 * `occupied` in the same transaction.
 */
export async function checkIn(
  db: Database,
  input: { bookingId: string; payload?: string; staffUserId: string },
  now: Date = new Date(),
): Promise<CheckInLookup> {
  const lookup = input.payload !== undefined ? await lookupQr(db, input.payload, now) : await lookupById(db, input.bookingId, now)
  if (!lookup.ok) return lookup
  if (lookup.preview.bookingId !== input.bookingId) {
    return { ok: false, problem: "unreadable", message: "The scanned code doesn't match this booking." }
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(bookings)
      .set({ status: "checked_in", checkedInAt: now, checkedInByStaffId: input.staffUserId, updatedAt: now })
      .where(and(eq(bookings.id, input.bookingId), eq(bookings.status, "confirmed")))
      .returning({ id: bookings.id, suiteId: bookings.suiteId })
    if (!row) return null
    await tx.update(suites).set({ status: "occupied" }).where(eq(suites.id, row.suiteId))
    return row
  })

  // Lost a race with another scan of the same code: report what actually happened.
  if (!updated) return lookupById(db, input.bookingId, now)
  return { ok: true, preview: { ...lookup.preview, status: "checked_in", checkedInAt: now } }
}

/** The manual path: the same rules as a scan, minus the signature (the staff member is the authority, not a code). */
export async function lookupById(db: Database, bookingId: string, now: Date = new Date()): Promise<CheckInLookup> {
  const found = await loadPreview(db, bookingId)
  if (!found) return { ok: false, problem: "not_found", message: "No booking matches this code." }
  const problem = problemFor(found.preview, now)
  return problem ? { ok: false, ...problem, preview: found.preview } : { ok: true, preview: found.preview }
}
