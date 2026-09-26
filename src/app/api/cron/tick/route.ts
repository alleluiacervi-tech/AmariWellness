import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/server/db/client"
import { defaultNotifyDeps } from "@/server/notify/bookingMessages"
import { runTick } from "@/server/jobs/tick"

/**
 * The one background-job entry point (see `src/server/jobs/tick.ts` for
 * what runs): expiring stale payment holds, marking no-shows, completing
 * finished sessions, and sending the 24-hour and 2-hour reminders.
 * Phase 1.6 and Phase 2 (pack/voucher expiry) extend `runTick` rather
 * than adding a route per job. Reading `request.headers` here is itself
 * what makes this route request-time rather than prerendered (see the
 * Route Handlers guide's "Good to know" on what stops prerendering).
 *
 * Call every few minutes with `Authorization: Bearer $CRON_SECRET` — a
 * scheduler (Vercel Cron, once one is configured) or a manual call while
 * testing. `.env.example` documents `CRON_SECRET` under "Background jobs".
 * Responds 500 if any job failed, so a scheduler's own alerting notices.
 */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // never treat "unconfigured" as "anyone may call this"
  return request.headers.get("authorization") === `Bearer ${secret}`
}

async function tick(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Passed uncalled, so a misconfigured message provider fails only the reminders job, not every job (see runTick).
  const result = await runTick(db, defaultNotifyDeps)
  if (result.errors.length) console.error("[cron/tick] job errors:", result.errors)
  return NextResponse.json({ ok: result.errors.length === 0, ...result }, { status: result.errors.length ? 500 : 200 })
}

export async function GET(request: NextRequest) {
  return tick(request)
}

export async function POST(request: NextRequest) {
  return tick(request)
}
