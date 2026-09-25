import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * One pooled connection per server process. `DATABASE_URL` is required —
 * see `.env.example`. Never imported from a Client Component: `server-only`
 * makes that a build error rather than a leaked connection string.
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres database.",
  )
}

const globalForDb = globalThis as unknown as { queryClient?: postgres.Sql }

// Reused across hot reloads in dev so `next dev` doesn't open a new pool on every save.
const queryClient =
  globalForDb.queryClient ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
  })

if (process.env.NODE_ENV !== "production") globalForDb.queryClient = queryClient

export const db = drizzle(queryClient, { schema })
export type Database = typeof db
