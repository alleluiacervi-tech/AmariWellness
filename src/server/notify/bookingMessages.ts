// No `server-only` guard, deliberately — takes `db` and the adapters as
// parameters (see `src/server/availability/conflicts.ts` for why), so a
// vitest run can send through capturing adapters against a real
// Postgres and assert exactly what a client would have received.
import { and, desc, eq } from "drizzle-orm"
import QRCode from "qrcode"
import type { Database } from "../db/client"
import { bookings, clients, locations, notifications, payments, sessionTypes, type NotificationTemplate } from "../db/schema"
import { encodeQrPayload } from "../qr"
import { bookingReference } from "../../lib/booking"
import { SITE_CONFIG } from "../../data/site"
import { renderBookingMessage } from "./templates"
import { getEmailAdapter, type EmailAdapter } from "./email"
import { getWhatsAppAdapter, type WhatsAppAdapter } from "./whatsapp"

export type NotifyDeps = { email: EmailAdapter; whatsapp: WhatsAppAdapter; siteUrl: string }

export function defaultNotifyDeps(): NotifyDeps {
  return { email: getEmailAdapter(), whatsapp: getWhatsAppAdapter(), siteUrl: SITE_CONFIG.url }
}

type NotificationRow = typeof notifications.$inferSelect

export type MessageExtras = { refundedRwf?: number | null; lateCancellation?: boolean; now?: Date }

/**
 * Sends one booking message on every channel the client can be reached
 * on — email if they gave one, WhatsApp if they have a phone — and
 * records each attempt in `notifications`, failures included. A provider
 * failure never throws: the booking is already real by the time this
 * runs, and a missed message must not undo or block it. It's logged
 * instead, so staff can see who didn't get their QR and resend.
 *
 * A walk-in with neither phone nor email gets nothing and nothing is
 * logged — there's no one to send to.
 */
export async function sendBookingMessage(
  db: Database,
  bookingId: string,
  template: NotificationTemplate,
  deps: NotifyDeps,
  extra: MessageExtras = {},
): Promise<NotificationRow[]> {
  const [row] = await db
    .select({ booking: bookings, client: clients, session: sessionTypes, location: locations })
    .from(bookings)
    .innerJoin(clients, eq(clients.id, bookings.clientId))
    .innerJoin(sessionTypes, eq(sessionTypes.id, bookings.sessionTypeId))
    .innerJoin(locations, eq(locations.id, bookings.locationId))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  if (!row) throw new Error(`Booking ${bookingId} not found.`)
  const { booking, client, session, location } = row

  const email = client.email?.trim() || null
  const phone = client.phone?.trim() || null
  if (!email && !phone) return []

  const [paid] = await db
    .select({ amountRwf: payments.amountRwf })
    .from(payments)
    .where(and(eq(payments.bookingId, booking.id), eq(payments.status, "succeeded")))
    .orderBy(desc(payments.createdAt))
    .limit(1)

  const rendered = renderBookingMessage(template, {
    reference: bookingReference(booking.id),
    clientName: client.name,
    sessionName: session.name,
    durationMinutes: session.durationMinutes,
    startAt: booking.startAt,
    amountPaidRwf: paid?.amountRwf ?? null,
    businessName: location.name,
    address: [location.street, location.neighborhood, location.city].filter(Boolean).join(", "),
    mapsUrl: location.mapsUrl,
    accountUrl: `${deps.siteUrl.replace(/\/$/, "")}/account`,
    cancellationWindowHours: location.cancellationWindowHours,
    changeableOnline: booking.source === "online",
    whatsappUrl: location.whatsapp ? `https://wa.me/${location.whatsapp}` : null,
    refundedRwf: extra.refundedRwf,
    lateCancellation: extra.lateCancellation,
    now: extra.now,
  })

  let qrPng: Buffer | null = null
  let html = rendered.html
  if (rendered.includesQr && booking.qrToken) {
    qrPng = await QRCode.toBuffer(encodeQrPayload(booking.id, booking.qrToken), { type: "png", margin: 1, width: 440 })
  } else if (rendered.includesQr) {
    html = html.replace(/<p><img src="cid:qr"[^>]*><\/p>/, "")
  }

  const base = { locationId: location.id, bookingId: booking.id, clientId: client.id, template, body: rendered.text }
  const logged: NotificationRow[] = []

  async function attempt(
    channel: "email" | "whatsapp",
    recipient: string,
    provider: string,
    subject: string | null,
    send: () => Promise<{ providerMessageId?: string }>,
  ) {
    let values: typeof notifications.$inferInsert
    try {
      const result = await send()
      values = { ...base, channel, recipient, subject, provider, status: "sent", providerMessageId: result.providerMessageId ?? null }
    } catch (err) {
      values = { ...base, channel, recipient, subject, provider, status: "failed", error: err instanceof Error ? err.message : String(err) }
    }
    const [inserted] = await db.insert(notifications).values(values).returning()
    logged.push(inserted)
  }

  if (email) {
    await attempt("email", email, deps.email.name, rendered.subject, () =>
      deps.email.send({
        to: email,
        subject: rendered.subject,
        text: rendered.text,
        html,
        attachments: qrPng
          ? [{ filename: `amari-${bookingReference(booking.id)}.png`, contentType: "image/png", content: qrPng, contentId: "qr" }]
          : [],
      }),
    )
  }
  if (phone) {
    await attempt("whatsapp", phone, deps.whatsapp.name, null, () =>
      deps.whatsapp.send({
        to: phone,
        template,
        text: rendered.text,
        image: qrPng ? { content: qrPng, contentType: "image/png", filename: `amari-${bookingReference(booking.id)}.png` } : undefined,
      }),
    )
  }

  return logged
}
