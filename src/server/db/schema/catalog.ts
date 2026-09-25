import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { locations } from "./locations"

/**
 * A sellable session (The Quick Reset, The Half Hour, ...). Prices live
 * in `sessionTypePrices`, never here — this row is the stable identity
 * a booking points to; only the *current* price row is used for new
 * sales, and a completed booking keeps the price it was made at
 * (`bookings.priceAtBookingRwf`), so changing a price here never
 * rewrites the past.
 */
export const sessionTypes = pgTable("session_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(), // 'quick' | 'half' | 'full' — stable for URLs like /book?session=
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  label: text("label").notNull(), // "A pause in your day"
  intro: text("intro").notNull(),
  summary: text("summary").notNull(),
  about: text("about").notNull(),
  highlights: text("highlights").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Every price a session type has ever had. `effectiveTo` is null for the
 * current price. Never update a row in place — insert a new one and
 * close out the old one's `effectiveTo` in the same transaction. This is
 * what lets prices change without altering the price of a booking made
 * under the old price.
 */
export const sessionTypePrices = pgTable("session_type_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionTypeId: uuid("session_type_id")
    .notNull()
    .references(() => sessionTypes.id, { onDelete: "cascade" }),
  priceRwf: integer("price_rwf").notNull(),
  offPeakPriceRwf: integer("off_peak_price_rwf").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  changedByStaffId: uuid("changed_by_staff_id"),
  reason: text("reason"),
})

export const promoCodeKind = ["percent", "fixed"] as const

export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  kind: text("kind", { enum: promoCodeKind }).notNull(),
  /** Percent (1–100) if kind = 'percent'; RWF amount if kind = 'fixed'. */
  value: integer("value").notNull(),
  /** Empty array = applies to every session type. */
  appliesToSessionTypeIds: uuid("applies_to_session_type_ids").array().notNull().default([]),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
  validTo: timestamp("valid_to", { withTimezone: true }),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdByStaffId: uuid("created_by_staff_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
