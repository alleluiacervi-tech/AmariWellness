// No `server-only` guard, deliberately — see conflicts.ts's comment.
// `getDaySlots` takes `location` as a parameter rather than calling
// `src/server/db/content.ts`'s `getLocation()` itself, for the same
// reason: that module is `server-only`-guarded, so calling it here
// would make this untestable outside Next. The real caller (the public
// `/book` page, Phase 1.4b) fetches the location once and passes it in.
import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm"
import type { Database } from "../db/client"
import { bookings, holidays, maintenanceBlocks, sessionTypes, suites, type locations } from "../db/schema"

export type Slot = {
  time: string // "HH:00"
  hour: number
  available: boolean
  quietHours: boolean
  /** How many suites are actually free — the booking-creation step still auto-picks one, this is just for a staff view that wants the number. */
  suitesFree: number
}

const pad = (n: number) => String(n).padStart(2, "0")
const clockHour = (time: string) => Number(time.slice(0, 2))

/** Kigali (Africa/Kigali) is UTC+2 year-round — no DST to account for. Same fixed-offset convention the booking preview's .ics export already uses. */
export function kigaliWallTimeToUtc(dateISO: string, hour: number, minute = 0): Date {
  return new Date(`${dateISO}T${pad(hour)}:${pad(minute)}:00+02:00`)
}

export function isWeekend(dateISO: string): boolean {
  return [0, 6].includes(new Date(`${dateISO}T12:00:00Z`).getUTCDay())
}

type LocationRow = typeof locations.$inferSelect

/** Every hourly slot for one day and one session type, with whether at least one suite is free for the whole span (session length + the location's turnover minutes). This is a live read — not cached across requests or calls. */
export async function getDaySlots(db: Database, location: LocationRow, dateISO: string, sessionTypeId: string): Promise<Slot[]> {
  const [sessionType] = await db.select().from(sessionTypes).where(eq(sessionTypes.id, sessionTypeId)).limit(1)
  if (!sessionType) throw new Error("Unknown session type.")

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.locationId, location.id), eq(holidays.date, dateISO)))
    .limit(1)
  if (holiday?.closed) return []

  const weekend = isWeekend(dateISO)
  const openHour = holiday?.customOpen
    ? clockHour(holiday.customOpen)
    : weekend
      ? clockHour(location.weekendOpen)
      : clockHour(location.weekdayOpen)
  const closeHour = holiday?.customClose
    ? clockHour(holiday.customClose)
    : weekend
      ? clockHour(location.weekendClose)
      : clockHour(location.weekdayClose)

  const activeSuites = await db
    .select({ id: suites.id })
    .from(suites)
    .where(and(eq(suites.locationId, location.id), eq(suites.active, true)))
  const suiteIds = activeSuites.map((s) => s.id)
  if (suiteIds.length === 0) return []

  const dayStart = kigaliWallTimeToUtc(dateISO, 0, 0)
  // A generous window past midnight covers any session that could still be running from this day's last slot.
  const dayEnd = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000)

  const now = new Date()
  const [bookingRows, maintenanceRows] = await Promise.all([
    db
      .select({
        suiteId: bookings.suiteId,
        startAt: bookings.startAt,
        endAt: bookings.endAt,
        status: bookings.status,
        holdExpiresAt: bookings.holdExpiresAt,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.suiteId, suiteIds),
          lt(bookings.startAt, dayEnd),
          gt(bookings.endAt, dayStart),
          or(
            inArray(bookings.status, ["confirmed", "checked_in"]),
            and(eq(bookings.status, "held"), or(isNull(bookings.holdExpiresAt), gt(bookings.holdExpiresAt, now))),
          ),
        ),
      ),
    db
      .select({ suiteId: maintenanceBlocks.suiteId, startAt: maintenanceBlocks.startAt, endAt: maintenanceBlocks.endAt })
      .from(maintenanceBlocks)
      .where(and(inArray(maintenanceBlocks.suiteId, suiteIds), lt(maintenanceBlocks.startAt, dayEnd), gt(maintenanceBlocks.endAt, dayStart))),
  ])

  const closeAt = kigaliWallTimeToUtc(dateISO, closeHour, 0)
  const slots: Slot[] = []
  for (let hour = openHour; hour < closeHour; hour++) {
    const start = kigaliWallTimeToUtc(dateISO, hour, 0)
    const end = new Date(start.getTime() + (sessionType.durationMinutes + location.turnoverMinutes) * 60_000)
    if (end > closeAt) continue // doesn't fit before closing, turnover included

    const freeSuites = suiteIds.filter((suiteId) => {
      const busy = bookingRows.some((b) => b.suiteId === suiteId && b.startAt < end && b.endAt > start)
      const blocked = maintenanceRows.some((m) => m.suiteId === suiteId && m.startAt < end && m.endAt > start)
      return !busy && !blocked
    })

    slots.push({
      time: `${pad(hour)}:00`,
      hour,
      available: freeSuites.length > 0,
      quietHours: !weekend && hour < location.quietHoursEndHour,
      suitesFree: freeSuites.length,
    })
  }
  return slots
}
