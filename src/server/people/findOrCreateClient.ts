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
  email?: string | null
  healthAcknowledged?: boolean
  /**
   * The client just proved they own this phone (a verified one-time code
   * in the booking flow), so the name and email they typed are theirs to
   * change — e.g. an account first created as "Guest" from the sign-in
   * page gets its real name here. Never set for a staff walk-in, where
   * the desk typed the details and hasn't verified anything.
   */
  phoneVerified?: boolean
}) {
  const phone = input.phone?.trim() || null
  const email = input.email?.trim() || null
  if (phone) {
    const [existing] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1)
    if (existing) {
      const changes: Partial<typeof clients.$inferInsert> = {}
      if (input.healthAcknowledged && !existing.healthAcknowledgedAt) changes.healthAcknowledgedAt = new Date()
      if (input.phoneVerified && input.name.trim() && input.name.trim() !== existing.name) changes.name = input.name.trim()
      if (input.phoneVerified && email && email !== existing.email) changes.email = email
      if (Object.keys(changes).length === 0) return existing
      const [updated] = await db
        .update(clients)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(clients.id, existing.id))
        .returning()
      return updated
    }
  }

  const [created] = await db
    .insert(clients)
    .values({
      name: input.name,
      phone,
      email,
      healthAcknowledgedAt: input.healthAcknowledged ? new Date() : null,
    })
    .returning()
  return created
}
