/* ───────────────────────────────────────────────────────────────
   PLACEHOLDERS — REPLACE BEFORE LAUNCH
   Every value marked TODO is an assumption, not a fact. The brand
   name, address, Plus Code, phone numbers and hours all need to be
   confirmed before this site goes public.
   ─────────────────────────────────────────────────────────────── */

export const SITE_CONFIG = {
  name: 'Amari', // TODO: confirm Rwandan brand name
  url: 'https://amari.rw', // TODO: confirm domain — used for canonical, sitemap and share cards
  tagline: 'A chair. A quiet room. Time to think.',
  description:
    'Private automated massage suites in Kigali. You are not touched by anyone. Book a chair, close the door, and let the machine work.',

  address: {
    street: 'KG 7 Ave', // TODO: confirm street + building
    neighborhood: 'Kimihurura',
    city: 'Kigali',
    country: 'Rwanda',
    plusCode: '6HRQ+XX Kigali', // TODO: confirm — this is how people actually navigate here
    landmark: 'Two minutes from the Kimihurura roundabout', // TODO: confirm nearest landmark
    parking: 'Free on-site parking for eight cars',
    full: 'KG 7 Ave, Kimihurura, Kigali, Rwanda',
    /** Opens the address in Google Maps. Swap the query for the Plus Code once confirmed. */
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=KG%207%20Ave%2C%20Kimihurura%2C%20Kigali%2C%20Rwanda',
  },

  contact: {
    phone: '+250 788 000 000', // TODO: confirm
    whatsapp: '250788000000', // digits only, for wa.me links
    email: 'hello@amari.rw', // TODO: confirm domain
    responseTime: 'We reply to WhatsApp within the hour, and to email within one working day.',
  },

  hours: {
    weekdays: 'Monday – Friday · 10:00 – 21:00',
    weekends: 'Saturday – Sunday · 09:00 – 20:00',
    note: 'Last session starts one hour before closing.',
    walkins: 'Walk-ins are welcome when a suite is free. Booking guarantees one.',
    /** The same hours as numbers, in Kigali time, for the live open/closed status. */
    schedule: {
      weekday: { open: 10, close: 21 },
      weekend: { open: 9, close: 20 },
    },
  },

  /** Shown at checkout and in the footer. Design-only for now — no gateway is wired up. */
  payments: {
    methods: ['MTN Mobile Money', 'Airtel Money', 'Visa & Mastercard'],
    note: 'Suites are paid for when you book. Cancel free of charge up to four hours before your session and we refund in full.',
  },
}

/** The turnover protocol. Specific numbers beat reassuring adjectives. */
export const HYGIENE_PROTOCOL = [
  {
    label: 'Between every guest',
    detail: 'The chair cover and headrest cloth are removed and replaced with a freshly laundered set. Nobody sits on the cover you sat on.',
  },
  {
    label: 'Fifteen minutes',
    detail: 'Every booking reserves the suite for fifteen minutes longer than your session. That gap is turnover time — it is built into the schedule, not squeezed in while you wait.',
  },
  {
    label: 'Every surface',
    detail: 'Control panel, armrests, leg wells and door handle are wiped down with medical-grade disinfectant after each session.',
  },
  {
    label: 'Every room',
    detail: 'The suite is aired and the air filter runs between guests. You enter a room that has been reset, not just vacated.',
  },
]

/** What actually happens on a first visit, read off the clock. Times are
    relative to the moment your session starts. Plain language, no poetry. */
export const VISIT_STEPS = [
  {
    time: '−05:00',
    title: 'You arrive',
    body: 'Reception checks you in and shows you the suite. Lock your phone away or keep it — we hand you a key either way and never ask which.',
  },
  {
    time: '00:00',
    title: 'You close the door',
    body: 'The suite is yours alone and locks from the inside. Nobody comes in during your session, and there is no attendant in the room.',
  },
  {
    time: '00:01',
    title: 'The chair does the work',
    body: 'One panel, one start button. It measures your shoulders, reclines, and begins. Turn the intensity up or down, or stop it, at any moment.',
  },
  {
    time: '00:30',
    title: 'You sit in the lounge',
    body: 'When the programme ends, the reading room is yours for as long as you want it. Tea is poured. There is no clock on the wall.',
  },
]

