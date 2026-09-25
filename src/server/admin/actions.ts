"use server"

/**
 * Server Actions for the admin write side (Phase 1.3 part 2 — see
 * CLAUDE.md). Every export here calls `requireStaffAction` itself, the
 * same rule P1.2's `dal.ts` documents: a page-level check never extends
 * to the Server Actions it renders forms against, so each action
 * re-derives who's asking and re-checks the capability, not just the
 * page.
 *
 * After every mutation: `recordActivity` (the append-only audit trail
 * CLAUDE.md §3 requires for "every sensitive action"), then
 * `revalidatePath("/", "layout")` — the whole app hangs off the root
 * layout, and content/prices can surface on any page, so revalidating
 * by exact path per mutation is a standing invitation to miss one.
 */

import { revalidatePath } from "next/cache"
import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db/client"
import {
  contentBlocks,
  faqs,
  holidays,
  locations,
  maintenanceBlocks,
  sessionTypePrices,
  sessionTypes,
  socialLinks,
  suites,
} from "../db/schema"
import { requireStaffAction } from "../auth/dal"
import { recordActivity } from "../auth/activity"

export type ActionState = { error?: string; ok?: boolean }

function linesToArray(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

/* ───────────────────────── Session types & pricing ───────────────────────── */

const sessionCopySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(80),
  intro: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(400),
  about: z.string().trim().min(1).max(1000),
})

export async function updateSessionTypeCopy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("prices.edit")
  const parsed = sessionCopySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the fields — something didn't validate." }
  const { id, ...fields } = parsed.data
  const highlights = linesToArray(formData.get("highlights"))
  if (highlights.length === 0) return { error: "Add at least one highlight." }

  const [before] = await db.select().from(sessionTypes).where(eq(sessionTypes.id, id)).limit(1)
  if (!before) return { error: "That session no longer exists." }

  await db.update(sessionTypes).set({ ...fields, highlights }).where(eq(sessionTypes.id, id))
  await recordActivity({
    staffUserId: staff.id,
    action: "sessionType.updated",
    entityType: "session_type",
    entityId: id,
    before: { name: before.name, label: before.label, intro: before.intro, summary: before.summary, about: before.about, highlights: before.highlights },
    after: { ...fields, highlights },
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

const priceSchema = z.object({
  sessionTypeId: z.string().uuid(),
  priceRwf: z.coerce.number().int().positive(),
  offPeakPriceRwf: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1, "A reason is required for a price change.").max(300),
})

/**
 * Price history, not an edit: closes out the current row
 * (`effectiveTo = now()`) and inserts a new one, in one transaction, so
 * a booking already made keeps the price it was made at — see the
 * `session_type_prices` schema comment and CLAUDE.md §3.
 */
export async function updateSessionTypePrice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("prices.edit")
  const parsed = priceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  }
  const { sessionTypeId, priceRwf, offPeakPriceRwf, reason } = parsed.data
  if (parsed.data.offPeakPriceRwf > parsed.data.priceRwf) {
    return { error: "The quiet-hours price should not be higher than the standard price." }
  }

  const [current] = await db
    .select()
    .from(sessionTypePrices)
    .where(and(eq(sessionTypePrices.sessionTypeId, sessionTypeId), isNull(sessionTypePrices.effectiveTo)))
    .limit(1)
  if (!current) return { error: "No current price found for that session." }

  await db.transaction(async (tx) => {
    await tx
      .update(sessionTypePrices)
      .set({ effectiveTo: new Date() })
      .where(eq(sessionTypePrices.id, current.id))
    await tx.insert(sessionTypePrices).values({
      sessionTypeId,
      priceRwf,
      offPeakPriceRwf,
      changedByStaffId: staff.id,
      reason,
    })
  })

  await recordActivity({
    staffUserId: staff.id,
    action: "sessionType.priceChanged",
    entityType: "session_type",
    entityId: sessionTypeId,
    before: { priceRwf: current.priceRwf, offPeakPriceRwf: current.offPeakPriceRwf },
    after: { priceRwf, offPeakPriceRwf },
    reason,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

/* ───────────────────────────── Location & hours ───────────────────────────── */

const locationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  street: z.string().trim().min(1).max(120),
  neighborhood: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  plusCode: z.string().trim().max(40).optional().or(z.literal("")),
  mapsUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  landmark: z.string().trim().max(200).optional().or(z.literal("")),
  parkingNote: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  weekdayOpen: z.string().regex(/^\d{2}:\d{2}$/),
  weekdayClose: z.string().regex(/^\d{2}:\d{2}$/),
  weekendOpen: z.string().regex(/^\d{2}:\d{2}$/),
  weekendClose: z.string().regex(/^\d{2}:\d{2}$/),
  turnoverMinutes: z.coerce.number().int().min(0).max(120),
  quietHoursEndHour: z.coerce.number().int().min(0).max(23),
  cancellationWindowHours: z.coerce.number().int().min(0).max(72),
  holdMinutes: z.coerce.number().int().min(1).max(60),
})

