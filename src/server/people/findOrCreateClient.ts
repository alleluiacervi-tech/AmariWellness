import "server-only"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { clients } from "../db/schema"

/**
 * "The account is created automatically from the verified phone number"
 * (CLAUDE.md §3) — used by a staff walk-in (Phase 1.4a, phone optional)
 * and, once built, the client OTP flow (Phase 1.4b, phone required and
 * already verified by the time this is called). A phone number
 * identifies at most one client (the partial unique index in migration
 * 0001); a walk-in with no phone always gets a new name-only row rather
 * than trying to match on name, which isn't reliably unique.
 */
export async function findOrCreateClient(input: {
  name: string
  phone?: string | null
  healthAcknowledged?: boolean
}) {
  const phone = input.phone?.trim() || null
  if (phone) {
    const [existing] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1)
    if (existing) {
      if (input.healthAcknowledged && !existing.healthAcknowledgedAt) {
        const [updated] = await db
          .update(clients)
          .set({ healthAcknowledgedAt: new Date(), updatedAt: new Date() })
          .where(eq(clients.id, existing.id))
          .returning()
        return updated
      }
      return existing
    }
  }

  const [created] = await db
    .insert(clients)
    .values({
      name: input.name,
      phone,
      healthAcknowledgedAt: input.healthAcknowledged ? new Date() : null,
    })
    .returning()
  return created
}
