// No `server-only` guard, deliberately — see conflicts.ts's comment.
import { isWeekend } from "./slots"

/** The price actually charged for a session starting at `hour` on `dateISO` — quiet-hours pricing applies on weekdays before the location's `quietHoursEndHour`. Copied onto the booking at creation time (`priceAtBookingRwf`) so a later price change never rewrites a past booking — see `session_type_prices`' schema comment. */
export function priceForSlot(
  price: { priceRwf: number; offPeakPriceRwf: number },
  location: { quietHoursEndHour: number },
  dateISO: string,
  hour: number,
): { priceRwf: number; offPeak: boolean } {
  const offPeak = !isWeekend(dateISO) && hour < location.quietHoursEndHour
  return { priceRwf: offPeak ? price.offPeakPriceRwf : price.priceRwf, offPeak }
}
