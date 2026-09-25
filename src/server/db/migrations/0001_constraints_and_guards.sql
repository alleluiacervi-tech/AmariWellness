-- Rules the schema alone can't express: the money ledger is append-only,
-- a suite can never be double-booked, and a few "this must never happen"
-- invariants get a database error instead of relying on every future
-- code path remembering to check. See CLAUDE.md §3–4 for why these exist.

--> statement-breakpoint
-- btree_gist lets an exclusion constraint compare a plain equality
-- column (suite_id) alongside a range overlap (the booking's time span)
-- in the same GiST index — this is what makes "no double booking" a
-- database guarantee rather than a race condition two clients could both
-- win.
CREATE EXTENSION IF NOT EXISTS btree_gist;

--> statement-breakpoint
-- No two bookings for the same suite may overlap while either is
-- "live" (held, confirmed, or checked in). Cancelled/completed/no-show
-- bookings are excluded so history never blocks a new booking.
--
-- This constraint intentionally does NOT know about `hold_expires_at` —
-- Postgres exclusion constraints must be backed by an immutable index,
-- and "is this hold still valid right now" is not immutable. Instead,
-- the booking-creation transaction (src/server/availability/createHold.ts)
-- first expires any of ITS OWN target suite's stale held bookings inside
-- the same transaction before inserting, so a genuinely abandoned hold
-- never blocks a real booking for longer than it takes to notice it.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "suite_id" WITH =,
    tstzrange("start_at", "end_at") WITH &&
  )
  WHERE ("status" IN ('held', 'confirmed', 'checked_in'));

--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_end_after_start"
  CHECK ("end_at" > "start_at");

--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_price_non_negative"
  CHECK ("price_at_booking_rwf" >= 0 AND "discount_rwf" >= 0);

--> statement-breakpoint
-- A booking's own suite/time span never overlaps that suite's maintenance
-- (application-checked at booking time; a second exclusion constraint
-- can't span two tables). This one keeps maintenance blocks from
-- overlapping each other, at least, as basic hygiene.
ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "maintenance_blocks_no_overlap"
  EXCLUDE USING gist (
    "suite_id" WITH =,
    tstzrange("start_at", "end_at") WITH &&
  );

--> statement-breakpoint
-- A phone number identifies a client (CLAUDE.md §3), but a walk-in can be
-- recorded with a name only — so uniqueness applies only where a phone
-- is actually present.
CREATE UNIQUE INDEX "clients_phone_unique" ON "clients" ("phone") WHERE "phone" IS NOT NULL;

--> statement-breakpoint
-- A session type has at most one "current" price at a time (the row
-- with no end date). History is unlimited; the present is singular.
CREATE UNIQUE INDEX "session_type_prices_one_current" ON "session_type_prices" ("session_type_id") WHERE "effective_to" IS NULL;

--> statement-breakpoint
CREATE UNIQUE INDEX "session_types_location_slug" ON "session_types" ("location_id", "slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "pack_products_location_slug" ON "pack_products" ("location_id", "slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_location_code" ON "promo_codes" ("location_id", upper("code"));
--> statement-breakpoint
CREATE UNIQUE INDEX "vouchers_location_code" ON "vouchers" ("location_id", upper("code"));
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_unique" ON "payments" ("provider", "provider_reference");
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_qr_token_unique" ON "bookings" ("qr_token") WHERE "qr_token" IS NOT NULL;

--> statement-breakpoint
CREATE INDEX "bookings_suite_time" ON "bookings" ("suite_id", "start_at");
--> statement-breakpoint
CREATE INDEX "bookings_client" ON "bookings" ("client_id");
--> statement-breakpoint
CREATE INDEX "bookings_status" ON "bookings" ("status");
--> statement-breakpoint
CREATE INDEX "ledger_entries_location_time" ON "ledger_entries" ("location_id", "created_at");
--> statement-breakpoint
CREATE INDEX "ledger_entries_booking" ON "ledger_entries" ("booking_id");
--> statement-breakpoint
CREATE INDEX "messages_status" ON "messages" ("status");
--> statement-breakpoint
CREATE INDEX "pack_purchases_client" ON "pack_purchases" ("client_id");

--> statement-breakpoint
-- The sign of amount_rwf is meaningful and checked at write time, so a
-- bug can't silently record a refund as income. Reports (Phase 1.6)
-- still distinguish "cash received" from "revenue earned" by filtering
-- on `type`, not by trusting the sign alone — see
-- src/server/reports/ledger.ts once it exists.
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_sign" CHECK (
  CASE "type"
    WHEN 'refund' THEN "amount_rwf" <= 0
    WHEN 'discount_applied' THEN "amount_rwf" <= 0
    WHEN 'pack_session_used' THEN "amount_rwf" = 0
    WHEN 'correction' THEN true
    ELSE "amount_rwf" >= 0
  END
);

--> statement-breakpoint
-- A refund, discount, or manual correction must say why — the same rule
-- CLAUDE.md §3 states for the activity log, enforced here too since a
-- ledger entry can in principle be written without going through the
-- activity-log helper.
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reason_required" CHECK (
  "type" NOT IN ('refund', 'discount_applied', 'correction') OR "reason" IS NOT NULL
);

--> statement-breakpoint
-- Append-only tables: money, and the record of who did what. No UPDATE
-- or DELETE reaches these tables from any code path in this app — this
-- trigger makes that true even if a bug tries. It fires for every
-- database role including one with the app's own credentials; only a
-- role with BYPASSRLS/superuser-style privilege to alter the table
-- itself could remove the trigger, which is why production should run
-- the app under an ordinary, non-superuser role (see docs/ops.md once
-- Phase 1 ships).
CREATE OR REPLACE FUNCTION "forbid_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not permitted on this table', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
CREATE TRIGGER "ledger_entries_no_update" BEFORE UPDATE ON "ledger_entries" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "ledger_entries_no_delete" BEFORE DELETE ON "ledger_entries" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "activity_log_no_update" BEFORE UPDATE ON "activity_log" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "activity_log_no_delete" BEFORE DELETE ON "activity_log" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "pack_usages_no_update" BEFORE UPDATE ON "pack_usages" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "pack_usages_no_delete" BEFORE DELETE ON "pack_usages" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "voucher_redemptions_no_update" BEFORE UPDATE ON "voucher_redemptions" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
--> statement-breakpoint
CREATE TRIGGER "voucher_redemptions_no_delete" BEFORE DELETE ON "voucher_redemptions" FOR EACH ROW EXECUTE FUNCTION "forbid_mutation"();
