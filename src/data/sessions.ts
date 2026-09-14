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
  tagline: string
  duration: string
  durationMinutes: number
  price: string
  priceNumber: number
  offPeakPrice: string
  offPeakNumber: number
  capacity: string
  desc: string
  suits: string
  includes: string[]
}

export const SESSIONS: SessionItem[] = [
  {
    id: 'quick',
    name: 'The Quick Reset',
    tagline: 'Neck and shoulders, inside a lunch break.',
    duration: '15 minutes',
    durationMinutes: 15,
    price: formatRWF(8000),
    priceNumber: 8000,
    offPeakPrice: formatRWF(6500),
    offPeakNumber: 6500,
    capacity: '1 person · Private suite',
    desc: 'Fifteen minutes aimed squarely at the top of your spine — the neck, shoulders and upper back where screen work and traffic collect. The rollers work in short kneading passes rather than a full sweep, so the time goes where it is needed.',
    suits: 'Between meetings, after a long drive, or when you have exactly twenty minutes and a headache building.',
    includes: [
      '15 minutes automated massage, upper body focus',
      'Private suite, locked from the inside',
      'Locker for your phone, if you want one',
      'Lounge access afterwards, no time limit',
    ],
  },
  {
    id: 'half',
    name: 'The Half Hour',
    tagline: 'Head to heels. The session most people settle on.',
    duration: '30 minutes',
    durationMinutes: 30,
    price: formatRWF(15000),
    priceNumber: 15000,
    offPeakPrice: formatRWF(12000),
    offPeakNumber: 12000,
    capacity: '1 person · Private suite',
    desc: 'Full-body coverage from your neck to the soles of your feet. The chair reclines into zero gravity, warms the lumbar panel, works down the spine, and finishes with air compression through the calves and feet. If you are visiting for the first time, book this one.',
    suits: 'Weekly maintenance. Long enough to properly unwind, short enough to do on a weekday evening.',
    includes: [
      '30 minutes automated full-body programme',
      'Zero-gravity recline and lumbar heat',
      'Calf and foot air compression',
      'Private suite and locker',
      'Lounge access afterwards, no time limit',
    ],
  },
  {
    id: 'full',
    name: 'The Full Session',
    tagline: 'For when you have decided to properly stop.',
    duration: '60 minutes',
    durationMinutes: 60,
    price: formatRWF(25000),
    priceNumber: 25000,
    offPeakPrice: formatRWF(20000),
    offPeakNumber: 20000,
    capacity: '1 person · Private suite',
    desc: 'The complete programme. Deeper and slower than the half hour — the chair spends real time on each region, moves through hips and shoulders, and closes with a long stretch sequence and a gentle rocking motion. An hour in which nothing at all is asked of you.',
    suits: 'Heavy weeks, bad sleep, or the deliberate decision to take an hour back.',
    includes: [
      '60 minutes deep programme with stretch sequence',
      'Intensity adjustable through all five levels',
      'Heat through both lumbar and calf panels',
      'Shoulder pressure and foot reflexology rollers',
      'Private suite, locker, and unhurried lounge time',
    ],
  },
]

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
  saving: 'Around 20% less',
  note: 'The rooms are emptiest in the middle of the day, so they cost less. Same chairs, same programmes, same lounge.',
}
