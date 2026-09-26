/**
 * Formatting a moment as Kigali wall time (Africa/Kigali, UTC+2, no
 * DST). Shared by server code (messages, reminder jobs, check-in) and
 * client components, so a time reads the same in a WhatsApp message, on
 * the staff board and in the client's account.
 */
const TZ = "Africa/Kigali"

/** "2026-09-26" — the Kigali calendar date of a moment. */
export function kigaliDateISO(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ })
}

/** "14:00" */
export function formatKigaliTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ })
}

/** "Friday 26 September" */
export function formatKigaliDay(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })
}

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-RW")} RWF`
}

/** A calendar date ("2026-09-27") formatted as that date, whatever the device's own time zone. */
export function formatISODate(dateISO: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(new Date(`${dateISO}T12:00:00Z`))
}

/** How many days ahead a client can book, or move a booking to, online. */
export const BOOKING_HORIZON_DAYS = 7

/**
 * The Kigali dates a client can book or move a booking to online: the
 * next `BOOKING_HORIZON_DAYS`, starting tomorrow. The booking page and
 * the move form both offer exactly these, and the server refuses any
 * other date, so the list and the rule can't drift apart.
 */
export function bookableDates(now: Date): string[] {
  const today = kigaliDateISO(now)
  return Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => {
    const d = new Date(`${today}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() + i + 1)
    return d.toISOString().slice(0, 10)
  })
}