/** The shelf. TODO: replace with the actual titles once the shelf is stocked. */
export const SHELF = {
  note: 'A small shelf, changed each month. Take anything down. Nothing is for sale.',
  titles: [
    { title: 'Silence in the Age of Noise', author: 'Erling Kagge' },
    { title: 'The Idea of the Brain', author: 'Matthew Cobb' },
    { title: 'A Field Guide to Getting Lost', author: 'Rebecca Solnit' },
    { title: 'Wintering', author: 'Katherine May' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
    { title: 'The Poetics of Space', author: 'Gaston Bachelard' },
  ],
}

/** Questions people actually ask before a first session. */
export const CHAIR_FAQS = [
  {
    q: 'Does it hurt?',
    a: 'It should not. The chair runs at level three of five by default, which most people describe as firm but comfortable. If a roller catches somewhere tender, turn the intensity down on the panel or press stop — the chair returns to upright within seconds. Some muscle awareness the next day is normal, the same as after a stretch.',
  },
  {
    q: 'Is anyone in the room with me?',
    a: 'No. The suite is private and locks from the inside. No therapist, no attendant, nobody knocking. The chair is fully automated from start to finish — that is the whole idea. If you need help, there is a call button that rings reception.',
  },
  {
    q: 'What should I wear?',
    a: 'Whatever you arrived in, as long as it is comfortable. The chair works through clothing and nothing needs to be removed. We ask you to take your shoes off, and we provide slippers. Avoid belts, thick buckles and anything in your back pockets.',
  },
  {
    q: 'Who used the chair before me?',
    a: 'Another guest, and then fifteen minutes of turnover. The cover and headrest cloth are replaced with a fresh laundered set, every surface is disinfected, and the room is aired before you are let in. That gap is reserved in the booking system — it is not optional and it is not rushed.',
  },
  {
    q: 'Is there a height or weight limit?',
    a: 'The chairs are built for guests between roughly 150cm and 195cm, up to 120kg. Outside that range the rollers may not line up with your spine properly, which makes the session less useful rather than unsafe. Message us if you are unsure and we will tell you honestly.',
  },
  {
    q: 'Can I use it if I am pregnant, or have a back condition?',
    a: 'If you are pregnant, recovering from surgery, have osteoporosis, a slipped disc, a pacemaker, or any spinal injury, please speak to your doctor first and then talk to us before booking. We would rather turn away a booking than give you a session you should not have.',
  },
  {
    q: 'How long should I actually book?',
    a: 'Fifteen minutes genuinely resets your neck and shoulders and fits inside a lunch break. Thirty is the session most people settle on. Sixty is for when you have decided to properly stop. If it is your first visit, start at thirty.',
  },
]

export const SPACE_FAQS = [
  {
    q: 'Do I have to leave my phone in the locker?',
    a: 'No. It is entirely your choice and we never ask which you chose. Some people lock it away because that is the only way they will leave it alone for an hour. Others keep it with them. Both are normal here. The only rule is that the lounge stays silent — no calls, no speaker audio.',
  },
  {
    q: 'What do people do in the lounge?',
    a: 'Read, mostly. Some write. Some sit with their eyes shut and let the session settle. There is no programme and nobody will ask you what you are doing. You can stay as long as we are open.',
  },
  {
    q: 'Can I work there?',
    a: 'Quiet laptop work is fine. Calls and video meetings are not — that is the one thing we protect. If you need to take a call, reception will point you somewhere you can.',
  },
  {
    q: 'Can I come just for the lounge?',
    a: 'Yes, if there is room. Lounge access is included with every session, and we keep a few seats for people who only want the quiet. Ask at reception.',
  },
  {
    q: 'Is there parking?',
    a: 'Yes, free on site. There is space for eight cars, and the entrance is directly off the road — you will not need to walk far in the sun.',
  },
]

export const PACK_FAQS = [
  {
    q: 'How do session packs work?',
    a: 'You buy a set number of sessions up front at a lower price per session, and use them whenever you like before they expire. Your balance sits in your booking record — when you book, the session is simply deducted. No monthly charge, no card on file, no subscription to cancel.',
  },
  {
    q: 'Why not a monthly membership?',
    a: 'Because reliable automatic monthly billing over mobile money is genuinely awkward here, and we would rather not hold your card details. A pack gives you the same saving without a standing charge you have to remember to stop.',
  },
  {
    q: 'What happens when my pack expires?',
    a: 'Unused sessions expire on the date shown when you buy. We will message you two weeks before, and if something unavoidable came up, talk to us — we will usually extend once.',
  },
  {
    q: 'Can I share a pack?',
    a: 'Yes. Bring whoever you like and use your sessions on them. The balance belongs to you, not to a named individual.',
  },
  {
    q: 'Can I buy a pack as a gift?',
    a: 'Yes. Gift vouchers are bought by value rather than session count, arrive as a code, and can be spent on any programme. They are valid for twelve months.',
  },
]
