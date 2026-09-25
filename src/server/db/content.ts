import "server-only"
import { cache } from "react"
import { and, asc, eq, isNull } from "drizzle-orm"
import { db } from "./client"
import {
  contentBlocks,
  faqs,
  holidays,
  locations,
  maintenanceBlocks,
  packProducts,
  sessionTypePrices,
  sessionTypes,
  socialLinks,
  suites,
} from "./schema"

/**
 * The database-backed replacement for `src/data/*.ts` (Phase 1.3 — see
 * CLAUDE.md). Every exported function here is `cache()`-wrapped so the
 * same request never queries the same row twice, no matter how many
 * Server Components on the page ask for it.
 *
 * Deliberately NOT moved to the database in this phase (see the P1.3
 * commit message and AGENTS.md): `src/data/journal.ts` (no schema table
 * — blog articles weren't part of the owner's brief), `src/data/images.ts`
 * (real photography is a Phase 0 owner action, not a content edit), and
 * `GIFT_VOUCHER`/`CORPORATE`/`PARTNER_SESSIONS`/`OFF_PEAK` in
 * `src/data/packs.ts`/`sessions.ts` (marketing constants with no natural
 * row to live in yet).
 */

/** There is exactly one location in Phase 1 — see `locations` schema comment. */
export const getLocation = cache(async () => {
  const [location] = await db.select().from(locations).where(eq(locations.active, true)).limit(1)
  if (!location) {
    throw new Error("No active location in the database — run `pnpm db:seed` (see docs/database.md).")
  }
  return location
})

export type SiteConfig = {
  name: string
  tagline: string
  description: string
  address: {
    street: string
    neighborhood: string
    city: string
    country: string
    plusCode: string | null
    landmark: string | null
    parking: string | null
    full: string
    mapsUrl: string | null
  }
  contact: {
    phone: string | null
    whatsapp: string | null
    email: string | null
    responseTime: string
  }
  hours: {
    weekdays: string
    weekends: string
    note: string
    walkins: string
    schedule: {
      weekday: { open: number; close: number }
      weekend: { open: number; close: number }
    }
  }
  payments: { note: string }
}

const clockHour = (time: string) => Number(time.slice(0, 2))

