"use server"

/**
 * Server Actions for client sign-in (Phase 1.4b — see CLAUDE.md §3): no
 * passwords, a phone number plus a one-time code, the account created
 * automatically from the verified number. Two verify paths share the
 * same OTP-checking logic but differ in what happens after: booking
 * (`verifyOtpForBooking`) stays on the same page and returns client
 * state so the flow can continue inline; account sign-in
 * (`verifyOtpAndSignInAccount`) redirects to `/account`.
 *
 * Every export re-derives who's asking from the database, the same
 * "don't trust an argument the client could have forged" rule
 * `src/server/auth/actions.ts` documents.
 */

import { redirect } from "next/navigation"
import { z } from "zod"
import { and, desc, eq, gt, isNull } from "drizzle-orm"
import { db } from "../db/client"
import { clientOtpCodes } from "../db/schema"
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "../auth/otp"
import { getSmsAdapter } from "../notify/sms"
import { findOrCreateClient } from "../people/findOrCreateClient"
import { createClientSession, destroyCurrentClientSession } from "./session"
import { requireClientAction } from "./dal"
import { clients } from "../db/schema"

const OTP_LIFETIME_MS = 10 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "")
}

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number."),
})

export type OtpRequestState = { error?: string; sent?: boolean; phone?: string; devCode?: string }

/**
 * Not rate-limited beyond the OTP's own short lifetime and single-use
 * consumption — the sandbox SMS adapter just logs to console, so
 * spamming it costs nothing real yet. Worth adding a per-phone cooldown
 * before a real SMS provider (with real per-message cost) is wired in.
 */
export async function requestOtp(_prev: OtpRequestState, formData: FormData): Promise<OtpRequestState> {
  const parsed = phoneSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid phone number." }
  const phone = normalizePhone(parsed.data.phone)

  const code = generateOtpCode()
  await db.insert(clientOtpCodes).values({
    phone,
    codeHash: hashOtpCode(code),
    expiresAt: new Date(Date.now() + OTP_LIFETIME_MS),
  })

  const sms = getSmsAdapter()
  await sms.send(phone, `Your Amari verification code is ${code}. It expires in 10 minutes.`)

  // The console adapter logs instead of sending — until a real SMS/WhatsApp
  // provider is chosen (Phase 0), echo the code back so the sandbox flow
  // is actually usable, the same "sandbox mode" pattern payments/QR use.
  return { sent: true, phone, devCode: sms.name === "console" ? code : undefined }
}

async function consumeValidOtp(phone: string, code: string): Promise<{ error: string } | { ok: true }> {
  const [record] = await db
    .select()
    .from(clientOtpCodes)
    .where(and(eq(clientOtpCodes.phone, phone), isNull(clientOtpCodes.consumedAt), gt(clientOtpCodes.expiresAt, new Date())))
    .orderBy(desc(clientOtpCodes.createdAt))
    .limit(1)

  if (!record) return { error: "That code has expired. Request a new one." }
  if (record.attempts >= MAX_OTP_ATTEMPTS) return { error: "Too many attempts. Request a new code." }

  if (!verifyOtpCode(code, record.codeHash)) {
    await db.update(clientOtpCodes).set({ attempts: record.attempts + 1 }).where(eq(clientOtpCodes.id, record.id))
    return { error: "That code doesn't match." }
  }

  await db.update(clientOtpCodes).set({ consumedAt: new Date() }).where(eq(clientOtpCodes.id, record.id))
  return { ok: true }
}

const verifyForBookingSchema = z.object({
  phone: z.string().trim().min(1),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email, or leave it blank.").max(200)]).optional(),
})

export type VerifyBookingState = {
  error?: string
  verified?: boolean
  clientId?: string
  needsHealthAck?: boolean
}

export async function verifyOtpForBooking(_prev: VerifyBookingState, formData: FormData): Promise<VerifyBookingState> {
  const parsed = verifyForBookingSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the code and try again." }
  const phone = normalizePhone(parsed.data.phone)

  const result = await consumeValidOtp(phone, parsed.data.code)
  if ("error" in result) return { error: result.error }

  const client = await findOrCreateClient({ name: parsed.data.name, phone, email: parsed.data.email, phoneVerified: true })
  await createClientSession(client.id)

  return { verified: true, clientId: client.id, needsHealthAck: !client.healthAcknowledgedAt }
}

const verifyForAccountSchema = z.object({
  phone: z.string().trim().min(1),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
})

export type VerifyAccountState = { error?: string }

export async function verifyOtpAndSignInAccount(_prev: VerifyAccountState, formData: FormData): Promise<VerifyAccountState> {
  const parsed = verifyForAccountSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the code and try again." }
  const phone = normalizePhone(parsed.data.phone)

  const result = await consumeValidOtp(phone, parsed.data.code)
  if ("error" in result) return { error: result.error }

  // "The account is created automatically from the verified phone
  // number" (CLAUDE.md §3) — this holds even for a number with no
  // booking history yet; the account page shows an empty state instead.
  const client = await findOrCreateClient({ name: "Guest", phone })
  await createClientSession(client.id)
  redirect("/account")
}

export type HealthAckState = { error?: string; ok?: boolean }

export async function acknowledgeHealth(_prev: HealthAckState): Promise<HealthAckState> {
  const client = await requireClientAction()
  await db.update(clients).set({ healthAcknowledgedAt: new Date(), updatedAt: new Date() }).where(eq(clients.id, client.id))
  return { ok: true }
}

export async function clientLogoutAction(): Promise<void> {
  await destroyCurrentClientSession()
  redirect("/")
}
