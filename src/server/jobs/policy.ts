/**
 * Timing rules the background jobs enforce. These are the values from
 * the draft cancellation and no-show policy (docs/phase-0-decisions.md
 * §2), which the owner hasn't signed off yet — if the approved policy
 * differs, this is the one place to change. The free-cancellation
 * window itself is per-location and staff-editable
 * (`locations.cancellationWindowHours`), not here.
 */

/** "Not arrived within 15 minutes of the start time" — after this, a confirmed booking nobody checked in for becomes a no-show. */
export const NO_SHOW_GRACE_MINUTES = 15

/** The two reminders CLAUDE.md §4 rule 3 asks for. */
export const REMINDER_24H_MINUTES = 24 * 60
export const REMINDER_2H_MINUTES = 2 * 60

/** How early the desk can check a guest in. Earlier than this, the suite would show as occupied for someone who's only waiting in the lounge. */
export const CHECK_IN_OPENS_MINUTES_BEFORE = 30

/**
 * When a booking can be checked in: from `CHECK_IN_OPENS_MINUTES_BEFORE`
 * before its start until the no-show grace runs out. The same window
 * decides whether the desk accepts a code and how long the client's
 * account keeps showing it, so neither depends on when the no-show job
 * last ran.
 */
export function checkInWindow(startAt: Date): { opensAt: Date; closesAt: Date } {
  return {
    opensAt: new Date(startAt.getTime() - CHECK_IN_OPENS_MINUTES_BEFORE * 60_000),
    closesAt: new Date(startAt.getTime() + NO_SHOW_GRACE_MINUTES * 60_000),
  }
}
