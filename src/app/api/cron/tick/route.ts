import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/server/db/client"
import { expireStaleHolds } from "@/server/availability/expireStaleHolds"

/**
 * The one background-job entry point Phase 1.4 wires up: expiring stale
 * payment holds (see `src/server/availability/expireStaleHolds.ts`).
 * Phase 1.5/1.6 extend this same handler with reminders, no-show
 * marking, and pack/voucher expiry (see CLAUDE.md's Phase 1 checklist) —
 * one scheduled entry point rather than one route per job. Reading
 * `request.headers` here is itself what makes this route request-time
 * rather than prerendered (see the Route Handlers guide's "Good to
 * know" on what stops prerendering).
 *
 * Call with `Authorization: Bearer $CRON_SECRET` — a Vercel Cron job
 * config (once one is added) or a manual call while testing. `.env.example`
 * documents `CRON_SECRET` under "Background jobs".
 */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // never treat "unconfigured" as "anyone may call this"
  return request.headers.get("authorization") === `Bearer ${secret}`
}

async function tick(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expiredHolds = await expireStaleHolds(db)
  return NextResponse.json({ ok: true, expiredHolds })
}

export async function GET(request: NextRequest) {
  return tick(request)
}

export async function POST(request: NextRequest) {
  return tick(request)
}
