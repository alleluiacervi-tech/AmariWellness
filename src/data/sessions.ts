/* ───────────────────────────────────────────────────────────────
   Session names, durations and prices now live in the database —
   see src/server/db/content.ts (getSessionTypes) and Phase 1.3 in
   CLAUDE.md. What's left here are presentation constants with no
   row to live in yet: the shared "every session includes" list, the
   two-suite combo preview (explicitly unconfirmed — see below), the
   quiet-hours business rule, and this formatter.
   ─────────────────────────────────────────────────────────────── */

export function formatRWF(amount: number): string {
  return `${amount.toLocaleString('en-RW')} RWF`
}

/** True of every session, so it is said once rather than on every card. */
export const INCLUDED = ['Private suite', 'Adjustable intensity', 'Locker for your phone', 'Lounge afterwards']

/** The session we point first-time visitors to. */
export const FEATURED_SESSION_ID = 'half'

/** Only offered if two adjacent suites genuinely exist — confirm before publishing. */
export const PARTNER_SESSIONS = [
  {
    id: 'partner-30',
    name: 'Two Suites · Half Hour',
    duration: '30 minutes',
    durationMinutes: 30,
    price: formatRWF(28000),
    priceNumber: 28000,
    capacity: '2 people · Adjacent suites',
    desc: 'Two private suites side by side, booked for the same slot. Each of you sets your own programme and intensity behind your own door, then meets in the lounge afterwards.',
  },
  {
    id: 'partner-60',
    name: 'Two Suites · Full Hour',
    duration: '60 minutes',
    durationMinutes: 60,
    price: formatRWF(46000),
    priceNumber: 46000,
    capacity: '2 people · Adjacent suites',
    desc: 'An hour each, at the same time, in separate rooms. Followed by as long as you want in the reading lounge.',
  },
]

export const OFF_PEAK = {
  label: 'Quiet hours',
  window: 'Monday to Friday, 10:00 – 16:00',
  /** Quiet-hours rates apply to sessions starting before this hour, on weekdays. */
  endsAt: 16,
  note: 'The rooms are emptiest in the middle of the day, so they cost less. Same chairs, same programmes, same lounge.',
}
