import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { locations } from "./locations"
import { bookings } from "./bookings"
import { clients } from "./people"
import { sessionTypes } from "./catalog"

export const paymentMethodValues = ["momo", "airtel", "card", "other"] as const
export type PaymentMethod = (typeof paymentMethodValues)[number]
export const paymentStatusValues = ["pending", "succeeded", "failed", "refunded"] as const

/**
 * One attempt to move money through a provider. Created the moment a
 * hold begins to be paid; its `status` transitions pending → succeeded
 * or pending → failed only from the provider adapter's webhook handler
 * (see `src/server/payments/`), never from user-facing code guessing at
 * success. A booking is only ever confirmed by a `succeeded` payment —
 * see `src/server/availability/confirm.ts`.
 *
 * The amount and provider reference are fixed at creation from what the
 * provider actually reports; nothing in the app updates `amountRwf`
 * after the row exists.
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  provider: text("provider").notNull(), // 'sandbox' | 'flutterwave' | 'paypack' | ...
  providerReference: text("provider_reference").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  packPurchaseId: uuid("pack_purchase_id"),
  voucherPurchaseId: uuid("voucher_purchase_id"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  amountRwf: integer("amount_rwf").notNull(),
  method: text("method", { enum: paymentMethodValues }).notNull(),
  status: text("status", { enum: paymentStatusValues }).notNull().default("pending"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const ledgerEntryTypeValues = [
  "payment_received",
  "refund",
  "discount_applied",
  "pack_purchase",
  "pack_session_used", // zero-amount, informational: records when a prepaid credit was spent
  "voucher_purchase",
  "voucher_redeemed",
  "correction",
] as const

/**
 * The single source of truth for money in and out. Add-only: migration
 * 0001 installs a trigger that raises an error on any UPDATE or DELETE
 * against this table for the application's database role, so "income"
 * cannot be edited by anyone — including the Owner role — through any
 * code path, by design rather than by permission check alone (see
 * CLAUDE.md §3). `amountRwf` is signed: positive for money in, negative
 * for refunds. Every report of "money generated" is a SUM() over this
 * table, never a stored counter.
 */
export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  type: text("type", { enum: ledgerEntryTypeValues }).notNull(),
  amountRwf: integer("amount_rwf").notNull(),
  bookingId: uuid("booking_id"),
  paymentId: uuid("payment_id"),
  packPurchaseId: uuid("pack_purchase_id"),
  voucherId: uuid("voucher_id"),
  companyAccountId: uuid("company_account_id"),
  clientId: uuid("client_id"),
  staffUserId: uuid("staff_user_id"), // null for a system-generated entry (e.g. a webhook-confirmed payment)
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/** A sellable bundle of sessions ("Ten Half Hours"). Mirrors `src/data/packs.ts` today; that file is retired once Phase 1.3 wires the admin to this table. */
export const packProducts = pgTable("pack_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sessionTypeId: uuid("session_type_id")
    .notNull()
    .references(() => sessionTypes.id, { onDelete: "restrict" }),
  sessionsIncluded: integer("sessions_included").notNull(),
  priceRwf: integer("price_rwf").notNull(),
  validityDays: integer("validity_days").notNull(),
  description: text("description").notNull(),
  includes: text("includes").array().notNull().default([]),
  extras: text("extras").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

/**
 * One client's (or one company's) purchase of a pack. `sessionsRemaining`
 * is a cached counter kept in step with `pack_usages` inside the same
 * transaction as every booking check-in — see
 * `src/server/packs/usePackSession.ts` — with `pack_usages` as the
 * append-only record of truth if the two ever need reconciling.
 */
export const packPurchases = pgTable("pack_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  packProductId: uuid("pack_product_id")
    .notNull()
    .references(() => packProducts.id, { onDelete: "restrict" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" }),
  companyAccountId: uuid("company_account_id"),
  sessionsTotal: integer("sessions_total").notNull(),
  sessionsRemaining: integer("sessions_remaining").notNull(),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  expiryReminderSentAt: timestamp("expiry_reminder_sent_at", { withTimezone: true }),
})

/** Add-only record of each time a pack credit paid for a booking. */
export const packUsages = pgTable("pack_usages", {
  id: uuid("id").primaryKey().defaultRandom(),
  packPurchaseId: uuid("pack_purchase_id")
    .notNull()
    .references(() => packPurchases.id, { onDelete: "restrict" }),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
})

export const voucherStatusValues = ["active", "redeemed", "expired", "cancelled"] as const

export const vouchers = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  initialValueRwf: integer("initial_value_rwf").notNull(),
  remainingValueRwf: integer("remaining_value_rwf").notNull(),
  purchaserClientId: uuid("purchaser_client_id").references(() => clients.id, { onDelete: "set null" }),
  recipientNote: text("recipient_note"),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  status: text("status", { enum: voucherStatusValues }).notNull().default("active"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
})

/** Add-only record of each time a voucher paid (in full or in part) for a booking. */
export const voucherRedemptions = pgTable("voucher_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  voucherId: uuid("voucher_id")
    .notNull()
    .references(() => vouchers.id, { onDelete: "restrict" }),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  amountUsedRwf: integer("amount_used_rwf").notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
})

export const companyAccounts = pgTable("company_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  billingAddress: text("billing_address"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const companyMemberRoleValues = ["admin", "member"] as const

/** Joins a client to a company account, e.g. via the invite link mentioned in CLAUDE.md §3. */
export const companyMembers = pgTable("company_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyAccountId: uuid("company_account_id")
    .notNull()
    .references(() => companyAccounts.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  role: text("role", { enum: companyMemberRoleValues }).notNull().default("member"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
})

export const companyInvoices = pgTable("company_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyAccountId: uuid("company_account_id")
    .notNull()
    .references(() => companyAccounts.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  amountRwf: integer("amount_rwf").notNull(),
  status: text("status", { enum: ["draft", "issued", "paid", "overdue"] }).notNull().default("draft"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Phase 1: a staff member types in the receipt number from the RRA's own
 * EBM software after issuing it at the desk (see CLAUDE.md §5). Phase 3
 * replaces the manual entry with a direct VSDC integration that fills
 * this row automatically; the shape stays the same either way.
 */
export const ebmReceipts = pgTable("ebm_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "restrict" }),
  receiptNumber: text("receipt_number").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  issuedByStaffId: uuid("issued_by_staff_id"),
  raw: jsonb("raw"),
})
