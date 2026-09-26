import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { PNG } from "pngjs"
import jsQR from "jsqr"
import { closeTestDatabase, resetTestDatabase, seedMinimalCatalog, testDb } from "../../db/test-helpers"
import { clients, notifications } from "../../db/schema"
import { createHold } from "../../availability/createHold"
import { recordWalkInPayment } from "../../availability/confirm"
import { decodeQrPayload } from "../../qr"
import { sendBookingMessage } from "../bookingMessages"
import { capturingDeps } from "./testAdapters"

process.env.QR_SECRET ??= "test-qr-secret"

const START = new Date("2027-01-10T08:00:00Z")
const END = new Date("2027-01-10T08:45:00Z")

async function confirmedBooking(contact: { phone: string | null; email: string | null }) {
  const { location, sessionType, client } = await seedMinimalCatalog()
  await testDb.update(clients).set(contact).where(eq(clients.id, client.id))
  const held = await createHold(testDb, {
    locationId: location.id,
    sessionTypeId: sessionType.id,
    clientId: client.id,
    startAt: START,
    endAt: END,
    priceAtBookingRwf: 15000,
    offPeak: false,
    holdMinutes: 10,
    source: "walk_in",
  })
  const booking = await recordWalkInPayment(
    testDb,
    held.id,
    { locationId: location.id, clientId: client.id, amountRwf: 15000, method: "momo" },
    "00000000-0000-4000-8000-000000000099",
  )
  return { booking, client }
}

function decodePng(buffer: Buffer): string | null {
  const png = PNG.sync.read(buffer)
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null
}

beforeEach(async () => {
  await resetTestDatabase()
})
afterAll(async () => {
  await closeTestDatabase()
})

describe("sendBookingMessage", () => {
  it("sends the confirmation by email and WhatsApp, each carrying a QR that scans back to this booking", async () => {
    const { booking } = await confirmedBooking({ phone: "+250780000001", email: "alex@example.com" })
    const { deps, emails, whatsapps } = capturingDeps()

    const rows = await sendBookingMessage(testDb, booking.id, "booking_confirmed", deps)
    expect(rows.map((r) => [r.channel, r.status])).toEqual([
      ["email", "sent"],
      ["whatsapp", "sent"],
    ])

    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe("alex@example.com")
    expect(emails[0].text).toContain("Paid 15,000 RWF")
    const attachment = emails[0].attachments?.[0]
    expect(attachment?.contentId).toBe("qr")
    expect(attachment?.contentType).toBe("image/png")

    // The image a client shows at the door must decode, with a real QR
    // reader, to a payload the check-in scanner accepts for this booking.
    const decoded = decodePng(attachment!.content)
    expect(decodeQrPayload(decoded!)).toEqual({ bookingId: booking.id, token: booking.qrToken })

    expect(whatsapps).toHaveLength(1)
    expect(whatsapps[0].to).toBe("+250780000001")
    expect(whatsapps[0].template).toBe("booking_confirmed")
    expect(decodePng(whatsapps[0].image!.content)).toBe(decoded)
  })

  it("logs every attempt, including the message body, for staff to see", async () => {
    const { booking, client } = await confirmedBooking({ phone: "+250780000001", email: null })
    const { deps } = capturingDeps()
    await sendBookingMessage(testDb, booking.id, "booking_confirmed", deps)

    const logged = await testDb.select().from(notifications).where(eq(notifications.bookingId, booking.id))
    expect(logged).toHaveLength(1)
    expect(logged[0].channel).toBe("whatsapp")
    expect(logged[0].clientId).toBe(client.id)
    expect(logged[0].providerMessageId).toBe("wa-1")
    expect(logged[0].body).toContain("Your session is booked.")
  })

  it("records a provider failure without throwing, and still sends on the other channel", async () => {
    const { booking } = await confirmedBooking({ phone: "+250780000001", email: "alex@example.com" })
    const { deps, whatsapps } = capturingDeps({ failEmail: true })

    const rows = await sendBookingMessage(testDb, booking.id, "booking_confirmed", deps)
    const email = rows.find((r) => r.channel === "email")
    expect(email?.status).toBe("failed")
    expect(email?.error).toBe("Email provider is down")
    expect(rows.find((r) => r.channel === "whatsapp")?.status).toBe("sent")
    expect(whatsapps).toHaveLength(1)
  })

  it("sends nothing and logs nothing for a walk-in with no phone or email", async () => {
    const { booking } = await confirmedBooking({ phone: null, email: null })
    const { deps, emails, whatsapps } = capturingDeps()

    expect(await sendBookingMessage(testDb, booking.id, "booking_confirmed", deps)).toEqual([])
    expect(emails).toHaveLength(0)
    expect(whatsapps).toHaveLength(0)
    expect(await testDb.select().from(notifications)).toHaveLength(0)
  })

  it("leaves the QR off a message that doesn't carry one", async () => {
    const { booking } = await confirmedBooking({ phone: "+250780000001", email: "alex@example.com" })
    const { deps, emails, whatsapps } = capturingDeps()
    await sendBookingMessage(testDb, booking.id, "reminder_24h", deps)
    expect(emails[0].attachments).toEqual([])
    expect(whatsapps[0].image).toBeUndefined()
  })
})