/** The site-wide config, shaped like the old `SITE_CONFIG` so call sites barely change. */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const [location, blocks] = await Promise.all([getLocation(), getContentBlocks()])
  const weekday = { open: clockHour(location.weekdayOpen), close: clockHour(location.weekdayClose) }
  const weekend = { open: clockHour(location.weekendOpen), close: clockHour(location.weekendClose) }
  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`
  return {
    name: location.name,
    tagline: (blocks["site.tagline"] as string) ?? "",
    description: (blocks["site.description"] as string) ?? "",
    address: {
      street: location.street,
      neighborhood: location.neighborhood,
      city: location.city,
      country: location.country,
      plusCode: location.plusCode,
      landmark: location.landmark,
      parking: location.parkingNote,
      full: `${location.street}, ${location.neighborhood}, ${location.city}, ${location.country}`,
      mapsUrl: location.mapsUrl,
    },
    contact: {
      phone: location.phone,
      whatsapp: location.whatsapp,
      email: location.email,
      responseTime: (blocks["contact.responseTime"] as string) ?? "",
    },
    hours: {
      weekdays: `Monday – Friday · ${pad(weekday.open)} – ${pad(weekday.close)}`,
      weekends: `Saturday – Sunday · ${pad(weekend.open)} – ${pad(weekend.close)}`,
      note: (blocks["hours.note"] as string) ?? "",
      walkins: (blocks["hours.walkins"] as string) ?? "",
      schedule: { weekday, weekend },
    },
    payments: { note: (blocks["payments.note"] as string) ?? "" },
  }
})

export const getHolidays = cache(async () => {
  const location = await getLocation()
  return db.select().from(holidays).where(eq(holidays.locationId, location.id)).orderBy(asc(holidays.date))
})

export type SocialLink = { id: string; platform: string; label: string; url: string }

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const location = await getLocation()
  const rows = await db
    .select({ id: socialLinks.id, platform: socialLinks.platform, label: socialLinks.label, url: socialLinks.url })
    .from(socialLinks)
    .where(and(eq(socialLinks.locationId, location.id), eq(socialLinks.active, true)))
    .orderBy(asc(socialLinks.sortOrder))
  return rows
})

export type SessionItem = {
  /** The slug ('quick' | 'half' | 'full') — stable for public URLs like /book?session=. */
  id: string
  /** The database row id — what admin mutations (Phase 1.3 part 2) key off, since the slug isn't guaranteed unique enough to write against safely. */
  uuid: string
  name: string
  duration: string
  durationMinutes: number
  price: string
  priceNumber: number
  offPeakPrice: string
  offPeakNumber: number
  label: string
  intro: string
  summary: string
  about: string
  highlights: string[]
}

const formatRWF = (amount: number) => `${amount.toLocaleString("en-RW")} RWF`
const formatDuration = (minutes: number) => `${minutes} minutes`

/** Session types joined to their current (`effectiveTo IS NULL`) price — see `session_type_prices` schema comment. */
export const getSessionTypes = cache(async (): Promise<SessionItem[]> => {
  const location = await getLocation()
  const rows = await db
    .select({ type: sessionTypes, price: sessionTypePrices })
    .from(sessionTypes)
    .innerJoin(
      sessionTypePrices,
      and(eq(sessionTypePrices.sessionTypeId, sessionTypes.id), isNull(sessionTypePrices.effectiveTo)),
    )
    .where(and(eq(sessionTypes.locationId, location.id), eq(sessionTypes.active, true)))
    .orderBy(asc(sessionTypes.sortOrder))

  return rows.map(({ type, price }) => ({
    id: type.slug,
    uuid: type.id,
    name: type.name,
    duration: formatDuration(type.durationMinutes),
    durationMinutes: type.durationMinutes,
    price: formatRWF(price.priceRwf),
    priceNumber: price.priceRwf,
    offPeakPrice: formatRWF(price.offPeakPriceRwf),
    offPeakNumber: price.offPeakPriceRwf,
    label: type.label,
    intro: type.intro,
    summary: type.summary,
    about: type.about,
    highlights: type.highlights,
  }))
})

export type SessionPack = {
  id: string
  name: string
  price: string
  priceNumber: number
  perSession: string
  perSessionNumber: number
  sessionMinutes: number
  sessions: string
  validity: string
  saving: string
  description: string
  includes: string[]
  extras: string[]
  cta: string
  featured: boolean
}

/** Pack products joined to their session type, with the per-session and saving figures computed rather than stored. */
export const getPackProducts = cache(async (): Promise<SessionPack[]> => {
  const location = await getLocation()
  const [packRows, sessions] = await Promise.all([
    db
      .select({ pack: packProducts, sessionType: sessionTypes })
      .from(packProducts)
      .innerJoin(sessionTypes, eq(sessionTypes.id, packProducts.sessionTypeId))
      .where(and(eq(packProducts.locationId, location.id), eq(packProducts.active, true)))
      .orderBy(asc(packProducts.sortOrder)),
    getSessionTypes(),
  ])

  return packRows.map(({ pack, sessionType }) => {
    const perSessionNumber = Math.round(pack.priceRwf / pack.sessionsIncluded)
    const currentSession = sessions.find((s) => s.durationMinutes === sessionType.durationMinutes)
    const fullPrice = (currentSession?.priceNumber ?? perSessionNumber) * pack.sessionsIncluded
    const savingNumber = Math.max(0, fullPrice - pack.priceRwf)
    const months = pack.validityDays % 30 === 0 ? `${pack.validityDays / 30} months` : `${pack.validityDays} days`
    return {
      id: pack.slug,
      name: pack.name,
      price: formatRWF(pack.priceRwf),
      priceNumber: pack.priceRwf,
      perSession: `${formatRWF(perSessionNumber)} a session`,
      perSessionNumber,
      sessionMinutes: sessionType.durationMinutes,
      sessions: `${pack.sessionsIncluded} × ${sessionType.durationMinutes}-minute sessions`,
      validity: `Valid for ${months}`,
      saving: `Saves ${formatRWF(savingNumber)}`,
      description: pack.description,
      includes: pack.includes,
      extras: pack.extras,
      cta: `Buy ${pack.sessionsIncluded} ${sessionType.durationMinutes === 60 ? "hours" : "sessions"}`,
      featured: pack.featured,
    }
  })
})

export type Faq = { q: string; a: string }

/** `group` matches the seed: 'home' | 'sessions' | 'space' | 'packs'. */
export const getFaqs = cache(async (group: string): Promise<Faq[]> => {
  const location = await getLocation()
  const rows = await db
    .select({ question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.locationId, location.id), eq(faqs.group, group), eq(faqs.active, true)))
    .orderBy(asc(faqs.sortOrder))
  return rows.map((r) => ({ q: r.question, a: r.answer }))
})

/** All content-block rows for the location, keyed the way `seedContentBlocks` wrote them. */
export const getContentBlocks = cache(async (): Promise<Record<string, unknown>> => {
  const location = await getLocation()
  const rows = await db
    .select({ key: contentBlocks.key, value: contentBlocks.value })
    .from(contentBlocks)
    .where(eq(contentBlocks.locationId, location.id))
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
})

export type HygieneStep = { label: string; detail: string }
export type VisitStep = { time: string; title: string; body: string }
export type Shelf = { note: string; titles: { title: string; author: string }[] }

export const getHygieneProtocol = cache(async (): Promise<HygieneStep[]> => {
  const blocks = await getContentBlocks()
  return (blocks["hygiene_protocol"] as HygieneStep[]) ?? []
})

export const getVisitSteps = cache(async (): Promise<VisitStep[]> => {
  const blocks = await getContentBlocks()
  return (blocks["visit_steps"] as VisitStep[]) ?? []
})

export const getShelf = cache(async (): Promise<Shelf> => {
  const blocks = await getContentBlocks()
  return (blocks["shelf"] as Shelf) ?? { note: "", titles: [] }
})

/* ──────────────────── Admin-only reads (Phase 1.3 part 2b) ────────────────────
 * The functions above shape data for the public site. These are for
 * `/staff/*` pages instead: they return the full row (id, inactive rows
 * included where relevant) so a form can edit or delete by id, which the
 * public-facing shapes above deliberately don't expose.
 */

