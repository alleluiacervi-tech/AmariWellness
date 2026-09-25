import { boolean, date, integer, jsonb, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * A physical Amari branch. Every operational record (suites, bookings,
 * staff) belongs to one, so opening a second branch is a new row here,
 * not a schema change. Phase 1 ships with exactly one row.
 */
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("Africa/Kigali"),

  street: text("street").notNull(),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("Rwanda"),
  plusCode: text("plus_code"),
  mapsUrl: text("maps_url"),
  landmark: text("landmark"),
  parkingNote: text("parking_note"),

  phone: text("phone"),
  whatsapp: text("whatsapp"), // digits only, for wa.me links
  email: text("email"),

  /* Weekly opening hours as minutes-from-midnight, so "closed" is simply
     absent rather than a magic 0–0 range. Holidays and one-off closures
     are separate rows in `holidays`, not encoded here. */
  weekdayOpen: time("weekday_open").notNull().default("10:00"),
  weekdayClose: time("weekday_close").notNull().default("21:00"),
  weekendOpen: time("weekend_open").notNull().default("09:00"),
  weekendClose: time("weekend_close").notNull().default("20:00"),

  /* Minutes reserved after every booking before the suite can be sold
     again — the turnover time the site already promises guests. */
  turnoverMinutes: integer("turnover_minutes").notNull().default(15),
  quietHoursEndHour: integer("quiet_hours_end_hour").notNull().default(16),
  cancellationWindowHours: integer("cancellation_window_hours").notNull().default(4),
  holdMinutes: integer("hold_minutes").notNull().default(10),

  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/** A named closure or altered-hours day: Christmas, a public holiday, a one-off early close. */
export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  label: text("label").notNull(),
  closed: boolean("closed").notNull().default(true),
  /** Only read when closed = false: an altered-hours day. */
  customOpen: time("custom_open"),
  customClose: time("custom_close"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/** Social and messaging links shown in the footer. Ordered, so new platforms slot in without a migration. */
export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | ...
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

/**
 * Freeform editable text the admin can change without a deploy: FAQ
 * answers, the hero lead, journal-adjacent copy. Keyed by a dotted path
 * the front end looks up (e.g. "home.hero.lead"). `value` is JSON so a
 * block can be a string, a list, or richer structured copy later.
 */
export const contentBlocks = pgTable("content_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedByStaffId: uuid("updated_by_staff_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  group: text("group").notNull(), // 'home' | 'sessions' | 'space' | 'packs'
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})