export async function updateLocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("hours.edit")
  const raw = Object.fromEntries(formData)
  const parsed = locationSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  }
  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const nullIfEmpty = (v: string | undefined) => (v && v.length > 0 ? v : null)
  const update = {
    name: parsed.data.name,
    street: parsed.data.street,
    neighborhood: parsed.data.neighborhood,
    city: parsed.data.city,
    country: parsed.data.country,
    plusCode: nullIfEmpty(parsed.data.plusCode),
    mapsUrl: nullIfEmpty(parsed.data.mapsUrl),
    landmark: nullIfEmpty(parsed.data.landmark),
    parkingNote: nullIfEmpty(parsed.data.parkingNote),
    phone: nullIfEmpty(parsed.data.phone),
    whatsapp: nullIfEmpty(parsed.data.whatsapp),
    email: nullIfEmpty(parsed.data.email),
    weekdayOpen: parsed.data.weekdayOpen,
    weekdayClose: parsed.data.weekdayClose,
    weekendOpen: parsed.data.weekendOpen,
    weekendClose: parsed.data.weekendClose,
    turnoverMinutes: parsed.data.turnoverMinutes,
    quietHoursEndHour: parsed.data.quietHoursEndHour,
    cancellationWindowHours: parsed.data.cancellationWindowHours,
    holdMinutes: parsed.data.holdMinutes,
    updatedAt: new Date(),
  }
  await db.update(locations).set(update).where(eq(locations.id, location.id))
  await recordActivity({
    staffUserId: staff.id,
    action: "location.updated",
    entityType: "location",
    entityId: location.id,
    before: location,
    after: update,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

/* ─────────────────────────────── Holidays ─────────────────────────────── */

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().trim().min(1).max(80),
  closed: z.coerce.boolean(),
})

