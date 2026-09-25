import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://amari:amari@localhost:5432/amari_dev",
  },
})
