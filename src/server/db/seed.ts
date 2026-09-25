/**
 * Populates a fresh database with the content that currently lives in
 * `src/data/*.ts` — the same sessions, packs, FAQs, address and hours
 * the static site has always shown — plus one staff login per role for
 * local development. Safe to re-run: it upserts by natural key (slug,
 * email) rather than blindly inserting duplicates.
 *
 *   pnpm db:seed
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import {
  clients,
  companyAccounts,
  contentBlocks,
  faqs,
  locations,
  packProducts,
  sessionTypePrices,
  sessionTypes,
  socialLinks,
  staffUsers,
  suites,
} from "./schema"
import { hashPassword } from "../auth/password"

// A standalone connection, not the app's `./client` — that module is
// guarded with `server-only`, which only resolves inside Next's
// bundler. Scripts run under plain Node (via tsx) need their own.
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not set")
const db = drizzle(postgres(connectionString, { max: 1 }), { schema })

const LOCATION_SLUG = "kimihurura"

async function seedLocation() {
  const existing = await db.query.locations.findFirst({ where: eq(locations.slug, LOCATION_SLUG) })
  if (existing) return existing

  const [location] = await db
    .insert(locations)
    .values({
      name: "Amari",
      slug: LOCATION_SLUG,
      street: "KG 7 Ave",
      neighborhood: "Kimihurura",
      city: "Kigali",
      country: "Rwanda",
      plusCode: "6HRQ+XX Kigali",
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=KG%207%20Ave%2C%20Kimihurura%2C%20Kigali%2C%20Rwanda",
      landmark: "Two minutes from the Kimihurura roundabout",
      parkingNote: "Free on-site parking for eight cars",
      phone: "+250 788 000 000",
      whatsapp: "250788000000",
      email: "hello@amari.rw",
      weekdayOpen: "10:00",
      weekdayClose: "21:00",
      weekendOpen: "09:00",
      weekendClose: "20:00",
      turnoverMinutes: 15,
      quietHoursEndHour: 16,
      cancellationWindowHours: 4,
      holdMinutes: 10,
    })
    .returning()
  console.log(`  location: ${location.name}`)
  return location
}

async function seedSuites(locationId: string) {
  const names = ["Suite One", "Suite Two", "Suite Three", "Suite Four"]
  for (const [index, name] of names.entries()) {
    const existing = await db.query.suites.findFirst({
      where: (s, { and, eq }) => and(eq(s.locationId, locationId), eq(s.name, name)),
    })
    if (existing) continue
    await db.insert(suites).values({ locationId, name, sortOrder: index })
  }
  console.log(`  suites: ${names.length}`)
}

const SESSION_SEED = [
  {
    slug: "quick",
    name: "The Quick Reset",
    durationMinutes: 15,
    label: "A pause in your day",
    intro: "A small pause. A fresh start.",
    summary:
      "Neck and shoulders, inside a lunch break. Short passes exactly where screen work and traffic collect.",
    about:
      "Fifteen minutes aimed squarely at the top of your spine — the neck, shoulders and upper back where screen work and traffic collect. The rollers work in short kneading passes rather than a full sweep, so the time goes where it is needed.",
    highlights: [
      "Neck, shoulder and upper-back focus",
      "Short kneading passes, not a full sweep",
      "Fits inside a lunch break",
    ],
    priceRwf: 8000,
    offPeakPriceRwf: 6500,
    sortOrder: 0,
  },
  {
    slug: "half",
    name: "The Half Hour",
    durationMinutes: 30,
    label: "A good place to start",
    intro: "Room to properly unwind.",
    summary:
      "Head to heels. The chair reclines, warms your lower back, and finishes with your calves and feet.",
    about:
      "Full-body coverage from your neck to the soles of your feet. The chair reclines into zero gravity, warms the lumbar panel, works down the spine, and finishes with air compression through the calves and feet. If you are visiting for the first time, book this one.",
    highlights: [
      "Full-body programme, neck to soles",
      "Zero-gravity recline and lumbar warmth",
      "Calf and foot air compression",
    ],
    priceRwf: 15000,
    offPeakPriceRwf: 12000,
    sortOrder: 1,
  },
  {
    slug: "full",
    name: "The Full Session",
    durationMinutes: 60,
    label: "Take your time",
    intro: "An unhurried hour, just for you.",
    summary: "Deeper and slower. Real time on every region, then a long stretch and a gentle rocking finish.",
    about:
      "The complete programme. Deeper and slower than the half hour — the chair spends real time on each region, moves through hips and shoulders, and closes with a long stretch sequence and a gentle rocking motion. An hour in which nothing at all is asked of you.",
    highlights: [
      "Every region, at an unhurried pace",
      "Heat through lumbar and calf panels",
      "Long stretch sequence and rocking finish",
    ],
    priceRwf: 25000,
    offPeakPriceRwf: 20000,
    sortOrder: 2,
  },
]

async function seedSessionTypes(locationId: string) {
  const bySlug: Record<string, string> = {}
  for (const s of SESSION_SEED) {
    let row = await db.query.sessionTypes.findFirst({
      where: (t, { and, eq }) => and(eq(t.locationId, locationId), eq(t.slug, s.slug)),
    })
    if (!row) {
      ;[row] = await db
        .insert(sessionTypes)
        .values({
          locationId,
          slug: s.slug,
          name: s.name,
          durationMinutes: s.durationMinutes,
          label: s.label,
          intro: s.intro,
          summary: s.summary,
          about: s.about,
          highlights: s.highlights,
          sortOrder: s.sortOrder,
        })
        .returning()
    }
    bySlug[s.slug] = row.id

    const hasCurrentPrice = await db.query.sessionTypePrices.findFirst({
      where: (p, { and, eq, isNull }) => and(eq(p.sessionTypeId, row.id), isNull(p.effectiveTo)),
    })
    if (!hasCurrentPrice) {
      await db.insert(sessionTypePrices).values({
        sessionTypeId: row.id,
        priceRwf: s.priceRwf,
        offPeakPriceRwf: s.offPeakPriceRwf,
        reason: "Initial seed price — confirm before launch (see docs/phase-0-decisions.md)",
      })
    }
  }
  console.log(`  session types: ${SESSION_SEED.length}`)
  return bySlug
}

async function seedPacks(locationId: string, sessionTypeIdBySlug: Record<string, string>) {
  const packs = [
    {
      slug: "five-half",
      name: "Five Half Hours",
      sessionSlug: "half",
      sessionsIncluded: 5,
      priceRwf: 67000,
      validityDays: 60,
      description:
        "A reasonable place to start. Five sessions is enough to find out whether this becomes part of your week or stays an occasional thing.",
      includes: [
        "5 sessions of 30 minutes, used whenever you like",
        "Balance tracked against your phone number",
        "Shareable — bring whoever you want",
        "Lounge access on every visit",
      ],
      extras: [] as string[],
      featured: false,
      sortOrder: 0,
    },
    {
      slug: "ten-half",
      name: "Ten Half Hours",
      sessionSlug: "half",
      sessionsIncluded: 10,
      priceRwf: 127000,
      validityDays: 90,
      description:
        "Roughly once a week for three months. This is the pack for people who have already decided that stopping regularly is worth paying for in advance.",
      includes: [
        "10 sessions of 30 minutes, used whenever you like",
        "Balance tracked against your phone number",
        "Shareable — bring whoever you want",
        "Priority booking on evening slots",
        "Lounge access on every visit",
      ],
      extras: ["Priority booking on evening slots"],
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "ten-full",
      name: "Ten Full Hours",
      sessionSlug: "full",
      sessionsIncluded: 10,
      priceRwf: 212000,
      validityDays: 90,
      description:
        "The full hour, ten times over. For people who have discovered that thirty minutes ends exactly when they were beginning to switch off.",
      includes: [
        "10 sessions of 60 minutes, used whenever you like",
        "Balance tracked against your phone number",
        "Shareable — bring whoever you want",
        "Priority booking on evening slots",
        "Named locker held for your visits",
      ],
      extras: ["Priority booking on evening slots", "A named locker held for your visits"],
      featured: false,
      sortOrder: 2,
    },
  ]

  for (const p of packs) {
    const existing = await db.query.packProducts.findFirst({
      where: (row, { and, eq }) => and(eq(row.locationId, locationId), eq(row.slug, p.slug)),
    })
    if (existing) continue
    await db.insert(packProducts).values({
      locationId,
      slug: p.slug,
      name: p.name,
      sessionTypeId: sessionTypeIdBySlug[p.sessionSlug],
      sessionsIncluded: p.sessionsIncluded,
      priceRwf: p.priceRwf,
      validityDays: p.validityDays,
      description: p.description,
      includes: p.includes,
      extras: p.extras,
      featured: p.featured,
      sortOrder: p.sortOrder,
    })
  }
  console.log(`  pack products: ${packs.length}`)
}

async function seedFaqs(locationId: string) {
  const groups: Record<string, { q: string; a: string }[]> = {
    home: [
      {
        q: "What is an automated massage session?",
        a: "Your massage is delivered by the chair, in your own private suite. There is no therapist and nobody else in the room. You set the intensity on the control panel and can stop the programme whenever you choose.",
      },
      {
        q: "What should I wear?",
        a: "Whatever you arrived in, as long as it is comfortable. The chair works through clothing. We ask you to take your shoes off — slippers are provided — and to empty your back pockets.",
      },
      {
        q: "Can I keep my phone with me?",
        a: "Of course. Keep it with you or lock it away; we hand you a locker key either way and never ask which you chose. The one rule is that the lounge stays silent.",
      },
      {
        q: "How is the suite prepared between guests?",
        a: "The chair cover and headrest cloth are replaced with a freshly laundered set, every contact surface is disinfected, and the room is aired. Fifteen minutes are reserved after every booking for it.",
      },
    ],
    sessions: [
      {
        q: "Which session should I start with?",
        a: "The Half Hour. It is long enough to properly unwind and covers you from neck to feet. Choose fifteen minutes for a shorter reset, or the full hour once you know you like it.",
      },
      {
        q: "Does it hurt?",
        a: "It should not. The chair runs at level three of five by default, which most people describe as firm but comfortable. If a roller catches somewhere tender, turn the intensity down on the panel or press stop — the chair returns to upright within seconds. Some muscle awareness the next day is normal, the same as after a stretch.",
      },
      {
        q: "Is anyone in the room with me?",
        a: "No. The suite is private and locks from the inside. No therapist, no attendant, nobody knocking. The chair is fully automated from start to finish — that is the whole idea. If you need help, there is a call button that rings reception.",
      },
      {
        q: "Is there a height or weight limit?",
        a: "The chairs are built for guests between roughly 150cm and 195cm, up to 120kg. Outside that range the rollers may not line up with your spine properly, which makes the session less useful rather than unsafe. Message us if you are unsure and we will tell you honestly.",
      },
      {
        q: "Can I use it if I am pregnant, or have a back condition?",
        a: "Please speak to your doctor first, then talk to us before booking. We would rather turn away a booking than give you a session you should not have.",
      },
    ],
    space: [
      {
        q: "Do I have to leave my phone in the locker?",
        a: "No. It is entirely your choice and we never ask which you chose. The only rule is that the lounge stays silent — no calls, no speaker audio.",
      },
      {
        q: "What do people do in the lounge?",
        a: "Read, mostly. Some write. Some sit with their eyes shut and let the session settle. There is no programme and nobody will ask you what you are doing.",
      },
      {
        q: "Can I work there?",
        a: "Quiet laptop work is fine. Calls and video meetings are not — that is the one thing we protect.",
      },
      {
        q: "Can I come just for the lounge?",
        a: "Yes, if there is room. Lounge access is included with every session, and we keep a few seats for people who only want the quiet.",
      },
      {
        q: "Is there parking?",
        a: "Yes, free on site. There is space for eight cars, and the entrance is directly off the road.",
      },
    ],
    packs: [
      {
        q: "How do session packs work?",
        a: "You buy a set number of sessions up front at a lower price per session, and use them whenever you like before they expire. No monthly charge, no card on file, no subscription to cancel.",
      },
      {
        q: "Why not a monthly membership?",
        a: "Reliable automatic monthly billing over mobile money is genuinely awkward here, and we would rather not hold your card details. A pack gives you the same saving without a standing charge.",
      },
      {
        q: "What happens when my pack expires?",
        a: "Unused sessions expire on the date shown when you buy. We message you two weeks before.",
      },
      {
        q: "Can I share a pack?",
        a: "Yes. Bring whoever you like and use your sessions on them. The balance belongs to you, not to a named individual.",
      },
      {
        q: "Can I buy a pack as a gift?",
        a: "Yes. Gift vouchers are bought by value rather than session count, arrive as a code, and can be spent on any programme.",
      },
    ],
  }

  for (const [group, items] of Object.entries(groups)) {
    const existing = await db.query.faqs.findFirst({
      where: (f, { and, eq }) => and(eq(f.locationId, locationId), eq(f.group, group)),
    })
    if (existing) continue
    await db.insert(faqs).values(
      items.map((item, index) => ({
        locationId,
        group,
        question: item.q,
        answer: item.a,
        sortOrder: index,
      })),
    )
  }
  console.log(`  FAQ groups: ${Object.keys(groups).length}`)
}

async function seedSocialLinks(locationId: string) {
  const links = [
    { platform: "whatsapp", label: "WhatsApp", url: "https://wa.me/250788000000", sortOrder: 0 },
    { platform: "instagram", label: "Instagram", url: "https://instagram.com/amari.rw", sortOrder: 1 },
  ]
  for (const link of links) {
    const existing = await db.query.socialLinks.findFirst({
      where: (s, { and, eq }) => and(eq(s.locationId, locationId), eq(s.platform, link.platform)),
    })
    if (existing) continue
    await db.insert(socialLinks).values({ locationId, ...link })
  }
  console.log(`  social links: ${links.length}`)
}

/**
 * Freeform copy that doesn't have its own column anywhere — the tagline,
 * the hygiene protocol, the shelf — keyed the way the site looks it up.
 * See `src/server/db/content.ts` for the reader side and the exact shape
 * each key's `value` is expected to hold.
 */
