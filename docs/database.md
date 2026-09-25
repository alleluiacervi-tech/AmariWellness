# Database

PostgreSQL, accessed through [Drizzle ORM](https://orm.drizzle.team/). The
schema is the source of truth for the data model described in `CLAUDE.md`
§4; this page is how to run it.

## Local setup

```bash
# One-time: create a role and two databases (dev + test)
createuser amari --login --pwprompt --createdb   # or via your platform's Postgres admin
createdb -O amari amari_dev
createdb -O amari amari_test
psql -d amari_dev  -c 'CREATE EXTENSION IF NOT EXISTS btree_gist;'
psql -d amari_test -c 'CREATE EXTENSION IF NOT EXISTS btree_gist;'

cp .env.example .env.local   # fill in DATABASE_URL for amari_dev

pnpm db:migrate   # applies src/server/db/migrations/ to amari_dev
pnpm db:seed      # loads the content that used to live only in src/data/*.ts
```

`btree_gist` is what makes the no-double-booking rule (below) possible; the
migration also tries to create it, but a non-superuser role may not be
allowed to, so it's created up front here.

## Scripts

| Command | What it does |
|---|---|
| `pnpm db:generate` | Diffs `src/server/db/schema/*.ts` against the last migration and writes a new one. Run this after changing a schema file, then read the generated SQL before committing it. |
| `pnpm db:migrate` | Applies every migration not yet applied to `DATABASE_URL` (`.env.local`). Safe to re-run. |
| `pnpm db:seed` | Loads sessions, packs, FAQs, hours and one staff login per role. Safe to re-run — it upserts by natural key. |
| `pnpm db:studio` | Opens Drizzle Studio, a browser GUI for the database. |
| `pnpm test` | Runs `src/**/*.test.ts` against `amari_test`, never `amari_dev`. |
| `pnpm test:migrate` | Applies migrations to `amari_test`. |

## Migrations

`src/server/db/migrations/` holds two kinds of file:

- **Generated** (`0000_steady_zarda.sql`): produced by `drizzle-kit generate`
  from the schema files. Regenerate with `pnpm db:generate` after changing a
  table.
- **Hand-written** (`0001_constraints_and_guards.sql`): the rules Drizzle
  can't express as a table column — exclusion constraints, triggers, partial
  unique indexes, check constraints. `drizzle-kit` doesn't have a "custom
  migration" command in the version pinned here, so these are written by
  hand and registered in `migrations/meta/_journal.json` alongside the
  generated ones (same format, next `idx`). Both kinds run through the same
  `pnpm db:migrate`.

Never edit a migration that has already been applied anywhere (including
your own machine) — write a new one instead, the same as any other
migration tool.

## What the constraints actually guarantee

These are tested in `src/server/db/__tests__/constraints.test.ts` against a
real Postgres, not mocked — that file is worth reading alongside this one.

- **No suite can be double-booked.** An exclusion constraint on `bookings`
  (`suite_id` equal AND time ranges overlapping, for any "live" status)
  makes this a database guarantee: two requests racing to book the same
  slot can't both succeed, no matter how the application code is written.
- **A phone number identifies at most one client**, but a client can exist
  with no phone at all (a walk-in recorded by name only) — a partial unique
  index, not a plain unique column.
- **The money ledger and the activity log are append-only.** A trigger
  rejects any `UPDATE` or `DELETE` against `ledger_entries` and
  `activity_log` (and `pack_usages`, `voucher_redemptions`) with a database
  error, for any role — this is what makes "nobody can edit recorded
  income," a business requirement from CLAUDE.md §3, actually true rather
  than just a permission the application layer promises to check. **This
  only holds if the application connects as an ordinary role, not a
  superuser** — a superuser can disable a trigger. Production must use a
  role without `SUPERUSER` or `BYPASSRLS`; most managed Postgres providers
  (Neon, Supabase, RDS) already give you one by default.
- **A ledger entry's sign matches its type**, and a refund, discount, or
  correction must state a reason — both are check constraints, so a bug
  can't silently record a refund as income or a discount with no audit
  trail.

## Price history, not price editing

`session_types` holds the stable identity of a sellable session; its price
lives in `session_type_prices`, a new row per change with the previous
row's `effective_to` closed out in the same transaction (a partial unique
index enforces "at most one current price"). A booking copies the price it
was made at into `bookings.price_at_booking_rwf`. Changing a price in the
admin therefore only affects sales made *after* the change — it can never
rewrite what a past booking cost, which matters for both the ledger and for
trust.

## Production role

Before going live, create a dedicated database role for the application
that is **not** a superuser and does **not** have `BYPASSRLS`, and use its
connection string in production's `DATABASE_URL`. This is what makes the
append-only guarantee in the previous section actually unbypassable rather
than merely a convention. Most managed Postgres providers set this up by
default for the primary connection string they hand you; if in doubt, ask.
