import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { locations } from "./locations"
import { suites } from "./suites"
import { sessionTypes } from "./catalog"
import { clients } from "./people"

export const bookingStatusValues = [
  "held", // payment in progress; the slot is reserved but not yet paid
  "confirmed", // payment succeeded
  "checked_in", // QR scanned at the door
  "completed", // session finished
  "cancelled",
  "no_show",
] as const
export type BookingStatus = (typeof bookingStatusValues)[number]

export const bookingSourceValues = ["online", "walk_in", "phone"] as const

/**
 * A single reservation of one suite for one session. `startAt`/`endAt`
 * already include the location's turnover minutes, so the exclusion
 * constraint added in migration 0001 (see that file's comment) can
 * compare `endAt` directly without recomputing turnover per row.
 *
 * `priceAtBookingRwf` and `offPeak` are copied from the session type's
 * current price at the moment of booking — see `catalog.ts` — so a
 * later price change never rewrites a past or in-flight booking.
 */
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  suiteId: uuid("suite_id")
    .notNull()
    .references(() => suites.id, { onDelete: "restrict" }),
  sessionTypeId: uuid("session_type_id")
    .notNull()
    .references(() => sessionTypes.id, { onDelete: "restrict" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  /** Session end + the location's turnover minutes. The suite is unavailable for the whole span. */
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),

  status: text("status", { enum: bookingStatusValues }).notNull().default("held"),
  source: text("source", { enum: bookingSourceValues }).notNull().default("online"),

  priceAtBookingRwf: integer("price_at_booking_rwf").notNull(),
  offPeak: boolean("off_peak").notNull().default(false),
  promoCodeId: uuid("promo_code_id"),
  discountRwf: integer("discount_rwf").notNull().default(0),

  /** A held booking not paid by this time is treated as free in availability queries; the sweep job then flips its status. */
  holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),

  /** Set once a pack credit or voucher pays for this booking instead of a fresh payment. */
  packPurchaseId: uuid("pack_purchase_id"),
  voucherId: uuid("voucher_id"),

  /** Random, unguessable token embedded in the QR. Signed at generation time — see `src/server/qr.ts`; the signature is never stored, only recomputed and checked. */
  qrToken: text("qr_token"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedInByStaffId: uuid("checked_in_by_staff_id"),

  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
  cancelledByStaffId: uuid("cancelled_by_staff_id"),
  createdByStaffId: uuid("created_by_staff_id"), // set for walk_in / phone bookings

  reminder24hSentAt: timestamp("reminder_24h_sent_at", { withTimezone: true }),
  reminder2hSentAt: timestamp("reminder_2h_sent_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/** Every inbound message: the contact form today, WhatsApp/email once those channels are wired in Phase 1.5. */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["contact_form", "whatsapp", "email"] }).notNull(),
  fromName: text("from_name"),
  fromPhone: text("from_phone"),
  fromEmail: text("from_email"),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status", { enum: ["new", "replied", "closed"] }).notNull().default("new"),
  assignedStaffId: uuid("assigned_staff_id"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const notificationChannelValues = ["email", "whatsapp"] as const
export type NotificationChannel = (typeof notificationChannelValues)[number]
export const notificationTemplateValues = [
  "booking_confirmed",
  "booking_rescheduled",
  "booking_cancelled",
  "reminder_24h",
  "reminder_2h",
] as const
export type NotificationTemplate = (typeof notificationTemplateValues)[number]

/**
 * Every outbound message about a booking (Phase 1.5): the confirmation
 * with its QR, the 24-hour and 2-hour reminders, a reschedule or a
 * cancellation. One row per channel per send — including a failed one,
 * with the provider's error — so "did this client get their QR?" is a
 * query, not a guess. The body is kept so staff can see exactly what
 * went out; one-time sign-in codes are never written here.
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  channel: text("channel", { enum: notificationChannelValues }).notNull(),
  template: text("template", { enum: notificationTemplateValues }).notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status", { enum: ["sent", "failed"] }).notNull(),
  provider: text("provider").notNull(),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
},
  // The staff board reads each of today's bookings' messages on every load; a few rows per booking, forever.
  (t) => [index("notifications_booking_id_idx").on(t.bookingId)],
)
