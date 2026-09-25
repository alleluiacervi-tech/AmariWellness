"use server"

/**
 * Server Actions for a client changing their own booking from
 * `/account/bookings/[id]` (Phase 1.5). Who's asking always comes from
 * the client session (`requireClientAction`), never from the form, and
 * the rules live in `clientChanges.ts`, which re-checks ownership and the
 * cancellation window with the booking row locked.
 *
 * Each change is written to the activity log with no staff member (the
 * client did it) and messages the client, the same way a staff change
 * does.
 */

import { revalidatePath } from "next/cache"
import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import { bookings, sessionTypePrices, sessionTypes } from "../db/schema"
import { getLocation } from "../db/content"
import { requireClientAction } from "../client-auth/dal"
import { recordActivity } from "../auth/activity"
import { kigaliWallTimeToUtc } from "../availability/slots"
import { priceForSlot } from "../availability/pricing"
import { SlotTakenError } from "../availability/createHold"
import { notifyAfterResponse } from "../notify/dispatch"
import { BookingChangeError, cancelByClient, rescheduleByClient } from "./clientChanges"

export type ChangeState = { error?: string; done?: "cancelled" | "moved"; refundedRwf?: number; late?: boolean }

const cancelSchema = z.object({ bookingId: z.string().uuid() })

export async function cancelMyBookingAction(_prev: ChangeState, formData: FormData): Promise<ChangeState> {
  const client = await requireClientAction()
  const parsed = cancelSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Something went wrong — refresh and try again." }
  const location = await getLocation()

  let result: Awaited<ReturnType<typeof cancelByClient>>
  try {
    result = await cancelByClient(db, {
      bookingId: parsed.data.bookingId,
      clientId: client.id,
      cancellationWindowHours: location.cancellationWindowHours,
    })
  } catch (err) {
    if (err instanceof BookingChangeError) return { error: err.message }
    throw err
  }

  await recordActivity({
    staffUserId: null,
    action: "booking.cancelledByClient",
    entityType: "booking",
    entityId: parsed.data.bookingId,
    before: { status: "confirmed" },
    after: { status: "cancelled", refundedRwf: result.refundedRwf, late: result.late },
  })
  notifyAfterResponse(parsed.data.bookingId, "booking_cancelled", { refundedRwf: result.refundedRwf, lateCancellation: result.late })
  revalidatePath("/account", "layout")
  revalidatePath("/staff", "layout")
  return { done: "cancelled", refundedRwf: result.refundedRwf, late: result.late }
}

const rescheduleSchema = z.object({
  bookingId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a day."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
})

export async function rescheduleMyBookingAction(_prev: ChangeState, formData: FormData): Promise<ChangeState> {
  const client = await requireClientAction()
  const parsed = rescheduleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a day and time." }
  const { bookingId, date, time } = parsed.data

  const location = await getLocation()
  const [row] = await db
    .select({ sessionType: sessionTypes })
    .from(bookings)
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, client.id)))
    .limit(1)
  if (!row) return { error: "Booking not found." }
  const [price] = await db
    .select()
    .from(sessionTypePrices)
    .where(and(eq(sessionTypePrices.sessionTypeId, row.sessionType.id), isNull(sessionTypePrices.effectiveTo)))
    .limit(1)
  if (!price) return { error: "This session can't be booked right now." }

  const [hour, minute] = time.split(":").map(Number)
  const newStartAt = kigaliWallTimeToUtc(date, hour, minute)
  const newEndAt = new Date(newStartAt.getTime() + (row.sessionType.durationMinutes + location.turnoverMinutes) * 60_000)

  let moved: Awaited<ReturnType<typeof rescheduleByClient>>
  try {
    moved = await rescheduleByClient(db, {
      bookingId,
      clientId: client.id,
      cancellationWindowHours: location.cancellationWindowHours,
      newStartAt,
      newEndAt,
      newSlotPriceRwf: priceForSlot(price, location, date, hour).priceRwf,
    })
  } catch (err) {
    if (err instanceof BookingChangeError || err instanceof SlotTakenError) return { error: err.message }
    throw err
  }

  await recordActivity({
    staffUserId: null,
    action: "booking.rescheduledByClient",
    entityType: "booking",
    entityId: bookingId,
    before: { startAt: moved.before.startAt.toISOString(), suiteId: moved.before.suiteId },
    after: { startAt: moved.after.startAt.toISOString(), suiteId: moved.after.suiteId },
  })
  notifyAfterResponse(bookingId, "booking_rescheduled")
  revalidatePath("/account", "layout")
  revalidatePath("/staff", "layout")
  return { done: "moved" }
}
