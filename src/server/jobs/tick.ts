// No `server-only` guard, deliberately — see reminders.ts. The route
// (`src/app/api/cron/tick/route.ts`) passes the real `db` and adapters.
import type { Database } from "../db/client"
import type { NotifyDeps } from "../notify/bookingMessages"
import { expireStaleHolds } from "../availability/expireStaleHolds"
import { sendDueReminders } from "./reminders"
import { completeFinishedSessions, markNoShows } from "./sessionLifecycle"

export type TickResult = {
  expiredHolds?: number
  noShows?: number
  completed?: number
  reminders24h?: number
  reminders2h?: number
  errors: string[]
}

/**
 * Every scheduled job, in one run. Each job is independent: one failing
 * is recorded in `errors` and the rest still run, so a broken reminder
 * provider never stops holds from expiring or no-shows from being
 * marked. Run it every few minutes — every job here is safe to repeat.
 *
 * `deps` may be a function, called inside the reminders job: setting up
 * the message providers (an unknown `EMAIL_PROVIDER`, say) can itself
 * fail, and that too must only stop the reminders.
 */
export async function runTick(db: Database, deps: NotifyDeps | (() => NotifyDeps), now: Date = new Date()): Promise<TickResult> {
  const result: TickResult = { errors: [] }
  const run = async (name: string, job: () => Promise<void>) => {
    try {
      await job()
    } catch (err) {
      result.errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await run("expireStaleHolds", async () => {
    result.expiredHolds = await expireStaleHolds(db)
  })
  await run("markNoShows", async () => {
    result.noShows = await markNoShows(db, now)
  })
  await run("completeFinishedSessions", async () => {
    result.completed = await completeFinishedSessions(db, now)
  })
  await run("sendDueReminders", async () => {
    const reminders = await sendDueReminders(db, typeof deps === "function" ? deps() : deps, now)
    result.reminders24h = reminders.reminders24h
    result.reminders2h = reminders.reminders2h
    result.errors.push(...reminders.failures)
  })
  return result
}
