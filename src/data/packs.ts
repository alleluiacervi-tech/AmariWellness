/* Prepaid packs replace monthly membership deliberately: recurring mobile-money
   billing is unreliable, and a one-time purchase achieves the same commitment
   without a standing charge or a card on file.

   Pack names, prices and copy now live in the database — see
   src/server/db/content.ts (getPackProducts) and Phase 1.3 in CLAUDE.md.
   PACK_BASICS is a shared presentation constant with no row of its own
   (see also GIFT_VOUCHER/CORPORATE below, which aren't purchasable yet —
   Phase 2). */

/** True of every pack, so it is said once. */
export const PACK_BASICS = [
  'Use them whenever you like before they expire',
  'Balance kept against your phone number',
  'Shareable with anyone you bring',
  'Lounge access on every visit',
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
