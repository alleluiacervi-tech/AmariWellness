/* ───────────────────────────────────────────────────────────────
   PRICING IS A PLACEHOLDER — CONFIRM BEFORE LAUNCH
   Figures below are a reasoned starting point for a premium Kigali
   positioning, not researched market prices. Change the numbers
   here and they update everywhere on the site.
   ─────────────────────────────────────────────────────────────── */

export function formatRWF(amount: number): string {
  return `${amount.toLocaleString('en-RW')} RWF`
}

export interface SessionItem {
  id: string
  name: string
  duration: string
  durationMinutes: number
  price: string
  priceNumber: number
  offPeakPrice: string
  offPeakNumber: number
  /** Small label above the name — who this one is for. */
  label: string
  /** One italic line under the name on the sessions page. */
  intro: string
  /** Two sentences for the home page card. */
  summary: string
  /** The full description on the sessions page. */
  about: string
  /** Three things only this programme does (the shared basics live in INCLUDED). */
  highlights: string[]
}

/** True of every session, so it is said once rather than on every card. */
export const INCLUDED = ['Private suite', 'Adjustable intensity', 'Locker for your phone', 'Lounge afterwards']

export const SESSIONS: SessionItem[] = [
  {
    id: 'quick',
    name: 'The Quick Reset',
    duration: '15 minutes',
    durationMinutes: 15,
    price: formatRWF(8000),
    priceNumber: 8000,
    offPeakPrice: formatRWF(6500),
    offPeakNumber: 6500,
    label: 'A pause in your day',
    intro: 'A small pause. A fresh start.',
    summary: 'Neck and shoulders, inside a lunch break. Short passes exactly where screen work and traffic collect.',
    about: 'Fifteen minutes aimed squarely at the top of your spine — the neck, shoulders and upper back where screen work and traffic collect. The rollers work in short kneading passes rather than a full sweep, so the time goes where it is needed.',
    highlights: [
      'Neck, shoulder and upper-back focus',
      'Short kneading passes, not a full sweep',
      'Fits inside a lunch break',
    ],
  },
  {
    id: 'half',
    name: 'The Half Hour',
    duration: '30 minutes',
    durationMinutes: 30,
    price: formatRWF(15000),
    priceNumber: 15000,
    offPeakPrice: formatRWF(12000),
    offPeakNumber: 12000,
    label: 'A good place to start',
    intro: 'Room to properly unwind.',
    summary: 'Head to heels. The chair reclines, warms your lower back, and finishes with your calves and feet.',
    about: 'Full-body coverage from your neck to the soles of your feet. The chair reclines into zero gravity, warms the lumbar panel, works down the spine, and finishes with air compression through the calves and feet. If you are visiting for the first time, book this one.',
    highlights: [
      'Full-body programme, neck to soles',
      'Zero-gravity recline and lumbar warmth',
      'Calf and foot air compression',
    ],
  },
  {
    id: 'full',
    name: 'The Full Session',
    duration: '60 minutes',
    durationMinutes: 60,
    price: formatRWF(25000),
    priceNumber: 25000,
    offPeakPrice: formatRWF(20000),
    offPeakNumber: 20000,
    label: 'Take your time',
    intro: 'An unhurried hour, just for you.',
    summary: 'Deeper and slower. Real time on every region, then a long stretch and a gentle rocking finish.',
    about: 'The complete programme. Deeper and slower than the half hour — the chair spends real time on each region, moves through hips and shoulders, and closes with a long stretch sequence and a gentle rocking motion. An hour in which nothing at all is asked of you.',
    highlights: [
      'Every region, at an unhurried pace',
      'Heat through lumbar and calf panels',
      'Long stretch sequence and rocking finish',
    ],
  },
]

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