export async function addHoliday(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("hours.edit")
  const parsed = holidaySchema.safeParse({
    date: formData.get("date"),
    label: formData.get("label"),
    closed: formData.get("closed") === "on",
  })
  if (!parsed.success) return { error: "Check the fields — something didn't validate." }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const [row] = await db
    .insert(holidays)
    .values({ locationId: location.id, date: parsed.data.date, label: parsed.data.label, closed: parsed.data.closed })
    .returning({ id: holidays.id })
  await recordActivity({
    staffUserId: staff.id,
    action: "holiday.added",
    entityType: "holiday",
    entityId: row.id,
    after: parsed.data,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteHoliday(id: string): Promise<void> {
  const staff = await requireStaffAction("hours.edit")
  await db.delete(holidays).where(eq(holidays.id, id))
  await recordActivity({ staffUserId: staff.id, action: "holiday.deleted", entityType: "holiday", entityId: id })
  revalidatePath("/", "layout")
}

/* ──────────────────────────── Social links ──────────────────────────── */

const socialLinkSchema = z.object({
  platform: z.string().trim().toLowerCase().min(1).max(30),
  label: z.string().trim().min(1).max(40),
  url: z.string().trim().url().max(300),
})

export async function addSocialLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("hours.edit")
  const parsed = socialLinkSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the fields — a valid URL is required." }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const [row] = await db
    .insert(socialLinks)
    .values({ locationId: location.id, ...parsed.data })
    .returning({ id: socialLinks.id })
  await recordActivity({
    staffUserId: staff.id,
    action: "socialLink.added",
    entityType: "social_link",
    entityId: row.id,
    after: parsed.data,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteSocialLink(id: string): Promise<void> {
  const staff = await requireStaffAction("hours.edit")
  await db.delete(socialLinks).where(eq(socialLinks.id, id))
  await recordActivity({ staffUserId: staff.id, action: "socialLink.deleted", entityType: "social_link", entityId: id })
  revalidatePath("/", "layout")
}

/* ────────────────────────────── Suites ────────────────────────────── */

const suiteStatusValues = ["ready", "occupied", "cleaning", "maintenance"] as const

const suiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(40),
  status: z.enum(suiteStatusValues),
  note: z.string().trim().max(200).optional().or(z.literal("")),
})

export async function updateSuite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("suites.edit")
  const parsed = suiteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the fields — something didn't validate." }
  const { id, name, status, note } = parsed.data

  const [before] = await db.select().from(suites).where(eq(suites.id, id)).limit(1)
  if (!before) return { error: "That suite no longer exists." }

  await db.update(suites).set({ name, status, note: note || null }).where(eq(suites.id, id))
  await recordActivity({
    staffUserId: staff.id,
    action: "suite.updated",
    entityType: "suite",
    entityId: id,
    before: { name: before.name, status: before.status, note: before.note },
    after: { name, status, note: note || null },
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

const newSuiteSchema = z.object({ name: z.string().trim().min(1).max(40) })

export async function addSuite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("suites.edit")
  const parsed = newSuiteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Give the suite a name." }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const existingCount = await db.select().from(suites).where(eq(suites.locationId, location.id))
  const [row] = await db
    .insert(suites)
    .values({ locationId: location.id, name: parsed.data.name, sortOrder: existingCount.length })
    .returning({ id: suites.id })
  await recordActivity({
    staffUserId: staff.id,
    action: "suite.added",
    entityType: "suite",
    entityId: row.id,
    after: { name: parsed.data.name },
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

/* ───────────────────────── Maintenance blocks ───────────────────────── */

const maintenanceBlockSchema = z.object({
  suiteId: z.string().uuid(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  reason: z.string().trim().min(1, "A reason is required.").max(200),
})

/** True when a Postgres error is the maintenance_blocks_no_overlap exclusion constraint. */
function isMaintenanceOverlap(err: unknown): boolean {
  const cause = err && typeof err === "object" && "cause" in err ? (err as { cause?: Error }).cause : undefined
  const message = cause instanceof Error ? cause.message : err instanceof Error ? err.message : String(err)
  return message.includes("maintenance_blocks_no_overlap")
}

export async function addMaintenanceBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("suites.maintenance")
  const parsed = maintenanceBlockSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields — something didn't validate." }
  }
  const { suiteId, reason } = parsed.data
  const startAt = new Date(parsed.data.startAt)
  const endAt = new Date(parsed.data.endAt)
  if (!(endAt > startAt)) return { error: "The end time must be after the start time." }

  try {
    const [row] = await db
      .insert(maintenanceBlocks)
      .values({ suiteId, startAt, endAt, reason, createdByStaffId: staff.id })
      .returning({ id: maintenanceBlocks.id })
    await recordActivity({
      staffUserId: staff.id,
      action: "maintenanceBlock.added",
      entityType: "maintenance_block",
      entityId: row.id,
      after: { suiteId, startAt, endAt, reason },
    })
  } catch (err) {
    if (isMaintenanceOverlap(err)) {
      return { error: "That overlaps another maintenance block on the same suite." }
    }
    throw err
  }
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteMaintenanceBlock(id: string): Promise<void> {
  const staff = await requireStaffAction("suites.maintenance")
  await db.delete(maintenanceBlocks).where(eq(maintenanceBlocks.id, id))
  await recordActivity({
    staffUserId: staff.id,
    action: "maintenanceBlock.deleted",
    entityType: "maintenance_block",
    entityId: id,
  })
  revalidatePath("/", "layout")
}

/* ───────────────────────────────── FAQs ───────────────────────────────── */

const faqGroupValues = ["home", "sessions", "space", "packs"] as const

const newFaqSchema = z.object({
  group: z.enum(faqGroupValues),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1000),
})

export async function addFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("content.edit")
  const parsed = newFaqSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the fields — something didn't validate." }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const existing = await db.select().from(faqs).where(and(eq(faqs.locationId, location.id), eq(faqs.group, parsed.data.group)))
  const [row] = await db
    .insert(faqs)
    .values({ locationId: location.id, ...parsed.data, sortOrder: existing.length })
    .returning({ id: faqs.id })
  await recordActivity({
    staffUserId: staff.id,
    action: "faq.added",
    entityType: "faq",
    entityId: row.id,
    after: parsed.data,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

const faqUpdateSchema = z.object({
  id: z.string().uuid(),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(1000),
})

export async function updateFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("content.edit")
  const parsed = faqUpdateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the fields — something didn't validate." }
  const { id, question, answer } = parsed.data

  const [before] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1)
  if (!before) return { error: "That question no longer exists." }

  await db.update(faqs).set({ question, answer }).where(eq(faqs.id, id))
  await recordActivity({
    staffUserId: staff.id,
    action: "faq.updated",
    entityType: "faq",
    entityId: id,
    before: { question: before.question, answer: before.answer },
    after: { question, answer },
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteFaq(id: string): Promise<void> {
  const staff = await requireStaffAction("content.edit")
  await db.delete(faqs).where(eq(faqs.id, id))
  await recordActivity({ staffUserId: staff.id, action: "faq.deleted", entityType: "faq", entityId: id })
  revalidatePath("/", "layout")
}

/* ────────────────────────────── Content blocks ────────────────────────────── */

const textBlockSchema = z.object({
  key: z.enum(["site.tagline", "site.description", "hours.note", "hours.walkins", "contact.responseTime", "payments.note"]),
  value: z.string().trim().min(1).max(1000),
})

/** The plain-string content blocks — a single text field each. */
export async function updateTextBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("content.edit")
  const parsed = textBlockSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Check the field — something didn't validate." }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const [before] = await db
    .select()
    .from(contentBlocks)
    .where(and(eq(contentBlocks.locationId, location.id), eq(contentBlocks.key, parsed.data.key)))
    .limit(1)

  if (before) {
    await db
      .update(contentBlocks)
      .set({ value: parsed.data.value, updatedByStaffId: staff.id, updatedAt: new Date() })
      .where(eq(contentBlocks.id, before.id))
  } else {
    await db
      .insert(contentBlocks)
      .values({ locationId: location.id, key: parsed.data.key, value: parsed.data.value, updatedByStaffId: staff.id })
  }
  await recordActivity({
    staffUserId: staff.id,
    action: "contentBlock.updated",
    entityType: "content_block",
    entityId: parsed.data.key,
    before: before?.value,
    after: parsed.data.value,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

const jsonBlockKeySchema = z.enum(["hygiene_protocol", "visit_steps", "shelf"])

/**
 * The structured content blocks (an array or an object) — edited as raw
 * JSON for now rather than a bespoke form per shape. A deliberate
 * simplification: real editing, just not the friendliest UI yet. See
 * CLAUDE.md P1.3 for the plan to replace this with per-field forms.
 */
export async function updateJsonBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const staff = await requireStaffAction("content.edit")
  const keyParsed = jsonBlockKeySchema.safeParse(formData.get("key"))
  if (!keyParsed.success) return { error: "Unknown content block." }
  const key = keyParsed.data

  let value: unknown
  try {
    value = JSON.parse(String(formData.get("value") ?? ""))
  } catch {
    return { error: "That isn't valid JSON — check for a missing comma or quote." }
  }
  if (key === "shelf") {
    if (typeof value !== "object" || value === null || !Array.isArray((value as { titles?: unknown }).titles)) {
      return { error: 'The shelf needs a "note" string and a "titles" array.' }
    }
  } else if (!Array.isArray(value)) {
    return { error: "That should be a JSON array." }
  }

  const location = await db.query.locations.findFirst({ where: eq(locations.active, true) })
  if (!location) return { error: "No active location found." }

  const [before] = await db
    .select()
    .from(contentBlocks)
    .where(and(eq(contentBlocks.locationId, location.id), eq(contentBlocks.key, key)))
    .limit(1)

  if (before) {
    await db
      .update(contentBlocks)
      .set({ value, updatedByStaffId: staff.id, updatedAt: new Date() })
      .where(eq(contentBlocks.id, before.id))
  } else {
    await db.insert(contentBlocks).values({ locationId: location.id, key, value, updatedByStaffId: staff.id })
  }
  await recordActivity({
    staffUserId: staff.id,
    action: "contentBlock.updated",
    entityType: "content_block",
    entityId: key,
    before: before?.value,
    after: value,
  })
  revalidatePath("/", "layout")
  return { ok: true }
}
