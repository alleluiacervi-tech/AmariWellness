import "server-only"
import { db } from "../db/client"
import { activityLog } from "../db/schema"

/**
 * Records one entry in the append-only activity log (migration 0001
 * makes it genuinely append-only at the database level — see
 * docs/database.md). Call this from inside the same action that makes
 * the change, after the change succeeds, so `after` reflects reality.
 *
 * `before`/`after` are plain objects, not full rows — pass only the
 * fields that changed, the same "constrain what's sent" discipline the
 * Next.js data-security guide asks for on action return values.
 */
export async function recordActivity(entry: {
  staffUserId: string | null
  action: string
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
  reason?: string
}) {
  await db.insert(activityLog).values({
    staffUserId: entry.staffUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before === undefined ? null : JSON.stringify(entry.before),
    after: entry.after === undefined ? null : JSON.stringify(entry.after),
    reason: entry.reason ?? null,
  })
}
