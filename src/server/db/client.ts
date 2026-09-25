import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * One pooled connection per server process, opened lazily on first real
 * query rather than at module-import time. Never imported from a Client
 * Component: `server-only` makes that a build error rather than a leaked
 * connection string.
 *
 * Why lazy: Next's build "collects page data" for every route just to
 * read its exported config (`dynamic`, `generateMetadata`, ...) — that
 * walks the whole module graph, including this file, with no request in
 * flight and often no `DATABASE_URL` available (a Vercel build doesn't
 * need a live database). Throwing "DATABASE_URL is not set" at import
 * time turned that routine build step into a hard build failure the
 * moment any page imported this module (see `/staff` in P1.2). A Proxy
 * defers both the env check and the connection to the first property
 * access, which only happens once a request actually queries the
 * database — the same place a missing `DATABASE_URL` should surface.
 */
const globalForDb = globalThis as unknown as { queryClient?: postgres.Sql }

function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres database.",
    )
  }

  // Reused across hot reloads in dev so `next dev` doesn't open a new pool on every save.
  const queryClient =
    globalForDb.queryClient ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 10 : 5,
    })

  if (process.env.NODE_ENV !== "production") globalForDb.queryClient = queryClient

  return drizzle(queryClient, { schema })
}

type Database = ReturnType<typeof connect>

let cached: Database | undefined

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    if (!cached) cached = connect()
    const value = Reflect.get(cached, prop, cached)
    // Method properties must stay bound to the real client, not this
    // proxy — `db.select()` would otherwise call `select` with `this`
    // set to the proxy instead of the drizzle instance it expects.
    return typeof value === "function" ? value.bind(cached) : value
  },
})
export type { Database }
