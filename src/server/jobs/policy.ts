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
