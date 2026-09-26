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
import { releaseSuite } from "../checkin/suiteState"

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
      after: {
        status: "checked_in",
        suite: result.preview.suiteName,
        ...(result.preview.movedFromSuiteName ? { movedFromSuite: result.preview.movedFromSuiteName } : {}),
        via: parsed.data.payload ? "qr" : "manual",
      },
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
 * Cleaning ↔ ready, the two moves the desk makes by hand — plus
 * "needs cleaning" for a suite still showing occupied with nobody
 * checked in to it. Occupied is otherwise only ever set by a check-in,
 * and maintenance from the suites page. The suite row is locked while
 * this decides, and a check-in takes the same lock, so a tap landing at
 * the same moment as a check-in can't mark the suite ready (or cleaning)
 * under the guest who's just been shown in.
 */
export async function setSuiteFloorStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("suites.maintenance")
  const parsed = suiteStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Something went wrong — refresh and try again." }
  const target = parsed.data.status

  const outcome = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(suites).where(eq(suites.id, parsed.data.suiteId)).for("update")
    if (!before) return { error: "Suite not found." }
    if (before.status === target) return { before, after: before.status }
    if (before.status === "maintenance") return { error: "This suite is in maintenance — that has to change on the suites page first." }
    if (before.status === "occupied") {
      if (target !== "cleaning") return { error: "This suite is occupied — it needs cleaning before it's ready." }
      // Only frees it if nobody is actually checked in there.
      await releaseSuite(tx, before.id)
      const [after] = await tx.select({ status: suites.status }).from(suites).where(eq(suites.id, before.id))
      if (after.status === "occupied") return { error: "A guest is checked in to this suite. Use \"Session finished\" when they leave." }
      return { before, after: after.status }
    }
    await tx.update(suites).set({ status: target }).where(eq(suites.id, before.id))
    return { before, after: target }
  })
  if ("error" in outcome) return { error: outcome.error }
  if (outcome.before.status === outcome.after) return { ok: true }

  await recordActivity({
    staffUserId: staff.id,
    action: "suite.statusChanged",
    entityType: "suite",
    entityId: outcome.before.id,
    before: { status: outcome.before.status },
    after: { status: outcome.after },
  })
  revalidatePath("/staff", "layout")
  return { ok: true }
}
