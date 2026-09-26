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
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import { bookings, sessionTypes } from "../db/schema"
import { getLocation } from "../db/content"
import { requireClientAction } from "../client-auth/dal"
import { recordActivity } from "../auth/activity"
import { getDaySlots, kigaliWallTimeToUtc, type Slot } from "../availability/slots"
import { SlotTakenError } from "../availability/createHold"
import { bookableDates } from "../../lib/kigaliTime"
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

/** The signed-in client's own booking, with what moving it needs — or null if it isn't theirs. */
async function ownBooking(clientId: string, bookingId: string) {
  const [row] = await db
    .select({ id: bookings.id, offPeak: bookings.offPeak, sessionType: sessionTypes })
    .from(bookings)
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, clientId)))
    .limit(1)
  return row ?? null
}

export type MoveSlots = { slots: Slot[]; quietHoursOnly: boolean }

/**
 * The times this booking can move to on one day — the booking page's
 * own slots, but with this booking's current time not counted as taken
 * (it's the one moving), and flagged when it can only move within quiet
 * hours. The server re-checks all of it when the move is submitted.
 */
export async function getMoveSlotsAction(bookingId: string, dateISO: string): Promise<MoveSlots> {
  const client = await requireClientAction()
  if (!z.string().uuid().safeParse(bookingId).success || !bookableDates(new Date()).includes(dateISO)) {
    return { slots: [], quietHoursOnly: false }
  }
  const booking = await ownBooking(client.id, bookingId)
  if (!booking) return { slots: [], quietHoursOnly: false }
  const location = await getLocation()
  const slots = await getDaySlots(db, location, dateISO, booking.sessionType.id, { excludeBookingId: booking.id })
  return { slots, quietHoursOnly: booking.offPeak }
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

  const booking = await ownBooking(client.id, bookingId)
  if (!booking) return { error: "Booking not found." }
  if (!bookableDates(new Date()).includes(date)) return { error: "Choose one of the days shown." }

  // Only a time the location actually offers that day: inside opening
  // hours, on the hourly grid, not a closed holiday — and free, with this
  // booking's own current time not counted against it.
  const location = await getLocation()
  const slot = (await getDaySlots(db, location, date, booking.sessionType.id, { excludeBookingId: booking.id })).find(
    (s) => s.time === time,
  )
  if (!slot) return { error: "That time isn't open for booking. Choose one of the times shown." }
  if (!slot.available) return { error: new SlotTakenError().message }

  const newStartAt = kigaliWallTimeToUtc(date, slot.hour)
  const newEndAt = new Date(newStartAt.getTime() + (booking.sessionType.durationMinutes + location.turnoverMinutes) * 60_000)

  let moved: Awaited<ReturnType<typeof rescheduleByClient>>
  try {
    moved = await rescheduleByClient(db, {
      bookingId,
      clientId: client.id,
      cancellationWindowHours: location.cancellationWindowHours,
      newStartAt,
      newEndAt,
      newSlotOffPeak: slot.quietHours,
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
