/**
 * A standalone Postgres connection for tests, deliberately not the
 * app's `./client` (which is guarded with `server-only` and only
 * resolves inside Next's bundler — see the comment in seed.ts). Tests
 * run against `DATABASE_URL`, which the `test` script in package.json
 * points at `amari_test`, never the dev database.
 */
import { expect } from "vitest"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { clients, locations, sessionTypePrices, sessionTypes, suites } from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set for tests. Run via `pnpm test`, which points it at amari_test.",
  )
}
if (!connectionString.includes("test")) {
  // A cheap but effective safety rail: tests truncate tables. Refuse to
  // run against anything whose name doesn't say "test", so a copy-pasted
  // DATABASE_URL can't accidentally wipe dev or production data.
  throw new Error(
    `Refusing to run tests against a database that doesn't look like a test database: ${connectionString}`,
  )
}

const client = postgres(connectionString, { max: 1 })
export const testDb = drizzle(client, { schema })

const TABLES_IN_DELETE_ORDER = [
  "voucher_redemptions",
  "pack_usages",
  "ebm_receipts",
  "ledger_entries",
  "payments",
  "vouchers",
  "pack_purchases",
  "company_invoices",
  "company_members",
  "notifications",
  "bookings",
  "messages",
  "promo_codes",
  "session_type_prices",
  "session_types",
  "pack_products",
  "company_accounts",
  "clients",
  "client_otp_codes",
  "client_auth_sessions",
  "staff_auth_sessions",
  "staff_users",
  "activity_log",
  "chair_service_log",
  "maintenance_blocks",
  "suites",
  "content_blocks",
  "faqs",
  "social_links",
  "holidays",
  "locations",
]

/** Wipes every table between tests. Ledger/activity-log rows are append-only to the app, but TRUNCATE bypasses row-level triggers, which is exactly what a test harness needs and production code never does. */
export async function resetTestDatabase() {
  await client.unsafe(`TRUNCATE TABLE ${TABLES_IN_DELETE_ORDER.map((t) => `"${t}"`).join(", ")} CASCADE`)
}

export async function closeTestDatabase() {
  await client.end()
}

/**
 * Drizzle's postgres-js driver wraps a failed query in its own Error
 * ("Failed query: insert into ...") and puts the actual Postgres error
 * — the one naming the violated constraint — on `.cause`. Assert
 * against this instead of `.rejects.toThrow(pattern)`, which only sees
 * the wrapper's generic message.
 */
export async function expectPgError(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toSatisfy((err: unknown) => {
    const message = err instanceof Error ? ((err.cause as Error | undefined)?.message ?? err.message) : String(err)
    return pattern.test(message)
  })
}

/**
 * A minimal location + suite(s) + session type + current price + client
 * — the same shape `constraints.test.ts` builds by hand, factored out
 * for the availability/ledger test suites (Phase 1.4a) that all need
 * the same starting point. Call after `resetTestDatabase()`.
 */
export async function seedMinimalCatalog(options?: { suiteCount?: number }) {
  const [location] = await testDb
    .insert(locations)
    .values({
      name: "Test Location",
      slug: "test",
      street: "Test St",
      neighborhood: "Test",
      city: "Kigali",
      holdMinutes: 10,
      turnoverMinutes: 15,
      quietHoursEndHour: 16,
    })
    .returning()

  const suiteRows: (typeof suites.$inferSelect)[] = []
  for (let i = 0; i < (options?.suiteCount ?? 1); i++) {
    const [suite] = await testDb
      .insert(suites)
      .values({ locationId: location.id, name: `Suite ${i + 1}`, sortOrder: i })
      .returning()
    suiteRows.push(suite)
  }

  const [sessionType] = await testDb
    .insert(sessionTypes)
    .values({
      locationId: location.id,
      slug: "half",
      name: "The Half Hour",
      durationMinutes: 30,
      label: "x",
      intro: "x",
      summary: "x",
      about: "x",
    })
    .returning()
  const [price] = await testDb
    .insert(sessionTypePrices)
    .values({ sessionTypeId: sessionType.id, priceRwf: 15000, offPeakPriceRwf: 12000 })
    .returning()
  const [client] = await testDb.insert(clients).values({ name: "Alex Guest", phone: "+250780000001" }).returning()

  return { location, suites: suiteRows, suite: suiteRows[0], sessionType, price, client }
}
