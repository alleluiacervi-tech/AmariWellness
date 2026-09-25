/**
 * Applies every migration in ./migrations that hasn't run yet. Safe to
 * run repeatedly — drizzle tracks applied migrations in
 * `drizzle.__drizzle_migrations` and skips what's already there.
 *
 *   pnpm db:migrate
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is not set")

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log(`Applying migrations to ${connectionString.replace(/:[^:@]+@/, ":***@")} ...`)
  await migrate(db, { migrationsFolder: "./src/server/db/migrations" })
  console.log("Done.")

  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
