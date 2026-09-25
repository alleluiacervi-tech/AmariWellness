import { formatRWF } from '@/data/sessions'

/* Prepaid packs replace monthly membership deliberately: recurring mobile-money
   billing is unreliable, and a one-time purchase achieves the same commitment
   without a standing charge or a card on file. Pricing is a placeholder. */

export interface SessionPack {
  id: string
  name: string
  price: string
  priceNumber: number
  perSession: string
  perSessionNumber: number
  /** Length of each session in the pack. */
  sessionMinutes: number
  sessions: string
  validity: string
  saving: string
  description: string
  includes: string[]
  cta: string
  featured: boolean
}

export const PACKS: SessionPack[] = [
  {
    id: 'five-half',
    name: 'Five Half Hours',
    price: formatRWF(67000),
    priceNumber: 67000,
    perSession: `${formatRWF(13400)} a session`,
    perSessionNumber: 13400,
    sessionMinutes: 30,
    sessions: '5 × 30-minute sessions',
    validity: 'Valid for 2 months',
    saving: `Saves ${formatRWF(8000)}`,
    description:
      'A reasonable place to start. Five sessions is enough to find out whether this becomes part of your week or stays an occasional thing.',
    includes: [
      '5 sessions of 30 minutes, used whenever you like',
      'Balance tracked against your phone number',
      'Shareable — bring whoever you want',
      'Lounge access on every visit',
    ],
    cta: 'Buy five sessions',
    featured: false,
  },
  {
    id: 'ten-half',
    name: 'Ten Half Hours',
    price: formatRWF(127000),
    priceNumber: 127000,
    perSession: `${formatRWF(12700)} a session`,
    perSessionNumber: 12700,
    sessionMinutes: 30,
    sessions: '10 × 30-minute sessions',
    validity: 'Valid for 3 months',
    saving: `Saves ${formatRWF(23000)}`,
    description:
      'Roughly once a week for three months. This is the pack for people who have already decided that stopping regularly is worth paying for in advance.',
    includes: [
      '10 sessions of 30 minutes, used whenever you like',
      'Balance tracked against your phone number',
      'Shareable — bring whoever you want',
      'Priority booking on evening slots',
      'Lounge access on every visit',
    ],
    cta: 'Buy ten sessions',
    featured: true,
  },
  {
    id: 'ten-full',
    name: 'Ten Full Hours',
    price: formatRWF(212000),
    priceNumber: 212000,
    perSession: `${formatRWF(21200)} a session`,
    perSessionNumber: 21200,
    sessionMinutes: 60,
    sessions: '10 × 60-minute sessions',
    validity: 'Valid for 3 months',
    saving: `Saves ${formatRWF(38000)}`,
    description:
      'The full hour, ten times over. For people who have discovered that thirty minutes ends exactly when they were beginning to switch off.',
    includes: [
      '10 sessions of 60 minutes, used whenever you like',
      'Balance tracked against your phone number',
      'Shareable — bring whoever you want',
      'Priority booking on evening slots',
      'Named locker held for your visits',
    ],
    cta: 'Buy ten hours',
    featured: false,
  },
]

export const GIFT_VOUCHER = {
  name: 'Gift voucher',
  description:
    'Bought by value rather than session count, delivered as a code, and spendable on any programme. Valid for twelve months. A reasonable gift for someone who will not book this for themselves.',
  /** Suggested values, in RWF. Any amount is possible — ask the desk. */
  values: [15000, 25000, 50000, 100000],
  cta: 'Buy a voucher',
}

export const CORPORATE = {
  name: 'For companies',
  description:
    'Blocks of sessions for teams, invoiced to the company rather than paid by card. Useful if you are looking for a staff benefit that people will actually use. Tell us roughly how many people and how often, and we will send a quote.',
  points: [
    'Invoiced by bank transfer, with a proper receipt',
    'Sessions drawn down by your team against one balance',
    'Monthly usage summary so you can see it is being used',
    'Reserved evening blocks available for larger teams',
  ],
  cta: 'Request a quote',
}
