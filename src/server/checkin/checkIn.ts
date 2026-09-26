// No `server-only` guard, deliberately — takes `db` and `now` as
// parameters so every rule below is tested in vitest against a real
// Postgres (see `src/server/availability/conflicts.ts`).
import { and, eq } from "drizzle-orm"
import type { Database, Tx } from "../db/client"
import { bookings, clients, sessionTypes, suites, type BookingStatus } from "../db/schema"
import { decodeQrPayload } from "../qr"
import { pickAvailableSuite } from "../availability/conflicts"
import { isOverlapError } from "../availability/createHold"
import { expireSuiteStaleHolds } from "../availability/expireStaleHolds"
import { checkInWindow, NO_SHOW_GRACE_MINUTES } from "../jobs/policy"
import { occupySuite } from "./suiteState"
import { bookingReference } from "../../lib/booking"
import { formatKigaliDay, formatKigaliTime, kigaliDateISO } from "../../lib/kigaliTime"
import { isUuid } from "../../lib/uuid"

type SuiteStatus = (typeof suites.$inferSelect)["status"]

export type CheckInPreview = {
  bookingId: string
  reference: string
  clientName: string
  clientPhone: string | null
  sessionName: string
  durationMinutes: number
  startAt: Date
  /** The suite the guest goes to — which is not the booked one when that suite is in maintenance (see `movedFromSuiteName`). */
  suiteId: string
  suiteName: string
  suiteStatus: SuiteStatus
  /** Set when the booked suite is in maintenance and the guest is being seated in another free one instead. */
  movedFromSuiteName?: string
  status: BookingStatus
  checkedInAt: Date | null
}

export type CheckInProblem =
  | "unreadable" // not an Amari QR at all, or its signature doesn't match — forged or altered
  | "not_found"
  | "superseded" // a genuine signature for a token this booking no longer carries
  | "wrong_day"
  | "too_early"
  | "too_late" // past the no-show grace, whether or not the no-show job has run yet
  | "already_checked_in"
  | "not_paid"
  | "closed" // cancelled, no-show or completed
  | "suite_unavailable" // its suite is in maintenance and no other suite is free for the session

export type CheckInLookup = { ok: true; preview: CheckInPreview } | { ok: false; problem: CheckInProblem; message: string; preview?: CheckInPreview }

type Found = { qrToken: string | null; locationId: string; endAt: Date; preview: CheckInPreview }

