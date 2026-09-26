import "server-only"
import { after } from "next/server"
import { db } from "../db/client"
import type { NotificationTemplate } from "../db/schema"
import { defaultNotifyDeps, sendBookingMessage, type MessageExtras } from "./bookingMessages"

/**
 * Sends a booking message after the response has gone back to the
 * browser (Next's `after`), so a slow email or WhatsApp provider never
 * delays the confirmation screen, and a provider outage never turns a
 * paid booking into an error page. `sendBookingMessage` already logs
 * provider failures to `notifications`; anything else (a database error
 * mid-send) is caught here and logged, since there is no request left to
 * fail by then.
 */
export function notifyAfterResponse(bookingId: string, template: NotificationTemplate, extra?: MessageExtras) {
  after(async () => {
    try {
      await sendBookingMessage(db, bookingId, template, defaultNotifyDeps(), extra)
    } catch (err) {
      console.error(`[notify] ${template} for booking ${bookingId} failed:`, err)
    }
  })
}