export type SuiteRow = {
  id: string
  name: string
  status: "ready" | "occupied" | "cleaning" | "maintenance"
  note: string | null
  sortOrder: number
}

export const getSuitesForAdmin = cache(async (): Promise<SuiteRow[]> => {
  const location = await getLocation()
  const rows = await db
    .select({ id: suites.id, name: suites.name, status: suites.status, note: suites.note, sortOrder: suites.sortOrder })
    .from(suites)
    .where(and(eq(suites.locationId, location.id), eq(suites.active, true)))
    .orderBy(asc(suites.sortOrder))
  return rows
})

export type MaintenanceBlockRow = {
  id: string
  suiteId: string
  suiteName: string
  startAt: Date
  endAt: Date
  reason: string
}

export const getMaintenanceBlocksForAdmin = cache(async (): Promise<MaintenanceBlockRow[]> => {
  const location = await getLocation()
  const rows = await db
    .select({
      id: maintenanceBlocks.id,
      suiteId: maintenanceBlocks.suiteId,
      suiteName: suites.name,
      startAt: maintenanceBlocks.startAt,
      endAt: maintenanceBlocks.endAt,
      reason: maintenanceBlocks.reason,
    })
    .from(maintenanceBlocks)
    .innerJoin(suites, eq(suites.id, maintenanceBlocks.suiteId))
    .where(eq(suites.locationId, location.id))
    .orderBy(asc(maintenanceBlocks.startAt))
  return rows
})

export type FaqRow = { id: string; group: string; question: string; answer: string; sortOrder: number }

export const getFaqsForAdmin = cache(async (): Promise<FaqRow[]> => {
  const location = await getLocation()
  const rows = await db
    .select({ id: faqs.id, group: faqs.group, question: faqs.question, answer: faqs.answer, sortOrder: faqs.sortOrder })
    .from(faqs)
    .where(and(eq(faqs.locationId, location.id), eq(faqs.active, true)))
    .orderBy(asc(faqs.group), asc(faqs.sortOrder))
  return rows
})
