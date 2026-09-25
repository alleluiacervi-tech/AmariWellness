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
