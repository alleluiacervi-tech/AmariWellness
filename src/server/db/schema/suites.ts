import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { locations } from "./locations"

export const suiteStatus = pgEnum("suite_status", [
  "ready",
  "occupied",
  "cleaning",
  "maintenance",
])

export const suites = pgTable("suites", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: suiteStatus("status").notNull().default("ready"),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * A suite taken out of sale for cleaning-beyond-turnover or repair —
 * distinct from the 15-minute post-booking turnover, which lives on the
 * booking itself. Overlaps the same no-double-booking rule as a booking.
 */
export const maintenanceBlocks = pgTable("maintenance_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  suiteId: uuid("suite_id")
    .notNull()
    .references(() => suites.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull(),
  createdByStaffId: uuid("created_by_staff_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/** Chair care: run-hours and service history, so maintenance is scheduled, not discovered. */
export const chairServiceLog = pgTable("chair_service_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  suiteId: uuid("suite_id")
    .notNull()
    .references(() => suites.id, { onDelete: "cascade" }),
  serviceType: text("service_type").notNull(), // 'routine' | 'repair' | 'inspection'
  note: text("note"),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
  performedByStaffId: uuid("performed_by_staff_id"),
})
