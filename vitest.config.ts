import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // These tests hit a real Postgres (DATABASE_URL, defaulting to
    // amari_test — see package.json's "test" script); they run one at a
    // time to avoid two suites racing over the same rows.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
})