async function loadPreview(db: Database | Tx, bookingId: string): Promise<Found | null> {
  if (!isUuid(bookingId)) return null
  const [row] = await db
    .select({
      bookingId: bookings.id,
      qrToken: bookings.qrToken,
      locationId: bookings.locationId,
      endAt: bookings.endAt,
      clientName: clients.name,
      clientPhone: clients.phone,
      sessionName: sessionTypes.name,
      durationMinutes: sessionTypes.durationMinutes,
      startAt: bookings.startAt,
      suiteId: suites.id,
      suiteName: suites.name,
      suiteStatus: suites.status,
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
  const { qrToken, locationId, endAt, ...rest } = row
  return { qrToken, locationId, endAt, preview: { ...rest, reference: bookingReference(row.bookingId) } }
}

type Rules = { allowLate?: boolean }

/** Why this booking can't be checked in right now — or null if it can. The same rules for a scanned QR and a manual check-in from the bookings board. */
function problemFor(preview: CheckInPreview, now: Date, rules: Rules): { problem: CheckInProblem; message: string } | null {
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
  const { opensAt, closesAt } = checkInWindow(preview.startAt)
  if (now < opensAt) {
    return {
      problem: "too_early",
      message: `This session starts at ${formatKigaliTime(preview.startAt)}. Check-in opens at ${formatKigaliTime(opensAt)}.`,
    }
  }
  if (now > closesAt && !rules.allowLate) {
    return {
      problem: "too_late",
      message: `This session started at ${formatKigaliTime(preview.startAt)}. More than ${NO_SHOW_GRACE_MINUTES} minutes late, it counts as a no-show under the policy.`,
    }
  }
  return null
}

/**
 * The suite the guest will actually be seated in. Normally the booked
 * one; if the floor has marked it as in maintenance (a broken chair),
 * the first other suite that's free for the booking's whole span
 * instead — never silently overwriting the maintenance flag by
 * "occupying" a suite nobody should sit in.
 */
async function seatFor(db: Database | Tx, found: Found): Promise<CheckInLookup> {
  const { preview } = found
  if (preview.suiteStatus !== "maintenance") return { ok: true, preview }
  const otherId = await pickAvailableSuite(db, found.locationId, preview.startAt, found.endAt, preview.bookingId, { usableNow: true })
  if (!otherId) {
    return {
      ok: false,
      problem: "suite_unavailable",
      message: `${preview.suiteName} is in maintenance, and no other suite is free for this session. Offer another time or a refund.`,
      preview,
    }
  }
  const [other] = await db.select({ name: suites.name, status: suites.status }).from(suites).where(eq(suites.id, otherId)).limit(1)
  return {
    ok: true,
    preview: { ...preview, suiteId: otherId, suiteName: other.name, suiteStatus: other.status, movedFromSuiteName: preview.suiteName },
  }
}

async function evaluate(db: Database | Tx, found: Found, now: Date, rules: Rules): Promise<CheckInLookup> {
  const problem = problemFor(found.preview, now, rules)
  if (problem) return { ok: false, ...problem, preview: found.preview }
  return seatFor(db, found)
}

/**
 * What the desk sees the moment a QR is scanned, before anyone taps
 * "Check in": whose booking it is, the session, the suite — or exactly
 * why it won't work. Checks, in order: the signature (a forged or
 * altered code fails here without touching the database), that the
 * booking exists and still carries this token, then the booking rules:
 * paid, today, and inside the check-in window (from
 * `CHECK_IN_OPENS_MINUTES_BEFORE` the start until the no-show grace
 * runs out — the same cut-off the no-show job uses, so the answer
 * doesn't depend on whether that job has run yet).
 */
export async function lookupQr(db: Database, payload: string, now: Date = new Date()): Promise<CheckInLookup> {
  const decoded = decodeQrPayload(payload.trim())
  if (!decoded) return { ok: false, problem: "unreadable", message: "This isn't a valid Amari booking code." }

  const found = await loadPreview(db, decoded.bookingId)
  if (!found) return { ok: false, problem: "not_found", message: "No booking matches this code." }
  if (found.qrToken !== decoded.token) {
    return { ok: false, problem: "superseded", message: "This code has been replaced. Ask the client for their latest confirmation." }
  }
  return evaluate(db, found, now, {})
}

/** The manual path: the same rules as a scan, minus the signature (the staff member is the authority, not a code). */
export async function lookupById(db: Database, bookingId: string, now: Date = new Date(), rules: Rules = {}): Promise<CheckInLookup> {
  const found = await loadPreview(db, bookingId)
  if (!found) return { ok: false, problem: "not_found", message: "No booking matches this code." }
  return evaluate(db, found, now, rules)
}

/**
 * Checks a booking in: one tap at the desk after `lookupQr`, or the
 * manual fallback on the bookings board (a flat phone, a walk-in with no
 * QR). Pass the scanned `payload` to re-verify it here — never trust
 * that the preview the browser saw is still true — or omit it for a
 * manual check-in by a signed-in staff member. `allowLate` is for a
 * walk-in being seated as it's booked: they're standing at the desk, so
 * "late" doesn't apply.
 *
 * Everything is decided again inside one transaction with the booking
 * row locked (`FOR UPDATE`), so two scans of the same code a second
 * apart can't both succeed — the second waits, then finds it already
 * checked in — and a cancellation or refund landing at the same moment
 * can't be overwritten. The suite goes to `occupied` in the same
 * transaction; if the booked suite is in maintenance, the booking moves
 * to the free suite the preview showed, and the `bookings_no_overlap`
 * exclusion constraint has the last word on that suite, as always.
 */
export async function checkIn(
  db: Database,
  input: { bookingId: string; payload?: string; staffUserId: string; allowLate?: boolean },
  now: Date = new Date(),
): Promise<CheckInLookup> {
  const rules: Rules = { allowLate: input.allowLate }
  if (input.payload !== undefined) {
    const scanned = await lookupQr(db, input.payload, now)
    if (scanned.preview && scanned.preview.bookingId !== input.bookingId) {
      return { ok: false, problem: "unreadable", message: "The scanned code doesn't match this booking." }
    }
    if (!scanned.ok) return scanned
  }

  let result: CheckInLookup
  try {
    result = await db.transaction(async (tx): Promise<CheckInLookup> => {
      await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.id, input.bookingId)).for("update")
      const found = await loadPreview(tx, input.bookingId)
      if (!found) return { ok: false, problem: "not_found", message: "No booking matches this code." }
      const decision = await evaluate(tx, found, now, rules)
      if (!decision.ok) return decision

      const { suiteId } = decision.preview
      if (suiteId !== found.preview.suiteId) await expireSuiteStaleHolds(tx, suiteId, now)
      await tx
        .update(bookings)
        .set({ status: "checked_in", suiteId, checkedInAt: now, checkedInByStaffId: input.staffUserId, updatedAt: now })
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.status, "confirmed")))
      await occupySuite(tx, suiteId)
      return { ok: true, preview: { ...decision.preview, suiteStatus: "occupied", status: "checked_in", checkedInAt: now } }
    })
  } catch (err) {
    // Another booking took the replacement suite in the same instant.
    if (!isOverlapError(err)) throw err
    return lookupById(db, input.bookingId, now, rules)
  }
  return result
}
