"use server"

/**
 * Server Actions for the staff booking board (Phase 1.4a — see
 * CLAUDE.md). Same rules as `src/server/admin/actions.ts`: every export
 * re-checks its own capability with `requireStaffAction`, every mutation
 * is logged with `recordActivity`, and `revalidatePath("/", "layout")`
 * follows every write.
 *
 * A walk-in books and pays in one step — staff already has the cash,
 * card or MoMo confirmation in hand — so `createWalkInBooking` chains
 * `createHold` straight into `recordWalkInPayment` rather than leaving a
 * "held" row waiting on a payment nobody is going to make separately.
 *
 * `createHold`/`recordWalkInPayment`/`refundBooking`/`applyDiscount`
 * take `db` as an explicit parameter rather than importing it
 * themselves — they have no `server-only` guard, so they're directly
 * testable against a real Postgres in vitest (see their own files'
 * comments). This is the only place that passes them the real `db`;
 * `recordActivity` for a refund/discount happens here too, after the
 * money moves, rather than inside those pure functions.
 */

import { revalidatePath } from "next/cache"
import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import { bookings, paymentMethodValues, sessionTypePrices, sessionTypes } from "../db/schema"
import { requireStaffAction } from "../auth/dal"
import { recordActivity } from "../auth/activity"
import { getLocation } from "../db/content"
import { createHold, SlotTakenError } from "../availability/createHold"
import { recordWalkInPayment } from "../availability/confirm"
import { kigaliWallTimeToUtc } from "../availability/slots"
import { priceForSlot } from "../availability/pricing"
import { findOrCreateClient } from "../people/findOrCreateClient"
import { refundBooking, RefundError } from "../ledger/refund"
import { applyDiscount, DiscountError } from "../ledger/discount"
import { notifyAfterResponse } from "../notify/dispatch"

export type ActionState = { error?: string; ok?: boolean }

const walkInSchema = z.object({
  sessionTypeId: z.string().uuid(),
  clientName: z.string().trim().min(1, "A name is required.").max(80),
  clientPhone: z.string().trim().max(20).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  paymentMethod: z.enum(paymentMethodValues),
  healthAck: z.string().optional(),
})

export async function createWalkInBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("bookings.create")
  const parsed = walkInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  const { sessionTypeId, clientName, clientPhone, date, time, paymentMethod, healthAck } = parsed.data
  if (healthAck !== "on") return { error: "Confirm the health questions before booking." }

  const location = await getLocation()
  const [sessionType] = await db.select().from(sessionTypes).where(eq(sessionTypes.id, sessionTypeId)).limit(1)
  if (!sessionType) return { error: "That session no longer exists." }
  const [price] = await db
    .select()
    .from(sessionTypePrices)
    .where(and(eq(sessionTypePrices.sessionTypeId, sessionTypeId), isNull(sessionTypePrices.effectiveTo)))
    .limit(1)
  if (!price) return { error: "No current price found for that session." }

  const [hourText, minuteText] = time.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const startAt = kigaliWallTimeToUtc(date, hour, minute)
  const endAt = new Date(startAt.getTime() + (sessionType.durationMinutes + location.turnoverMinutes) * 60_000)
  const { priceRwf, offPeak } = priceForSlot(price, location, date, hour)

  const client = await findOrCreateClient({ name: clientName, phone: clientPhone || null, healthAcknowledged: true })

  let booking: typeof bookings.$inferSelect
  try {
    booking = await createHold(db, {
      locationId: location.id,
      sessionTypeId,
      clientId: client.id,
      startAt,
      endAt,
      priceAtBookingRwf: priceRwf,
      offPeak,
      holdMinutes: location.holdMinutes,
      source: "walk_in",
      createdByStaffId: staff.id,
    })
  } catch (err) {
    if (err instanceof SlotTakenError) return { error: err.message }
    throw err
  }

  await recordWalkInPayment(
    db,
    booking.id,
    { locationId: location.id, clientId: client.id, amountRwf: priceRwf, method: paymentMethod },
    staff.id,
  )

  await recordActivity({
    staffUserId: staff.id,
    action: "booking.walkInCreated",
    entityType: "booking",
    entityId: booking.id,
    after: { clientName, sessionType: sessionType.slug, startAt: startAt.toISOString(), priceRwf, paymentMethod },
  })
  // A walk-in with a phone gets the same WhatsApp confirmation and QR as
  // an online booking; one with no phone or email is simply skipped.
  notifyAfterResponse(booking.id, "booking_confirmed")
  revalidatePath("/", "layout")
  return { ok: true }
}

const cancelSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(1, "A reason is required to cancel a booking.").max(300),
})

/** Voids a booking without touching any payment — the "forfeit" outcome for a late cancellation or an in-person mistake, not a refund. Use `refundBookingAction` to give the money back. */
export async function cancelBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("bookings.cancel")
  const parsed = cancelSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "A reason is required." }
  const { bookingId, reason } = parsed.data

  const [before] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  if (!before) return { error: "Booking not found." }
  if (before.status === "cancelled" || before.status === "completed" || before.status === "no_show") {
    return { error: "This booking can no longer be cancelled." }
  }

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelReason: reason, cancelledByStaffId: staff.id, cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))

  await recordActivity({
    staffUserId: staff.id,
    action: "booking.cancelled",
    entityType: "booking",
    entityId: bookingId,
    before: { status: before.status },
    after: { status: "cancelled" },
    reason,
  })
  // Only a booking the client believes is happening needs a message — a
  // held one was never confirmed to them in the first place.
  if (before.status === "confirmed") notifyAfterResponse(bookingId, "booking_cancelled")
  revalidatePath("/", "layout")
  return { ok: true }
}

const moneyActionSchema = z.object({
  bookingId: z.string().uuid(),
  amountRwf: z.coerce.number().int().positive("Enter an amount greater than zero."),
  reason: z.string().trim().min(1, "A reason is required.").max(300),
})

export async function refundBookingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("payments.refund")
  const parsed = moneyActionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  let booking: Awaited<ReturnType<typeof refundBooking>>
  try {
    booking = await refundBooking(db, { ...parsed.data, staffUserId: staff.id })
  } catch (err) {
    if (err instanceof RefundError) return { error: err.message }
    throw err
  }
  await recordActivity({
    staffUserId: staff.id,
    action: "booking.refunded",
    entityType: "booking",
    entityId: booking.id,
    before: { status: booking.status },
    after: { status: "cancelled", refundedRwf: parsed.data.amountRwf },
    reason: parsed.data.reason,
  })
  notifyAfterResponse(booking.id, "booking_cancelled", { refundedRwf: parsed.data.amountRwf })
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function applyDiscountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("discounts.apply")
  const parsed = moneyActionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  let booking: Awaited<ReturnType<typeof applyDiscount>>
  try {
    booking = await applyDiscount(db, { ...parsed.data, staffUserId: staff.id })
  } catch (err) {
    if (err instanceof DiscountError) return { error: err.message }
    throw err
  }
  await recordActivity({
    staffUserId: staff.id,
    action: "booking.discountApplied",
    entityType: "booking",
    entityId: booking.id,
    after: { discountRwf: parsed.data.amountRwf },
    reason: parsed.data.reason,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}
