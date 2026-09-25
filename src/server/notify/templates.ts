/**
 * The words in every booking message (Phase 1.5). Pure functions of a
 * `BookingMessageContext` — no database, no provider — so what a client
 * is told is testable on its own, and changing the wording never touches
 * sending logic. Email and WhatsApp share the same text; email adds an
 * HTML version with the QR shown inline (`cid:qr`).
 *
 * Voice follows AGENTS.md: sentence case, plain words, no middle dots.
 */
import type { NotificationTemplate } from "../db/schema"
import { formatKigaliDay, formatKigaliTime, formatRwf, kigaliDateISO } from "../../lib/kigaliTime"

export type BookingMessageContext = {
  reference: string
  clientName: string
  sessionName: string
  durationMinutes: number
  startAt: Date
  amountPaidRwf: number | null
  businessName: string
  address: string
  mapsUrl: string | null
  accountUrl: string
  cancellationWindowHours: number
  /** booking_cancelled only: what was refunded, if anything. */
  refundedRwf?: number | null
  /** booking_cancelled only: the client cancelled inside the free-cancellation window, so the session is forfeited under the policy. */
  lateCancellation?: boolean
  /** reminder_24h only: says "tomorrow" or "today" relative to this, since a delayed job run can land on the day itself. Defaults to the current time. */
  now?: Date
}

export type RenderedMessage = {
  subject: string
  text: string
  html: string
  /** Whether the QR image belongs with this message — the confirmation, a reschedule and the 2-hour reminder, which is the one most likely open at the door. */
  includesQr: boolean
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

function when(ctx: BookingMessageContext) {
  return `${formatKigaliDay(ctx.startAt)} at ${formatKigaliTime(ctx.startAt)}`
}

function detailLines(ctx: BookingMessageContext, withPaid: boolean): string[] {
  const lines = [`${ctx.sessionName}, ${ctx.durationMinutes} minutes`, when(ctx), `Reference ${ctx.reference}`]
  if (withPaid && ctx.amountPaidRwf) lines.push(`Paid ${formatRwf(ctx.amountPaidRwf)}`)
  return lines
}

function footerLines(ctx: BookingMessageContext): string[] {
  const lines = [ctx.businessName, ctx.address]
  if (ctx.mapsUrl) lines.push(`Directions: ${ctx.mapsUrl}`)
  return lines
}

function changePolicyLine(ctx: BookingMessageContext) {
  return `Need to change it? Cancel or move your session free of charge up to ${ctx.cancellationWindowHours} hours before: ${ctx.accountUrl}`
}

const QR_LINE = "Show the QR code in this message at reception. It works once, on the day of your session."

function compose(subject: string, paragraphs: string[][], includesQr: boolean): RenderedMessage {
  const text = paragraphs.map((p) => p.join("\n")).join("\n\n")
  const htmlParagraphs = paragraphs.map((p) => `<p>${p.map(escapeHtml).join("<br>")}</p>`)
  if (includesQr) {
    // After the booking details, before the policy and address.
    htmlParagraphs.splice(2, 0, `<p><img src="cid:qr" alt="Check-in QR code" width="220" height="220"></p>`)
  }
  const html = `<!doctype html><html><body style="font-family:sans-serif;line-height:1.5;color:#2b2622">${htmlParagraphs.join("")}</body></html>`
  return { subject, text, html, includesQr }
}

export function renderBookingMessage(template: NotificationTemplate, ctx: BookingMessageContext): RenderedMessage {
  const hello = [`Hello ${firstName(ctx.clientName)},`]
  const shortWhen = `${formatKigaliDay(ctx.startAt)}, ${formatKigaliTime(ctx.startAt)}`

  switch (template) {
    case "booking_confirmed":
      return compose(
        `Your Amari session is booked: ${shortWhen}`,
        [hello, ["Your session is booked.", ...detailLines(ctx, true)], [QR_LINE], [changePolicyLine(ctx)], footerLines(ctx)],
        true,
      )
    case "booking_rescheduled":
      return compose(
        `Your Amari session has moved: ${shortWhen}`,
        [hello, ["Your session has moved to a new time.", ...detailLines(ctx, false)], [QR_LINE], [changePolicyLine(ctx)], footerLines(ctx)],
        true,
      )
    case "reminder_24h": {
      const day = isKigaliTomorrow(ctx.startAt, ctx.now ?? new Date()) ? "tomorrow" : "today"
      return compose(
        `${day === "tomorrow" ? "Tomorrow" : "Today"} at ${formatKigaliTime(ctx.startAt)}: your Amari session`,
        [
          hello,
          [`A reminder that your session is ${day}.`, ...detailLines(ctx, false)],
          ["Bring the QR code from your confirmation. It works once, on the day."],
          [changePolicyLine(ctx)],
          footerLines(ctx),
        ],
        false,
      )
    }
    case "reminder_2h":
      return compose(
        `In two hours: your Amari session at ${formatKigaliTime(ctx.startAt)}`,
        [
          hello,
          ["Your session starts in about two hours.", ...detailLines(ctx, false)],
          [QR_LINE],
          ["Arrive a few minutes early to settle in."],
          footerLines(ctx),
        ],
        true,
      )
    case "booking_cancelled": {
      const outcome = ctx.refundedRwf
        ? `A refund of ${formatRwf(ctx.refundedRwf)} is on its way to the account you paid from.`
        : ctx.lateCancellation
          ? `It was cancelled within ${ctx.cancellationWindowHours} hours of the start, so under our cancellation policy the session is not refunded.`
          : "If you weren't expecting this, reply to this message and we'll sort it out."
      return compose(
        `Your Amari session is cancelled: ${shortWhen}`,
        [hello, ["Your session is cancelled.", ...detailLines(ctx, false)], [outcome], [`Book again any time: ${ctx.accountUrl.replace(/\/account$/, "/book")}`], footerLines(ctx)],
        false,
      )
    }
  }
}

/** Whether `startAt` falls on the Kigali calendar day after `now`. */
export function isKigaliTomorrow(startAt: Date, now: Date): boolean {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return kigaliDateISO(startAt) === kigaliDateISO(tomorrow)
}
