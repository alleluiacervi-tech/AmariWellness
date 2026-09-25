"use server"

/**
 * Every export here is a Server Action — reachable by direct POST once
 * built, not only through the forms that call it (see
 * node_modules/next/dist/docs/01-app/02-guides/server-actions.md
 * "Security"). Each one re-derives who's asking from the session cookie
 * and the database; none of them trust an argument the client could
 * have forged for who the caller is.
 */

import { redirect } from "next/navigation"
import { z } from "zod"
import QRCode from "qrcode"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { staffUsers } from "../db/schema"
import { hashPassword, verifyPassword } from "./password"
import { generateTotpSecret, totpProvisioningUri, verifyTotp } from "./totp"
import {
  clearPendingEnrollment,
  createPendingEnrollment,
  createStaffSession,
  destroyCurrentStaffSession,
  markSessionMfaVerified,
  readPendingEnrollment,
} from "./session"
import { getSessionState } from "./dal"
import { recordActivity } from "./activity"
import { clearFailedAttempts, lockoutMessage, registerFailedAttempt } from "./lockout"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export type LoginState = {
  error?: string
  step?: "verify" | "enroll"
  enroll?: { secret: string; qrDataUrl: string }
  /**
   * Echoed back so the form can repopulate it. React resets a
   * `<form action={...}>`'s uncontrolled fields to their `defaultValue`
   * after every submission, success or failure (see StaffLoginForm.tsx)
   * — without this, a wrong-password retry would silently clear the
   * email field the visitor already typed correctly.
   */
  email?: string
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = typeof formData.get("email") === "string" ? (formData.get("email") as string) : ""
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return { error: "Enter a valid email and password.", email: rawEmail }
  const { email, password } = parsed.data

  const [staff] = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1)
  // Same generic message whether the email doesn't exist or the password
  // is wrong — telling them apart would let an attacker enumerate staff
  // email addresses.
  const genericError = "Incorrect email or password."
  if (!staff || !staff.active) return { error: genericError, email: rawEmail }

  if (staff.lockedUntil && staff.lockedUntil > new Date()) return { error: lockoutMessage(staff.lockedUntil), email: rawEmail }

  const ok = await verifyPassword(password, staff.passwordHash)
  if (!ok) {
    await registerFailedAttempt(db, staff.id, staff.failedAttempts)
    return { error: genericError, email: rawEmail }
  }
  await clearFailedAttempts(db, staff.id)

  await createStaffSession(staff.id)

  if (staff.totpSecret) {
    return { step: "verify" }
  }

  // First login: generate a secret now, but don't persist it to the
  // account until it's proven — see the comment on createPendingEnrollment.
  const secret = generateTotpSecret()
  await createPendingEnrollment(staff.id, secret)
  const otpauthUri = totpProvisioningUri(secret, staff.email)
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 240 })
  return { step: "enroll", enroll: { secret, qrDataUrl } }
}

const verifySchema = z.object({ code: z.string().trim() })

export type VerifyState = { error?: string }

export async function verifyTotpAction(_prevState: VerifyState, formData: FormData): Promise<VerifyState> {
  const parsed = verifySchema.safeParse({ code: formData.get("code") })
  if (!parsed.success) return { error: "Enter the 6-digit code." }

  const state = await getSessionState()
  if (state.status === "unauthenticated") return { error: "Your sign-in expired. Start again." }
  if (state.status === "authenticated") redirect("/staff") // already done — nothing to verify

  const [staff] = await db.select().from(staffUsers).where(eq(staffUsers.id, state.staff.id)).limit(1)
  if (!staff || !staff.active) return { error: "Your sign-in expired. Start again." }
  if (staff.lockedUntil && staff.lockedUntil > new Date()) return { error: lockoutMessage(staff.lockedUntil) }

  const pendingSecret = await readPendingEnrollment(staff.id)
  const secret = pendingSecret ?? staff.totpSecret
  if (!secret) return { error: "Your sign-in expired. Start again." }

  const ok = verifyTotp(secret, parsed.data.code)
  if (!ok) {
    await registerFailedAttempt(db, staff.id, staff.failedAttempts)
    return { error: "That code didn't match. Check the time on your phone and try again." }
  }

  await clearFailedAttempts(db, staff.id)

  if (pendingSecret) {
    await db.update(staffUsers).set({ totpSecret: pendingSecret }).where(eq(staffUsers.id, staff.id))
    await clearPendingEnrollment()
  }
  await markSessionMfaVerified(state.sessionId)

  await recordActivity({
    staffUserId: staff.id,
    action: pendingSecret ? "staff.mfa_enrolled" : "staff.login",
    entityType: "staff_user",
    entityId: staff.id,
  })

  redirect("/staff")
}

export async function logoutAction(): Promise<void> {
  const state = await getSessionState()
  if (state.status !== "unauthenticated") {
    await recordActivity({ staffUserId: state.staff.id, action: "staff.logout", entityType: "staff_user", entityId: state.staff.id })
  }
  await destroyCurrentStaffSession()
  redirect("/staff/login")
}