async function seedContentBlocks(locationId: string) {
  const blocks: { key: string; value: unknown }[] = [
    { key: "site.tagline", value: "A chair. A quiet room. Time to think." },
    {
      key: "site.description",
      value:
        "Private automated massage suites in Kigali. You are not touched by anyone. Book a chair, close the door, and let the machine work.",
    },
    { key: "hours.note", value: "Last session starts one hour before closing." },
    {
      key: "hours.walkins",
      value: "Walk-ins are welcome when a suite is free. Booking guarantees one.",
    },
    {
      key: "contact.responseTime",
      value: "We reply to WhatsApp within the hour, and to email within one working day.",
    },
    {
      key: "payments.note",
      value:
        "Suites are paid for when you book. Cancel free of charge up to four hours before your session and we refund in full.",
    },
    {
      key: "hygiene_protocol",
      value: [
        {
          label: "Between every guest",
          detail:
            "The chair cover and headrest cloth are removed and replaced with a freshly laundered set. Nobody sits on the cover you sat on.",
        },
        {
          label: "Fifteen minutes",
          detail:
            "Every booking reserves the suite for fifteen minutes longer than your session. That gap is turnover time — it is built into the schedule, not squeezed in while you wait.",
        },
        {
          label: "Every surface",
          detail:
            "Control panel, armrests, leg wells and door handle are wiped down with medical-grade disinfectant after each session.",
        },
        {
          label: "Every room",
          detail:
            "The suite is aired and the air filter runs between guests. You enter a room that has been reset, not just vacated.",
        },
      ],
    },
    {
      key: "visit_steps",
      value: [
        {
          time: "−05:00",
          title: "You arrive",
          body: "Reception checks you in and shows you the suite. Lock your phone away or keep it — we hand you a key either way and never ask which.",
        },
        {
          time: "00:00",
          title: "You close the door",
          body: "The suite is yours alone and locks from the inside. Nobody comes in during your session, and there is no attendant in the room.",
        },
        {
          time: "00:01",
          title: "The chair does the work",
          body: "One panel, one start button. It measures your shoulders, reclines, and begins. Turn the intensity up or down, or stop it, at any moment.",
        },
        {
          time: "00:30",
          title: "You sit in the lounge",
          body: "When the programme ends, the reading room is yours for as long as you want it. Tea is poured. There is no clock on the wall.",
        },
      ],
    },
    {
      key: "shelf",
      value: {
        note: "A small shelf, changed each month. Take anything down. Nothing is for sale.",
        titles: [
          { title: "Silence in the Age of Noise", author: "Erling Kagge" },
          { title: "The Idea of the Brain", author: "Matthew Cobb" },
          { title: "A Field Guide to Getting Lost", author: "Rebecca Solnit" },
          { title: "Wintering", author: "Katherine May" },
          { title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
          { title: "The Poetics of Space", author: "Gaston Bachelard" },
        ],
      },
    },
  ]

  for (const block of blocks) {
    const existing = await db.query.contentBlocks.findFirst({
      where: (c, { and, eq }) => and(eq(c.locationId, locationId), eq(c.key, block.key)),
    })
    if (existing) continue
    await db.insert(contentBlocks).values({ locationId, key: block.key, value: block.value })
  }
  console.log(`  content blocks: ${blocks.length}`)
}

const STAFF_SEED = [
  { email: "owner@amari.rw", name: "Amari Owner", role: "owner" as const },
  { email: "manager@amari.rw", name: "Amari Manager", role: "manager" as const },
  { email: "desk@amari.rw", name: "Front Desk", role: "front_desk" as const },
  { email: "finance@amari.rw", name: "Amari Finance", role: "finance" as const },
]

async function seedStaff() {
  // Local development only. A real password must be set (and 2FA
  // enrolled) before any of these accounts touch production data — see
  // Phase 0/1 checklist in CLAUDE.md.
  const devPassword = process.env.SEED_STAFF_PASSWORD ?? "change-me-now"
  const passwordHash = await hashPassword(devPassword)

  for (const staff of STAFF_SEED) {
    const existing = await db.query.staffUsers.findFirst({ where: eq(staffUsers.email, staff.email) })
    if (existing) continue
    await db.insert(staffUsers).values({ ...staff, passwordHash })
  }
  console.log(`  staff users: ${STAFF_SEED.length} (dev password: "${devPassword}")`)
}

async function main() {
  console.log("Seeding...")
  const location = await seedLocation()
  await seedSuites(location.id)
  const sessionTypeIdBySlug = await seedSessionTypes(location.id)
  await seedPacks(location.id, sessionTypeIdBySlug)
  await seedFaqs(location.id)
  await seedSocialLinks(location.id)
  await seedContentBlocks(location.id)
  await seedStaff()
  console.log("Done.")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
