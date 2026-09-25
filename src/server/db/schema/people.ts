import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * A client identified by phone number (see CLAUDE.md §3: accounts are
 * passwordless, created automatically from a verified phone number).
 * `phone` is nullable so a front-desk walk-in can be recorded with a
 * name only — they simply can't sign into the client area or receive a
 * QR by WhatsApp until a phone is added. The partial unique index (in
 * the migration) enforces uniqueness only where phone is not null.
 */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone"),
  name: text("name").notNull(),
  email: text("email"),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  /** Set once the client has acknowledged the health questions (pregnancy, pacemaker, recent surgery, spinal injury). Required before a first booking is confirmed. */
  healthAcknowledgedAt: timestamp("health_acknowledged_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One-time codes for client sign-in (SMS/WhatsApp). Short-lived and
 * consumed once. `codeHash` never stores the plain code — see
 * `src/server/auth/otp.ts`.
 */
export const clientOtpCodes = pgTable("client_otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/** Cookie-backed client session, created once an OTP is verified. */
export const clientAuthSessions = pgTable("client_auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const staffRoleValues = ["owner", "manager", "front_desk", "finance"] as const
export type StaffRole = (typeof staffRoleValues)[number]

export const staffUsers = pgTable("staff_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: staffRoleValues }).notNull(),
  passwordHash: text("password_hash").notNull(),
  /** Base32 TOTP secret; null until the staff member has enrolled two-step verification. */
  totpSecret: text("totp_secret"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/** Cookie-backed staff session. `mfaVerifiedAt` gates access until TOTP is confirmed for this session. */
export const staffAuthSessions = pgTable("staff_auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffUserId: uuid("staff_user_id")
    .notNull()
    .references(() => staffUsers.id, { onDelete: "cascade" }),
  mfaVerifiedAt: timestamp("mfa_verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Add-only record of every admin action worth accounting for: a refund,
 * a price change, a manual booking edit. `before`/`after` are JSON
 * snapshots of the affected row's relevant fields. Nothing in this
 * codebase issues an UPDATE or DELETE against this table (enforced in
 * the migration, same pattern as `ledger_entries`).
 */
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffUserId: uuid("staff_user_id"),
  action: text("action").notNull(), // 'price.change' | 'booking.refund' | 'booking.cancel' | ...
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  before: text("before"), // JSON-stringified; text so partial/irregular shapes never fail a schema
  after: text("after"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
