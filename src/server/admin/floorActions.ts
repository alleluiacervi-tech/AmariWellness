"use server"

/**
 * Server Actions for the desk's floor page (`/staff/floor`, Phase 1.5):
 * scanning a QR, checking a guest in, ending a session, and moving a
 * suite between cleaning and ready. Same rules as every other staff
 * action file — each export re-checks its own capability, logs what it
 * changed, and revalidates. The rules themselves live in
 * `src/server/checkin/` and `src/server/jobs/sessionLifecycle.ts`, which
 * take `db` as a parameter and are tested directly.
 */

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import { suites } from "../db/schema"
import { requireStaffAction } from "../auth/dal"
import { recordActivity } from "../auth/activity"
import { checkIn, lookupQr, type CheckInLookup } from "../checkin/checkIn"
import { finishSession } from "../jobs/sessionLifecycle"

export type ActionState = { error?: string; ok?: boolean }

/** Called the moment the camera (or a keyboard scanner) reads a code — shows the desk whose booking it is before anyone taps "Check in". */
export async function lookupQrAction(payload: string): Promise<CheckInLookup> {
  await requireStaffAction("bookings.checkIn")
  return lookupQr(db, String(payload).slice(0, 500))
}

export type CheckInState = { result?: CheckInLookup }

const checkInSchema = z.object({
  bookingId: z.string().uuid(),
  payload: z.string().max(500).optional(),
})

/** Checks the guest in — from a scan (with `payload`, re-verified here) or the manual button on the bookings board (without). */
export async function checkInAction(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  const staff = await requireStaffAction("bookings.checkIn")
  const parsed = checkInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { result: { ok: false, problem: "not_found", message: "Something went wrong — scan again." } }

  const result = await checkIn(db, { bookingId: parsed.data.bookingId, payload: parsed.data.payload, staffUserId: staff.id })
  if (result.ok) {
    await recordActivity({
      staffUserId: staff.id,
      action: "booking.checkedIn",
      entityType: "booking",
      entityId: result.preview.bookingId,
      before: { status: "confirmed" },
      after: { status: "checked_in", suite: result.preview.suiteName, via: parsed.data.payload ? "qr" : "manual" },
    })
    revalidatePath("/staff", "layout")
  }
  return { result }
}

const bookingIdSchema = z.object({ bookingId: z.string().uuid() })

export async function finishSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("bookings.checkIn")
  const parsed = bookingIdSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Something went wrong — refresh and try again." }
  if (!(await finishSession(db, parsed.data.bookingId))) return { error: "This guest isn't checked in any more." }
  await recordActivity({
    staffUserId: staff.id,
    action: "booking.sessionFinished",
    entityType: "booking",
    entityId: parsed.data.bookingId,
    before: { status: "checked_in" },
    after: { status: "completed" },
  })
  revalidatePath("/staff", "layout")
  return { ok: true }
}

const suiteStatusSchema = z.object({
  suiteId: z.string().uuid(),
  status: z.enum(["ready", "cleaning"]),
})

/**
 * Cleaning ↔ ready, the two moves the desk makes by hand. Occupied is
 * only ever set by a check-in, and maintenance from the suites page —
 * this action refuses to touch a suite in either state, so a stray tap
 * can't mark an occupied suite "ready" under a guest.
 */
export async function setSuiteFloorStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("suites.maintenance")
  const parsed = suiteStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Something went wrong — refresh and try again." }

  const [before] = await db.select().from(suites).where(eq(suites.id, parsed.data.suiteId)).limit(1)
  if (!before) return { error: "Suite not found." }
  if (before.status !== "ready" && before.status !== "cleaning") {
    return { error: `This suite is ${before.status === "occupied" ? "occupied" : "in maintenance"} — that has to change first.` }
  }
  if (before.status === parsed.data.status) return { ok: true }

  await db.update(suites).set({ status: parsed.data.status }).where(eq(suites.id, before.id))
  await recordActivity({
    staffUserId: staff.id,
    action: "suite.statusChanged",
    entityType: "suite",
    entityId: before.id,
    before: { status: before.status },
    after: { status: parsed.data.status },
  })
  revalidatePath("/staff", "layout")
  return { ok: true }
}
