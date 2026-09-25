-- Login lockout for staff accounts. A fixed number of wrong passwords or
-- wrong two-step codes in a row locks the account for a cooldown, tracked
-- server-side rather than trusting the client to slow down. See
-- src/server/auth/actions.ts for where these are read and written.
ALTER TABLE "staff_users" ADD COLUMN "failed_attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "locked_until" timestamp with time zone;
