"use server"

/**
 * Server Actions the real public `/book` flow (Phase 1.4b) submits to.
 * A booking is created only once a client is signed in (phone verified
 * via `src/server/client-auth/actions.ts`) and only ever starts "held";
 * `confirmPaymentAction` is the one place it becomes real, standing in
 * for a provider webhook until Phase 0 picks a real payment provider.
 */

import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import QRCode from "qrcode"
import { db } from "../db/client"
import { paymentMethodValues, sessionTypePrices, sessionTypes } from "../db/schema"
import { getLocation } from "../db/content"
import { requireClientAction } from "../client-auth/dal"
import { getDaySlots, kigaliWallTimeToUtc, type Slot } from "../availability/slots"
import { priceForSlot } from "../availability/pricing"
import { createHold, SlotTakenError } from "../availability/createHold"
import { beginSandboxPayment, confirmSandboxPayment, PaymentNotPendingError } from "../availability/confirm"
import { encodeQrPayload } from "../qr"

export async function getSlotsAction(dateISO: string, sessionTypeUuid: string): Promise<Slot[]> {
  const location = await getLocation()
  return getDaySlots(db, location, dateISO, sessionTypeUuid)
}

export type BeginPaymentState = {
  error?: string
  started?: boolean
  bookingId?: string
  paymentId?: string
  amountRwf?: number
  offPeak?: boolean
}

const beginPaymentSchema = z.object({
  sessionTypeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  paymentMethod: z.enum(paymentMethodValues),
})

export async function beginPaymentAction(_prev: BeginPaymentState, formData: FormData): Promise<BeginPaymentState> {
  const client = await requireClientAction()
  const parsed = beginPaymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  const { sessionTypeId, date, time, paymentMethod } = parsed.data

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

  let booking
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
      source: "online",
    })
  } catch (err) {
    if (err instanceof SlotTakenError) return { error: err.message }
    throw err
  }

  const payment = await beginSandboxPayment(db, {
    locationId: location.id,
    bookingId: booking.id,
    clientId: client.id,
    amountRwf: priceRwf,
    method: paymentMethod,
    phone: client.phone ?? undefined,
  })

  return { started: true, bookingId: booking.id, paymentId: payment.id, amountRwf: priceRwf, offPeak }
}

export type ConfirmPaymentState = {
  error?: string
  confirmed?: boolean
  bookingId?: string
  qrDataUrl?: string
}

const confirmPaymentSchema = z.object({ paymentId: z.string().uuid() })

export async function confirmPaymentAction(_prev: ConfirmPaymentState, formData: FormData): Promise<ConfirmPaymentState> {
  await requireClientAction()
  const parsed = confirmPaymentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Something went wrong — refresh and try again." }

  let booking
  try {
    booking = await confirmSandboxPayment(db, parsed.data.paymentId)
  } catch (err) {
    if (err instanceof PaymentNotPendingError) return { error: err.message }
    throw err
  }

  // Rendered server-side (same QRCode.toDataURL pattern staff TOTP
  // enrollment already uses) so the qrcode package never needs to ship
  // to the browser just for this one image.
  const qrDataUrl = booking.qrToken
    ? await QRCode.toDataURL(encodeQrPayload(booking.id, booking.qrToken), { margin: 1, width: 220 })
    : undefined

  return { confirmed: true, bookingId: booking.id, qrDataUrl }
}
